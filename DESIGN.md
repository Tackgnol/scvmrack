---
name: Scvm Grinder
description: Interactive Mörk Borg character sheet, fashioned as a punk grimoire for tabletop apocalypse
colors:
  yellow: "#FFE900"
  pink: "#FF3EB5"
  black: "#0a0a0a"
  off-black: "#111111"
  grey: "#1a1a1a"
  dark-grey: "#2a2a2a"
  white: "#f5f5f5"
  muted-text: "#888888"
  blood: "#8b0000"
  paper-cream: "#e9e9e4"
  print-ink: "#111111"
  stat-agi: "#2d5a27"
  stat-pre: "#5a2754"
  stat-str: "#5a3d27"
  stat-tou: "#27455a"
  stat-dmg: "#1a1a5a"
typography:
  display:
    fontFamily: "'Caveat Brush', cursive"
    fontSize: "3rem"
    fontWeight: 400
    lineHeight: 0.85
    letterSpacing: "normal"
  headline:
    fontFamily: "'Bebas Neue', sans-serif"
    fontSize: "2rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.05em"
  title:
    fontFamily: "'Bebas Neue', sans-serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "normal"
  subtitle:
    fontFamily: "'Bebas Neue', sans-serif"
    fontSize: "1.2rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "normal"
  gothic:
    fontFamily: "'MedievalSharp', serif"
    fontSize: "1.2rem"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "normal"
  body:
    fontFamily: "'Alegreya', Georgia, serif"
    fontSize: "0.9rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "'Antonio', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.2em"
  micro-label:
    fontFamily: "'Antonio', sans-serif"
    fontSize: "0.65rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.15em"
rounded:
  none: "0"
  pill: "50%"
spacing:
  hair: "4px"
  tight: "8px"
  step: "12px"
  card: "16px"
  section: "20px"
  zone: "32px"
components:
  button-primary:
    backgroundColor: "{colors.pink}"
    textColor: "{colors.black}"
    typography: "{typography.subtitle}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.black}"
  button-save:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.black}"
    typography: "{typography.subtitle}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
  button-save-hover:
    backgroundColor: "{colors.white}"
    textColor: "{colors.black}"
  button-action:
    backgroundColor: "transparent"
    textColor: "{colors.yellow}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "4px 16px"
  button-action-hover:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.black}"
  button-kill:
    backgroundColor: "{colors.blood}"
    textColor: "{colors.yellow}"
    typography: "{typography.micro-label}"
    rounded: "{rounded.none}"
    padding: "6px 24px"
  button-footer:
    backgroundColor: "{colors.black}"
    textColor: "{colors.yellow}"
    typography: "{typography.micro-label}"
    rounded: "{rounded.none}"
    padding: "6px 24px"
  paper-section:
    backgroundColor: "{colors.black}"
    textColor: "{colors.white}"
    rounded: "{rounded.none}"
    padding: "20px"
  paper-card:
    backgroundColor: "{colors.off-black}"
    textColor: "{colors.white}"
    rounded: "{rounded.none}"
    padding: "12px"
  dialog:
    backgroundColor: "{colors.black}"
    textColor: "{colors.white}"
    rounded: "{rounded.none}"
    padding: "24px"
  dialog-title:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.black}"
    typography: "{typography.title}"
  input-text:
    backgroundColor: "{colors.grey}"
    textColor: "{colors.white}"
    rounded: "{rounded.none}"
    padding: "10px 14px"
  input-resource:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.black}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "6px"
  chip-stat:
    backgroundColor: "{colors.black}"
    textColor: "{colors.yellow}"
    typography: "{typography.micro-label}"
    rounded: "{rounded.none}"
    padding: "4px 8px"
  nav-link-active:
    backgroundColor: "{colors.black}"
    textColor: "{colors.yellow}"
    typography: "{typography.gothic}"
    rounded: "{rounded.none}"
    width: "100px"
    height: "44px"
  nav-link-inactive:
    backgroundColor: "{colors.black}"
    textColor: "{colors.white}"
    typography: "{typography.gothic}"
    rounded: "{rounded.none}"
    width: "100px"
    height: "44px"
  section-stamp:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.black}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "2px 10px"
  notes-card:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.black}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "20px"
  tooltip:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.black}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
