#!/bin/bash
set -e
echo "🎲 Mörk Borg database init..."
for stage in 01-extensions 02-schema 03-functions 04-views 05-seed; do
    for f in /docker-entrypoint-initdb.d/$stage/*.sql; do
        [ -f "$f" ] && echo "  → $(basename $f)" && psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$f"
    done
done

echo "🔄 Refreshing materialized views..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "REFRESH MATERIALIZED VIEW item_search;"

echo "✅ Done!"
