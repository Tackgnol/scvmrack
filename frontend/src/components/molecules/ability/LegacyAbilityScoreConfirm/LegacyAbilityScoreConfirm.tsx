import { Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import MorkBorgModal, {
  ModalButton,
} from "@/components/molecules/modal/MorkBorgModal";
import { ABILITY_SCORE_LIMITS } from "@/utils/stats";
import type { LegacyAbilityScoreConfirmProps } from "./LegacyAbilityScoreConfirm.models";

export default function LegacyAbilityScoreConfirm({
  label,
  fromScore,
  toScore,
  onCancel,
  onConfirm,
}: LegacyAbilityScoreConfirmProps) {
  const { t } = useTranslation();
  return (
    <MorkBorgModal
      open
      role="alertdialog"
      title={t("attributes.legacyScoreTitle", "Reduce ability score?")}
      onClose={onCancel}
      closeOnBackdrop={false}
      actions={
        <>
          <ModalButton variant="secondary" onClick={onCancel} autoFocus>
            {t("common.cancel", "Cancel")}
          </ModalButton>
          <ModalButton onClick={onConfirm}>
            {t("attributes.confirmScoreChange", "Change to {{score}}", {
              score: toScore,
            })}
          </ModalButton>
        </>
      }
    >
      <Typography>
        {t(
          "attributes.legacyScoreWarning",
          "Change {{stat}} from {{from}} to {{to}}? Scores are now limited to {{min}}–{{max}}. Your current score stays unchanged unless you confirm.",
          {
            stat: label,
            from: fromScore,
            to: toScore,
            ...ABILITY_SCORE_LIMITS,
          },
        )}
      </Typography>
    </MorkBorgModal>
  );
}
