# Production Release Gate

Date: 2026-06-07
Target: `https://scvmrack.rpgtools.co/`

This gate exists to make production readiness finite. It is not a promise that nothing can break; it is a repeatable decision point for whether the release is controlled enough to ship.

## Go / No-Go Rule

Ship only when all of these are true:

- The pre-deploy local gate is green, or every failure has an explicit written waiver.
- Current stop-line candidates are either fixed, accepted, or moved out of the release scope.
- The post-deploy production smoke gate passes.
- A rollback path and owner are known before deployment starts.

If a gate fails, stop and classify it. Do not keep poking production until the failure feels smaller.

## Current Stop-Line Candidates

These came from the 2026-06-07 Playwright QA pass. Most were addressed in the 2026-06-07 remediation pass (see "Resolved" rows); re-verify each against the live deploy before flipping to GO.

| Finding | Source | Release posture |
|---|---|---|
| Guest character is created before storage notice acknowledgement | `app-wide-playwright-findings.md` P1 | **Resolved (2026-06-07).** Landing pre-generation removed; `/character` auto-create is gated on storage-notice acknowledgement; an animated skeleton sheet renders until a character loads. Re-verify: a fresh context creates no character (`POST /api/characters/new`) until "Save Preferences" is clicked. |
| Profile/account center uses a different auth origin than login | `security-production-notes.md` P1 | **Open — deploy-secret fix, not code.** All source defaults are `auth.rpgtools.co`; production login still redirects to `.eu.org` because the backend `LOGTO_ENDPOINT` runner secret is `.eu.org`. Block if profile access is part of the release promise. Fix = align the `.co` runner secrets + Logto tenant (see `security-production-notes.md` P1). |
| Polish language switch does not translate visible copy | `app-wide-playwright-findings.md` P2 | **Resolved (2026-06-07) — moot.** Multi-language removed; app is English-only (`lng` locked to `en`, language flags removed). i18n machinery + `pl.json` kept as dead code. No longer a stop-line. |
| FAQ footer attribution differs from the main site | `app-wide-playwright-findings.md` P3 | **Resolved (2026-06-07).** FAQ footer now uses the Ockult Örtmästare Games / Stockholm Kartell credit matching the landing page. |
| `/health`, `/docs`, `/openapi.json`, `/test/*` route to SPA HTML with 200 status | `security-production-notes.md` P3 | **Resolved in repo (2026-06-07); pending deploy.** `frontend/nginx.conf` returns `404` for those paths. Takes effect on next frontend image deploy; re-verify post-deploy. `/api/health` is unaffected. |

## Pre-Deploy Local Gate

Run from the repository root unless noted.

Fast confidence gate:

```bash
npm --prefix backend run build:ts
npm --prefix frontend run build
npm --prefix frontend run lint
npm --prefix backend run test:unit
```

Full pre-merge gate:

```bash
npm --prefix backend run test:integration
npm --prefix backend run test:browser
npm --prefix backend run test:e2e
```

Equivalent broad gate when time allows:

```bash
npm --prefix backend run test:all
```

Static release hygiene:

- `git status --short` only shows intended changes.
- Touched files contain no real passwords, session cookies, tokens, registry credentials, or copied test-account secrets.
- `.npmrc`, `.env`, `.env.*`, and production secrets are not opened or committed.
- Release-note requirements are completed when a version changes.

Schema / data gate (when the release changes the DB):

- A DB backup or snapshot is taken before deploy, or the change is confirmed additive-only and reversible.
- Any Prisma schema / `init/` SQL change has a known forward path and a known rollback path (the deploy reapplies `init/` in order; archived PL/pgSQL in `init/_archive/` is not reapplied).
- Confirm whether the release needs a migration at all; if not, state "no schema change" in the Go/No-Go record.

## Post-Deploy Production Smoke Gate

These checks are low-impact and safe for production. They should not use `/test/*` routes.

Executable non-mutating smoke:

```bash
PROD_SMOKE_BASE_URL=https://scvmrack.rpgtools.co npm --prefix backend run test:prod-smoke
```

PowerShell equivalent:

```powershell
$env:PROD_SMOKE_BASE_URL = 'https://scvmrack.rpgtools.co'
npm --prefix backend run test:prod-smoke
Remove-Item Env:\PROD_SMOKE_BASE_URL
```

