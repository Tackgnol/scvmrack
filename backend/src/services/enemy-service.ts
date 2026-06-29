import { toEnemyCard, toEnemyFull } from '../lib/enemy-card.js';
import { characterRepository } from '../repositories/character-repository.js';
import {
  enemyRepository,
  type EnemyWriteData,
} from '../repositories/enemy-repository.js';
import { partyRepository } from '../repositories/party-repository.js';
import {
  badRequest,
  notFound,
  unauthorized,
  type ApiHttpError,
} from '../errors.js';
import { isValidUUID } from '../utils.js';
import {
  fail,
  ok,
  unexpected,
  type ServiceLogger,
  type ServiceResult,
} from './result.js';

export type AppSession = {
  session?: { id?: string | null } | null;
  user?: { id?: string | null; isAnonymous?: boolean | null } | null;
} | null;

export type EnemyInput = {
  name: string;
  type?: string;
  habitat?: string;
  description?: string;
  playerDescription?: string;
  currentHealth: number;
  maxHealth?: number;
  morale?: number;
  armorDie?: string;
  armorDescription?: string;
  attacks?: Array<{ id: string; name: string; die?: string }>;
  specials?: Array<{ id: string; name: string; description?: string }>;
  loot?: Array<{ id: string; label: string; value?: string }>;
  statuses: Array<{ id: string; percent: number; label: string }>;
};

const MAX_ROWS = 8;

function userId(session: AppSession): string | null {
  return session?.user?.id ?? null;
}

function isGm(session: AppSession): boolean {
  return Boolean(userId(session)) && session?.user?.isAnonymous !== true;
}

function clampInt(value: number | undefined, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, Math.round(value as number)));
}

function toWriteData(body: EnemyInput): EnemyWriteData {
  const maxHealth = clampInt(body.maxHealth, 1, 999);
  return {
    name: body.name.trim(),
    type: (body.type ?? '').trim(),
    habitat: (body.habitat ?? '').trim(),
    description: (body.description ?? '').trim(),
    playerDescription: (body.playerDescription ?? '').trim(),
    currentHealth: clampInt(body.currentHealth, 0, maxHealth),
    maxHealth,
    morale: clampInt(body.morale, 0, 99),
    armorDie: (body.armorDie ?? '').trim(),
    armorDescription: (body.armorDescription ?? '').trim(),
    attacks: (body.attacks ?? []).slice(0, MAX_ROWS),
    specials: (body.specials ?? []).slice(0, MAX_ROWS),
    loot: (body.loot ?? []).slice(0, MAX_ROWS),
    statuses: (body.statuses ?? []).slice(0, MAX_ROWS),
  };
}

