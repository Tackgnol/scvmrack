import { Box, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { gettingBetterStyles as styles } from "./GettingBetterPanel.styles";
import { SectionButton } from "./SectionButton";
import type { ClassAbilitySectionProps } from "./ClassAbilitySection.models";

export function ClassAbilitySection({
  classAbility,
  busy,
  abilityName,
  onReroll,
  onToggle,
}: ClassAbilitySectionProps) {
  const { t } = useTranslation();
  const noneLeft = t(
    "gettingBetter.classAbility.noneLeft",
    "No ability left to gain",
  );
  const takenOffers = new Set(
    classAbility.kind === "specialties"
      ? classAbility.specialties
          .filter((choice) => choice.reroll && choice.replacement)
          .map((choice) => choice.replacement!.key)
      : [],
  );

  return (
    <Box sx={styles.section} data-testid="class-ability-section">
      <Box sx={styles.sectionHeader}>
        <Typography sx={styles.sectionTitle}>
          {classAbility.kind === "newAbility"
            ? t("gettingBetter.classAbility.newTitle", "New ability")
            : t("gettingBetter.classAbility.specialtiesTitle", "Specialties")}
        </Typography>
        <SectionButton
          label={t("gettingBetter.actions.rerollSection", "Reroll")}
          onClick={onReroll}
          disabled={busy}
        />
      </Box>

      {classAbility.kind === "firstSpecialty" && (
        <Box sx={styles.specialtyGrid}>
          <Typography sx={styles.label}>
            {t("gettingBetter.classAbility.existing", "Your specialties")}
          </Typography>
          {classAbility.existing.map((slot) => (
            <Typography key={slot.key} sx={styles.specialtyValue}>
              {abilityName(slot.key)}
            </Typography>
          ))}
        </Box>
      )}

      {classAbility.kind !== "specialties" && (
        <Box sx={styles.specialtyGrid}>
          <Typography sx={styles.label}>
            {t("gettingBetter.classAbility.added", "Gained")}
          </Typography>
          <Typography sx={styles.specialtyValue}>
            {classAbility.added ? abilityName(classAbility.added.key) : noneLeft}
          </Typography>
        </Box>
      )}

      {classAbility.kind === "specialties" &&
        classAbility.specialties.map((choice, index) => (
          <Box key={choice.current.key} sx={styles.specialtyGrid}>
            <Typography sx={styles.specialtyValue}>
              {abilityName(choice.current.key)}
            </Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={choice.reroll ? "reroll" : "keep"}
              onChange={(_, value: "keep" | "reroll" | null) => {
                if (value) {
                  onToggle(index, value === "reroll");
                }
              }}
              disabled={busy}
              aria-label={abilityName(choice.current.key)}
            >
              <ToggleButton value="keep">
                {t("gettingBetter.classAbility.keep", "Keep")}
              </ToggleButton>
              <ToggleButton
                value="reroll"
                disabled={
                  !choice.replacement ||
                  (!choice.reroll && takenOffers.has(choice.replacement.key))
                }
              >
                {t("gettingBetter.classAbility.reroll", "Reroll")}
              </ToggleButton>
            </ToggleButtonGroup>
            <Typography sx={styles.muted}>
              {choice.replacement
                ? t("gettingBetter.classAbility.becomes", "Reroll gives {{name}}", {
                    name: abilityName(choice.replacement.key),
                  })
                : noneLeft}
            </Typography>
          </Box>
        ))}
    </Box>
  );
}

export default ClassAbilitySection;
