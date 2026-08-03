import { PageHeader } from "@/components/ui-bits";
import DonorForm from "@/components/donor-form";
import { createDonorAction } from "@/app/actions/donors";
import { getSession } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function NewDonorPage() {
  const session = await getSession();
  if (!canEdit(session?.role)) redirect("/donors");

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="إضافة جهة مانحة" subtitle="سجّل بيانات الجهة المانحة وطريقة التواصل معها" />
      <DonorForm action={createDonorAction} submitLabel="حفظ الجهة" />
    </div>
  );
}
