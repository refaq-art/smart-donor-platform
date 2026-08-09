import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createOrganizationAction, assignConsultantAction } from "@/app/actions/admin-actions";

export default async function AdminOrganizationsPage() {
  await requireUser(["ADMIN"]);
  const [organizations, consultants, cycles] = await Promise.all([
    prisma.organization.findMany({ include: { consultant: { include: { user: true } }, users: true }, orderBy: { createdAt: "desc" } }),
    prisma.consultant.findMany({ include: { user: true } }),
    prisma.programCycle.findMany(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">الجمعيات</h1>

      <details className="card">
        <summary className="cursor-pointer font-bold text-slate-700">+ إنشاء جمعية جديدة</summary>
        <form action={createOrganizationAction} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <input className="input" name="name" placeholder="اسم الجمعية" required />
          <input className="input" name="region" placeholder="المنطقة / المدينة" />
          <input className="input" name="email" type="email" placeholder="بريد حساب الجمعية" dir="ltr" required />
          <input className="input" name="password" type="password" placeholder="كلمة مرور مبدئية" required />
          <select className="input" name="consultantId">
            <option value="">— بدون مستشار —</option>
            {consultants.map((c) => (
              <option key={c.id} value={c.id}>
                {c.user.name}
              </option>
            ))}
          </select>
          <select className="input" name="programCycleId">
            <option value="">— بدون برنامج —</option>
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary md:col-span-2">إنشاء</button>
        </form>
      </details>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="p-3 text-right">الجمعية</th>
              <th className="p-3 text-right">المستشار</th>
              <th className="p-3 text-right">تغيير المستشار</th>
              <th className="p-3 text-right">بدء البرنامج</th>
            </tr>
          </thead>
          <tbody>
            {organizations.map((org) => (
              <tr key={org.id} className="border-t border-slate-100">
                <td className="p-3 font-medium">{org.name}</td>
                <td className="p-3">{org.consultant?.user.name ?? "—"}</td>
                <td className="p-3">
                  <form action={assignConsultantAction} className="flex gap-2">
                    <input type="hidden" name="organizationId" value={org.id} />
                    <select name="consultantId" defaultValue={org.consultantId ?? ""} className="input text-xs">
                      <option value="">— بدون —</option>
                      {consultants.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.user.name}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="btn-ghost text-xs">حفظ</button>
                  </form>
                </td>
                <td className="p-3 text-xs text-slate-500">{org.programStartDate ? org.programStartDate.toLocaleDateString("ar-SA") : "لم يبدأ"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
