import {FastifyPluginAsync, type FastifyRequest} from 'fastify';
import {
    CharacterIdParamsSchema,
    CharacterPatch,
    CharacterSchema,
    ErrorSchema,
    GenerateBodySchema,
    LocaleQuerySchema,
    UpdateBodySchema,
} from '../../schemas/character.js';
import prisma from '../../lib/prisma.js';
import type {CharacterUpdate, GenerateCharacterParams,} from '../../types/character.js';
import {camelCaseJsonbFields, isValidLocale, isValidUUID, sanitizeCharacterUpdate, toDbPatch,} from '../../utils.js';
import {
    apiError,
    badRequest,
    normalizeKnownApiError,
    notFound,
    sendApiError,
    unauthorized,
    type ApiHttpError,
} from '../../errors.js';

// ============================================
// Helper: Check character access
// ============================================
type AuthSession = FastifyRequest['appSession'];
type GeneratedCharacterRow = { generateCharacter: string | null };
type CharacterRow = Record<string, unknown>;
type CharacterListRow = {
    id: string;
    name: string;
    classId: number | null;
    className: string | null;
    currentHp: number;
    maxHp: number;
    createdAt: Date;
    updatedAt: Date;
};

function sessionUserId(session: AuthSession): string | null {
    return session?.user?.id ?? null;
}

async function checkCharacterAccess(
    characterId: string,
    session: AuthSession
): Promise<{ allowed: true } | { allowed: false; error: ApiHttpError }> {
    const userId = sessionUserId(session);
    if (!userId) {
        return {allowed: false, error: unauthorized()};
    }

    const character = await prisma.character.findUnique({
        where: {id: characterId},
        select: {userId: true},
    });

    if (!character) {
        return {allowed: false, error: notFound('CHARACTER_NOT_FOUND', 'Character not found')};
    }

    if (character.userId !== userId) {
        return {
            allowed: false,
            error: apiError(
                403,
                'CHARACTER_ACCESS_DENIED',
                "You don't have access to this scvm"
            ),
        };
    }

    return {allowed: true};
}

function knownOrUnexpected(
    error: unknown,
    code: string,
    message: string
): ApiHttpError {
    return normalizeKnownApiError(error) ?? apiError(500, code, message);
}

function characterNotFoundOrUnexpected(
    error: unknown,
    code: string,
    message: string
): ApiHttpError {
    if (error instanceof Error && error.message.includes('Character not found')) {
        return notFound('CHARACTER_NOT_FOUND', 'Character not found');
    }

    return knownOrUnexpected(error, code, message);
}

function resolveListLocale(acceptLanguage: unknown): 'en' | 'pl' {
    if (typeof acceptLanguage !== 'string' || acceptLanguage.length === 0) {
        return 'en';
    }

    const primaryTag = acceptLanguage.split(',')[0]?.trim().toLowerCase();
    if (!primaryTag) {
        return 'en';
    }

    if (primaryTag === 'pl' || primaryTag.startsWith('pl-')) {
        return 'pl';
    }

    return 'en';
}