---

# Design System: Scvm Grinder

## 1. Overview

**Creative North Star: "The Punk Grimoire"**

Scvm Grinder is an interactive character sheet for Mörk Borg, the Swedish doom-metal tabletop RPG, and the interface dresses for the part. It is a xerox-punk illuminated manuscript: a black bunker stamped onto a screaming yellow page, with hot pink interruptions and blood-red warnings. Every surface is hard-edged, slightly tilted, and sits on top of a faint fractal-noise overlay so the screen reads less like a web app and more like a photocopied zine that survived the apocalypse.

Density is high, rhythm is jagged. Section headings are stamped on like rubber-stamp insignia (yellow ground, black 3px border, hard 4px black drop shadow, rotated 0.3–0.6°). Buttons lift with `translate(-2px, -2px)` and grow their shadow rather than fading or scaling — every interaction has a physical "ka-chunk" feel. There are no gradients, no rounded corners (`borderRadius: 0` is the global doctrine), no glass, no soft drop shadows. Shadows are always solid offsets in a brand color — the chunky black-or-pink box-shadow is the project's signature.

This system explicitly rejects: SaaS-clean Material rounded corners, dark-mode "elegant" interfaces, gradient-text headlines, glassmorphism, parchment-and-gold "fantasy generic" aesthetics, soft pastels, and the hero-metric template. If a design choice would feel at home in a Stripe dashboard or a Webflow agency template, it is wrong for this project.

**Key Characteristics:**
- **Yellow-as-paper, black-as-ink, pink-as-blood.** The body background is `#FFE900`; cards and content surfaces are `#0a0a0a` islands stamped onto it.
- **Zero corner radius everywhere.** `shape.borderRadius: 0` overrides MUI's defaults; sharp edges are the brand.
- **Hard-offset shadows in brand colors.** `4px 4px 0 #0a0a0a` and `6px 6px 0 #FF3EB5`; never blurred.
- **Tilted decorative elements.** Nav links, stamps, and notes sit at 0.2°–1.5° rotation. Committed, not whimsical.
- **Six fonts, each with one job.** Caveat Brush (display brush), Bebas Neue (UI headlines), MedievalSharp (gothic identity), Antonio (tracking-heavy labels), Alegreya (body prose), Black Ops One (loaded but reserved).
- **Print mode is a different system.** When `body.print-route-active` is set, the design becomes a black-on-cream A4 editorial sheet — Arial Black headlines, hairline borders, no color. The brand only lives on screen.

## 2. Colors

A confrontational trinity (Yellow / Pink / Black) plus a small set of supporting darks and a single deep-red for danger. Every color is committed; nothing is "subtle."

### Primary
- **Apocalypse Yellow** (`#FFE900`): The page itself. The body background, the section stamps, the save button, the dialog title bar, the resource inputs (HP, Omens), the active nav link's text. This color is the strategic load-bearing wall — where it lands, the eye lands.
- **Hot Pink Bone** (`#FF3EB5`): The interrupt color. Hover states on cards and nav links, drop-shadow behind dialogs, the menu border, the scrollbar thumb, stat chip for `def`. It is louder than yellow and used in smaller doses on purpose.

### Secondary
- **Blood Red** (`#8b0000`): Reserved for HP chips, the kill button, error snackbars, and the `hp` / `atk` stat colors. This color never decorates; it always means damage or destruction.

### Neutral
- **Pitch Black** (`#0a0a0a`): The text-surface. Cards, papers, dialogs, nav backgrounds. The "card" of this system.
- **Ink Black** (`#111111`): One step lighter, for nested item rows so they read as a sub-layer against `#0a0a0a` cards.
- **Carbon Grey** (`#1a1a1a`): Hairline borders, scrollbar track, low-emphasis text, secondary nav background.
- **Iron Grey** (`#2a2a2a`): Resting border on text inputs (becomes yellow on hover/focus).
- **Bone White** (`#f5f5f5`): Body text on dark surfaces. Never `#fff` — the warmth is intentional.
- **Muted Bone** (`#888888`): Placeholder text, low-emphasis labels in autocomplete results.

