import { scopeOfExclude } from "@/components/modifiers/utils";
import type { AbilityModifierDraft } from "@/api/classes";
import { signed } from "@/utils/signed";
import type { TFunction } from "i18next";


/** A modifier as a chip: `+2 PRE tests`; a modifier on every roll leaves the scope out. */
export function modifierChip(t: TFunction, modifier: AbilityModifierDraft): string {
  const scope = scopeOfExclude(modifier.exclude);
  const stat = t(`creator.stats.short.${modifier.statistic}`);
  return [signed(modifier.value), stat, scope === "all" ? "" : t(`creator.abilities.scopeWord.${scope}`)]
    .filter(Boolean)
    .join(" ");
}
