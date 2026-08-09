import { requireUser } from "@/lib/auth";
import { computeImpactReport } from "@/lib/impact-data";

export default async function OrgImpactPage() {
  const user = await requireUser(["ORG"]);
  const report = await computeImpactReport(user.organizationId!);

  if (!report.ready) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="card text-center text-slate-500">
          يظهر تقرير الأثر بعد اعتماد التقييم القبلي (والبعدي عند اكتمال البرنامج).
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">الأثر والمقارنة (قبل / بعد)</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="text-xs text-slate-400">القبلي</div>
          <div className="text-3xl font-bold text-navy-900">{report.preScore?.toFixed(2) ?? "—"}</div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-slate-400">البعدي</div>
          <div className="text-3xl font-bold text-navy-900">{report.postScore?.toFixed(2) ?? "—"}</div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-slate-400">التحسن</div>
          <div className={`text-3xl font-bold ${report.improvement != null && report.improvement >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {report.improvement != null ? `${report.improvement >= 0 ? "+" : ""}${report.improvement.toFixed(2)}` : "—"}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 font-bold text-slate-800">التحسن حسب المحور</h2>
        <div className="space-y-3">
          {report.perDomain.map((d) => (
            <div key={d.domainName}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">{d.domainName}</span>
                <span className="text-slate-500">
                  {d.preAvg?.toFixed(2) ?? "—"} ← {d.postAvg?.toFixed(2) ?? "—"}
                  {d.improvement != null && <span className={d.improvement >= 0 ? "text-emerald-600" : "text-red-600"}> ({d.improvement >= 0 ? "+" : ""}{d.improvement.toFixed(2)})</span>}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-navy-700" style={{ width: `${((d.postAvg ?? d.preAvg ?? 0) / 5) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="mb-2 font-bold text-slate-800">المهام المنفذة ({report.completedTasks.length})</h2>
          <ul className="space-y-1 text-sm text-slate-600">
            {report.completedTasks.map((t) => (
              <li key={t.id}>✓ {t.title}</li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2 className="mb-2 font-bold text-slate-800">المهام غير المكتملة ({report.incompleteTasks.length})</h2>
          <ul className="space-y-1 text-sm text-slate-600">
            {report.incompleteTasks.map((t) => (
              <li key={t.id}>• {t.title}</li>
            ))}
          </ul>
        </div>
      </div>

      {!report.postApproved && (
        <p className="text-center text-sm text-slate-400">القياس البعدي لم يُعتمد بعد — ستكتمل المقارنة فور اعتماده.</p>
      )}
    </div>
  );
}
