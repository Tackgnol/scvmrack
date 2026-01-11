import { FastifyPluginAsync } from 'fastify';
import { queryOne, query } from '../../types/db';
import type { CharacterFull, CharacterUpdate, GenerateCharacterParams } from '../../types/character';
import {
  CharacterSchema,
  ErrorSchema,
  LocaleQuerySchema,
  CharacterIdParamsSchema,
  GenerateBodySchema,
  UpdateBodySchema,
} from '../../schemas/character';

const characters: FastifyPluginAsync = async (fastify, opts): Promise<void> => {

  // POST /characters - Generate new character
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
        500: ErrorSchema,
      },
    },
  }, async (request, reply) => {
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

      const character = await queryOne<CharacterFull>(
          'SELECT * FROM get_character_full($1, $2)',
          [result.generate_character, locale]
      );

      return reply.status(201).send(character);
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Failed to generate character' });
    }
  });

  // GET /:id
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
        404: ErrorSchema,
        500: ErrorSchema,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    const locale = request.query.locale ?? 'en';

    try {
      const character = await queryOne<CharacterFull>(
          'SELECT * FROM get_character_full($1, $2)',
          [id, locale]
      );

      if (!character) {
        return reply.status(404).send({ error: 'Character not found' });
      }

      return character;
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Failed to fetch character' });
    }
  });

  // PATCH /:id
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
        404: ErrorSchema,
        500: ErrorSchema,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    const locale = request.query.locale ?? 'en';
    const updates = request.body;

    const allowedFields: (keyof CharacterUpdate)[] = [
        'abilities',
      'name', 'current_hp', 'omens', 'silver',
      'equipment', 'equipped_weapons', 'equipped_armor',
      'agility', 'strength', 'presence', 'toughness'
    ];

    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    for (const field of allowedFields) {
      if (updates?.[field] !== undefined) {
        setClauses.push(`${field} = $${paramIndex}`);
        values.push(updates[field]);
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
          `UPDATE characters SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING id`,
          values
      );

      if (result.length === 0) {
        return reply.status(404).send({ error: 'Character not found' });
      }

      const character = await queryOne<CharacterFull>(
          'SELECT * FROM get_character_full($1, $2)',
          [id, locale]
      );

      return character;
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Failed to update character' });
    }
  });

  // DELETE /:id
  fastify.delete<{
    Params: { id: string };
  }>('/:id', {
    schema: {
      description: 'Delete a character',
      tags: ['characters'],
      params: CharacterIdParamsSchema,
      response: {
        204: { type: 'null', description: 'Character deleted' },
        404: ErrorSchema,
        500: ErrorSchema,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;

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
