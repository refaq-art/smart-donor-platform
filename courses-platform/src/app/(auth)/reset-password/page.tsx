import type { Metadata } from "next";
import Link from "next/link";
import ResetPasswordForm from "./reset-password-form";

export const metadata: Metadata = { title: "تعيين كلمة مرور جديدة" };

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token || "";

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="page-title">رابط غير صالح</h1>
        <p className="page-subtitle mt-2">
          رابط استعادة كلمة المرور غير صحيح أو مفقود. الرجاء طلب رابط جديد.
        </p>
        <Link href="/forgot-password" className="btn-primary mt-5 inline-flex">
          طلب رابط استعادة جديد
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title text-center">تعيين كلمة مرور جديدة</h1>
      <p className="page-subtitle mb-6 text-center">اختر كلمة مرور جديدة وقوية لحسابك</p>
      <ResetPasswordForm token={token} />
    </div>
  );
}
