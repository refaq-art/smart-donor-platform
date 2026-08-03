import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/app-shell";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const org = await prisma.organization.findFirst();

  const now = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + 14);

  const [upcomingDeadlines, missingInfoApps] = await Promise.all([
    prisma.fundingOpportunity.count({
      where: { status: { not: "مغلقة" }, deadline: { gte: now, lte: soon } },
    }),
    prisma.grantApplication.count({ where: { status: "مطلوب استكمال" } }),
  ]);

  return (
    <AppShell
      userName={session.name}
      userRole={session.role}
      orgName={org?.name || "منصة إدارة المنح"}
      alertCount={upcomingDeadlines + missingInfoApps}
    >
      {children}
    </AppShell>
  );
}
