// Generates the seed data as plain SQL INSERT statements instead of going
// through PrismaClient. This sandbox has no outbound raw TCP access to the
// production Postgres instance, so the schema/seed had to be applied via the
// Supabase management API's SQL execution tools instead of `prisma db push`
// / a live Prisma seed run. This script's output is what got pasted into
// that tool. Kept for reproducibility — rerun and re-apply if the framework
// data changes.
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import {
  ALL_DOMAINS,
  COMPLETION_STAGE_LEVELS,
  type SeedIndicatorCompletion,
  type SeedIndicatorMaturity,
} from "../src/lib/data/framework-seed-data";

function esc(s: string) {
  return s.replace(/'/g, "''");
}

async function main() {
  const lines: string[] = [];
  const now = "now()";

  let domainOrder = 0;
  for (const domain of ALL_DOMAINS) {
    domainOrder += 1;
    const domainId = randomUUID();
    lines.push(
      `INSERT INTO "AssessmentDomain" (id, code, name, description, "order", "isActive", "createdAt", "updatedAt") VALUES ('${domainId}', '${esc(domain.code)}', '${esc(domain.name)}', '${esc(domain.description)}', ${domainOrder}, true, ${now}, ${now});`
    );

    let criterionOrder = 0;
    for (const criterion of domain.criteria) {
      criterionOrder += 1;
      const criterionId = randomUUID();
      lines.push(
        `INSERT INTO "AssessmentCriterion" (id, "domainId", code, name, "order", "isActive", "createdAt", "updatedAt") VALUES ('${criterionId}', '${domainId}', '${esc(criterion.code)}', '${esc(criterion.name)}', ${criterionOrder}, true, ${now}, ${now});`
      );

      let indicatorOrder = 0;
      for (const indicator of criterion.indicators) {
        indicatorOrder += 1;
        const indicatorId = randomUUID();
        const hint = indicator.type === "COMPLETION_STAGE" ? esc((indicator as SeedIndicatorCompletion).requiredEvidence) : null;
        lines.push(
          `INSERT INTO "AssessmentIndicator" (id, "criterionId", code, name, type, weight, "order", "requiredEvidenceHint", "isActive", "createdAt", "updatedAt") VALUES ('${indicatorId}', '${criterionId}', '${esc(indicator.code)}', '${esc(indicator.name)}', '${indicator.type}', 1, ${indicatorOrder}, ${hint ? `'${hint}'` : "NULL"}, true, ${now}, ${now});`
        );

        const levels = indicator.type === "MATURITY_LEVEL" ? (indicator as SeedIndicatorMaturity).levels : COMPLETION_STAGE_LEVELS;
        for (const level of levels) {
          lines.push(
            `INSERT INTO "IndicatorLevel" (id, "indicatorId", "levelNumber", label, "minScore", "maxScore", description) VALUES ('${randomUUID()}', '${indicatorId}', ${level.levelNumber}, '${esc(level.label)}', ${level.minScore}, ${level.maxScore}, '${esc(level.description)}');`
          );
        }

        if (indicator.type === "COMPLETION_STAGE") {
          lines.push(
            `INSERT INTO "RequiredEvidence" (id, "indicatorId", name, "isMandatory") VALUES ('${randomUUID()}', '${indicatorId}', '${esc((indicator as SeedIndicatorCompletion).requiredEvidence)}', true);`
          );
        }
      }
    }
  }

  // ---- demo tenant ----
  const passwordHash = esc(await bcrypt.hash("Mutawir@2026", 10));
  const cycleId = randomUUID();
  const adminId = randomUUID();
  const councilUserId = randomUUID();
  const consultantUserId = randomUUID();
  const consultantId = randomUUID();
  const orgId = randomUUID();
  const orgUserId = randomUUID();

  lines.push(`INSERT INTO "ProgramCycle" (id, name, "durationDays", "isActive", "createdAt") VALUES ('${cycleId}', 'دفعة تمكين 2026 - حائل', 100, true, ${now});`);
  lines.push(`INSERT INTO "User" (id, email, username, "passwordHash", name, role, "isActive", "createdAt") VALUES ('${adminId}', 'admin@mutawir.sa', 'admin', '${passwordHash}', 'مدير النظام', 'ADMIN', true, ${now});`);
  lines.push(`INSERT INTO "User" (id, email, username, "passwordHash", name, role, "isActive", "createdAt") VALUES ('${councilUserId}', 'council@mutawir.sa', 'council', '${passwordHash}', 'عضو مجلس الجمعيات', 'COUNCIL', true, ${now});`);
  lines.push(`INSERT INTO "CouncilMember" (id, "userId", title, "createdAt") VALUES ('${randomUUID()}', '${councilUserId}', 'عضو مجلس إشرافي', ${now});`);
  lines.push(`INSERT INTO "User" (id, email, username, "passwordHash", name, role, "isActive", "createdAt") VALUES ('${consultantUserId}', 'consultant@mutawir.sa', 'consultant', '${passwordHash}', 'المستشار سلمان العتيبي', 'CONSULTANT', true, ${now});`);
  lines.push(`INSERT INTO "Consultant" (id, "userId", bio, "createdAt") VALUES ('${consultantId}', '${consultantUserId}', 'مستشار تطوير مؤسسي', ${now});`);

  const contextAnswers = JSON.stringify({
    bylawGoals: "رعاية الأيتام وتنمية المجتمع المحلي في منطقة حائل",
    beneficiarySegments: "الأيتام والأسر المحتاجة",
    problemNeed: "ضعف الاستدامة المالية وعدم اكتمال الحوكمة المؤسسية",
    keyGoals2026: "استكمال الحوكمة، تنويع مصادر الدخل، توسيع البرامج التنموية",
  });
  lines.push(
    `INSERT INTO "Organization" (id, name, "licenseNumber", region, "foundingYear", "executiveDirector", "contactEmail", "contactPhone", "fullTimeStaff", "partTimeStaff", "websiteUrl", "contextAnswers", "programCycleId", "consultantId", status, "createdAt", "updatedAt") VALUES ('${orgId}', 'الجمعية النموذجية بحائل', '1234', 'حائل', 2019, 'أ. محمد الحربي', 'info@demo-org.sa', '0500000000', 6, 4, 'https://demo-org.sa', '${esc(contextAnswers)}', '${cycleId}', '${consultantId}', 'ACTIVE', ${now}, ${now});`
  );
  lines.push(`INSERT INTO "User" (id, email, username, "passwordHash", name, role, "organizationId", "isActive", "createdAt") VALUES ('${orgUserId}', 'org@mutawir.sa', 'org', '${passwordHash}', 'الجمعية النموذجية بحائل', 'ORG', '${orgId}', true, ${now});`);

  console.log(lines.join("\n"));
}

main();
