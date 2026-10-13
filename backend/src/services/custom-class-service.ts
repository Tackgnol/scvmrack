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
import { apiError, badRequest, conflict, notFound, unauthorized } from '../errors.js';
import {
  customClassRepository,
  type CustomClassRows,
  type OwnClassSummary,
} from '../repositories/custom-class-repository.js';
import { catalogRepository } from '../repositories/catalog-repository.js';
import { creationBanRepository } from '../repositories/creation-ban-repository.js';
import {
  fail,
  ok,
  unexpected,
  type ServiceLogger,
  type ServiceResult,
} from './result.js';
import { gmUserId, sessionUserId, type AppSession } from './session.js';
import { isAvailable, mayUse, type ClassVisibility } from '../lib/class-model.js';

const NAME_CONSTRAINT = 'classes_name_per_owner';
const NEW_DRAFT_LIMIT = 3;
/** Unfinished creator drafts untouched this long are deleted. */
const DRAFT_TTL_MS = 90 * 24 * 60 * 60 * 1000;

const dailyPublishLimitReached = () =>
  apiError(
    429,
    'CLASS_DAILY_PUBLISH_LIMIT',
    `You've published ${CUSTOM_CLASS_DAILY_PUBLISH_LIMIT} classes today. Try again tomorrow.`
  );

const notYours = () => notFound('CLASS_NOT_FOUND', 'Class not found');
const notLatest = () =>
  conflict('CLASS_NOT_LATEST', 'A newer version of this class exists. Use that one.');
const classArchived = () =>
  conflict('CLASS_ARCHIVED', 'This class is archived. Restore it before changing its draft.');
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
  return conflict(
    'CLASS_NAME_TAKEN',
    `You already have a class called “${draft.name[
      draft.languages[0]
    ].trim()}”. Give this one another name.`
  );
}

const draftNotYours = () => notFound('DRAFT_NOT_FOUND', 'Draft not found');
const creationBanned = () => apiError(403, 'CLASS_CREATION_BANNED', 'You cannot create new Custom Classes while a moderation restriction is active. Your existing classes remain available.');
const staleDraft = () =>
  conflict(
    'DRAFT_STALE',
    'This draft changed on another device. Load the newer copy or keep yours to overwrite it.'
  );

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
    if (!itemType) {
      return `Ability “${who}” grants an unavailable catalog item`;
    }
    if ((itemType === 'pet') !== (slot === 'pet')) {
      return `Ability “${who}” holds a ${
        itemType === 'pet' ? 'pet' : 'non-pet'
      } catalog item in its ${slot} slot`;
    }
    return [];
  });
}

/** Every problem that stops a draft saving as a class: its own rules, then its catalog grants. */
async function saveProblems(draft: ClassDraft): Promise<string[]> {
  return [...classDraftProblems(draft), ...(await catalogGrantProblems(draft))];
}

type SavedClass = Pick<CustomClassRows, 'id' | 'draft' | 'version' | 'playingCount' | 'status'>;
type ClassDetail = SavedClass & { attribution: string; reportable: boolean };

/** The creator payload: a saved class without its owner and lineage bookkeeping. */
const saved = ({ id, draft, version, playingCount, status }: SavedClass): SavedClass => ({
  id,
  draft,
  version,
  playingCount,
  status,
});

/**
 * Loads a class the GM owns, failing as the API reports each case: `latest` requires
 * the lineage's newest version, `live` rejects a taken-down class, `unarchived` an archived one.
 */
async function findOwned(
  ownerUserId: string,
  id: number,
  need: { latest?: boolean; live?: boolean; unarchived?: boolean } = {}
): Promise<ServiceResult<CustomClassRows>> {
  const found = await customClassRepository.findWithText(id);
  if (!found || found.ownerUserId !== ownerUserId) {
    return fail(notYours());
  }
  if (need.latest && !found.isLatest) {
    return fail(notLatest());
  }
  if (need.live && found.takenDownAt) {
    return fail(classTakenDown());
  }
  if (need.unarchived && found.status === 'archived') {
    return fail(classArchived());
  }
  return ok(found);
}

