import MiseryControl from "@/components/molecules/character/MiseryControl";
import { MISERY_MARKS } from "@/components/molecules/character/miseryTrackUtils";
import { useSetPartyMiseries } from "@/hooks/usePartyRepository";
import { getUserFacingApiErrorMessage } from "@/utils/errorUtils";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  GmMiseryControlAction,
  GmMiseryControlNotice,
  GmMiseryControlRoot,
} from "./GmMiseryControl.styled";

type GmMiseryControlProps = {
  partyId: string;
  memberCount: number;
};

export default function GmMiseryControl({
  partyId,
  memberCount,
}: GmMiseryControlProps) {
  const { t } = useTranslation();
  const [miseryCount, setMiseryCount] = useState(0);
  const mutation = useSetPartyMiseries(partyId);

  return (
    <GmMiseryControlRoot data-testid="gm-misery-control">
      <MiseryControl
        count={miseryCount}
        onChange={setMiseryCount}
        headingLevel="h2"
        description={t("party.miseryControlHelp")}
        action={
          <GmMiseryControlAction
            disabled={memberCount === 0 || mutation.isPending}
            onClick={() => mutation.mutate(miseryCount)}
          >
            {mutation.isPending
              ? t("party.miseryControlPending")
              : t("party.miseryControlApply", {
                  count: miseryCount,
                  total: MISERY_MARKS.length,
                })}
          </GmMiseryControlAction>
        }
      />

      {memberCount === 0 && (
        <GmMiseryControlNotice severity="info">
          {t("party.miseryControlEmpty")}
        </GmMiseryControlNotice>
      )}
      {mutation.data && (
        <GmMiseryControlNotice severity="success" role="status">
          {t("party.miseryControlSuccess", {
            count: mutation.data.miseryCount,
            total: MISERY_MARKS.length,
          })}
        </GmMiseryControlNotice>
      )}
      {mutation.error && (
        <GmMiseryControlNotice severity="error">
          {getUserFacingApiErrorMessage(
            mutation.error,
            (key, fallback) => t(key, fallback),
            t("party.miseryControlError"),
          )}
        </GmMiseryControlNotice>
      )}
    </GmMiseryControlRoot>
  );
}
