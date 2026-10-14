import type { ClassAbilityDraft } from "@/api/characterImprovementTypes";

export type ClassAbilitySectionProps = {
  classAbility: Exclude<ClassAbilityDraft, { kind: "none" }>;
  busy: boolean;
  abilityName: (key: string) => string;
  onReroll: () => void;
  onToggle: (index: number, reroll: boolean) => void;
};
