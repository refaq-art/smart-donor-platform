import { notFound } from "next/navigation";
import { getSponsor } from "@/lib/data/admin";
import { updateSponsor } from "@/app/actions/sponsors";
import { SponsorForm } from "@/components/admin/SponsorForm";

export default async function EditSponsorPage({ params }: { params: { id: string } }) {
  const sponsor = await getSponsor(params.id);
  if (!sponsor) notFound();

  const action = updateSponsor.bind(null, sponsor.id);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-forest-900">تعديل بيانات الكافل</h1>
      <SponsorForm action={action} sponsor={sponsor} />
    </div>
  );
}
