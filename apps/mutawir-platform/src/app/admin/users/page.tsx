import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createUserAction, toggleUserActiveAction } from "@/app/actions/admin-actions";
import { ROLES } from "@/lib/constants";

const ROLE_LABELS: Record<string, string> = { ORG: "جمعية", CONSULTANT: "مستشار", COUNCIL: "مجلس", ADMIN: "مدير نظام" };

export default async function AdminUsersPage() {
  await requireUser(["ADMIN"]);
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, include: { organization: true } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">المستخدمون</h1>

      <details className="card">
        <summary className="cursor-pointer font-bold text-slate-700">+ إنشاء مستخدم جديد (مستشار / عضو مجلس / مدير نظام)</summary>
        <form action={createUserAction} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <input className="input" name="name" placeholder="الاسم" required />
          <input className="input" name="email" type="email" placeholder="البريد الإلكتروني" dir="ltr" required />
          <input className="input" name="password" type="password" placeholder="كلمة المرور" required />
          <select className="input" name="role" required>
            {ROLES.filter((r) => r !== "ORG").map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary md:col-span-2">إنشاء</button>
        </form>
        <p className="mt-2 text-xs text-slate-400">حسابات الجمعيات تُنشأ تلقائيًا من صفحة الجمعيات.</p>
      </details>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="p-3 text-right">الاسم</th>
              <th className="p-3 text-right">البريد</th>
              <th className="p-3 text-right">الدور</th>
              <th className="p-3 text-right">الحالة</th>
              <th className="p-3 text-right">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="p-3 font-medium">{u.name}</td>
                <td className="p-3 text-xs text-slate-500" dir="ltr">{u.email}</td>
                <td className="p-3">{ROLE_LABELS[u.role]}</td>
                <td className="p-3">
                  <span className={`badge ${u.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                    {u.isActive ? "نشط" : "معطّل"}
                  </span>
                </td>
                <td className="p-3">
                  <form action={toggleUserActiveAction.bind(null, u.id)}>
                    <button type="submit" className="btn-ghost text-xs">{u.isActive ? "تعطيل" : "تفعيل"}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
