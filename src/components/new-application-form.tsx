"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useMemo, useState } from "react";
import type { ApplicationFormState } from "@/app/actions/applications";
import { Loader2, ArrowLeft } from "lucide-react";

type Project = { id: string; title: string };
type Opportunity = { id: string; title: string; projectId: string | null; donor: { name: string } | null; donorNameFreeText: string | null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? <Loader2 size={16} className="animate-spin" /> : <ArrowLeft size={16} />}
      بدء إعداد الطلب
    </button>
  );
}

export default function NewApplicationForm({
  action,
  projects,
  opportunities,
  defaultProjectId,
  defaultOpportunityId,
}: {
  action: (prev: ApplicationFormState, formData: FormData) => Promise<ApplicationFormState>;
  projects: Project[];
  opportunities: Opportunity[];
  defaultProjectId?: string;
  defaultOpportunityId?: string;
}) {
  const [state, formAction] = useFormState<ApplicationFormState, FormData>(action, null);
  const [projectId, setProjectId] = useState(defaultProjectId || "");
  const [opportunityId, setOpportunityId] = useState(defaultOpportunityId || "");
  const [title, setTitle] = useState("");

  const relevantOpportunities = useMemo(
    () => opportunities.filter((o) => !projectId || !o.projectId || o.projectId === projectId),
    [opportunities, projectId]
  );

  const selectedProject = projects.find((p) => p.id === projectId);
  const selectedOpp = opportunities.find((o) => o.id === opportunityId);

  function suggestTitle(pId: string, oId: string) {
    const p = projects.find((x) => x.id === pId);
    const o = opportunities.find((x) => x.id === oId);
    if (p && o) return `طلب دعم ${p.title} — ${o.donor?.name || o.donorNameFreeText || o.title}`;
    if (p) return `طلب دعم ${p.title}`;
    return "";
  }

  return (
    <form action={formAction} className="card space-y-4 p-5">
      <div>
        <label className="field-label">المشروع *</label>
        <select
          className="select"
          name="projectId"
          required
          value={projectId}
          onChange={(e) => {
            setProjectId(e.target.value);
            if (!title) setTitle(suggestTitle(e.target.value, opportunityId));
          }}
        >
          <option value="">اختر المشروع</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
        {projects.length === 0 && (
          <p className="field-hint text-amber-600">لا توجد مشاريع بعد — أنشئ مشروعًا أولًا من صفحة المشاريع.</p>
        )}
      </div>

      <div>
        <label className="field-label">فرصة التمويل (اختياري)</label>
        <select
          className="select"
          name="opportunityId"
          value={opportunityId}
          onChange={(e) => {
            setOpportunityId(e.target.value);
            if (!title) setTitle(suggestTitle(projectId, e.target.value));
          }}
        >
          <option value="">— بدون ربط الآن —</option>
          {relevantOpportunities.map((o) => (
            <option key={o.id} value={o.id}>
              {o.title} {o.donor?.name || o.donorNameFreeText ? `(${o.donor?.name || o.donorNameFreeText})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="field-label">عنوان الطلب *</label>
        <input
          className="input"
          name="title"
          required
          value={title || suggestTitle(projectId, opportunityId)}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {(selectedProject || selectedOpp) && (
        <div className="rounded-xl bg-brand-50 p-3 text-xs text-brand-700">
          سيتم إنشاء الطلب كمسودة ويمكنك تعبئة جميع أقسامه لاحقًا خطوة بخطوة، مع متابعة نسبة الاكتمال.
        </div>
      )}

      {state?.error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{state.error}</p>
      )}

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
