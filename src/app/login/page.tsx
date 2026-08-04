import LoginForm from "./login-form";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/dashboard");
  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 p-4">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-brand-700 to-brand-900 p-10 text-white md:flex">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gold-400 text-xl font-black text-brand-900">
                م
              </div>
              <div>
                <p className="text-lg font-black leading-tight">منصة إدارة المنح</p>
                <p className="text-xs text-brand-100">للجمعيات الخيرية</p>
              </div>
            </div>
            <h2 className="mt-10 text-2xl font-black leading-relaxed">
              منصة واحدة لإدارة مشاريعكم وطلبات التمويل من الجهات المانحة
            </h2>
            <p className="mt-4 text-sm leading-loose text-brand-100">
              أنشئوا المشاريع، تابعوا فرص التمويل، أعدوا طلبات المنح خطوة بخطوة، واستفيدوا من
              المساعد الذكي في صياغة المحتوى ومراجعة اكتمال الطلبات.
            </p>
          </div>
          <ul className="space-y-2 text-sm text-brand-100">
            <li>✓ إدارة كاملة للمشاريع وفرص التمويل والجهات المانحة</li>
            <li>✓ متابعة حالة الطلبات وسجل الإجراءات</li>
            <li>✓ مساعد ذكاء اصطناعي لصياغة ومراجعة المحتوى</li>
          </ul>
        </div>
        <div className="p-8 sm:p-10">
          <div className="mb-8 md:hidden">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-500 text-lg font-black text-white">
                م
              </div>
              <p className="text-lg font-black text-ink">منصة إدارة المنح</p>
            </div>
          </div>
          <h1 className="text-2xl font-black text-ink">تسجيل الدخول</h1>
          <p className="page-subtitle mb-6">أدخل بيانات حسابك للمتابعة إلى المنصة</p>
          <LoginForm next={next} />
        </div>
      </div>
    </div>
  );
}
