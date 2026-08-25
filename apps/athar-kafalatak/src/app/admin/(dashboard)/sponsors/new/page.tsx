import { createSponsor } from "@/app/actions/sponsors";
import { SponsorForm } from "@/components/admin/SponsorForm";

export default function NewSponsorPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-forest-900">إضافة كافل</h1>
      <SponsorForm action={createSponsor} />
    </div>
  );
}
