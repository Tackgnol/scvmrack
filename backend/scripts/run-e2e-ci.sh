#!/bin/sh
set -e

e2e_slug_source="$(printenv CI_PIPELINE_NUMBER || true)"
if [ -z "$e2e_slug_source" ]; then e2e_slug_source="$(printenv CI_BUILD_NUMBER || true)"; fi
if [ -z "$e2e_slug_source" ]; then e2e_slug_source="$(printenv CI_COMMIT_SHA || true)"; fi
if [ -z "$e2e_slug_source" ]; then e2e_slug_source="$(date +%s)-$$"; fi

e2e_slug="$(printf '%s' "$e2e_slug_source" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9' '-' | sed 's/^-*//;s/-*$//;s/--*/-/g' | cut -c1-48)"
e2e_slug="${e2e_slug:-local}"

export E2E_COMPOSE_PROJECT="scvmrack-e2e-${e2e_slug}"
export E2E_API_IMAGE="scvmgrinder_be:e2e-${e2e_slug}"
export E2E_WEB_IMAGE="scvmgrinder_fe:e2e-${e2e_slug}"
export E2E_RUNNER_IMAGE="scvmgrinder_e2e:e2e-${e2e_slug}"
export CI=true

compose_e2e() {
  docker compose -p "$E2E_COMPOSE_PROJECT" -f compose.e2e.yaml "$@"
}

cleanup() {
  rm -f .npmrc backend/.npmrc
  compose_e2e down --volumes --remove-orphans --rmi all || true
}

cleanup
trap cleanup EXIT

printf '%s\n' "$NPMRC_CONTENT" > .npmrc

echo "Using e2e compose project: $E2E_COMPOSE_PROJECT"
compose_e2e build

if ! compose_e2e up -d --wait --wait-timeout 300 db mailpit api web; then
  compose_e2e logs --no-color --tail 80 || true
  exit 1
fi

compose_e2e run --rm --no-deps e2e
