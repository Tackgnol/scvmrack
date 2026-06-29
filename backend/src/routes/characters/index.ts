import { FastifyPluginAsync } from 'fastify';
import {
    CardsQuerySchema,
    CharacterIdParamsSchema,
    CharacterCardSchema,
    CharacterSchema,
    ErrorSchema,
    GenerateBodySchema,
    LocaleQuerySchema,
    LocaleQueryNoDefaultSchema,
    ObrRoomBodySchema,
    UpdateBodySchema,
} from '../../schemas/character.js';
import type {
    CharacterUpdate,
    GenerateCharacterParams,
} from '../../types/character.js';
import {
    ClassListResponseSchema,
    DraftBodySchema,
    DraftResponseSchema,
    RerollBodySchema,
    RerollParamsSchema,
} from '../../schemas/draft.js';
import type {
    AbilityStat,
    CharacterDraft,
    DraftSection,
    SectionSeeds,
} from '../../lib/draft-seeds.js';
import { sendServiceError } from '../../errors.js';
import { createCharacterDraftService } from '../../services/character-draft-service.js';
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
                    max: process.env.NODE_ENV === 'test' ? 10000 : 20,
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
                    409: ErrorSchema,
                    429: ErrorSchema,
                    500: ErrorSchema,
                },
            },
        },
        async (request, reply) => {
            const result = await createCharacterService(
                request.log,
                request.server.partyBus
            ).generate({
                session: request.appSession,
                classId: request.body?.classId,
                draft: request.body?.draft ?? null,
                replace: request.body?.replace ?? false,
                locale: request.query.locale ?? 'en',
            });

            if (!result.ok) {
                return sendServiceError(reply, request, result.error);
            }
            return reply.status(201).send(result.value);
        }
    );

    // POST /draft - Start (or rehydrate) a creation-flow draft. No DB write.
    fastify.post<{
        Body: {
            classId?: number | null;
            classless?: boolean;
            seeds?: SectionSeeds;
            name?: string;
            dropLowestAbilities?: AbilityStat[];
        };
        Querystring: { locale?: string };
    }>(
        '/draft',
        {
            schema: {
                description: 'Generate a character draft preview (not persisted)',
                tags: ['characters'],
                querystring: LocaleQuerySchema,
                body: DraftBodySchema,
                response: {
                    200: DraftResponseSchema,
                    400: ErrorSchema,
                    401: ErrorSchema,
                    404: ErrorSchema,
                    429: ErrorSchema,
                    500: ErrorSchema,
                },
            },
        },
        async (request, reply) => {
            const result = await createCharacterDraftService(request.log).createDraft({
                session: request.appSession,
                classId: request.body?.classId ?? null,
                classless: request.body?.classless,
                seeds: request.body?.seeds,
                name: request.body?.name,
                dropLowestAbilities: request.body?.dropLowestAbilities,
                locale: request.query.locale ?? 'en',
            });

            if (!result.ok) {
                return sendServiceError(reply, request, result.error);
            }
            return result.value;
        }
    );

    // POST /draft/reroll/:section - Re-roll one section of a draft.
    fastify.post<{
        Params: { section: DraftSection };
        Body: { draft: CharacterDraft };
        Querystring: { locale?: string };
    }>(
        '/draft/reroll/:section',
        {
            schema: {
                description: 'Re-roll a single section of a character draft',
                tags: ['characters'],
                params: RerollParamsSchema,
                querystring: LocaleQuerySchema,
                body: RerollBodySchema,
                response: {
                    200: DraftResponseSchema,
                    400: ErrorSchema,
                    401: ErrorSchema,
                    404: ErrorSchema,
                    429: ErrorSchema,
                    500: ErrorSchema,
                },
            },
        },
        async (request, reply) => {
            const result = await createCharacterDraftService(request.log).rerollSection({
                session: request.appSession,
                draft: request.body.draft,
                section: request.params.section,
                locale: request.query.locale ?? 'en',
            });

            if (!result.ok) {
                return sendServiceError(reply, request, result.error);
            }
            return result.value;
        }
    );

    // GET /classes - Localized class list for the creation gate.
    fastify.get<{ Querystring: { locale?: string } }>(
        '/classes',
        {
            schema: {
                description: 'List character classes with localized names',
                tags: ['characters'],
                querystring: LocaleQuerySchema,
                response: {
                    200: ClassListResponseSchema,
                    500: ErrorSchema,
                },
            },
        },
        async (request, reply) => {
            const result = await createCharacterDraftService(request.log).listClasses({
                locale: request.query.locale ?? 'en',
            });

            if (!result.ok) {
                return sendServiceError(reply, request, result.error);
            }
            return result.value;
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
            const result = await createCharacterService(
                request.log,
                request.server.partyBus
            ).count();
            if (!result.ok) {
                return sendServiceError(reply, request, result.error);
            }
            return result.value;
        }
    );

    // GET /cards?ids=a,b,c&roomId=R - Compact, table-visible cards for OBR
    // roster/peek. Capability-by-pair read: no session check, but a card is only
    // returned when the (roomId, id) pair matches a recorded binding (see
    // character-service.getCards). Compact allowlisted fields only.
    fastify.get<{
        Querystring: { ids?: string; roomId?: string; locale?: string };
    }>(
        '/cards',
        {
            config: {
                rateLimit: {
                    max: process.env.NODE_ENV === 'test' ? 10000 : 30,
                    timeWindow: '1 minute',
                },
            },
            schema: {
                description: 'Compact table-visible character cards by id list',
                tags: ['characters'],
                querystring: CardsQuerySchema,
                response: {
                    200: { type: 'array', items: CharacterCardSchema },
                    400: ErrorSchema,
                    429: ErrorSchema,
                    500: ErrorSchema,
                },
            },
        },
        async (request, reply) => {
            const ids = (request.query.ids ?? '')
                .split(',')
                .map((id) => id.trim())
                .filter(Boolean);

            const result = await createCharacterService(
                request.log,
                request.server.partyBus
            ).getCards({
                ids,
                roomId: request.query.roomId ?? '',
                locale: request.query.locale ?? 'en',
            });

            if (!result.ok) {
                return sendServiceError(reply, request, result.error);
            }
            return result.value;
        }
    );

    // POST /:id/obr-room - Record which Owlbear room a scvm is bound to. Owner-
    // gated; the write half of the (roomId, id) capability gate that protects
    // GET /cards. Called by the player iframe when binding a scvm to a token.
    fastify.post<{
        Params: { id: string };
        Body: { roomId: string };
    }>(
        '/:id/obr-room',
        {
            config: {
                rateLimit: {
                    max: process.env.NODE_ENV === 'test' ? 10000 : 60,
                    timeWindow: '1 minute',
                },
            },
            schema: {
                description: 'Bind a character to an Owlbear room',
                tags: ['characters'],
                params: CharacterIdParamsSchema,
                body: ObrRoomBodySchema,
                response: {
                    204: { type: 'null', description: 'Character bound to room' },
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
            const result = await createCharacterService(
                request.log,
                request.server.partyBus
            ).bindObrRoom({
                id: request.params.id,
                session: request.appSession,
                roomId: request.body.roomId,
            });

            if (!result.ok) {
                return sendServiceError(reply, request, result.error);
            }
            return reply.status(204).send();
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
            const result = await createCharacterService(
                request.log,
                request.server.partyBus
            ).getById({
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
            const result = await createCharacterService(
                request.log,
                request.server.partyBus
            ).update({
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
    fastify.get<{
        Querystring: { locale?: string };
    }>(
        '/',
        {
            schema: {
                description: 'List characters for current user',
                tags: ['characters'],
                // No-default locale schema: the list localizes from the
                // Accept-Language header when ?locale is absent. A default would
                // force request.query.locale='en' and suppress that fallback.
                querystring: LocaleQueryNoDefaultSchema,
                response: {
                    200: { type: 'array', items: CharacterSchema },
                    401: ErrorSchema,
                    500: ErrorSchema,
                },
            },
        },
        async (request, reply) => {
            const result = await createCharacterService(
                request.log,
                request.server.partyBus
            ).list({
                session: request.appSession,
                rawLocale: request.query.locale,
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
            const result = await createCharacterService(
                request.log,
                request.server.partyBus
            ).remove({
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
