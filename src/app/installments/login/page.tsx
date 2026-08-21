import Link from "next/link";
import LoginForm from "./login-form";
import { getLmSession, type LmSessionPayload } from "@/lib/lm/auth";
import { isLmSessionUserValid } from "@/lib/lm/authz";
import { redirect } from "next/navigation";

export default async function LmLoginPage() {
  const session = await getLmSession();
  if (session && (await isLmSessionUserValid(session as LmSessionPayload))) {
    redirect("/installments/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-600 text-xl font-black text-white">
            م
          </div>
          <div>
            <p className="text-lg font-black leading-tight text-slate-900">إدارة المهل والأقساط</p>
            <p className="text-xs text-slate-400">تتبّع عملاءك ومستحقاتك بسهولة</p>
          </div>
        </div>
        <h1 className="text-xl font-black text-slate-900">تسجيل الدخول</h1>
        <p className="mb-6 mt-1 text-sm text-slate-500">أدخل رقم جوالك وكلمة مرورك للمتابعة</p>
        <LoginForm />
        <p className="mt-6 text-center text-sm text-slate-500">
          ليس لديك حساب؟{" "}
          <Link href="/installments/register" className="font-bold text-emerald-700">
            إنشاء حساب جديد
          </Link>
        </p>
      </div>
    </div>
  );
}
