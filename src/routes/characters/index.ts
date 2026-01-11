import { FastifyPluginAsync } from 'fastify';
import { isValidLocale, isValidUUID, sanitizeCharacterUpdate } from "../../utils.js";
import {
    CharacterIdParamsSchema,
    CharacterSchema,
    ErrorSchema,
    GenerateBodySchema,
    LocaleQuerySchema,
    UpdateBodySchema,
} from '../../schemas/character.js';
import type { CharacterFull, CharacterUpdate, GenerateCharacterParams } from '../../types/character.js';
import { query, queryOne } from '../../services/db.js';
import type { AppSession } from '../../plugins/guestSession.js';

// ============================================
// Helper: Check character access
// ============================================
async function checkCharacterAccess(
    characterId: string,
    session: AppSession | null
): Promise<{ allowed: boolean; reason?: string }> {
    if (!session) {
        return { allowed: false, reason: 'No session' };
    }

    const character = await queryOne<{ session_id: string | null; user_id: string | null }>(
        'SELECT session_id, user_id FROM characters WHERE id = $1',
        [characterId]
    );

    if (!character) {
        return { allowed: false, reason: 'Character not found' };
    }

    // If character has a user_id, must match session's user
    if (character.user_id) {
        if (!session.userId || character.user_id !== session.userId) {
            return { allowed: false, reason: 'Access denied' };
        }
        return { allowed: true };
    }

    // Guest character - check both session.id AND guestSessionId
    // (guestSessionId preserved when user authenticates)
    const isOwner = character.session_id === session.id ||
        character.session_id === session.guestSessionId;

    if (!isOwner) {
        return { allowed: false, reason: 'Access denied' };
    }

    return { allowed: true };
}

