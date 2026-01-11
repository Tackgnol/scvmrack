BEGIN;

-- 1. Install the extension for stripping accents
CREATE EXTENSION IF NOT EXISTS unaccent;

DROP MATERIALIZED VIEW IF EXISTS item_search CASCADE;

CREATE MATERIALIZED VIEW item_search AS
SELECT
    'armor'::text AS item_type,
    a.id,
    a.key,
    t.locale,
    COALESCE(t.value, a.key) AS name,
    -- New Column: Normalized Name (Lowercased & Unaccented) for Fuzzy Matching
    lower(unaccent(COALESCE(t.value, a.key))) AS normalized_name,
    -- Updated Document: Build vector from unaccented text so "woz" matches "wóz" in FTS
    setweight(to_tsvector('simple', unaccent(COALESCE(t.value, a.key))), 'A') ||
    setweight(to_tsvector('simple', unaccent(COALESCE((a.tags)::text, ''))), 'B') AS document
FROM armors a
         LEFT JOIN translations t ON t.key = a.key

UNION ALL

SELECT
    'weapon'::text AS item_type,
    w.id,
    w.key,
    t.locale,
    COALESCE(t.value, w.key) AS name,
    lower(unaccent(COALESCE(t.value, w.key))) AS normalized_name,
    setweight(to_tsvector('simple', unaccent(COALESCE(t.value, w.key))), 'A') ||
    setweight(to_tsvector('simple', unaccent(COALESCE((w.tags)::text, ''))), 'B') ||
    setweight(to_tsvector('simple', unaccent(COALESCE((w.effect)::text, ''))), 'C') AS document
FROM weapons w
         LEFT JOIN translations t ON t.key = w.key

UNION ALL

SELECT
    'equipment'::text AS item_type,
    e.id,
    e.key,
    t.locale,
    COALESCE(t.value, e.key) AS name,
    lower(unaccent(COALESCE(t.value, e.key))) AS normalized_name,
    setweight(to_tsvector('simple', unaccent(COALESCE(t.value, e.key))), 'A') ||
    setweight(to_tsvector('simple', unaccent(COALESCE((e.tags)::text, ''))), 'B') ||
    setweight(to_tsvector('simple', unaccent(COALESCE((e.use_effect)::text, ''))), 'C') AS document
FROM equipment e
         LEFT JOIN translations t ON t.key = e.key

UNION ALL

SELECT
    'pet'::text AS item_type,
    p.id,
    p.key,
    t.locale,
    COALESCE(t.value, p.key) AS name,
    lower(unaccent(COALESCE(t.value, p.key))) AS normalized_name,
    setweight(to_tsvector('simple', unaccent(COALESCE(t.value, p.key))), 'A') ||
    setweight(to_tsvector('simple', unaccent(COALESCE((p.tags)::text, ''))), 'B') ||
    setweight(to_tsvector('simple', unaccent(COALESCE((p.buff)::text, ''))), 'C') AS document
FROM pets p
         LEFT JOIN translations t ON t.key = p.key;

-- Indexes
CREATE INDEX item_search_document_idx ON item_search USING gin (document);
-- Important: Index the normalized name for fast fuzzy search
CREATE INDEX item_search_normalized_name_trgm_idx ON item_search USING gin (normalized_name gin_trgm_ops);
CREATE INDEX item_search_locale_idx ON item_search (locale);
CREATE UNIQUE INDEX item_search_unique_idx ON item_search (item_type, id, locale);

COMMIT;
