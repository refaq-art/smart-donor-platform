import { prisma } from "./prisma";
import { getSearchProvider } from "./search";
import { getAIProvider } from "./ai";

const MAX_SEARCH_RESULTS = 5;

type ExtractedLead = {
  isDonorRelevant: boolean;
  donorName: string | null;
  about: string | null;
  sector: string | null;
  city: string | null;
  matchProjectId: string | null;
  matchReason: string | null;
  trendNote: string | null;
};

function parseExtractedLead(text: string): ExtractedLead | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const data = JSON.parse(match[0]);
    if (typeof data !== "object" || data === null) return null;
    return {
      isDonorRelevant: Boolean(data.isDonorRelevant),
      donorName: typeof data.donorName === "string" ? data.donorName.trim() || null : null,
      about: typeof data.about === "string" ? data.about.trim() || null : null,
      sector: typeof data.sector === "string" ? data.sector.trim() || null : null,
      city: typeof data.city === "string" ? data.city.trim() || null : null,
      matchProjectId: typeof data.matchProjectId === "string" ? data.matchProjectId.trim() || null : null,
      matchReason: typeof data.matchReason === "string" ? data.matchReason.trim() || null : null,
      trendNote: typeof data.trendNote === "string" ? data.trendNote.trim() || null : null,
    };
  } catch {
    return null;
  }
}

export type DiscoveryRunResult = {
  organizationId: string;
  searched: number;
  created: number;
  skipped: number;
  error?: string;
};

/** يبحث عن مانحين محتملين جدد لجمعية واحدة، ويحفظ النتائج ذات الصلة كمقترحات (DonorLead) بانتظار مراجعة بشرية. */
export async function runDonorDiscoveryForOrg(organizationId: string): Promise<DiscoveryRunResult> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true, sector: true, geographicScope: true },
  });
  if (!org) return { organizationId, searched: 0, created: 0, skipped: 0, error: "الجمعية غير موجودة" };

  const [activeProjects, existingDonorNames, existingLeadNames] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId, status: "نشط" },
      select: { id: true, title: true, category: true, generalObjective: true },
      take: 15,
    }),
    prisma.donor.findMany({ where: { organizationId }, select: { name: true } }),
    prisma.donorLead.findMany({
      where: { organizationId, status: "PENDING" },
      select: { name: true },
    }),
  ]);

  const knownNames = new Set(
    [...existingDonorNames, ...existingLeadNames].map((d) => d.name.trim().toLowerCase())
  );

  const projectsList = activeProjects
    .map((p) => `${p.id}: ${p.title} (${p.category || "غير محدد"}) - ${p.generalObjective || ""}`)
    .join("\n");

  const query = [
    "جهات مانحة جديدة تمويل جمعيات خيرية",
    org.sector,
    org.geographicScope,
    new Date().getFullYear().toString(),
  ]
    .filter(Boolean)
    .join(" ");

  const search = getSearchProvider();
  const ai = getAIProvider();

  let results;
  try {
    results = await search.search(query, MAX_SEARCH_RESULTS);
  } catch {
    return { organizationId, searched: 0, created: 0, skipped: 0, error: "تعذّر الاتصال بخدمة البحث" };
  }

  let created = 0;
  let skipped = 0;

  for (const result of results) {
    const aiResult = await ai.run({
      action: "extract_donor_lead",
      context: {
        title: result.title,
        url: result.url,
        snippet: result.snippet,
        orgSector: org.sector || undefined,
        orgGeographicScope: org.geographicScope || undefined,
        projectsList: projectsList || undefined,
      },
    });

    const lead = parseExtractedLead(aiResult.text);
    if (!lead || !lead.isDonorRelevant || !lead.donorName) {
      skipped++;
      continue;
    }
    if (knownNames.has(lead.donorName.trim().toLowerCase())) {
      skipped++;
      continue;
    }

    const matchedProject = lead.matchProjectId
      ? activeProjects.find((p) => p.id === lead.matchProjectId)
      : undefined;

    await prisma.donorLead.create({
      data: {
        organizationId,
        name: lead.donorName,
        about: lead.about,
        sector: lead.sector,
        city: lead.city,
        sourceUrl: result.url,
        sourceSnippet: result.snippet.slice(0, 500),
        suggestedProjectId: matchedProject?.id || null,
        matchReason: matchedProject ? lead.matchReason : null,
        trendNote: lead.trendNote,
      },
    });
    knownNames.add(lead.donorName.trim().toLowerCase());
    created++;
  }

  if (created > 0) {
    await prisma.activityLog.create({
      data: {
        organizationId,
        action: "donor_discovery_run",
        entityType: "DonorLead",
        entityId: organizationId,
        details: `تم اكتشاف ${created} مانحًا محتملًا جديدًا من ${results.length} نتيجة بحث`,
      },
    });
  }

  return { organizationId, searched: results.length, created, skipped };
}

/** يُشغَّل عبر مهمة Vercel Cron اليومية — يمرّ على كل الجمعيات النشطة (بحث منفصل لكل جمعية). */
export async function runDonorDiscoveryForAllOrgs(): Promise<DiscoveryRunResult[]> {
  const orgs = await prisma.organization.findMany({ select: { id: true } });
  const results: DiscoveryRunResult[] = [];
  for (const org of orgs) {
    try {
      results.push(await runDonorDiscoveryForOrg(org.id));
    } catch (err) {
      results.push({
        organizationId: org.id,
        searched: 0,
        created: 0,
        skipped: 0,
        error: err instanceof Error ? err.message : "خطأ غير معروف",
      });
    }
  }
  return results;
}
