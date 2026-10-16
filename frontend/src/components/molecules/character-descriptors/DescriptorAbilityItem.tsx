import { useState, type KeyboardEvent } from "react";
import { Box, Collapse, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { customStyles } from "@/theme/morkBorgTheme";
import { type Ability } from "@/hooks/models";
import AbilityReferenceTable from "./AbilityReferenceTable";
import { ABILITY_ROTATIONS } from "@components/character-descriptors/abilityRotations";
import { getTextLimitMessage } from "@/validation/characterUpdate";
import { useValidationAlert } from "@/hooks/useValidationAlert";

interface DescriptorAbilityItemProps {
  ability: Ability;
  index: number;
  onUpdateComment: (comment: string) => void;
}

export default function DescriptorAbilityItem({
  ability,
  index,
  onUpdateComment,
}: DescriptorAbilityItemProps) {
  const { t } = useTranslation();
  const hasComment = Boolean(ability.comment);
  const [showComment, setShowComment] = useState(hasComment);
  const [commentErrorMessage, setCommentErrorMessage] = useState<string | null>(
    null,
  );
  useValidationAlert(commentErrorMessage);
  const rotate = ABILITY_ROTATIONS[index % ABILITY_ROTATIONS.length];

  const toggleComment = () => {
    if (showComment && !ability.comment) {
      setShowComment(false);
    } else if (!showComment) {
      setShowComment(true);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleComment();
    }
  };

  return (
    <Box
      sx={customStyles.characterDescriptors.abilityItem(rotate)}
      onClick={toggleComment}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={ability.name || t("abilities.ability", "Ability")}
      aria-expanded={showComment}
    >
      <Typography sx={customStyles.characterDescriptors.abilityIndex}>
        {index + 1}
      </Typography>
      <Box sx={customStyles.characterDescriptors.abilityContent}>
        <Typography sx={customStyles.characterDescriptors.abilityName}>
          {ability.name}
        </Typography>
        {ability.description && (
          <Typography sx={customStyles.characterDescriptors.abilityDescription}>
            {ability.description}
          </Typography>
        )}

        {ability.table && <AbilityReferenceTable table={ability.table} />}

        <Collapse in={showComment}>
          <TextField
            fullWidth
            multiline
            size="small"
            value={ability.comment || ""}
            onChange={(event) => {
              const nextValue = event.target.value;
              const nextError = getTextLimitMessage(
                t,
                "abilityComment",
                nextValue,
              );
              setCommentErrorMessage(nextError);
              if (nextError) {
                return;
              }
              onUpdateComment(nextValue);
            }}
            error={Boolean(commentErrorMessage)}
            placeholder={t("modifiers.commentPlaceholder")}
            variant="standard"
            sx={customStyles.characterDescriptors.abilityComment}
            inputProps={{ "data-testid": `ability-comment-${index}-input` }}
            onClick={(event) => event.stopPropagation()}
          />
        </Collapse>
      </Box>
    </Box>
  );
}
