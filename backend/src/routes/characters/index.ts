import {FastifyPluginAsync, type FastifyRequest} from 'fastify';
import {
    CharacterIdParamsSchema,
    CharacterSchema,
    ErrorSchema,
    GenerateBodySchema,
    LocaleQuerySchema,
    UpdateBodySchema,
} from '../../schemas/character.js';
import prisma from '../../lib/prisma.js';
import { Prisma } from '@prisma/client';
import type {CharacterUpdate, GenerateCharacterParams,} from '../../types/character.js';
import {isValidLocale, isValidUUID, rollToModifier, sanitizeCharacterUpdate,} from '../../utils.js';
import { getCharacterFull } from '../../lib/get-character-full.js';
import { generateCharacter } from '../../lib/generate-character.js';
import { hydrateInventoryUses } from '../../lib/inventory.js';
import {
    apiError,
    badRequest,
    normalizeKnownApiError,
    notFound,
    sendApiError,
    unauthorized,
    type ApiHttpError,
} from '../../errors.js';
import { Roller, OSRandomEngine  } from '@tackgnol/rpg-tools-roller';

// ============================================
// Route-local types
// ============================================

// ============================================
// Helper: Check character access
// ============================================
type AuthSession = FastifyRequest['appSession'];
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

// Phase 4+5: both getCharacterFull and generateCharacter are pure TypeScript — no raw SQL.

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
                const roller = new Roller({ engine: new OSRandomEngine() });
                const characterId = await generateCharacter(classId ?? null, roller);

                // Bind character to user
                await prisma.character.update({
                    where: {id: characterId},
                    data: {userId},
                });

                const character = await getCharacterFull(characterId, locale);
                if (!character) {
                    throw apiError(
                        500,
                        'CHARACTER_GENERATION_FETCH_FAILED',
                        'Failed to fetch generated character'
                    );
                }

                return reply.status(201).send(character);
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
                const character = await getCharacterFull(id, locale);
                if (!character) {
                    return sendApiError(
                        reply,
                        request,
                        notFound('CHARACTER_NOT_FOUND', 'Character not found')
                    );
                }

                return character;
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
                // Hydrate inventory uses for equipment and storage if present
                if (Array.isArray(updates['equipment']) || Array.isArray(updates['storage'])) {
                    const roller = new Roller({ engine: new OSRandomEngine() });

                    // Determine presence: use patch value if present, otherwise fetch from DB
                    let presence: number;
                    if (typeof updates['presence'] === 'number') {
                        presence = updates['presence'];
                    } else {
                        const char = await prisma.character.findUnique({
                            where: { id },
                            select: { presence: true },
                        });
                        presence = char?.presence ?? 10;
                    }

                    if (Array.isArray(updates['equipment'])) {
                        updates['equipment'] = await hydrateInventoryUses(
                            updates['equipment'] as unknown[],
                            presence,
                            true,
                            roller
                        );
                    }

                    if (Array.isArray(updates['storage'])) {
                        updates['storage'] = await hydrateInventoryUses(
                            updates['storage'] as unknown[],
                            presence,
                            false,
                            roller
                        );
                    }
                }

                await prisma.character.update({
                    where: { id },
                    data: updates as Prisma.CharacterUpdateInput,
                });

                const character = await getCharacterFull(id, locale);
                if (!character) {
                    return sendApiError(
                        reply,
                        request,
                        notFound('CHARACTER_NOT_FOUND', 'Character not found')
                    );
                }

                return character;
            } catch (err: unknown) {
                request.log.error(err, 'Failed to update character');
                if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
                    return sendApiError(reply, request, notFound('CHARACTER_NOT_FOUND', 'Character not found'));
                }
                throw knownOrUnexpected(err, 'CHARACTER_UPDATE_FAILED', 'Failed to update character');
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
                // 1. Fetch characters for this user
                const characters = await prisma.character.findMany({
                    where: { userId },
                    orderBy: { updatedAt: 'desc' },
                    select: {
                        id: true,
                        name: true,
                        classId: true,
                        currentHp: true,
                        maxHp: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                });

                // 2. Look up localized class names for classes present in this result set
                const classIds = [...new Set(
                    characters.map(c => c.classId).filter((id): id is number => id !== null)
                )];

                let classNameMap = new Map<number, string>();
                if (classIds.length > 0) {
                    const classes = await prisma.class.findMany({
                        where: { id: { in: classIds } },
                        select: { id: true, name: true, nameKey: true },
                    });

                    const nameKeys = classes.map(c => c.nameKey).filter((k): k is string => k !== null);
                    const translations = nameKeys.length > 0
                        ? await prisma.translation.findMany({
                            where: { locale, key: { in: nameKeys } },
                            select: { key: true, value: true },
                          })
                        : [];

                    const translationMap = new Map(translations.map(t => [t.key, t.value]));
                    for (const cls of classes) {
                        classNameMap.set(
                            cls.id,
                            (cls.nameKey ? translationMap.get(cls.nameKey) : null) ?? cls.name
                        );
                    }
                }

                // 3. Merge
                const rows: CharacterListRow[] = characters.map(c => ({
                    id: c.id,
                    name: c.name,
                    classId: c.classId,
                    className: c.classId !== null ? (classNameMap.get(c.classId) ?? null) : null,
                    currentHp: c.currentHp,
                    maxHp: c.maxHp,
                    createdAt: c.createdAt,
                    updatedAt: c.updatedAt,
                }));
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
