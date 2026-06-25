import {
  usePartyDetail,
  useKickPartyMember,
  useRegeneratePartyLink,
  useRenameParty,
} from "@/hooks/usePartyRepository";
import { usePartyStream } from "@/hooks/usePartyStream";
import { WarbandVitalStrip } from "@/components/organisms/party/WarbandVitalStrip";
import { appHistory } from "@/router/history";
import { buildPartyCharacterPath } from "@/router/navigation";
import { Seo } from "@/seo/Seo";
import {
  getUserFacingApiErrorMessage,
  isApiNotFound,
} from "@/utils/errorUtils";
import { partyColors, partyFonts } from "@/theme/partyTokens";
import { NotFoundPage } from "@/pages/NotFoundPage";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Typography,
  styled,
} from "@mui/material";
import { keyframes } from "@mui/system";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";

const subscribeToHistory = (onStoreChange: () => void): (() => void) =>
  appHistory.subscribe(() => onStoreChange());

const getPathnameSnapshot = () => appHistory.location?.pathname ?? "/";

// Quiet entrance: panels settle in from a few px down. Resting state is fully
// visible, so reduced-motion / headless renders show everything with no reveal
// gating — the keyframe only enhances the load on capable, motion-OK clients.
const rise = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const copyPulse = keyframes`
  0% { transform: scale(1); }
  40% { transform: scale(0.94); }
  100% { transform: scale(1); }
`;

