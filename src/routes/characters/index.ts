import {FastifyPluginAsync} from 'fastify';
import type {AppSession} from '../../plugins/sessionResolver.js';
import {
    bindCharacterToUser,
    checkCharacterAccess as checkCharacterAccessQuery,
    checkUserIsAnonymous,
    claimCharacterFromAnonymous,
    deleteCharacter,
    generateCharacter,
    getCharacterFull,
    listUserCharacters,
    updateCharacter
} from '../../queries/characters.queries.js';
import {
    CharacterIdParamsSchema,
    CharacterPatch,
    CharacterSchema,
    ErrorSchema,
    GenerateBodySchema,
    LocaleQuerySchema,
    UpdateBodySchema,
} from '../../schemas/character.js';
import db from '../../services/db.js';
import type {CharacterUpdate, GenerateCharacterParams,} from '../../types/character.js';
import {isValidLocale, isValidUUID, sanitizeCharacterUpdate,} from '../../utils.js';

W// ============================================
// Helper: Check character access
// ============================================
async function checkCharacterAccess(
    characterId: string,
    session: AppSession | null
): Promise<{ allowed: boolean; reason?: string }> {
    if (!session) {
        return {allowed: false, reason: 'No session'};
    }

    const [character] = await checkCharacterAccessQuery.run({id: characterId}, db);

    if (!character) {
        return {allowed: false, reason: 'Character not found'};
    }

    if (character.userId !== session.userId) {
        return {allowed: false, reason: 'Access denied'};
    }

    return {allowed: true};
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

const characters: FastifyPluginAsync = async (fastify): Promise<void> => {
    // POST /characters/new - Generate new character (bound to session)
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
                    401: ErrorSchema,
                    500: ErrorSchema,
                },
            },
        },
        async (request, reply) => {
            const session = request.appSession;

            if (!session) {
                return reply.status(401).send({error: 'Session required'});
            }

            const class_id = request.body?.class_id;
            const locale = request.query.locale ?? 'en';

            try {
                const [result] = await generateCharacter.run(
                    {classId: class_id ?? null},
                    db
                );

                if (!result) {
                    return reply
                        .status(500)
                        .send({error: 'Failed to generate character'});
                }

                const characterId = result.generateCharacter;

                // Bind character to user
                await bindCharacterToUser.run({userId: session.userId, id: characterId!}, db);

                const [character] = await getCharacterFull.run({id: characterId!, locale}, db);

                return reply.status(201).send(character);
            } catch (err) {
                request.log.error(err);
                return reply
                    .status(500)
                    .send({error: 'Failed to generate character'});
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
                return reply.status(400).send({error: 'Invalid character ID'});
            }

            // Check access
            const access = await checkCharacterAccess(id, session);
            if (!access.allowed) {
                const status =
                    access.reason === 'No session'
                        ? 401
                        : access.reason === 'Character not found'
                            ? 404
                            : 403;
                return reply.status(status).send({error: access.reason});
            }

            try {
                const [character] = await getCharacterFull.run({id, locale}, db);
                if (!character) {
                    return reply.status(404).send({error: 'Character not found'});
                }

                return character;
            } catch (err) {
                request.log.error(err);
                return reply.status(500).send({error: 'Failed to fetch character'});
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
                    500: ErrorSchema,
                },
            },
        },
        async (request, reply) => {
            const {id} = request.params;
            const session = request.appSession;

            // Validate UUID
            if (!isValidUUID(id)) {
                return reply.status(400).send({error: 'Invalid character ID'});
            }

            // Check access
            const access = await checkCharacterAccess(id, session);
            if (!access.allowed) {
                const status =
                    access.reason === 'No session'
                        ? 401
                        : access.reason === 'Character not found'
                            ? 404
                            : 403;
                return reply.status(status).send({error: access.reason});
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
                return reply.status(400).send({error: 'No valid fields to update'});
            }

            try {
                await updateCharacter.run({id, patch: updates as CharacterPatch}, db);

                const [character] = await getCharacterFull.run({id, locale}, db);
                return character;
            } catch (err: unknown) {
                if (err instanceof Error && err.message.includes('Character not found')) {
                    return reply.status(404).send({error: 'Character not found'});
                }
                request.log.error(err, 'Failed to update character');
                return reply.status(500).send({error: 'Failed to update character'});
            }
        }
    );

    // POST /:id/claim - Claim guest character (bind to authenticated user)
    fastify.post<{
        Params: { id: string };
    }>(
        '/:id/claim',
        {
            schema: {
                description: 'Claim a guest character for authenticated user',
                tags: ['characters'],
                params: CharacterIdParamsSchema,
                response: {
                    200: {type: 'object', properties: {success: {type: 'boolean'}}},
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
                return reply.status(400).send({error: 'Invalid character ID'});
            }

            if (!session) {
                return reply.status(401).send({error: 'Session required'});
            }

            // Claiming requires an authenticated (non-guest) session.
            if (session.isGuest) {
                return reply
                    .status(403)
                    .send({error: 'Must be authenticated to claim characters'});
            }

            try {
                const [character] = await checkCharacterAccessQuery.run({id}, db);

                if (!character) {
                    return reply.status(404).send({error: 'Character not found'});
                }

                // Already owned by this user — idempotent success.
                if (character.userId === session.userId) {
                    return reply.send({success: true});
                }

                // Only allow claiming characters owned by anonymous users.
                // This prevents stealing characters from other authenticated users.
                if (!character.userId) {
                    return reply
                        .status(403)
                        .send({error: 'Not your character to claim'});
                }

                const [owner] = await checkUserIsAnonymous.run({id: character.userId!}, db);

                if (!owner?.isAnonymous) {
                    return reply
                        .status(403)
                        .send({error: 'Not your character to claim'});
                }

                // Atomically reassign from anonymous owner to authenticated user.
                const claimed = await claimCharacterFromAnonymous.run(
                    {userId: session.userId, characterId: id, guestId: character.userId!},
                    db
                );

                if (claimed.length > 0) {
                    request.log.info(
                        {characterId: id, userId: session.userId},
                        'Character claimed'
                    );
                    return reply.send({success: true});
                }

                return reply.status(403).send({error: 'Not your character to claim'});
            } catch (err) {
                request.log.error(err);
                return reply.status(500).send({error: 'Failed to claim character'});
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

            if (!session) {
                return reply.status(401).send({error: 'Session required'});
            }

            try {
                const rows = await listUserCharacters.run({userId: session.userId, locale}, db);
                return rows.map((r) => ({
                    id: r.id,
                    name: r.name,
                    class_id: r.classId,
                    class_name: r.className,
                    current_hp: r.currentHp,
                    max_hp: r.maxHp,
                    created_at: r.createdAt,
                    updated_at: r.updatedAt,
                }));
            } catch (err) {
                request.log.error(err);
                return reply.status(500).send({error: 'Failed to list characters'});
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
                return reply.status(400).send({error: 'Invalid character ID'});
            }

            // Check access
            const access = await checkCharacterAccess(id, session);
            if (!access.allowed) {
                const status =
                    access.reason === 'No session'
                        ? 401
                        : access.reason === 'Character not found'
                            ? 404
                            : 403;
                return reply.status(status).send({error: access.reason});
            }

            try {
                const result = await deleteCharacter.run({id}, db);

                if (result.length === 0) {
                    return reply.status(404).send({error: 'Character not found'});
                }

                return reply.status(204).send();
            } catch (err) {
                request.log.error(err);
                return reply.status(500).send({error: 'Failed to delete character'});
            }
        }
    );
};

export default characters;
