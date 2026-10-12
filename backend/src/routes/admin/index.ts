import type { FastifyPluginAsync } from 'fastify';
import { sendServiceError } from '../../errors.js';
import { createModerationService } from '../../services/moderation-service.js';
import { createCreationBanService } from '../../services/creation-ban-service.js';

const params = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'string', format: 'uuid' } },
} as const;
const reason = {
  type: 'object',
  additionalProperties: false,
  required: ['reason'],
  properties: { reason: { type: 'string', minLength: 1, maxLength: 4000 } },
} as const;
const userParams = {
  type: 'object',
  required: ['userId'],
  properties: { userId: { type: 'string', minLength: 1, maxLength: 255 } },
} as const;

const admin: FastifyPluginAsync = async (fastify) => {
  const service = (request: {
    log: Parameters<typeof createModerationService>[0];
  }) => createModerationService(request.log);
  const bans = (request: {
    log: Parameters<typeof createCreationBanService>[0];
  }) => createCreationBanService(request.log);
  fastify.get('/creation-bans/:userId', { schema: { params: userParams } }, async (request, reply) => {
    const result = await bans(request).inspect({
      session: request.appSession,
      userId: (request.params as { userId: string }).userId,
    });
    if (!result.ok) {
      return sendServiceError(reply, request, result.error);
    }
    return result.value;
  });
  fastify.post('/creation-bans/:userId', { schema: { params: userParams, body: reason } }, async (request, reply) => {
    const result = await bans(request).ban({
      session: request.appSession,
      userId: (request.params as { userId: string }).userId,
      reason: (request.body as { reason: string }).reason,
    });
    if (!result.ok) {
      return sendServiceError(reply, request, result.error);
    }
    return result.value;
  });
  fastify.delete('/creation-bans/:userId', { schema: { params: userParams, body: reason } }, async (request, reply) => {
    const result = await bans(request).unban({
      session: request.appSession,
      userId: (request.params as { userId: string }).userId,
      reason: (request.body as { reason: string }).reason,
    });
    if (!result.ok) {
      return sendServiceError(reply, request, result.error);
    }
    return result.value;
  });
  fastify.get('/reports', async (request, reply) => {
    const result = await service(request).listOpen({
      session: request.appSession,
    });
    if (!result.ok) {
      return sendServiceError(reply, request, result.error);
    }
    return result.value;
  });
  fastify.post(
    '/reports/:id/dismiss',
    { schema: { params, body: reason } },
    async (request, reply) => {
      const result = await service(request).dismiss({
        session: request.appSession,
        id: (request.params as { id: string }).id,
        reason: (request.body as { reason: string }).reason,
      });
      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }
      return result.value;
    }
  );
  fastify.post(
    '/reports/:id/take-down',
    { schema: { params, body: reason } },
    async (request, reply) => {
      const result = await service(request).takeDown({
        session: request.appSession,
        id: (request.params as { id: string }).id,
        reason: (request.body as { reason: string }).reason,
      });
      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }
      return result.value;
    }
  );
  fastify.post(
    '/reports/:id/remove-content',
    { schema: { params, body: reason } },
    async (request, reply) => {
      const result = await service(request).removeContent({
        session: request.appSession,
        id: (request.params as { id: string }).id,
        reason: (request.body as { reason: string }).reason,
      });
      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }
      return result.value;
    }
  );  fastify.post(
    '/reports/:id/restore',
    { schema: { params, body: reason } },
    async (request, reply) => {
      const result = await service(request).restore({
        session: request.appSession,
        id: (request.params as { id: string }).id,
        reason: (request.body as { reason: string }).reason,
      });
      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }
      return result.value;
    }
  );
};
export default admin;
