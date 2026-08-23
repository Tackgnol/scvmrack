# GlitchTip deployment

The backend and browser are deliberately separate monitoring surfaces:

- `GLITCHTIP_DSN` belongs to the backend GlitchTip project.
- `VITE_GLITCHTIP_DSN` belongs to the frontend GlitchTip project.
- `SENTRY_FRONTEND_PROJECT` is the frontend project slug used for source-map uploads. It must match the project behind `VITE_GLITCHTIP_DSN`, not `scvmrack_be`.

Both runtimes send `source` tags (`backend` or `frontend`), the same `SENTRY_RELEASE`, and the same `SENTRY_ENVIRONMENT`. If `SENTRY_RELEASE` is omitted, both derive `scvmrack@<package version>`. For the 0.6.0 deploy, bump both package versions as part of the release cut and set:

```text
SENTRY_RELEASE=scvmrack@0.6.0
SENTRY_ENVIRONMENT=production
```

## Frontend source maps

Production builds require these values whenever `VITE_GLITCHTIP_DSN` is set:

```text
SENTRY_URL=https://glitchtip.rpgtools.co
SENTRY_ORG=<organization slug>
SENTRY_FRONTEND_PROJECT=<frontend project slug>
SENTRY_AUTH_TOKEN=<build-only upload token>
```

The Vite plugin creates hidden source maps, uploads them with the matching release and debug IDs, and deletes them after a successful upload. The token is mounted into the Docker build as a BuildKit secret and is not copied into the nginx image.

After a monitoring-enabled `npm run build`, run `npm run check:monitoring` to verify that bundles contain the expected release and debug ID and that no `.map` files remain in the public `dist` directory. A failed upload fails the build. CI must mount the token explicitly before enabling automated upload; it is not read from the runtime image or committed configuration.

To reproduce the production frontend image locally, pass `SENTRY_AUTH_TOKEN` as a BuildKit secret:

```bash
docker build --secret id=sentry_auth_token,env=SENTRY_AUTH_TOKEN -f frontend/Dockerfile -t scvmrack-frontend .
```

## Noise policy

Expected HTTP 400/401/403/404/429 responses and navigation `AbortError`s are not errors in GlitchTip. Cloudflare Insights failures whose stack is entirely `/beacon.min.js` and known crawler dynamic-import failures are also dropped. Unexpected 5xx responses, application exceptions, and genuine network failures remain reportable. API failures use a stable `API code + operation` fingerprint instead of a minified function name.
