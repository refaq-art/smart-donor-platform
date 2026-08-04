"use client";

import { useState } from "react";
import { Sparkles, Loader2, Check, X } from "lucide-react";
import { runAiAssist } from "@/app/actions/ai";
import type { AIActionType } from "@/lib/ai/types";
import { cn } from "@/lib/utils";

export default function AIAssist({
  label,
  action,
  getContext,
  onApply,
  mode = "replace",
  className,
}: {
  label: string;
  action: AIActionType;
  getContext: () => Record<string, string | undefined>;
  onApply: (text: string) => void;
  mode?: "replace" | "append";
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function handleRun() {
    setLoading(true);
    setOpen(true);
    setResult(null);
    setWarning(null);
    try {
      const res = await runAiAssist(action, getContext());
      setResult(res.text);
      setWarning(res.warning || null);
    } catch {
      setResult(null);
      setWarning("حدث خطأ أثناء الاتصال بمساعد الذكاء الاصطناعي. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("relative inline-block", className)}>
      <button
        type="button"
        onClick={handleRun}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gold-300 bg-gold-50 px-2.5 py-1.5 text-xs font-bold text-gold-700 hover:bg-gold-100 disabled:opacity-60"
      >
        {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
        {label}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-[min(90vw,420px)] rounded-xl border border-gold-200 bg-white p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs font-black text-gold-700">
              <Sparkles size={13} /> اقتراح المساعد الذكي
            </p>
            <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X size={15} />
            </button>
          </div>

          {loading && (
            <div className="flex items-center gap-2 py-4 text-sm text-slate-500">
              <Loader2 size={16} className="animate-spin" /> جارٍ التوليد...
            </div>
          )}

          {!loading && result && (
            <>
              <div className="max-h-56 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-2.5 text-xs leading-relaxed text-ink">
                {result}
              </div>
              {warning && <p className="mt-2 text-[11px] leading-relaxed text-amber-600">{warning}</p>}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onApply(result);
                    setOpen(false);
                  }}
                  className="btn-primary flex-1 py-1.5 text-xs"
                >
                  <Check size={13} /> {mode === "append" ? "إضافة إلى الحقل" : "استخدام هذا النص"}
                </button>
                <button type="button" onClick={handleRun} className="btn-secondary py-1.5 text-xs">
                  إعادة المحاولة
                </button>
              </div>
            </>
          )}

          {!loading && !result && warning && (
            <p className="text-xs leading-relaxed text-red-600">{warning}</p>
          )}
        </div>
      )}
    </div>
  );
}
