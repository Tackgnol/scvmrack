import {
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Select,
  TextField,
  Typography,
  type SelectChangeEvent,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  type AbilityStat,
  type ImprovementDebrisRoll,
  type ImprovementDraft,
  type RollValue,
} from "@/api/characterImprovement";
import type { GettingBetterPreviewController } from "@/hooks/useGettingBetterPreview";
import { statToModifier } from "@/utils/stats";
import { gettingBetterStyles as styles } from "./GettingBetterPanel.styles";

type PanelProps = {
  controller: GettingBetterPreviewController;
};

const ABILITY_STATS: AbilityStat[] = [
  "strength",
  "agility",
  "presence",
  "toughness",
];

const SCROLL_ROLLS = Array.from({ length: 10 }, (_, index) => index + 1);

function tableRoll(total: number): RollValue {
  return { source: "table", total };
}

function numberValue(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function modifierToCanonicalScore(modifier: number): number {
  if (modifier <= -3) return 4;
  if (modifier === -2) return 5;
  if (modifier === -1) return 7;
  if (modifier === 0) return 9;
  if (modifier === 1) return 13;
  if (modifier === 2) return 15;
  if (modifier === 3) return 17;
  if (modifier === 4) return 19;
  if (modifier === 5) return 20;
  return 21;
}

function deriveAbility(
  current: ImprovementDraft["abilities"][AbilityStat],
  rollTotal: number,
) {
  const fromModifier = statToModifier(current.fromScore);
  const boundedRoll = Math.max(1, Math.min(6, rollTotal));
  const nextModifier =
    fromModifier <= 1
      ? boundedRoll === 1
        ? Math.max(-3, fromModifier - 1)
        : Math.min(6, fromModifier + 1)
      : boundedRoll >= fromModifier
        ? Math.min(6, fromModifier + 1)
        : Math.max(-3, fromModifier - 1);

  return {
    ...current,
    roll: tableRoll(boundedRoll),
    fromModifier,
    toModifier: nextModifier,
    toScore: modifierToCanonicalScore(nextModifier),
    outcome:
      nextModifier > fromModifier
        ? "increase"
        : nextModifier < fromModifier
          ? "decrease"
          : "same",
  } as const;
}

function deriveHp(
  hp: ImprovementDraft["hp"],
  checkTotal: number,
  increaseTotal = hp.increase?.total ?? 1,
): ImprovementDraft["hp"] {
  const succeeds = checkTotal >= hp.fromMaxHp;
  const increase = succeeds
    ? tableRoll(increaseTotal)
    : null;
  return {
    ...hp,
    check: tableRoll(checkTotal),
    succeeds,
    increase,
    toMaxHp: succeeds ? hp.fromMaxHp + (increase?.total ?? 0) : hp.fromMaxHp,
  };
}

function scrollKey(kind: "sacred" | "unclean", roll: number): string {
  return `scroll.${kind}.${Math.max(1, Math.min(10, roll))}`;
}

function deriveDebris(
  debris: ImprovementDebrisRoll,
  rollTotal: number,
): ImprovementDebrisRoll {
  const roll = tableRoll(rollTotal);
  if (rollTotal <= 3) {
    return { roll, kind: "nothing" };
  }
  if (rollTotal === 4) {
    const silver =
      debris.kind === "silver"
        ? debris.silver
        : { source: "table" as const, total: 3 };
    return {
      roll,
      kind: "silver",
      silver,
      amount: silver.total,
    };
  }
  if (rollTotal === 5) {
    const scroll =
      debris.kind === "uncleanScroll"
        ? debris.scroll
        : { source: "table" as const, total: 1 };
    return {
      roll,
      kind: "uncleanScroll",
      scroll,
      itemKey: scrollKey("unclean", scroll.total),
    };
  }
  const scroll =
    debris.kind === "sacredScroll"
      ? debris.scroll
      : { source: "table" as const, total: 1 };
  return {
    roll,
    kind: "sacredScroll",
    scroll,
    itemKey: scrollKey("sacred", scroll.total),
  };
}

function sectionButton(
  label: string,
  onClick: () => void,
  disabled: boolean,
) {
  return (
    <Button
      size="small"
      variant="outlined"
      onClick={onClick}
      disabled={disabled}
      sx={styles.actionButton}
    >
      {label}
    </Button>
  );
}

export function GettingBetterPanel({ controller }: PanelProps) {
  const { t } = useTranslation();
  const draft = controller.workingDraft;
  const specialtyName = (key: string) => controller.preview?.scumSpecialtyNames?.[key] ?? key;
  const busy =
    controller.isLoadingPreview ||
    controller.isRerolling ||
    controller.isApplying;

  const updateDraft = (updater: (draft: ImprovementDraft) => ImprovementDraft) => {
    controller.setWorkingDraft((current) => (current ? updater(current) : current));
  };

  if (controller.isLoadingPreview && !draft) {
    return (
      <Box sx={styles.panel}>
        <Typography variant="h3" sx={styles.title}>
          {t("gettingBetter.title", "Get better")}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <CircularProgress size={24} />
          <Typography sx={styles.muted}>
            {t("gettingBetter.loading", "Rolling the table")}
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!draft) return null;

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
      if (current.debris.kind !== "silver") return current;
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
      const kind = current.debris.kind === "sacredScroll" ? "sacred" : "unclean";
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

  const setScumRerollMode = (event: SelectChangeEvent<string>) => {
    updateDraft((current) => {
      if (current.scumSpecialties.kind !== "laterImprovement") return current;
      return {
        ...current,
        scumSpecialties: {
          ...current.scumSpecialties,
          rerollMode: event.target.value as "none" | "primary" | "secondary" | "both",
        },
      };
    });
  };

  return (
    <Box sx={styles.panel} data-testid="getting-better-panel">
      <Typography variant="h3" sx={styles.title}>
        {t("gettingBetter.title", "Get better")}
      </Typography>

      <Box sx={styles.sectionGrid}>
        <Box sx={styles.section}>
          <Box sx={styles.sectionHeader}>
            <Typography sx={styles.sectionTitle}>
              {t("gettingBetter.hp.title", "HP")}
            </Typography>
            {sectionButton(
              t("gettingBetter.actions.rerollSection", "Reroll"),
              () => controller.rerollSection("hp"),
              busy,
            )}
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
              inputProps={{ min: 0, max: 60, "aria-label": t("gettingBetter.hp.check", "6d10 check") }}
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
                  inputProps={{ min: 1, max: 6, "aria-label": t("gettingBetter.hp.increase", "d6 increase") }}
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
            {sectionButton(
              t("gettingBetter.actions.rerollSection", "Reroll"),
              () => controller.rerollSection("debris"),
              busy,
            )}
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
              inputProps={{ min: 1, max: 6, "aria-label": t("gettingBetter.debris.roll", "d6 roll") }}
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
                  inputProps={{ min: 0, max: 30, "aria-label": t("gettingBetter.debris.silver", "3d10 silver") }}
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
                  inputProps={{ min: 1, max: 10, "aria-label": t("gettingBetter.debris.scrollRoll", "Scroll roll") }}
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
                        {key}
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
            {sectionButton(
              t("gettingBetter.actions.rerollSection", "Reroll"),
              () => controller.rerollSection("abilities"),
              busy,
            )}
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
                    inputProps={{ min: 1, max: 6, "aria-label": t(`abilities.${stat}`, stat) }}
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

        {draft.scumSpecialties.kind !== "notScum" && (
          <Box sx={styles.section}>
            <Box sx={styles.sectionHeader}>
              <Typography sx={styles.sectionTitle}>
                {t("gettingBetter.scum.title", "Scum specialty")}
              </Typography>
              {sectionButton(
                t("gettingBetter.actions.rerollSection", "Reroll"),
                () => controller.rerollSection("scumSpecialties"),
                busy,
              )}
            </Box>
            {draft.scumSpecialties.kind === "firstImprovement" ? (
              <Box sx={styles.factGrid}>
                <Typography sx={styles.label}>
                  {t("gettingBetter.scum.existing", "Existing")}
                </Typography>
                <Typography sx={styles.value}>
                  {specialtyName(draft.scumSpecialties.existing.key)}
                </Typography>
                <Typography sx={styles.label}>
                  {t("gettingBetter.scum.added", "Added")}
                </Typography>
                <Typography sx={styles.value}>
                  {specialtyName(draft.scumSpecialties.added.key)}
                </Typography>
              </Box>
            ) : (
              <Box sx={styles.factGrid}>
                <Typography sx={styles.label}>
                  {t("gettingBetter.scum.primary", "Primary")}
                </Typography>
                <Typography sx={styles.value}>
                  {specialtyName(draft.scumSpecialties.primary.key)}
                </Typography>
                <Typography sx={styles.label}>
                  {t("gettingBetter.scum.secondary", "Secondary")}
                </Typography>
                <Typography sx={styles.value}>
                  {specialtyName(draft.scumSpecialties.secondary.key)}
                </Typography>
                <Typography sx={styles.label}>
                  {t("gettingBetter.scum.rerollMode", "Mode")}
                </Typography>
                <Select
                  size="small"
                  value={draft.scumSpecialties.rerollMode}
                  onChange={setScumRerollMode}
                  sx={styles.select}
                >
                  {["none", "primary", "secondary", "both"].map((mode) => (
                    <MenuItem key={mode} value={mode}>
                      {t(`gettingBetter.scum.modes.${mode}`, mode)}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {controller.staleConflict && (
        <Box sx={styles.warning}>
          {t(
            "gettingBetter.stale",
            "This preview is stale. Reroll from the current sheet before applying.",
          )}
        </Box>
      )}

      <Box sx={styles.actionRow}>
        <Button
          variant="outlined"
          onClick={controller.undoEdits}
          disabled={busy || !controller.isDirty}
          sx={styles.actionButton}
        >
          {t("gettingBetter.actions.undo", "Undo edits")}
        </Button>
        <Button
          variant="outlined"
          onClick={() => controller.rerollSection("all")}
          disabled={busy}
          sx={styles.actionButton}
        >
          {controller.staleConflict
            ? t("gettingBetter.actions.rerollCurrent", "Reroll from current sheet")
            : t("gettingBetter.actions.rerollAll", "Reroll all")}
        </Button>
        <Button
          variant="outlined"
          onClick={controller.close}
          disabled={busy}
          sx={styles.actionButton}
        >
          {t("gettingBetter.actions.close", "Close")}
        </Button>
        <Button
          variant="contained"
          onClick={controller.apply}
          disabled={busy || !draft}
          sx={styles.applyButton}
        >
          {controller.isApplying
            ? t("gettingBetter.actions.applying", "Applying")
            : t("gettingBetter.actions.apply", "Apply getting better")}
        </Button>
      </Box>
    </Box>
  );
}

export default GettingBetterPanel;
