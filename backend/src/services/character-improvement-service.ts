import { Prisma } from '@prisma/client';
import {
  apiError,
  badRequest,
  conflict,
  notFound,
  unauthorized,
} from '../errors.js';
import { getCharacterFull } from '../lib/get-character-full.js';
import {
  buildAppliedImprovement,
  GettingBetterRuleError,
  type ImprovementDraft,
  normalizeSubmittedImprovementDraft,
} from '../lib/getting-better.js';
import { characterImprovementRepository } from '../repositories/character-improvement-repository.js';
import type { ImprovementCharacterRow } from '../repositories/character-improvement-repository.js';
import { isValidLocale, isValidUUID } from '../utils.js';
import type { PartyEventBus } from '../plugins/party-bus.js';
import { publishCharacterUpdated } from './character-events.js';
import { characterUpdateFromApplied, gainedAbilityItems } from './character-improvement-apply.js';
import {
  buildDraft,
  loadCatalog,
  rerollDraftSection,
  sameSnapshot,
  toPreviewResponse,
  upgradeActiveDraft,
  type ImprovementRerollSection,
  type PreviewResponse,
} from './character-improvement-preview.js';
import {
  fail,
  ok,
  unexpected,
  type ServiceLogger,
  type ServiceResult,
} from './result.js';
import {
  ownsCharacter,
  sessionId,
  sessionUserId,
  type AppSession,
} from './session.js';

export type { ImprovementRerollSection } from './character-improvement-preview.js';

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

    const row =
      await characterImprovementRepository.getCharacterForImprovement(id);
    if (!row) {
      return {
        ok: false,
        error: notFound('CHARACTER_NOT_FOUND', 'Character not found'),
      };
    }
    if (!ownsCharacter(session, row)) {
      return {
        ok: false,
        error: apiError(403, 'FORBIDDEN_CHARACTER', "You don't own this scvm"),
      };
    }
    return { ok: true, row };
  }

  return {
    async getOrCreatePreview(input: {
      id: string;
      session: AppSession;
      rawLocale?: unknown;
    }): Promise<ServiceResult<PreviewResponse>> {
      if (!isValidUUID(input.id)) {
        return fail(badRequest('INVALID_CHARACTER_ID', 'Invalid character ID'));
      }

      try {
        const locale = isValidLocale(input.rawLocale) ? input.rawLocale : 'en';
        const owned = await loadOwnedCharacter(input.id, input.session);
        if (!owned.ok) {
          return fail(owned.error);
        }

        const { catalog, classSettings } = await loadCatalog(owned.row);
        const active = await characterImprovementRepository.findActive(
          input.id
        );
        if (active) {
          const current = await upgradeActiveDraft(active, catalog);
          return ok(await toPreviewResponse(current, locale, classSettings));
        }

        const appliedCount = await characterImprovementRepository.countApplied(
          input.id
        );
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
        return ok(await toPreviewResponse(created, locale, classSettings));
      } catch (err) {
        const ruleError = mapRuleError(err);
        if (ruleError) {
          return fail(ruleError);
        }
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
      rawLocale?: unknown;
    }): Promise<ServiceResult<PreviewResponse>> {
      if (!isValidUUID(input.id) || !isValidUUID(input.improvementId)) {
        return fail(badRequest('INVALID_CHARACTER_ID', 'Invalid character ID'));
      }

      try {
        const locale = isValidLocale(input.rawLocale) ? input.rawLocale : 'en';
        const owned = await loadOwnedCharacter(input.id, input.session);
        if (!owned.ok) {
          return fail(owned.error);
        }

        const active = await characterImprovementRepository.findActiveById(
          input.id,
          input.improvementId
        );
        if (!active) {
          return fail(
            notFound('IMPROVEMENT_NOT_FOUND', 'Improvement preview not found')
          );
        }

        const appliedCount = await characterImprovementRepository.countApplied(
          input.id
        );
        const { catalog, classSettings } = await loadCatalog(owned.row);
        const current = await upgradeActiveDraft(active, catalog);
        const draft = await rerollDraftSection({
          activeDraft: current.rolledDraft as ImprovementDraft,
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
        return ok(await toPreviewResponse(updated, locale, classSettings));
      } catch (err) {
        const ruleError = mapRuleError(err);
        if (ruleError) {
          return fail(ruleError);
        }
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
        if (!owned.ok) {
          return fail(owned.error);
        }

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
        const { catalog, classAbilities } = await loadCatalog(owned.row);
        const appliedCount = await characterImprovementRepository.countApplied(
          input.id
        );
        const normalizedDraft = normalizeSubmittedImprovementDraft(
          input.draft,
          persistedDraft.snapshot,
          appliedCount,
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

        const applied = buildAppliedImprovement(
          normalizedDraft,
          {
            maxHp: owned.row.maxHp,
            silver: owned.row.silver ?? 0,
            abilities: normalizedDraft.snapshot.abilities,
            abilityKeys: normalizedDraft.snapshot.abilityKeys,
          },
          { draftId: active.id, appliedAt: new Date().toISOString() }
        );
        const data = characterUpdateFromApplied(
          owned.row,
          normalizedDraft,
          applied,
          await gainedAbilityItems(owned.row, classAbilities, applied)
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
        await publishCharacterUpdated(partyBus, input.id, Object.keys(data));
        return ok(character);
      } catch (err) {
        const ruleError = mapRuleError(err);
        if (ruleError) {
          return fail(ruleError);
        }
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
