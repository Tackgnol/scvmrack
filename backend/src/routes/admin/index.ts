import type { FastifyPluginAsync } from 'fastify';
import type { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import { sendServiceError } from '../../errors.js';
import { ErrorSchema } from '../../schemas/equipment.js';
import {
  AdminReportGroupsSchema,
  CreationBanStatusSchema,
  CreationBanViewSchema,
  DecisionBodySchema,
  ContentRemovedSchema,
  DismissedSchema,
  RestoredSchema,
  TakenDownSchema,
  MeasureBodySchema,
  ModerationLogSchema,
  ReportIdParamsSchema,
  UserIdParamsSchema,
} from '../../schemas/moderation.js';
import { createModerationService } from '../../services/moderation-service.js';
import { createCreationBanService } from '../../services/creation-ban-service.js';

const errors = { 400: ErrorSchema, 404: ErrorSchema, 409: ErrorSchema, 500: ErrorSchema };

/** Moderation for allowlisted accounts; every route answers 404 to anyone else. */
const admin: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<JsonSchemaToTsProvider>();

  app.get(
    '/creation-bans/:userId',
    { schema: { tags: ['admin'], params: UserIdParamsSchema, response: { 200: CreationBanViewSchema, ...errors } } },
    async (request, reply) => {
      const result = await createCreationBanService(request.log).inspect({
        session: request.appSession,
        userId: request.params.userId,
      });
      return result.ok ? result.value : sendServiceError(reply, request, result.error);
    }
  );
  app.post(
    '/creation-bans/:userId',
    {
      schema: {
        tags: ['admin'],
        params: UserIdParamsSchema,
        body: DecisionBodySchema,
        response: { 200: CreationBanStatusSchema, ...errors },
      },
    },
    async (request, reply) => {
      const result = await createCreationBanService(request.log).ban({
        session: request.appSession,
        userId: request.params.userId,
        reason: request.body.reason,
      });
      return result.ok ? result.value : sendServiceError(reply, request, result.error);
    }
  );
  app.delete(
    '/creation-bans/:userId',
    {
      schema: {
        tags: ['admin'],
        params: UserIdParamsSchema,
        body: DecisionBodySchema,
        response: { 200: CreationBanStatusSchema, ...errors },
      },
    },
    async (request, reply) => {
      const result = await createCreationBanService(request.log).unban({
        session: request.appSession,
        userId: request.params.userId,
        reason: request.body.reason,
      });
      return result.ok ? result.value : sendServiceError(reply, request, result.error);
    }
  );

  app.get(
    '/log',
    { schema: { tags: ['admin'], response: { 200: ModerationLogSchema, ...errors } } },
    async (request, reply) => {
      const result = await createModerationService(request.log).listLog({ session: request.appSession });
      return result.ok ? result.value : sendServiceError(reply, request, result.error);
    }
  );
  app.get(
    '/reports',
    { schema: { tags: ['admin'], response: { 200: AdminReportGroupsSchema, ...errors } } },
    async (request, reply) => {
      const result = await createModerationService(request.log).listOpen({ session: request.appSession });
      return result.ok ? result.value : sendServiceError(reply, request, result.error);
    }
  );
  app.post(
    '/reports/:id/dismiss',
    {
      schema: {
        tags: ['admin'],
        params: ReportIdParamsSchema,
        body: DecisionBodySchema,
        response: { 200: DismissedSchema, ...errors },
      },
    },
    async (request, reply) => {
      const result = await createModerationService(request.log).dismiss({
        session: request.appSession,
        id: request.params.id,
        reason: request.body.reason,
      });
      return result.ok ? result.value : sendServiceError(reply, request, result.error);
    }
  );
  app.post(
    '/reports/:id/take-down',
    {
      schema: {
        tags: ['admin'],
        params: ReportIdParamsSchema,
        body: MeasureBodySchema,
        response: { 200: TakenDownSchema, ...errors },
      },
    },
    async (request, reply) => {
      const result = await createModerationService(request.log).takeDown({
        session: request.appSession,
        id: request.params.id,
        reason: request.body.reason,
        ground: request.body.ground,
      });
      return result.ok ? result.value : sendServiceError(reply, request, result.error);
    }
  );
  app.post(
    '/reports/:id/remove-content',
    {
      schema: {
        tags: ['admin'],
        params: ReportIdParamsSchema,
        body: MeasureBodySchema,
        response: { 200: ContentRemovedSchema, ...errors },
      },
    },
    async (request, reply) => {
      const result = await createModerationService(request.log).removeContent({
        session: request.appSession,
        id: request.params.id,
        reason: request.body.reason,
        ground: request.body.ground,
      });
      return result.ok ? result.value : sendServiceError(reply, request, result.error);
    }
  );
  app.post(
    '/reports/:id/restore',
    {
      schema: {
        tags: ['admin'],
        params: ReportIdParamsSchema,
        body: DecisionBodySchema,
        response: { 200: RestoredSchema, ...errors },
      },
    },
    async (request, reply) => {
      const result = await createModerationService(request.log).restore({
        session: request.appSession,
        id: request.params.id,
        reason: request.body.reason,
      });
      return result.ok ? result.value : sendServiceError(reply, request, result.error);
    }
  );
};
export default admin;
