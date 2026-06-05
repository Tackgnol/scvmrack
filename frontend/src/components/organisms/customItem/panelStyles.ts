import { customStyles, morkBorgColors } from '@/theme/morkBorgTheme';

export const modalInputStyles = customStyles.modal.input;

// Tight pair: damage die + ammo type. Other fields drop to one-up rhythm so
// nothing else competes with the primary pair.
export const tightPairStyle = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) minmax(0, 1.2fr)' },
  gap: 1.25,
} as const;

// Single-up rhythm: stack secondary fields rather than packing them two-up.
export const stackStyle = {
  display: 'grid',
  gap: 1.25,
} as const;

// Identity grid for "header" inputs (name / value): name takes more weight.
export const identityGridStyle = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' },
  gap: 1.5,
} as const;

export const panelStyle = {
  display: 'grid',
  gap: 1.25,
  // No surrounding border — the yellow rule + heading IS the divider.
  pl: 1.25,
  borderLeft: `1px solid ${morkBorgColors.darkGrey}`,
} as const;

// Vertical rhythm between top-level movements.
export const sectionGap = { mt: 3 } as const;
