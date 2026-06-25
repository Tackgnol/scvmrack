import { partyColors, partyFonts } from "@/theme/partyTokens";
import { WarbandStripRowView } from "@/components/organisms/party/WarbandStripRowView";
import type { WarbandMember } from "@/components/organisms/party/warbandMember";
import { useWarbandMember } from "@/hooks/useWarbandMember";
import { Box, Button, Skeleton, styled } from "@mui/material";
import type { ReactNode } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type WarbandStripRowProps = {
  id: string;
  name: string;
  disconnected?: boolean;
  /** A recent SSE event touched this member — drives the quiet "changed" pulse. */
  changed?: boolean;
  /** Only fetch while the GM overview is mounted/visible. */
  active: boolean;
  renderActions?: (member: WarbandMember) => ReactNode;
};

const Shell = styled(Box)({
  background: partyColors.black,
  border: `1px solid ${partyColors.grey}`,
  boxShadow: `4px 4px 0 ${partyColors.black}`,
  padding: "14px 18px",
  display: "flex",
  alignItems: "center",
  gap: "16px",
});

const RowName = styled(Box)({
  fontFamily: partyFonts.gothic,
  color: partyColors.yellow,
  fontSize: "1.2rem",
});

const NameLine = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
});

const DisconnectedTag = styled("span")({
  background: partyColors.yellow,
  color: partyColors.black,
  border: `1px solid ${partyColors.pink}`,
  fontFamily: partyFonts.label,
  fontSize: "0.5rem",
  letterSpacing: "0.12em",
  padding: "1px 5px",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
});

const ErrorText = styled(Box)({
  fontFamily: partyFonts.body,
  color: partyColors.debuff,
  fontSize: "0.84rem",
});

const RetryButton = styled(Button)({
  marginLeft: "auto",
  fontFamily: partyFonts.label,
  fontSize: "0.7rem",
  letterSpacing: "0.12em",
  color: partyColors.black,
  background: partyColors.yellow,
  borderRadius: 0,
  paddingLeft: "12px",
  paddingRight: "12px",
  "&:hover": { background: partyColors.pink },
});

const LoadingName = styled(RowName)({
  minWidth: 150,
});

const TrackSkeleton = styled(Skeleton)({
  flex: 1,
  backgroundColor: partyColors.grey,
});

// Each strip owns its detail fetch and its own expand state, so the roster loads
// member-by-member and rows open independently.
export function WarbandStripRow({
  id,
  name,
  disconnected = false,
  changed = false,
  active,
  renderActions,
}: WarbandStripRowProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { member, isLoading, isError, refetch } = useWarbandMember(id, {
    enabled: active,
  });

  if (member) {
    return (
      <WarbandStripRowView
        member={member}
        open={open}
        onToggle={() => setOpen((v) => !v)}
        disconnected={disconnected}
        changed={changed}
        actions={renderActions?.(member)}
      />
    );
  }

  if (isError) {
    return (
      <Shell data-testid="strip-row-error">
        <NameLine>
          <RowName>{name}</RowName>
          {disconnected && (
            <DisconnectedTag>
              {t("gm.disconnected", "Disconnected")}
            </DisconnectedTag>
          )}
        </NameLine>
        <ErrorText>
          {t("party.cardError", "This scvm's sheet wouldn't load.")}
        </ErrorText>
        <RetryButton onClick={() => refetch()}>
          {t("actions.retry", "Retry")}
        </RetryButton>
      </Shell>
    );
  }

  return (
    <Shell data-testid="strip-row-loading" aria-busy={isLoading}>
      <NameLine>
        <LoadingName>{name}</LoadingName>
        {disconnected && (
          <DisconnectedTag>
            {t("gm.disconnected", "Disconnected")}
          </DisconnectedTag>
        )}
      </NameLine>
      <TrackSkeleton variant="rectangular" height={15} />
    </Shell>
  );
}
