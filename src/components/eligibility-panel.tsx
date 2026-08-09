"use client";

import { useState, useTransition } from "react";
import {
  RULE_KEYS,
  OPERATORS,
  VERDICT_LABELS,
  VERDICT_COLORS,
  type EligibilityResult,
} from "@/lib/eligibility";
import { DOCUMENT_CATEGORIES } from "@/lib/constants";
import ConfirmSubmitButton from "./confirm-submit-button";
import AIAssist from "./ai-assist";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Loader2,
  RefreshCw,
  Paperclip,
} from "lucide-react";

type Criterion = {
  id: string;
  ruleKey: string;
  label: string;
  operator: string;
  value: string | null;
  documentCategory: string | null;
  isMandatory: boolean;
  notes: string | null;
};

export default function EligibilityPanel({
  opportunityId,
  criteria,
  initialResult,
  addAction,
  deleteAction,
  evaluateAction,
  editable,
}: {
  opportunityId: string;
  criteria: Criterion[];
  initialResult: EligibilityResult;
  addAction: (opportunityId: string, formData: FormData) => Promise<void>;
  deleteAction: (id: string, opportunityId: string) => Promise<void>;
  evaluateAction: (opportunityId: string, projectId?: string | null) => Promise<EligibilityResult>;
  editable: boolean;
}) {
  const [result, setResult] = useState(initialResult);
  const [showForm, setShowForm] = useState(false);
  const [ruleKey, setRuleKey] = useState<string>("ORG_AGE_YEARS");
  const [pending, startTransition] = useTransition();

  const needsValue = !["ORG_HAS_VALID_LICENSE", "PROJECT_HAS_KPIS", "PROJECT_HAS_TIMELINE", "HAS_DOCUMENT", "MANUAL"].includes(ruleKey);
  const isDocRule = ruleKey === "HAS_DOCUMENT";

  function refresh() {
    startTransition(async () => {
      setResult(await evaluateAction(opportunityId));
    });
  }

  return (
    <div className="card space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-black text-brand-700">
          <ShieldCheck size={16} /> فحص الأهلية
        </p>
        <div className="flex items-center gap-2">
          {result.results.length > 0 && (
            <AIAssist
              label="اشرح لي النتيجة"
              action="explain_eligibility"
              getContext={() => {
                const fmt = (r: (typeof result.results)[number]) =>
                  `- ${r.label}: ${r.reason}${r.actionNeeded ? ` ← ${r.actionNeeded}` : ""}`;
                const mandatory = result.results.filter((r) => r.status !== "PASS" && r.isMandatory);
                const optional = result.results.filter((r) => r.status !== "PASS" && !r.isMandatory);
                return {
                  verdict: VERDICT_LABELS[result.verdict],
                  summary: result.summary,
                  mandatoryIssues: mandatory.map(fmt).join("\n"),
                  otherIssues: optional.map(fmt).join("\n"),
                };
              }}
              onApply={() => {}}
            />
          )}
          <button onClick={refresh} className="btn-secondary text-xs" disabled={pending}>
            {pending ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            إعادة الفحص
          </button>
        </div>
      </div>

      {/* الحكم العام مع سببه */}
      <div className={cn("rounded-xl border p-4", VERDICT_COLORS[result.verdict])}>
        <p className="text-lg font-black">{VERDICT_LABELS[result.verdict]}</p>
        <p className="mt-1 text-sm leading-relaxed">{result.summary}</p>
        {criteria.length > 0 && (
          <p className="mt-2 text-xs opacity-80">
            مستوفى: {result.passed} · غير مستوفى: {result.failed} · يحتاج تحققًا: {result.unknown}
          </p>
        )}
      </div>

      {/* تفصيل كل شرط وسبب نتيجته */}
      {result.results.length > 0 && (
        <ul className="space-y-2">
          {result.results.map((r) => {
            const Icon =
              r.status === "PASS" ? CheckCircle2 : r.status === "FAIL" ? XCircle : HelpCircle;
            const tone =
              r.status === "PASS"
                ? "text-emerald-600"
                : r.status === "FAIL"
                  ? "text-red-600"
                  : "text-amber-600";
            return (
              <li key={r.criterionId} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-start gap-2">
                  <Icon size={16} className={cn("mt-0.5 shrink-0", tone)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink">
                      {r.label}
                      {r.isMandatory && (
                        <span className="ms-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                          إلزامي
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{r.reason}</p>
                    {r.actionNeeded && (
                      <p className="mt-1 text-xs font-bold text-brand-600">← {r.actionNeeded}</p>
                    )}
                    {r.documentUrl && (
                      <a
                        href={r.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline"
                      >
                        <Paperclip size={12} /> عرض المستند: {r.documentTitle}
                      </a>
                    )}
                  </div>
                  {editable && (
                    <form action={deleteAction.bind(null, r.criterionId, opportunityId)}>
                      <ConfirmSubmitButton
                        confirmMessage="حذف هذا الشرط؟"
                        className="shrink-0 text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </ConfirmSubmitButton>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editable && (
        <div className="border-t border-slate-100 pt-4">
          {!showForm ? (
            <button onClick={() => setShowForm(true)} className="btn-secondary text-xs">
              <Plus size={14} /> إضافة شرط أهلية
            </button>
          ) : (
            <form
              action={async (fd) => {
                await addAction(opportunityId, fd);
                setShowForm(false);
                refresh();
              }}
              className="grid gap-2 sm:grid-cols-2"
            >
              <div className="sm:col-span-2">
                <label className="field-label text-xs">وصف الشرط *</label>
                <input className="input" name="label" required placeholder="مثال: ألا يقل عمر الجمعية عن 3 سنوات" />
              </div>
              <div>
                <label className="field-label text-xs">نوع الشرط *</label>
                <select
                  className="select"
                  name="ruleKey"
                  value={ruleKey}
                  onChange={(e) => setRuleKey(e.target.value)}
                >
                  {Object.entries(RULE_KEYS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              {needsValue && (
                <>
                  <div>
                    <label className="field-label text-xs">المقارنة</label>
                    <select className="select" name="operator" defaultValue="GTE">
                      {Object.entries(OPERATORS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="field-label text-xs">القيمة المرجعية</label>
                    <input className="input" name="value" placeholder="رقم، أو قيم مفصولة بفواصل" />
                  </div>
                </>
              )}
              {isDocRule && (
                <div className="sm:col-span-2">
                  <label className="field-label text-xs">تصنيف المستند المطلوب</label>
                  <select className="select" name="documentCategory" defaultValue={DOCUMENT_CATEGORIES[0]}>
                    {DOCUMENT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="sm:col-span-2">
                <label className="field-label text-xs">ملاحظات</label>
                <input className="input" name="notes" placeholder="تفاصيل إضافية للمراجع" />
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-ink sm:col-span-2">
                <input type="checkbox" name="isMandatory" defaultChecked className="h-4 w-4" />
                شرط إلزامي (عدم استيفائه يعني «غير مؤهل»)
              </label>
              <div className="flex gap-2 sm:col-span-2">
                <button type="submit" className="btn-primary text-xs">
                  حفظ الشرط
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-xs">
                  إلغاء
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
