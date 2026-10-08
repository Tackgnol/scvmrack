import { buildCharacterData } from '../lib/generate-character.js';
import { hydrateCharacterRow } from '../lib/get-character-full.js';
import {
  type AbilityStat,
  type CharacterDraft,
  type ClasslessStatOption,
  type DraftSection,
  type SectionSeeds,
  normalizeDropLowestAbilities,
  randomSectionSeeds,
  randomSeed,
  seededRollerFor,
} from '../lib/draft-seeds.js';
import { characterRepository } from '../repositories/character-repository.js';
import { apiError, unauthorized } from '../errors.js';
import { classChoiceError } from './class-choice.js';
import { resolveClassScope } from './class-scope-service.js';
import {
  fail,
  ok,
  unexpected,
  type ServiceLogger,
  type ServiceResult,
} from './result.js';
import { sessionUserId, type AppSession } from './session.js';
import { sanitizeString } from '../utils.js';

export type DraftResult = {
  draft: CharacterDraft;
  preview: Record<string, unknown>;
  classlessStatOptions?: ClasslessStatOption[];
};

type ClassSummary = {
  id: number;
  name: string | null;
  description: string | null;
};

function normalizedDraftName(raw: unknown): string | undefined {
  const name = sanitizeString(raw, 255);
  return name.length > 0 ? name : undefined;
}

/**
 * Stateless draft generation for the character creation flow. A draft is just
 * class choice plus per-section seeds; previews are rebuilt on demand.
 */
export function createCharacterDraftService(log: ServiceLogger) {
  async function buildDraftResult(
    draft: CharacterDraft,
    locale: string,
  ): Promise<DraftResult> {
    const classId = draft.classless ? null : draft.classId;
    const data = await buildCharacterData(
      classId,
      seededRollerFor(draft.seeds),
      { dropLowestAbilities: draft.dropLowestAbilities },
    );
    const { classlessStatOptions, ...rowData } = data;
    const name = normalizedDraftName(draft.name);
    if (name) {
      rowData.name = name;
    }
    const now = new Date();
    const preview = await hydrateCharacterRow(
      {
        ...rowData,
        id: null,
        storage: [],
        modifiers: [],
        notes: null,
        createdAt: now,
        updatedAt: now,
      },
      locale,
    );
    return {
      draft,
      preview,
      ...(classlessStatOptions ? { classlessStatOptions } : {}),
    };
  }


  return {
    async createDraft(input: {
      session: AppSession;
      inviteToken?: string | null;
      obrRoomId?: string | null;
      classId?: number | null;
      classless?: boolean;
      seeds?: SectionSeeds;
      name?: string | null;
      dropLowestAbilities?: AbilityStat[];
      locale: string;
    }): Promise<ServiceResult<DraftResult>> {
      if (!sessionUserId(input.session)) {
        return fail(unauthorized());
      }

      try {
        const scope = await resolveClassScope(input.inviteToken, input.obrRoomId);
        if (!scope.ok) return fail(scope.error);
        const classless = input.classless === true;
        let classId: number | null = classless ? null : (input.classId ?? null);

        const unavailable = classChoiceError(scope.value, classless, classId);
        if (unavailable) return fail(unavailable);

        // Random class is a one-time choice recorded in the draft, not a
        // seeded section. Rehydrating the same draft keeps the chosen class.
        if (classId === null && !classless) {
          const { classIds } = scope.value;
          if (classIds.length === 0) {
            return fail(apiError(409, 'CLASS_NOT_AVAILABLE', 'No classes are available here'));
          }
          classId = classIds[Math.floor(Math.random() * classIds.length)];
        }

        const name = normalizedDraftName(input.name);
        const dropLowestAbilities = classless
          ? normalizeDropLowestAbilities(input.dropLowestAbilities)
          : undefined;
        const draft: CharacterDraft = {
          classId,
          classless,
          ...(name ? { name } : {}),
          ...(classless ? { dropLowestAbilities } : {}),
          seeds: input.seeds ?? randomSectionSeeds(),
        };
        return ok(await buildDraftResult(draft, input.locale));
      } catch (err) {
        return fail(
          unexpected(log, err, 'DRAFT_CREATE_FAILED', 'Failed to create character draft')
        );
      }
    },

    async rerollSection(input: {
      session: AppSession;
      inviteToken?: string | null;
      obrRoomId?: string | null;
      draft: CharacterDraft;
      section: DraftSection;
      locale: string;
    }): Promise<ServiceResult<DraftResult>> {
      if (!sessionUserId(input.session)) {
        return fail(unauthorized());
      }

      try {
        const scope = await resolveClassScope(input.inviteToken, input.obrRoomId);
        if (!scope.ok) return fail(scope.error);
        // A draft without a class rolls classless, so it needs Classless allowed.
        const classless = input.draft.classless || input.draft.classId === null;
        const unavailable = classChoiceError(scope.value, classless, classless ? null : input.draft.classId);
        if (unavailable) return fail(unavailable);
        const dropLowestAbilities = input.draft.classless
          ? normalizeDropLowestAbilities(input.draft.dropLowestAbilities)
          : undefined;

        const name = input.section === 'name'
          ? undefined
          : normalizedDraftName(input.draft.name);
        const draft: CharacterDraft = {
          classId: input.draft.classId,
          classless: input.draft.classless,
          ...(name ? { name } : {}),
          ...(input.draft.classless ? { dropLowestAbilities } : {}),
          seeds: { ...input.draft.seeds, [input.section]: randomSeed() },
        };
        return ok(await buildDraftResult(draft, input.locale));
      } catch (err) {
        return fail(
          unexpected(log, err, 'DRAFT_REROLL_FAILED', 'Failed to re-roll draft section')
        );
      }
    },

    async listClasses(input: {
      locale: string;
      inviteToken?: string | null;
      obrRoomId?: string | null;
    }): Promise<ServiceResult<ClassSummary[]>> {
      try {
        const scope = await resolveClassScope(input.inviteToken, input.obrRoomId);
        if (!scope.ok) return fail(scope.error);
        return ok(await characterRepository.listClassesByIds(scope.value.classIds, input.locale));
      } catch (err) {
        return fail(
          unexpected(log, err, 'CLASS_LIST_FAILED', 'Failed to list classes')
        );
      }
    },
  };
}
