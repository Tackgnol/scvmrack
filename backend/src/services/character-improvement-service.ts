import { createHash } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { Roller, OSRandomEngine } from '@tackgnol/rpg-tools-roller';
import { apiError, badRequest, conflict, notFound, unauthorized } from '../errors.js';
import { getCharacterFull } from '../lib/get-character-full.js';
import {
  ABILITY_STATS,
  buildAppliedImprovement,
  buildImprovementSnapshot,
  type GettingBetterCatalog,
  GettingBetterRuleError,
  type ImprovementCharacterSnapshot,
  type ImprovementDraft,
  normalizeSubmittedImprovementDraft,
  rollAbilityImprovements,
  rollDebris,
  rollHpImprovement,
  rollScumSpecialties,
  type SpecialtySlot,
} from '../lib/getting-better.js';
import {
  characterImprovementRepository,
  type CharacterImprovementRow,
  type ImprovementCharacterRow,
  type ScrollCatalogRow,
  type ScumSpecialtyRow,
} from '../repositories/character-improvement-repository.js';
import { isValidLocale, isValidUUID } from '../utils.js';
import { fail, ok, unexpected, type ServiceLogger, type ServiceResult } from './result.js';
import { ownsCharacter, sessionId, sessionUserId, type AppSession } from './session.js';
import type { PartyEventBus } from '../plugins/party-bus.js';

const GUTTERBORN_SCUM_CLASS_ID = 2;

