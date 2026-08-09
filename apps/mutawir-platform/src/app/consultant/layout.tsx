import { requireUser } from "@/lib/auth";
import { AppShell, type NavItem } from "@/components/app-shell";

const NAV: NavItem[] = [
  { href: "/consultant", label: "لوحة الجمعيات" },
  { href: "/consultant/work", label: "ماذا يحتاج تدخلي اليوم؟" },
  { href: "/consultant/notifications", label: "التنبيهات" },
];

export default async function ConsultantLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["CONSULTANT"]);
  return (
    <AppShell navItems={NAV} userName={user.name} roleLabel="حساب المستشار">
      {children}
    </AppShell>
  );
}
