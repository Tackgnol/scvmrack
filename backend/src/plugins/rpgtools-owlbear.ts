import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { obrRoomBindings } from '@tackgnol/rpgtools-owlbear/server';
import { obrBindingsDb } from '../lib/obr-bindings-db.js';
import { getCharacterFull } from '../lib/get-character-full.js';
import { toCharacterCard } from '../lib/character-card.js';
import { hasObrWriteSession, type AppSession } from '../services/session.js';
import {
  canUseCharacterInObrRoom,
  filterAdditionalVisibleCharacterIdsInObrRoom,
} from '../services/obr-room-visibility-service.js';

export default fp(async function rpgtoolsOwlbearPlugin(fastify: FastifyInstance) {
  await fastify.register(obrRoomBindings, {
    prefix: '/api/obr',
    db: obrBindingsDb,
    getSession: (request) => (request as any).appSession,
    hasWriteAccess: hasObrWriteSession,
    async getCards(allowedIds, locale) {
      const fulls = await Promise.all(allowedIds.map((id) => getCharacterFull(id, locale)));
      return fulls.filter((f): f is Record<string, unknown> => f !== null).map(toCharacterCard);
    },
    async ownsCharacter(session, characterId, roomId) {
      return canUseCharacterInObrRoom(session as AppSession, characterId, roomId);
    },
    async extraRoomCharacterIds(ids, roomId) {
      return filterAdditionalVisibleCharacterIdsInObrRoom(ids, roomId);
    },
  });

  fastify.log.info('rpgtools-owlbear registered');
});