type PreviewResponse = {
  id: string;
  characterId: string;
  sequence: number;
  rolledDraft: ImprovementDraft;
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

type CatalogBundle = {
  catalog: GettingBetterCatalog;
  scumSpecialtyKeys: string[];
};

function toPreviewResponse(row: CharacterImprovementRow): PreviewResponse {
  return {
    id: row.id,
    characterId: row.characterId,
    sequence: row.sequence,
    rolledDraft: row.rolledDraft as ImprovementDraft,
    snapshotHash: row.snapshotHash,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  if (value !== null && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

function fingerprint(value: unknown): string {
  return createHash('sha256').update(stableStringify(value)).digest('hex');
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

function buildSnapshot(row: ImprovementCharacterRow): ImprovementCharacterSnapshot {
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
    equipmentFingerprint: fingerprint(row.equipment ?? []),
  });
}

function sameSnapshot(
  row: ImprovementCharacterRow,
  snapshot: ImprovementCharacterSnapshot
): boolean {
  return buildSnapshot(row).snapshotHash === snapshot.snapshotHash;
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

async function loadCatalog(row: ImprovementCharacterRow): Promise<CatalogBundle> {
  const [unclean, sacred, classAbilities] = await Promise.all([
    characterImprovementRepository.findScrolls('unclean'),
    characterImprovementRepository.findScrolls('sacred'),
    row.classId === GUTTERBORN_SCUM_CLASS_ID
      ? characterImprovementRepository.findClassAbilities(row.classId)
      : Promise.resolve([]),
  ]);

  const scumSpecialties = specialtyRows(classAbilities);
  const catalog: GettingBetterCatalog = {
    scrollKeys: (family) =>
      family === 'unclean' ? scrollKeys(unclean) : scrollKeys(sacred),
    scumSpecialties: () => scumSpecialties,
    scumFixedAbilityKeys: () => fixedAbilityKeys(classAbilities),
  };

  return {
    catalog,
    scumSpecialtyKeys: scumSpecialties.map((specialty) => specialty.key),
  };
}

function newRoller() {
  return new Roller({ engine: new OSRandomEngine() });
}

async function buildDraft(
  row: ImprovementCharacterRow,
  sequence: number,
  appliedCount: number,
  catalog: GettingBetterCatalog
): Promise<ImprovementDraft> {
  const roller = newRoller();
  const snapshot = buildSnapshot(row);
  const rawAbilities = snapshot.abilities;

  return {
    sequence,
    snapshot,
    hp: await rollHpImprovement({ maxHp: snapshot.maxHp }, roller),
    debris: await rollDebris(roller, catalog),
    abilities: await rollAbilityImprovements(rawAbilities, roller),
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

async function rerollDraftSection(input: {
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

  const roller = newRoller();
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

function equipmentWithAppliedDebris(
  row: ImprovementCharacterRow,
  draft: ImprovementDraft
): unknown[] | undefined {
  if (draft.debris.kind !== 'uncleanScroll' && draft.debris.kind !== 'sacredScroll') {
    return undefined;
  }

  return [
    ...asObjectArray(row.equipment),
    { key: draft.debris.itemKey, uses: [false, false, false, false] },
  ];
}

function abilityJsonFromKeys(
  currentAbilities: unknown,
  keys: string[]
): Array<Record<string, unknown>> {
  const existingByKey = new Map(
    asObjectArray(currentAbilities)
      .filter((ability) => typeof ability.key === 'string')
      .map((ability) => [ability.key as string, ability])
  );

  return keys.map((key) => ({ ...(existingByKey.get(key) ?? {}), key }));
}

function characterUpdateFromApplied(
  row: ImprovementCharacterRow,
  draft: ImprovementDraft,
  applied: ReturnType<typeof buildAppliedImprovement>
): Prisma.CharacterUpdateInput {
  const data: Prisma.CharacterUpdateInput = {};

  if (applied.changes.maxHp) {
    data.maxHp = applied.changes.maxHp.to;
  }

  if (applied.changes.silver) {
    data.silver = applied.changes.silver.to;
  }

  for (const stat of ABILITY_STATS) {
    const next = draft.abilities[stat].toScore;
    if (next !== row[stat]) {
      data[stat] = next;
    }
  }

  const equipment = equipmentWithAppliedDebris(row, draft);
  if (equipment) {
    data.equipment = equipment as Prisma.InputJsonValue;
  }

  if (applied.changes.abilityKeys) {
    data.abilities = abilityJsonFromKeys(
      row.abilities,
      applied.changes.abilityKeys.to
    ) as Prisma.InputJsonValue;
  }

  return data;
}

function mapRuleError(error: unknown) {
  if (error instanceof GettingBetterRuleError) {
    return badRequest('INVALID_IMPROVEMENT_DRAFT', error.message);
  }
  return null;
}

export function createCharacterImprovementService(
  log: ServiceLogger,
  partyBus?: PartyEventBus
) {
  async function loadOwnedCharacter(
    id: string,
    session: AppSession
  ): Promise<
    | { ok: true; row: ImprovementCharacterRow }
    | { ok: false; error: ReturnType<typeof unauthorized> }
  > {
    if (!sessionUserId(session) && !sessionId(session)) {
      return { ok: false, error: unauthorized() };
    }

    const row = await characterImprovementRepository.getCharacterForImprovement(id);
    if (!row) {
      return {
        ok: false,
        error: notFound('CHARACTER_NOT_FOUND', 'Character not found'),
      };
    }

    if (!ownsCharacter(session, row)) {
      return {
        ok: false,
        error: apiError(
          403,
          'FORBIDDEN_CHARACTER',
          "You don't own this scvm"
        ),
      };
    }

    return { ok: true, row };
  }

  return {
    async getOrCreatePreview(input: {
      id: string;
      session: AppSession;
    }): Promise<ServiceResult<PreviewResponse>> {
      if (!isValidUUID(input.id)) {
        return fail(badRequest('INVALID_CHARACTER_ID', 'Invalid character ID'));
      }

      try {
        const owned = await loadOwnedCharacter(input.id, input.session);
        if (!owned.ok) return fail(owned.error);

        const active = await characterImprovementRepository.findActive(input.id);
        if (active) {
          return ok(toPreviewResponse(active));
        }

        const appliedCount =
          await characterImprovementRepository.countApplied(input.id);
        const { catalog } = await loadCatalog(owned.row);
        const draft = await buildDraft(
          owned.row,
          appliedCount + 1,
          appliedCount,
          catalog
        );
        const created = await characterImprovementRepository.createActive(
          input.id,
          draft.sequence,
          draft as unknown as Prisma.InputJsonValue,
          draft.snapshot.snapshotHash
        );

        return ok(toPreviewResponse(created));
      } catch (err) {
        const ruleError = mapRuleError(err);
        if (ruleError) return fail(ruleError);
        return fail(
          unexpected(
            log,
            err,
            'IMPROVEMENT_PREVIEW_FAILED',
            'Failed to create improvement preview'
          )
        );
      }
    },

    async rerollSection(input: {
      id: string;
      improvementId: string;
      section: ImprovementRerollSection;
      session: AppSession;
    }): Promise<ServiceResult<PreviewResponse>> {
      if (!isValidUUID(input.id) || !isValidUUID(input.improvementId)) {
        return fail(badRequest('INVALID_CHARACTER_ID', 'Invalid character ID'));
      }

      try {
        const owned = await loadOwnedCharacter(input.id, input.session);
        if (!owned.ok) return fail(owned.error);

        const active = await characterImprovementRepository.findActiveById(
          input.id,
          input.improvementId
        );
        if (!active) {
          return fail(
            notFound('IMPROVEMENT_NOT_FOUND', 'Improvement preview not found')
          );
        }

        const activeDraft = active.rolledDraft as ImprovementDraft;
        const appliedCount =
          await characterImprovementRepository.countApplied(input.id);
        const { catalog } = await loadCatalog(owned.row);
        const draft = await rerollDraftSection({
          activeDraft,
          section: input.section,
          row: owned.row,
          appliedCount,
          catalog,
        });

        const updated = await characterImprovementRepository.updateRolledDraft(
          input.id,
          input.improvementId,
          draft as unknown as Prisma.InputJsonValue,
          draft.snapshot.snapshotHash
        );
        if (!updated) {
          return fail(
            notFound('IMPROVEMENT_NOT_FOUND', 'Improvement preview not found')
          );
        }

        return ok(toPreviewResponse(updated));
      } catch (err) {
        const ruleError = mapRuleError(err);
        if (ruleError) return fail(ruleError);
        return fail(
          unexpected(
            log,
            err,
            'IMPROVEMENT_REROLL_FAILED',
            'Failed to reroll improvement preview'
          )
        );
      }
    },

    async apply(input: {
      id: string;
      improvementId: string;
      draft: ImprovementDraft;
      session: AppSession;
      rawLocale: unknown;
    }): Promise<ServiceResult<unknown>> {
      if (!isValidUUID(input.id) || !isValidUUID(input.improvementId)) {
        return fail(badRequest('INVALID_CHARACTER_ID', 'Invalid character ID'));
      }

      const locale = isValidLocale(input.rawLocale) ? input.rawLocale : 'en';

      try {
        const owned = await loadOwnedCharacter(input.id, input.session);
        if (!owned.ok) return fail(owned.error);

        const active = await characterImprovementRepository.findActiveById(
          input.id,
          input.improvementId
        );
        if (!active) {
          return fail(
            notFound('IMPROVEMENT_NOT_FOUND', 'Improvement preview not found')
          );
        }

        const persistedDraft = active.rolledDraft as ImprovementDraft;
        const { catalog, scumSpecialtyKeys } = await loadCatalog(owned.row);
        const normalizedDraft = normalizeSubmittedImprovementDraft(
          input.draft,
          persistedDraft.snapshot,
          catalog
        );

        if (!sameSnapshot(owned.row, normalizedDraft.snapshot)) {
          return fail(
            conflict(
              'STALE_IMPROVEMENT_PREVIEW',
              'The character changed after this preview was rolled'
            )
          );
        }

        const appliedAt = new Date().toISOString();
        const applied = buildAppliedImprovement(
          normalizedDraft,
          {
            maxHp: owned.row.maxHp,
            silver: owned.row.silver ?? 0,
            abilities: normalizedDraft.snapshot.abilities,
            abilityKeys: normalizedDraft.snapshot.abilityKeys,
            scumSpecialtyKeys,
          },
          { draftId: active.id, appliedAt }
        );

        const data = characterUpdateFromApplied(
          owned.row,
          normalizedDraft,
          applied
        );

        const result = await characterImprovementRepository.applyInTransaction({
          characterId: input.id,
          improvementId: input.improvementId,
          characterData: data,
          applied: applied as unknown as Prisma.InputJsonValue,
        });
        if (!result.applied) {
          return fail(
            notFound('IMPROVEMENT_NOT_FOUND', 'Improvement preview not found')
          );
        }

        const character = await getCharacterFull(input.id, locale);
        if (!character) {
          return fail(notFound('CHARACTER_NOT_FOUND', 'Character not found'));
        }

        if (result.partyId) {
          partyBus?.publish(result.partyId, {
            type: 'character.updated',
            characterId: input.id,
            fields: Object.keys(data),
          });
        }

        return ok(character);
      } catch (err) {
        const ruleError = mapRuleError(err);
        if (ruleError) return fail(ruleError);
        return fail(
          unexpected(
            log,
            err,
            'IMPROVEMENT_APPLY_FAILED',
            'Failed to apply improvement'
          )
        );
      }
    },
  };
}
