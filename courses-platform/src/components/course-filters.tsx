import { Search } from "lucide-react";
import { COURSE_LEVEL_LABELS, COURSE_TYPE_LABELS, DEFAULT_CATEGORIES } from "@/lib/constants";

export type CourseFiltersValue = {
  q: string;
  category: string;
  level: string;
  type: string;
  cert: string;
  open: string;
  sort: string;
};

/** نموذج بحث وفلترة يعمل عبر GET بدون أي جافاسكربت (تحسين تدريجي وسهولة وصول كاملة). */
export function CourseFilters({ values }: { values: CourseFiltersValue }) {
  return (
    <form method="get" action="/courses" className="card mb-8 p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative lg:col-span-2">
          <label htmlFor="q" className="sr-only">
            البحث في الدورات
          </label>
          <Search
            className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={values.q}
            placeholder="ابحث باسم الدورة أو المدرب..."
            className="input pr-10"
          />
        </div>

        <div>
          <label htmlFor="category" className="sr-only">
            التصنيف
          </label>
          <select id="category" name="category" defaultValue={values.category} className="select">
            <option value="">كل التصنيفات</option>
            {DEFAULT_CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="level" className="sr-only">
            المستوى
          </label>
          <select id="level" name="level" defaultValue={values.level} className="select">
            <option value="">كل المستويات</option>
            {Object.entries(COURSE_LEVEL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="type" className="sr-only">
            النوع
          </label>
          <select id="type" name="type" defaultValue={values.type} className="select">
            <option value="">حضوري وأونلاين</option>
            {Object.entries(COURSE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sort" className="sr-only">
            الترتيب
          </label>
          <select id="sort" name="sort" defaultValue={values.sort} className="select">
            <option value="newest">الأحدث</option>
            <option value="soonest">الأقرب بدءًا</option>
            <option value="az">أبجديًا (أ-ي)</option>
          </select>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
            <input
              type="checkbox"
              name="cert"
              value="1"
              defaultChecked={values.cert === "1"}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
            />
            دورات بشهادة فقط
          </label>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
            <input
              type="checkbox"
              name="open"
              value="1"
              defaultChecked={values.open === "1"}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
            />
            التسجيل المفتوح فقط
          </label>
        </div>

        <div className="flex items-center gap-2">
          <a href="/courses" className="btn-ghost">
            مسح الفلاتر
          </a>
          <button type="submit" className="btn-primary">
            تطبيق
          </button>
        </div>
      </div>
    </form>
  );
}
