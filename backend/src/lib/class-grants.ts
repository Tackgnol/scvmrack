// Legacy display-name → catalog-key maps for items/pets granted by class
// random abilities (`classes.random_abilities[].gainItem` / `gainPet`). New seed
// entries should put the catalog key directly in `gainItem`/`gainPet` so
// granting no longer breaks silently when an item is renamed/translated.
const GRANTED_ITEM_KEYS_BY_NAME: Record<string, string> = {
  'Crumpled Monster Mask': 'equipment.crumpled-monster-mask',
  'Wizard Teeth': 'equipment.wizard-teeth',
  'Lockpicks': 'equipment.lockpicks',
  'The Brown Scimitar of Galgenbeck': 'weapons.brown-scimitar',
  "Old Sigürd's Sling": 'weapons.sigurd-sling',
  "The Shoe of Death's Horse": 'weapons.shoe-of-death',
  'The Blade of your Ancestors': 'weapons.blade-of-ancestors',
  'The Snake-Skin Gift': 'weapons.snake-skin-gift',
  "Sacred Shepherd's Crook": 'weapons.sacred-shepherds-crook',
};

const GRANTED_PET_KEYS_BY_NAME: Record<string, string> = {
  'Hawk': 'pets.hawk',
  'Ancient Gore-Hound': 'pets.gore-hound',
  'Hamfund the Squire': 'pets.hamfund',
  'Barbarister the Incredible Horse': 'pets.barbarister',
  'Poltroon the Court Jester': 'pets.poltroon',
};

// Seed text mixes typographic (’) and ASCII (') apostrophes for the same name.
function normalizeGrantName(value: string): string {
  return value.replace(/[‘’]/g, "'");
}

export function grantedItemKeyForName(value: string): string | undefined {
  return GRANTED_ITEM_KEYS_BY_NAME[normalizeGrantName(value)];
}

export function grantedPetKeyForName(value: string): string | undefined {
  return GRANTED_PET_KEYS_BY_NAME[normalizeGrantName(value)];
}
