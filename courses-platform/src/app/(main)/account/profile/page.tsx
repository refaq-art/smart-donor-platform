import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ProfileForm } from "./profile-form";
import { ChangePasswordForm } from "./change-password-form";
import { formatDateAr } from "@/lib/utils";

export const metadata: Metadata = { title: "الملف الشخصي" };

export default async function ProfilePage() {
  const user = await requireUser("/account/profile");

  return (
    <div className="space-y-8">
      <section className="card p-6">
        <h2 className="mb-1 text-lg font-black text-ink">بيانات الحساب</h2>
        <p className="mb-5 text-sm text-slate-500">
          عضو منذ {formatDateAr(user.createdAt)}
        </p>
        <ProfileForm fullName={user.fullName} phone={user.phone || ""} email={user.email} />
      </section>

      <section className="card p-6">
        <h2 className="mb-1 text-lg font-black text-ink">تغيير كلمة المرور</h2>
        <p className="mb-5 text-sm text-slate-500">
          استخدم كلمة مرور قوية لا تشاركها مع أحد
        </p>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
