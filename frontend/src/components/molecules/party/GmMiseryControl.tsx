import MiseryControl from "@/components/molecules/character/MiseryControl";
import { MISERY_MARKS } from "@/components/molecules/character/miseryTrackUtils";
import { useSetPartyMiseries } from "@/hooks/usePartyRepository";
import { getUserFacingApiErrorMessage } from "@/utils/errorUtils";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { GmMiseryControlProps } from "./GmMiseryControl.models";
import {
  GmMiseryControlAction,
  GmMiseryControlNotice,
  GmMiseryControlRoot,
} from "./GmMiseryControl.styled";

export default function GmMiseryControl({
  partyId,
  memberCount,
  miseryCounts,
}: GmMiseryControlProps) {
  const { t } = useTranslation();
  const [selectedCount, setSelectedCount] = useState<number | null>(null);
  const firstCount = miseryCounts[0];
  const sharedCount =
    Number.isInteger(firstCount) &&
    miseryCounts.every((count) => count === firstCount)
      ? firstCount
      : null;
  const miseryCount = selectedCount ?? sharedCount;
  const mutation = useSetPartyMiseries(partyId);

  return (
    <GmMiseryControlRoot data-testid="gm-misery-control">
      <MiseryControl
        count={miseryCount ?? 0}
        onChange={setSelectedCount}
        headingLevel="h2"
        description={
          memberCount > 0 && miseryCount === null
            ? t("party.miseryControlMixed")
            : t("party.miseryControlHelp")
        }
        action={
          <GmMiseryControlAction
            disabled={
              memberCount === 0 || miseryCount === null || mutation.isPending
            }
            onClick={() => {
              if (miseryCount !== null) {
                mutation.mutate(miseryCount);
              }
            }}
          >
            {mutation.isPending
              ? t("party.miseryControlPending")
              : t("party.miseryControlApply", {
                  count: miseryCount ?? 0,
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
