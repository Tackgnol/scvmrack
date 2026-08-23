import type { FastifyPluginAsync } from 'fastify';
import type { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import {
  AttachRoomBodySchema,
  CreatePartyBodySchema,
  ErrorSchema,
  InviteTokenParamsSchema,
  JoinPartyBodySchema,
  MemberBodySchema,
  PartyIdParamsSchema,
  PartyLimitsSchema,
  PartyMiseriesResultSchema,
  PromotePartyBodySchema,
  RenamePartyBodySchema,
  ReplaceMemberBodySchema,
  SetPartyMiseriesBodySchema,
} from '../../schemas/party.js';
import { sendServiceError } from '../../errors.js';
import { createPartyService } from '../../services/party-service.js';
import type { PartyEvent } from '../../plugins/party-bus.js';
import partyEnemies from './enemies.js';

function encodeSse(event: PartyEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

const parties: FastifyPluginAsync = async (fastify): Promise<void> => {
  // @fastify/autoload only loads one plugin per directory when an `index`
  // file is present (siblings are ignored), so the room enemy routes can't
  // be autoloaded from enemies.ts directly. Register them explicitly here
  // instead; the child plugin inherits this file's /api/parties prefix, so
  // the enemy route paths are unchanged.
  await fastify.register(partyEnemies);

  const app = fastify.withTypeProvider<JsonSchemaToTsProvider>();

  const partyService = (request: {
    log: Parameters<typeof createPartyService>[0];
  }) => createPartyService(request.log, fastify.partyBus);

  // GET /api/parties/limits - public party config (configured max warband size).
  // No auth: a single non-sensitive constant the OBR roster (which has no
  // server-side party in-room) shows as its denominator. Single source of truth
  // is the backend PARTY_MAX_MEMBERS env, surfaced via the service.
  app.get(
    '/limits',
    {
      schema: {
        description: 'Party limits (configured max members)',
        tags: ['parties'],
        response: {
          200: PartyLimitsSchema,
          500: ErrorSchema,
        },
      },
    },
    async (request) => {
      return { maxMembers: partyService(request).maxMembers };
    }
  );

  // POST /api/parties - GM creates a party
  app.post(
    '/',
    {
      schema: {
        description: 'Create a party (GM only)',
        tags: ['parties'],
        body: CreatePartyBodySchema,
        response: {
          201: { type: 'object', additionalProperties: true },
          401: ErrorSchema,
          500: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await partyService(request).createParty({
        session: request.appSession,
        name: request.body?.name,
      });

      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }
      return reply.status(201).send(result.value);
    }
  );

  // POST /api/parties/promote - promote an OBR room into a durable party
  app.post(
    '/promote',
    {
      config: {
        rateLimit: {
          max: process.env.NODE_ENV === 'test' ? 10000 : 10,
          timeWindow: '1 minute',
        },
      },
      schema: {
        description: 'Promote an Owlbear room into a party (GM only)',
        tags: ['parties'],
        body: PromotePartyBodySchema,
        response: {
          200: { type: 'object', additionalProperties: true },
          400: ErrorSchema,
          401: ErrorSchema,
          409: ErrorSchema,
          429: ErrorSchema,
          500: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await partyService(request).promoteRoom({
        session: request.appSession,
        obrRoomId: request.body.obrRoomId,
        name: request.body.name,
      });

      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }
      return result.value;
    }
  );

  // POST /api/parties/:id/attach-room - re-point the party to a new OBR room (GM only)
  app.post(
    '/:id/attach-room',
    {
      schema: {
        description: 'Attach this party to an Owlbear room (GM only)',
        tags: ['parties'],
        params: PartyIdParamsSchema,
        body: AttachRoomBodySchema,
        response: {
          200: { type: 'object', additionalProperties: true },
          400: ErrorSchema, 401: ErrorSchema, 404: ErrorSchema,
          409: ErrorSchema, 500: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await partyService(request).attachRoom({
        session: request.appSession,
        id: request.params.id,
        obrRoomId: request.body.obrRoomId,
      });
      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }
      return result.value;
    }
  );

  // POST /api/parties/:id/detach-room - clear the party's OBR room pointer (GM only)
  app.post(
    '/:id/detach-room',
    {
      schema: {
        description: 'Detach this party from its Owlbear room (GM only)',
        tags: ['parties'],
        params: PartyIdParamsSchema,
        response: {
          200: { type: 'object', additionalProperties: true },
          400: ErrorSchema, 401: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await partyService(request).detachRoom({
        session: request.appSession,
        id: request.params.id,
      });
      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }
      return result.value;
    }
  );

  // GET /api/parties - list parties the GM owns
  app.get(
    '/',
    {
      schema: {
        description: 'List parties owned by the current GM',
        tags: ['parties'],
        response: {
          200: {
            type: 'array',
            items: { type: 'object', additionalProperties: true },
          },
          401: ErrorSchema,
          500: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await partyService(request).listParties({
        session: request.appSession,
      });

      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }
      return result.value;
    }
  );

  // POST /api/parties/join - bind a character to a party via invite token
  app.post(
    '/join',
    {
      config: {
        rateLimit: {
          max: process.env.NODE_ENV === 'test' ? 10000 : 30,
          timeWindow: '1 minute',
        },
      },
      schema: {
        description: 'Join a party by invite token (character owner)',
        tags: ['parties'],
        body: JoinPartyBodySchema,
        response: {
          200: { type: 'object', additionalProperties: true },
          400: ErrorSchema,
          403: ErrorSchema,
          404: ErrorSchema,
          409: ErrorSchema,
          410: ErrorSchema,
          429: ErrorSchema,
          500: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await partyService(request).joinParty({
        session: request.appSession,
        token: request.body.token,
        characterId: request.body.characterId,
      });

      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }
      return result.value;
    }
  );

  // GET /api/parties/invite/:token - public invite metadata for the join page
  app.get(
    '/invite/:token',
    {
      config: {
        rateLimit: {
          max: process.env.NODE_ENV === 'test' ? 10000 : 60,
          timeWindow: '1 minute',
        },
      },
      schema: {
        description: 'Get public party invite metadata by token',
        tags: ['parties'],
        params: InviteTokenParamsSchema,
        response: {
          200: { type: 'object', additionalProperties: true },
          410: ErrorSchema,
          429: ErrorSchema,
          500: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await partyService(request).getInvite({
        token: request.params.token,
      });

      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }
      return result.value;
    }
  );

  // GET /api/parties/:id - party + roster (GM manage view, or member read view)
  app.get(
    '/:id',
    {
      schema: {
        description: 'Get a party and its roster',
        tags: ['parties'],
        params: PartyIdParamsSchema,
        response: {
          200: { type: 'object', additionalProperties: true },
          400: ErrorSchema,
          404: ErrorSchema,
          500: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await partyService(request).getParty({
        session: request.appSession,
        id: request.params.id,
      });

      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }
      return result.value;
    }
  );

  // GET /api/parties/:id/stream - live party invalidation stream
  app.get(
    '/:id/stream',
    {
      schema: {
        description: 'Subscribe to party realtime events',
        tags: ['parties'],
        params: PartyIdParamsSchema,
        response: {
          400: ErrorSchema,
          404: ErrorSchema,
          500: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await partyService(request).getParty({
        session: request.appSession,
        id: request.params.id,
      });

      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }

      reply.hijack();
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-store',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      });
      reply.raw.write(': connected\n\n');

      let closed = false;
      let heartbeat: NodeJS.Timeout | undefined;
      let unsubscribe: (() => void) | undefined;
      let unregisterPresence: (() => void) | undefined;
      const cleanup = () => {
        if (closed) {
          return;
        }
        closed = true;
        if (heartbeat) {
          clearInterval(heartbeat);
        }
        unsubscribe?.();
        unregisterPresence?.();
        if (!reply.raw.writableEnded) {
          reply.raw.end();
        }
      };

      unsubscribe = fastify.partyBus.subscribe(request.params.id, (event) => {
        try {
          reply.raw.write(encodeSse(event));
        } catch (err) {
          request.log.debug(err, 'Failed to write party SSE event');
          cleanup();
        }
      });

      reply.raw.write(
        encodeSse({
          type: 'party.presenceSnapshot',
          presence: fastify.partyBus.presenceSnapshot(
            request.params.id,
            result.value.members.map((member) => member.characterId)
          ),
        })
      );

      if (result.value.role === 'member') {
        const ownedMember = result.value.members.find((member) => member.owned);
        if (ownedMember) {
          unregisterPresence = fastify.partyBus.connectPresence(
            request.params.id,
            ownedMember.characterId
          );
        }
      }

      heartbeat = setInterval(() => {
        try {
          reply.raw.write(': heartbeat\n\n');
        } catch (err) {
          request.log.debug(err, 'Failed to write party SSE heartbeat');
          cleanup();
        }
      }, 25_000);

      request.raw.on('close', cleanup);
    }
  );

  // PATCH /api/parties/:id - rename (GM only)
  app.patch(
    '/:id',
    {
      schema: {
        description: 'Rename a party (GM only)',
        tags: ['parties'],
        params: PartyIdParamsSchema,
        body: RenamePartyBodySchema,
        response: {
          200: { type: 'object', additionalProperties: true },
          400: ErrorSchema,
          401: ErrorSchema,
          404: ErrorSchema,
          500: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await partyService(request).renameParty({
        session: request.appSession,
        id: request.params.id,
        name: request.body.name,
      });

      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }
      return result.value;
    }
  );

  // PUT /api/parties/:id/miseries - set every member's Misery count (GM only)
  fastify.put<{ Params: { id: string }; Body: { miseryCount: number } }>(
    '/:id/miseries',
    {
      config: {
        rateLimit: {
          max: process.env.NODE_ENV === 'test' ? 10000 : 30,
          timeWindow: '1 minute',
        },
      },
      schema: {
        description: "Set every party member's Misery count (GM only)",
        tags: ['parties'],
        params: PartyIdParamsSchema,
        body: SetPartyMiseriesBodySchema,
        response: {
          200: PartyMiseriesResultSchema,
          400: ErrorSchema,
          401: ErrorSchema,
          404: ErrorSchema,
          429: ErrorSchema,
          500: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await partyService(request).setMiseries({
        session: request.appSession,
        id: request.params.id,
        miseryCount: request.body.miseryCount,
      });

      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }
      return result.value;
    }
  );

  // DELETE /api/parties/:id - disband (GM only)
  app.delete(
    '/:id',
    {
      schema: {
        description: 'Disband a party (GM only)',
        tags: ['parties'],
        params: PartyIdParamsSchema,
        response: {
          204: { type: 'null', description: 'Party disbanded' },
          400: ErrorSchema,
          401: ErrorSchema,
          404: ErrorSchema,
          500: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await partyService(request).disbandParty({
        session: request.appSession,
        id: request.params.id,
      });

      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }
      return reply.status(204).send(null);
    }
  );

  // POST /api/parties/:id/regenerate-link - rotate invite token (GM only)
  app.post(
    '/:id/regenerate-link',
    {
      schema: {
        description: 'Rotate the invite link (GM only)',
        tags: ['parties'],
        params: PartyIdParamsSchema,
        response: {
          200: { type: 'object', additionalProperties: true },
          400: ErrorSchema,
          401: ErrorSchema,
          404: ErrorSchema,
          500: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await partyService(request).regenerateLink({
        session: request.appSession,
        id: request.params.id,
      });

      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }
      return result.value;
    }
  );

  // POST /api/parties/:id/replace-member - bind a replacement character (character owner)
  app.post(
    '/:id/replace-member',
    {
      schema: {
        description:
          'Bind a replacement character to the same party (character owner)',
        tags: ['parties'],
        params: PartyIdParamsSchema,
        body: ReplaceMemberBodySchema,
        response: {
          200: { type: 'object', additionalProperties: true },
          400: ErrorSchema,
          403: ErrorSchema,
          404: ErrorSchema,
          409: ErrorSchema,
          500: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await partyService(request).replaceMember({
        session: request.appSession,
        id: request.params.id,
        oldCharacterId: request.body.oldCharacterId,
        newCharacterId: request.body.newCharacterId,
      });

      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }
      return result.value;
    }
  );

  // POST /api/parties/:id/leave - unbind own character (character owner)
  app.post(
    '/:id/leave',
    {
      schema: {
        description: 'Leave a party (character owner)',
        tags: ['parties'],
        params: PartyIdParamsSchema,
        body: MemberBodySchema,
        response: {
          204: { type: 'null', description: 'Left the party' },
          400: ErrorSchema,
          403: ErrorSchema,
          404: ErrorSchema,
          500: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await partyService(request).leaveParty({
        session: request.appSession,
        id: request.params.id,
        characterId: request.body.characterId,
      });

      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }
      return reply.status(204).send(null);
    }
  );

  // POST /api/parties/:id/kick - unbind a member (GM only)
  app.post(
    '/:id/kick',
    {
      schema: {
        description: 'Remove a member from a party (GM only)',
        tags: ['parties'],
        params: PartyIdParamsSchema,
        body: MemberBodySchema,
        response: {
          204: { type: 'null', description: 'Member removed' },
          400: ErrorSchema,
          401: ErrorSchema,
          404: ErrorSchema,
          500: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await partyService(request).kick({
        session: request.appSession,
        id: request.params.id,
        characterId: request.body.characterId,
      });

      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }
      return reply.status(204).send(null);
    }
  );
};

export default parties;
