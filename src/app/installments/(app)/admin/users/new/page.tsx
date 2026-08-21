import { PageHeader, Card } from "@/components/lm/ui";
import { AdminCreateUserForm } from "@/components/lm/admin-user-form";
import { adminCreateUserAction } from "@/app/actions/lm/admin";

export default function AdminNewUserPage() {
  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="إنشاء مستخدم جديد" />
      <Card>
        <AdminCreateUserForm action={adminCreateUserAction} />
      </Card>
    </div>
  );
}
