import { requireUser } from "@/lib/auth";
import { AppShell, type NavItem } from "@/components/app-shell";

const NAV: NavItem[] = [{ href: "/council", label: "اللوحة الإشرافية" }];

export default async function CouncilLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["COUNCIL"]);
  return (
    <AppShell navItems={NAV} userName={user.name} roleLabel="مجلس الجمعيات">
      {children}
    </AppShell>
  );
}
