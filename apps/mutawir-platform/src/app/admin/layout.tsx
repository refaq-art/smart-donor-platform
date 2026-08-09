import { requireUser } from "@/lib/auth";
import { AppShell, type NavItem } from "@/components/app-shell";

const NAV: NavItem[] = [
  { href: "/admin", label: "نظرة عامة" },
  { href: "/admin/organizations", label: "الجمعيات" },
  { href: "/admin/users", label: "المستخدمون" },
  { href: "/admin/framework", label: "إطار القياس" },
  { href: "/admin/activity", label: "سجل النشاط" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["ADMIN"]);
  return (
    <AppShell navItems={NAV} userName={user.name} roleLabel="مدير النظام">
      {children}
    </AppShell>
  );
}
