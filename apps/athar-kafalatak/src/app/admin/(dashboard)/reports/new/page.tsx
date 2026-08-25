import { listSponsors, getChildCharacters } from "@/lib/data/admin";
import { ReportWizard } from "@/components/admin/wizard/ReportWizard";

export const dynamic = "force-dynamic";

export default async function NewReportPage() {
  const [sponsors, characters] = await Promise.all([listSponsors(), getChildCharacters()]);

  return <ReportWizard sponsors={sponsors} characters={characters} />;
}
