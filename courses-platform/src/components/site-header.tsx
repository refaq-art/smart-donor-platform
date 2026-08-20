import { getSession } from "@/lib/auth";
import { HeaderNav } from "@/components/header-nav";

export async function SiteHeader() {
  const session = await getSession();
  return (
    <HeaderNav user={session ? { fullName: session.fullName, role: session.role } : null} />
  );
}
