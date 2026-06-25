import { useState, type KeyboardEvent } from "react";
import { Box, Button, Collapse, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { customStyles } from "@/theme/morkBorgTheme";
import { type Ability } from "@/hooks/models";
import { DecoctionsModal } from "@components/index";
import { ABILITY_ROTATIONS } from "@components/character-descriptors/abilityRotations";
import { getTextLimitMessage } from "@/validation/characterUpdate";
import { useValidationAlert } from "@/hooks/useValidationAlert";

interface DescriptorAbilityItemProps {
  ability: Ability;
  index: number;
  onUpdateComment: (comment: string) => void;
  isOccultHerbmaster?: boolean;
}

const OCCULT_HERBMASTER_DECOCTIONS_KEY =
  "abilities.occult_herbmaster.decoctions";

export default function DescriptorAbilityItem({
  ability,
  index,
  onUpdateComment,
  isOccultHerbmaster,
}: DescriptorAbilityItemProps) {
  const { t } = useTranslation();
  const hasComment = Boolean(ability.comment);
  const [showComment, setShowComment] = useState(hasComment);
  const [showDecoctions, setShowDecoctions] = useState(false);
  const [commentErrorMessage, setCommentErrorMessage] = useState<string | null>(
    null,
  );
  useValidationAlert(commentErrorMessage);
  const rotate = ABILITY_ROTATIONS[index % ABILITY_ROTATIONS.length];

  const isPortableLaboratory = ability.key === OCCULT_HERBMASTER_DECOCTIONS_KEY;

  const toggleComment = () => {
    if (showComment && !ability.comment) {
      setShowComment(false);
    } else if (!showComment) {
      setShowComment(true);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return;
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

        {isOccultHerbmaster && isPortableLaboratory && (
          <Box sx={{ mt: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={(event) => {
                event.stopPropagation();
                setShowDecoctions(true);
              }}
              sx={{
                color: "#FF3EB5",
                borderColor: "rgba(255, 62, 181, 0.5)",
                fontFamily: "'Antonio', sans-serif",
                fontSize: "0.7rem",
                padding: "2px 8px",
                "&:hover": {
                  borderColor: "#FF3EB5",
                  bgcolor: "rgba(255, 62, 181, 0.1)",
                },
              }}
            >
              {t(
                "abilities.occult_herbmaster.view_decoctions",
                "VIEW DECOCTIONS",
              )}
            </Button>
            <DecoctionsModal
              open={showDecoctions}
              onClose={() => setShowDecoctions(false)}
            />
          </Box>
        )}

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
              if (nextError) return;
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
