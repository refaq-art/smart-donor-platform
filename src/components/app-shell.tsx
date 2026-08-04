"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV_ITEMS } from "@/lib/nav";
import { ROLE_LABELS } from "@/lib/roles";
import { logoutAction } from "@/app/actions/auth";
import { Menu, X, LogOut, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AppShell({
  children,
  userName,
  userRole,
  orgName,
  alertCount,
}: {
  children: React.ReactNode;
  userName: string;
  userRole: string;
  orgName: string;
  alertCount: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items = NAV_ITEMS.filter((i) => !i.adminOnly || userRole === "ADMIN");

  return (
    <div className="min-h-screen bg-surface">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-40 w-72 transform bg-gradient-to-b from-brand-900 via-brand-800 to-brand-950 text-white transition-transform md:translate-x-0",
          open ? "translate-x-0" : "translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col p-5">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gold-400 text-lg font-black text-brand-900">
                م
              </div>
              <div>
                <p className="text-sm font-black leading-tight">منصة إدارة المنح</p>
                <p className="text-[11px] text-brand-200">{orgName}</p>
              </div>
            </div>
            <button
              className="text-brand-100 md:hidden"
              onClick={() => setOpen(false)}
              aria-label="إغلاق القائمة"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 space-y-1">
            {items.map((item) => {
              const active =
                pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition",
                    active ? "bg-white/15 text-white" : "text-brand-100 hover:bg-white/10"
                  )}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 rounded-2xl bg-white/10 p-4">
            <p className="text-xs font-bold text-brand-100">{userName}</p>
            <p className="text-[11px] text-brand-300">{ROLE_LABELS[userRole] || userRole}</p>
            <form action={logoutAction} className="mt-3">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-bold text-white hover:bg-white/15"
              >
                <LogOut size={14} />
                تسجيل الخروج
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="md:mr-72">
        <header className="no-print sticky top-0 z-20 flex items-center justify-between border-b border-brand-100 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
          <button
            className="rounded-lg border border-slate-200 p-2 text-brand-700 md:hidden"
            onClick={() => setOpen(true)}
            aria-label="فتح القائمة"
          >
            <Menu size={20} />
          </button>
          <div className="hidden text-sm font-bold text-slate-500 md:block" suppressHydrationWarning>
            {new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            }).format(new Date())}
          </div>
          <Link
            href="/dashboard"
            className="relative flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-bold text-brand-700 hover:bg-brand-50"
          >
            <Bell size={16} />
            تنبيهات
            {alertCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-red-600 text-[10px] font-black text-white">
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            )}
          </Link>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
