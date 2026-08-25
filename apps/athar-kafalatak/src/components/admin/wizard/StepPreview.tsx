import type { ChildCharacter, ChildCharacterStage, Sponsor } from "@/lib/types";
import type { WizardState } from "@/lib/wizard-types";
import { SummaryReport } from "@/components/report/SummaryReport";
import { buildPreviewData } from "./build-preview";

export function StepPreview({
  state,
  sponsors,
  characters,
}: {
  state: WizardState;
  sponsors: Sponsor[];
  characters: (ChildCharacter & { stages: ChildCharacterStage[] })[];
}) {
  const data = buildPreviewData(state, sponsors, characters);

  return (
    <div className="overflow-hidden rounded-xl2 border border-forest-100 shadow-card">
      <div className="border-b border-forest-100 bg-forest-50 px-4 py-2 text-center text-xs font-bold text-forest-500">
        معاينة — هكذا سيظهر ملخص التقرير للكافل
      </div>
      <div className="max-h-[70vh] overflow-y-auto">
        <SummaryReport data={data} hideActions />
      </div>
    </div>
  );
}
