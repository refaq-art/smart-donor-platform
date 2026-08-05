"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useMemo, useState } from "react";
import type { ApplicationContentState } from "@/app/actions/applications";
import AIAssist from "./ai-assist";
import { computeCompletion } from "@/lib/completion";
import { ProgressBar } from "./ui-bits";
import { Loader2, Save, CheckCircle2 } from "lucide-react";
import { TABS, FIELD_LABELS, FIELD_PLACEHOLDERS, type Fields } from "@/lib/application-fields";

export type { Fields };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
      حفظ التغييرات
    </button>
  );
}

export default function ApplicationEditor({
  applicationId,
  title: initialTitle,
  initialFields,
  action,
  projectContext,
  opportunities,
  users,
  opportunityId: initialOpportunityId,
  assignedToId: initialAssignedToId,
  readOnly,
}: {
  applicationId: string;
  title: string;
  initialFields: Fields;
  action: (prev: ApplicationContentState, formData: FormData) => Promise<ApplicationContentState>;
  projectContext: { title: string; problemStatement?: string | null; generalObjective?: string | null; category?: string | null };
  opportunities: { id: string; title: string; field: string | null; requirements: string | null }[];
  users: { id: string; name: string }[];
  opportunityId?: string | null;
  assignedToId?: string | null;
  readOnly: boolean;
}) {
  const [state, formAction] = useFormState<ApplicationContentState, FormData>(action, null);
  const [title, setTitle] = useState(initialTitle);
  const [fields, setFields] = useState<Fields>(initialFields);
  const [opportunityId, setOpportunityId] = useState(initialOpportunityId || "");
  const [assignedToId, setAssignedToId] = useState(initialAssignedToId || "");
  const [activeTab, setActiveTab] = useState(TABS[0].id);

  const set = (key: keyof Fields) => (v: string) => setFields((f) => ({ ...f, [key]: v }));

  const completion = useMemo(() => computeCompletion({ ...fields, opportunityId }), [fields, opportunityId]);
  const selectedOpportunity = opportunities.find((o) => o.id === opportunityId);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="opportunityId" value={opportunityId} />
          <input type="hidden" name="assignedToId" value={assignedToId} />

          <div className="card p-5">
            <label className="field-label">عنوان الطلب *</label>
            <input
              className="input"
              name="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={readOnly}
            />
          </div>

          <div className="card overflow-hidden p-0">
            <div className="flex flex-wrap gap-1 border-b border-slate-100 bg-slate-50 p-2">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                    activeTab === t.id ? "bg-brand-500 text-white" : "text-slate-500 hover:bg-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {TABS.map((tab) => (
              // كل الأقسام تبقى مُركَّبة في الـ DOM دائمًا (وليس فقط القسم النشط) حتى تُرسَل
              // قيمها جميعًا ضمن الفورم عند الحفظ، بغض النظر عن التبويب الظاهر حاليًا.
              <div key={tab.id} hidden={activeTab !== tab.id} className="space-y-5 p-5">
                {tab.fields.map((key) => (
                  <FieldBlock
                    key={key}
                    fieldKey={key}
                    value={fields[key]}
                    onChange={set(key)}
                    fields={fields}
                    projectContext={projectContext}
                    selectedOpportunity={selectedOpportunity}
                    readOnly={readOnly}
                  />
                ))}
              </div>
            ))}
          </div>

          {!readOnly && (
            <>
              {state?.error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{state.error}</p>
              )}
              {state?.savedAt && (
                <p className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                  <CheckCircle2 size={16} /> تم حفظ التغييرات بنجاح
                </p>
              )}
              <div className="flex justify-end">
                <SaveButton />
              </div>
            </>
          )}
        </form>
      </div>

      <div className="space-y-6">
        <div className="card p-5">
          <p className="mb-2 text-sm font-black text-ink">نسبة اكتمال الطلب</p>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-2xl font-black text-brand-600">{completion.percent}%</span>
            <span className="text-xs text-slate-400">
              {completion.filled} من {completion.total} عنصرًا
            </span>
          </div>
          <ProgressBar percent={completion.percent} />
          {completion.missing.length > 0 && (
            <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
              <p className="mb-1 font-bold">عناصر ناقصة:</p>
              <ul className="list-inside list-disc space-y-0.5">
                {completion.missing.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          )}
          <AIAssist
            label="تقييم جاهزية الطلب"
            action="readiness_assessment"
            getContext={() => ({
              completionPercent: String(completion.percent),
              missingSections: completion.missing.join("|"),
            })}
            onApply={() => {}}
            className="mt-3 block w-full"
          />
        </div>

        {!readOnly && (
          <div className="card space-y-3 p-5">
            <label className="field-label">ربط بفرصة تمويل</label>
            <select className="select" value={opportunityId} onChange={(e) => setOpportunityId(e.target.value)}>
              <option value="">— بدون ربط —</option>
              {opportunities.map((o) => (
                <option key={o.id} value={o.id}>{o.title}</option>
              ))}
            </select>
            <label className="field-label">إسناد إلى</label>
            <select className="select" value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)}>
              <option value="">— غير مسندة —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

function FieldBlock({
  fieldKey,
  value,
  onChange,
  fields,
  projectContext,
  selectedOpportunity,
  readOnly,
}: {
  fieldKey: keyof Fields;
  value: string;
  onChange: (v: string) => void;
  fields: Fields;
  projectContext: { title: string; problemStatement?: string | null; generalObjective?: string | null; category?: string | null };
  selectedOpportunity?: { title: string; field: string | null; requirements: string | null };
  readOnly: boolean;
}) {
  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <label className="field-label !mb-0">{FIELD_LABELS[fieldKey]}</label>
        {!readOnly && <AiForField fieldKey={fieldKey} fields={fields} projectContext={projectContext} selectedOpportunity={selectedOpportunity} onChange={onChange} value={value} />}
      </div>
      <textarea
        className="textarea"
        name={fieldKey}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={FIELD_PLACEHOLDERS[fieldKey]}
        disabled={readOnly}
      />
    </div>
  );
}

