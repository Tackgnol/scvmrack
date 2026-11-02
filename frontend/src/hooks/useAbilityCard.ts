import { useState } from "react";
import type { PendingAbilityChange } from "./useAbilityCard.models";
import { useCharacter } from "@/CharacterContext/CharacterContext";
import {
  ABILITY_SCORE_LIMITS,
  clampAbilityScore,
  statToModifier,
} from "@/utils/stats";
import { useTranslation } from "react-i18next";
import { type AbilityName } from "@components/abilities/types";

export function useAbilityCard(ability: AbilityName) {
  const { character, updateField } = useCharacter();
  const { t } = useTranslation();
  const [pendingChange, setPendingChange] =
    useState<PendingAbilityChange | null>(null);

  const value = character?.[ability] ?? 10;
  const label = t(`attributes.${ability}`);
  const description = t(`attributes.${ability}Desc`);
  const modifier = statToModifier(value);
  const characterKey = character?.id ?? "unknown";
  const pendingValue =
    pendingChange?.characterKey === characterKey &&
    pendingChange.ability === ability &&
    pendingChange.fromScore === value
      ? pendingChange.toScore
      : null;

  const setAbilityValue = (nextValue: number) => {
    if (pendingValue !== null) {
      return false;
    }
    const clamped = clampAbilityScore(nextValue);
    if (value > ABILITY_SCORE_LIMITS.max) {
      setPendingChange({
        characterKey,
        ability,
        fromScore: value,
        toScore: clamped,
      });
      return false;
    }
    updateField(ability, clamped);
    return true;
  };

  const adjustAbility = (delta: number) => {
    return setAbilityValue(value + delta);
  };

  const setAbilityFromInput = (rawValue: string) => {
    const parsed = parseInt(rawValue, 10);
    return setAbilityValue(Number.isNaN(parsed) ? 10 : parsed);
  };

  return {
    value,
    label,
    description,
    modifier,
    characterKey,
    pendingValue,
    cancelAbilityChange: () => setPendingChange(null),
    confirmAbilityChange: () => {
      setPendingChange(null);
      if (pendingValue !== null) {
        updateField(ability, pendingValue);
      }
    },
    adjustAbility,
    setAbilityFromInput,
    // `context` lets a locale override the label where the stat name declines (pl: "Siłę").
    decreaseAriaLabel: t("common.decreaseStat", "Decrease {{stat}}", {
      stat: label,
      context: ability,
    }),
    increaseAriaLabel: t("common.increaseStat", "Increase {{stat}}", {
      stat: label,
      context: ability,
    }),
  };
}
