-- Equipment search and listing functions

CREATE OR REPLACE FUNCTION search_equipment(
    p_query TEXT,
    p_locale VARCHAR DEFAULT 'en',
    p_limit INTEGER DEFAULT 20,
    p_tags TEXT[] DEFAULT NULL
)
RETURNS TABLE (
    key VARCHAR(255),
    name TEXT,
    description TEXT,
    tags TEXT[],
    relevance REAL
)
LANGUAGE plpgsql STABLE AS $$
BEGIN
    RETURN QUERY
    WITH search_results AS (
        SELECT DISTINCT
            e.key,
            e.tags,
            GREATEST(
                similarity(e.key::TEXT, p_query),
                COALESCE(similarity(t_name.value, p_query), 0),
                COALESCE(similarity(t_name_any.value, p_query), 0)
            ) AS relevance
        FROM equipment e
        LEFT JOIN translations t_name ON t_name.key = e.key AND t_name.locale = p_locale
        LEFT JOIN translations t_name_any ON t_name_any.key = e.key
        WHERE
            (p_tags IS NULL OR e.tags && p_tags)
            AND (
                e.key ILIKE '%' || p_query || '%'
                OR e.key::TEXT % p_query
                OR t_name.value ILIKE '%' || p_query || '%'
                OR t_name.value % p_query
                OR t_name_any.value ILIKE '%' || p_query || '%'
                OR t_name_any.value % p_query
            )
    )
    SELECT
        sr.key,
        COALESCE(t_loc.value, sr.key::TEXT) AS name,
        COALESCE(t_desc.value, '') AS description,
        sr.tags,
        sr.relevance
    FROM search_results sr
        LEFT JOIN translations t_loc ON t_loc.key = sr.key AND t_loc.locale = p_locale
        LEFT JOIN translations t_desc ON t_desc.key = sr.key || '.description' AND t_desc.locale = p_locale
    ORDER BY sr.relevance DESC, sr.key
    LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION get_all_equipment(
    p_locale VARCHAR DEFAULT 'en',
    p_tags TEXT[] DEFAULT NULL,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    key VARCHAR(255),
    name TEXT,
    description TEXT,
    tags TEXT[]
)
LANGUAGE plpgsql STABLE AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.key,
        COALESCE(t_name.value, e.key::TEXT) AS name,
        COALESCE(t_desc.value, '') AS description,
        e.tags
    FROM equipment e
        LEFT JOIN translations t_name ON t_name.key = e.key AND t_name.locale = p_locale
        LEFT JOIN translations t_desc ON t_desc.key = e.key || '.description' AND t_desc.locale = p_locale
    WHERE p_tags IS NULL OR e.tags && p_tags
    ORDER BY e.key
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;
