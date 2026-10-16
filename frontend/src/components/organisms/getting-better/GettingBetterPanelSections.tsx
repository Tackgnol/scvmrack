import {
  Box,
  MenuItem,
  Select,
  TextField,
  Typography,
  type SelectChangeEvent,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import type {
  AbilityStat,
  ImprovementDraft,
  ImprovementRerollSection,
} from "@/api/characterImprovementTypes";
import { ABILITY_STATS } from "@/utils/stats";
import { gettingBetterStyles as styles } from "./GettingBetterPanel.styles";
import { ClassAbilitySection } from "./ClassAbilitySection";
import { SectionButton } from "./SectionButton";
import {
  deriveAbility,
  deriveDebris,
  deriveHp,
  numberValue,
  SCROLL_ROLLS,
  scrollKey,
  tableRoll,
} from "./gettingBetterDraft";

type Props = {
  draft: ImprovementDraft;
  busy: boolean;
  abilityName: (key: string) => string;
  scrollName: (key: string) => string;
  updateDraft: (updater: (draft: ImprovementDraft) => ImprovementDraft) => void;
  rerollSection: (section: ImprovementRerollSection) => void;
};

export function GettingBetterPanelSections({
  draft,
  busy,
  abilityName,
  scrollName,
  updateDraft,
  rerollSection,
}: Props) {
  const { t } = useTranslation();

  const setHpCheck = (value: string) => {
    updateDraft((current) => ({
      ...current,
      hp: deriveHp(current.hp, numberValue(value)),
    }));
  };

  const setHpIncrease = (value: string) => {
    updateDraft((current) => ({
      ...current,
      hp: deriveHp(
        current.hp,
        current.hp.check.total,
        Math.max(1, numberValue(value)),
      ),
    }));
  };

  const setDebrisRoll = (value: string) => {
    updateDraft((current) => ({
      ...current,
      debris: deriveDebris(current.debris, numberValue(value)),
    }));
  };

  const setDebrisSilver = (value: string) => {
    updateDraft((current) => {
      if (current.debris.kind !== "silver") {
        return current;
      }
      const silver = tableRoll(numberValue(value));
      return {
        ...current,
        debris: { ...current.debris, silver, amount: silver.total },
      };
    });
  };

  const setDebrisScroll = (value: string) => {
    updateDraft((current) => {
      if (
        current.debris.kind !== "sacredScroll" &&
        current.debris.kind !== "uncleanScroll"
      ) {
        return current;
      }
      const total = Math.max(1, Math.min(10, numberValue(value)));
      const kind =
        current.debris.kind === "sacredScroll" ? "sacred" : "unclean";
      return {
        ...current,
        debris: {
          ...current.debris,
          scroll: tableRoll(total),
          itemKey: scrollKey(kind, total),
        },
      };
    });
  };

  const setDebrisItemKey = (event: SelectChangeEvent<string>) => {
    updateDraft((current) => {
      if (
        current.debris.kind !== "sacredScroll" &&
        current.debris.kind !== "uncleanScroll"
      ) {
        return current;
      }
      return {
        ...current,
        debris: { ...current.debris, itemKey: event.target.value },
      };
    });
  };

  const setAbilityRoll = (stat: AbilityStat, value: string) => {
    updateDraft((current) => ({
      ...current,
      abilities: {
        ...current.abilities,
        [stat]: deriveAbility(current.abilities[stat], numberValue(value)),
      },
    }));
  };

  const setSpecialtyReroll = (index: number, reroll: boolean) => {
    updateDraft((current) => {
      if (current.classAbility.kind !== "specialties") {
        return current;
      }
      return {
        ...current,
        classAbility: {
          ...current.classAbility,
          specialties: current.classAbility.specialties.map((choice, at) =>
            at === index ? { ...choice, reroll } : choice,
          ),
        },
      };
    });
  };

  const rerollLabel = t("gettingBetter.actions.rerollSection", "Reroll");

  return (
    <Box sx={styles.sectionGrid}>
      <Box sx={styles.section}>
        <Box sx={styles.sectionHeader}>
          <Typography sx={styles.sectionTitle}>
            {t("gettingBetter.hp.title", "HP")}
          </Typography>
          <SectionButton
            label={rerollLabel}
            onClick={() => rerollSection("hp")}
            disabled={busy}
          />
        </Box>
        <Box sx={styles.factGrid}>
          <Typography sx={styles.label}>
            {t("gettingBetter.hp.check", "6d10 check")}
          </Typography>
          <TextField
            type="number"
            value={draft.hp.check.total}
            onChange={(event) => setHpCheck(event.target.value)}
            sx={styles.input}
            inputProps={{
              min: 0,
              max: 60,
              "aria-label": t("gettingBetter.hp.check", "6d10 check"),
            }}
          />
          <Typography sx={styles.label}>
            {t("gettingBetter.hp.currentMax", "Current max")}
          </Typography>
          <Typography sx={styles.value}>{draft.hp.fromMaxHp}</Typography>
          <Typography sx={styles.label}>
            {t("gettingBetter.hp.result", "Result")}
          </Typography>
          <Typography sx={styles.value}>
            {draft.hp.succeeds
              ? t("gettingBetter.hp.success", "+{{value}} max", {
                  value: draft.hp.increase?.total ?? 0,
                })
              : t("gettingBetter.hp.noChange", "No change")}
          </Typography>
          {draft.hp.succeeds && (
            <>
              <Typography sx={styles.label}>
                {t("gettingBetter.hp.increase", "d6 increase")}
              </Typography>
              <TextField
                type="number"
                value={draft.hp.increase?.total ?? 1}
                onChange={(event) => setHpIncrease(event.target.value)}
                sx={styles.input}
                inputProps={{
                  min: 1,
                  max: 6,
                  "aria-label": t("gettingBetter.hp.increase", "d6 increase"),
                }}
              />
            </>
          )}
          <Typography sx={styles.label}>
            {t("gettingBetter.hp.finalMax", "Final max")}
          </Typography>
          <Typography sx={styles.value}>{draft.hp.toMaxHp}</Typography>
        </Box>
      </Box>

      <Box sx={styles.section}>
        <Box sx={styles.sectionHeader}>
          <Typography sx={styles.sectionTitle}>
            {t("gettingBetter.debris.title", "Debris")}
          </Typography>
          <SectionButton
            label={rerollLabel}
            onClick={() => rerollSection("debris")}
            disabled={busy}
          />
        </Box>
        <Box sx={styles.factGrid}>
          <Typography sx={styles.label}>
            {t("gettingBetter.debris.roll", "d6 roll")}
          </Typography>
          <TextField
            type="number"
            value={draft.debris.roll.total}
            onChange={(event) => setDebrisRoll(event.target.value)}
            sx={styles.input}
            inputProps={{
              min: 1,
              max: 6,
              "aria-label": t("gettingBetter.debris.roll", "d6 roll"),
            }}
          />
          <Typography sx={styles.label}>
            {t("gettingBetter.debris.kind", "Find")}
          </Typography>
          <Typography sx={styles.value}>
            {t(`gettingBetter.debris.${draft.debris.kind}`, draft.debris.kind)}
          </Typography>
          {draft.debris.kind === "silver" && (
            <>
              <Typography sx={styles.label}>
                {t("gettingBetter.debris.silver", "3d10 silver")}
              </Typography>
              <TextField
                type="number"
                value={draft.debris.amount}
                onChange={(event) => setDebrisSilver(event.target.value)}
                sx={styles.input}
                inputProps={{
                  min: 0,
                  max: 30,
                  "aria-label": t("gettingBetter.debris.silver", "3d10 silver"),
                }}
              />
            </>
          )}
          {(draft.debris.kind === "sacredScroll" ||
            draft.debris.kind === "uncleanScroll") && (
            <>
              <Typography sx={styles.label}>
                {t("gettingBetter.debris.scrollRoll", "Scroll roll")}
              </Typography>
              <TextField
                type="number"
                value={draft.debris.scroll.total}
                onChange={(event) => setDebrisScroll(event.target.value)}
                sx={styles.input}
                inputProps={{
                  min: 1,
                  max: 10,
                  "aria-label": t(
                    "gettingBetter.debris.scrollRoll",
                    "Scroll roll",
                  ),
                }}
              />
              <Typography sx={styles.label}>
                {t("gettingBetter.debris.scroll", "Scroll")}
              </Typography>
              <Select
                size="small"
                value={draft.debris.itemKey}
                onChange={setDebrisItemKey}
                sx={styles.select}
              >
                {SCROLL_ROLLS.map((roll) => {
                  const kind =
                    draft.debris.kind === "sacredScroll" ? "sacred" : "unclean";
                  const key = scrollKey(kind, roll);
                  return (
                    <MenuItem key={key} value={key}>
                      {scrollName(key)}
                    </MenuItem>
                  );
                })}
              </Select>
            </>
          )}
        </Box>
      </Box>

      <Box sx={styles.section}>
        <Box sx={styles.sectionHeader}>
          <Typography sx={styles.sectionTitle}>
            {t("gettingBetter.abilities.title", "Abilities")}
          </Typography>
          <SectionButton
            label={rerollLabel}
            onClick={() => rerollSection("abilities")}
            disabled={busy}
          />
        </Box>
        <Box sx={{ display: "grid", gap: 1 }}>
          {ABILITY_STATS.map((stat) => {
            const ability = draft.abilities[stat];
            return (
              <Box key={stat} sx={styles.factGrid}>
                <Typography sx={styles.label}>
                  {t(`abilities.${stat}`, stat)}
                </Typography>
                <TextField
                  type="number"
                  value={ability.roll.total}
                  onChange={(event) => setAbilityRoll(stat, event.target.value)}
                  sx={styles.input}
                  inputProps={{
                    min: 1,
                    max: 6,
                    "aria-label": t(`abilities.${stat}`, stat),
                  }}
                />
                <Typography sx={styles.muted}>
                  {t("gettingBetter.abilities.from", "From {{value}}", {
                    value: ability.fromModifier,
                  })}
                </Typography>
                <Typography sx={styles.value}>
                  {ability.toModifier >= 0 ? "+" : ""}
                  {ability.toModifier} / {ability.toScore}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {draft.classAbility.kind !== "none" && (
        <ClassAbilitySection
          classAbility={draft.classAbility}
          busy={busy}
          abilityName={abilityName}
          onReroll={() => rerollSection("classAbility")}
          onToggle={setSpecialtyReroll}
        />
      )}
    </Box>
  );
}