export function createEnemyService(log: ServiceLogger) {
  async function ensureOwnedParty(
    session: AppSession,
    roomId: string
  ): Promise<{ partyId: string } | ApiHttpError> {
    if (!isGm(session)) {
      return unauthorized();
    }

    const room = typeof roomId === 'string' ? roomId.trim() : '';
    if (room.length === 0) {
      return badRequest('INVALID_OBR_ROOM_ID', 'Owlbear room ID is required');
    }

    const party = await partyRepository.getPartyByObrRoomId(room);
    if (!party || party.ownerUserId !== userId(session)) {
      return notFound('PARTY_NOT_FOUND', 'Party not found');
    }
    return { partyId: party.id };
  }

  return {
    async listForOwner(input: {
      session: AppSession;
      roomId: string;
    }): Promise<ServiceResult<unknown>> {
      try {
        const owned = await ensureOwnedParty(input.session, input.roomId);
        if ('statusCode' in owned) {
          return fail(owned);
        }
        const rows = await enemyRepository.listByParty(owned.partyId);
        return ok(
          rows.map((row) =>
            toEnemyFull(row as unknown as Record<string, unknown>)
          )
        );
      } catch (err) {
        return fail(
          unexpected(log, err, 'ENEMY_LIST_FAILED', 'Failed to list enemies')
        );
      }
    },

    async listCardsForPlayer(input: {
      roomId: string;
      characterId: string;
    }): Promise<ServiceResult<unknown>> {
      const room = typeof input.roomId === 'string' ? input.roomId.trim() : '';
      if (room.length === 0 || !isValidUUID(input.characterId)) {
        return ok([]);
      }

      try {
        const inRoom = await characterRepository.filterIdsInRoom(
          [input.characterId],
          room
        );
        if (inRoom.length === 0) {
          return ok([]);
        }

        const party = await partyRepository.getPartyByObrRoomId(room);
        if (!party) {
          return ok([]);
        }

        const rows = await enemyRepository.listByParty(party.id);
        return ok(
          rows.map((row) =>
            toEnemyCard(row as unknown as Record<string, unknown>)
          )
        );
      } catch (err) {
        return fail(
          unexpected(
            log,
            err,
            'ENEMY_CARDS_FAILED',
            'Failed to fetch enemy cards'
          )
        );
      }
    },

    async create(input: {
      session: AppSession;
      roomId: string;
      body: EnemyInput;
    }): Promise<ServiceResult<unknown>> {
      try {
        const owned = await ensureOwnedParty(input.session, input.roomId);
        if ('statusCode' in owned) {
          return fail(owned);
        }
        const row = await enemyRepository.create(
          owned.partyId,
          toWriteData(input.body)
        );
        return ok(toEnemyFull(row as unknown as Record<string, unknown>));
      } catch (err) {
        return fail(
          unexpected(log, err, 'ENEMY_CREATE_FAILED', 'Failed to create enemy')
        );
      }
    },

    async update(input: {
      session: AppSession;
      roomId: string;
      enemyId: string;
      body: EnemyInput;
    }): Promise<ServiceResult<unknown>> {
      if (!isValidUUID(input.enemyId)) {
        return fail(badRequest('INVALID_ENEMY_ID', 'Invalid enemy ID'));
      }

      try {
        const owned = await ensureOwnedParty(input.session, input.roomId);
        if ('statusCode' in owned) {
          return fail(owned);
        }
        const row = await enemyRepository.update(
          input.enemyId,
          owned.partyId,
          toWriteData(input.body)
        );
        if (!row) {
          return fail(notFound('ENEMY_NOT_FOUND', 'Enemy not found'));
        }
        return ok(toEnemyFull(row as unknown as Record<string, unknown>));
      } catch (err) {
        return fail(
          unexpected(log, err, 'ENEMY_UPDATE_FAILED', 'Failed to update enemy')
        );
      }
    },

    async setHealth(input: {
      session: AppSession;
      roomId: string;
      enemyId: string;
      currentHealth: number;
    }): Promise<ServiceResult<unknown>> {
      if (!isValidUUID(input.enemyId)) {
        return fail(badRequest('INVALID_ENEMY_ID', 'Invalid enemy ID'));
      }

      try {
        const owned = await ensureOwnedParty(input.session, input.roomId);
        if ('statusCode' in owned) {
          return fail(owned);
        }
        const row = await enemyRepository.setHealth(
          input.enemyId,
          owned.partyId,
          clampInt(input.currentHealth, 0, 999)
        );
        if (!row) {
          return fail(notFound('ENEMY_NOT_FOUND', 'Enemy not found'));
        }
        return ok(toEnemyFull(row as unknown as Record<string, unknown>));
      } catch (err) {
        return fail(
          unexpected(
            log,
            err,
            'ENEMY_HEALTH_FAILED',
            'Failed to update enemy health'
          )
        );
      }
    },

    async remove(input: {
      session: AppSession;
      roomId: string;
      enemyId: string;
    }): Promise<ServiceResult<void>> {
      if (!isValidUUID(input.enemyId)) {
        return fail(badRequest('INVALID_ENEMY_ID', 'Invalid enemy ID'));
      }

      try {
        const owned = await ensureOwnedParty(input.session, input.roomId);
        if ('statusCode' in owned) {
          return fail(owned);
        }
        const count = await enemyRepository.delete(
          input.enemyId,
          owned.partyId
        );
        if (count === 0) {
          return fail(notFound('ENEMY_NOT_FOUND', 'Enemy not found'));
        }
        return ok(undefined);
      } catch (err) {
        return fail(
          unexpected(log, err, 'ENEMY_DELETE_FAILED', 'Failed to delete enemy')
        );
      }
    },
  };
}
