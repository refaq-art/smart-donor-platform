"use client";

import { useState, useTransition } from "react";
import type { RunDiscoveryState } from "@/app/actions/donor-discovery";
import ConfirmSubmitButton from "./confirm-submit-button";
import { Sparkles, Loader2, Plus, X, ExternalLink, TrendingUp } from "lucide-react";

type Lead = {
  id: string;
  name: string;
  about: string | null;
  sector: string | null;
  city: string | null;
  sourceUrl: string | null;
  matchReason: string | null;
  trendNote: string | null;
  suggestedProject: { id: string; title: string } | null;
  discoveredAt: Date | string;
};

export default function DonorLeadsPanel({
  leads,
  editable,
  runAction,
  addAction,
  dismissAction,
}: {
  leads: Lead[];
  editable: boolean;
  runAction: () => Promise<RunDiscoveryState>;
  addAction: (leadId: string, formData: FormData) => Promise<void>;
  dismissAction: (leadId: string) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<RunDiscoveryState>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function handleRun() {
    startTransition(async () => {
      setResult(await runAction());
    });
  }

  if (leads.length === 0 && !editable) return null;

  return (
    <div className="card mb-6 space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-black text-brand-700">
          <Sparkles size={16} /> مانحون مقترَحون (اكتشاف آلي بالذكاء الاصطناعي)
        </p>
        {editable && (
          <button onClick={handleRun} className="btn-secondary text-xs" disabled={pending}>
            {pending ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            تشغيل البحث الآن
          </button>
        )}
      </div>

      {result?.error && <p className="text-xs font-bold text-red-600">{result.error}</p>}
      {result && !result.error && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
          تم فحص {result.searched} نتيجة، وإضافة {result.created} مقترح جديد.
        </p>
      )}

      {leads.length === 0 ? (
        <p className="text-xs text-slate-400">
          لا توجد مقترحات حاليًا. تعمل المنصة على البحث يوميًا تلقائيًا (أو شغّل البحث يدويًا الآن).
        </p>
      ) : (
        <ul className="space-y-3">
          {leads.map((lead) => (
            <li key={lead.id} className="rounded-xl border border-gold-200 bg-gold-50/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-black text-ink">{lead.name}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                    {lead.sector && <span className="rounded bg-white px-1.5 py-0.5 text-slate-600">{lead.sector}</span>}
                    {lead.city && <span className="rounded bg-white px-1.5 py-0.5 text-slate-600">{lead.city}</span>}
                  </div>
                </div>
                {lead.sourceUrl && (
                  <a
                    href={lead.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-brand-600 hover:underline"
                  >
                    <ExternalLink size={12} /> المصدر
                  </a>
                )}
              </div>

              {lead.about && <p className="mt-2 text-xs leading-relaxed text-slate-600">{lead.about}</p>}

              {lead.suggestedProject && (
                <p className="mt-2 text-xs font-bold text-brand-700">
                  مشروع مقترح للرفع له: {lead.suggestedProject.title}
                  {lead.matchReason && <span className="font-normal text-slate-500"> — {lead.matchReason}</span>}
                </p>
              )}

              {lead.trendNote && (
                <p className="mt-1.5 flex items-start gap-1 text-[11px] text-slate-500">
                  <TrendingUp size={12} className="mt-0.5 shrink-0" /> {lead.trendNote}
                </p>
              )}

              {editable && (
                <div className="mt-3 border-t border-gold-200 pt-3">
                  {expandedId === lead.id ? (
                    <form
                      action={async (fd) => {
                        await addAction(lead.id, fd);
                        setExpandedId(null);
                      }}
                      className="grid gap-2 sm:grid-cols-3"
                    >
                      <input className="input text-xs" name="contactName" placeholder="اسم مسؤول التواصل (اختياري)" />
                      <input className="input text-xs" name="phone" placeholder="الهاتف (اختياري)" />
                      <input className="input text-xs" name="email" placeholder="البريد الإلكتروني (اختياري)" />
                      <div className="flex gap-2 sm:col-span-3">
                        <button type="submit" className="btn-primary text-xs">
                          <Plus size={13} /> تأكيد الإضافة كمانح
                        </button>
                        <button type="button" onClick={() => setExpandedId(null)} className="btn-secondary text-xs">
                          إلغاء
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex gap-3">
                      <button onClick={() => setExpandedId(lead.id)} className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline">
                        <Plus size={13} /> إضافة كمانح
                      </button>
                      <form action={dismissAction.bind(null, lead.id)}>
                        <ConfirmSubmitButton
                          confirmMessage="تجاهل هذا المقترح؟"
                          className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-red-600"
                        >
                          <X size={13} /> تجاهل
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
