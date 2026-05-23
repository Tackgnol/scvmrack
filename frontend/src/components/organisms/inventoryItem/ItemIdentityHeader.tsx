import { Box, Typography } from '@mui/material';
import { type EquipmentItem } from '@/hooks/models';
import { morkBorgColors } from '@/theme/morkBorgTheme';
import KindGlyph from '../customItem/KindGlyph';
import ItemStatChips from './ItemStatChips';
import { itemGlyphKind } from './itemGlyphKind';

interface ItemIdentityHeaderProps {
  /** Live editable name from the form, so the header tracks typing. */
  displayName: string;
  /** Fallback when no name has been typed (translated upstream). */
  unnamedFallback: string;
  /** The underlying item — used for glyph kind detection and stat chips. */
  item: EquipmentItem;
}

const wrap = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  gap: 1.5,
  alignItems: 'start',
  mb: 2,
} as const;

const glyphSquare = {
  width: 56,
  height: 56,
  display: 'grid',
  placeItems: 'center',
  border: `2px solid ${morkBorgColors.yellow}`,
  color: morkBorgColors.yellow,
} as const;

const nameStyle = {
  fontFamily: "'Bebas Neue', sans-serif",
  fontSize: '1.6rem',
  lineHeight: 1.05,
  letterSpacing: '0.04em',
  color: morkBorgColors.yellow,
  textTransform: 'uppercase' as const,
  wordBreak: 'break-word' as const,
};

// Top-of-modal identity stamp: yellow-bordered glyph, big Bebas Neue name,
// kind-aware chips. The header IS the preview — the user already has the
// item, so this re-asserts identity without redundant chrome.
export default function ItemIdentityHeader({
  displayName,
  unnamedFallback,
  item,
}: ItemIdentityHeaderProps) {
  return (
    <Box sx={wrap}>
      <Box sx={glyphSquare}>
        <KindGlyph kind={itemGlyphKind(item)} size={32} />
      </Box>
      <Box>
        <Typography component="h2" sx={nameStyle}>
          {displayName || unnamedFallback}
        </Typography>
        <ItemStatChips item={item} />
      </Box>
    </Box>
  );
}
