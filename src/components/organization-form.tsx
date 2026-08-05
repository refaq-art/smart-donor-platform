"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import type { OrgFormState } from "@/app/actions/organization";
import DynamicListField from "./dynamic-list-field";
import { Loader2, Save, CheckCircle2 } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
      حفظ ملف الجمعية
    </button>
  );
}

export type OrgDefaults = {
  name?: string;
  about?: string;
  regNumber?: string;
  licenseDate?: string;
  licenseExpiry?: string;
  supervisingBody?: string;
  foundedAt?: string;
  sector?: string;
  geographicScope?: string;
  city?: string;
  strategicGoals?: string[];
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  delegateName?: string;
  delegateRole?: string;
  delegatePhone?: string;
  delegateEmail?: string;
  bankName?: string;
  iban?: string;
  annualBudget?: number | null;
};

export default function OrganizationForm({
  action,
  defaults,
  readOnly,
}: {
  action: (prev: OrgFormState, formData: FormData) => Promise<OrgFormState>;
  defaults?: OrgDefaults;
  readOnly?: boolean;
}) {
  const [state, formAction] = useFormState<OrgFormState, FormData>(action, null);
  const [goals, setGoals] = useState<string[]>(defaults?.strategicGoals || []);

  return (
    <form action={formAction} className="space-y-6">
      <fieldset disabled={readOnly} className="space-y-6">
        <div className="card space-y-4 p-5">
          <p className="text-sm font-black text-brand-700">البيانات الأساسية</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="field-label">الاسم الرسمي للجمعية *</label>
              <input className="input" name="name" required defaultValue={defaults?.name} />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label">نبذة تعريفية</label>
              <textarea className="textarea" name="about" defaultValue={defaults?.about} />
              <p className="field-hint">
                تُستخدم تلقائيًا في قسم «تعريف الجمعية» عند إعداد طلبات المنح.
              </p>
            </div>
            <div>
              <label className="field-label">رقم الترخيص</label>
              <input className="input" name="regNumber" defaultValue={defaults?.regNumber} />
            </div>
            <div>
              <label className="field-label">الجهة المشرفة</label>
              <input className="input" name="supervisingBody" defaultValue={defaults?.supervisingBody} />
            </div>
            <div>
              <label className="field-label">تاريخ الترخيص</label>
              <input className="input" type="date" name="licenseDate" defaultValue={defaults?.licenseDate} />
            </div>
            <div>
              <label className="field-label">انتهاء الترخيص</label>
              <input className="input" type="date" name="licenseExpiry" defaultValue={defaults?.licenseExpiry} />
              <p className="field-hint">يُستخدم للتنبيه قبل انتهاء الصلاحية.</p>
            </div>
            <div>
              <label className="field-label">تاريخ التأسيس</label>
              <input className="input" type="date" name="foundedAt" defaultValue={defaults?.foundedAt} />
              <p className="field-hint">يُستخدم في فحص شرط «عمر الجمعية» لدى الجهات المانحة.</p>
            </div>
            <div>
              <label className="field-label">الميزانية السنوية (ر.س)</label>
              <input
                className="input"
                type="number"
                min={0}
                name="annualBudget"
                defaultValue={defaults?.annualBudget ?? undefined}
              />
            </div>
          </div>
        </div>

        <div className="card space-y-4 p-5">
          <p className="text-sm font-black text-brand-700">النشاط والنطاق</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">مجال الجمعية</label>
              <input className="input" name="sector" defaultValue={defaults?.sector} placeholder="تعليمي، صحي، تنموي..." />
            </div>
            <div>
              <label className="field-label">النطاق الجغرافي</label>
              <input className="input" name="geographicScope" defaultValue={defaults?.geographicScope} />
            </div>
          </div>
          <DynamicListField
            label="الأهداف الاستراتيجية"
            hiddenName="strategicGoalsJson"
            items={goals}
            onChange={setGoals}
            placeholder="هدف استراتيجي"
          />
        </div>

        <div className="card space-y-4 p-5">
          <p className="text-sm font-black text-brand-700">بيانات التواصل</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">الهاتف</label>
              <input className="input" name="phone" defaultValue={defaults?.phone} dir="ltr" />
            </div>
            <div>
              <label className="field-label">البريد الإلكتروني</label>
              <input className="input" type="email" name="email" defaultValue={defaults?.email} dir="ltr" />
            </div>
            <div>
              <label className="field-label">الموقع الإلكتروني</label>
              <input className="input" name="website" defaultValue={defaults?.website} dir="ltr" />
            </div>
            <div>
              <label className="field-label">المدينة</label>
              <input className="input" name="city" defaultValue={defaults?.city} />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label">العنوان</label>
              <input className="input" name="address" defaultValue={defaults?.address} />
            </div>
          </div>
        </div>

        <div className="card space-y-4 p-5">
          <p className="text-sm font-black text-brand-700">المفوّض</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">اسم المفوّض</label>
              <input className="input" name="delegateName" defaultValue={defaults?.delegateName} />
            </div>
            <div>
              <label className="field-label">الصفة</label>
              <input className="input" name="delegateRole" defaultValue={defaults?.delegateRole} />
            </div>
            <div>
              <label className="field-label">هاتف المفوّض</label>
              <input className="input" name="delegatePhone" defaultValue={defaults?.delegatePhone} dir="ltr" />
            </div>
            <div>
              <label className="field-label">بريد المفوّض</label>
              <input className="input" type="email" name="delegateEmail" defaultValue={defaults?.delegateEmail} dir="ltr" />
            </div>
          </div>
        </div>

        <div className="card space-y-4 p-5">
          <p className="text-sm font-black text-brand-700">البيانات البنكية</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">اسم البنك</label>
              <input className="input" name="bankName" defaultValue={defaults?.bankName} />
            </div>
            <div>
              <label className="field-label">الآيبان (IBAN)</label>
              <input className="input" name="iban" defaultValue={defaults?.iban} dir="ltr" />
            </div>
          </div>
        </div>
      </fieldset>

      {state?.error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          <CheckCircle2 size={16} /> تم حفظ ملف الجمعية بنجاح
        </p>
      )}

      {!readOnly && (
        <div className="flex justify-end">
          <SubmitButton />
        </div>
      )}
    </form>
  );
}
