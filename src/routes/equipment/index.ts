import {FastifyPluginAsync} from 'fastify';
import {query} from '../../services/db.js';

const equipment: FastifyPluginAsync = async (fastify) => {

    fastify.get<{
        Querystring: { q: string; locale: string; limit?: number };
    }>('/search', {
        config: {
            rateLimit: {
                max: process.env.NODE_ENV === 'test' ? 10000 : 30,
                timeWindow: '1 minute',
            },
        },
        schema: {
            description: 'Search items with fuzzy matching and locale awareness',
            tags: ['items'],
            querystring: {
                type: 'object',
                properties: {
                    q: {type: 'string', maxLength: 100},
                    locale: {type: 'string', default: 'en'},
                    limit: {type: 'number', default: 20, minimum: 1, maximum: 100}
                }
            },
            response: {
                200: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            item_type: {type: 'string'},
                            id: {type: 'number'},
                            key: {type: 'string'},
                            name: {type: 'string'}
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        const {q, locale, limit = 20} = request.query;

        if (!q || q.trim().length === 0) return [];

        try {
            return await query<{
                item_type: string;
                id: number;
                key: string;
                name: string;
            }>(
                `
                    WITH ranked_matches AS (
                        SELECT
                            s.item_type,
                            s.id,
                            s.key,
                            s.name,
                            s.locale,
                            ts_rank(s.document, plainto_tsquery('simple', unaccent($1))) AS ts_score,
                            similarity(s.normalized_name, lower(unaccent($1))) AS sim_score
                        FROM item_search s
                        WHERE (
                                  s.document @@ plainto_tsquery('simple', unaccent($1))
                                  OR s.normalized_name % lower(unaccent($1))
                                  OR s.normalized_name LIKE (lower(unaccent($1)) || '%')
                                  )
                    ),
                         best_matches AS (
                             SELECT DISTINCT ON (item_type, id)
                        item_type,
                        id,
                        key,
                        ts_score,
                        sim_score
                    FROM ranked_matches
                    ORDER BY item_type, id, ts_score DESC, sim_score DESC
                        )
                    SELECT
                        b.item_type,
                        b.id,
                        b.key,
                        COALESCE(t.name, b.key) AS name
                    FROM best_matches b
                             LEFT JOIN item_search t
                                       ON t.id = b.id
                                           AND t.item_type = b.item_type
                                           AND t.locale = $2
                    ORDER BY b.ts_score DESC, b.sim_score DESC
                        LIMIT $3
                `,
                [q, locale, limit]
            );

        } catch (err) {
            request.log.error(err, 'Search failed');
            return reply.status(500).send({error: 'Search failed'});
        }
    });


    fastify.get<{
        Params: {
            itemType: string;
            id: number;
        };
    }>('/:itemType/:id', {
        schema: {
            description: 'Fetch full item by type and id',
            tags: ['items'],
        }
    }, async (request, reply) => {
        const {itemType, id} = request.params;

        try {
            const results = await query<{ get_item_full: any }>(
                'SELECT get_item_full($1, $2)',
                [itemType, id]
            );
            if (results.length === 0 || results[0].get_item_full == null) {
                return reply.status(404).send({error: 'Item not found'});
            }

            return results[0].get_item_full;
        } catch (err) {
            request.log.error(err, 'Item fetch failed');
            return reply.status(500).send({error: 'Failed to fetch item'});
        }
    });

};

export default equipment;
