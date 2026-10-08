import {
  CUSTOM_CLASS_DAILY_PUBLISH_LIMIT,
  CUSTOM_CLASS_MAX_PER_GM,
} from '../lib/class-limits.js';
import { classAttribution } from '../lib/class-attribution.js';
import { isModerationAdmin } from '../lib/moderation-admin.js';
import {
  classDraftProblems,
  classSpecFromDraft,
  type ClassDraft,
  type ClassLanguage,
} from '../lib/class-draft.js';
import { randomSectionSeeds, seededRollerFor } from '../lib/draft-seeds.js';
import { buildCharacterDataFromSpec } from '../lib/generate-character.js';
import { hydrateCharacterRow } from '../lib/get-character-full.js';
import { apiError, badRequest, notFound, unauthorized } from '../errors.js';
import {
  customClassRepository,
  type OwnClassSummary,
} from '../repositories/custom-class-repository.js';
import { catalogRepository } from '../repositories/catalog-repository.js';
import {
  fail,
  ok,
  unexpected,
  type ServiceLogger,
  type ServiceResult,
} from './result.js';
import { isGm, sessionUserId, type AppSession } from './session.js';

const NAME_CONSTRAINT = 'classes_name_per_owner';
const NEW_DRAFT_LIMIT = 3;

const dailyPublishLimitReached = () =>
  apiError(
    429,
    'CLASS_DAILY_PUBLISH_LIMIT',
    `You've published ${CUSTOM_CLASS_DAILY_PUBLISH_LIMIT} classes today. Try again tomorrow.`
  );

const notYours = () => notFound('CLASS_NOT_FOUND', 'Class not found');
const classArchived = () =>
  apiError(
    409,
    'CLASS_ARCHIVED',
    'This class is archived. Restore it before changing its draft.'
  );
const classTakenDown = () =>
  apiError(
    410,
    'CLASS_TAKEN_DOWN',
    'This class has been taken down and cannot be changed.'
  );

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
    `You already have a class called “${draft.name[
      draft.languages[0]
    ].trim()}”. Give this one another name.`
  );
}

const draftNotYours = () => notFound('DRAFT_NOT_FOUND', 'Draft not found');

function staleDraft() {
  return apiError(
    409,
    'DRAFT_STALE',
    'This draft changed on another device. Load the newer copy or keep yours to overwrite it.'
  );
}
/** Checks external grant keys against the shared catalog and their appropriate slot. */
async function catalogGrantProblems(draft: ClassDraft): Promise<string[]> {
  const ownRefs = new Set(draft.items.map((item) => item.ref));
  const grants = draft.abilities.flatMap((ability, i) =>
    (
      [
      ['item', ability.grantItem],
      ['pet', ability.grantPet],
      ] as const
    ).flatMap(([slot, key]) =>
      key && !ownRefs.has(key) ? [{ ability, i, key, slot }] : []
    )
  );
  const found = await catalogRepository.findSharedItemsByKeys([
    ...new Set(grants.map((grant) => grant.key)),
  ]);
  const typeByKey = new Map(found.map((item) => [item.key, item.itemType]));
  return grants.flatMap(({ ability, i, key, slot }) => {
    const itemType = typeByKey.get(key);
    const who = ability.name[draft.languages[0]].trim() || `ability ${i + 1}`;
    if (!itemType) return `Ability “${who}” grants an unavailable catalog item`;
    if ((itemType === 'pet') !== (slot === 'pet')) {
      return `Ability “${who}” holds a ${
        itemType === 'pet' ? 'pet' : 'non-pet'
      } catalog item in its ${slot} slot`;
    }
    return [];
  });
}

type SavedClass = {
  id: number;
  draft: ClassDraft;
  version: number;
  playingCount: number;
  status: 'draft' | 'active' | 'archived';
};

/** Returns a creator payload after the repository has assigned stable content keys. */
function saved(found: {
  id: number;
  draft: ClassDraft;
  version: number;
  playingCount: number;
  status: 'draft' | 'active' | 'archived';
}): SavedClass {
  return {
    id: found.id,
    draft: found.draft,
    version: found.version,
    playingCount: found.playingCount,
    status: found.status,
  };
}

