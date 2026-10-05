import { CUSTOM_CLASS_MAX_PER_GM } from '../lib/class-limits.js';
import { classDraftProblems, classSpecFromDraft, type ClassDraft, type ClassLanguage } from '../lib/class-draft.js';
import { randomSectionSeeds, seededRollerFor } from '../lib/draft-seeds.js';
import { buildCharacterDataFromSpec } from '../lib/generate-character.js';
import { hydrateCharacterRow } from '../lib/get-character-full.js';
import { apiError, badRequest, notFound, unauthorized } from '../errors.js';
import {
  customClassRepository,
  type OwnClassSummary,
} from '../repositories/custom-class-repository.js';
import { catalogRepository } from '../repositories/catalog-repository.js';
import { fail, ok, unexpected, type ServiceLogger, type ServiceResult } from './result.js';
import { isGm, sessionUserId, type AppSession } from './session.js';

const NAME_CONSTRAINT = 'classes_name_per_owner';

const notYours = () => notFound('CLASS_NOT_FOUND', 'Class not found');

function draftInvalid(problems: string[]) {
  return badRequest(
    'CLASS_DRAFT_INVALID',
    `This class can't be saved yet: ${problems.join('; ')}.`,
    problems.map((message) => ({ message }))
  );
}

function nameTaken(draft: ClassDraft) {
  return apiError(
    409,
    'CLASS_NAME_TAKEN',
    `You already have a class called “${draft.name[draft.languages[0]].trim()}”. Give this one another name.`
  );
}

/** Checks external grant keys against the shared catalog and their appropriate slot. */
async function catalogGrantProblems(draft: ClassDraft): Promise<string[]> {
  const ownRefs = new Set(draft.items.map((item) => item.ref));
  const grants = draft.abilities.flatMap((ability, i) =>
    ([
      ['item', ability.grantItem],
      ['pet', ability.grantPet],
    ] as const).flatMap(([slot, key]) =>
      key && !ownRefs.has(key) ? [{ ability, i, key, slot }] : []
    )
  );
  const found = await catalogRepository.findSharedItemsByKeys(
    [...new Set(grants.map((grant) => grant.key))]
  );
  const typeByKey = new Map(found.map((item) => [item.key, item.itemType]));
  return grants.flatMap(({ ability, i, key, slot }) => {
    const itemType = typeByKey.get(key);
    const who = ability.name[draft.languages[0]].trim() || `ability ${i + 1}`;
    if (!itemType) return `Ability “${who}” grants an unavailable catalog item`;
    if ((itemType === 'pet') !== (slot === 'pet')) {
      return `Ability “${who}” holds a ${itemType === 'pet' ? 'pet' : 'non-pet'} catalog item in its ${slot} slot`;
    }
    return [];
  });
}


type SavedClass = { id: number; draft: ClassDraft };

/** The class as stored, so new origins and abilities come back with their keys. */
async function saved(id: number): Promise<SavedClass> {
  const found = await customClassRepository.findWithText(id);
  if (!found) throw new Error(`Class ${id} vanished right after saving`);
  return { id: found.id, draft: found.draft };
}

const isNameClash = (err: unknown) => String((err as Error)?.message ?? err).includes(NAME_CONSTRAINT);

/** The class creator and the GM's own class list. Custom Classes are owned by signed-in GMs. */
export function createCustomClassService(log: ServiceLogger) {
  return {
    async listMine(input: { session: AppSession; locale: string }): Promise<ServiceResult<OwnClassSummary[]>> {
      if (!isGm(input.session)) return fail(unauthorized());
      try {
        return ok(await customClassRepository.listOwned(sessionUserId(input.session)!, input.locale));
      } catch (err) {
        return fail(unexpected(log, err, 'CLASS_LIST_FAILED', 'Failed to list your classes'));
      }
    },

    async get(input: { session: AppSession; id: number }): Promise<ServiceResult<{ id: number; draft: ClassDraft }>> {
      if (!isGm(input.session)) return fail(unauthorized());
      try {
        const found = await customClassRepository.findWithText(input.id);
        if (!found || found.ownerUserId !== sessionUserId(input.session)) return fail(notYours());
        return ok({ id: found.id, draft: found.draft });
      } catch (err) {
        return fail(unexpected(log, err, 'CLASS_LOAD_FAILED', 'Failed to load the class'));
      }
    },

    async create(input: { session: AppSession; draft: ClassDraft }): Promise<ServiceResult<SavedClass>> {
      if (!isGm(input.session)) return fail(unauthorized());
      const ownerUserId = sessionUserId(input.session)!;
      const problems = [...classDraftProblems(input.draft), ...(await catalogGrantProblems(input.draft))];
      if (problems.length > 0) return fail(draftInvalid(problems));
      try {
        // ponytail: count-then-insert; two saves in the same instant can overshoot the cap by one.
        if ((await customClassRepository.countOwnedLineages(ownerUserId)) >= CUSTOM_CLASS_MAX_PER_GM) {
          return fail(
            apiError(
              409,
              'CLASS_LIMIT_REACHED',
              `You have ${CUSTOM_CLASS_MAX_PER_GM} classes, the most one account can hold. Delete one nobody has played to make room.`
            )
          );
        }
        const id = await customClassRepository.create(ownerUserId, input.draft);
        return ok(await saved(id));
      } catch (err) {
        if (isNameClash(err)) return fail(nameTaken(input.draft));
        return fail(unexpected(log, err, 'CLASS_SAVE_FAILED', 'Failed to save the class'));
      }
    },

    async update(input: { session: AppSession; id: number; draft: ClassDraft }): Promise<ServiceResult<SavedClass>> {
      if (!isGm(input.session)) return fail(unauthorized());
      const problems = [...classDraftProblems(input.draft), ...(await catalogGrantProblems(input.draft))];
      if (problems.length > 0) return fail(draftInvalid(problems));
      try {
        const found = await customClassRepository.findWithText(input.id);
        if (!found || found.ownerUserId !== sessionUserId(input.session)) return fail(notYours());
        if (!found.isLatest) {
          return fail(apiError(409, 'CLASS_NOT_LATEST', 'A newer version of this class exists. Edit that one.'));
        }
        await customClassRepository.update(input.id, input.draft);
        return ok(await saved(input.id));
      } catch (err) {
        if (isNameClash(err)) return fail(nameTaken(input.draft));
        return fail(unexpected(log, err, 'CLASS_SAVE_FAILED', 'Failed to save the class'));
      }
    },

    /** Rolls a scvm from a draft as it stands and keeps nothing. Text problems don't block it. */
    async testRoll(input: {
      session: AppSession;
      draft: ClassDraft;
      language: ClassLanguage;
      locale: string;
    }): Promise<ServiceResult<Record<string, unknown>>> {
      if (!isGm(input.session)) return fail(unauthorized());
      try {
        const problems = await catalogGrantProblems(input.draft);
        if (problems.length > 0) return fail(draftInvalid(problems));
        const data = await buildCharacterDataFromSpec(
          null,
          classSpecFromDraft(input.draft, input.language),
          seededRollerFor(randomSectionSeeds())
        );
        const { classlessStatOptions: _unused, ...row } = data;
        const now = new Date();
        return ok(
          await hydrateCharacterRow(
            { ...row, id: null, storage: [], modifiers: [], notes: null, createdAt: now, updatedAt: now },
            input.locale
          )
        );
      } catch (err) {
        return fail(unexpected(log, err, 'CLASS_TEST_ROLL_FAILED', 'Failed to roll a test scvm'));
      }
    },
  };
}
