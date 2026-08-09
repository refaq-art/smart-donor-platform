import { requireUser } from "@/lib/auth";
import { AppShell, type NavItem } from "@/components/app-shell";

const NAV: NavItem[] = [
  { href: "/org", label: "الرئيسية" },
  { href: "/org/profile", label: "بيانات الجمعية" },
  { href: "/org/assessment/pre", label: "التقييم القبلي" },
  { href: "/org/plan", label: "خطة التطوير والمهام" },
  { href: "/org/assessment/post", label: "التقييم البعدي" },
  { href: "/org/impact", label: "الأثر والمقارنة" },
  { href: "/org/notifications", label: "التنبيهات" },
];

export default async function OrgLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["ORG"]);
  return (
    <AppShell navItems={NAV} userName={user.organization?.name ?? user.name} roleLabel="حساب الجمعية">
      {children}
    </AppShell>
  );
}
