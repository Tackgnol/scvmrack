import { apiError, forbidden, notFound } from '../errors.js';
import {
  roomParticipationRepository,
  type RoomParticipationOps,
} from '../repositories/room-participation-repository.js';
import { fail, ok, unexpected, type ServiceLogger } from './result.js';
import {
  gmUserId,
  hasObrWriteSession,
  ownsCharacter,
  sessionUserId,
  type AppSession,
} from './session.js';
import type { PartyEventBus } from '../plugins/party-bus.js';
import { getCharacterFull } from '../lib/get-character-full.js';
import { toCharacterCard } from '../lib/character-card.js';
import { isValidUUID } from '../utils.js';

async function readRoomParticipation(
  ops: RoomParticipationOps,
  session: AppSession
) {
  const party = await ops.getParty();
  const { players, tokens } = await ops.getBindings();
  const canManage = Boolean(party && gmUserId(session) === party.ownerUserId);
  return {
    partyId: party?.id ?? null,
    memberIds: party?.members.map((member) => member.id) ?? [],
    canManage,
    players: players.map((row) => ({
      playerId: row.obrPlayerId,
      connectionId: row.obrConnectionId,
      characterId: row.characterId,
      assignedByPlayerId: row.assignedByPlayerId,
    })),
    tokens: tokens.map((row) => ({
      tokenId: row.obrTokenId,
      playerId: row.assignedPlayerId,
      characterId: row.characterId,
      generation: row.generation,
    })),
    cleanup: canManage ? await ops.getCleanup() : [],
  };
}

