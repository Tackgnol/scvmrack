import { WarbandMiniStat } from "@/components/molecules/party/WarbandMiniStat";
import { WarbandStripDetails } from "@/components/molecules/party/WarbandStripDetails";
import { partyColors, partyFonts } from "@/theme/partyTokens";
import type {
  WarbandContribRow,
  WarbandMember,
} from "@/components/organisms/party/warbandMember";
import { Box, Collapse, styled, useMediaQuery } from "@mui/material";
import { keyframes } from "@mui/system";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

type WarbandStripRowViewProps = {
  member: WarbandMember;
  open: boolean;
  onToggle: () => void;
  disconnected?: boolean;
  /** A recent SSE event touched this member — flashes the quiet "changed" pulse. */
  changed?: boolean;
  actions?: ReactNode;
};

// Quiet "something happened" flash: the drop-shadow warms to pink and the border
// lifts to pink for a beat, then settles back. No movement — just a soft tint, so
// a GM scanning the strip catches the change without a jolt.
const changedPulse = keyframes`
  0% { box-shadow: 4px 4px 0 ${partyColors.black}; border-color: ${partyColors.grey}; }
  40% { box-shadow: 4px 4px 0 ${partyColors.pink}; border-color: ${partyColors.pink}; }
  100% { box-shadow: 4px 4px 0 ${partyColors.black}; border-color: ${partyColors.grey}; }
`;

const Root = styled(Box, {
  shouldForwardProp: (prop) => prop !== "changed",
})<{ changed?: boolean }>(({ changed }) => ({
  background: partyColors.black,
  border: `1px solid ${partyColors.grey}`,
  boxShadow: `4px 4px 0 ${partyColors.black}`,
  animation: changed ? `${changedPulse} 900ms cubic-bezier(0.22, 1, 0.36, 1)` : "none",
  "@media (prefers-reduced-motion: reduce)": {
    animation: "none",
  },
}));

const HeaderRow = styled(Box)({
  width: "100%",
  textAlign: "left",
  background: "transparent",
  border: "none",
  color: "inherit",
  padding: 0,
  display: "flex",
  alignItems: "stretch",
  flexWrap: "wrap",
});

const IdentityCol = styled(Box)({
  flex: "1 1 188px",
  minWidth: 170,
  padding: "14px 18px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  borderRight: `1px solid ${partyColors.grey}`,
});

const NameRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

const Name = styled("span")({
  fontFamily: partyFonts.gothic,
  color: partyColors.yellow,
  fontSize: "1.32rem",
  lineHeight: 1,
});

const DeadTag = styled("span")({
  background: partyColors.blood,
  color: partyColors.yellow,
  fontFamily: partyFonts.label,
  fontSize: "0.5rem",
  letterSpacing: "0.12em",
  padding: "1px 4px",
  whiteSpace: "nowrap",
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

const ClassLine = styled(Box)({
  fontFamily: partyFonts.label,
  fontSize: "0.56rem",
  letterSpacing: "0.14em",
  color: partyColors.mutedText,
  textTransform: "uppercase",
  marginTop: "5px",
});

const HpCol = styled(Box)({
  flex: "2 1 210px",
  minWidth: 190,
  padding: "14px 18px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: "7px",
  borderRight: `1px solid ${partyColors.grey}`,
});

const HpHead = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
});

const HpLabel = styled("span")({
  fontFamily: partyFonts.label,
  fontSize: "0.54rem",
  letterSpacing: "0.2em",
  color: partyColors.mutedText,
});

const HpValue = styled("span")({
  fontFamily: partyFonts.headline,
  fontSize: "1.45rem",
  color: partyColors.white,
  letterSpacing: "0.03em",
  lineHeight: 1,
});

const HpTrack = styled(Box)({
  height: 15,
  background: partyColors.grey,
  border: `1px solid ${partyColors.darkGrey}`,
});

const HpFill = styled(Box, {
  shouldForwardProp: (prop) => prop !== "pct",
})<{ pct: number }>(({ pct }) => ({
  height: "100%",
  background: partyColors.blood,
  width: `${pct}%`,
}));

const StatsCol = styled(Box)(({ theme }) => ({
  flex: "3 1 340px",
  // Let the stats block shrink + wrap on phones; the 300px floor only
  // applies from sm up, so a ~360px viewport never overflows.
  minWidth: 0,
  [theme.breakpoints.up("sm")]: { minWidth: 300 },
  padding: "12px 16px",
  display: "flex",
  alignItems: "center",
  gap: "14px",
  flexWrap: "wrap",
}));

