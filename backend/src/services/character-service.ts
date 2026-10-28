import { Prisma } from '@prisma/client';
import { Roller, OSRandomEngine } from '@tackgnol/rpg-tools-roller';
import {
  characterRepository,
  type CharacterPartyAccessRow,
  type CharacterSummaryRow,
} from '../repositories/character-repository.js';
import { characterCreateDataFromDraft, randomCharacterCreateData } from '../lib/generate-character.js';
import { lockPartySeat, partyFull } from '../lib/party-limits.js';
import { classChoiceError, pickPoolClass } from './character-class-choice.js';
import { resolvePartyClassPool } from './party-class-pool-service.js';
import { getCharacterFull } from '../lib/get-character-full.js';
import { hydrateInventoryUses } from '../lib/inventory.js';
import {
  hasObrPlayerCharacterAccess,
  type ObrCharacterAccessContext,
} from '../lib/obr-character-access.js';
import type { CharacterDraft } from '../lib/draft-seeds.js';
import { normalizeDropLowestAbilities } from '../lib/draft-seeds.js';
import {
  isValidLocale,
  isValidUUID,
  sanitizeCharacterUpdate,
} from '../utils.js';
import {
  ApiHttpError,
  apiError,
  badRequest,
  conflict,
  notFound,
  unauthorized,
} from '../errors.js';
import {
  fail,
  ok,
  unexpected,
  type ServiceLogger,
  type ServiceResult,
} from './result.js';
import type { PartyEventBus } from '../plugins/party-bus.js';
import { publishCharacterUpdated } from './character-events.js';
import {
  ownsCharacter,
  sessionId,
  sessionUserId,
  type AppSession,
} from './session.js';

export type { AppSession } from './session.js';

