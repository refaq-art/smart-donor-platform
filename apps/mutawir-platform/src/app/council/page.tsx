import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getCouncilOverview } from "@/lib/council-data";

export default async function CouncilDashboardPage() {
  await requireUser(["COUNCIL"]);
  const data = await getCouncilOverview();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">اللوحة الإشرافية لمجلس الجمعيات</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="الجمعيات المشاركة" value={data.totalOrgs} />
        <Stat label="على المسار" value={data.onTrack} />
        <Stat label="متأخرة" value={data.late} danger />
        <Stat label="متأخرة جدًا" value={data.veryLate} danger />
        <Stat label="متوسط الإنجاز" value={`${data.avgCompletion}%`} />
        <Stat label="متوسط القبلي" value={data.avgPreScore?.toFixed(2) ?? "—"} />
        <Stat label="متوسط البعدي" value={data.avgPostScore?.toFixed(2) ?? "—"} />
        <Stat label="متوسط التحسن" value={data.avgImprovement != null ? `+${data.avgImprovement.toFixed(2)}` : "—"} />
        <Stat label="المهام المفتوحة" value={data.openTasks} />
        <Stat label="المهام المتأخرة" value={data.lateTasks} danger />
        <Stat label="عدد المستشارين" value={data.consultantCount} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-bold text-slate-800">أداء المستشارين</h2>
          <div className="space-y-2">
            {data.consultantPerformance.map((c) => (
              <div key={c.consultant.id} className="flex items-center justify-between text-sm">
                <span>{c.consultant.user.name} ({c.orgCount} جمعية)</span>
                <span className="font-bold text-navy-800">{c.avgCompletion}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="mb-3 font-bold text-slate-800">الجمعيات الأكثر تقدمًا</h2>
          <div className="space-y-1 text-sm">
            {data.mostAdvanced.map((s) => (
              <Link key={s.org.id} href={`/council/organizations/${s.org.id}`} className="flex items-center justify-between hover:underline">
                <span>{s.org.name}</span>
                <span className="font-bold text-emerald-700">{s.progress.actualPercent}%</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="card md:col-span-2">
          <h2 className="mb-3 font-bold text-slate-800">الجمعيات الأكثر تأخرًا</h2>
          <div className="space-y-1 text-sm">
            {data.mostDelayed.map((s) => (
              <Link key={s.org.id} href={`/council/organizations/${s.org.id}`} className="flex items-center justify-between hover:underline">
                <span>{s.org.name}</span>
                <span className="font-bold text-red-600">{s.progress.gapPercent}%</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, danger }: { label: string; value: string | number; danger?: boolean }) {
  return (
    <div className="card">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${danger ? "text-red-600" : "text-navy-900"}`}>{value}</div>
    </div>
  );
}