const GroupLabel = styled(Box)({
  fontFamily: partyFonts.label,
  fontSize: "0.46rem",
  letterSpacing: "0.16em",
  color: partyColors.mutedText,
  marginBottom: "4px",
});

const StatRow = styled(Box)({
  display: "flex",
  gap: "3px",
});

const ModsBlock = styled(Box)({
  marginLeft: "auto",
  display: "flex",
  alignItems: "center",
  gap: "12px",
});

const ToggleButton = styled("button")({
  cursor: "pointer",
  appearance: "none",
  background: "transparent",
  border: "none",
  color: "inherit",
  padding: 0,
  display: "flex",
  alignItems: "center",
  gap: "12px",
  outlineOffset: 2,
  "&:hover span:last-of-type": {
    color: partyColors.yellow,
  },
});

const ModsCount = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "3px",
});

const ModsBadge = styled("span")({
  minWidth: 24,
  height: 24,
  background: partyColors.pink,
  color: partyColors.black,
  fontFamily: partyFonts.headline,
  fontSize: "1rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: `2px solid ${partyColors.black}`,
  lineHeight: 1,
});

const ModsLabel = styled("span")({
  fontFamily: partyFonts.label,
  fontSize: "0.44rem",
  letterSpacing: "0.14em",
  color: partyColors.mutedText,
});

const Caret = styled("span", {
  shouldForwardProp: (prop) => prop !== "open",
})<{ open: boolean }>(({ open }) => ({
  color: partyColors.pink,
  fontSize: "0.9rem",
  display: "inline-block",
  // One glyph that rotates, so the indicator moves with the panel instead of
  // snapping between two characters.
  transform: open ? "rotate(90deg)" : "rotate(0deg)",
  transition: "transform 240ms cubic-bezier(0.22, 1, 0.36, 1)",
  "@media (prefers-reduced-motion: reduce)": {
    transition: "none",
  },
}));

const TipTitle = styled(Box)({
  fontFamily: partyFonts.label,
  fontSize: "0.58rem",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  marginBottom: "5px",
});

const TipBody = styled(Box)({
  fontFamily: partyFonts.body,
  fontSize: "0.82rem",
  lineHeight: 1.28,
});

const TipRows = styled(Box)({
  display: "grid",
  gap: "3px",
});

const TipRow = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
  gap: "14px",
  fontFamily: partyFonts.body,
  fontSize: "0.82rem",
});

const TipValue = styled("span")({
  fontFamily: partyFonts.label,
  fontSize: "0.62rem",
  letterSpacing: "0.08em",
  whiteSpace: "nowrap",
});

const renderAbilityTip = (name: string, value: string, body: string) => (
  <Box>
    <TipTitle>
      {name} {value}
    </TipTitle>
    <TipBody>{body}</TipBody>
  </Box>
);

const renderCombatTip = (name: string, rows: WarbandContribRow[]) => (
  <Box>
    <TipTitle>{name}</TipTitle>
    <TipRows>
      {rows.map((row) => (
        <TipRow key={`${name}-${row.label}-${row.val}`}>
          <span>{row.label}</span>
          <TipValue>{row.val}</TipValue>
        </TipRow>
      ))}
    </TipRows>
  </Box>
);

