import { type ReactElement, type SVGProps } from 'react';
import { type CustomItemKind } from '@/inventory/customItems';

// Minimal woodcut-y glyphs for the custom-item kind selector. Drawn as flat
// monochrome SVGs so they inherit the parent text color (yellow on selected
// tiles, white on idle tiles) without needing per-state variants.

type GlyphProps = SVGProps<SVGSVGElement>;

const baseProps: GlyphProps = {
  viewBox: '0 0 32 32',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.25,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
};

// Crossed daggers — the most decisive of the kinds, gets the most ink.
function WeaponGlyph(props: GlyphProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M6 6 L22 22" />
      <path d="M26 6 L10 22" />
      <path d="M22 22 L20 24 L24 28 L28 24 L26 22" />
      <path d="M10 22 L12 24 L8 28 L4 24 L6 22" />
    </svg>
  );
}

// Heater shield with a single vertical bar — heraldic, brutal.
function ArmorGlyph(props: GlyphProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M16 4 L26 7 L26 17 C26 23 22 27 16 29 C10 27 6 23 6 17 L6 7 Z" />
      <path d="M16 8 L16 26" />
    </svg>
  );
}

// Arrow nocked and ready.
function AmmoGlyph(props: GlyphProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M6 26 L26 6" />
      <path d="M18 6 L26 6 L26 14" />
      <path d="M6 22 L10 26" />
    </svg>
  );
}

// Vial with stopper — short, squat, dangerous.
function ConsumableGlyph(props: GlyphProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 4 L20 4" />
      <path d="M13 4 L13 10 L9 22 C9 26 23 26 23 22 L19 10 L19 4" />
      <path d="M11 18 L21 18" />
    </svg>
  );
}

// Generic relic — a square turned 45°, the catch-all.
function MiscGlyph(props: GlyphProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M16 4 L28 16 L16 28 L4 16 Z" />
      <path d="M16 10 L16 18" />
      <circle cx="16" cy="22" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

const GLYPHS: Record<CustomItemKind, (props: GlyphProps) => ReactElement> = {
  weapon: WeaponGlyph,
  armor: ArmorGlyph,
  ammo: AmmoGlyph,
  consumable: ConsumableGlyph,
  misc: MiscGlyph,
};

export default function KindGlyph({
  kind,
  size = 36,
  ...props
}: { kind: CustomItemKind; size?: number } & GlyphProps) {
  const Glyph = GLYPHS[kind];
  return <Glyph width={size} height={size} {...props} />;
}
