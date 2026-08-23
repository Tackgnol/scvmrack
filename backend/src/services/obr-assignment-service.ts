import { notFound, unauthorized } from '../errors.js';
import { obrBindingsDb } from '../lib/obr-bindings-db.js';
import { getCharacterFull } from '../lib/get-character-full.js';
import { characterRepository } from '../repositories/character-repository.js';
import { fail, ok, unexpected, type ServiceLogger, type ServiceResult } from './result.js';
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
        const binding = await obrBindingsDb.getPlayerBinding(input.roomId, input.playerId);

        if (!binding) {
          return fail(
            notFound(
              'OBR_PLAYER_ASSIGNMENT_NOT_FOUND',
              'No scvm is assigned to this Owlbear player.'
            )
          );
        }

        const accessContext = await characterRepository.getPartyAccessContext(binding.characterId);

        if (!accessContext) {
          return fail(notFound('CHARACTER_NOT_FOUND', 'Character not found.'));
        }

        if (!ownsCharacter(input.session, accessContext)) {
          await characterRepository.transferOwnership(binding.characterId, userId);
        }

        if (isAnonymousSession(input.session)) {
          try {
            await characterRepository.deleteOthersForUser(userId, binding.characterId);
          } catch (error) {
            log.error(
              { err: error, characterId: binding.characterId, userId },
              'Failed to prune prior anonymous characters after Owlbear assignment claim'
            );
          }
        }

        const character = await getCharacterFull(binding.characterId, input.locale);

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
