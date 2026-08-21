import Link from "next/link";
import RegisterForm from "./register-form";
import { getLmSession, type LmSessionPayload } from "@/lib/lm/auth";
import { isLmSessionUserValid } from "@/lib/lm/authz";
import { redirect } from "next/navigation";

export default async function LmRegisterPage() {
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
            <p className="text-xs text-slate-400">حساب مستقل خاص بك وببياناتك فقط</p>
          </div>
        </div>
        <h1 className="text-xl font-black text-slate-900">إنشاء حساب جديد</h1>
        <p className="mb-6 mt-1 text-sm text-slate-500">برقم جوالك وكلمة مرور فقط — بدون رسائل تحقق</p>
        <RegisterForm />
        <p className="mt-6 text-center text-sm text-slate-500">
          لديك حساب بالفعل؟{" "}
          <Link href="/installments/login" className="font-bold text-emerald-700">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
