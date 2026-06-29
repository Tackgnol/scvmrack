import { Prisma } from '@prisma/client';
import { Roller, OSRandomEngine } from '@tackgnol/rpg-tools-roller';
import {
  characterRepository,
  type CharacterPartyAccessRow,
  type CharacterSummaryRow,
} from '../repositories/character-repository.js';
import { createCharacterFromDraft, generateCharacter } from '../lib/generate-character.js';
import { getCharacterFull } from '../lib/get-character-full.js';
import { toCharacterCard } from '../lib/character-card.js';
import { hydrateInventoryUses } from '../lib/inventory.js';
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

/** Minimal session shape the service needs (decoupled from Fastify). */
export type AppSession = {
  session?: { id?: string | null } | null;
  user?: { id?: string | null; isAnonymous?: boolean | null } | null;
} | null;

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

// Request fan-out cap for the session-less OBR card batch. The room gate decides
// which cards are readable; this bound keeps one request from hydrating an
// unbounded number of valid ids.
const MAX_CARD_IDS = 50;

function sessionUserId(session: AppSession): string | null {
  return session?.user?.id ?? null;
}

function sessionId(session: AppSession): string | null {
  return session?.session?.id ?? null;
}

function sessionIsAnonymous(session: AppSession): boolean {
  return session?.user?.isAnonymous === true;
}

function ownsCharacter(
  session: AppSession,
  character: { userId: string | null; sessionId: string | null }
): boolean {
  const userId = sessionUserId(session);
  if (userId && character.userId === userId) {
    return true;
  }

  const sid = sessionId(session);
  if (sid && character.sessionId === sid) {
    return true;
  }

  return false;
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
    session: AppSession
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
    session: AppSession
  ): Promise<ApiHttpError | null> {
    const userId = sessionUserId(session);
    if (!userId) {
      return unauthorized();
    }

    const row = await characterRepository.getOwnerId(id);
    if (!row) {
      return notFound('CHARACTER_NOT_FOUND', 'Character not found');
    }
    if (row.userId !== userId) {
      return apiError(
        403,
        'CHARACTER_ACCESS_DENIED',
        "You don't have access to this scvm"
      );
    }
    return null;
  }

  return {
    async generate(input: {
      session: AppSession;
      classId?: number | null;
      draft?: CharacterDraft | null;
      replace?: boolean;
      locale: string;
    }): Promise<ServiceResult<unknown>> {
      const userId = sessionUserId(input.session);
      if (!userId) {
        return fail(unauthorized());
      }

      try {
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

        let characterId: string;
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
          if (
            !input.draft.classless &&
            input.draft.classId !== null &&
            !(await characterRepository.classExists(input.draft.classId))
          ) {
            return fail(notFound('CLASS_NOT_FOUND', 'Class not found'));
          }
          characterId = await createCharacterFromDraft(input.draft, userId);
        } else {
          const roller = new Roller({ engine: new OSRandomEngine() });
          // Bind ownership at creation so a failure can never leave an orphaned,
          // unowned (and thus unreachable) character row.
          characterId = await generateCharacter(
            input.classId ?? null,
            roller,
            userId
          );
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
        if (isGuest && input.replace) {
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
    }): Promise<ServiceResult<unknown>> {
      if (!isValidUUID(input.id)) {
        return fail(badRequest('INVALID_CHARACTER_ID', 'Invalid character ID'));
      }

      let access: Awaited<ReturnType<typeof resolveReadAccess>>;
      try {
        access = await resolveReadAccess(input.id, input.session);
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

    // Capability-by-pair read of compact, table-visible card fields only
    // (toCharacterCard allowlist) — powers the OBR room roster/peek where viewers
    // share no server-side party, so there is NO ownership/session check here (by
    // design; contrast getById which gates access). The gate instead is the
    // (roomId, id) pair: a card is returned only when the caller presents BOTH the
    // character id AND the Owlbear room its owner bound it to (via bindObrRoom).
    // The unguessable UUID was the only barrier before; pairing it with the room
    // id means a leaked UUID alone no longer reads the card. Not a hard lock
    // (anyone in the room can read), just enough friction that scraping this
    // table-visible data isn't worth it.
    async getCards(input: {
      ids: string[];
      roomId: string;
      locale: string;
    }): Promise<ServiceResult<unknown>> {
      const ids = [
        ...new Set(
          (Array.isArray(input.ids) ? input.ids : []).filter((id) => isValidUUID(id))
        ),
      ].slice(0, MAX_CARD_IDS);
      const roomId = typeof input.roomId === 'string' ? input.roomId.trim() : '';
      if (ids.length === 0 || roomId.length === 0) {
        return ok([]);
      }
      try {
        const allowedIds = await characterRepository.filterIdsInRoom(ids, roomId);
        if (allowedIds.length === 0) {
          return ok([]);
        }
        const fulls = await Promise.all(
          allowedIds.map((id) => getCharacterFull(id, input.locale))
        );
        const cards = fulls
          .filter((f): f is Record<string, unknown> => f !== null)
          .map(toCharacterCard);
        return ok(cards);
      } catch (err) {
        return fail(
          unexpected(log, err, 'CHARACTER_CARDS_FAILED', 'Failed to fetch character cards')
        );
      }
    },

    // Stamp the Owlbear room a character is bound to. Owner-gated: only the
    // character's owner may record it, so an attacker can't make a scvm they
    // don't own readable in their own room. This is the write half of the
    // (roomId, id) capability gate enforced by getCards.
    async bindObrRoom(input: {
      id: string;
      session: AppSession;
      roomId: string;
    }): Promise<ServiceResult<void>> {
      if (!isValidUUID(input.id)) {
        return fail(badRequest('INVALID_CHARACTER_ID', 'Invalid character ID'));
      }
      const denied = await ensureOwnership(input.id, input.session);
      if (denied) {
        return fail(denied);
      }
      const roomId = typeof input.roomId === 'string' ? input.roomId.trim() : '';
      if (roomId.length === 0) {
        return fail(
          badRequest('INVALID_OBR_ROOM_ID', 'Owlbear room ID is required')
        );
      }
      try {
        await characterRepository.setObrRoom(input.id, roomId);
        return ok(undefined);
      } catch (err) {
        return fail(
          unexpected(
            log,
            err,
            'CHARACTER_OBR_BIND_FAILED',
            'Failed to bind character to room'
          )
        );
      }
    },

    async update(input: {
      id: string;
      session: AppSession;
      body: Record<string, unknown>;
      rawLocale: unknown;
    }): Promise<ServiceResult<unknown>> {
      if (!isValidUUID(input.id)) {
        return fail(badRequest('INVALID_CHARACTER_ID', 'Invalid character ID'));
      }

      const denied = await ensureOwnership(input.id, input.session);
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
        const partyBinding = await characterRepository.getPartyId(input.id);

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

        await characterRepository.update(
          input.id,
          updates as Prisma.CharacterUpdateInput
        );

        const character = await getCharacterFull(input.id, locale);
        if (!character) {
          return fail(notFound('CHARACTER_NOT_FOUND', 'Character not found'));
        }
        if (partyBinding?.partyId) {
          partyBus?.publish(partyBinding.partyId, {
            type: 'character.updated',
            characterId: input.id,
            fields: changedFields,
          });
        }
        return ok(character);
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2025'
        ) {
          return fail(notFound('CHARACTER_NOT_FOUND', 'Character not found'));
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
