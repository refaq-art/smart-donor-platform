"use client";

import { useFormState } from "react-dom";
import { useState } from "react";
import { createCourseAction, updateCourseAction } from "@/app/actions/courses";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage } from "@/components/ui";
import {
  COURSE_LEVEL_LABELS,
  COURSE_TYPE_LABELS,
  COURSE_TYPES,
  COVER_COLORS,
} from "@/lib/constants";
import type { FormState } from "@/app/actions/auth";

type Category = { id: string; name: string };

export type CourseFormValues = {
  id?: string;
  title: string;
  shortDescription: string;
  description: string;
  instructorName: string;
  providerName: string;
  categoryId: string;
  level: string;
  type: string;
  location: string;
  meetingUrl: string;
  startDate: string;
  endDate: string;
  scheduleTime: string;
  durationText: string;
  totalSeats: number;
  hasCertificate: boolean;
  coverImageUrl: string;
  coverColor: string;
  isPublished: boolean;
  registrationOpen: boolean;
  isFeatured: boolean;
};

const EMPTY_VALUES: CourseFormValues = {
  title: "",
  shortDescription: "",
  description: "",
  instructorName: "",
  providerName: "",
  categoryId: "",
  level: "BEGINNER",
  type: "ONLINE",
  location: "",
  meetingUrl: "",
  startDate: "",
  endDate: "",
  scheduleTime: "",
  durationText: "",
  totalSeats: 30,
  hasCertificate: false,
  coverImageUrl: "",
  coverColor: "blue",
  isPublished: true,
  registrationOpen: true,
  isFeatured: false,
};

export function CourseForm({
  categories,
  initialValues,
}: {
  categories: Category[];
  initialValues?: Partial<CourseFormValues>;
}) {
  const values = { ...EMPTY_VALUES, ...initialValues };
  const isEdit = !!values.id;
  const [type, setType] = useState(values.type);

  const [state, formAction] = useFormState<FormState, FormData>(
    isEdit ? updateCourseAction : createCourseAction,
    null
  );

  return (
    <form action={formAction} className="space-y-8" noValidate>
      {isEdit && <input type="hidden" name="courseId" value={values.id} />}

      <section className="card space-y-4 p-6">
        <h2 className="font-black text-ink">المعلومات الأساسية</h2>

        <div>
          <label className="field-label" htmlFor="title">
            اسم الدورة
          </label>
          <input id="title" name="title" required minLength={3} defaultValue={values.title} className="input" />
        </div>

        <div>
          <label className="field-label" htmlFor="shortDescription">
            الوصف المختصر
          </label>
          <textarea
            id="shortDescription"
            name="shortDescription"
            required
            minLength={10}
            defaultValue={values.shortDescription}
            className="textarea"
            rows={2}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="description">
            الوصف التفصيلي
          </label>
          <textarea
            id="description"
            name="description"
            required
            minLength={20}
            defaultValue={values.description}
            className="textarea"
            rows={6}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="instructorName">
              اسم المدرب
            </label>
            <input id="instructorName" name="instructorName" required defaultValue={values.instructorName} className="input" />
          </div>
          <div>
            <label className="field-label" htmlFor="providerName">
              الجهة المقدمة
            </label>
            <input id="providerName" name="providerName" required defaultValue={values.providerName} className="input" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="categoryId">
              التصنيف
            </label>
            <select id="categoryId" name="categoryId" required defaultValue={values.categoryId} className="select">
              <option value="" disabled>
                اختر التصنيف
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="level">
              المستوى
            </label>
            <select id="level" name="level" required defaultValue={values.level} className="select">
              {Object.entries(COURSE_LEVEL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="font-black text-ink">الجدولة والحضور</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="startDate">
              تاريخ البداية
            </label>
            <input id="startDate" name="startDate" type="date" required defaultValue={values.startDate} className="input" />
          </div>
          <div>
            <label className="field-label" htmlFor="endDate">
              تاريخ النهاية
            </label>
            <input id="endDate" name="endDate" type="date" required defaultValue={values.endDate} className="input" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="scheduleTime">
              وقت الدورة
            </label>
            <input
              id="scheduleTime"
              name="scheduleTime"
              required
              placeholder="مثال: الأحد والثلاثاء، 7-9 مساءً"
              defaultValue={values.scheduleTime}
              className="input"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="durationText">
              مدة الدورة
            </label>
            <input
              id="durationText"
              name="durationText"
              required
              placeholder="مثال: 4 أسابيع"
              defaultValue={values.durationText}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="type">
            نوع الدورة
          </label>
          <select
            id="type"
            name="type"
            required
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="select"
          >
            {Object.entries(COURSE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {type === COURSE_TYPES.IN_PERSON ? (
          <div>
            <label className="field-label" htmlFor="location">
              موقع الدورة
            </label>
            <input id="location" name="location" defaultValue={values.location} className="input" placeholder="المدينة - اسم المكان" />
          </div>
        ) : (
          <div>
            <label className="field-label" htmlFor="meetingUrl">
              رابط الحضور
            </label>
            <input
              id="meetingUrl"
              name="meetingUrl"
              defaultValue={values.meetingUrl}
              className="input"
              placeholder="https://..."
              dir="ltr"
            />
            <p className="field-hint">لا يظهر هذا الرابط إلا للمسجَّلين في الدورة.</p>
          </div>
        )}
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="font-black text-ink">المقاعد والمظهر</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="totalSeats">
              عدد المقاعد
            </label>
            <input
              id="totalSeats"
              name="totalSeats"
              type="number"
              min={1}
              required
              defaultValue={values.totalSeats}
              className="input"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="coverColor">
              لون الغلاف الافتراضي
            </label>
            <select id="coverColor" name="coverColor" defaultValue={values.coverColor} className="select">
              {COVER_COLORS.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="coverImageUrl">
            رابط صورة الغلاف <span className="font-normal text-slate-400">(اختياري)</span>
          </label>
          <input
            id="coverImageUrl"
            name="coverImageUrl"
            defaultValue={values.coverImageUrl}
            className="input"
            placeholder="https://..."
            dir="ltr"
          />
          <p className="field-hint">عند تركه فارغًا يُعرض غلاف افتراضي بألوان متدرّجة.</p>
        </div>

        <div className="flex flex-wrap gap-6 pt-2">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input type="checkbox" name="hasCertificate" defaultChecked={values.hasCertificate} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
            توجد شهادة حضور
          </label>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input type="checkbox" name="isFeatured" defaultChecked={values.isFeatured} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
            دورة مميزة (تظهر في الرئيسية)
          </label>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input type="checkbox" name="isPublished" defaultChecked={values.isPublished} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
            منشورة (مرئية للزوار)
          </label>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input type="checkbox" name="registrationOpen" defaultChecked={values.registrationOpen} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
            التسجيل مفتوح
          </label>
        </div>
      </section>

      {state?.error && <FormMessage type="error" message={state.error} />}
      {state?.success && <FormMessage type="success" message={state.success} />}

      <div className="flex justify-end">
        <SubmitButton pendingLabel="جارٍ الحفظ..." className="w-auto px-8">
          {isEdit ? "حفظ التعديلات" : "إنشاء الدورة"}
        </SubmitButton>
      </div>
    </form>
  );
}
