import {FastifyPluginAsync} from 'fastify';
import {query} from '../../services/db.js';

const equipment: FastifyPluginAsync = async (fastify) => {

    fastify.get<{
        Querystring: { q: string; locale: string; limit?: number };
    }>('/search', {
        schema: {
            description: 'Search items with fuzzy matching and locale awareness',
            tags: ['items'],
            querystring: {
                type: 'object',
                properties: {
                    q: {type: 'string'},
                    locale: {type: 'string', default: 'en'},
                    limit: {type: 'number', default: 20}
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
                    SELECT DISTINCT ON (s.item_type, s.id)
                        s.item_type,
                        s.id,
                        s.key,
                        -- Display name: Use the version in user's locale if it exists, 
                        -- otherwise use the one that matched the search.
                        COALESCE(target.name, s.name) AS name
                    FROM item_search s
                        -- Self-join to find the name in the requested locale
                        LEFT JOIN item_search target
                    ON s.id = target.id
                        AND s.item_type = target.item_type
                        AND target.locale = $2
                    WHERE (
                        s.document @@ plainto_tsquery('simple', unaccent($1))
                       OR
                        s.normalized_name % lower(unaccent($1))
                       OR
                        s.normalized_name LIKE (lower(unaccent($1)) || '%')
                        )
                    ORDER BY
                        s.item_type,
                        s.id,
                        -- Prioritize the best matches
                        ts_rank(s.document, plainto_tsquery('simple', unaccent($1))) DESC,
                        similarity(s.normalized_name, lower(unaccent($1))) DESC
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
            console.log('results', results);
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
