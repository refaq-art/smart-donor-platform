import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { SiteFooter } from "@/components/footer";
import { LogoutButton } from "@/components/logout-button";

export type NavItem = { href: string; label: string };

export function AppShell({
  navItems,
  userName,
  roleLabel,
  children,
}: {
  navItems: NavItem[];
  userName: string;
  roleLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-row">
      <aside className="sticky top-0 flex h-screen w-44 shrink-0 flex-col overflow-y-auto border-l border-slate-200 bg-white sm:w-56 md:w-64">
        <div className="border-b border-slate-100 p-3 md:p-4">
          <BrandMark />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-2 md:p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-navy-50 hover:text-navy-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-3 md:p-4">
          <div className="mb-2 text-sm">
            <div className="font-semibold text-slate-800">{userName}</div>
            <div className="text-xs text-slate-500">{roleLabel}</div>
          </div>
          <LogoutButton />
        </div>
      </aside>
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <main className="flex-1 overflow-x-hidden p-4 md:p-8">{children}</main>
        <SiteFooter />
      </div>
    </div>
  );
}
