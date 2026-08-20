import Link from "next/link";
import { requireUser } from "@/lib/auth";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/account/my-courses");

  return (
    <div className="container-app py-10">
      <div className="mb-8">
        <h1 className="page-title">مرحبًا، {user.fullName}</h1>
        <p className="page-subtitle">أدر ملفك الشخصي وتابع دوراتك من هنا</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
        <nav aria-label="قائمة الحساب" className="flex gap-2 overflow-x-auto lg:flex-col">
          <Link
            href="/account/my-courses"
            className="whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100"
          >
            دوراتي
          </Link>
          <Link
            href="/account/profile"
            className="whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100"
          >
            الملف الشخصي
          </Link>
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
