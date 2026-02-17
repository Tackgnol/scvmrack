#!/bin/bash
set -e

DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-p1002_scmgrinder}"
DB_USER="${POSTGRES_USER:-p1002_scmgrinder}"

echo "🔄 Reapplying functions and views..."

echo "⚙️  Functions:"
for f in init/03-functions/*.sql; do
    echo "  → $(basename $f)"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$f"
done

echo "👁️  Views:"
for f in init/04-views/*.sql; do
    echo "  → $(basename $f)"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$f"
done

echo "🔄 Refreshing materialized views..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "REFRESH MATERIALIZED VIEW item_search;"

echo "✅ Done!"