const characters: FastifyPluginAsync = async (fastify): Promise<void> => {

    // POST /characters/new - Generate new character (bound to session)
    fastify.post<{
        Body: GenerateCharacterParams;
        Querystring: { locale?: string };
    }>('/new', {
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
    }, async (request, reply) => {
        const session = request.appSession;

        if (!session) {
            return reply.status(401).send({ error: 'Session required' });
        }

        const class_id = request.body?.class_id;
        const locale = request.query.locale ?? 'en';

        try {
            const result = await queryOne<{ generate_character: string }>(
                'SELECT generate_character($1::integer)',
                [class_id]
            );

            if (!result) {
                return reply.status(500).send({ error: 'Failed to generate character' });
            }

            const characterId = result.generate_character;

            // Bind character to session
            // Use guestSessionId if available (for guests), otherwise session.id
            const sessionIdForCharacter = session.guestSessionId || session.id;

            await query(
                `UPDATE characters 
                 SET session_id = $1, user_id = $2 
                 WHERE id = $3`,
                [sessionIdForCharacter, session.userId, characterId]
            );

            const character = await queryOne<CharacterFull>(
                'SELECT * FROM get_character_full($1, $2)',
                [characterId, locale]
            );

            return reply.status(201).send(character);
        } catch (err) {
            request.log.error(err);
            return reply.status(500).send({ error: 'Failed to generate character' });
        }
    });

    // GET /:id - Get character (with access control)
    fastify.get<{
        Params: { id: string };
        Querystring: { locale?: string };
    }>('/:id', {
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
    }, async (request, reply) => {
        const { id } = request.params;
        const locale = request.query.locale ?? 'en';
        const session = request.appSession;

        // Check access
        const access = await checkCharacterAccess(id, session);
        if (!access.allowed) {
            const status = access.reason === 'No session' ? 401
                : access.reason === 'Character not found' ? 404
                    : 403;
            return reply.status(status).send({ error: access.reason });
        }

        try {
            const character = await queryOne<CharacterFull>(
                'SELECT * FROM get_character_full($1, $2)',
                [id, locale]
            );
            console.log(character);
            if (!character) {
                return reply.status(404).send({ error: 'Character not found' });
            }

            return character;
        } catch (err) {
            request.log.error(err);
            return reply.status(500).send({ error: 'Failed to fetch character' });
        }
    });

    // PATCH /:id - Update character (with access control)
    fastify.patch<{
        Params: { id: string };
        Body: CharacterUpdate;
        Querystring: { locale?: string };
    }>('/:id', {
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
    }, async (request, reply) => {
        const { id } = request.params;
        const session = request.appSession;

        // Validate UUID
        if (!isValidUUID(id)) {
            return reply.status(400).send({ error: 'Invalid character ID' });
        }

        // Check access
        const access = await checkCharacterAccess(id, session);
        if (!access.allowed) {
            const status = access.reason === 'No session' ? 401
                : access.reason === 'Character not found' ? 404
                    : 403;
            return reply.status(status).send({ error: access.reason });
        }

        // Validate and default locale
        const locale = isValidLocale(request.query.locale) ? request.query.locale : 'en';

        // Sanitize all inputs
        const updates = sanitizeCharacterUpdate(request.body as Record<string, unknown>);

        // Fields that are JSONB and need special handling
        const jsonbFields = ['abilities', 'equipment', 'storage', 'equipped_weapons', 'equipped_armor'];

        const allowedFields = [
            'abilities',
            'name', 'current_hp', 'omens', 'silver',
            'equipment', 'storage',
            'equipped_weapons', 'equipped_armor',
            'agility', 'strength', 'presence', 'toughness',
            'trait1', 'trait2', 'habit', 'body_description', 'origin',
            'notes'
        ];

        const setClauses: string[] = [];
        const values: unknown[] = [];
        let paramIndex = 1;

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                if (jsonbFields.includes(field)) {
                    setClauses.push(`${field} = $${paramIndex}::jsonb`);
                    values.push(JSON.stringify(updates[field]));
                } else {
                    setClauses.push(`${field} = $${paramIndex}`);
                    values.push(updates[field]);
                }
                paramIndex++;
            }
        }

        if (setClauses.length === 0) {
            return reply.status(400).send({ error: 'No valid fields to update' });
        }

        setClauses.push(`updated_at = NOW()`);
        values.push(id);

        try {
            const result = await query(
                `UPDATE characters
                 SET ${setClauses.join(', ')}
                 WHERE id = $${paramIndex} RETURNING id`,
                values
            );

            if (result.length === 0) {
                return reply.status(404).send({ error: 'Character not found' });
            }

            return await queryOne<CharacterFull>(
                'SELECT * FROM get_character_full($1, $2)',
                [id, locale]
            );
        } catch (err) {
            request.log.error(err, 'Failed to update character');
            return reply.status(500).send({ error: 'Failed to update character' });
        }
    });

    // POST /:id/claim - Claim guest character (bind to authenticated user)
    fastify.post<{
        Params: { id: string };
    }>('/:id/claim', {
        schema: {
            description: 'Claim a guest character for authenticated user',
            tags: ['characters'],
            params: CharacterIdParamsSchema,
            response: {
                200: { type: 'object', properties: { success: { type: 'boolean' } } },
                400: ErrorSchema,
                401: ErrorSchema,
                403: ErrorSchema,
                404: ErrorSchema,
                500: ErrorSchema,
            },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const session = request.appSession;

        if (!session) {
            return reply.status(401).send({ error: 'Session required' });
        }

        if (!session.userId) {
            return reply.status(401).send({ error: 'Authentication required to claim character' });
        }

        try {
            const character = await queryOne<{ session_id: string | null; user_id: string | null }>(
                'SELECT session_id, user_id FROM characters WHERE id = $1',
                [id]
            );

            if (!character) {
                return reply.status(404).send({ error: 'Character not found' });
            }

            // Must be YOUR guest character
            // Check both current session ID AND original guest session ID
            const isOwner = character.session_id === session.id ||
                character.session_id === session.guestSessionId;

            if (!isOwner) {
                request.log.warn({
                    characterSessionId: character.session_id,
                    sessionId: session.id,
                    guestSessionId: session.guestSessionId
                }, 'Claim denied - session mismatch');
                return reply.status(403).send({ error: 'Not your character to claim' });
            }

            // Already claimed?
            if (character.user_id) {
                return reply.status(400).send({ error: 'Character already claimed' });
            }

            // Claim it
            await query(
                `UPDATE characters SET user_id = $1 WHERE id = $2`,
                [session.userId, id]
            );

            request.log.info({ characterId: id, userId: session.userId }, 'Character claimed');

            return reply.send({ success: true });
        } catch (err) {
            request.log.error(err);
            return reply.status(500).send({ error: 'Failed to claim character' });
        }
    });

    // GET / - List user's characters
    fastify.get('/', {
        schema: {
            description: 'List characters for current session/user',
            tags: ['characters'],
            response: {
                200: { type: 'array', items: CharacterSchema },
                401: ErrorSchema,
                500: ErrorSchema,
            },
        },
    }, async (request, reply) => {
        const session = request.appSession;

        if (!session) {
            return reply.status(401).send({ error: 'Session required' });
        }

        try {
            let characters;

            if (session.userId) {
                // Authenticated: get all owned characters
                // Also include unclaimed characters from their guest session
                characters = await query<CharacterFull>(
                    `SELECT c.* FROM characters c
                     WHERE c.user_id = $1
                        OR (c.session_id = $2 AND c.user_id IS NULL)
                     ORDER BY c.updated_at DESC`,
                    [session.userId, session.guestSessionId]
                );
            } else {
                // Guest: get characters for this session only
                characters = await query<CharacterFull>(
                    `SELECT c.* FROM characters c
                     WHERE c.session_id = $1 AND c.user_id IS NULL
                     ORDER BY c.updated_at DESC`,
                    [session.id]
                );
            }

            return characters;
        } catch (err) {
            request.log.error(err);
            return reply.status(500).send({ error: 'Failed to list characters' });
        }
    });

    // DELETE /:id - Delete character (with access control)
    fastify.delete<{
        Params: { id: string };
    }>('/:id', {
        schema: {
            description: 'Delete a character',
            tags: ['characters'],
            params: CharacterIdParamsSchema,
            response: {
                204: { type: 'null', description: 'Character deleted' },
                401: ErrorSchema,
                403: ErrorSchema,
                404: ErrorSchema,
                500: ErrorSchema,
            },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const session = request.appSession;

        // Check access
        const access = await checkCharacterAccess(id, session);
        if (!access.allowed) {
            const status = access.reason === 'No session' ? 401
                : access.reason === 'Character not found' ? 404
                    : 403;
            return reply.status(status).send({ error: access.reason });
        }

        try {
            const result = await query(
                'DELETE FROM characters WHERE id = $1 RETURNING id',
                [id]
            );

            if (result.length === 0) {
                return reply.status(404).send({ error: 'Character not found' });
            }

            return reply.status(204).send();
        } catch (err) {
            request.log.error(err);
            return reply.status(500).send({ error: 'Failed to delete character' });
        }
    });
};

export default characters;
