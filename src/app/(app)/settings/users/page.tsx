import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/authz";
import { canManageUsers, ROLE_LABELS } from "@/lib/roles";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui-bits";
import UsersTable from "@/components/users-table";
import NewUserForm from "@/components/new-user-form";
import { createUserAction } from "@/app/actions/users";

export default async function UsersSettingsPage() {
  const session = await requireSession();
  if (!canManageUsers(session?.role)) redirect("/dashboard");

  const users = await prisma.user.findMany({
    where: { organizationId: session!.organizationId },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { createdApplications: true, assignedApplications: true } } },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="إدارة المستخدمين" subtitle="أضف موظفي الجمعية وحدد صلاحياتهم داخل المنصة" />

      <div className="mb-6">
        <NewUserForm action={createUserAction} />
      </div>

      <UsersTable users={users} currentUserId={session!.userId} roleLabels={ROLE_LABELS} />
    </div>
  );
}
