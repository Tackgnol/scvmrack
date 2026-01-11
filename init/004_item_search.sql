-- Migration: Equipment search with multi-language text search
-- Enables pg_trgm for fuzzy matching and creates search function

-- 1. Enable trigram extension for fuzzy search (if not exists)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Add indexes for faster text search
CREATE INDEX IF NOT EXISTS idx_equipment_key_trgm ON equipment USING gin (key gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_translations_value_trgm ON translations USING gin (value gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_translations_key_prefix ON translations (key text_pattern_ops);

-- 3. Drop existing functions if they exist
DROP FUNCTION IF EXISTS search_equipment(TEXT, VARCHAR, INTEGER, TEXT[]);
DROP FUNCTION IF EXISTS get_all_equipment(VARCHAR, TEXT[], INTEGER, INTEGER);

-- 4. Create search function that searches across all translations
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
LANGUAGE plpgsql STABLE
AS $$
BEGIN
RETURN QUERY
    WITH search_results AS (
        -- Search in equipment keys
        SELECT DISTINCT
            e.key,
            e.tags,
            GREATEST(
                similarity(e.key::TEXT, p_query),
                COALESCE(similarity(t_name.value, p_query), 0),
                COALESCE(similarity(t_name_any.value, p_query), 0)
            ) AS relevance
        FROM equipment e
        -- Translation in requested locale
        LEFT JOIN translations t_name
            ON t_name.key = e.key
            AND t_name.locale = p_locale
        -- Translation in any locale (for cross-language search)
        LEFT JOIN translations t_name_any
            ON t_name_any.key = e.key
        WHERE
            -- Filter by tags if provided
            (p_tags IS NULL OR e.tags && p_tags)
            AND (
                -- Match against key
                e.key ILIKE '%' || p_query || '%'
                OR e.key::TEXT % p_query  -- Trigram similarity
                -- Match against translation in requested locale
                OR t_name.value ILIKE '%' || p_query || '%'
                OR t_name.value % p_query
                -- Match against any translation (cross-language)
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
         -- Get localized name
         LEFT JOIN translations t_loc
                   ON t_loc.key = sr.key
                       AND t_loc.locale = p_locale
    -- Get localized description
         LEFT JOIN translations t_desc
                   ON t_desc.key = sr.key || '.description'
                       AND t_desc.locale = p_locale
ORDER BY sr.relevance DESC, sr.key
    LIMIT p_limit;
END;
$$;

-- 5. Create function to get all equipment (for initial load or browsing)
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
LANGUAGE plpgsql STABLE
AS $$
BEGIN
RETURN QUERY
SELECT
    e.key,
    COALESCE(t_name.value, e.key::TEXT) AS name,
    COALESCE(t_desc.value, '') AS description,
    e.tags
FROM equipment e
         LEFT JOIN translations t_name
                   ON t_name.key = e.key
                       AND t_name.locale = p_locale
         LEFT JOIN translations t_desc
                   ON t_desc.key = e.key || '.description'
                       AND t_desc.locale = p_locale
WHERE
    p_tags IS NULL OR e.tags && p_tags
ORDER BY e.key
    LIMIT p_limit
OFFSET p_offset;
END;
$$;
