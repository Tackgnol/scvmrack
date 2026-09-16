import { createHash } from 'node:crypto';
import { Roller, OSRandomEngine } from '@tackgnol/rpg-tools-roller';
import {
  buildImprovementSnapshot,
  type GettingBetterCatalog,
  GettingBetterRuleError,
  type ImprovementCharacterSnapshot,
  type ImprovementDraft,
  rollAbilityImprovements,
  rollDebris,
  rollHpImprovement,
  rollScumSpecialties,
  type SpecialtySlot,
} from '../lib/getting-better.js';
import { stableStringify } from '../lib/stable-json.js';
import {
  characterImprovementRepository,
  type CharacterImprovementRow,
  type ImprovementCharacterRow,
  type ScrollCatalogRow,
  type ScumSpecialtyRow,
} from '../repositories/character-improvement-repository.js';
import { catalogRepository } from '../repositories/catalog-repository.js';

const GUTTERBORN_SCUM_CLASS_ID = 2;

export type PreviewResponse = {
  id: string;
  characterId: string;
  sequence: number;
  rolledDraft: ImprovementDraft;
  scumSpecialtyNames: Record<string, string>;
  snapshotHash: string;
  createdAt: string;
  updatedAt: string;
};

export type ImprovementRerollSection =
  | 'hp'
  | 'debris'
  | 'abilities'
  | 'scumSpecialties'
  | 'all';

export type CatalogBundle = {
  catalog: GettingBetterCatalog;
  scumSpecialtyKeys: string[];
};

export async function toPreviewResponse(
  row: CharacterImprovementRow,
  locale: string
): Promise<PreviewResponse> {
  const draft = row.rolledDraft as ImprovementDraft;
  const specialties = draft.scumSpecialties;
  const keys =
    specialties.kind === 'firstImprovement'
      ? [specialties.existing.key, specialties.added.key]
      : specialties.kind === 'laterImprovement'
      ? [specialties.primary.key, specialties.secondary.key]
      : [];
  const translations = await catalogRepository.findTranslations(locale, keys);

  return {
    id: row.id,
    characterId: row.characterId,
    sequence: row.sequence,
    rolledDraft: draft,
    scumSpecialtyNames: Object.fromEntries(
      translations.map(({ key, value }) => [key, value])
    ),
    snapshotHash: row.snapshotHash,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function buildSnapshot(
  row: ImprovementCharacterRow
): ImprovementCharacterSnapshot {
  return buildImprovementSnapshot({
    characterUpdatedAt: row.updatedAt.toISOString(),
    maxHp: row.maxHp,
    silver: row.silver ?? 0,
    abilities: {
      strength: row.strength,
      agility: row.agility,
      presence: row.presence,
      toughness: row.toughness,
    },
    abilityKeys: abilityKeys(row.abilities),
    equipmentFingerprint: createHash('sha256')
      .update(stableStringify(row.equipment ?? []))
      .digest('hex'),
  });
}

export function sameSnapshot(
  row: ImprovementCharacterRow,
  snapshot: ImprovementCharacterSnapshot
): boolean {
  return buildSnapshot(row).snapshotHash === snapshot.snapshotHash;
}

export async function loadCatalog(
  row: ImprovementCharacterRow
): Promise<CatalogBundle> {
  const [unclean, sacred, classAbilities] = await Promise.all([
    characterImprovementRepository.findScrolls('unclean'),
    characterImprovementRepository.findScrolls('sacred'),
    row.classId === GUTTERBORN_SCUM_CLASS_ID
      ? characterImprovementRepository.findClassAbilities(row.classId)
      : Promise.resolve([]),
  ]);

  const scumSpecialties = specialtyRows(classAbilities);
  return {
    catalog: {
      scrollKeys: (family) =>
        family === 'unclean' ? scrollKeys(unclean) : scrollKeys(sacred),
      scumSpecialties: () => scumSpecialties,
      scumFixedAbilityKeys: () => fixedAbilityKeys(classAbilities),
    },
    scumSpecialtyKeys: scumSpecialties.map((specialty) => specialty.key),
  };
}

export async function buildDraft(
  row: ImprovementCharacterRow,
  sequence: number,
  appliedCount: number,
  catalog: GettingBetterCatalog
): Promise<ImprovementDraft> {
  const roller = new Roller({ engine: new OSRandomEngine() });
  const snapshot = buildSnapshot(row);
  return {
    sequence,
    snapshot,
    hp: await rollHpImprovement({ maxHp: snapshot.maxHp }, roller),
    debris: await rollDebris(roller, catalog),
    abilities: await rollAbilityImprovements(snapshot.abilities, roller),
    scumSpecialties: await rollScumSpecialties(
      {
        isGutterbornScum: row.classId === GUTTERBORN_SCUM_CLASS_ID,
        abilityKeys: snapshot.abilityKeys,
      },
      appliedCount,
      roller,
      catalog
    ),
  };
}

export async function rerollDraftSection(input: {
  activeDraft: ImprovementDraft;
  section: ImprovementRerollSection;
  row: ImprovementCharacterRow;
  appliedCount: number;
  catalog: GettingBetterCatalog;
}): Promise<ImprovementDraft> {
  if (input.section === 'all') {
    return buildDraft(
      input.row,
      input.activeDraft.sequence,
      input.appliedCount,
      input.catalog
    );
  }

  const roller = new Roller({ engine: new OSRandomEngine() });
  const snapshot = input.activeDraft.snapshot;
  switch (input.section) {
    case 'hp':
      return {
        ...input.activeDraft,
        hp: await rollHpImprovement({ maxHp: snapshot.maxHp }, roller),
      };
    case 'debris':
      return {
        ...input.activeDraft,
        debris: await rollDebris(roller, input.catalog),
      };
    case 'abilities':
      return {
        ...input.activeDraft,
        abilities: await rollAbilityImprovements(snapshot.abilities, roller),
      };
    case 'scumSpecialties':
      return {
        ...input.activeDraft,
        scumSpecialties: await rollScumSpecialties(
          {
            isGutterbornScum: input.row.classId === GUTTERBORN_SCUM_CLASS_ID,
            abilityKeys: snapshot.abilityKeys,
          },
          input.appliedCount,
          roller,
          input.catalog
        ),
      };
    default:
      throw new GettingBetterRuleError('invalid reroll section');
  }
}

function asObjectArray(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Record<string, unknown> =>
      item !== null && typeof item === 'object' && !Array.isArray(item)
  );
}

function abilityKeys(value: unknown): string[] {
  return asObjectArray(value)
    .map((ability) => ability.key)
    .filter((key): key is string => typeof key === 'string' && key.length > 0);
}

function scrollKeys(rows: ScrollCatalogRow[]): string[] {
  return rows
    .filter((row) => typeof row.roll === 'number')
    .sort((left, right) => (left.roll ?? 0) - (right.roll ?? 0))
    .map((row) => row.key);
}

function specialtyRows(rows: ScumSpecialtyRow[]): SpecialtySlot[] {
  return rows
    .filter(
      (row): row is ScumSpecialtyRow & { rollValue: number } =>
        row.isRandom === true && Number.isInteger(row.rollValue)
    )
    .sort((left, right) => left.rollValue - right.rollValue)
    .map((row) => ({ key: row.key, rollValue: row.rollValue }));
}

function fixedAbilityKeys(rows: ScumSpecialtyRow[]): string[] {
  return rows
    .filter((row) => row.isRandom !== true)
    .map((row) => row.key)
    .filter((key) => key.length > 0);
}
