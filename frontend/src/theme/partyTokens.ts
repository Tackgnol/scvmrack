import { fonts } from '@/theme/createStyles';
import { morkBorgColors } from '@/theme/morkBorgTheme';

// Font roles, locked per the Six-Voice Rule in DESIGN.md. These are the party's
// semantic role names mapped onto the single canonical font-token set (`fonts`) so
// there is one source of truth for the faces — no re-typed literals.
export const partyFonts = {
  display: fonts.accent, // Caveat Brush
  headline: fonts.display, // Bebas Neue
  gothic: fonts.medieval, // MedievalSharp
  label: fonts.label, // Antonio
  body: fonts.body, // Alegreya
} as const;

export const partyColors = {
  ...morkBorgColors,
  // Off-black for the second dark surface layer (expand panels).
  offBlack: '#111111',
  // Tooltip glow edges for buff / debuff modifier strips.
  buff: '#8fce6a',
  debuff: '#ff6b6b',
  // Muted label text — clears WCAG AA (≈5.4:1) on the black / off-black surfaces.
  mutedText: '#888888',
  // Muted text for the *yellow* page surface: a darker shade of the page's own
  // hue (≈5.6:1 on #FFE900). Grey would wash out; this stays in the brand.
  mutedInk: '#6b5800',
  // Class Pool rows: blurb text, and the dimmed name/blurb of a switched-off class.
  blurbText: '#bbbbbb',
  offText: '#9a9a9a',
  offBlurb: '#777777',
  // Form field edge: 3:1 on cards (#1a1a1a) and on the black paper (WCAG 1.4.11).
  fieldEdge: '#6e6e6e',
  // Aged-parchment tan for affliction lines on dark surfaces.
  afflictionText: '#c9b27a',
} as const;