function AiForField({
  fieldKey,
  fields,
  projectContext,
  selectedOpportunity,
  onChange,
  value,
}: {
  fieldKey: keyof Fields;
  fields: Fields;
  projectContext: { title: string; problemStatement?: string | null; generalObjective?: string | null; category?: string | null };
  selectedOpportunity?: { title: string; field: string | null; requirements: string | null };
  onChange: (v: string) => void;
  value: string;
}) {
  switch (fieldKey) {
    case "executiveSummary":
      return (
        <AIAssist
          label="صياغة الملخص التنفيذي"
          action="draft_executive_summary"
          getContext={() => ({
            title: projectContext.title,
            problemStatement: fields.problemStatement || projectContext.problemStatement || "",
            generalObjective: projectContext.generalObjective || "",
            beneficiaries: fields.beneficiaries,
          })}
          onApply={onChange}
        />
      );
    case "problemStatement":
      return (
        <AIAssist
          label="تحسين الصياغة"
          action="improve_problem_statement"
          getContext={() => ({ text: value || projectContext.problemStatement || "" })}
          onApply={onChange}
        />
      );
    case "objectives":
      return (
        <AIAssist
          label="اقتراح أهداف"
          action="suggest_objectives"
          getContext={() => ({ problemStatement: fields.problemStatement, generalObjective: projectContext.generalObjective || "" })}
          onApply={(t) => onChange(value ? `${value}\n\n${t}` : t)}
          mode="append"
        />
      );
    case "activities":
      return (
        <AIAssist
          label="اقتراح أنشطة"
          action="suggest_activities"
          getContext={() => ({ objectives: fields.objectives })}
          onApply={(t) => onChange(value ? `${value}\n\n${t}` : t)}
          mode="append"
        />
      );
    case "outputs":
      return (
        <AIAssist
          label="اقتراح مخرجات ونتائج"
          action="suggest_outputs_outcomes"
          getContext={() => ({ activities: fields.activities })}
          onApply={(t) => onChange(value ? `${value}\n\n${t}` : t)}
          mode="append"
        />
      );
    case "kpis":
      return (
        <AIAssist
          label="اقتراح مؤشرات أداء"
          action="suggest_kpis"
          getContext={() => ({ outcomes: fields.outcomes, activities: fields.activities })}
          onApply={(t) => onChange(value ? `${value}\n\n${t}` : t)}
          mode="append"
        />
      );
    case "justification":
    case "sustainability":
      return (
        <AIAssist
          label="إعادة صياغة رسمية"
          action="rewrite_formal"
          getContext={() => ({ text: value })}
          onApply={onChange}
        />
      );
    case "donorRequirements":
      return (
        <AIAssist
          label="مقارنة مع شروط الفرصة"
          action="compare_project_opportunity"
          getContext={() => ({
            projectCategory: projectContext.category || "",
            opportunityField: selectedOpportunity?.field || "",
            requirements: selectedOpportunity?.requirements || "",
          })}
          onApply={(t) => onChange(value ? `${value}\n\n${t}` : t)}
          mode="append"
        />
      );
    default:
      return null;
  }
}
