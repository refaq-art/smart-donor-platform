"use client";

import { useState } from "react";
import { FIELD_LABELS, FIELD_KEYS, type Fields } from "@/lib/application-fields";
import { formatDate, cn } from "@/lib/utils";
import ConfirmSubmitButton from "./confirm-submit-button";
import { History, GitCompare, RotateCcw, X } from "lucide-react";

type Version = {
  id: string;
  snapshot: string;
  label: string | null;
  createdAt: Date | string;
  createdBy: { name: string } | null;
};

function parseSnapshot(s: string): Fields & { title: string } {
  try {
    return JSON.parse(s);
  } catch {
    return { title: "" } as Fields & { title: string };
  }
}

export default function ApplicationVersionsPanel({
  applicationId,
  versions,
  current,
  canRestore,
  restoreAction,
}: {
  applicationId: string;
  versions: Version[];
  current: Fields & { title: string };
  canRestore: boolean;
  restoreAction: (versionId: string, applicationId: string) => Promise<void>;
}) {
  const [compareId, setCompareId] = useState<string | null>(null);
  const compareVersion = versions.find((v) => v.id === compareId);
  const compareData = compareVersion ? parseSnapshot(compareVersion.snapshot) : null;

  return (
    <div className="card p-5">
      <p className="mb-3 flex items-center gap-2 text-sm font-black text-ink">
        <History size={16} /> سجل الإصدارات
      </p>

      {versions.length === 0 ? (
        <p className="text-xs text-slate-400">لا توجد إصدارات سابقة محفوظة بعد — تُحفظ لقطة تلقائيًا عند كل حفظ للطلب.</p>
      ) : (
        <ul className="space-y-2">
          {versions.map((v) => (
            <li key={v.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs">
              <div className="min-w-0">
                <p className="truncate font-bold text-ink">{v.label || "لقطة تلقائية"}</p>
                <p className="text-[11px] text-slate-400">
                  {formatDate(v.createdAt)} — {v.createdBy?.name || "النظام"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCompareId(v.id)}
                  className="flex items-center gap-1 text-brand-600 hover:underline"
                >
                  <GitCompare size={13} /> مقارنة
                </button>
                {canRestore && (
                  <form action={restoreAction.bind(null, v.id, applicationId)}>
                    <ConfirmSubmitButton
                      confirmMessage="استعادة هذا الإصدار ستستبدل المحتوى الحالي (سيُحفظ كنسخة قبل الاستعادة). متابعة؟"
                      className="flex items-center gap-1 text-amber-600 hover:underline"
                    >
                      <RotateCcw size={13} /> استعادة
                    </ConfirmSubmitButton>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {compareData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setCompareId(null)}>
          <div
            className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-black text-ink">مقارنة الإصدار المحفوظ بالمحتوى الحالي</p>
              <button onClick={() => setCompareId(null)} aria-label="إغلاق">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <DiffRow label="عنوان الطلب" oldVal={compareData.title} newVal={current.title} />
              {FIELD_KEYS.map((k) => (
                <DiffRow key={k} label={FIELD_LABELS[k]} oldVal={compareData[k] || ""} newVal={current[k] || ""} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DiffRow({ label, oldVal, newVal }: { label: string; oldVal: string; newVal: string }) {
  const changed = oldVal !== newVal;
  if (!changed && !oldVal) return null;
  return (
    <div className={cn("rounded-lg border p-3 text-xs", changed ? "border-amber-300 bg-amber-50/40" : "border-slate-100")}>
      <p className="mb-1 font-bold text-ink">
        {label} {changed && <span className="text-amber-600">(تغيّر)</span>}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <p className="mb-0.5 text-[10px] font-bold text-slate-400">الإصدار المحفوظ</p>
          <p className="whitespace-pre-wrap text-slate-600">{oldVal || "—"}</p>
        </div>
        <div>
          <p className="mb-0.5 text-[10px] font-bold text-slate-400">المحتوى الحالي</p>
          <p className={cn("whitespace-pre-wrap", changed ? "font-bold text-emerald-700" : "text-slate-600")}>
            {newVal || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
