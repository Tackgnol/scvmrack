/* @name searchItems */
-- Complex CTE query with fuzzy matching using trigram similarity and full-text search
WITH ranked_matches AS (
    SELECT
        s.item_type,
        s.id,
        s.key,
        s.name,
        s.locale,
        ts_rank(s.document, plainto_tsquery('simple', unaccent(:q))) AS ts_score,
        similarity(s.normalized_name, lower(unaccent(:q))) AS sim_score
    FROM item_search s
    WHERE (
        s.document @@ plainto_tsquery('simple', unaccent(:q))
        OR s.normalized_name % lower(unaccent(:q))
        OR s.normalized_name LIKE (lower(unaccent(:q)) || '%')
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
    AND t.locale = :locale
ORDER BY b.ts_score DESC, b.sim_score DESC
LIMIT :limit;

/* @name getItemFull */
SELECT get_item_full(:itemType, :id);
