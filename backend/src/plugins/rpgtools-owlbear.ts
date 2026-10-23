import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { obrRoomBindings } from '@tackgnol/rpgtools-owlbear/server';
import { obrBindingsDb } from '../lib/obr-bindings-db.js';
import { getCharacterFull } from '../lib/get-character-full.js';
import { toCharacterCard } from '../lib/character-card.js';
import {
  hasObrWriteSession,
  type AppSession,
} from '../services/session.js';
import { canManageObrBinding, filterAdditionalVisibleCharacterIdsInObrRoom } from '../services/obr-room-visibility-service.js';

type BindingActor = { session: AppSession; roomId: string };

export default fp(async function rpgtoolsOwlbearPlugin(fastify: FastifyInstance) {
  await fastify.register(obrRoomBindings, {
    prefix: '/api/obr',
    db: obrBindingsDb,
    // The adapter's opaque session value also carries the validated route room.
    getSession: (request): BindingActor => ({
      session: (request as typeof request & { appSession?: AppSession }).appSession ?? null,
      roomId: (request.params as { roomId: string }).roomId,
    }),
    hasWriteAccess: (actor) => hasObrWriteSession((actor as BindingActor).session),
    async getCards(allowedIds, locale) {
      const fulls = await Promise.all(allowedIds.map((id) => getCharacterFull(id, locale)));
      return fulls.filter((f): f is Record<string, unknown> => f !== null).map(toCharacterCard);
    },
    async ownsCharacter(actor, characterId) {
      const { session, roomId } = actor as BindingActor;
      return canManageObrBinding(session, characterId, roomId);
    },
    async extraRoomCharacterIds(ids, roomId) {
      return filterAdditionalVisibleCharacterIdsInObrRoom(ids, roomId);
    },
  });

  fastify.log.info('rpgtools-owlbear registered');
  // Swagger must load first so these routes reach the OpenAPI document.
}, { dependencies: ['swagger'] });
