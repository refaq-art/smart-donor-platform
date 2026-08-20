"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { GraduationCap, LayoutDashboard, LogOut, Menu, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/app/actions/auth";

type HeaderUser = { fullName: string; role: string } | null;

const NAV_LINKS = [
  { href: "/", label: "الرئيسية" },
  { href: "/courses", label: "الدورات" },
];

export function HeaderNav({ user }: { user: HeaderUser }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-black text-ink">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-lg">منصّة الدورات</span>
        </Link>

        <nav aria-label="التنقّل الرئيسي" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3.5 py-2 text-sm font-bold transition",
                pathname === link.href
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-ink hover:bg-slate-50"
              >
                <User className="h-4 w-4" aria-hidden="true" />
                {user.fullName}
              </button>
              {userMenuOpen && (
                <div
                  role="menu"
                  className="absolute left-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-card"
                  onMouseLeave={() => setUserMenuOpen(false)}
                >
                  <Link
                    href="/account/my-courses"
                    role="menuitem"
                    className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    دوراتي
                  </Link>
                  <Link
                    href="/account/profile"
                    role="menuitem"
                    className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    الملف الشخصي
                  </Link>
                  {user.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      role="menuitem"
                      className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                      لوحة الإدارة
                    </Link>
                  )}
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      role="menuitem"
                      className="flex w-full items-center gap-1.5 border-t border-slate-100 px-4 py-2.5 text-right text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      تسجيل الخروج
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                تسجيل الدخول
              </Link>
              <Link href="/register" className="btn-primary">
                إنشاء حساب
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-label="فتح القائمة"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <nav aria-label="التنقّل للجوال" className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  href="/account/my-courses"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  دوراتي
                </Link>
                <Link
                  href="/account/profile"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  الملف الشخصي
                </Link>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    لوحة الإدارة
                  </Link>
                )}
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="w-full rounded-lg px-3 py-2.5 text-right text-sm font-bold text-red-600 hover:bg-red-50"
                  >
                    تسجيل الخروج
                  </button>
                </form>
              </>
            ) : (
              <div className="mt-2 flex flex-col gap-2">
                <Link href="/login" className="btn-secondary w-full" onClick={() => setMobileOpen(false)}>
                  تسجيل الدخول
                </Link>
                <Link href="/register" className="btn-primary w-full" onClick={() => setMobileOpen(false)}>
                  إنشاء حساب
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
