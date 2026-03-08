#!/bin/bash
# PostgreSQL docker-entrypoint-initdb.d only processes flat files, not subdirectories.
# This script is sourced by the entrypoint and handles the subdirectories in order.

for sql_dir in \
    /docker-entrypoint-initdb.d/01-extensions \
    /docker-entrypoint-initdb.d/02-schema \
    /docker-entrypoint-initdb.d/03-functions \
    /docker-entrypoint-initdb.d/04-views \
    /docker-entrypoint-initdb.d/05-seed; do
    if [ -d "$sql_dir" ]; then
        for f in "$sql_dir"/*.sql; do
            echo "==> Running $f"
            psql -v ON_ERROR_STOP=1 \
                 --username "$POSTGRES_USER" \
                 --dbname   "$POSTGRES_DB" \
                 -f "$f"
        done
    fi
done
