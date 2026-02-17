#!/bin/bash
set -e

DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-p1002_scmgrinder}"
DB_USER="${POSTGRES_USER:-p1002_scmgrinder}"
OUTPUT="init/05-seed/001_game_data.sql"

echo "📦 Dumping seed data..."

pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --data-only --no-owner --no-privileges \
  --table=classes --table=abilities --table=origins \
  --table=armors --table=weapons --table=equipment --table=pets \
  --table=names --table=body_descriptions --table=habits \
  --table=tales --table=traits --table=translations \
  > "$OUTPUT"

cat >> "$OUTPUT" << 'EOF'

-- Reset sequences
SELECT setval('classes_id_seq', COALESCE((SELECT MAX(id) FROM classes), 1));
SELECT setval('abilities_id_seq', COALESCE((SELECT MAX(id) FROM abilities), 1));
SELECT setval('origins_id_seq', COALESCE((SELECT MAX(id) FROM origins), 1));
SELECT setval('armors_id_seq', COALESCE((SELECT MAX(id) FROM armors), 1));
SELECT setval('weapons_id_seq', COALESCE((SELECT MAX(id) FROM weapons), 1));
SELECT setval('equipment_id_seq', COALESCE((SELECT MAX(id) FROM equipment), 1));
SELECT setval('pets_id_seq', COALESCE((SELECT MAX(id) FROM pets), 1));
SELECT setval('names_id_seq', COALESCE((SELECT MAX(id) FROM names), 1));
SELECT setval('body_descriptions_id_seq', COALESCE((SELECT MAX(id) FROM body_descriptions), 1));
SELECT setval('habits_id_seq', COALESCE((SELECT MAX(id) FROM habits), 1));
SELECT setval('tales_id_seq', COALESCE((SELECT MAX(id) FROM tales), 1));
SELECT setval('traits_id_seq', COALESCE((SELECT MAX(id) FROM traits), 1));

REFRESH MATERIALIZED VIEW item_search;
EOF

echo "✅ Written to $OUTPUT"