### Tertiary — Stat Colors
A muted, desaturated set used only for the four ability chips and damage indicators. They live in the dark mid-tones so they don't fight the trinity.
- **Forest** (`#2d5a27`) — agility (AGI)
- **Plum** (`#5a2754`) — presence (PRE)
- **Loam** (`#5a3d27`) — strength (STR)
- **Slate Blue** (`#27455a`) — toughness (TOU)
- **Deep Navy** (`#1a1a5a`) — damage (DMG)

### Print Mode Palette (separate doctrine)
- **Paper Cream** (`#e9e9e4`) — the print-route page background
- **Print Ink** (`#111`) — all type and rules

### Named Rules

**The Yellow-on-Black Rule.** The screen is yellow paper with black-ink content cards stamped onto it. Reverse this only inside dialog title bars, section stamps, and the save button — places where you want the surface itself to roar.

**The Pink Tax Rule.** Hot pink (`#FF3EB5`) is the interrupt. Every additional pink element on a screen weakens the previous one. Aim for one pink hover at a time. Two is loud. Three is noise.

**The No Soft Pink Rule.** There are no light pinks, salmon, or rose tones in this system. Pink either appears at full saturation `#FF3EB5` or doesn't appear at all.

## 3. Typography

**Display Font:** Caveat Brush, cursive (with system cursive fallback)
**Headline Font:** Bebas Neue, sans-serif (the workhorse — every uppercase title)
**Gothic Identity Font:** MedievalSharp, serif (nav links, character names, status chips)
**Label Font:** Antonio, sans-serif (tracking-heavy uppercase labels and microcopy)
**Body Font:** Alegreya, serif (with Georgia fallback — long-form prose and notes)
**Reserved:** Black Ops One (loaded for future stencil display use)

**Character:** Five faces working in deliberate friction. Caveat Brush feels like spray-paint over the page; Bebas Neue is condensed sans-serif riot-flyer text; MedievalSharp injects illuminated-manuscript gothic without going LARP; Antonio carries the tracking-heavy Mörk Borg trade-dress feel; Alegreya provides actually readable narrative type. The pairing is not "elegant," it is pointedly mismatched — that is the point.

### Hierarchy
- **Display** (Caveat Brush, 3rem, line-height 0.85, uppercase): Page-level hero text only — landing/404/marquee. Used sparingly. Never inside a card.
- **Headline (h2)** (Bebas Neue, 2rem, uppercase, letter-spacing 0.05em): Page titles inside content.
- **Title (h3)** (Bebas Neue, 1.5rem, uppercase): Section stamps, dialog titles. The most-used heading in the app.
- **Subtitle (h4)** (Bebas Neue, 1.2rem, uppercase): Sub-section labels.
- **Gothic Identity** (MedievalSharp, 1.2rem): Navigation links and character names. Reserved for items that should feel like a sigil.
- **Body** (Alegreya serif, 0.9rem, line-height ~1.5): Equipment descriptions, ability text, notes, long-form. Cap line length at 65–75ch. Bumps to 1rem under 600px viewport.
- **Label** (Antonio sans, 0.75rem, uppercase, letter-spacing 0.2em): Form field labels, summary stat labels, footer microcopy.
- **Micro-label** (Antonio sans, 0.65rem, uppercase, letter-spacing 0.15em): Stat chip text, button microcopy on action / kill / footer buttons.

### Named Rules

**The Six-Voice Rule.** Six fonts are loaded. Each one has exactly one job. Never use Caveat Brush for a button. Never set body copy in Bebas Neue. Never use MedievalSharp for labels. The friction holds because each face is locked to its role.

**The Always-Uppercase Rule.** Every heading, button, label, and chip is `text-transform: uppercase`. Sentence-case is reserved for body copy in Alegreya and italic placeholder text in the notes panel.

**The Antonio-for-Labels Rule.** Antonio with 0.15em–0.35em letter-spacing is the project's "trade dress" voice — small, wide, cold. It carries the Mörk Borg feel. Reach for it for labels and microcopy before reaching for Bebas.

## 4. Elevation

The system uses **hard-offset solid shadows in brand colors, never blurred shadows**. Depth is conveyed by tilt + offset + color contrast, not by blur or atmospheric perspective. Cards sit flat at rest; on interaction they "ka-chunk" — the element translates `-2px, -2px` and the shadow grows by 1–2px in the same direction, simulating physical lift on a printed sticker.