const isNameClash = (err: unknown) =>
  String((err as Error)?.message ?? err).includes(NAME_CONSTRAINT);

/** The class creator and the GM's own class list. Custom Classes are owned by signed-in GMs. */
export function createCustomClassService(log: ServiceLogger) {
  return {
    async listMine(input: {
      session: AppSession;
      locale: string;
    }): Promise<ServiceResult<OwnClassSummary[]>> {
      if (!isGm(input.session)) return fail(unauthorized());
      try {
        return ok(
          await customClassRepository.listOwned(
            sessionUserId(input.session)!,
            input.locale
          )
        );
      } catch (err) {
        return fail(
          unexpected(
            log,
            err,
            'CLASS_LIST_FAILED',
            'Failed to list your classes'
          )
        );
      }
    },

    /** Lists unfinished private drafts; invalid payloads are deliberately retained. */
    async listDrafts(input: { session: AppSession }) {
      if (!isGm(input.session)) return fail(unauthorized());
      try {
        return ok(
          await customClassRepository.listDrafts(sessionUserId(input.session)!)
        );
      } catch (err) {
        return fail(
          unexpected(
            log,
            err,
            'CLASS_DRAFT_LIST_FAILED',
            'Failed to load your drafts'
          )
        );
      }
    },

    async getDraft(input: { session: AppSession; id: number }) {
      if (!isGm(input.session)) return fail(unauthorized());
      try {
        const draft = await customClassRepository.getDraft(
          sessionUserId(input.session)!,
          input.id
        );
        return draft ? ok(draft) : fail(draftNotYours());
      } catch (err) {
        return fail(
          unexpected(
            log,
            err,
            'CLASS_DRAFT_LOAD_FAILED',
            'Failed to load your draft'
          )
        );
      }
    },

    async saveDraft(input: {
      session: AppSession;
      id?: number;
      classId: number | null;
      draft: ClassDraft;
      revision?: number;
      force?: boolean;
    }) {
      if (!isGm(input.session)) return fail(unauthorized());
      const ownerUserId = sessionUserId(input.session)!;
      try {
        if (input.classId !== null) {
          const cls = await customClassRepository.findWithText(input.classId);
          if (!cls || cls.ownerUserId !== ownerUserId) return fail(notYours());
          if (cls.takenDownAt) return fail(classTakenDown());
          if (cls.status === 'archived') return fail(classArchived());
        } else if (
          input.id === undefined &&
          (await customClassRepository.countNewDrafts(ownerUserId)) >=
            NEW_DRAFT_LIMIT
        ) {
          return fail(
            apiError(
              409,
              'DRAFT_LIMIT_REACHED',
              `You can keep ${NEW_DRAFT_LIMIT} unfinished new classes at once.`
            )
          );
        }
        const savedDraft = await customClassRepository.saveDraft({
          ...input,
          ownerUserId,
        });
        return savedDraft ? ok(savedDraft) : fail(staleDraft());
      } catch (err) {
        if (
          err instanceof Error &&
          err.message.includes('class_drafts_owner_user_id_class_id_key')
        ) {
          return fail(staleDraft());
        }
        return fail(
          unexpected(
            log,
            err,
            'CLASS_DRAFT_SAVE_FAILED',
            'Failed to save your draft'
          )
        );
      }
    },

    async deleteDraft(input: { session: AppSession; id: number }) {
      if (!isGm(input.session)) return fail(unauthorized());
      try {
        const deleted = await customClassRepository.deleteDraft(
          sessionUserId(input.session)!,
          input.id
        );
        return deleted ? ok({ deleted: true }) : fail(draftNotYours());
      } catch (err) {
        return fail(
          unexpected(
            log,
            err,
            'CLASS_DRAFT_DELETE_FAILED',
            'Failed to discard your draft'
          )
        );
      }
    },

    /** Loads the latest readable version, or the exact reported version for an allowlisted moderator. */
    async getDetail(input: { session: AppSession; id: number }): Promise<ServiceResult<SavedClass & { attribution: string }>> {
      try {
        const admin = isModerationAdmin(input.session);
        const found = admin
          ? await customClassRepository.findWithText(input.id)
          : await customClassRepository.findLatestWithText(input.id);
        if (!found) return fail(notYours());
        const mayRead = admin || (
          found.visibility === 'public' ||
          found.ownerUserId === sessionUserId(input.session) ||
          (await customClassRepository.isVisibleToPartyMember({
            lineageId: found.lineageId,
            userId: sessionUserId(input.session),
            sessionId: input.session?.session?.id ?? null,
          }))
        );
        if (!mayRead || (!admin && found.status !== 'active')) return fail(notYours());
        return ok({ ...saved(found), attribution: classAttribution({ source: 'user', ownerName: found.ownerName, creditWork: null, creditAuthor: null })! });
      } catch (err) {
        return fail(unexpected(log, err, 'CLASS_DETAIL_LOAD_FAILED', 'Failed to load the class'));
      }
    },
    async get(input: {
      session: AppSession;
      id: number;
    }): Promise<ServiceResult<SavedClass>> {
      if (!isGm(input.session)) return fail(unauthorized());
      try {
        const found = await customClassRepository.findWithText(input.id);
        if (!found || found.ownerUserId !== sessionUserId(input.session))
          return fail(notYours());
        return ok(saved(found));
      } catch (err) {
        return fail(
          unexpected(log, err, 'CLASS_LOAD_FAILED', 'Failed to load the class')
        );
      }
    },

    async create(input: {
      session: AppSession;
      draft: ClassDraft;
    }): Promise<ServiceResult<SavedClass>> {
      if (!isGm(input.session)) return fail(unauthorized());
      const ownerUserId = sessionUserId(input.session)!;
      const problems = [
        ...classDraftProblems(input.draft),
        ...(await catalogGrantProblems(input.draft)),
      ];
      if (problems.length > 0) return fail(draftInvalid(problems));
      try {
        // ponytail: count-then-insert; two saves in the same instant can overshoot the cap by one.
        if (
          (await customClassRepository.countOwnedLineages(ownerUserId)) >=
          CUSTOM_CLASS_MAX_PER_GM
        ) {
          return fail(
            apiError(
              409,
              'CLASS_LIMIT_REACHED',
              `You have ${CUSTOM_CLASS_MAX_PER_GM} classes, the most one account can hold. Delete one nobody has played to make room.`
            )
          );
        }
        const id = await customClassRepository.create(ownerUserId, input.draft);
        const found = await customClassRepository.findWithText(id);
        if (!found) throw new Error(`Class ${id} vanished right after saving`);
        return ok(saved(found));
      } catch (err) {
        if (isNameClash(err)) return fail(nameTaken(input.draft));
        return fail(
          unexpected(log, err, 'CLASS_SAVE_FAILED', 'Failed to save the class')
        );
      }
    },

    async update(input: {
      session: AppSession;
      id: number;
      draft: ClassDraft;
    }): Promise<ServiceResult<SavedClass>> {
      if (!isGm(input.session)) return fail(unauthorized());
      const problems = [
        ...classDraftProblems(input.draft),
        ...(await catalogGrantProblems(input.draft)),
      ];
      if (problems.length > 0) return fail(draftInvalid(problems));
      try {
        const found = await customClassRepository.findWithText(input.id);
        if (!found || found.ownerUserId !== sessionUserId(input.session))
          return fail(notYours());
        if (!found.isLatest) {
          return fail(
            apiError(
              409,
              'CLASS_NOT_LATEST',
              'A newer version of this class exists. Edit that one.'
            )
          );
        }
        if (found.takenDownAt) return fail(classTakenDown());
        if (found.status === 'archived') return fail(classArchived());
        const id =
          found.playingCount > 0
            ? await customClassRepository.createVersion(input.id, input.draft)
            : (await customClassRepository.update(input.id, input.draft),
              input.id);
        const savedClass = await customClassRepository.findWithText(id);
        if (!savedClass)
          throw new Error(`Class ${id} vanished right after saving`);
        return ok(saved(savedClass));
      } catch (err) {
        if (isNameClash(err)) return fail(nameTaken(input.draft));
        return fail(
          unexpected(log, err, 'CLASS_SAVE_FAILED', 'Failed to save the class')
        );
      }
    },

    /** Publishes or unpublishes the current Custom Class lineage. */
    async setVisibility(input: {
      session: AppSession;
      id: number;
      visibility: 'private' | 'public';
    }): Promise<ServiceResult<{ visibility: 'private' | 'public' }>> {
      if (!isGm(input.session)) return fail(unauthorized());
      try {
        const ownerUserId = sessionUserId(input.session);
        const found = await customClassRepository.findWithText(input.id);
        if (!ownerUserId || !found || found.ownerUserId !== ownerUserId)
          return fail(notYours());
        if (!found.isLatest) {
          return fail(
            apiError(
              409,
              'CLASS_NOT_LATEST',
              'A newer version of this class exists. Manage that one.'
            )
          );
        }
        if (found.takenDownAt) return fail(classTakenDown());
        if (found.status === 'archived') return fail(classArchived());
        if (input.visibility === 'public') {
          const dayStart = new Date();
          dayStart.setUTCHours(0, 0, 0, 0);
          const published = await customClassRepository.publish(
            input.id,
            ownerUserId,
            dayStart,
            CUSTOM_CLASS_DAILY_PUBLISH_LIMIT
          );
          if (!published) return fail(dailyPublishLimitReached());
        } else {
          await customClassRepository.setVisibility(input.id, input.visibility);
        }
        return ok({ visibility: input.visibility });
      } catch (err) {
        return fail(
          unexpected(
            log,
            err,
            'CLASS_VISIBILITY_SAVE_FAILED',
            'Failed to change the class visibility'
          )
        );
      }
    },
    async remove(input: {
      session: AppSession;
      id: number;
    }): Promise<ServiceResult<{ archived: boolean }>> {
      if (!isGm(input.session)) return fail(unauthorized());
      try {
        const found = await customClassRepository.findWithText(input.id);
        if (!found || found.ownerUserId !== sessionUserId(input.session))
          return fail(notYours());
        if (!found.isLatest)
          return fail(
            apiError(
              409,
              'CLASS_NOT_LATEST',
              'A newer version of this class exists. Manage that one.'
            )
          );
        if (found.takenDownAt) return fail(classTakenDown());
        return ok(await customClassRepository.remove(input.id));
      } catch (err) {
        return fail(
          unexpected(
            log,
            err,
            'CLASS_DELETE_FAILED',
            'Failed to remove the class'
          )
        );
      }
    },

    async restore(input: {
      session: AppSession;
      id: number;
    }): Promise<ServiceResult<{ restored: true }>> {
      if (!isGm(input.session)) return fail(unauthorized());
      try {
        const found = await customClassRepository.findWithText(input.id);
        if (!found || found.ownerUserId !== sessionUserId(input.session))
          return fail(notYours());
        if (found.takenDownAt) return fail(classTakenDown());
        const restored = await customClassRepository.restore(input.id);
        return restored ? ok({ restored: true }) : fail(classTakenDown());
      } catch (err) {
        return fail(
          unexpected(
            log,
            err,
            'CLASS_RESTORE_FAILED',
            'Failed to restore the class'
          )
        );
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
            {
              ...row,
              id: null,
              storage: [],
              modifiers: [],
              notes: null,
              createdAt: now,
              updatedAt: now,
            },
            input.locale
          )
        );
      } catch (err) {
        return fail(
          unexpected(
            log,
            err,
            'CLASS_TEST_ROLL_FAILED',
            'Failed to roll a test scvm'
          )
        );
      }
    },
  };
}
