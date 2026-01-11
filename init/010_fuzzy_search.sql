BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Drop the existing standard view (Fixes the "not a materialized view" error)
DROP VIEW IF EXISTS item_search CASCADE;

-- 2. Drop materialized view just in case (e.g. if re-running a failed partial migration)
-- Note: If this fails with "is not a materialized view", you can comment this line out,
-- but running the DROP VIEW above usually clears the conflict.
DROP MATERIALIZED VIEW IF EXISTS item_search CASCADE;

-- 3. Create as Materialized View
CREATE MATERIALIZED VIEW item_search AS
SELECT
    'armor'::text AS item_type,
    a.id,
    a.key,
    t.locale,
    COALESCE(t.value, a.key) AS name,
    a.tags,
    setweight(to_tsvector('simple', COALESCE(t.value, a.key)), 'A') ||
    setweight(to_tsvector('simple', COALESCE((a.tags)::text, '')), 'B') AS document
FROM armors a
         LEFT JOIN translations t ON t.key = a.key

UNION ALL

SELECT
    'weapon'::text AS item_type,
    w.id,
    w.key,
    t.locale,
    COALESCE(t.value, w.key) AS name,
    w.tags,
    setweight(to_tsvector('simple', COALESCE(t.value, w.key)), 'A') ||
    setweight(to_tsvector('simple', COALESCE((w.tags)::text, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE((w.effect)::text, '')), 'C') AS document
FROM weapons w
         LEFT JOIN translations t ON t.key = w.key

UNION ALL

SELECT
    'equipment'::text AS item_type,
    e.id,
    e.key,
    t.locale,
    COALESCE(t.value, e.key) AS name,
    e.tags,
    setweight(to_tsvector('simple', COALESCE(t.value, e.key)), 'A') ||
    setweight(to_tsvector('simple', COALESCE((e.tags)::text, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE((e.use_effect)::text, '')), 'C') AS document
FROM equipment e
         LEFT JOIN translations t ON t.key = e.key

UNION ALL

SELECT
    'pet'::text AS item_type,
    p.id,
    p.key,
    t.locale,
    COALESCE(t.value, p.key) AS name,
    p.tags,
    setweight(to_tsvector('simple', COALESCE(t.value, p.key)), 'A') ||
    setweight(to_tsvector('simple', COALESCE((p.tags)::text, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE((p.buff)::text, '')), 'C') AS document
FROM pets p
         LEFT JOIN translations t ON t.key = p.key;

-- 4. Create Indexes (Now allowed because it is a Materialized View)
CREATE INDEX item_search_document_idx
    ON item_search
    USING gin (document);

CREATE INDEX item_search_name_trgm_idx
    ON item_search
    USING gin (name gin_trgm_ops);

CREATE INDEX item_search_locale_idx
    ON item_search (locale);

-- Unique index required for CONCURRENT refreshes
CREATE UNIQUE INDEX item_search_unique_idx
    ON item_search (item_type, id, locale);

COMMIT;
