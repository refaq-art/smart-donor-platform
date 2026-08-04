"use client";

import { useMemo, useState } from "react";
import { downloadCsv } from "@/lib/csv";
import { formatDate, formatMoney } from "@/lib/utils";
import { STATUS_COLORS, OPPORTUNITY_STATUS_COLORS, PROJECT_STATUS_COLORS } from "@/lib/constants";
import { Badge, ProgressBar } from "./ui-bits";
import { Printer, Download } from "lucide-react";
import { computeCompletion } from "@/lib/completion";

type AnyRecord = Record<string, unknown>;

const REPORTS = [
  { id: "projects", label: "تقرير المشاريع" },
  { id: "opportunities", label: "تقرير فرص التمويل" },
  { id: "sent", label: "تقرير الطلبات المرسلة" },
  { id: "acceptance", label: "تقرير نسب القبول" },
  { id: "donors", label: "تقرير الجهات المانحة" },
  { id: "deadlines", label: "تقرير المواعيد النهائية" },
  { id: "budgets", label: "تقرير الميزانيات" },
  { id: "staff", label: "أداء الموظفين" },
] as const;

export default function ReportsView({
  projects,
  opportunities,
  applications,
  donors,
  users,
}: {
  projects: AnyRecord[];
  opportunities: AnyRecord[];
  applications: AnyRecord[];
  donors: AnyRecord[];
  users: AnyRecord[];
}) {
  const [active, setActive] = useState<(typeof REPORTS)[number]["id"]>("projects");

  const sentApplications = useMemo(
    () => applications.filter((a) => a.status !== "مسودة"),
    [applications]
  );
  const decided = useMemo(
    () => applications.filter((a) => a.status === "مقبول" || a.status === "مرفوض"),
    [applications]
  );
  const acceptedCount = decided.filter((a) => a.status === "مقبول").length;
  const rejectedCount = decided.filter((a) => a.status === "مرفوض").length;
  const acceptanceRate = decided.length ? Math.round((acceptedCount / decided.length) * 100) : 0;

  const upcomingSorted = useMemo(
    () =>
      [...opportunities]
        .filter((o) => o.deadline)
        .sort((a, b) => new Date(a.deadline as string).getTime() - new Date(b.deadline as string).getTime()),
    [opportunities]
  );

  function exportActive() {
    if (active === "projects") {
      downloadCsv(
        "projects-report.csv",
        ["اسم المشروع", "الفئة", "الحالة", "الميزانية", "تاريخ الإنشاء"],
        projects.map((p) => [String(p.title), String(p.category || ""), String(p.status), Number(p.budgetTotal || 0), formatDate(p.createdAt as string)])
      );
    } else if (active === "opportunities") {
      downloadCsv(
        "funding-opportunities-report.csv",
        ["العنوان", "الجهة", "المجال", "القيمة المتوقعة", "الموعد النهائي", "الحالة"],
        opportunities.map((o) => [
          String(o.title),
          String((o.donor as AnyRecord)?.name || o.donorNameFreeText || ""),
          String(o.field || ""),
          Number(o.expectedAmount || 0),
          formatDate(o.deadline as string),
          String(o.status),
        ])
      );
    } else if (active === "sent") {
      downloadCsv(
        "submitted-applications-report.csv",
        ["عنوان الطلب", "المشروع", "الجهة المانحة", "الحالة", "آخر تحديث"],
        sentApplications.map((a) => [
          String(a.title),
          String((a.project as AnyRecord)?.title || ""),
          String(((a.opportunity as AnyRecord)?.donor as AnyRecord)?.name || (a.opportunity as AnyRecord)?.donorNameFreeText || ""),
          String(a.status),
          formatDate(a.updatedAt as string),
        ])
      );
    } else if (active === "acceptance") {
      downloadCsv(
        "acceptance-rate-report.csv",
        ["المؤشر", "القيمة"],
        [
          ["الطلبات المقبولة", acceptedCount],
          ["الطلبات المرفوضة", rejectedCount],
          ["نسبة القبول", `${acceptanceRate}%`],
        ]
      );
    } else if (active === "donors") {
      downloadCsv(
        "donors-report.csv",
        ["اسم الجهة", "النوع", "مجالات الدعم", "حالة العلاقة", "عدد الفرص"],
        donors.map((d) => [String(d.name), String(d.type || ""), String(d.supportFields || ""), String(d.relationshipStatus), Number((d._count as AnyRecord)?.opportunities || 0)])
      );
    } else if (active === "deadlines") {
      downloadCsv(
        "deadlines-report.csv",
        ["الفرصة", "الجهة", "الموعد النهائي", "الحالة"],
        upcomingSorted.map((o) => [String(o.title), String((o.donor as AnyRecord)?.name || o.donorNameFreeText || ""), formatDate(o.deadline as string), String(o.status)])
      );
    } else if (active === "budgets") {
      downloadCsv(
        "budgets-report.csv",
        ["المشروع", "إجمالي الميزانية"],
        projects.map((p) => [String(p.title), Number(p.budgetTotal || 0)])
      );
    } else if (active === "staff") {
      downloadCsv(
        "staff-performance-report.csv",
        ["الاسم", "الدور", "طلبات أنشأها", "طلبات مسندة إليه"],
        users.map((u) => [String(u.name), String(u.role), Number((u._count as AnyRecord)?.createdApplications || 0), Number((u._count as AnyRecord)?.assignedApplications || 0)])
      );
    }
  }

  return (
    <div>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {REPORTS.map((r) => (
            <button
              key={r.id}
              onClick={() => setActive(r.id)}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                active === r.id ? "bg-brand-500 text-white" : "bg-white text-slate-500 hover:bg-brand-50"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={exportActive} className="btn-secondary text-xs">
            <Download size={14} /> تصدير CSV
          </button>
          <button onClick={() => window.print()} className="btn-secondary text-xs">
            <Printer size={14} /> طباعة
          </button>
        </div>
      </div>

      <div className="card overflow-auto p-5">
        <h2 className="mb-4 text-lg font-black text-ink">{REPORTS.find((r) => r.id === active)?.label}</h2>

        {active === "projects" && (
          <Table
            headers={["اسم المشروع", "الفئة", "الحالة", "الميزانية", "طلبات", "تاريخ الإنشاء"]}
            rows={projects.map((p) => [
              String(p.title),
              String(p.category || "—"),
              <Badge key="s" label={String(p.status)} colorClass={PROJECT_STATUS_COLORS[p.status as string]} />,
              formatMoney(p.budgetTotal as number),
              Number((p._count as AnyRecord)?.applications || 0),
              formatDate(p.createdAt as string),
            ])}
          />
        )}

        {active === "opportunities" && (
          <Table
            headers={["العنوان", "الجهة", "المجال", "القيمة المتوقعة", "الموعد النهائي", "الحالة"]}
            rows={opportunities.map((o) => [
              String(o.title),
              String((o.donor as AnyRecord)?.name || o.donorNameFreeText || "—"),
              String(o.field || "—"),
              formatMoney(o.expectedAmount as number),
              formatDate(o.deadline as string),
              <Badge key="s" label={String(o.status)} colorClass={OPPORTUNITY_STATUS_COLORS[o.status as string]} />,
            ])}
          />
        )}

        {active === "sent" && (
          <Table
            headers={["عنوان الطلب", "المشروع", "الجهة المانحة", "الحالة", "نسبة الاكتمال", "آخر تحديث"]}
            rows={sentApplications.map((a) => [
              String(a.title),
              String((a.project as AnyRecord)?.title || "—"),
              String(((a.opportunity as AnyRecord)?.donor as AnyRecord)?.name || (a.opportunity as AnyRecord)?.donorNameFreeText || "—"),
              <Badge key="s" label={String(a.status)} colorClass={STATUS_COLORS[a.status as string]} />,
              `${computeCompletion(a as never).percent}%`,
              formatDate(a.updatedAt as string),
            ])}
          />
        )}

        {active === "acceptance" && (
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard label="طلبات مقبولة" value={acceptedCount} />
            <MetricCard label="طلبات مرفوضة" value={rejectedCount} />
            <MetricCard label="نسبة القبول" value={`${acceptanceRate}%`} />
            <div className="sm:col-span-3">
              <ProgressBar percent={acceptanceRate} />
            </div>
          </div>
        )}

        {active === "donors" && (
          <Table
            headers={["اسم الجهة", "النوع", "مجالات الدعم", "حالة العلاقة", "عدد الفرص"]}
            rows={donors.map((d) => [
              String(d.name),
              String(d.type || "—"),
              String(d.supportFields || "—"),
              String(d.relationshipStatus),
              Number((d._count as AnyRecord)?.opportunities || 0),
            ])}
          />
        )}

        {active === "deadlines" && (
          <Table
            headers={["الفرصة", "الجهة", "الموعد النهائي", "الحالة"]}
            rows={upcomingSorted.map((o) => [
              String(o.title),
              String((o.donor as AnyRecord)?.name || o.donorNameFreeText || "—"),
              formatDate(o.deadline as string),
              <Badge key="s" label={String(o.status)} colorClass={OPPORTUNITY_STATUS_COLORS[o.status as string]} />,
            ])}
          />
        )}

        {active === "budgets" && (
          <Table
            headers={["المشروع", "إجمالي الميزانية"]}
            rows={projects.map((p) => [String(p.title), formatMoney(p.budgetTotal as number)])}
          />
        )}

        {active === "staff" && (
          <>
            {users.length <= 1 ? (
              <p className="text-sm text-slate-400">هذا التقرير يظهر بشكل مفيد عند وجود أكثر من مستخدم واحد في المنصة.</p>
            ) : null}
            <Table
              headers={["الاسم", "الدور", "طلبات أنشأها", "طلبات مسندة إليه"]}
              rows={users.map((u) => [
                String(u.name),
                String(u.role),
                Number((u._count as AnyRecord)?.createdApplications || 0),
                Number((u._count as AnyRecord)?.assignedApplications || 0),
              ])}
            />
          </>
        )}
      </div>
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  if (rows.length === 0) return <p className="text-sm text-slate-400">لا توجد بيانات لعرضها.</p>;
  return (
    <table className="w-full min-w-[600px] text-sm">
      <thead className="bg-slate-50 text-xs text-slate-500">
        <tr>
          {headers.map((h) => (
            <th key={h} className="p-2.5 text-right">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-t border-slate-100">
            {row.map((cell, j) => (
              <td key={j} className="p-2.5">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4 text-center">
      <p className="text-3xl font-black text-brand-600">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{label}</p>
    </div>
  );
}
