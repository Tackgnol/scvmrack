# Production Security QA Notes

Date: 2026-06-07
Target: `https://scvmrack.rpgtools.co/`
Method: low-impact Playwright browser/API probes plus source-guided scenario review. Shannon's full exploit runner was not used because it is mutative and its own playbook says not to target production systems.

## Scope

These notes cover production-safe checks that do not fit cleanly into product Gherkin scenarios: routing exposure, headers, auth-domain posture, CSRF, ownership isolation, and shared-auth edge cases.

The test account password is intentionally not recorded here.

## Findings

### P1 - Profile Uses A Different Auth Origin Than Login

Evidence:

- App login flow redirected to `https://auth.rpgtools.eu.org/sign-in?...`.
- After successful account login, Scvm Rack showed authenticated UI with `Profile` and `Log Out`.
- The `Profile` link opened `https://auth.rpgtools.co/sign-in?app_id=account-center`.
- The profile/account-center page asked for sign-in again instead of recognizing the active account session.

Impact:

Users can be logged into Scvm Rack but unable to open their profile/account center without a second auth flow. This also weakens QA expectations around cookie/domain posture because login and profile are split across `.eu.org` and `.co`.

Suggested fix:

Use one canonical Logto/account origin for login, profile, CSP `connect-src`, and environment defaults. The repo currently defaults `profileUrl()` to `https://auth.rpgtools.co/account/security`, while observed login used `auth.rpgtools.eu.org`.

**Root cause / status (2026-06-07):** This is a deploy-secret mismatch, not a source bug. Every source default is already `auth.rpgtools.co` (`backend/src/plugins/rpgtools-auth.ts` `LOGTO_ENDPOINT` default; `frontend/src/auth/index.ts` `profileUrl()` default; `compose.prod.yaml` requires both `LOGTO_ENDPOINT` and `VITE_LOGTO_ENDPOINT`). The CSP `connect-src` is derived by `@tackgnol/rpgtools-shared-auth` from `LOGTO_ENDPOINT`. `.eu.org` appears nowhere in source — only in this and older audit docs. The split (login → `.eu.org`, profile → `.co`) means the **backend `LOGTO_ENDPOINT` runner secret is `.eu.org` while the frontend `VITE_LOGTO_ENDPOINT` build arg is `.co`**.

**Action (owner: deploy/infra — cannot be done in-repo):** Set the Woodpecker runner secrets `LOGTO_ENDPOINT`, `LOGTO_REDIRECT_URI`, and `LOGTO_POST_LOGOUT_REDIRECT_URI` to the `.co` origin, confirm `VITE_LOGTO_ENDPOINT` is `.co`, and verify the `.co` Logto tenant has this app + redirect URIs. After redeploy, confirm login redirects to `auth.rpgtools.co` and the response CSP `connect-src` lists `https://auth.rpgtools.co`.

### P2 - Auth Branding Assets 404

Evidence:

- The Logto sign-in and profile pages logged 404s for `https://rpgtools.co/logo.png`.
- The first login page also logged 404s for `https://rpgtools.co/favi/favicon.ico`.

Impact:

Low security impact, but it damages trust on the identity surface. Broken auth-page assets are a bad first impression and can make a real login page look less legitimate.

Suggested fix:

Publish the referenced assets or update Logto branding config to stable existing asset URLs.

### P3 - Root Production Utility Paths Return SPA HTML

Evidence:

- `GET /api/health` returned JSON `{ "status": "ok", "timestamp": "..." }`.
- `GET /health` returned the frontend SPA HTML with status `200`.
- `GET /docs`, `/openapi.json`, and `/test/users` also returned SPA HTML with status `200`.
- `POST /test/characters` returned nginx `405`, not an enabled test route.

Impact:

Swagger and test routes were not exposed as backend functionality, which is good. The rough edge is that production fallback routing returns `200` HTML for utility/API-looking paths, which can confuse monitoring and automated exposure checks. `/health` is especially notable because the backend has a direct health route in source.

Suggested fix:

