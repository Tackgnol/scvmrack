import { FastifyPluginAsync } from 'fastify';
import {
    CharacterIdParamsSchema,
    CharacterSchema,
    ErrorSchema,
    GenerateBodySchema,
    LocaleQuerySchema,
    UpdateBodySchema,
} from '../../schemas/character.js';
import type {
    CharacterUpdate,
    GenerateCharacterParams,
} from '../../types/character.js';
import { sendServiceError } from '../../errors.js';
import { createCharacterService } from '../../services/character-service.js';

const characters: FastifyPluginAsync = async (fastify): Promise<void> => {
    // POST /api/characters/new - Generate new character (bound to session)
    fastify.post<{
        Body: GenerateCharacterParams;
        Querystring: { locale?: string };
    }>(
        '/new',
        {
            config: {
                rateLimit: {
                    max: process.env.NODE_ENV === 'test' ? 10000 : 5,
                    timeWindow: '1 minute',
                },
            },
            schema: {
                description: 'Generate a new random character',
                tags: ['characters'],
                querystring: LocaleQuerySchema,
                body: GenerateBodySchema,
                response: {
                    201: CharacterSchema,
                    400: ErrorSchema,
                    401: ErrorSchema,
                    429: ErrorSchema,
                    500: ErrorSchema,
                },
            },
        },
        async (request, reply) => {
            const result = await createCharacterService(request.log).generate({
                session: request.appSession,
                classId: request.body?.classId,
                locale: request.query.locale ?? 'en',
            });

            if (!result.ok) {
                return sendServiceError(reply, request, result.error);
            }
            return reply.status(201).send(result.value);
        }
    );

    // GET /count - Get total number of characters
    fastify.get(
        '/count',
        {
            schema: {
                description: 'Get total number of characters in the database',
                tags: ['characters'],
                response: {
                    200: {
                        type: 'object',
                        properties: { total: { type: 'number' } },
                        required: ['total'],
                    },
                    500: ErrorSchema,
                },
            },
        },
        async (request, reply) => {
            const result = await createCharacterService(request.log).count();
            if (!result.ok) {
                return sendServiceError(reply, request, result.error);
            }
            return result.value;
        }
    );

    // GET /:id - Get character (with access control)
    fastify.get<{
        Params: { id: string };
        Querystring: { locale?: string };
    }>(
        '/:id',
        {
            schema: {
                description: 'Get a character by ID',
                tags: ['characters'],
                params: CharacterIdParamsSchema,
                querystring: LocaleQuerySchema,
                response: {
                    200: CharacterSchema,
                    400: ErrorSchema,
                    401: ErrorSchema,
                    403: ErrorSchema,
                    404: ErrorSchema,
                    500: ErrorSchema,
                },
            },
        },
        async (request, reply) => {
            const result = await createCharacterService(request.log).getById({
                id: request.params.id,
                session: request.appSession,
                locale: request.query.locale ?? 'en',
            });

            if (!result.ok) {
                return sendServiceError(reply, request, result.error);
            }
            return result.value;
        }
    );

    // PATCH /:id - Update character (with access control)
    fastify.patch<{
        Params: { id: string };
        Body: CharacterUpdate;
        Querystring: { locale?: string };
    }>(
        '/:id',
        {
            config: {
                rateLimit: {
                    max: process.env.NODE_ENV === 'test' ? 10000 : 50,
                    timeWindow: '1 minute',
                },
            },
            schema: {
                description: 'Update a character',
                tags: ['characters'],
                params: CharacterIdParamsSchema,
                querystring: LocaleQuerySchema,
                body: UpdateBodySchema,
                response: {
                    200: CharacterSchema,
                    400: ErrorSchema,
                    401: ErrorSchema,
                    403: ErrorSchema,
                    404: ErrorSchema,
                    429: ErrorSchema,
                    500: ErrorSchema,
                },
            },
        },
        async (request, reply) => {
            const result = await createCharacterService(request.log).update({
                id: request.params.id,
                session: request.appSession,
                body: request.body as Record<string, unknown>,
                rawLocale: request.query.locale,
            });

            if (!result.ok) {
                return sendServiceError(reply, request, result.error);
            }
            return result.value;
        }
    );

    // GET / - List user's characters
    fastify.get(
        '/',
        {
            schema: {
                description: 'List characters for current user',
                tags: ['characters'],
                response: {
                    200: { type: 'array', items: CharacterSchema },
                    401: ErrorSchema,
                    500: ErrorSchema,
                },
            },
        },
        async (request, reply) => {
            const result = await createCharacterService(request.log).list({
                session: request.appSession,
                acceptLanguage: request.headers['accept-language'],
            });

            if (!result.ok) {
                return sendServiceError(reply, request, result.error);
            }
            return result.value;
        }
    );

    // DELETE /:id - Delete character (with access control)
    fastify.delete<{
        Params: { id: string };
    }>(
        '/:id',
        {
            schema: {
                description: 'Delete a character',
                tags: ['characters'],
                params: CharacterIdParamsSchema,
                response: {
                    204: { type: 'null', description: 'Character deleted' },
                    400: ErrorSchema,
                    401: ErrorSchema,
                    403: ErrorSchema,
                    404: ErrorSchema,
                    500: ErrorSchema,
                },
            },
        },
        async (request, reply) => {
            const result = await createCharacterService(request.log).remove({
                id: request.params.id,
                session: request.appSession,
            });

            if (!result.ok) {
                return sendServiceError(reply, request, result.error);
            }
            return reply.status(204).send();
        }
    );
};

export default characters;
