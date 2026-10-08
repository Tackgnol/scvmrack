import { createHash } from 'node:crypto';
import type { Prisma } from '@prisma/client';
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
  rollClassAbility,
  upgradeLegacyImprovementDraft,
  type ClassAbilityDraft,
  type SpecialtySlot,
} from '../lib/getting-better.js';
import { stableStringify } from '../lib/stable-json.js';
import { findTranslationsWithAuthoredFallback } from '../lib/class-translations.js';
import { byClassOrder } from '../lib/ability-order.js';
import {
  characterImprovementRepository,
  type CharacterImprovementRow,
  type ImprovementCharacterRow,
  type ScrollCatalogRow,
  type ClassAbilityRow,
  type ClassGettingBetterRow,
} from '../repositories/character-improvement-repository.js';
import { catalogRepository } from '../repositories/catalog-repository.js';

export type PreviewResponse = {
  id: string;
  characterId: string;
  sequence: number;
  rolledDraft: ImprovementDraft;
  abilityNames: Record<string, string>;
  rulesNote: string | null;
  snapshotHash: string;
  createdAt: string;
  updatedAt: string;
};

export type ImprovementRerollSection =
  | 'hp'
  | 'debris'
  | 'abilities'
  | 'classAbility'
  | 'all';

export type CatalogBundle = {
  catalog: GettingBetterCatalog;
  classAbilities: ClassAbilityRow[];
  classSettings: ClassGettingBetterRow | null;
};

export async function toPreviewResponse(
  row: CharacterImprovementRow,
  locale: string,
  classSettings: ClassGettingBetterRow | null
): Promise<PreviewResponse> {
  const draft = row.rolledDraft as ImprovementDraft;
  const noteKey = classSettings?.gettingBetterNoteKey ?? null;
  const abilityKeys = classAbilityKeys(draft.classAbility);
  const translations = await findTranslationsWithAuthoredFallback(
    locale,
    classSettings?.languages ?? [],
    noteKey ? [...abilityKeys, noteKey] : abilityKeys
  );
  const abilityNames = Object.fromEntries(
    abilityKeys.flatMap((key) => {
      const name = translations.get(key);
      return name === undefined ? [] : [[key, name]];
    })
  );

  return {
    id: row.id,
    characterId: row.characterId,
    sequence: row.sequence,
    rolledDraft: draft,
    abilityNames,
    rulesNote: noteKey ? (translations.get(noteKey) ?? null) : null,
    snapshotHash: row.snapshotHash,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function classAbilityKeys(draft: ClassAbilityDraft): string[] {
  switch (draft.kind) {
    case 'none':
      return [];
    case 'newAbility':
      return draft.added ? [draft.added.key] : [];
    case 'firstSpecialty':
      return [...draft.existing.map((slot) => slot.key), ...(draft.added ? [draft.added.key] : [])];
    case 'specialties':
      return draft.specialties.flatMap((choice) => [
        choice.current.key,
        ...(choice.replacement ? [choice.replacement.key] : []),
      ]);
  }
}

/** Converts an active preview saved in the pre-RPG-260 shape and stores the result. */
export async function upgradeActiveDraft(
  row: CharacterImprovementRow,
  catalog: GettingBetterCatalog
): Promise<CharacterImprovementRow> {
  const draft = row.rolledDraft as Record<string, unknown> & {
    snapshot: { abilityKeys: string[] };
  };
  const upgraded = await upgradeLegacyImprovementDraft(
    draft,
    draft.snapshot.abilityKeys,
    new Roller({ engine: new OSRandomEngine() }),
    catalog
  );
  if (!upgraded) return row;
  const saved = await characterImprovementRepository.updateRolledDraft(
    row.characterId,
    row.id,
    upgraded as Prisma.InputJsonValue,
    row.snapshotHash
  );
  return saved ?? { ...row, rolledDraft: upgraded };
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
  const [unclean, sacred, latestClass] = await Promise.all([
    characterImprovementRepository.findScrolls('unclean'),
    characterImprovementRepository.findScrolls('sacred'),
    row.classId !== null
      ? characterImprovementRepository.findLatestClassCatalog(row.classId)
      : Promise.resolve(null),
  ]);
  const classAbilities = latestClass?.abilities ?? [];
  const classSettings = latestClass
    ? {
        gettingBetterRule: latestClass.gettingBetterRule,
        gettingBetterNoteKey: latestClass.gettingBetterNoteKey,
        languages: latestClass.languages,
      }
    : null;

  const pool = poolRows(classAbilities);
  return {
    catalog: {
      scrollKeys: (family) =>
        family === 'unclean' ? scrollKeys(unclean) : scrollKeys(sacred),
      classRule: () => classSettings?.gettingBetterRule ?? 'book',
      classPool: () => pool,
    },
    classAbilities,
    classSettings,
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
    classAbility: await rollClassAbility(
      snapshot.abilityKeys,
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
    case 'classAbility':
      return {
        ...input.activeDraft,
        classAbility: await rollClassAbility(
          snapshot.abilityKeys,
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

/** The class's random abilities in pool order, numbered 1..N as a zine prints its list. */
function poolRows(rows: ClassAbilityRow[]): SpecialtySlot[] {
  return rows
    .filter((row) => row.isRandom === true)
    .sort(byClassOrder)
    .map((row, index) => ({ key: row.key, rollValue: index + 1 }));
}
