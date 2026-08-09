import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ORG_CONTEXT_FIELDS } from "@/lib/data/framework-seed-data";
import { updateOrgProfileAction } from "@/app/actions/org-actions";

export default async function OrgProfilePage() {
  const user = await requireUser(["ORG"]);
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: user.organizationId! } });
  const contextAnswers = JSON.parse(org.contextAnswers || "{}") as Record<string, string>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">بيانات الجمعية</h1>
      <form action={updateOrgProfileAction} className="space-y-6">
        <section className="card space-y-4">
          <h2 className="font-bold text-slate-800">البيانات الأساسية</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="اسم الجمعية" name="name" defaultValue={org.name} />
            <Field label="رقم الترخيص" name="licenseNumber" defaultValue={org.licenseNumber ?? ""} />
            <Field label="المنطقة / المدينة" name="region" defaultValue={org.region ?? ""} />
            <Field label="عام التأسيس" name="foundingYear" type="number" defaultValue={org.foundingYear ?? ""} />
            <Field label="المدير التنفيذي" name="executiveDirector" defaultValue={org.executiveDirector ?? ""} />
            <Field label="البريد الإلكتروني" name="contactEmail" type="email" defaultValue={org.contactEmail ?? ""} dir="ltr" />
            <Field label="رقم الجوال" name="contactPhone" defaultValue={org.contactPhone ?? ""} dir="ltr" />
            <Field label="عدد فريق العمل الرسمي" name="fullTimeStaff" type="number" defaultValue={org.fullTimeStaff ?? ""} />
            <Field label="عدد فريق العمل الجزئي" name="partTimeStaff" type="number" defaultValue={org.partTimeStaff ?? ""} />
            <Field label="رابط الموقع الإلكتروني" name="websiteUrl" defaultValue={org.websiteUrl ?? ""} dir="ltr" />
            <Field label="رابط منصة X" name="xUrl" defaultValue={org.xUrl ?? ""} dir="ltr" />
            <Field label="رابط تقرير 2025" name="report2025Url" defaultValue={org.report2025Url ?? ""} dir="ltr" />
          </div>
        </section>

        <section className="card space-y-4">
          <h2 className="font-bold text-slate-800">أهداف الكيان وتساؤلات عابرة</h2>
          {ORG_CONTEXT_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="label">{field.label}</label>
              <textarea className="input" name={field.key} rows={2} defaultValue={contextAnswers[field.key] ?? ""} />
            </div>
          ))}
        </section>

        <button type="submit" className="btn-primary">
          حفظ البيانات
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  dir,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue: string | number;
  dir?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" type={type} name={name} defaultValue={defaultValue} dir={dir} />
    </div>
  );
}