Decide whether public production should expose `/health`. If yes, route it to the backend. If no, make the proxy return `404` for `/health`, `/docs`, `/openapi.json`, and `/test/*` rather than SPA HTML.

**Status (2026-06-07):** Low-priority fix applied in `frontend/nginx.conf` — `/health`, `/openapi.json`, `/docs`, and `/test/*` now return `404` instead of the SPA shell. `/api/health` (the real backend health route) is unaffected. Takes effect on next frontend image deploy.

## Checks That Passed

### Security Headers

Observed on app API responses:

- `strict-transport-security: max-age=31536000; includeSubDomains`
- `content-security-policy` with `frame-ancestors 'none'`, `base-uri 'self'`, `object-src 'none'`
- `x-content-type-options: nosniff`
- `referrer-policy: no-referrer`
- `cross-origin-opener-policy: same-origin`
- `cross-origin-resource-policy: same-origin`
- `x-frame-options: SAMEORIGIN`

Note: CSP currently allows `script-src 'unsafe-inline'` and `script-src-attr 'unsafe-inline'`. That may be intentional for the current app/auth setup, but it should stay visible as a hardening tradeoff.

### Session Cookie JavaScript Visibility

After real-account login, `document.cookie` only exposed Google Analytics cookies. The Better Auth session cookie was not visible to JavaScript.

After sign-out:

- `POST /api/auth/sign-out` returned `200`.
- `GET /api/auth/get-session` returned `200` with `null` body.
- `document.cookie` still only showed analytics cookies.

### CSRF Coverage

Observed negative checks:

- `PATCH /api/characters/{ownId}` with session cookie but no CSRF token returned `403 FST_CSRF_INVALID_TOKEN`.
- `POST /api/feedback` with a valid body but no CSRF token returned `403 FST_CSRF_INVALID_TOKEN`.
- `POST /api/tunnel` with no CSRF token returned `403 FST_CSRF_INVALID_TOKEN`.
- `POST /api/claim/redeem` with no CSRF token returned `403 FST_CSRF_INVALID_TOKEN`.

### Ownership Isolation

Two fresh anonymous browser contexts were created.

- Context A created character `***REMOVED***`.
- Context B created its own character `***REMOVED***`.
- Context B `GET`, `PATCH`, and `DELETE` against context A's character all returned `403 CHARACTER_ACCESS_DENIED`.
- Both created characters were cleaned up with owner-session `DELETE`, each returning `204`.

### Open Redirect Check

`GET /api/auth/oauth2/login/logto?callbackURL=https%3A%2F%2Fevil.example%2Fafter` returned `403` with `INVALID_CALLBACK_URL`. No external redirect occurred.

### Validation/Error Shape

Observed negative checks returned stable JSON error envelopes with `error`, `message`, `code`, `statusCode`, and `requestId`:

- No-session character fetch: `401 SESSION_REQUIRED`.
- Invalid character id: `400 VALIDATION_ERROR` with field details.
- Missing equipment search query: `400 VALIDATION_ERROR` with field details.
- Cross-owner access: `403 CHARACTER_ACCESS_DENIED`.

## Follow-Up Scenario Backlog

These are high-value checks to automate or keep in the production smoke checklist.

- CSRF token binding: token from session A must not work with session B.
- CSRF method coverage: `POST /api/characters/new`, `PATCH /api/characters/{id}`, `DELETE /api/characters/{id}`, `POST /api/feedback`, `POST /api/tunnel`, and shared claim routes.
- Claim flow abuse: invalid, expired, reused, unauthenticated, and self-claim behavior.
- Feedback privacy: oversized fields, extra properties, malformed context, and response body never echoing stack traces, cookies, CSRF tokens, or raw client context.
- Tunnel guardrails with valid CSRF: empty envelope, malformed envelope header, unknown project id, wrong content type.
- Rate-limit posture: anonymous generation, feedback, equipment search, and tunnel should return consistent `429` responses without side effects.
- Public endpoint privacy: `/api/characters/count`, equipment search, and equipment detail must not reveal owner/session/auth/claim data.
- Error contract sweep: 4xx/5xx bodies must not leak Prisma messages, SQL fragments, stack traces, or env/config values.

