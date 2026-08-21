import { requireLmSessionPage, requireOwnedCustomer } from "@/lib/lm/authz";
import { PageHeader, Card } from "@/components/lm/ui";
import { CustomerForm } from "@/components/lm/customer-form";
import { updateCustomerAction } from "@/app/actions/lm/customers";
import { notFound } from "next/navigation";

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireLmSessionPage();
  const { id } = await params;
  let customer;
  try {
    customer = await requireOwnedCustomer(id, session);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="تعديل بيانات العميل" />
      <Card>
        <CustomerForm action={updateCustomerAction.bind(null, id)} defaultName={customer.name} />
      </Card>
    </div>
  );
}
