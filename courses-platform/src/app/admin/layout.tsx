import Link from "next/link";
import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Users,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";

const NAV = [
  { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/admin/courses", label: "الدورات", icon: BookOpen },
  { href: "/admin/users", label: "المستخدمون", icon: Users },
  { href: "/admin/enrollments", label: "التسجيلات", icon: ClipboardList },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin("/admin");

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="hidden w-64 shrink-0 border-l border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5 font-black text-ink">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <GraduationCap className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          لوحة الإدارة
        </div>
        <nav aria-label="تنقّل لوحة الإدارة" className="flex-1 space-y-1 p-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-600 hover:bg-brand-50 hover:text-brand-700"
            >
              <item.icon className="h-4.5 w-4.5" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <Link
            href="/"
            className="block rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100"
          >
            العودة للموقع
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4.5 w-4.5" aria-hidden="true" />
              تسجيل الخروج
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
          <span className="font-black text-ink">لوحة الإدارة</span>
          <Link href="/" className="text-xs font-bold text-brand-600">
            العودة للموقع
          </Link>
        </header>
        <nav aria-label="تنقّل لوحة الإدارة للجوال" className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 lg:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="p-4 sm:p-6 lg:p-8">
          <p className="sr-only">مرحبًا {admin.fullName}</p>
          {children}
        </main>
      </div>
    </div>
  );
}
