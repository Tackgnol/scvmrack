import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { obrRoomBindings } from '@tackgnol/rpgtools-owlbear/server';
import { obrBindingsDb } from '../lib/obr-bindings-db.js';
import { getCharacterFull } from '../lib/get-character-full.js';
import { toCharacterCard } from '../lib/character-card.js';
import { hasObrWriteSession } from '../services/session.js';
import {
  canManageObrBinding,
  canRemoveObrBinding,
  filterAdditionalVisibleCharacterIdsInObrRoom,
} from '../services/obr-room-visibility-service.js';

type BindingAccess = {
  hasWriteSession: boolean;
  canWriteBinding: (characterId: string) => Promise<boolean>;
};

/** Capture request-specific access in the SDK's opaque session slot. */
function createBindingAccess(request: FastifyRequest): BindingAccess {
  const session = request.appSession ?? null;
  const { roomId } = request.params as { roomId: string };
  const authorize =
    request.method === 'DELETE' ? canRemoveObrBinding : canManageObrBinding;
  return {
    hasWriteSession: hasObrWriteSession(session),
    canWriteBinding: (characterId) => authorize(session, characterId, roomId),
  };
}

export default fp(
  async function rpgtoolsOwlbearPlugin(fastify: FastifyInstance) {
    await fastify.register(obrRoomBindings, {
      prefix: '/api/obr',
      db: obrBindingsDb,
      getSession: createBindingAccess,
      hasWriteAccess: (access) => (access as BindingAccess).hasWriteSession,
      async getCards(allowedIds, locale) {
        const fulls = await Promise.all(
          allowedIds.map((id) => getCharacterFull(id, locale))
        );
        return fulls
          .filter((f): f is Record<string, unknown> => f !== null)
          .map(toCharacterCard);
      },
      ownsCharacter: (access, characterId) =>
        (access as BindingAccess).canWriteBinding(characterId),
      extraRoomCharacterIds: filterAdditionalVisibleCharacterIdsInObrRoom,
    });

    fastify.log.info('rpgtools-owlbear registered');
    // Swagger must load first so these routes reach the OpenAPI document.
  },
  { dependencies: ['swagger'] }
);