/** Publishes a lineage; only its first publication spends one of the owner's daily slots. */
function publishLineage(id: number, ownerUserId: string): Promise<boolean> {
  return customClassRepository.transaction(async (ops) => {
    await ops.lockOwner(ownerUserId);
    const current = await ops.findPublishState(id);
    if (current.visibility === 'public') {
      return true;
    }
    if (!current.firstPublishedAt) {
      const dayStart = new Date();
      dayStart.setUTCHours(0, 0, 0, 0);
      if ((await ops.countFirstPublishedSince(ownerUserId, dayStart)) >= CUSTOM_CLASS_DAILY_PUBLISH_LIMIT) {
        return false;
      }
    }
    await ops.setVisibility(current.lineageId, 'public', current.firstPublishedAt ?? new Date());
    return true;
  });
}

/** Saves a played class's draft as its next version, then discards superseded versions no scvm plays. */
function forkVersion(cls: CustomClassRows, draft: ClassDraft): Promise<number> {
  return customClassRepository.transaction(async (ops) => {
    const next = await ops.insertNextVersion(cls.id, draft);
    const older = (await ops.versionIds(cls.lineageId)).filter((id) => id !== next);
    const played = await ops.playedVersionIds(older);
    await ops.deleteVersions(older.filter((id) => !played.has(id)));
    return next;
  });
}

