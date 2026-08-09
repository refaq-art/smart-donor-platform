import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getConsultantOrgSummaries } from "@/lib/consultant-data";
import { PROGRESS_STATUS_COLORS, PROGRESS_STATUS_LABELS, ASSESSMENT_STATUS_LABELS, type AssessmentStatusValue } from "@/lib/constants";

export default async function ConsultantDashboardPage({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const user = await requireUser(["CONSULTANT"]);
  const { sort } = await searchParams;
  const summaries = await getConsultantOrgSummaries(user.consultant!.id);

  const sorted = [...summaries].sort((a, b) => {
    if (sort === "late") return b.lateTasks - a.lateTasks;
    if (sort === "lowest") return a.progress.actualPercent - b.progress.actualPercent;
    if (sort === "activity") return (a.daysSinceActivity ?? 999) - (b.daysSinceActivity ?? 999) === 0 ? 0 : (b.daysSinceActivity ?? 0) - (a.daysSinceActivity ?? 0);
    if (sort === "review") return b.awaitingReviewTasks - a.awaitingReviewTasks;
    return b.progress.currentDay - a.progress.currentDay;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy-900">جمعياتي ({summaries.length})</h1>
        <div className="flex flex-wrap gap-2 text-xs">
          <FilterLink sort="day" current={sort} label="اليوم من البرنامج" />
          <FilterLink sort="late" current={sort} label="الأكثر تأخرًا" />
          <FilterLink sort="lowest" current={sort} label="الأقل إنجازًا" />
          <FilterLink sort="review" current={sort} label="بانتظار المراجعة" />
          <FilterLink sort="activity" current={sort} label="آخر نشاط" />
        </div>
      </div>

      <div className="space-y-3">
        {sorted.map((s) => (
          <Link
            key={s.org.id}
            href={`/consultant/organizations/${s.org.id}`}
            className="card flex flex-wrap items-center justify-between gap-4 transition hover:shadow-md"
          >
            <div>
              <div className="font-bold text-navy-900">{s.org.name}</div>
              <div className="text-xs text-slate-500">
                {s.org.programStartDate ? `اليوم ${s.progress.currentDay} من ${s.progress.durationDays}` : "لم يبدأ البرنامج"}
                {s.preCycle && ` · القياس القبلي: ${ASSESSMENT_STATUS_LABELS[s.preCycle.status as AssessmentStatusValue]}`}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-center text-xs">
              <MiniStat label="القبلي" value={s.preCycle?.overallScore?.toFixed(2) ?? "—"} />
              <MiniStat label="إنجاز" value={`${s.progress.actualPercent}%`} />
              <MiniStat label="مهام" value={String(s.totalTasks)} />
              <MiniStat label="مكتملة" value={String(s.completedTasks)} />
              <MiniStat label="متأخرة" value={String(s.lateTasks)} danger={s.lateTasks > 0} />
              <MiniStat label="بانتظار مراجعة" value={String(s.awaitingReviewTasks)} danger={s.awaitingReviewTasks > 0} />
              {s.org.programStartDate && <span className={`badge ${PROGRESS_STATUS_COLORS[s.progress.status]}`}>{PROGRESS_STATUS_LABELS[s.progress.status]}</span>}
            </div>
          </Link>
        ))}
        {sorted.length === 0 && <div className="card text-center text-slate-500">لا توجد جمعيات مكلف بمتابعتها بعد.</div>}
      </div>
    </div>
  );
}

function FilterLink({ sort, current, label }: { sort: string; current?: string; label: string }) {
  const active = current === sort || (!current && sort === "day");
  return (
    <Link href={`/consultant?sort=${sort}`} className={`rounded-full border px-3 py-1 ${active ? "border-navy-700 bg-navy-700 text-white" : "border-slate-300 text-slate-600"}`}>
      {label}
    </Link>
  );
}

function MiniStat({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div>
      <div className="text-slate-400">{label}</div>
      <div className={`font-bold ${danger ? "text-red-600" : "text-navy-800"}`}>{value}</div>
    </div>
  );
}
