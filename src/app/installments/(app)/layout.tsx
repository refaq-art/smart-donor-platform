import { requireLmSessionPage } from "@/lib/lm/authz";
import { LmShell } from "@/components/lm/shell";

export default async function LmAppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireLmSessionPage();

  return (
    <LmShell userName={session.name} isAdmin={session.role === "ADMIN"}>
      {children}
    </LmShell>
  );
}
