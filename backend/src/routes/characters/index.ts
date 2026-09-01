import type { FastifyPluginAsync } from 'fastify';
import type { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import {
    CharacterIdParamsSchema,
    CharacterSchema,
    ErrorSchema,
    GenerateBodySchema,
    LocaleQuerySchema,
    LocaleQueryNoDefaultSchema,
    UpdateBodySchema,
} from '../../schemas/character.js';
import {
    ClassListResponseSchema,
    DraftBodySchema,
    DraftResponseSchema,
    RerollBodySchema,
    RerollParamsSchema,
} from '../../schemas/draft.js';
import {
    ImprovementApplyRouteSchema,
    ImprovementPreviewRouteSchema,
    ImprovementRerollRouteSchema,
} from '../../schemas/character-improvement.js';
import type { ImprovementDraft } from '../../lib/getting-better.js';
import { sendServiceError } from '../../errors.js';
import { readObrCharacterAccessHeaders } from '../../lib/obr-character-access.js';
import { createCharacterDraftService } from '../../services/character-draft-service.js';
import {
    createCharacterImprovementService,
    type ImprovementRerollSection,
} from '../../services/character-improvement-service.js';
import { createCharacterService } from '../../services/character-service.js';

type CharacterTypeProvider = JsonSchemaToTsProvider<{
    SerializerSchemaOptions: {
        deserialize: [
            {
                pattern: { type: 'string'; format: 'date-time' };
                output: Date;
            },
        ];
    };
}>;

const characters: FastifyPluginAsync = async (fastify): Promise<void> => {
    const app = fastify.withTypeProvider<CharacterTypeProvider>();

    // POST /api/characters/new - Generate new character (bound to session)
    app.post(
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
    app.post(
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
    app.post(
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
    app.get(
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
    app.get(
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

    // GET /:id - Get character (with access control)
    app.get(
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
                obrAccess: readObrCharacterAccessHeaders(request.headers),
            });

            if (!result.ok) {
                return sendServiceError(reply, request, result.error);
            }
            return result.value;
        }
    );

    // POST /:id/improvements/preview - Get or create active Getting Better preview.
    fastify.post<{
        Params: { id: string };
    }>(
        '/:id/improvements/preview',
        {
            config: {
                rateLimit: {
                    max: process.env.NODE_ENV === 'test' ? 10000 : 30,
                    timeWindow: '1 minute',
                },
            },
            schema: ImprovementPreviewRouteSchema,
        },
        async (request, reply) => {
            const result = await createCharacterImprovementService(
                request.log,
                request.server.partyBus
            ).getOrCreatePreview({
                id: request.params.id,
                session: request.appSession,
            });

            if (!result.ok) {
                return sendServiceError(reply, request, result.error);
            }
            return result.value;
        }
    );

    // POST /:id/improvements/:improvementId/reroll/:section - Reroll preview section.
    fastify.post<{
        Params: {
            id: string;
            improvementId: string;
            section: ImprovementRerollSection;
        };
    }>(
        '/:id/improvements/:improvementId/reroll/:section',
        {
            config: {
                rateLimit: {
                    max: process.env.NODE_ENV === 'test' ? 10000 : 30,
                    timeWindow: '1 minute',
                },
            },
            schema: ImprovementRerollRouteSchema,
        },
        async (request, reply) => {
            const result = await createCharacterImprovementService(
                request.log,
                request.server.partyBus
            ).rerollSection({
                id: request.params.id,
                improvementId: request.params.improvementId,
                section: request.params.section,
                session: request.appSession,
            });

            if (!result.ok) {
                return sendServiceError(reply, request, result.error);
            }
            return result.value;
        }
    );

    // POST /:id/improvements/:improvementId/apply - Apply a Getting Better draft.
    fastify.post<{
        Params: { id: string; improvementId: string };
        Body: { draft: ImprovementDraft };
        Querystring: { locale?: string };
    }>(
        '/:id/improvements/:improvementId/apply',
        {
            config: {
                rateLimit: {
                    max: process.env.NODE_ENV === 'test' ? 10000 : 30,
                    timeWindow: '1 minute',
                },
            },
            schema: ImprovementApplyRouteSchema,
        },
        async (request, reply) => {
            const result = await createCharacterImprovementService(
                request.log,
                request.server.partyBus
            ).apply({
                id: request.params.id,
                improvementId: request.params.improvementId,
                draft: request.body.draft,
                session: request.appSession,
                rawLocale: request.query.locale,
            });

            if (!result.ok) {
                return sendServiceError(reply, request, result.error);
            }
            return result.value;
        }
    );

    // PATCH /:id - Update character (with access control)
    app.patch(
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
                body: request.body,
                rawLocale: request.query.locale,
                obrAccess: readObrCharacterAccessHeaders(request.headers),
            });

            if (!result.ok) {
                return sendServiceError(reply, request, result.error);
            }
            return result.value;
        }
    );

    // GET / - List user's characters
    app.get(
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
    app.delete(
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
            return reply.status(204).send(null);
        }
    );
};

export default characters;
