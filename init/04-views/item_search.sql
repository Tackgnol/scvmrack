-- Item search materialized view
-- Source: migration 012 (fuzzy_search_categories) - matches production
-- Combines all item types with bilingual category synonyms for search

DROP MATERIALIZED VIEW IF EXISTS item_search CASCADE;

CREATE MATERIALIZED VIEW item_search AS
SELECT
    item.item_type,
    item.id,
    item.key,
    t.locale,
    COALESCE(t.value, item.key) AS name,
    lower(unaccent(COALESCE(t.value, item.key))) AS normalized_name,
    -- A: Item Name, B: Category Synonyms, C: Tags
    setweight(to_tsvector('simple', unaccent(COALESCE(t.value, item.key))), 'A') ||
    setweight(to_tsvector('simple', unaccent(
        CASE
            WHEN item.item_type = 'weapon' THEN 'weapon broń uzbrojenie oręż arms armament'
            WHEN item.item_type = 'armor'  THEN 'armor armour zbroja pancerz ubiór protection shield'
            WHEN item.item_type = 'equipment' THEN 'equipment ekwipunek przedmiot tool item'
            WHEN item.item_type = 'pet' THEN 'pet zwierzak chowaniec towarzysz companion'
            ELSE ''
        END
    )), 'B') ||
    setweight(to_tsvector('simple', unaccent(COALESCE(item.tags::text, ''))), 'C') AS document
FROM (
    SELECT id, key, tags, 'armor' as item_type FROM armors
    UNION ALL
    SELECT id, key, tags, 'weapon' FROM weapons
    UNION ALL
    SELECT id, key, tags, 'equipment' FROM equipment
    UNION ALL
    SELECT id, key, tags, 'pet' FROM pets
) item
LEFT JOIN translations t ON t.key = item.key;

-- Indexes
CREATE INDEX item_search_document_idx ON item_search USING gin (document);
CREATE INDEX item_search_normalized_name_trgm_idx ON item_search USING gin (normalized_name gin_trgm_ops);
CREATE UNIQUE INDEX item_search_unique_idx ON item_search (item_type, id, locale);
