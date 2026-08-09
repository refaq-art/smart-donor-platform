"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { CorrespondenceFormState } from "@/app/actions/correspondence";
import type { CorrespondenceType } from "@/lib/correspondence-templates";
import { CORRESPONDENCE_TYPES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Mail, Trash2, Loader2, Printer } from "lucide-react";

type Letter = {
  id: string;
  type: string;
  subject: string;
  createdAt: Date | string;
};

export default function CorrespondencePanel({
  applicationId,
  donorId,
  donorName,
  letters,
  canEdit,
  generateAction,
  deleteAction,
}: {
  applicationId: string;
  donorId: string | null;
  donorName: string | null;
  letters: Letter[];
  canEdit: boolean;
  generateAction: (applicationId: string, type: CorrespondenceType) => Promise<CorrespondenceFormState>;
  deleteAction: (id: string, applicationId: string) => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const generate = (type: CorrespondenceType) => {
    setError(null);
    startTransition(async () => {
      const res = await generateAction(applicationId, type);
      if (res?.error) setError(res.error);
    });
  };

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-black text-ink">
          <Mail size={16} /> المراسلات والخطابات الرسمية
        </p>
        {donorName && <span className="text-[11px] text-slate-400">الجهة المانحة: {donorName}</span>}
      </div>

      {letters.length === 0 ? (
        <p className="mb-3 text-xs text-slate-400">لا توجد خطابات مُولَّدة لهذا الطلب بعد.</p>
      ) : (
        <ul className="mb-4 space-y-2">
          {letters.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-xs">
              <div className="min-w-0">
                <span className="me-2 rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
                  {CORRESPONDENCE_TYPES[l.type as CorrespondenceType] || l.type}
                </span>
                <span className="font-bold text-ink">{l.subject}</span>
                <p className="mt-0.5 text-[10px] text-slate-400">{formatDate(l.createdAt)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Link href={`/letters/${l.id}/print`} target="_blank" className="flex items-center gap-1 font-bold text-brand-600 hover:underline">
                  <Printer size={13} /> عرض/طباعة
                </Link>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => deleteAction(l.id, applicationId)}
                    className="text-red-500 hover:text-red-700"
                    aria-label="حذف الخطاب"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canEdit && (
        <div className="border-t border-slate-100 pt-3">
          {!donorId ? (
            <p className="text-xs text-slate-400">اربط الطلب بجهة مانحة مسجلة (عبر فرصة التمويل) لتتمكن من توليد خطابات رسمية.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" disabled={pending} onClick={() => generate("THANK_YOU")} className="btn-secondary text-xs">
                {pending ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />} توليد خطاب شكر
              </button>
              <button type="button" disabled={pending} onClick={() => generate("ACCEPTANCE_ACK")} className="btn-secondary text-xs">
                {pending ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />} توليد خطاب تأكيد القبول
              </button>
              <button type="button" disabled={pending} onClick={() => generate("GENERAL")} className="btn-secondary text-xs">
                {pending ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />} خطاب عام
              </button>
            </div>
          )}
          {error && <p className="mt-2 text-xs font-bold text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