async function getCharacterFullById(id: string, locale: string): Promise<CharacterRow | null> {
    const [character] = await prisma.$queryRaw<CharacterRow[]>`
        SELECT * FROM get_character_full(${id}::uuid, ${locale})
    `;

    return character ?? null;
}

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
            const session = request.appSession;

            const userId = sessionUserId(session);
            if (!userId) {
                return sendApiError(reply, request, unauthorized());
            }

            const classId = request.body?.classId;
            const locale = request.query.locale ?? 'en';

            try {
                const [result] = await prisma.$queryRaw<GeneratedCharacterRow[]>`
                    SELECT generate_character(${classId ?? null}::integer) AS "generateCharacter"
                `;

                if (!result) {
                    throw apiError(
                        500,
                        'CHARACTER_GENERATION_FAILED',
                        'Failed to generate character'
                    );
                }

                const characterId = result.generateCharacter;

                // Bind character to user
                await prisma.character.update({
                    where: {id: characterId!},
                    data: {userId},
                });

                const character = await getCharacterFullById(characterId!, locale);
                if (!character) {
                    throw apiError(
                        500,
                        'CHARACTER_GENERATION_FETCH_FAILED',
                        'Failed to fetch generated character'
                    );
                }

                return reply.status(201).send(camelCaseJsonbFields(character));
            } catch (err) {
                request.log.error(err);
                throw knownOrUnexpected(
                    err,
                    'CHARACTER_GENERATION_FAILED',
                    'Failed to generate character'
                );
            }
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
                        properties: {
                            total: { type: 'number' },
                        },
                        required: ['total'],
                    },
                    500: ErrorSchema,
                },
            },
        },
        async (request, reply) => {
            try {
                const total = await prisma.character.count();
                return { total };
            } catch (err) {
                request.log.error(err);
                throw knownOrUnexpected(
                    err,
                    'CHARACTER_COUNT_FAILED',
                    'Failed to count characters'
                );
            }
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
            const {id} = request.params;
            const locale = request.query.locale ?? 'en';
            const session = request.appSession;

            if (!isValidUUID(id)) {
                return sendApiError(
                    reply,
                    request,
                    badRequest('INVALID_CHARACTER_ID', 'Invalid character ID')
                );
            }

            // Check access
            const access = await checkCharacterAccess(id, session);
            if (!access.allowed) {
                return sendApiError(reply, request, access.error);
            }

            try {
                const character = await getCharacterFullById(id, locale);
                if (!character) {
                    return sendApiError(
                        reply,
                        request,
                        notFound('CHARACTER_NOT_FOUND', 'Character not found')
                    );
                }

                return camelCaseJsonbFields(character);
            } catch (err) {
                request.log.error(err);
                throw knownOrUnexpected(
                    err,
                    'CHARACTER_FETCH_FAILED',
                    'Failed to fetch character'
                );
            }
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
                    max: process.env.NODE_ENV === 'test' ? 10000 : 30,
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
            const {id} = request.params;
            const session = request.appSession;

            // Validate UUID
            if (!isValidUUID(id)) {
                return sendApiError(
                    reply,
                    request,
                    badRequest('INVALID_CHARACTER_ID', 'Invalid character ID')
                );
            }

            // Check access
            const access = await checkCharacterAccess(id, session);
            if (!access.allowed) {
                return sendApiError(reply, request, access.error);
            }

            // Validate and default locale
            const locale = isValidLocale(request.query.locale)
                ? request.query.locale
                : 'en';

            // Sanitize all inputs
            const updates = sanitizeCharacterUpdate(
                request.body as Record<string, unknown>
            );

            if (Object.keys(updates).length === 0) {
                return sendApiError(
                    reply,
                    request,
                    badRequest('EMPTY_CHARACTER_UPDATE', 'No valid fields to update')
                );
            }

            try {
                await prisma.$queryRaw`
                    SELECT update_character(${id}::uuid, ${JSON.stringify(toDbPatch(updates) as CharacterPatch)}::jsonb)
                `;

                const character = await getCharacterFullById(id, locale);
                if (!character) {
                    return sendApiError(
                        reply,
                        request,
                        notFound('CHARACTER_NOT_FOUND', 'Character not found')
                    );
                }

                return camelCaseJsonbFields(character);
            } catch (err: unknown) {
                request.log.error(err, 'Failed to update character');
                throw characterNotFoundOrUnexpected(
                    err,
                    'CHARACTER_UPDATE_FAILED',
                    'Failed to update character'
                );
            }
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
                    200: {type: 'array', items: CharacterSchema},
                    401: ErrorSchema,
                    500: ErrorSchema,
                },
            },
        },
        async (request, reply) => {
            const session = request.appSession;
            const locale = resolveListLocale(request.headers['accept-language']);

            const userId = sessionUserId(session);
            if (!userId) {
                return sendApiError(reply, request, unauthorized());
            }

            try {
                const rows = await prisma.$queryRaw<CharacterListRow[]>`
                    SELECT
                        c.id,
                        c.name,
                        c.class_id AS "classId",
                        COALESCE(t_class_name.value, cl.name) AS "className",
                        c.current_hp AS "currentHp",
                        c.max_hp AS "maxHp",
                        c.created_at AS "createdAt",
                        c.updated_at AS "updatedAt"
                    FROM characters c
                    LEFT JOIN classes cl ON cl.id = c.class_id
                    LEFT JOIN translations t_class_name
                        ON t_class_name.key = cl.name_key
                        AND t_class_name.locale = ${locale}
                    WHERE c.user_id = ${userId}
                    ORDER BY c.updated_at DESC
                `;
                return rows;
            } catch (err) {
                request.log.error(err);
                throw knownOrUnexpected(
                    err,
                    'CHARACTER_LIST_FAILED',
                    'Failed to list characters'
                );
            }
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
                    204: {type: 'null', description: 'Character deleted'},
                    400: ErrorSchema,
                    401: ErrorSchema,
                    403: ErrorSchema,
                    404: ErrorSchema,
                    500: ErrorSchema,
                },
            },
        },
        async (request, reply) => {
            const {id} = request.params;
            const session = request.appSession;

            if (!isValidUUID(id)) {
                return sendApiError(
                    reply,
                    request,
                    badRequest('INVALID_CHARACTER_ID', 'Invalid character ID')
                );
            }

            // Check access
            const access = await checkCharacterAccess(id, session);
            if (!access.allowed) {
                return sendApiError(reply, request, access.error);
            }

            try {
                const result = await prisma.character.deleteMany({
                    where: {id},
                });

                if (result.count === 0) {
                    return sendApiError(
                        reply,
                        request,
                        notFound('CHARACTER_NOT_FOUND', 'Character not found')
                    );
                }

                return reply.status(204).send();
            } catch (err) {
                request.log.error(err);
                throw characterNotFoundOrUnexpected(
                    err,
                    'CHARACTER_DELETE_FAILED',
                    'Failed to delete character'
                );
            }
        }
    );
};

export default characters;
