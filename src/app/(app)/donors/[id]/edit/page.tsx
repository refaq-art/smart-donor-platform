import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/authz";
import { canEdit } from "@/lib/roles";
import { PageHeader } from "@/components/ui-bits";
import DonorForm from "@/components/donor-form";
import { updateDonorAction } from "@/app/actions/donors";

export default async function EditDonorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  if (!canEdit(session?.role)) redirect(`/donors/${id}`);

  const donor = await prisma.donor.findFirst({ where: { id, organizationId: session!.organizationId } });
  if (!donor) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={`تعديل: ${donor.name}`} />
      <DonorForm
        action={updateDonorAction.bind(null, id)}
        submitLabel="حفظ التعديلات"
        defaults={{
          name: donor.name,
          type: donor.type || undefined,
          supportFields: donor.supportFields || undefined,
          fundingConditions: donor.fundingConditions || undefined,
          contactName: donor.contactName || undefined,
          phone: donor.phone || undefined,
          email: donor.email || undefined,
          city: donor.city || undefined,
          relationshipStatus: donor.relationshipStatus,
          notes: donor.notes || undefined,
        }}
      />
    </div>
  );
}
