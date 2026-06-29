import { FastifyPluginAsync } from 'fastify';
import {
  CreatePartyBodySchema,
  ErrorSchema,
  InviteTokenParamsSchema,
  JoinPartyBodySchema,
  MemberBodySchema,
  PartyIdParamsSchema,
  RenamePartyBodySchema,
  ReplaceMemberBodySchema,
} from '../../schemas/party.js';
import { sendServiceError } from '../../errors.js';
import { createPartyService } from '../../services/party-service.js';
import type { PartyEvent } from '../../plugins/party-bus.js';

function encodeSse(event: PartyEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

const parties: FastifyPluginAsync = async (fastify): Promise<void> => {
  const partyService = (request: {
    log: Parameters<typeof createPartyService>[0];
  }) => createPartyService(request.log, fastify.partyBus);

  // POST /api/parties - GM creates a party
  fastify.post<{ Body: { name?: string } }>(
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

  // GET /api/parties - list parties the GM owns
  fastify.get(
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
  fastify.post<{ Body: { token: string; characterId: string } }>(
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
  fastify.get<{ Params: { token: string } }>(
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
  fastify.get<{ Params: { id: string } }>(
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
  fastify.get<{ Params: { id: string } }>(
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
  fastify.patch<{ Params: { id: string }; Body: { name: string } }>(
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

  // DELETE /api/parties/:id - disband (GM only)
  fastify.delete<{ Params: { id: string } }>(
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
      return reply.status(204).send();
    }
  );

  // POST /api/parties/:id/regenerate-link - rotate invite token (GM only)
  fastify.post<{ Params: { id: string } }>(
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
  fastify.post<{
    Params: { id: string };
    Body: { oldCharacterId: string; newCharacterId: string };
  }>(
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
  fastify.post<{ Params: { id: string }; Body: { characterId: string } }>(
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
      return reply.status(204).send();
    }
  );

  // POST /api/parties/:id/kick - unbind a member (GM only)
  fastify.post<{ Params: { id: string }; Body: { characterId: string } }>(
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
      return reply.status(204).send();
    }
  );
};

export default parties;
