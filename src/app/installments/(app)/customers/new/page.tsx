import { requireLmSessionPage } from "@/lib/lm/authz";
import { PageHeader, Card } from "@/components/lm/ui";
import { CustomerForm } from "@/components/lm/customer-form";
import { createCustomerAction } from "@/app/actions/lm/customers";

export default async function NewCustomerPage() {
  await requireLmSessionPage();

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="عميل جديد" subtitle="أدخل اسم العميل فقط — بدون تعقيد" />
      <Card>
        <CustomerForm action={createCustomerAction} />
      </Card>
    </div>
  );
}
