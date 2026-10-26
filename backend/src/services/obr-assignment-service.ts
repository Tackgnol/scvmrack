import { notFound, unauthorized } from '../errors.js';
import { roomParticipationRepository } from '../repositories/room-participation-repository.js';
import { getCharacterFull } from '../lib/get-character-full.js';
import { characterRepository } from '../repositories/character-repository.js';
import {
  fail,
  ok,
  unexpected,
  type ServiceLogger,
  type ServiceResult,
} from './result.js';
import { ownsCharacter, sessionUserId, type AppSession } from './session.js';

type ClaimAssignedCharacterInput = {
  session: AppSession;
  roomId: string;
  playerId: string;
  locale: string;
};

type ClaimedCharacter = Record<string, unknown> & {
  viewerAccess: 'owner';
};

function isAnonymousSession(session: AppSession) {
  return session?.user?.isAnonymous === true;
}

export function createObrAssignmentService(log: ServiceLogger) {
  return {
    async claimAssignedPlayerCharacter(
      input: ClaimAssignedCharacterInput
    ): Promise<ServiceResult<ClaimedCharacter>> {
      const userId = sessionUserId(input.session);

      if (!userId) {
        return fail(unauthorized());
      }

      try {
        const claimed = await roomParticipationRepository.transaction(
          input.roomId,
          async (ops) => {
            const { players } = await ops.getBindings();
            const binding = players.find(
              (row) => row.obrPlayerId === input.playerId
            );
            if (!binding) {
              return fail(
                notFound(
                  'OBR_PLAYER_ASSIGNMENT_NOT_FOUND',
                  'No scvm is assigned to this Owlbear player.'
                )
              );
            }
            const character = await ops.getCharacter(binding.characterId);
            if (!character) {
              return fail(
                notFound('CHARACTER_NOT_FOUND', 'Character not found.')
              );
            }
            if (!ownsCharacter(input.session, character)) {
              await ops.transferOwnership(character.id, userId);
            }
            return ok(character.id);
          }
        );
        if (!claimed.ok) {
          return claimed;
        }
        const characterId = claimed.value;

        if (isAnonymousSession(input.session)) {
          try {
            await characterRepository.deleteOthersForUser(userId, characterId);
          } catch (error) {
            log.error(
              { err: error, characterId: characterId, userId },
              'Failed to prune prior anonymous characters after Owlbear assignment claim'
            );
          }
        }

        const character = await getCharacterFull(characterId, input.locale);

        if (!character) {
          return fail(notFound('CHARACTER_NOT_FOUND', 'Character not found.'));
        }

        return ok({
          ...character,
          viewerAccess: 'owner',
        });
      } catch (error) {
        return fail(
          unexpected(
            log,
            error,
            'OBR_ASSIGNMENT_CLAIM_FAILED',
            'Failed to claim assigned Owlbear scvm.'
          )
        );
      }
    },
  };
}
