import { requireLmSessionPage } from "@/lib/lm/authz";
import { prisma } from "@/lib/prisma";
import { PageHeader, LinkButton, EmptyState } from "@/components/lm/ui";
import { TransactionTypeAndForm } from "@/components/lm/transaction-form";
import { UserPlus } from "lucide-react";

export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const session = await requireLmSessionPage();
  const { customerId } = await searchParams;

  const customers = await prisma.lmCustomer.findMany({
    where: { userId: session.userId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  if (customers.length === 0) {
    return (
      <div className="mx-auto max-w-lg">
        <PageHeader title="عملية جديدة" />
        <EmptyState
          icon={UserPlus}
          title="أضف عميلًا أولًا"
          description="تحتاج عميلًا واحدًا على الأقل قبل إنشاء عملية."
          action={<LinkButton href="/installments/customers/new">إضافة عميل</LinkButton>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="عملية جديدة" subtitle="اختر نوع العملية ثم أدخل التفاصيل" />
      <TransactionTypeAndForm customers={customers} defaultCustomerId={customerId} />
    </div>
  );
}