function getPartyId(pathname: string): string | null {
  const match = pathname.match(/^\/party\/([^/]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

const Page = styled(Box)({
  paddingTop: 16,
  paddingBottom: 16,
  display: "grid",
  gap: 16,
});

const CenterRow = styled(Box)({
  display: "flex",
  justifyContent: "center",
  paddingTop: 32,
  paddingBottom: 32,
});

const Spinner = styled(CircularProgress)({
  color: partyColors.pink,
});

const Stamp = styled("span")({
  display: "inline-block",
  width: "fit-content",
  background: partyColors.pink,
  color: partyColors.black,
  fontFamily: partyFonts.label,
  fontSize: "0.7rem",
  letterSpacing: "0.24em",
  textTransform: "uppercase",
  padding: "4px 10px",
  border: `2px solid ${partyColors.black}`,
  transform: "rotate(-1.5deg)",
});

const Title = styled(Typography)(({ theme }) => ({
  fontFamily: partyFonts.headline,
  color: partyColors.black,
  fontSize: "2.6rem",
  [theme.breakpoints.up("sm")]: { fontSize: "3.3rem" },
  letterSpacing: "0.04em",
  lineHeight: 0.95,
  margin: 0,
  overflowWrap: "anywhere",
})) as typeof Typography;

// Stagger wrapper: each child sets `style={{ '--i': n }}` for a small cascade.
const Reveal = styled(Box)({
  animation: `${rise} 320ms cubic-bezier(0.22, 1, 0.36, 1) both`,
  animationDelay: "calc(var(--i, 0) * 70ms)",
  "@media (prefers-reduced-motion: reduce)": {
    animation: "none",
  },
});

const TitleRow = styled(Box)({
  display: "flex",
  alignItems: "baseline",
  flexWrap: "wrap",
  gap: 10,
});

const RenameButton = styled("button")({
  appearance: "none",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: "4px 6px",
  marginBottom: 2,
  color: partyColors.black,
  fontFamily: partyFonts.label,
  fontSize: "0.6rem",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  textDecoration: "underline",
  textDecorationColor: partyColors.pink,
  textDecorationThickness: "2px",
  textUnderlineOffset: "3px",
  transition: "color 120ms ease-out",
  alignSelf: "center",
  "&:hover": { color: partyColors.blood },
  "&:focus-visible": {
    outline: `2px solid ${partyColors.black}`,
    outlineOffset: "2px",
  },
});

const NameInput = styled("input")(({ theme }) => ({
  flex: "1 1 240px",
  minWidth: 0,
  background: partyColors.black,
  color: partyColors.yellow,
  border: `3px solid ${partyColors.black}`,
  outline: "none",
  borderRadius: 0,
  padding: "4px 10px",
  fontFamily: partyFonts.headline,
  fontSize: "2.2rem",
  [theme.breakpoints.up("sm")]: { fontSize: "2.8rem" },
  letterSpacing: "0.04em",
  lineHeight: 1,
  "&:focus-visible": { boxShadow: `5px 5px 0 ${partyColors.pink}` },
}));

// Inset "copyable" treatment for the invite URL — reads as something to grab,
// not body prose. Wraps long links instead of clipping them.
const InviteCode = styled(Box)({
  background: partyColors.offBlack,
  border: `2px dashed ${partyColors.mutedText}`,
  color: partyColors.yellow,
  padding: "10px 12px",
  fontFamily: partyFonts.body,
  fontSize: "0.95rem",
  letterSpacing: "0.01em",
  overflowWrap: "anywhere",
  userSelect: "all",
  cursor: "text",
});

const Helper = styled(Typography)({
  color: partyColors.mutedText,
  fontFamily: partyFonts.body,
  fontSize: "0.82rem",
  lineHeight: 1.4,
});

const DarkPanel = styled(Box)(({ theme }) => ({
  backgroundColor: partyColors.black,
  color: partyColors.white,
  border: `3px solid ${partyColors.black}`,
  boxShadow: `6px 6px 0 ${partyColors.pink}`,
  padding: 12,
  [theme.breakpoints.up("sm")]: { padding: 16 },
  display: "grid",
  gap: 10,
}));

const Label = styled(Typography)({
  color: partyColors.pink,
  fontFamily: partyFonts.label,
  fontSize: "0.62rem",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
});

const PanelHeader = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
});

const PanelToggle = styled("button")({
  appearance: "none",
  cursor: "pointer",
  background: "transparent",
  color: partyColors.yellow,
  border: `1px solid ${partyColors.yellow}`,
  borderRadius: 0,
  minHeight: 34,
  padding: "4px 8px",
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  fontFamily: partyFonts.label,
  fontSize: "0.56rem",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  "&:hover": {
    background: partyColors.yellow,
    color: partyColors.black,
  },
  "&:focus-visible": {
    outline: `2px solid ${partyColors.pink}`,
    outlineOffset: "2px",
  },
});

const InviteBody = styled(Box)({
  display: "grid",
  gap: 10,
});

const MembersLabel = styled(Label)({
  color: partyColors.black,
  marginBottom: 8,
});

const PartyButton = styled(Button)({
  backgroundColor: partyColors.pink,
  color: partyColors.black,
  border: `2px solid ${partyColors.yellow}`,
  borderRadius: 0,
  fontFamily: partyFonts.label,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  minHeight: 44,
  "&:hover": { backgroundColor: partyColors.yellow },
});

const KickButton = styled(PartyButton)({
  backgroundColor: partyColors.blood,
  color: partyColors.yellow,
});

const ButtonRow = styled(Box)({
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
});

const NoMembers = styled(Box)({
  fontFamily: partyFonts.body,
  color: partyColors.black,
});

const GuildRow = styled(Box)({
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  alignItems: "center",
});

const GuildLink = styled("a")({
  display: "inline-flex",
  alignItems: "center",
  minHeight: 44,
  paddingLeft: 4,
  paddingRight: 4,
  color: partyColors.yellow,
  fontFamily: partyFonts.label,
  fontSize: "0.62rem",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  textDecoration: "underline",
  textDecorationColor: partyColors.pink,
  textUnderlineOffset: "3px",
  transition: "text-decoration-color 120ms ease-out, color 120ms ease-out",
  "&:hover": {
    color: partyColors.white,
    textDecorationColor: partyColors.yellow,
  },
  "&:focus-visible": {
    outline: `2px solid ${partyColors.pink}`,
    outlineOffset: "2px",
  },
});

const GUILDS_INFO_URL = "https://rpgtools.co/guilds";

export function PartyPage() {
  const { t } = useTranslation();
  const pathname = useSyncExternalStore(
    subscribeToHistory,
    getPathnameSnapshot,
    getPathnameSnapshot,
  );
  const partyId = getPartyId(pathname);
  const partyQuery = usePartyDetail(partyId);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [guildNoticeOpen, setGuildNoticeOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(true);
  const regenerateMutation = useRegeneratePartyLink(partyId ?? "");
  const kickMutation = useKickPartyMember(partyId ?? "");
  const renameMutation = useRenameParty(partyId ?? "");
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState("");
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const party = partyQuery.data;
  const partyStream = usePartyStream(partyId, {
    enabled: Boolean(partyId && party),
  });
  const { changedFieldsByCharacter, clearChangedFields } = partyStream;

  // Let the quiet "changed" pulse play, then drop the flag so the next SSE event
  // re-triggers it.
  useEffect(() => {
    const flagged = Object.keys(changedFieldsByCharacter).filter(
      (id) => (changedFieldsByCharacter[id]?.length ?? 0) > 0,
    );
    if (flagged.length === 0) {
      return;
    }
    const timeout = window.setTimeout(() => {
      flagged.forEach((id) => clearChangedFields(id));
    }, 1200);
    return () => window.clearTimeout(timeout);
  }, [changedFieldsByCharacter, clearChangedFields]);

  const invitePath = party?.invitePath ?? "";
  const inviteUrl =
    invitePath && typeof window !== "undefined"
      ? `${window.location.origin}${invitePath}`
      : invitePath;

  useEffect(() => {
    if (!party || party.role !== "member") {
      return;
    }

    const ownMember = party.members.find((member) => member.owned);
    if (!ownMember) {
      return;
    }

    void appHistory.replace(
      buildPartyCharacterPath(party.id, ownMember.characterId),
    );
  }, [party]);

  if (!partyId || (partyQuery.error && isApiNotFound(partyQuery.error))) {
    return <NotFoundPage seoNoIndex />;
  }

  const copyInvite = async () => {
    if (!inviteUrl) {
      return;
    }

    try {
      await navigator.clipboard?.writeText(inviteUrl);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1400);
    } catch {
      setCopyState("idle");
    }
  };

  const startRename = () => {
    setDraftName(party?.name ?? "");
    setRenaming(true);
    // Focus + select on the next frame, once the input is mounted.
    window.requestAnimationFrame(() => nameInputRef.current?.select());
  };

  const cancelRename = () => {
    setRenaming(false);
    setDraftName("");
  };

  const submitRename = async () => {
    const next = draftName.trim();
    if (!next || next === party?.name) {
      cancelRename();
      return;
    }
    try {
      await renameMutation.mutateAsync(next);
      setRenaming(false);
    } catch {
      // Mutation error surfaces below; keep the editor open so the GM can retry.
    }
  };
  const stripMembers =
    party?.members.map((member) => ({
      id: member.characterId,
      name: member.name,
      disconnected:
        party.role === "gm" &&
        partyStream.presenceByCharacter[member.characterId] === false,
      changed: (changedFieldsByCharacter[member.characterId]?.length ?? 0) > 0,
    })) ?? [];

  return (
    <>
      <Seo
        title={party ? `${party.name} Party` : "Party"}
        description="Party management and roster."
        path={`/party/${partyId}`}
        noIndex
      />

      <Page>
        {partyQuery.isLoading && (
          <CenterRow data-testid="party-loading">
            <Spinner />
          </CenterRow>
        )}

        {partyQuery.error && !isApiNotFound(partyQuery.error) && (
          <Alert severity="error">
            {getUserFacingApiErrorMessage(
              partyQuery.error,
              t,
              "Failed to load party",
            )}
          </Alert>
        )}

        {party?.role === "member" && (
          <Alert severity="info" sx={{ borderRadius: 0 }}>
            {t("party.redirectingToSheet", "Opening your party sheet...")}
          </Alert>
        )}

        {party?.role === "gm" && (
          <>
            <Reveal sx={{ "--i": 0 }}>
              <Stamp>{t("party.manageStamp", "GM party control")}</Stamp>
              {renaming ? (
                <NameInput
                  ref={nameInputRef}
                  value={draftName}
                  maxLength={60}
                  aria-label={t("party.renameLabel", "Warband name")}
                  disabled={renameMutation.isPending}
                  onChange={(event) => setDraftName(event.target.value)}
                  onBlur={() => void submitRename()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void submitRename();
                    } else if (event.key === "Escape") {
                      event.preventDefault();
                      cancelRename();
                    }
                  }}
                />
              ) : (
                <TitleRow>
                  <Title component="h1">{party.name}</Title>
                  <RenameButton type="button" onClick={startRename}>
                    {t("party.rename", "Rename")}
                  </RenameButton>
                </TitleRow>
              )}
              {renameMutation.error && (
                <Alert severity="error" sx={{ borderRadius: 0, mt: 1 }}>
                  {getUserFacingApiErrorMessage(
                    renameMutation.error,
                    t,
                    "Failed to rename party",
                  )}
                </Alert>
              )}
            </Reveal>

            <Reveal sx={{ "--i": 1 }}>
              <DarkPanel>
                <PanelHeader>
                  <Label>{t("party.inviteLinkLabel", "Invite link")}</Label>
                  <PanelToggle
                    type="button"
                    aria-expanded={inviteOpen}
                    aria-controls="party-invite-link-body"
                    onClick={() => setInviteOpen((open) => !open)}
                  >
                    {inviteOpen
                      ? t("party.hideInviteLink", "Hide link")
                      : t("party.showInviteLink", "Show link")}
                    <KeyboardArrowDownIcon
                      sx={{
                        fontSize: 18,
                        transform: inviteOpen ? "rotate(180deg)" : "none",
                        transition: "transform 160ms ease-out",
                        "@media (prefers-reduced-motion: reduce)": {
                          transition: "none",
                        },
                      }}
                    />
                  </PanelToggle>
                </PanelHeader>
                {inviteOpen && (
                  <InviteBody id="party-invite-link-body">
                    <Helper>
                      {t(
                        "party.inviteLinkHelp",
                        "Anyone who opens this link can bind a scvm to your warband.",
                      )}
                    </Helper>
                    <InviteCode>{inviteUrl}</InviteCode>
                    <ButtonRow>
                      <PartyButton
                        onClick={() => void copyInvite()}
                        sx={
                          copyState === "copied"
                            ? {
                                backgroundColor: partyColors.yellow,
                                animation: `${copyPulse} 220ms cubic-bezier(0.22, 1, 0.36, 1)`,
                                "@media (prefers-reduced-motion: reduce)": {
                                  animation: "none",
                                },
                              }
                            : undefined
                        }
                      >
                        {copyState === "copied"
                          ? t("party.copied", "Copied ✓")
                          : t("party.copyInvite", "Copy link")}
                      </PartyButton>
                      <PartyButton
                        disabled={regenerateMutation.isPending}
                        onClick={() => void regenerateMutation.mutateAsync()}
                      >
                        {regenerateMutation.isPending
                          ? t("party.generatingLink", "Generating...")
                          : t("party.generateNewLink", "Generate new link")}
                      </PartyButton>
                    </ButtonRow>
                    {regenerateMutation.error && (
                      <Alert severity="error">
                        {getUserFacingApiErrorMessage(
                          regenerateMutation.error,
                          t,
                          "Failed to regenerate invite link",
                        )}
                      </Alert>
                    )}
                  </InviteBody>
                )}
              </DarkPanel>
            </Reveal>

            <Reveal sx={{ "--i": 2 }}>
              <MembersLabel>
                {t("gm.stamp", "Game Master · Overview")}{" "}
                {t("party.membersCount", "{{count}}/{{max}}", {
                  count: party.memberCount,
                  max: party.maxMembers,
                })}
              </MembersLabel>
              {stripMembers.length === 0 ? (
                <NoMembers>
                  {t("party.noMembers", "No scvms have joined this party yet.")}
                </NoMembers>
              ) : (
                <WarbandVitalStrip
                  members={stripMembers}
                  active
                  renderActions={(member) => (
                    <KickButton
                      disabled={kickMutation.isPending}
                      onClick={() => void kickMutation.mutateAsync(member.id)}
                    >
                      {t("party.kick", "Kick")}
                    </KickButton>
                  )}
                />
              )}
              {kickMutation.error && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {getUserFacingApiErrorMessage(
                    kickMutation.error,
                    t,
                    "Failed to remove party member",
                  )}
                </Alert>
              )}
            </Reveal>

            <Reveal sx={{ "--i": 3 }}>
              <DarkPanel>
                <Label>{t("party.guildTitle", "Guild")}</Label>
                <GuildRow>
                  <PartyButton onClick={() => setGuildNoticeOpen(true)}>
                    {t("party.guildInvite", "Invite guild members")}
                  </PartyButton>
                  <GuildLink
                    href={GUILDS_INFO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("party.guildWhat", "What are guilds?")}
                  </GuildLink>
                </GuildRow>
                {guildNoticeOpen && (
                  <Alert severity="info" sx={{ borderRadius: 0 }}>
                    {t(
                      "party.guildComingSoon",
                      "Guild invites are coming soon — summon a fellow guild member straight into your warband.",
                    )}
                  </Alert>
                )}
              </DarkPanel>
            </Reveal>
          </>
        )}
      </Page>
    </>
  );
}
