import { Prisma } from '@prisma/client';
import { Roller, OSRandomEngine } from '@tackgnol/rpg-tools-roller';
import {
  characterRepository,
  type CharacterSummaryRow,
} from '../repositories/character-repository.js';
import { generateCharacter } from '../lib/generate-character.js';
import { getCharacterFull } from '../lib/get-character-full.js';
import { hydrateInventoryUses } from '../lib/inventory.js';
import {
  isValidLocale,
  isValidUUID,
  sanitizeCharacterUpdate,
} from '../utils.js';
import {
  ApiHttpError,
  apiError,
  badRequest,
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

/** Minimal session shape the service needs (decoupled from Fastify). */
export type AppSession = { user?: { id?: string | null } | null } | null;

export type CharacterListRow = {
  id: string;
  name: string;
  classId: number | null;
  className: string | null;
  currentHp: number;
  maxHp: number;
  createdAt: Date;
  updatedAt: Date;
};

function sessionUserId(session: AppSession): string | null {
  return session?.user?.id ?? null;
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
export function createCharacterService(log: ServiceLogger) {
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
      locale: string;
    }): Promise<ServiceResult<unknown>> {
      const userId = sessionUserId(input.session);
      if (!userId) {
        return fail(unauthorized());
      }

      try {
        const roller = new Roller({ engine: new OSRandomEngine() });
        // Bind ownership at creation so a failure can never leave an orphaned,
        // unowned (and thus unreachable) character row.
        const characterId = await generateCharacter(
          input.classId ?? null,
          roller,
          userId
        );

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

      const denied = await ensureOwnership(input.id, input.session);
      if (denied) {
        return fail(denied);
      }

      try {
        const character = await getCharacterFull(input.id, input.locale);
        if (!character) {
          return fail(notFound('CHARACTER_NOT_FOUND', 'Character not found'));
        }
        return ok(character);
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

      if (Object.keys(updates).length === 0) {
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

        await characterRepository.update(
          input.id,
          updates as Prisma.CharacterUpdateInput
        );

        const character = await getCharacterFull(input.id, locale);
        if (!character) {
          return fail(notFound('CHARACTER_NOT_FOUND', 'Character not found'));
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
        const result = await characterRepository.deleteById(input.id);
        if (result.count === 0) {
          return fail(notFound('CHARACTER_NOT_FOUND', 'Character not found'));
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
