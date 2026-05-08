# MÖRK BORG Character Sheet

A React + TypeScript character sheet for the MÖRK BORG tabletop RPG, featuring a neo-brutalist punk aesthetic.

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Zustand** for state management (with localStorage persistence)
- **MUI (Material-UI)** with custom Mörk Borg theme

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/          # UI Components
│   ├── AbilityCard.tsx
│   ├── CharacterDescriptors.tsx
│   ├── EquipmentSection.tsx
│   ├── EquippedBar.tsx
│   ├── InventorySection.tsx
│   ├── ModifiersPanel.tsx
│   ├── MorkBorgModal.tsx
│   ├── PowersSection.tsx
│   ├── SummaryBar.tsx
│   └── index.ts
├── store/
│   └── characterStore.ts  # Zustand store
├── theme/
│   └── morkBorgTheme.ts   # MUI theme customization
├── types/
│   └── index.ts           # TypeScript types
├── styles/
│   └── global.css         # Global styles
├── App.tsx
└── main.tsx
```

## Features

- **Auto-persisted state** via Zustand's persist middleware
- **Responsive design** with MUI's responsive breakpoints
- **Computed values** (Defense = 12 + Agility + modifiers)
- **Modifier system** with stat targeting and comments
- **Custom modal** component matching the Mörk Borg aesthetic

## Google Analytics

Set `VITE_GA_MEASUREMENT_ID` in your frontend environment to enable Google Analytics 4 tracking:

```bash
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

The app initializes the `analytics` library with the `@analytics/google-analytics` plugin and tracks page views for SPA route changes.
It also tracks auth/character actions with GA events: `login`, `sign_up`, `login_magic_link_requested`, `generate_character`, `claim_character`, and `claim_character_skipped`.

## Color Palette

```typescript
const morkBorgColors = {
  yellow: '#FFE900',   // Primary (Pantone 803C)
  pink: '#FF3EB5',     // Secondary (Pantone 806C)
  black: '#0a0a0a',    // Background
  white: '#f5f5f5',    // Text
  grey: '#1a1a1a',     // Surfaces
  darkGrey: '#2a2a2a', // Borders
};
```

## License

This project is for personal use. MÖRK BORG is © Free League Publishing.
