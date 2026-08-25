"use client";

import { useState } from "react";
import type { ChildCharacter, ChildCharacterStage, Sponsor } from "@/lib/types";
import { emptyWizardState, type WizardState } from "@/lib/wizard-types";
import { WizardHeader, WizardNav } from "./WizardShell";
import { StepSponsor } from "./StepSponsor";
import { StepPeriod } from "./StepPeriod";
import { StepNumbers } from "./StepNumbers";
import { StepJourney } from "./StepJourney";
import { StepStories } from "./StepStories";
import { StepPreview } from "./StepPreview";
import { StepPublish } from "./StepPublish";

export function ReportWizard({
  sponsors,
  characters,
  initialState,
}: {
  sponsors: Sponsor[];
  characters: (ChildCharacter & { stages: ChildCharacterStage[] })[];
  initialState?: WizardState;
}) {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(initialState ?? emptyWizardState());

  const update = (updater: (s: WizardState) => WizardState) => setState(updater);

  const canProceed = (() => {
    switch (step) {
      case 0:
        return state.sponsorMode === "existing" ? Boolean(state.sponsorId) : Boolean(state.newSponsor.full_name);
      case 1:
        return Boolean(state.title && state.child_alias_name && state.child_character_id);
      default:
        return true;
    }
  })();

  return (
    <div>
      <WizardHeader step={step} />

      <div className="rounded-xl2 border border-forest-100 bg-white p-6 shadow-card sm:p-8">
        {step === 0 ? <StepSponsor state={state} setState={update} sponsors={sponsors} /> : null}
        {step === 1 ? <StepPeriod state={state} setState={update} characters={characters} /> : null}
        {step === 2 ? <StepNumbers state={state} setState={update} /> : null}
        {step === 3 ? <StepJourney state={state} setState={update} /> : null}
        {step === 4 ? <StepStories state={state} setState={update} /> : null}
        {step === 5 ? <StepPreview state={state} sponsors={sponsors} characters={characters} /> : null}
        {step === 6 ? <StepPublish state={state} /> : null}

        {step < 6 ? (
          <WizardNav
            step={step}
            onBack={() => setStep((s) => Math.max(0, s - 1))}
            onNext={() => setStep((s) => Math.min(6, s + 1))}
            nextLabel={step === 5 ? "التالي: نشر التقرير" : "التالي"}
            nextDisabled={!canProceed}
          />
        ) : null}
      </div>
    </div>
  );
}
