import { requireUser } from "@/lib/auth";
import { getFrameworkTree } from "@/lib/assessment-data";
import { updateIndicatorAction, updateLevelAction, createDomainAction, createCriterionAction, createIndicatorAction } from "@/app/actions/admin-actions";

export default async function AdminFrameworkPage() {
  await requireUser(["ADMIN"]);
  const domains = await getFrameworkTree();

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">إدارة إطار القياس</h1>
        <p className="text-sm text-slate-500">المحاور والمعايير والمؤشرات ومستويات القياس — كلها قابلة للتعديل من هنا دون الحاجة لتعديل الكود.</p>
      </div>

      <details className="card">
        <summary className="cursor-pointer font-bold text-slate-700">+ إضافة محور جديد</summary>
        <form action={createDomainAction} className="mt-3 flex flex-wrap gap-2">
          <input className="input" name="code" placeholder="رمز المحور (EN)" required />
          <input className="input flex-1" name="name" placeholder="اسم المحور" required />
          <button type="submit" className="btn-primary">إضافة</button>
        </form>
      </details>

      {domains.map((domain) => (
        <section key={domain.id} className="card">
          <h2 className="mb-3 text-lg font-bold text-navy-900">{domain.name}</h2>

          <details className="mb-4">
            <summary className="cursor-pointer text-xs text-navy-600">+ إضافة معيار</summary>
            <form action={createCriterionAction} className="mt-2 flex flex-wrap gap-2">
              <input type="hidden" name="domainId" value={domain.id} />
              <input className="input" name="code" placeholder="رمز المعيار" required />
              <input className="input flex-1" name="name" placeholder="اسم المعيار" required />
              <button type="submit" className="btn-secondary text-xs">إضافة</button>
            </form>
          </details>

          {domain.criteria.map((criterion) => (
            <div key={criterion.id} className="mb-6">
              <h3 className="mb-2 text-sm font-bold text-slate-600">{criterion.name}</h3>

              <details className="mb-3">
                <summary className="cursor-pointer text-xs text-navy-600">+ إضافة مؤشر</summary>
                <form action={createIndicatorAction} className="mt-2 flex flex-wrap gap-2">
                  <input type="hidden" name="criterionId" value={criterion.id} />
                  <input className="input" name="code" placeholder="رمز المؤشر" required />
                  <input className="input flex-1" name="name" placeholder="اسم المؤشر" required />
                  <select className="input" name="type">
                    <option value="MATURITY_LEVEL">مؤشر نوعي (3 مستويات)</option>
                    <option value="COMPLETION_STAGE">بند إجرائي (5 مراحل)</option>
                  </select>
                  <button type="submit" className="btn-secondary text-xs">إضافة</button>
                </form>
              </details>

              <div className="space-y-4">
                {criterion.indicators.map((indicator) => (
                  <div key={indicator.id} className="rounded-xl border border-slate-200 p-3">
                    <form action={updateIndicatorAction} className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-6">
                      <input type="hidden" name="indicatorId" value={indicator.id} />
                      <input className="input md:col-span-2" name="name" defaultValue={indicator.name} />
                      <input className="input" name="weight" type="number" step="0.1" defaultValue={indicator.weight} title="الوزن" />
                      <input className="input" name="order" type="number" defaultValue={indicator.order} title="الترتيب" />
                      <label className="flex items-center gap-1 text-xs">
                        <input type="checkbox" name="isActive" defaultChecked={indicator.isActive} /> نشط
                      </label>
                      <button type="submit" className="btn-secondary text-xs">حفظ</button>
                      <input className="input md:col-span-6" name="requiredEvidenceHint" placeholder="الشاهد المطلوب (اختياري)" defaultValue={indicator.requiredEvidenceHint ?? ""} />
                    </form>

                    <div className="space-y-2">
                      {indicator.levels
                        .sort((a, b) => a.levelNumber - b.levelNumber)
                        .map((level) => (
                          <form key={level.id} action={updateLevelAction} className="grid grid-cols-1 gap-2 rounded-lg bg-slate-50 p-2 md:grid-cols-6">
                            <input type="hidden" name="levelId" value={level.id} />
                            <input className="input text-xs" name="label" defaultValue={level.label} />
                            <input className="input text-xs" name="minScore" type="number" step="0.01" defaultValue={level.minScore} />
                            <input className="input text-xs" name="maxScore" type="number" step="0.01" defaultValue={level.maxScore} />
                            <input className="input text-xs md:col-span-2" name="description" defaultValue={level.description} />
                            <button type="submit" className="btn-ghost text-xs">حفظ</button>
                          </form>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