Tonal layering carries the rest of the depth: the page is `#FFE900`, content cards are `#0a0a0a`, nested item rows inside cards are `#111111`. Three discrete layers; no gradient between them.

### Shadow Vocabulary
- **Stamp Shadow** (`box-shadow: 4px 4px 0 #0a0a0a`): The default "stamped on the page" treatment for section headings, action buttons, snackbar alerts, and resource cards on the yellow background. Always solid, always brand-colored, never offset diagonally beyond 4–6px.
- **Pink Stamp Shadow** (`box-shadow: 6px 6px 0 #FF3EB5`): Reserved for hover states on nav links, the menu paper, and dialog containers. The bigger pink shadow signals "loud, focused, important" — a single use per screen.
- **Hover Step** (`transform: translate(-2px, -2px); box-shadow: 3px 3px 0 #0a0a0a → 4px 4px 0 #0a0a0a`): The interaction primitive. Buttons and cards translate up-left by 2px and grow their shadow by 1px on hover, snap back on `:active`.
- **Card Glow** (`box-shadow: 0 0 12px rgba(255, 62, 181, 0.3), inset 0 0 12px rgba(255, 62, 181, 0.05)`): The one allowed soft shadow — equipment card hover only, simulating a magenta fluorescence rather than depth. Use nowhere else.
- **Print Sheet Shadow** (`box-shadow: 0 18px 52px rgba(0, 0, 0, 0.28)`): The screen-only frame around the A4 print preview. Removed entirely under `@media print`.

### Named Rules

**The Solid-Shadow Rule.** All decorative shadows are solid offsets in `#0a0a0a` or `#FF3EB5`. Blurred shadows are forbidden except on the equipment card glow and the print preview frame. If you find yourself reaching for `rgba(0,0,0,0.1)` to "soften" something, the answer is to use no shadow at all.

**The Translate-Up-Left Rule.** Hover lift moves the element to `translate(-2px, -2px)`, never down or right. The shadow, conversely, grows down-right. The directional pairing is part of the brand's kinetic language.

## 5. Components

Every component lives by the same shape rules: zero radius, 1–4px solid borders, hard-offset shadows. Variance comes from color assignment and tilt — not from corner softness or depth.

### Buttons

- **Shape:** All buttons are `borderRadius: 0`. Square corners are non-negotiable.
- **Primary (`Save`)**: yellow background (`#FFE900`), black text, Bebas Neue uppercase. On hover, background flips to bone white. Used for the destructive-positive action ("Save Character," "Generate," "Confirm").
- **Primary (`MUI containedPrimary`)**: hot-pink background (`#FF3EB5`), black text. Hover flips to yellow. Used for default action buttons across forms.
- **Secondary**: dark-grey background, white text, 2px white border. Hover flips to white background, black text. Used for "Cancel" and tertiary navigation.
- **Action**: transparent background, 1px yellow border, yellow Antonio uppercase 0.7rem text. Hover fills yellow, text flips to black. Used inline inside item rows and panels.
- **Counter (+/-)**: 40×40px transparent with yellow border. Hover fills yellow. Used for ability score adjustment and quantity tweaks.
- **Footer / Kill**: dark surface (footer = black, kill = `#8b0000`), yellow Antonio 0.65rem text with 0.2em tracking, 3px black drop shadow. Hover translates `-1px, -1px` and flips to pink. Footer is informational; Kill is destructive.
- **Hover / Focus**: hover translates `-2px, -2px` and grows the drop shadow by 1px. Focus uses a 2px solid yellow outline at 2px offset (defined globally in `MuiCssBaseline`). Active snaps to `translate(0, 0)` with shadow removed — the "click" is felt.

### Inputs / Fields