// One member as a full-width Vital Strip: identity, big HP, ability + combat tiles,
// a modifier count, and a caret. The stats own their tooltips; the caret toggles
// the detail panel so touch users get the same information without nested controls.
export function WarbandStripRowView({
  member,
  open,
  onToggle,
  disconnected = false,
  changed = false,
  actions,
}: WarbandStripRowViewProps) {
  const { t } = useTranslation();
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const translateContribRows = (rows: WarbandContribRow[]) =>
    rows.map((row) => ({
      ...row,
      label: row.labelKey ? t(row.labelKey, row.label) : row.label,
    }));

  return (
    <Root data-testid="strip-row" changed={changed && !reducedMotion}>
      <HeaderRow>
        <IdentityCol>
          <NameRow>
            <Name>{member.name}</Name>
            {member.dead && <DeadTag>† DEAD</DeadTag>}
            {disconnected && (
              <DisconnectedTag>
                {t("gm.disconnected", "Disconnected")}
              </DisconnectedTag>
            )}
          </NameRow>
          <ClassLine>{member.cls}</ClassLine>
        </IdentityCol>

        <HpCol>
          <HpHead>
            <HpLabel>{t("gm.hitPoints", "Hit points")}</HpLabel>
            <HpValue>{member.hpText}</HpValue>
          </HpHead>
          <HpTrack
            role="progressbar"
            aria-valuenow={member.hpPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <HpFill pct={member.hpPct} />
          </HpTrack>
        </HpCol>

        <StatsCol>
          <Box>
            <GroupLabel>{t("gm.abilities", "Abilities")}</GroupLabel>
            <StatRow>
              <WarbandMiniStat
                abbr="AGI"
                value={member.agi}
                tone="pink"
                tooltip={{
                  title: renderAbilityTip(
                    t("gm.agility", "Agility"),
                    member.agi,
                    t(
                      "gm.agilityTip",
                      "Dodging, fleeing, initiative, and ranged aim.",
                    ),
                  ),
                  width: 190,
                }}
              />
              <WarbandMiniStat
                abbr="PRE"
                value={member.pre}
                tone="white"
                tooltip={{
                  title: renderAbilityTip(
                    t("gm.presence", "Presence"),
                    member.pre,
                    t(
                      "gm.presenceTip",
                      "Perception, powers, and ranged attacks.",
                    ),
                  ),
                  width: 190,
                }}
              />
              <WarbandMiniStat
                abbr="STR"
                value={member.str}
                tone="yellow"
                tooltip={{
                  title: renderAbilityTip(
                    t("gm.strength", "Strength"),
                    member.str,
                    t(
                      "gm.strengthTip",
                      "Melee attacks, carrying, and breaking things.",
                    ),
                  ),
                  width: 190,
                }}
              />
              <WarbandMiniStat
                abbr="TOU"
                value={member.tou}
                tone="dark"
                tooltip={{
                  title: renderAbilityTip(
                    t("gm.toughness", "Toughness"),
                    member.tou,
                    t(
                      "gm.toughnessTip",
                      "HP, poison, infection, and endurance.",
                    ),
                  ),
                  tone: "dark",
                  width: 190,
                }}
              />
            </StatRow>
          </Box>
          <Box>
            <GroupLabel>{t("gm.combat", "Combat")}</GroupLabel>
            <StatRow>
              <WarbandMiniStat
                abbr="DOD"
                value={member.dodge}
                tone="plain"
                tooltip={{
                  title: renderCombatTip(
                    t("gm.dodge", "Dodge"),
                    translateContribRows(member.dodgeC),
                  ),
                  width: 210,
                }}
              />
              <WarbandMiniStat
                abbr="MEL"
                value={member.melee}
                tone="plain"
                tooltip={{
                  title: renderCombatTip(
                    t("gm.melee", "Melee"),
                    translateContribRows(member.meleeC),
                  ),
                  width: 210,
                }}
              />
              <WarbandMiniStat
                abbr="RNG"
                value={member.ranged}
                tone="plain"
                tooltip={{
                  title: renderCombatTip(
                    t("gm.ranged", "Ranged"),
                    translateContribRows(member.rangedC),
                  ),
                  width: 210,
                }}
              />
              <WarbandMiniStat
                abbr="DR"
                value={member.dr}
                tone="plain"
                tooltip={{
                  title: (
                    <Box>
                      <TipTitle>
                        {t("gm.damageReduction", "Damage reduction")}
                      </TipTitle>
                      <TipBody>
                        {member.dr > 0
                          ? t(
                              "gm.damageReductionTip",
                              "{{armor}} soaks d{{dr}}.",
                              {
                                armor: member.armor,
                                dr: member.dr,
                              },
                            )
                          : t(
                              "gm.noDamageReduction",
                              "No armor damage reduction.",
                            )}
                      </TipBody>
                    </Box>
                  ),
                  width: 210,
                }}
              />
            </StatRow>
          </Box>
          <ModsBlock>
            <ToggleButton
              type="button"
              onClick={onToggle}
              aria-expanded={open}
              aria-label={t("gm.toggleRow", "Toggle {{name}} detail", {
                name: member.name,
              })}
            >
              <ModsCount>
                <ModsBadge>{member.modCount}</ModsBadge>
                <ModsLabel>{t("gm.mods", "Mods")}</ModsLabel>
              </ModsCount>
              <Caret open={open} aria-hidden>
                ▸
              </Caret>
            </ToggleButton>
          </ModsBlock>
        </StatsCol>
      </HeaderRow>

      <Collapse in={open} timeout={reducedMotion ? 0 : 280} unmountOnExit>
        <WarbandStripDetails member={member} actions={actions} />
      </Collapse>
    </Root>
  );
}