export type CharacterListRow = {
  id: string;
  name: string;
  classId: number | null;
  className: string | null;
  currentHp: number;
  maxHp: number;
  partyId: string | null;
  joinedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function sessionIsAnonymous(session: AppSession): boolean {
  return session?.user?.isAnonymous === true;
}

function resolveListLocale(rawLocale: unknown, acceptLanguage: unknown): 'en' | 'pl' {
  if (isValidLocale(rawLocale)) {
    return rawLocale;
  }

  if (typeof acceptLanguage !== 'string' || acceptLanguage.length === 0) {
    return 'en';
  }

  const primaryTag = acceptLanguage.split(',')[0]?.trim().toLowerCase();
  if (!primaryTag) {
    return 'en';
  }

  if (primaryTag === 'pl' || primaryTag.startsWith('pl-')) {
    return 'pl';
  }

  return 'en';
}

/**
 * Inserts the scvm as a party member, an Owlbear player's seat, or on its own. A guest replacing
 * their scvm loses the old one in the same transaction. Null when the party is already full.
 */
function insertCharacter(
  data: Prisma.CharacterUncheckedCreateInput,
  target: {
    party: { id: string } | null;
    obrBinding?: { roomId: string; playerId: string };
    replaceUserId?: string;
  }
): Promise<string | null> {
  const { party, obrBinding, replaceUserId } = target;
  return characterRepository.transaction(async (ops) => {
    if (party && !(await lockPartySeat(ops, party.id, replaceUserId))) {
      return null;
    }
    if (replaceUserId) {
      await ops.deleteCharactersOf(replaceUserId);
    }
    const characterId = await ops.createCharacter(
      party ? { ...data, partyId: party.id, joinedAt: new Date() } : data
    );
    if (obrBinding) {
      await ops.bindObrPlayer(obrBinding, characterId);
    }
    return characterId;
  });
}

/**
 * Character business logic. Returns a stable {@link ServiceResult}: known
 * failures (auth, ownership, validation, not-found) are returned as
 * `ApiHttpError` values. Unexpected failures are mapped to a 5xx `ApiHttpError`
 * after logging the raw error, so the controller can hand them to the central
 * error handler (which reports 5xx to Sentry).
 */
export function createCharacterService(
  log: ServiceLogger,
  partyBus?: PartyEventBus
) {
  async function resolveReadAccess(
    id: string,
    session: AppSession,
    obrAccess?: ObrCharacterAccessContext | null
  ): Promise<
    | { ok: true; viewerAccess: 'owner' | 'party'; row: CharacterPartyAccessRow }
    | { ok: false; error: ApiHttpError }
  > {
    if (!sessionUserId(session) && !sessionId(session)) {
      return { ok: false, error: unauthorized() };
    }

    const row = await characterRepository.getPartyAccessContext(id);
    if (!row) {
      return {
        ok: false,
        error: notFound('CHARACTER_NOT_FOUND', 'Character not found'),
      };
    }

    if (ownsCharacter(session, row)) {
      return { ok: true, viewerAccess: 'owner', row };
    }

    if (await hasObrPlayerCharacterAccess(id, obrAccess)) {
      return { ok: true, viewerAccess: 'owner', row };
    }

    const userId = sessionUserId(session);
    if (row.partyId && row.party) {
      if (userId && row.party.ownerUserId === userId) {
        return { ok: true, viewerAccess: 'party', row };
      }

      const isPartyMember = row.party.members.some((member) =>
        ownsCharacter(session, member)
      );
      if (isPartyMember) {
        return { ok: true, viewerAccess: 'party', row };
      }
    }

    return {
      ok: false,
      error: apiError(
        403,
        'CHARACTER_ACCESS_DENIED',
        "You don't have access to this scvm"
      ),
    };
  }

  async function ensureOwnership(
    id: string,
    session: AppSession,
    obrAccess?: ObrCharacterAccessContext | null
  ): Promise<ApiHttpError | null> {
    const userId = sessionUserId(session);
    if (!userId && !sessionId(session)) {
      return unauthorized();
    }

    const row = await characterRepository.getPartyAccessContext(id);
    if (!row) {
      return notFound('CHARACTER_NOT_FOUND', 'Character not found');
    }

    if (ownsCharacter(session, row)) {
      return null;
    }

    if (await hasObrPlayerCharacterAccess(id, obrAccess)) {
      return null;
    }

    return apiError(
      403,
      'CHARACTER_ACCESS_DENIED',
      "You don't have access to this scvm"
    );
  }

  return {
    async generate(input: {
      session: AppSession;
      /** A party invite: the scvm is forged from its pool and joins it in the same transaction. */
      inviteToken?: string | null;
      obrRoomId?: string | null;
      obrPlayerId?: string | null;
      classId?: number | null;
      classless?: boolean;
      draft?: CharacterDraft | null;
      replace?: boolean;
      locale: string;
    }): Promise<ServiceResult<Record<string, unknown>>> {
      const userId = sessionUserId(input.session);
      if (!userId) {
        return fail(unauthorized());
      }

      try {
        const pool = await resolvePartyClassPool(input.inviteToken, input.obrRoomId);
        if (!pool.ok) {
          return fail(pool.error);
        }
        const party = pool.value.party;
        const obrBinding =
          !input.inviteToken && input.obrRoomId && input.obrPlayerId
            ? { roomId: input.obrRoomId, playerId: input.obrPlayerId }
            : undefined;
        if (party && !input.draft && !obrBinding) {
          return fail(badRequest('DRAFT_REQUIRED', 'Forge a scvm to join a party'));
        }
        if (party && party.ownerUserId === userId) {
          return fail(
            apiError(403, 'PARTY_OWNER_CANNOT_JOIN', 'A game master cannot join their own party')
          );
        }

        // One scvm per guest. An anonymous session may hold only a single
        // character, so creating another is a 409 unless the caller opts into
        // replacing — a plain create can never silently destroy an existing
        // scvm. Authenticated accounts keep their full roster. The conflict is
        // checked before any write so we never create-then-409.
        const isGuest = sessionIsAnonymous(input.session);
        if (isGuest && !input.replace) {
          if (await characterRepository.userHasCharacters(userId)) {
            return fail(
              conflict(
                'SCVM_ALREADY_EXISTS',
                'You already have a scvm. Replace it to forge a new one.'
              )
            );
          }
        }

        let data: Prisma.CharacterUncheckedCreateInput;
        if (input.draft) {
          if (
            input.draft.classless &&
            normalizeDropLowestAbilities(input.draft.dropLowestAbilities).length !== 2
          ) {
            return fail(
              badRequest(
                'CLASSLESS_STATS_INCOMPLETE',
                'Choose two abilities to use the 4d6 drop-lowest result'
              )
            );
          }
          // A draft without a class rolls classless, so it needs Classless allowed.
          const classless = input.draft.classless || input.draft.classId === null;
          const unavailable = classChoiceError(
            pool.value,
            classless,
            classless ? null : input.draft.classId
          );
          if (unavailable) {
            return fail(unavailable);
          }

          data = await characterCreateDataFromDraft(input.draft, userId);
        } else {
          const roller = new Roller({ engine: new OSRandomEngine() });
          let classId = input.classless ? null : input.classId ?? null;
          if (classId === null && !input.classless) {
            const picked = await pickPoolClass(pool.value, roller);
            if (!picked.ok) {
              return picked;
            }
            classId = picked.value;
          }
          const unavailable = classChoiceError(pool.value, input.classless === true, classId);
          if (unavailable) {
            return fail(unavailable);
          }
          if (party && !obrBinding) {
            return fail(badRequest('DRAFT_REQUIRED', 'Forge a scvm to join a party'));
          }
          data = await randomCharacterCreateData(classId, roller, userId);
        }
        const characterId = await insertCharacter(data, {
          party,
          obrBinding,
          // Inside a party or room the guest's old scvm goes in the same transaction; alone, it is pruned below.
          replaceUserId: isGuest && input.replace && (party || obrBinding) ? userId : undefined,
        });
        if (!characterId) {
          return fail(partyFull());
        }
        if (party) {
          partyBus?.publish(party.id, { type: 'character.joined', characterId });
        }
        const character = await getCharacterFull(characterId, input.locale);
        if (!character) {
          return fail(
            apiError(
              500,
              'CHARACTER_GENERATION_FETCH_FAILED',
              'Failed to fetch generated character'
            )
          );
        }

        // Opt-in replace: now that the new scvm exists and is owned, prune the
        // guest's prior one(s). Generate-first-then-prune mirrors the in-sheet
        // kill-and-replace and leaves no zero-scvm window — so a prune failure is
        // logged and non-blocking rather than failing an otherwise-good create.
        if (isGuest && input.replace && !party && !obrBinding) {
          try {
            await characterRepository.deleteOthersForUser(userId, characterId);
          } catch (err) {
            log.error(err, 'Failed to prune prior guest characters after replace');
          }
        }

        return ok(character);
      } catch (err) {
        return fail(
          unexpected(log, err,'CHARACTER_GENERATION_FAILED', 'Failed to generate character')
        );
      }
    },

    async count(): Promise<ServiceResult<{ total: number }>> {
      try {
        return ok({ total: await characterRepository.count() });
      } catch (err) {
        return fail(
          unexpected(log, err,'CHARACTER_COUNT_FAILED', 'Failed to count characters')
        );
      }
    },

    async getById(input: {
      id: string;
      session: AppSession;
      locale: string;
      obrAccess?: ObrCharacterAccessContext | null;
    }): Promise<ServiceResult<Record<string, unknown>>> {
      if (!isValidUUID(input.id)) {
        return fail(badRequest('INVALID_CHARACTER_ID', 'Invalid character ID'));
      }

      let access: Awaited<ReturnType<typeof resolveReadAccess>>;
      try {
        access = await resolveReadAccess(
          input.id,
          input.session,
          input.obrAccess
        );
      } catch (err) {
        return fail(
          unexpected(log, err,'CHARACTER_ACCESS_CHECK_FAILED', 'Failed to check character access')
        );
      }
      if (!access.ok) {
        return fail(access.error);
      }

      try {
        const character = await getCharacterFull(input.id, input.locale);
        if (!character) {
          return fail(notFound('CHARACTER_NOT_FOUND', 'Character not found'));
        }
        return ok({
          ...character,
          viewerAccess: access.viewerAccess,
        });
      } catch (err) {
        return fail(
          unexpected(log, err,'CHARACTER_FETCH_FAILED', 'Failed to fetch character')
        );
      }
    },

    async update(input: {
      id: string;
      session: AppSession;
      body: Record<string, unknown>;
      rawLocale: unknown;
      obrAccess?: ObrCharacterAccessContext | null;
    }): Promise<ServiceResult<Record<string, unknown>>> {
      if (!isValidUUID(input.id)) {
        return fail(badRequest('INVALID_CHARACTER_ID', 'Invalid character ID'));
      }

      const denied = await ensureOwnership(
        input.id,
        input.session,
        input.obrAccess
      );
      if (denied) {
        return fail(denied);
      }

      const locale = isValidLocale(input.rawLocale) ? input.rawLocale : 'en';
      const updates = sanitizeCharacterUpdate(input.body);
      const changedFields = Object.keys(updates);

      if (changedFields.length === 0) {
        return fail(
          badRequest('EMPTY_CHARACTER_UPDATE', 'No valid fields to update')
        );
      }

      try {
        // Hydrate inventory uses for equipment and storage if present.
        if (Array.isArray(updates['equipment']) || Array.isArray(updates['storage'])) {
          const roller = new Roller({ engine: new OSRandomEngine() });

          // Use the patch's presence if present, otherwise fetch the stored one.
          let presence: number;
          if (typeof updates['presence'] === 'number') {
            presence = updates['presence'];
          } else {
            const char = await characterRepository.getPresence(input.id);
            presence = char?.presence ?? 10;
          }

          if (Array.isArray(updates['equipment'])) {
            updates['equipment'] = await hydrateInventoryUses(
              updates['equipment'] as unknown[],
              presence,
              true,
              roller
            );
          }
          if (Array.isArray(updates['storage'])) {
            updates['storage'] = await hydrateInventoryUses(
              updates['storage'] as unknown[],
              presence,
              false,
              roller
            );
          }
        }

        await characterRepository.update(input.id, updates as Prisma.CharacterUpdateInput, {
          expectedUpdatedAt:
            typeof input.body.expectedUpdatedAt === 'string'
              ? new Date(input.body.expectedUpdatedAt)
              : undefined,
          saveId: typeof input.body.saveId === 'string' ? input.body.saveId : undefined,
        });

        const character = await getCharacterFull(input.id, locale);
        if (!character) {
          return fail(notFound('CHARACTER_NOT_FOUND', 'Character not found'));
        }
        await publishCharacterUpdated(partyBus, input.id, changedFields, log);
        return ok(character);
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2025'
        ) {
          const stored = input.body.expectedUpdatedAt ? await characterRepository.getLastSaveId(input.id) : null;
          if (!stored) {
            return fail(notFound('CHARACTER_NOT_FOUND', 'Character not found'));
          }
          // A retry of a save that already landed (its response was lost) reads back instead of conflicting.
          if (input.body.saveId && stored.lastSaveId === input.body.saveId) {
            const character = await getCharacterFull(input.id, locale);
            return character ? ok(character) : fail(notFound('CHARACTER_NOT_FOUND', 'Character not found'));
          }
          return fail(conflict('CHARACTER_CHANGED', 'Character changed in another tab. Reload before editing again.'));
        }
        return fail(
          unexpected(log, err,'CHARACTER_UPDATE_FAILED', 'Failed to update character')
        );
      }
    },

    async list(input: {
      session: AppSession;
      rawLocale?: unknown;
      acceptLanguage: unknown;
    }): Promise<ServiceResult<CharacterListRow[]>> {
      const userId = sessionUserId(input.session);
      if (!userId) {
        return fail(unauthorized());
      }

      const locale = resolveListLocale(input.rawLocale, input.acceptLanguage);

      try {
        const characters = await characterRepository.listSummariesByUser(userId);

        const classIds = [
          ...new Set(
            characters
              .map((c) => c.classId)
              .filter((id): id is number => id !== null)
          ),
        ];
        const classNameMap = await characterRepository.getClassNameMap(
          classIds,
          locale
        );

        const rows: CharacterListRow[] = characters.map(
          (c: CharacterSummaryRow) => ({
            id: c.id,
            name: c.name,
            classId: c.classId,
            className:
              c.classId !== null ? (classNameMap.get(c.classId) ?? null) : null,
            currentHp: c.currentHp,
            maxHp: c.maxHp,
            partyId: c.partyId,
            joinedAt: c.joinedAt,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          })
        );
        return ok(rows);
      } catch (err) {
        return fail(
          unexpected(log, err,'CHARACTER_LIST_FAILED', 'Failed to list characters')
        );
      }
    },

    async remove(input: {
      id: string;
      session: AppSession;
    }): Promise<ServiceResult<void>> {
      if (!isValidUUID(input.id)) {
        return fail(badRequest('INVALID_CHARACTER_ID', 'Invalid character ID'));
      }

      const denied = await ensureOwnership(input.id, input.session);
      if (denied) {
        return fail(denied);
      }

      try {
        const partyBinding = await characterRepository.getPartyId(input.id);
        const result = await characterRepository.deleteById(input.id);
        if (result.count === 0) {
          return fail(notFound('CHARACTER_NOT_FOUND', 'Character not found'));
        }
        if (partyBinding?.partyId) {
          partyBus?.publish(partyBinding.partyId, {
            type: 'character.left',
            characterId: input.id,
          });
        }
        return ok(undefined);
      } catch (err) {
        if (
          err instanceof Error &&
          err.message.includes('Character not found')
        ) {
          return fail(notFound('CHARACTER_NOT_FOUND', 'Character not found'));
        }
        return fail(
          unexpected(log, err,'CHARACTER_DELETE_FAILED', 'Failed to delete character')
        );
      }
    },
  };
}
