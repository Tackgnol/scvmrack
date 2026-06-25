import { partyColors, partyFonts } from '@/theme/partyTokens';
import { WarbandTooltip } from '@/components/atoms/party/WarbandTooltip';
import { Box, styled, type TooltipProps } from '@mui/material';
import type { ReactNode } from 'react';

export type MiniStatTone = 'pink' | 'white' | 'yellow' | 'dark' | 'plain';

type WarbandMiniStatProps = {
  abbr: string;
  value: string | number;
  tone: MiniStatTone;
  tooltip?: {
    title: ReactNode;
    tone?: 'yellow' | 'dark';
    width?: number;
    placement?: TooltipProps['placement'];
  };
};

const surface = (tone: MiniStatTone) => {
  switch (tone) {
    case 'pink':
      return {
        bg: partyColors.pink,
        fg: partyColors.black,
        border: partyColors.black,
      };
    case 'white':
      return {
        bg: partyColors.white,
        fg: partyColors.black,
        border: partyColors.black,
      };
    case 'yellow':
      return {
        bg: partyColors.yellow,
        fg: partyColors.black,
        border: partyColors.black,
      };
    case 'dark':
      return {
        bg: partyColors.black,
        fg: partyColors.yellow,
        border: partyColors.yellow,
      };
    case 'plain':
    default:
      return {
        bg: partyColors.yellow,
        fg: partyColors.black,
        border: undefined,
      };
  }
};

const Tile = styled(Box, {
  shouldForwardProp: (prop) =>
    prop !== 'bg' && prop !== 'fg' && prop !== 'borderColor',
})<{ bg: string; fg: string; borderColor?: string }>(
  ({ bg, fg, borderColor }) => ({
    width: 34,
    background: bg,
    color: fg,
    border: borderColor ? `2px solid ${borderColor}` : 'none',
    textAlign: 'center',
    paddingTop: '5px',
    paddingBottom: '5px',
    outlineOffset: 2,
    '&[tabindex="0"]': {
      cursor: 'help',
    },
  }),
);

const Abbr = styled(Box)({
  fontFamily: partyFonts.label,
  fontSize: '0.42rem',
  letterSpacing: '0.04em',
  opacity: 0.72,
});

const Value = styled(Box)({
  fontFamily: partyFonts.headline,
  fontSize: '1.02rem',
  lineHeight: 1,
});

// A compact ability/combat tile for the Vital Strip — small abbreviation over a big
// Bebas numeral. Abilities carry their stat colour + border; combat tiles are plain
// yellow with no border (the design's two visual registers).
export function WarbandMiniStat({
  abbr,
  value,
  tone,
  tooltip,
}: WarbandMiniStatProps) {
  const s = surface(tone);

  const tile = (
    <Tile
      bg={s.bg}
      fg={s.fg}
      borderColor={s.border}
      tabIndex={tooltip ? 0 : undefined}
    >
      <Abbr>{abbr}</Abbr>
      <Value>{value}</Value>
    </Tile>
  );

  if (!tooltip) {
    return tile;
  }

  return (
    <WarbandTooltip
      title={tooltip.title}
      tone={tooltip.tone}
      width={tooltip.width}
      placement={tooltip.placement}
    >
      {tile}
    </WarbandTooltip>
  );
}
