import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  ALL_DOMAINS,
  COMPLETION_STAGE_LEVELS,
  type SeedIndicatorCompletion,
  type SeedIndicatorMaturity,
} from "../src/lib/data/framework-seed-data";
import type { RoleValue } from "../src/lib/constants";

const prisma = new PrismaClient();

async function seedFramework() {
  let domainOrder = 0;
  for (const domain of ALL_DOMAINS) {
    domainOrder += 1;
    const domainRow = await prisma.assessmentDomain.upsert({
      where: { code: domain.code },
      update: { name: domain.name, description: domain.description, order: domainOrder },
      create: { code: domain.code, name: domain.name, description: domain.description, order: domainOrder },
    });

    let criterionOrder = 0;
    for (const criterion of domain.criteria) {
      criterionOrder += 1;
      const criterionRow = await prisma.assessmentCriterion.upsert({
        where: { code: criterion.code },
        update: { name: criterion.name, order: criterionOrder, domainId: domainRow.id },
        create: { code: criterion.code, name: criterion.name, order: criterionOrder, domainId: domainRow.id },
      });

      let indicatorOrder = 0;
      for (const indicator of criterion.indicators) {
        indicatorOrder += 1;
        const indicatorRow = await prisma.assessmentIndicator.upsert({
          where: { code: indicator.code },
          update: {
            name: indicator.name,
            type: indicator.type,
            order: indicatorOrder,
            criterionId: criterionRow.id,
            requiredEvidenceHint: indicator.type === "COMPLETION_STAGE" ? (indicator as SeedIndicatorCompletion).requiredEvidence : null,
          },
          create: {
            code: indicator.code,
            name: indicator.name,
            type: indicator.type,
            order: indicatorOrder,
            criterionId: criterionRow.id,
            requiredEvidenceHint: indicator.type === "COMPLETION_STAGE" ? (indicator as SeedIndicatorCompletion).requiredEvidence : null,
          },
        });

        const levels = indicator.type === "MATURITY_LEVEL" ? (indicator as SeedIndicatorMaturity).levels : COMPLETION_STAGE_LEVELS;
        for (const level of levels) {
          await prisma.indicatorLevel.upsert({
            where: { indicatorId_levelNumber: { indicatorId: indicatorRow.id, levelNumber: level.levelNumber } },
            update: { label: level.label, minScore: level.minScore, maxScore: level.maxScore, description: level.description },
            create: {
              indicatorId: indicatorRow.id,
              levelNumber: level.levelNumber,
              label: level.label,
              minScore: level.minScore,
              maxScore: level.maxScore,
              description: level.description,
            },
          });
        }

        if (indicator.type === "COMPLETION_STAGE") {
          const existing = await prisma.requiredEvidence.findFirst({ where: { indicatorId: indicatorRow.id } });
          if (!existing) {
            await prisma.requiredEvidence.create({
              data: {
                indicatorId: indicatorRow.id,
                name: (indicator as SeedIndicatorCompletion).requiredEvidence,
                isMandatory: true,
              },
            });
          }
        }
      }
    }
  }
}

async function seedDemoTenant() {
  const cycle = await prisma.programCycle.upsert({
    where: { id: "demo-cycle" },
    update: {},
    create: { id: "demo-cycle", name: "دفعة تمكين 2026 - حائل", durationDays: 100 },
  });

  const passwordHash = await bcrypt.hash("Mutawir@2026", 10);

  async function upsertUser(email: string, name: string, role: RoleValue, organizationId?: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return existing;
    return prisma.user.create({ data: { email, name, role, passwordHash, organizationId } });
  }

  const admin = await upsertUser("admin@mutawir.sa", "مدير النظام", "ADMIN");
  const councilUser = await upsertUser("council@mutawir.sa", "عضو مجلس الجمعيات", "COUNCIL");
  await prisma.councilMember.upsert({
    where: { userId: councilUser.id },
    update: {},
    create: { userId: councilUser.id, title: "عضو مجلس إشرافي" },
  });

  const consultantUser = await upsertUser("consultant@mutawir.sa", "المستشار سلمان العتيبي", "CONSULTANT");
  const consultant = await prisma.consultant.upsert({
    where: { userId: consultantUser.id },
    update: {},
    create: { userId: consultantUser.id, bio: "مستشار تطوير مؤسسي" },
  });

  const org = await prisma.organization.upsert({
    where: { id: "demo-org-hail" },
    update: {},
    create: {
      id: "demo-org-hail",
      name: "الجمعية النموذجية بحائل",
      licenseNumber: "1234",
      region: "حائل",
      foundingYear: 2019,
      executiveDirector: "أ. محمد الحربي",
      contactEmail: "info@demo-org.sa",
      contactPhone: "0500000000",
      fullTimeStaff: 6,
      partTimeStaff: 4,
      websiteUrl: "https://demo-org.sa",
      programCycleId: cycle.id,
      consultantId: consultant.id,
      contextAnswers: JSON.stringify({
        bylawGoals: "رعاية الأيتام وتنمية المجتمع المحلي في منطقة حائل",
        beneficiarySegments: "الأيتام والأسر المحتاجة",
        problemNeed: "ضعف الاستدامة المالية وعدم اكتمال الحوكمة المؤسسية",
        keyGoals2026: "استكمال الحوكمة، تنويع مصادر الدخل، توسيع البرامج التنموية",
      }),
    },
  });

  await upsertUser("org@mutawir.sa", "الجمعية النموذجية بحائل", "ORG", org.id);

  return { admin, consultantUser, councilUser, org };
}

async function main() {
  console.log("Seeding assessment framework...");
  await seedFramework();
  console.log("Seeding demo tenant...");
  await seedDemoTenant();
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
