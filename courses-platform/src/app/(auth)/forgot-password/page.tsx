import type { Metadata } from "next";
import ForgotPasswordForm from "./forgot-password-form";

export const metadata: Metadata = { title: "استعادة كلمة المرور" };

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="page-title text-center">استعادة كلمة المرور</h1>
      <p className="page-subtitle mb-6 text-center">
        أدخل بريدك الإلكتروني وسنرسل لك رابطًا لتعيين كلمة مرور جديدة
      </p>
      <ForgotPasswordForm />
    </div>
  );
}