As of the 2026-06-07 remediation, the landing route `/` no longer pre-generates a guest character and `/character` auto-create is gated on storage-notice acknowledgement, so `/` is safe for the non-mutating browser smoke. A guest character is created only after the notice is acknowledged (or on the optional mutating smoke).

API smoke:

- `GET /api/health` returns JSON with `status: "ok"`.
- App/API responses include HSTS, CSP, `nosniff`, referrer policy, and frame protections.
- `GET /api/characters/count` returns public aggregate data only.
- `GET /api/equipment/search?q=sword&limit=5` returns public equipment search results only.
- `GET /api/characters/not-a-uuid` returns `400 VALIDATION_ERROR`.
- `GET /api/characters/{random-valid-uuid}` without a session returns `401 SESSION_REQUIRED`.
- `GET /api/auth/oauth2/login/logto?callbackURL=https://evil.example/after` returns `403 INVALID_CALLBACK_URL` and does not redirect externally.

Browser smoke:

- `/`, `/faq`, `/release`, and `/characters` render without unexpected API 5xx responses.
- First-run privacy/storage notice behavior matches the accepted release posture.
- FAQ bug-report path opens the feedback form.
- Mobile navigation opens and routes to FAQ after privacy acknowledgement.
- Real-account login succeeds, logout clears session, and Profile uses the accepted auth origin.
- **Auth-origin consistency:** login redirects to the canonical auth origin AND the app/API response CSP `connect-src` lists that *same* origin. (This is the check that would have caught the `.eu.org` / `.co` split.)
- First-run: a fresh context shows the storage notice and the skeleton sheet, and creates no character until the notice is acknowledged.
- `/health`, `/openapi.json`, `/docs`, and `/test/*` return `404` (not SPA HTML); `/api/health` returns JSON.
- The app is English-only (no language switcher); no Polish copy or stale `pl` state surfaces.

## Optional Mutating Smoke Gate

Only run this when explicitly allowed for the deployment. It creates and deletes disposable production data.

Executable API-level guard:

```bash
PROD_SMOKE_BASE_URL=https://scvmrack.rpgtools.co ALLOW_MUTATING_PROD_SMOKE=1 npm --prefix backend run test:prod-smoke
```

Checks:

- Create an anonymous character.
- Save a unique note.
- Fetch the character and verify the note persists.
- Delete the character with the owner session.
- Verify the deleted character is no longer accessible.

Every mutating smoke run must clean up its own character. If cleanup fails, record the character id from the test output and stop further mutating checks.

Manual browser add-on, if needed:

- Open the deleted character id and verify the app does not render private data.
- For a fresh disposable character, open print view and verify the saved note appears, then delete the character.

## Rollback Triggers

Rollback or disable the release path if any of these happen after deploy:

- Login, logout, session lookup, character create, character update, or character delete returns repeated 5xx.
- Any cross-session character read, update, or delete succeeds.
- A state-changing route accepts a missing or cross-session CSRF token.
- Character edits appear saved and then disappear after reload.
- Production responses expose stack traces, Prisma errors, SQL fragments, cookies, CSRF tokens, or env/config values.
- Security headers disappear from app/API responses.
- Error rate spikes in monitoring and the cause is not understood inside the observation window.

## Do Not Run Against Production

- Full exploit automation or pentest runners unless a production test window is explicitly approved.
- Load tests, rate-limit hammering, fuzzers, or destructive scans.
- Tests that depend on `/test/*` routes.
- Shared-account cleanup scripts.
- Any flow that uses a real user's private character data as a fixture.

## Deployment Observation Window

Use a fixed 15-minute observation window after deployment.

During the window:

- Keep app logs, auth logs, reverse-proxy logs, and error reporting open.
- Run the production smoke gate once.
- Watch for repeated 4xx/5xx clusters, auth redirects to the wrong origin, failed CSRF checks on normal user actions, and unexpected character update/delete failures.
- Decide ship/rollback at the end of the window instead of extending the window indefinitely.

## Go / No-Go Record

Copy this block into the release notes, issue, or deployment thread.

```text
Release:
Target:
Deploy owner:
Rollback owner:

Local gate:
Production smoke:
Stop-line candidates:
Accepted risks:
Rollback path checked:

Decision: GO / NO-GO
Time:
```

## Last Smoke Result

2026-06-07:

- `npm --prefix backend run test:prod-smoke` against `https://scvmrack.rpgtools.co` passed all four non-mutating checks.
- The optional mutating smoke was intentionally skipped.