/** Deletes an unplayed lineage, or archives it while a scvm still plays one of its versions. */
function removeLineage(lineageId: string): Promise<{ archived: boolean }> {
  return customClassRepository.transaction(async (ops) => {
    const versions = await ops.versionIds(lineageId);
    await ops.removeFromPools(lineageId);
    if ((await ops.playedVersionIds(versions)).size > 0) {
      await ops.setStatus(lineageId, 'archived');
      return { archived: true };
    }
    await ops.deleteVersions(versions);
    return { archived: false };
  });
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
      const ownerUserId = gmUserId(input.session);
      if (!ownerUserId) {
        return fail(unauthorized());
      }
      try {
        return ok(await customClassRepository.listOwned(ownerUserId, input.locale));
      } catch (err) {
        return fail(unexpected(log, err, 'CLASS_LIST_FAILED', 'Failed to list your classes'));
      }
    },

    /** Lists unfinished private drafts; invalid payloads are deliberately retained. */
    async listDrafts(input: { session: AppSession }) {
      const ownerUserId = gmUserId(input.session);
      if (!ownerUserId) {
        return fail(unauthorized());
      }
      try {
        await customClassRepository.deleteDraftsUpdatedBefore(ownerUserId, new Date(Date.now() - DRAFT_TTL_MS));
        return ok(await customClassRepository.listDrafts(ownerUserId));
      } catch (err) {
        return fail(unexpected(log, err, 'CLASS_DRAFT_LIST_FAILED', 'Failed to load your drafts'));
      }
    },

    async getDraft(input: { session: AppSession; id: number }) {
      const ownerUserId = gmUserId(input.session);
      if (!ownerUserId) {
        return fail(unauthorized());
      }
      try {
        const draft = await customClassRepository.getDraft(ownerUserId, input.id);
        return draft ? ok(draft) : fail(draftNotYours());
      } catch (err) {
        return fail(unexpected(log, err, 'CLASS_DRAFT_LOAD_FAILED', 'Failed to load your draft'));
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
      const ownerUserId = gmUserId(input.session);
      if (!ownerUserId) {
        return fail(unauthorized());
      }
      try {
        if (input.classId === null && input.id === undefined && await creationBanRepository.findActive(ownerUserId)) {
          return fail(creationBanned());
        }
        if (input.classId !== null) {
          const owned = await findOwned(ownerUserId, input.classId, { live: true, unarchived: true });
          if (!owned.ok) {
            return owned;
          }
        } else if (
          input.id === undefined &&
          (await customClassRepository.countNewDrafts(ownerUserId)) >= NEW_DRAFT_LIMIT
        ) {
          return fail(
            conflict('DRAFT_LIMIT_REACHED', `You can keep ${NEW_DRAFT_LIMIT} unfinished new classes at once.`)
          );
        }
        const savedDraft = await customClassRepository.saveDraft({ ...input, ownerUserId });
        return savedDraft ? ok(savedDraft) : fail(staleDraft());
      } catch (err) {
        if (
          err instanceof Error &&
          err.message.includes('class_drafts_owner_user_id_class_id_key')
        ) {
          return fail(staleDraft());
        }
        return fail(unexpected(log, err, 'CLASS_DRAFT_SAVE_FAILED', 'Failed to save your draft'));
      }
    },

    async deleteDraft(input: { session: AppSession; id: number }) {
      const ownerUserId = gmUserId(input.session);
      if (!ownerUserId) {
        return fail(unauthorized());
      }
      try {
        const deleted = await customClassRepository.deleteDraft(ownerUserId, input.id);
        return deleted ? ok({ deleted: true }) : fail(draftNotYours());
      } catch (err) {
        return fail(unexpected(log, err, 'CLASS_DRAFT_DELETE_FAILED', 'Failed to discard your draft'));
      }
    },

    /** Loads the latest readable version, or the exact reported version for an allowlisted moderator. */
    async getDetail(input: { session: AppSession; id: number }): Promise<ServiceResult<ClassDetail>> {
      try {
        const admin = isModerationAdmin(input.session);
        const found = admin
          ? await customClassRepository.findWithText(input.id)
          : await customClassRepository.findLatestWithText(input.id);
        if (!found) {
          return fail(notYours());
        }
        const userId = sessionUserId(input.session);
        const mayRead = admin || (
          isAvailable(found) &&
          (mayUse({ ...found, source: 'user' }, userId) ||
            (await customClassRepository.isVisibleToPartyMember({
              lineageId: found.lineageId,
              userId,
              sessionId: input.session?.session?.id ?? null,
            })))
        );
        if (!mayRead) {
          return fail(notYours());
        }
        return ok({ ...saved(found), attribution: classAttribution({ source: 'user', ownerName: found.ownerName, creditWork: null, creditAuthor: null })!, reportable: found.visibility === 'public' && !found.takenDownAt });
      } catch (err) {
        return fail(unexpected(log, err, 'CLASS_DETAIL_LOAD_FAILED', 'Failed to load the class'));
      }
    },

    async get(input: { session: AppSession; id: number }): Promise<ServiceResult<SavedClass>> {
      const ownerUserId = gmUserId(input.session);
      if (!ownerUserId) {
        return fail(unauthorized());
      }
      try {
        const owned = await findOwned(ownerUserId, input.id);
        return owned.ok ? ok(saved(owned.value)) : owned;
      } catch (err) {
        return fail(unexpected(log, err, 'CLASS_LOAD_FAILED', 'Failed to load the class'));
      }
    },

    async create(input: { session: AppSession; draft: ClassDraft }): Promise<ServiceResult<SavedClass>> {
      const ownerUserId = gmUserId(input.session);
      if (!ownerUserId) {
        return fail(unauthorized());
      }
      try {
        if (await creationBanRepository.findActive(ownerUserId)) {
          return fail(creationBanned());
        }
        const problems = await saveProblems(input.draft);
        if (problems.length > 0) {
          return fail(draftInvalid(problems));
        }
        // ponytail: count-then-insert; two saves in the same instant can overshoot the cap by one.
        if ((await customClassRepository.countOwnedLineages(ownerUserId)) >= CUSTOM_CLASS_MAX_PER_GM) {
          return fail(
            conflict(
              'CLASS_LIMIT_REACHED',
              `You have ${CUSTOM_CLASS_MAX_PER_GM} classes, the most one account can hold. Delete one nobody has played to make room.`
            )
          );
        }
        const id = await customClassRepository.create(ownerUserId, input.draft);
        const found = await customClassRepository.findWithText(id);
        if (!found) {
          throw new Error(`Class ${id} vanished right after saving`);
        }
        return ok(saved(found));
      } catch (err) {
        if (isNameClash(err)) {
          return fail(nameTaken(input.draft));
        }
        return fail(unexpected(log, err, 'CLASS_SAVE_FAILED', 'Failed to save the class'));
      }
    },

    async update(input: {
      session: AppSession;
      id: number;
      draft: ClassDraft;
    }): Promise<ServiceResult<SavedClass>> {
      const ownerUserId = gmUserId(input.session);
      if (!ownerUserId) {
        return fail(unauthorized());
      }
      try {
        const problems = await saveProblems(input.draft);
        if (problems.length > 0) {
          return fail(draftInvalid(problems));
        }
        const owned = await findOwned(ownerUserId, input.id, { latest: true, live: true, unarchived: true });
        if (!owned.ok) {
          return owned;
        }
        const id =
          owned.value.playingCount > 0
            ? await forkVersion(owned.value, input.draft)
            : (await customClassRepository.update(input.id, input.draft), input.id);
        const savedClass = await customClassRepository.findWithText(id);
        if (!savedClass) {
          throw new Error(`Class ${id} vanished right after saving`);
        }
        await customClassRepository.deleteDraftsForClasses(ownerUserId, [input.id, id]);
        return ok(saved(savedClass));
      } catch (err) {
        if (isNameClash(err)) {
          return fail(nameTaken(input.draft));
        }
        return fail(unexpected(log, err, 'CLASS_SAVE_FAILED', 'Failed to save the class'));
      }
    },

    /** Publishes or unpublishes the current Custom Class lineage. */
    async setVisibility(input: {
      session: AppSession;
      id: number;
      visibility: ClassVisibility;
    }): Promise<ServiceResult<{ visibility: ClassVisibility }>> {
      const ownerUserId = gmUserId(input.session);
      if (!ownerUserId) {
        return fail(unauthorized());
      }
      try {
        const owned = await findOwned(ownerUserId, input.id, { latest: true, live: true, unarchived: true });
        if (!owned.ok) {
          return owned;
        }
        if (input.visibility === 'public') {
          if (!(await publishLineage(input.id, ownerUserId))) {
            return fail(dailyPublishLimitReached());
          }
        } else {
          const { lineageId } = owned.value;
          // The owner's own parties keep a class they unpublish.
          await customClassRepository.transaction(async (ops) => {
            await ops.setVisibility(lineageId, 'private');
            await ops.removeFromPools(lineageId, ownerUserId);
          });
        }
        return ok({ visibility: input.visibility });
      } catch (err) {
        return fail(unexpected(log, err, 'CLASS_VISIBILITY_SAVE_FAILED', 'Failed to change the class visibility'));
      }
    },

    async remove(input: { session: AppSession; id: number }): Promise<ServiceResult<{ archived: boolean }>> {
      const ownerUserId = gmUserId(input.session);
      if (!ownerUserId) {
        return fail(unauthorized());
      }
      try {
        const owned = await findOwned(ownerUserId, input.id, { latest: true, live: true });
        return owned.ok ? ok(await removeLineage(owned.value.lineageId)) : owned;
      } catch (err) {
        return fail(unexpected(log, err, 'CLASS_DELETE_FAILED', 'Failed to remove the class'));
      }
    },

    async restore(input: { session: AppSession; id: number }): Promise<ServiceResult<{ restored: true }>> {
      const ownerUserId = gmUserId(input.session);
      if (!ownerUserId) {
        return fail(unauthorized());
      }
      try {
        const owned = await findOwned(ownerUserId, input.id, { live: true });
        if (!owned.ok) {
          return owned;
        }
        const restored = await customClassRepository.transaction((ops) =>
          ops.setStatus(owned.value.lineageId, 'active')
        );
        return restored > 0 ? ok({ restored: true }) : fail(classTakenDown());
      } catch (err) {
        return fail(unexpected(log, err, 'CLASS_RESTORE_FAILED', 'Failed to restore the class'));
      }
    },

    /** Rolls a scvm from a draft as it stands and keeps nothing. Text problems don't block it. */
    async testRoll(input: {
      session: AppSession;
      draft: ClassDraft;
      language: ClassLanguage;
      locale: string;
    }): Promise<ServiceResult<Record<string, unknown>>> {
      if (!gmUserId(input.session)) {
        return fail(unauthorized());
      }
      try {
        const problems = await catalogGrantProblems(input.draft);
        if (problems.length > 0) {
          return fail(draftInvalid(problems));
        }
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
        return fail(unexpected(log, err, 'CLASS_TEST_ROLL_FAILED', 'Failed to roll a test scvm'));
      }
    },
  };
}
