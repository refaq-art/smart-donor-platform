"use client";

import { ROLES } from "@/lib/roles";
import { updateUserRoleAction, deleteUserAction } from "@/app/actions/users";
import ConfirmSubmitButton from "./confirm-submit-button";
import { Trash2 } from "lucide-react";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  isDemo: boolean;
  _count: { createdApplications: number; assignedApplications: number };
};

export default function UsersTable({
  users,
  currentUserId,
  roleLabels,
}: {
  users: UserRow[];
  currentUserId: string;
  roleLabels: Record<string, string>;
}) {
  return (
    <div className="card overflow-auto p-0">
      <table className="w-full min-w-[700px] text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500">
          <tr>
            <th className="p-3 text-right">الاسم</th>
            <th className="p-3 text-right">البريد الإلكتروني</th>
            <th className="p-3 text-right">الدور</th>
            <th className="p-3 text-right">طلبات مسندة</th>
            <th className="p-3 text-right"></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-slate-100">
              <td className="p-3 font-bold text-ink">
                {u.name} {u.id === currentUserId && <span className="text-xs text-slate-400">(أنت)</span>}
              </td>
              <td className="p-3 text-slate-500" dir="ltr">{u.email}</td>
              <td className="p-3">
                {u.id === currentUserId ? (
                  <span className="badge bg-brand-50 text-brand-700 border-brand-200">{roleLabels[u.role]}</span>
                ) : (
                  <select
                    defaultValue={u.role}
                    className="select w-auto py-1.5 text-xs"
                    onChange={(e) => updateUserRoleAction(u.id, e.target.value)}
                  >
                    {Object.values(ROLES).map((r) => (
                      <option key={r} value={r}>{roleLabels[r]}</option>
                    ))}
                  </select>
                )}
              </td>
              <td className="p-3 text-xs text-slate-400">{u._count.assignedApplications}</td>
              <td className="p-3">
                {u.id !== currentUserId && (
                  <form action={deleteUserAction.bind(null, u.id)}>
                    <ConfirmSubmitButton confirmMessage={`هل أنت متأكد من حذف المستخدم ${u.name}؟`} className="text-red-500 hover:text-red-700">
                      <Trash2 size={16} />
                    </ConfirmSubmitButton>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
