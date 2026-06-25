/**
 * Seed model for the character creation flow.
 *
 * A draft character is a pure function of (class choice, per-section seeds):
 * each generation section rolls on its own ChaCha20-seeded Roller, so replacing
 * one section's seed re-rolls exactly that section while every cross-section
 * derivation (Presence -> gear quantities, Toughness -> HP) recomputes naturally.
 */
import { randomBytes } from 'node:crypto';
import { Roller } from '@tackgnol/rpg-tools-roller';
// Deliberate prod import: the test-utils subpath is where the package exports
// its deterministic seedable engine, which this feature is built on.
import { ChaCha20Engine } from '@tackgnol/rpg-tools-roller/test-utils';

export const DRAFT_SECTIONS = [
  'name',
  'stats',
  'omens',
  'silver',
  'origin',
  'abilities',
  'gear',
  'personality',
] as const;

export const ABILITY_STATS = ['strength', 'agility', 'presence', 'toughness'] as const;

export type DraftSection = (typeof DRAFT_SECTIONS)[number];
export type AbilityStat = (typeof ABILITY_STATS)[number];
export type SectionSeeds = Record<DraftSection, string>;
export type RollerFor = (section: DraftSection) => Roller;

export interface ClasslessStatOption {
  ability: AbilityStat;
  dice: number[];
  minTotal: number;
  maxTotal: number;
  selected: boolean;
}

export interface CharacterDraft {
  classId: number | null;
  classless: boolean;
  seeds: SectionSeeds;
  name?: string;
  dropLowestAbilities?: AbilityStat[];
}

/** Validates a 32-byte seed: 64 lowercase hex characters. */
export const SEED_PATTERN = /^[0-9a-f]{64}$/;

export function randomSeed(): string {
  return randomBytes(32).toString('hex');
}

export function randomSectionSeeds(): SectionSeeds {
  return Object.fromEntries(
    DRAFT_SECTIONS.map((section) => [section, randomSeed()])
  ) as SectionSeeds;
}

export function isSectionSeeds(value: unknown): value is SectionSeeds {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return DRAFT_SECTIONS.every(
    (section) =>
      typeof record[section] === 'string' && SEED_PATTERN.test(record[section] as string)
  );
}

export function normalizeDropLowestAbilities(value: unknown): AbilityStat[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const valid = new Set<AbilityStat>(ABILITY_STATS);
  const unique: AbilityStat[] = [];
  for (const item of value) {
    if (typeof item !== 'string' || !valid.has(item as AbilityStat)) {
      continue;
    }
    const ability = item as AbilityStat;
    if (!unique.includes(ability)) {
      unique.push(ability);
    }
  }
  return unique.slice(0, 2);
}

/**
 * Per-section seeded roller factory. Returns the SAME Roller instance for
 * repeated calls with the same section, so multi-roll sections (gear pool +
 * inventory-uses hydration) consume one continuous deterministic sequence.
 * @param seeds Must have passed {@link isSectionSeeds}.
 */
export function seededRollerFor(seeds: SectionSeeds): RollerFor {
  const cache = new Map<DraftSection, Roller>();
  return (section) => {
    let roller = cache.get(section);
    if (!roller) {
      roller = new Roller({
        engine: new ChaCha20Engine(new Uint8Array(Buffer.from(seeds[section], 'hex'))),
      });
      cache.set(section, roller);
    }
    return roller;
  };
}
