import { PartyStrip } from '@/components/molecules/party/PartyStrip';
import { WarbandCard } from '@/components/organisms/party/WarbandCard';
import type { PartyMember } from '@/hooks/useParty';
import { Box, useMediaQuery, useTheme } from '@mui/material';

type WarbandTarotDeckProps = {
  members: PartyMember[];
  active: boolean;
};

// Tarot card deck for the player-facing party takeover (PartyView / PartySheetPill).
// One horizontal row paged by PartyStrip's flanking arrows — cards never wrap to a
// second row when the warband outgrows the panel. The GM gets the dense Vital Strip
// instead; these two views are deliberately different. Each card fetches lazily.
export function WarbandTarotDeck({ members, active }: WarbandTarotDeckProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    // minWidth 0: as a grid item the deck would otherwise grow to fit every card, so the
    // strip never overflowed and its arrows stayed disabled (RPG-322).
    <Box data-testid="warband-tarot-deck" sx={{ minWidth: 0 }}>
      <PartyStrip cardWidth={isMobile ? 280 : 300}>
        {members.map((member) => (
          <WarbandCard
            key={member.id}
            id={member.id}
            name={member.name}
            active={active}
          />
        ))}
      </PartyStrip>
    </Box>
  );
}
