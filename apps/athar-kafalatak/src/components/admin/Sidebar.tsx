"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FileText, PlusCircle, LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "لوحة المؤشرات", icon: LayoutDashboard, exact: true },
  { href: "/admin/sponsors", label: "الكفلاء", icon: Users },
  { href: "/admin/reports", label: "التقارير", icon: FileText },
  { href: "/admin/reports/new", label: "تقرير أثر جديد", icon: PlusCircle },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-dvh w-64 shrink-0 flex-col border-l border-forest-100 bg-white">
      <div className="border-b border-forest-100 p-5">
        <span className="text-lg font-extrabold text-forest-900">أثر كفالتك</span>
        <p className="mt-0.5 text-xs text-forest-400">لوحة الإدارة</p>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl2 px-4 py-2.5 text-sm font-semibold transition-colors",
                active ? "bg-forest text-white" : "text-forest-600 hover:bg-forest-50"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <form action={signOut} className="border-t border-forest-100 p-3">
        <button className="flex w-full items-center gap-3 rounded-xl2 px-4 py-2.5 text-sm font-semibold text-forest-500 hover:bg-forest-50">
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </button>
      </form>
    </aside>
  );
}
