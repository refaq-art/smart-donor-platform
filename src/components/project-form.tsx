"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import DynamicListField from "./dynamic-list-field";
import DynamicKvField from "./dynamic-kv-field";
import AIAssist from "./ai-assist";
import { PROJECT_CATEGORIES, PROJECT_STATUSES } from "@/lib/constants";
import type { ProjectFormState } from "@/app/actions/projects";
import { Loader2, Save } from "lucide-react";

type KpiRow = { indicator: string; target: string };
type BudgetRow = { item: string; amount: string };

export type ProjectFormDefaults = {
  title?: string;
  category?: string;
  problemStatement?: string;
  generalObjective?: string;
  specificObjectives?: string[];
  beneficiaryCategory?: string;
  beneficiaryCount?: number | null;
  geographicScope?: string;
  activities?: string[];
  outputs?: string[];
  outcomes?: string[];
  kpis?: KpiRow[];
  timelineStart?: string;
  timelineEnd?: string;
  budgetTotal?: number | null;
  budgetBreakdown?: BudgetRow[];
  status?: string;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
      {label}
    </button>
  );
}

export default function ProjectForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (prev: ProjectFormState, formData: FormData) => Promise<ProjectFormState>;
  defaults?: ProjectFormDefaults;
  submitLabel: string;
}) {
  const [state, formAction] = useFormState<ProjectFormState, FormData>(action, null);

  const [problemStatement, setProblemStatement] = useState(defaults?.problemStatement || "");
  const [generalObjective, setGeneralObjective] = useState(defaults?.generalObjective || "");
  const [title, setTitle] = useState(defaults?.title || "");
  const [objectives, setObjectives] = useState<string[]>(defaults?.specificObjectives || []);
  const [activities, setActivities] = useState<string[]>(defaults?.activities || []);
  const [outputs, setOutputs] = useState<string[]>(defaults?.outputs || []);
  const [outcomes, setOutcomes] = useState<string[]>(defaults?.outcomes || []);
  const [kpis, setKpis] = useState<KpiRow[]>(defaults?.kpis || []);
  const [budget, setBudget] = useState<BudgetRow[]>(
    (defaults?.budgetBreakdown as BudgetRow[]) || []
  );

  return (
    <form action={formAction} className="space-y-6">
      <div className="card space-y-4 p-5">
        <p className="text-sm font-black text-brand-700">البيانات الأساسية</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="field-label">اسم المشروع *</label>
            <input
              className="input"
              name="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: مشروع كفالة تعليم الأيتام"
            />
          </div>
          <div>
            <label className="field-label">فئة المشروع</label>
            <select className="select" name="category" defaultValue={defaults?.category || ""}>
              <option value="">اختر الفئة</option>
              {PROJECT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">الحالة</label>
            <select className="select" name="status" defaultValue={defaults?.status || "مسودة"}>
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">الفئة المستفيدة</label>
            <input
              className="input"
              name="beneficiaryCategory"
              defaultValue={defaults?.beneficiaryCategory}
              placeholder="مثال: الأيتام وأسرهم"
            />
          </div>
          <div>
            <label className="field-label">عدد المستفيدين المتوقع</label>
            <input
              className="input"
              type="number"
              min={0}
              name="beneficiaryCount"
              defaultValue={defaults?.beneficiaryCount ?? undefined}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label">النطاق الجغرافي</label>
            <input
              className="input"
              name="geographicScope"
              defaultValue={defaults?.geographicScope}
              placeholder="مثال: مدينة حائل وضواحيها"
            />
          </div>
        </div>
      </div>

      <div className="card space-y-4 p-5">
        <p className="text-sm font-black text-brand-700">المشكلة والأهداف</p>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="field-label !mb-0">المشكلة التي يعالجها المشروع</label>
            <AIAssist
              label="تحسين الصياغة"
              action="improve_problem_statement"
              getContext={() => ({ text: problemStatement })}
              onApply={(t) => setProblemStatement(t)}
            />
          </div>
          <textarea
            className="textarea"
            name="problemStatement"
            value={problemStatement}
            onChange={(e) => setProblemStatement(e.target.value)}
            placeholder="اشرح المشكلة أو الاحتياج الذي يعالجه المشروع بوضوح ودقة..."
          />
        </div>
        <div>
          <label className="field-label">الهدف العام</label>
          <textarea
            className="textarea min-h-[70px]"
            name="generalObjective"
            value={generalObjective}
            onChange={(e) => setGeneralObjective(e.target.value)}
            placeholder="الهدف الرئيسي الذي يسعى المشروع لتحقيقه"
          />
        </div>
        <DynamicListField
          label="الأهداف التفصيلية"
          hiddenName="specificObjectivesJson"
          items={objectives}
          onChange={setObjectives}
          placeholder="هدف تفصيلي قابل للقياس"
          aiSlot={
            <AIAssist
              label="اقتراح أهداف"
              action="suggest_objectives"
              getContext={() => ({ problemStatement, generalObjective })}
              onApply={(t) =>
                setObjectives([...objectives, ...t.split("\n").filter((l) => l.trim() && !l.startsWith("بناءً"))])
              }
              mode="append"
            />
          }
        />
      </div>

      <div className="card space-y-4 p-5">
        <p className="text-sm font-black text-brand-700">خطة التنفيذ</p>
        <DynamicListField
          label="الأنشطة"
          hiddenName="activitiesJson"
          items={activities}
          onChange={setActivities}
          placeholder="نشاط تنفيذي"
          aiSlot={
            <AIAssist
              label="اقتراح أنشطة"
              action="suggest_activities"
              getContext={() => ({ objectives: objectives.join("، ") })}
              onApply={(t) => setActivities([...activities, ...t.split("\n").filter((l) => l.trim().startsWith("-"))])}
              mode="append"
            />
          }
        />
        <DynamicListField
          label="المخرجات"
          hiddenName="outputsJson"
          items={outputs}
          onChange={setOutputs}
          placeholder="مخرج مباشر وقابل للعدّ"
          aiSlot={
            <AIAssist
              label="اقتراح مخرجات ونتائج"
              action="suggest_outputs_outcomes"
              getContext={() => ({ activities: activities.join("، ") })}
              onApply={(t) => setOutputs([...outputs, t])}
              mode="append"
            />
          }
        />
        <DynamicListField
          label="النتائج المتوقعة"
          hiddenName="outcomesJson"
          items={outcomes}
          onChange={setOutcomes}
          placeholder="نتيجة على مستوى الأثر"
        />
        <DynamicKvField<KpiRow>
          label="مؤشرات قياس الأداء"
          hiddenName="kpisJson"
          items={kpis}
          onChange={setKpis}
          keys={[
            { name: "indicator", placeholder: "المؤشر" },
            { name: "target", placeholder: "القيمة المستهدفة" },
          ]}
          aiSlot={
            <AIAssist
              label="اقتراح مؤشرات"
              action="suggest_kpis"
              getContext={() => ({ outcomes: outcomes.join("، ") })}
              onApply={(t) => setKpis([...kpis, { indicator: t, target: "" }])}
              mode="append"
            />
          }
        />
      </div>

      <div className="card space-y-4 p-5">
        <p className="text-sm font-black text-brand-700">الجدول الزمني والميزانية</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">تاريخ بداية التنفيذ</label>
            <input className="input" type="date" name="timelineStart" defaultValue={defaults?.timelineStart} />
          </div>
          <div>
            <label className="field-label">تاريخ نهاية التنفيذ</label>
            <input className="input" type="date" name="timelineEnd" defaultValue={defaults?.timelineEnd} />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label">إجمالي الميزانية التقديرية (ر.س)</label>
            <input
              className="input"
              type="number"
              min={0}
              step="0.01"
              name="budgetTotal"
              defaultValue={defaults?.budgetTotal ?? undefined}
            />
          </div>
        </div>
        <DynamicKvField<BudgetRow>
          label="تفاصيل بنود الميزانية"
          hiddenName="budgetBreakdownJson"
          items={budget}
          onChange={setBudget}
          keys={[
            { name: "item", placeholder: "البند" },
            { name: "amount", placeholder: "المبلغ", type: "number" },
          ]}
        />
      </div>

      {state?.error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
