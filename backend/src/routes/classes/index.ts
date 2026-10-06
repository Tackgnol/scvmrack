import type { FastifyPluginAsync } from 'fastify';
import type { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import type { ClassDraft } from '../../lib/class-draft.js';
import {
  ClassDraftBodySchema,
  ClassDraftListSchema,
  ClassIdParamsSchema,
  ClassLocaleQuerySchema,
  ClassWithDraftSchema,
  DraftCreateBodySchema,
  DraftIdParamsSchema,
  DraftUpdateBodySchema,
  ErrorSchema,
  OwnClassListSchema,
  StoredClassDraftSchema,
  TestRollBodySchema,
  TestRollResponseSchema,
} from '../../schemas/custom-class.js';
import { sendServiceError } from '../../errors.js';
import { createCustomClassService } from '../../services/custom-class-service.js';

const saveLimit = {
  rateLimit: { max: process.env.NODE_ENV === 'test' ? 10000 : 10, timeWindow: '1 minute' },
};

const draftSaveLimit = {
  rateLimit: { max: process.env.NODE_ENV === 'test' ? 10000 : 120, timeWindow: '1 minute' },
};

const classes: FastifyPluginAsync = async (fastify): Promise<void> => {
  const app = fastify.withTypeProvider<JsonSchemaToTsProvider>();
  const service = (request: { log: Parameters<typeof createCustomClassService>[0] }) =>
    createCustomClassService(request.log);

  // GET /api/classes/mine - the GM's own Custom Classes, newest first
  app.get(
    '/mine',
    {
      schema: {
        description: "The signed-in GM's Custom Classes at their latest version",
        tags: ['classes'],
        querystring: ClassLocaleQuerySchema,
        response: { 200: OwnClassListSchema, 401: ErrorSchema, 500: ErrorSchema },
      },
    },
    async (request, reply) => {
      const result = await service(request).listMine({
        session: request.appSession,
        locale: request.query.locale ?? 'en',
      });
      if (!result.ok) return sendServiceError(reply, request, result.error);
      return result.value;
    }
  );

  // GET /api/classes/drafts - private, unfinished creator work
  app.get(
    '/drafts',
    {
      schema: {
        description: "The signed-in GM's unfinished Custom Class drafts",
        tags: ['classes'],
        response: { 200: ClassDraftListSchema, 401: ErrorSchema, 500: ErrorSchema },
      },
    },
    async (request, reply) => {
      const result = await service(request).listDrafts({ session: request.appSession });
      if (!result.ok) return sendServiceError(reply, request, result.error);
      return reply.send(result.value as never);
    }
  );

  // POST /api/classes/drafts - persist unfinished work without validating it as a class
  app.post(
    '/drafts',
    {
      config: draftSaveLimit,
      schema: {
        description: 'Create an unfinished private Custom Class draft',
        tags: ['classes'],
        body: DraftCreateBodySchema,
        response: {
          201: StoredClassDraftSchema,
          400: ErrorSchema,
          401: ErrorSchema,
          404: ErrorSchema,
          409: ErrorSchema,
          429: ErrorSchema,
          500: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await service(request).saveDraft({
        session: request.appSession,
        classId: request.body.classId ?? null,
        draft: request.body.draft as ClassDraft,
      });
      if (!result.ok) return sendServiceError(reply, request, result.error);
      return reply.code(201).send(result.value as never);
    }
  );

  // GET /api/classes/drafts/:draftId - load one private draft
  app.get(
    '/drafts/:draftId',
    {
      schema: {
        description: 'Load one unfinished private Custom Class draft',
        tags: ['classes'],
        params: DraftIdParamsSchema,
        response: { 200: StoredClassDraftSchema, 400: ErrorSchema, 401: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema },
      },
    },
    async (request, reply) => {
      const result = await service(request).getDraft({ session: request.appSession, id: request.params.draftId });
      if (!result.ok) return sendServiceError(reply, request, result.error);
      return reply.send(result.value as never);
    }
  );

  // PUT /api/classes/drafts/:draftId - revision-checked autosave
  app.put(
    '/drafts/:draftId',
    {
      config: draftSaveLimit,
      schema: {
        description: 'Update an unfinished private Custom Class draft',
        tags: ['classes'],
        params: DraftIdParamsSchema,
        body: DraftUpdateBodySchema,
        response: {
          200: StoredClassDraftSchema,
          400: ErrorSchema,
          401: ErrorSchema,
          404: ErrorSchema,
          409: ErrorSchema,
          429: ErrorSchema,
          500: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await service(request).saveDraft({
        session: request.appSession,
        id: request.params.draftId,
        classId: null,
        draft: request.body.draft as ClassDraft,
        revision: request.body.revision,
        force: request.body.force,
      });
      if (!result.ok) return sendServiceError(reply, request, result.error);
      return reply.send(result.value as never);
    }
  );

  // DELETE /api/classes/drafts/:draftId - discard unfinished private work
  app.delete(
    '/drafts/:draftId',
    {
      schema: {
        description: 'Discard one unfinished private Custom Class draft',
        tags: ['classes'],
        params: DraftIdParamsSchema,
        response: { 204: { type: 'null' }, 400: ErrorSchema, 401: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema },
      },
    },
    async (request, reply) => {
      const result = await service(request).deleteDraft({ session: request.appSession, id: request.params.draftId });
      if (!result.ok) return sendServiceError(reply, request, result.error);
      return reply.code(204).send(null);
    }
  );
  // POST /api/classes - save a new Custom Class
  app.post(
    '/',
    {
      config: saveLimit,
      schema: {
        description: 'Save a new Custom Class from the creator',
        tags: ['classes'],
        body: ClassDraftBodySchema,
        response: {
          201: ClassWithDraftSchema,
          400: ErrorSchema,
          401: ErrorSchema,
          409: ErrorSchema,
          429: ErrorSchema,
          500: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await service(request).create({
        session: request.appSession,
        draft: request.body.draft as ClassDraft,
      });
      if (!result.ok) return sendServiceError(reply, request, result.error);
      return reply.code(201).send(result.value as never);
    }
  );

  // POST /api/classes/test-roll - roll a scvm from a draft, keeping nothing
  app.post(
    '/test-roll',
    {
      config: {
        rateLimit: { max: process.env.NODE_ENV === 'test' ? 10000 : 30, timeWindow: '1 minute' },
      },
      schema: {
        description: 'Roll a test scvm from a class draft (not persisted)',
        tags: ['classes'],
        body: TestRollBodySchema,
        querystring: ClassLocaleQuerySchema,
        response: { 200: TestRollResponseSchema, 400: ErrorSchema, 401: ErrorSchema, 429: ErrorSchema, 500: ErrorSchema },
      },
    },
    async (request, reply) => {
      const result = await service(request).testRoll({
        session: request.appSession,
        draft: request.body.draft as ClassDraft,
        language: request.body.language,
        locale: request.query.locale ?? 'en',
      });
      if (!result.ok) return sendServiceError(reply, request, result.error);
      return result.value;
    }
  );

  // GET /api/classes/:id - one of the GM's classes, as the creator edits it
  app.get(
    '/:id',
    {
      schema: {
        description: 'Load one of your Custom Classes into the creator',
        tags: ['classes'],
        params: ClassIdParamsSchema,
        response: { 200: ClassWithDraftSchema, 400: ErrorSchema, 401: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema },
      },
    },
    async (request, reply) => {
      const result = await service(request).get({ session: request.appSession, id: request.params.id });
      if (!result.ok) return sendServiceError(reply, request, result.error);
      // The stored draft passed the same schema on save; its dice are plain numbers to TypeScript.
      return reply.send(result.value as never);
    }
  );

  // PUT /api/classes/:id - save edits to one of the GM's classes
  app.put(
    '/:id',
    {
      config: saveLimit,
      schema: {
        description: 'Save edits to one of your Custom Classes',
        tags: ['classes'],
        params: ClassIdParamsSchema,
        body: ClassDraftBodySchema,
        response: {
          200: ClassWithDraftSchema,
          400: ErrorSchema,
          401: ErrorSchema,
          404: ErrorSchema,
          409: ErrorSchema,
          429: ErrorSchema,
          500: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await service(request).update({
        session: request.appSession,
        id: request.params.id,
        draft: request.body.draft as ClassDraft,
      });
      if (!result.ok) return sendServiceError(reply, request, result.error);
      return reply.send(result.value as never);
    }
  );
};

export default classes;
