import type { FastifyPluginAsync } from 'fastify';
import { sendServiceError } from '../../errors.js';
import { createModerationService } from '../../services/moderation-service.js';

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

const admin: FastifyPluginAsync = async (fastify) => {
  const service = (request: {
    log: Parameters<typeof createModerationService>[0];
  }) => createModerationService(request.log);
  fastify.get('/reports', async (request, reply) => {
    const result = await service(request).listOpen({
      session: request.appSession,
    });
    if (!result.ok) return sendServiceError(reply, request, result.error);
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
      if (!result.ok) return sendServiceError(reply, request, result.error);
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
      if (!result.ok) return sendServiceError(reply, request, result.error);
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
      if (!result.ok) return sendServiceError(reply, request, result.error);
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
      if (!result.ok) return sendServiceError(reply, request, result.error);
      return result.value;
    }
  );
};
export default admin;