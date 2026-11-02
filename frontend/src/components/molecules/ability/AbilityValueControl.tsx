import { ABILITY_SCORE_LIMITS, clampAbilityScore } from "@/utils/stats";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, IconButton, TextField, Typography } from "@mui/material";
import { customStyles } from "@/theme/morkBorgTheme";
import { useIntegerFieldBuffer } from "@/hooks/useIntegerFieldBuffer";

import type { AbilityValueControlProps } from "./AbilityValueControl.models";

export default function AbilityValueControl({
  value,
  label,
  onDecrease,
  onIncrease,
  onInputChange,
  decreaseAriaLabel,
  increaseAriaLabel,
}: AbilityValueControlProps) {
  const { t } = useTranslation();
  const limitHelpId = useId();
  const [showLimit, setShowLimit] = useState(false);
  const isLegacyScore = value > ABILITY_SCORE_LIMITS.max;
  const input = useIntegerFieldBuffer(
    value,
    onInputChange,
    ABILITY_SCORE_LIMITS,
    () => setShowLimit(true),
    isLegacyScore,
  );

  const adjust = (delta: number, onAdjust: () => boolean | void) => {
    const applied = onAdjust();
    setShowLimit(
      applied !== false && clampAbilityScore(value + delta) !== value + delta,
    );
  };

  return (
    <Box>
      <Box sx={customStyles.abilityCardTwo.controls}>
        <IconButton
          onClick={() => adjust(-1, onDecrease)}
          sx={customStyles.abilityAdjustButton}
          aria-label={decreaseAriaLabel}
        >
          <RemoveIcon fontSize="small" />
        </IconButton>

        <TextField
          type="text"
          inputMode="numeric"
          value={input.value}
          onChange={(event) => {
            setShowLimit(false);
            input.onChange(event);
          }}
          onBlur={() => {
            if (isLegacyScore) {
              setShowLimit(false);
            }
            input.onBlur();
          }}
          onKeyDown={input.onKeyDown}
          sx={customStyles.abilityValueInput}
          size="small"
          inputProps={{
            "aria-label": label,
            "aria-describedby": showLimit ? limitHelpId : undefined,
          }}
        />

        <IconButton
          onClick={() => adjust(1, onIncrease)}
          sx={customStyles.abilityAdjustButton}
          aria-label={increaseAriaLabel}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Box>
      <Typography
        role="status"
        id={limitHelpId}
        component="p"
        variant="caption"
        sx={{ textAlign: "center" }}
      >
        {showLimit
          ? t(
              "attributes.scoreLimits",
              "Scores are limited to {{min}}–{{max}}.",
              ABILITY_SCORE_LIMITS,
            )
          : null}
      </Typography>
    </Box>
  );
}