- **Standard text input**: filled, dark grey (`#1a1a1a`) background, 2px iron-grey border, white text. Hover and focus shift the border to apocalypse yellow (`#FFE900`). Labels are pink Antonio uppercase, 0.75rem, 0.1em tracking.
- **Resource inputs (HP, Omens, ability scores)**: yellow (`#FFE900`) background, black text, Bebas Neue centered, no visible fieldset border. The input itself reads as a stamp value.
- **Character name input**: yellow MedievalSharp 1.8rem on dark background, with a 2px yellow border that shifts to pink on hover/focus.
- **Notes textarea**: yellow `#FFE900` Alegreya italic on a 2px-bordered black box. Placeholder is the same yellow at 0.35 opacity. Reads like a hand-scrawled note in the margin.
- **Focus**: bordered inputs shift their border to `#FFE900` (or `#FF3EB5` for character/class name fields). Underlined inputs use a yellow underline. The global focus-visible outline (2px yellow, 2px offset) overlays this for keyboard users.

### Cards / Containers

- **Section paper**: black `#0a0a0a` background, 1px carbon-grey hairline border, zero radius, 20px padding, 20px bottom margin. The default content container.
- **Item row**: nested `#111111` background inside a section paper. 1px grey border, no radius, overflow hidden. Reads as a sub-layer.
- **Equipment card**: `#111111` resting, transparent border. Hover lifts to `#1a1a1a` background, pink border, and the soft pink glow shadow (the only blurred shadow allowed). 0.2s cubic-bezier ease-out.
- **Notes card**: `#FFE900` yellow paper with a 6×6 black solid drop shadow and a 0.2° rotation. Reads like a Post-it stuck onto the page.
- **Section stamp** (the system's signature heading): yellow ground, 3px black border, 4×4 black solid drop shadow, 2–10px padding, rotated 0.3°–0.6° per instance. Used as the heading for every major section (Abilities, Notes, etc.). Always slightly tilted; the tilt direction alternates by section so the page reads kinetic.

### Chips & Badges

- **Stat chips**: zero radius, Antonio uppercase, 0.1em tracking. The fill colors are the stat palette (`#2d5a27` for AGI, `#5a2754` for PRE, etc.).
- **Quantity badge**: the one circular element in the system — a 28×28 yellow disc with a 2px black border. Bebas Neue numerals. Used for inventory item counts.
- **Status chip**: outlined, yellow border, yellow MedievalSharp text on a dark surface.

### Navigation

- **Layout:** flex row of fixed-size 100×44 link tiles.
- **Active link**: black background, yellow text, 3px yellow border, 4×4 pink solid shadow, rotated `-1.5°`. The active link is unmistakable.
- **Inactive link**: black background, white text, 3px grey border, 2×2 black solid shadow, rotated `1°` (opposite tilt).
- **Hover** (any link): rotates further to `-2°` and scales 1.02×, shadow becomes 6×6 yellow, text flips pink. Aggressive — the brand greets you on hover.
- **Mobile**: same components; the layout collapses to wrap.

### Dialogs / Modals

- **Frame**: black background, 4px yellow border, 10×10 pink solid drop shadow. Zero radius. The dialog feels like a stamped warrant pinned to the page.
- **Title bar**: yellow `#FFE900` background, black Bebas Neue uppercase 1.5rem. The dialog announces itself; the title bar is its bullhorn.
- **Body**: black with white Alegreya body text. Inputs inside follow the standard input rules but with pink-on-focus borders rather than yellow, to differentiate from the page.

### Snackbars (Toast Notifications)

- **Frame**: 2px black border, 4×4 black solid shadow, Antonio uppercase 0.8rem with 0.1em tracking, zero radius.
- **Error**: blood-red `#8b0000` ground, yellow text.
- **Success**: yellow `#FFE900` ground, black text and icon.
- **Info**: black ground, white text, 2px yellow border.
- **Warning**: hot-pink `#FF3EB5` ground, black text and icon.

### Signature Component — The Section Stamp

The most distinctive recurring pattern in the app. Used as the heading for every major content section ("Abilities," "Notes," "Origin," etc.):

- **Surface**: `#FFE900` yellow rectangle with a 3px solid `#0a0a0a` border.
- **Drop shadow**: hard solid `4px 4px 0 #0a0a0a`. No blur.
- **Type**: black Bebas Neue uppercase 1.5rem.
- **Padding**: 2px vertical, 10px horizontal — tight, like a rubber stamp.
- **Tilt**: rotated between `-0.6°` and `0.6°`. Every instance picks a slightly different angle so the page feels hand-stamped.
- **Inline-block**, never full-width. The stamp sits in the flow of the page, not above it.

### Print Sheet (separate visual system)

When the user enters the print route, the entire visual language switches:
- Background becomes paper cream `#e9e9e4`, with a `#fff` A4 sheet centered, surrounded by a soft 18×52px shadow on screen only (removed by `@media print`).
- All text becomes Arial / Arial Black on `#111` ink. The Mörk Borg fonts are not used in print.
- Headings get a stamped diagonal-stripe glyph (`linear-gradient(135deg, transparent 45%, #111 45%, ...)`) — the only piece of brand identity that crosses the print boundary.
- Cards become hairline-bordered editorial blocks with letter-spaced microcaps, modeled on a vintage RPG character sheet rather than the screen UI. This is intentional and not a visual regression.

## 6. Do's and Don'ts

### Do:

- **Do** keep `borderRadius: 0` on every surface, button, input, and chip. The square corner is the brand.
- **Do** use hard-offset solid shadows (`4px 4px 0 #0a0a0a`, `6px 6px 0 #FF3EB5`) for elevation. Never blurred shadows except on the equipment card hover glow.
- **Do** translate `-2px, -2px` on button and card hover, paired with a 1px shadow growth in the same direction.
- **Do** rotate decorative section stamps and the notes card by `0.2°–1.5°`. The tilt is committed, not random — pick a direction and an angle.
- **Do** lock each font to one role: Caveat Brush for display, Bebas Neue for headlines and buttons, MedievalSharp for navigation and character names, Antonio for labels, Alegreya for body.
- **Do** use Antonio with 0.15em–0.35em letter-spacing for all small uppercase labels.
- **Do** treat hot pink (`#FF3EB5`) as a budget — one loud pink hover or shadow per screen at most.
- **Do** stamp every major section heading inside a yellow rubber-stamp block (3px black border, 4×4 black drop shadow, slight tilt).
- **Do** preserve the print mode as a different visual system. Do not try to "harmonize" the two — they are intentionally distinct.
- **Do** keep the body text background as raw `#FFE900` yellow with a faint fractal-noise overlay (4% opacity SVG turbulence). The page is the paper.

### Don't:

- **Don't** introduce rounded corners anywhere. No `borderRadius: 4`, no `8`, no `lg`. Square only.
- **Don't** use blurred drop shadows (`box-shadow: 0 4px 8px rgba(0,0,0,0.1)` and similar). The Solid-Shadow Rule is absolute.
- **Don't** use `gradient-text` (`background-clip: text`), gradient backgrounds, or `linear-gradient` decoration anywhere on screen. The diagonal-stripe pattern in print mode is the only allowed gradient and it never appears on screen.
- **Don't** use Material Design or generic SaaS-clean patterns. If the design would look at home in a Stripe dashboard or an admin template, it's wrong.
- **Don't** use glassmorphism, backdrop blurs, frosted panels, or "elegant dark mode" patterns. The brand is harsh, not refined.
- **Don't** introduce parchment textures, gold leaf, "fantasy generic" gradients, or RPG-store-page aesthetics. Mörk Borg is doom metal, not D&D 5e.
- **Don't** soften pink. There are no rose, salmon, or pastel pinks. `#FF3EB5` or nothing.
- **Don't** use light grays for borders (`#ccc`, `#eee`). Borders are `#0a0a0a`, `#1a1a1a`, `#2a2a2a`, or `#FFE900` — nothing in between.
- **Don't** add a sixth font face or use any of the existing six outside its assigned role.
- **Don't** reach for `<Modal>` as a first instinct. Inline panels and drawers are the default; modals are reserved for destructive confirmation and authentication.
- **Don't** scale or fade buttons on hover. The hover language is translate-and-shadow, not scale or opacity.
- **Don't** introduce a sixth tilt direction or random transform values. Tilts are between `±2°`; rotation is committed and consistent within a component.
- **Don't** use `#000` or `#fff` directly. Use `#0a0a0a` and `#f5f5f5` — the warmth is intentional.
- **Don't** add side-stripe borders (`border-left: 4px solid #X`) on cards or alerts. If the alert needs identity, color the entire fill (see snackbar variants).