export function createRoomParticipationService(
  log: ServiceLogger,
  bus?: PartyEventBus
) {
  return {
    async cards(roomId: string, ids: string[], locale: string) {
      try {
        const snapshot = await roomParticipationRepository.transaction(
          roomId,
          (ops) => readRoomParticipation(ops, null)
        );
        const visible = new Set([
          ...snapshot.memberIds,
          ...snapshot.players.map((row) => row.characterId),
          ...snapshot.tokens.map((row) => row.characterId),
        ]);
        const allowed = [
          ...new Set(ids.map((id) => id.trim()).filter(isValidUUID)),
        ]
          .slice(0, 50)
          .filter((id) => visible.has(id));
        const fulls = await Promise.all(
          allowed.map((id) => getCharacterFull(id, locale))
        );
        return ok(
          fulls
            .filter((full): full is Record<string, unknown> => full !== null)
            .map(toCharacterCard)
        );
      } catch (error) {
        return fail(
          unexpected(
            log,
            error,
            'ROOM_CARDS_FAILED',
            'Failed to read room cards'
          )
        );
      }
    },
    async updateBinding(input: {
      roomId: string;
      kind: 'player' | 'token';
      id: string;
      characterId?: string;
      playerId?: string | null;
      connectionId?: string | null;
      session: AppSession;
    }) {
      try {
        return await roomParticipationRepository.transaction(
          input.roomId,
          async (ops) => {
            const before = await readRoomParticipation(ops, input.session);
            const binding = {
              token: {
                existing: before.tokens.find((row) => row.tokenId === input.id),
                set: async (characterId: string) => {
                  const row = await ops.setToken({ ...input, characterId });
                  return {
                    roomId: input.roomId,
                    tokenId: row.obrTokenId,
                    playerId: row.assignedPlayerId,
                    characterId: row.characterId,
                    generation: row.generation,
                  };
                },
                clear: () => ops.clearToken(input.id),
              },
              player: {
                existing: before.players.find(
                  (row) => row.playerId === input.id
                ),
                set: async (characterId: string) => {
                  const row = await ops.setPlayer({ ...input, characterId });
                  return {
                    roomId: input.roomId,
                    playerId: row.obrPlayerId,
                    connectionId: row.obrConnectionId,
                    characterId: row.characterId,
                    assignedByPlayerId: row.assignedByPlayerId,
                  };
                },
                clear: () => ops.clearPlayer(input.id),
              },
            }[input.kind];
            const characterId =
              input.characterId ?? binding.existing?.characterId;
            if (!characterId) {
              return ok(null);
            }
            const character = await ops.getCharacter(characterId);
            const owns = character && ownsCharacter(input.session, character);
            const manages =
              before.canManage &&
              (!input.characterId || character?.partyId === before.partyId);
            if (!owns && !manages) {
              return fail(
                apiError(
                  hasObrWriteSession(input.session) ? 403 : 401,
                  'BINDING_ACCESS_DENIED',
                  'You cannot manage this room binding'
                )
              );
            }
            if (input.characterId) {
              return ok(await binding.set(characterId));
            }
            await binding.clear();
            return ok(null);
          }
        );
      } catch (error) {
        return fail(
          unexpected(
            log,
            error,
            'ROOM_BINDING_FAILED',
            'Failed to update room binding'
          )
        );
      }
    },
    async read(roomId: string, session: AppSession) {
      try {
        return ok(
          await roomParticipationRepository.transaction(roomId, (ops) =>
            readRoomParticipation(ops, session)
          )
        );
      } catch (error) {
        return fail(
          unexpected(
            log,
            error,
            'ROOM_READ_FAILED',
            'Failed to read room participation'
          )
        );
      }
    },

    async remove(input: {
      roomId: string;
      characterId: string;
      operationId: string;
      session: AppSession;
      expectedPartyId?: string;
      eventType?: 'character.left' | 'character.kicked';
    }) {
      try {
        const result = await roomParticipationRepository.transaction(
          input.roomId,
          async (ops) => {
            const actorId = sessionUserId(input.session);
            if (!actorId) {
              return fail(forbidden());
            }
            const previous = await ops.getRemoval(input.operationId);
            if (previous) {
              if (
                previous.actorId !== actorId ||
                previous.characterId !== input.characterId
              ) {
                return fail(
                  apiError(
                    409,
                    'REMOVAL_CONFLICT',
                    'This removal belongs to another command'
                  )
                );
              }
              return ok({
                snapshot: await readRoomParticipation(ops, input.session),
                changed: false,
              });
            }
            const party = await ops.getParty();
            const character = await ops.getCharacter(input.characterId);
            if (
              input.expectedPartyId &&
              (party?.id !== input.expectedPartyId ||
                character?.partyId !== input.expectedPartyId)
            ) {
              return fail(
                apiError(
                  409,
                  'ROOM_PARTY_CHANGED',
                  'Room membership changed; refresh and try again'
                )
              );
            }
            if (!character) {
              return fail(
                notFound('CHARACTER_NOT_FOUND', 'Character not found')
              );
            }
            if (
              !ownsCharacter(input.session, character) &&
              (!party || gmUserId(input.session) !== party.ownerUserId)
            ) {
              return fail(forbidden());
            }
            const bindings = await ops.getBindings();
            const tokens = bindings.tokens.filter(
              (row) => row.characterId === input.characterId
            );
            const bound =
              tokens.length > 0 ||
              bindings.players.some(
                (row) => row.characterId === input.characterId
              );
            const member = Boolean(party && character.partyId === party.id);
            if (!member && !bound) {
              return fail(
                notFound(
                  'ROOM_PARTICIPATION_NOT_FOUND',
                  'This scvm is not in the room'
                )
              );
            }
            await ops.recordRemoval({
              operationId: input.operationId,
              characterId: input.characterId,
              actorId,
            });
            for (const token of tokens) {
              await ops.addCleanup({
                operationId: input.operationId,
                characterId: input.characterId,
                tokenId: token.obrTokenId,
                generation: token.generation,
              });
            }
            if (member && party) {
              await ops.removeMembership(input.characterId, party.id);
            }
            await ops.removeBindings(input.characterId);
            return ok({
              snapshot: await readRoomParticipation(ops, input.session),
              changed: true,
            });
          }
        );
        if (!result.ok) {
          return result;
        }
        if (result.value.changed && result.value.snapshot.partyId) {
          bus?.publish(result.value.snapshot.partyId, {
            type: input.eventType ?? 'character.kicked',
            characterId: input.characterId,
          });
        }
        return ok(result.value.snapshot);
      } catch (error) {
        return fail(
          unexpected(
            log,
            error,
            'ROOM_REMOVAL_FAILED',
            'Failed to remove scvm from room'
          )
        );
      }
    },

    async acknowledge(roomId: string, id: string, session: AppSession) {
      try {
        return await roomParticipationRepository.transaction(
          roomId,
          async (ops) => {
            const party = await ops.getParty();
            if (!party || gmUserId(session) !== party.ownerUserId) {
              return fail(forbidden());
            }
            await ops.acknowledgeCleanup(id);
            return ok(await readRoomParticipation(ops, session));
          }
        );
      } catch (error) {
        return fail(
          unexpected(
            log,
            error,
            'ROOM_CLEANUP_FAILED',
            'Failed to acknowledge scene cleanup'
          )
        );
      }
    },
  };
}
