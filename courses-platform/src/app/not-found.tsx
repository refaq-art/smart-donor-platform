import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center">
      <span className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Compass className="h-10 w-10" aria-hidden="true" />
      </span>
      <h1 className="text-3xl font-black text-ink">404</h1>
      <p className="mt-2 text-lg font-bold text-ink">الصفحة غير موجودة</p>
      <p className="mt-2 max-w-md text-slate-500">
        عذرًا، الصفحة التي تبحث عنها غير موجودة أو تم نقلها. يمكنك العودة إلى الرئيسية أو تصفّح
        الدورات المتاحة.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn-primary">
          العودة للرئيسية
        </Link>
        <Link href="/courses" className="btn-secondary">
          استعراض الدورات
        </Link>
      </div>
    </div>
  );
}
