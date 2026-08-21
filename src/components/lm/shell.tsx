"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Users, Receipt, PlusCircle, User, ShieldCheck, LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/lm/auth";

const NAV_ITEMS = [
  { href: "/installments/dashboard", label: "الرئيسية", icon: Home },
  { href: "/installments/customers", label: "العملاء", icon: Users },
  { href: "/installments/transactions", label: "العمليات", icon: Receipt },
  { href: "/installments/add", label: "إضافة", icon: PlusCircle },
  { href: "/installments/account", label: "الحساب", icon: User },
];

function isActive(pathname: string, href: string) {
  if (href === "/installments/dashboard") return pathname === href;
  return pathname.startsWith(href);
}

export function LmShell({
  userName,
  isAdmin,
  children,
}: {
  userName: string;
  isAdmin: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-6xl">
        {/* الشريط الجانبي — الشاشات الكبيرة فقط */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-l border-slate-200 bg-white p-5 md:flex">
          <div className="mb-8 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-600 text-lg font-black text-white">
              م
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">إدارة المهل والأقساط</p>
              <p className="text-xs text-slate-400">{userName}</p>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition",
                    active ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-100",
                  )}
                >
                  <item.icon size={19} />
                  {item.label}
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                href="/installments/admin"
                className={cn(
                  "mt-4 flex items-center gap-3 rounded-xl border border-dashed border-slate-300 px-3.5 py-3 text-sm font-bold transition",
                  pathname.startsWith("/installments/admin")
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100",
                )}
              >
                <ShieldCheck size={19} />
                لوحة الإدارة
              </Link>
            )}
          </nav>

          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold text-slate-500 transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={19} />
              تسجيل الخروج
            </button>
          </form>
        </aside>

        {/* المحتوى الرئيسي */}
        <main className="min-w-0 flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10">{children}</main>
      </div>

      {/* شريط سفلي — الجوال فقط */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] font-bold transition",
                active ? "text-emerald-700" : "text-slate-400",
              )}
            >
              <item.icon size={item.href === "/installments/add" ? 26 : 21} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
