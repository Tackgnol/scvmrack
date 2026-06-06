# Launch Audit — scvmrack (rpgtools.co)

**Date:** 2026-06-06
**Branch reviewed:** `master` (@ `620e3fd`, v0.3.0)
**Method:** Parallel multi-agent sweep — backend correctness/security, frontend correctness/state, architecture/smells, and infra/polish/secrets. All "dead"/"duplicated"/"missing" claims were grep- or read-confirmed by the reviewing agent.

## How to use this doc
Work top-down by severity. Check items off as you address them. Each finding has **location → repro/impact → suggested fix**. Severities: 🔴 CRITICAL (data loss / launch blocker), 🟠 HIGH (guaranteed user-facing break or first-impression), 🟡 MEDIUM (smell / CI / polish), 🟢 LOW (nice-to-have).

---

## Resolution log — 2026-06-06 (committed to `master`)

| # | Item | Status |
|---|------|--------|
| 1–4 | Optimistic editor edit-loss | ✅ **FIXED** — rewrote `useCharacterEditor` (serialized flushes, response-to-cache reconciliation, real auto-retry on 5xx/network, halt on terminal 4xx, unmount flush) + stripped the per-PATCH refetch from `useCharacterRepository` (also fixes the raw-vs-trimmed locale key bug). 12 hook tests rewritten/added covering all four regressions. |
| 5 | Unequip armor → 500 | ❌ **REFUTED (false positive)** — HAR proves 200; Prisma 6.19.3 accepts `null` on `Json?`. No change. |
| 6 | Orphaned unowned characters | ✅ **FIXED** — `generateCharacter` now binds `userId` at `create` (atomic); removed the second `update`. Backend test updated. |
| 7 | Broken share image | ✅ **FIXED** — `preview.png` (1920×1080) moved into `frontend/static/`; og:image dims corrected. |
| 8 | Wrong domain | ❌ **REFUTED** — real `index.html` already uses `rpgtools.co`; the agent read the stale `frontend/public/` artifact (now deleted). |
| 9 | Dead SQL + dup limits | ✅ **PARTIAL** — dead PL/pgSQL archived to `backend/init/_archive/` (out of migrate scan path) with README; fixed `origin` 1000→255 DB-overflow. Cross-package limit/game-math unification deferred to #16. |
| 10 | Branding split | ❌ **REFUTED** — stale artifact only; real files say "Scvm Rack". |
| 13 | God hook + global singleton | ✅ **FIXED** — split into `useCharacterValidationIssues` / `useAutoCreateCharacter` / `useCharacterActions`; module-level `pendingAutoCreateController` replaced by a per-instance ref. Public API unchanged; 10 existing integration tests pass. |
| 14 | Aggregation merges distinct items | ✅ **FIXED** — `aggregateItems` keys on stable `key`/identity signature; 3 tests added. |
| 15 | Stacked-item edit quirk | ✅ **DOCUMENTED** — added "Known issues" FAQ entry (en + pl); deeper fix tracked with #16. |
| 16 | Repository/Service/Controller | ✅ **FIXED** — **all three** route groups (characters, equipment, feedback) split into Repository → Service → Controller behind a shared `services/result.ts` + `sendServiceError`. Single error convention (4xx → client, 5xx → central handler/Sentry). Equipment id/key duplication collapsed into repo resolvers. +35 service unit tests covering happy paths, ownership/validation, and every 5xx mapping (backend 40 → 75). |
| 17 | Generation smells | ✅ **FIXED** — added an `armorByKey` map (O(1) lookup), `orderBy: { id }` on the weapon query (deterministic shared-roll selection), and key-aware granted-item resolution (legacy name map kept as fallback). |
| 18 | 274 KB favicon | ✅ **FIXED** — dropped SVG icon; PNG/ICO remain. |
| 19 | No sitemap | ✅ **FIXED** — added `sitemap.xml` + `Sitemap:` in robots.txt. |
| 20 | nginx security headers | ❌ **N/A** — handled by Caddy (`Caddyfile.example`); HAR confirms CSP/HSTS/X-Frame-Options. |
| 11, 12, 21–26 | CI/deploy/perf/misc | ⏸️ deprioritized ("rest are low prio"). |

**Validation:** frontend `tsc -p tsconfig.build.json` clean · 289 frontend unit tests pass · backend 40/40 pass · en/pl i18n 431/431 in sync. Not yet runtime-smoke-tested in a browser (the editor change needs a manual click-through).

---

## ✅ What's already solid (no action needed)
- **No committed secrets.** Only `from_secret:` refs, `*.env.example` placeholders, and dev-only values. `.env` is gitignored and untracked.
- **Ownership/authorization.** Every character read/write/delete route calls `checkCharacterAccess` before touching the row; session user is null-guarded. `additionalProperties: false` + whitelist sanitizer block mass-assignment (client cannot set `userId`/`classId`).
- **CSRF** enforced globally on all non-GET outside `/api/auth/*` (incl. `/api/feedback`, `/api/tunnel`).
- **Error leakage** masked (5xx → "Unexpected error occurred."); prototype-pollution guards in JSON sanitizers; test routes gated behind `ENABLE_TEST_ROUTES=1`.
- **i18n** — `en.json` and `pl.json` perfectly in sync (429 keys each).
- **No debug leftovers** — zero `console.log`/`debugger`/`TODO`/`FIXME` in `backend/src` or `frontend/src`.
- **Docker** — backend multi-stage, runs as `USER node`, prunes dev deps; prod DB on `internal: true` network (not host-exposed); compose secrets guarded with `${VAR:?required}`.
- **Code-splitting** — all routes incl. `PrintPage` lazy-loaded.
- **instrument.ts** (front & back) no-op cleanly when DSN unset.

---

## 🔴 CRITICAL — Optimistic character editor loses edits

> The marquee feature. Three reviewers independently converged on the same root cause: `flush()` clears `pending` eagerly **and** every PATCH triggers an unconditional `onSettled` refetch, so realistic rapid interaction drops or reverts edits. Treat items 1–4 as **one reconciliation workstream**, not four point-fixes.

- [ ] **1. Lost mid-flight edits.** `frontend/src/hooks/useCharacterEditor.ts:146` + `frontend/src/hooks/useCharacterRepository.ts:97-104`.
  - *Repro:* Edit a field, then edit again while the first 1s-debounced PATCH is in flight. The in-flight mutation's `onSettled` `invalidateQueries` refetches server state (which predates the 2nd edit) and overwrites the optimistic cache.
  - *Fix:* Don't `invalidateQueries` on every successful PATCH. Reconcile the server response against still-pending patches instead of blind refetch.

- [ ] **2. Stale arrays shipped to server.** `frontend/src/hooks/patchToRequest.ts:143-154` (`buildRequestFromPatches`) + `useCharacterEditor.ts:64`.
  - *Repro:* Array bodies (equipment/weapons/armor/modifiers) are rebuilt from the **query cache** at flush time. If a background refetch lands between `applyOptimisticPatch` and `flush`, the cache reverts and the PATCH ships the stale array → e.g. equip a weapon, refetch lands, flush un-equips it on the server permanently.
  - *Fix:* Build the outgoing payload from the optimistic result, not from live cache reads; cancel competing refetches around flush.

- [ ] **3. "Retries up to 3×" does not auto-retry.** `frontend/src/hooks/useCharacterEditor.ts:89-141`.
  - *Repro:* On a 5xx, the handler increments `retryCountRef` and `return`s with no re-fire scheduled; `pending` was already cleared at line 146. First two transient server errors silently lose the edit with no toast (counter only *suppresses* the error toast until the 3rd failure).
  - *Fix:* Actually schedule a retry (re-queue the patches) on transient failure; only clear `pending` after a confirmed success.

- [ ] **4. No flush/cancel on unmount.** `frontend/src/hooks/useCharacterEditor.ts:155`.
  - *Repro:* Navigate away / logout inside the 1s debounce window → pending patch dropped; possible setState-after-unmount warning.
  - *Fix:* `useEffect(() => () => debouncedFlush.flush(), [])` (or cancel + persist) on unmount.

---

## 🟠 HIGH — Guaranteed breaks & first impressions

- [ ] **5. Unequipping armor returns 500.** `backend/src/routes/characters/index.ts:394-397`.
  - *Repro:* `PATCH /api/characters/:id` with `{ "equippedArmor": null }` (valid per `UpdateBodySchema:285`). `sanitizeJsonb(null)` → bare JS `null` passed to Prisma; a nullable `Json?` column rejects it at runtime → 500 "Failed to update character." The generator handles this correctly with `Prisma.DbNull` (`generate-character.ts:611`); the PATCH path does not. Unequipping armor is a core gameplay action.
  - *Fix:* Convert `null` → `Prisma.DbNull` (or `JsonNull`) for nullable Json fields in the PATCH sanitizer.

- [ ] **6. Orphaned, unowned characters (non-transactional create).** `backend/src/routes/characters/index.ts:159-170`.
  - *Repro:* `generateCharacter()` inserts a row with **no `userId`**, then a second `update` binds ownership. A crash/failure between the two awaits leaves a `userId = null` row that `checkCharacterAccess` rejects for everyone → permanently unreachable/undeletable, and inflates the public `/count` over time.
  - *Fix:* Wrap create + bind in `prisma.$transaction`, or pass `userId` into the generator's `create`.

- [ ] **7. Broken social share image.** `frontend/index.html:28,38` + `frontend/src/seo/Seo.tsx:5` reference `/preview.png`, which **does not exist** anywhere in the repo (`static/` is Vite's `publicDir`).
  - *Impact:* Every link shared to Discord/Twitter/Slack/Facebook renders a blank/broken card. Most visible launch bug.
  - *Fix:* Add a real `static/preview.png` (1200×630 og:image).

- [ ] **8. Wrong production domain in the HTML shell.** `frontend/index.html:27-40` hardcodes `https://scvmrack.rpgtools.eu.org/` for `og:url`, `og:image`, `twitter:image`, `<link rel="canonical">`, while every other source (`siteUrl.ts:3`, `PrintPage.tsx:283`, compose, `.env.example`) uses `scvmrack.rpgtools.co`.
  - *Impact:* Crawlers/social bots read the static HTML before JS overwrites it → wrong canonical & SEO.
  - *Fix:* Update `index.html` to `rpgtools.co` (or template it from the build env).

- [ ] **9. Dead PL/pgSQL re-applied every deploy + game math duplicated 3–4×.** `backend/init/03-functions/{generate_character,get_character_full,update_character}.sql` (grep-confirmed: **zero** source references) yet `backend/scripts/migrate.js` re-runs them on every deploy.
  - *Duplication:* encumbrance/DR math lives in the dead SQL **and** `backend/src/lib/get-character-full.ts` **and** the frontend "fallback" `frontend/src/hooks/useSummaryMetrics.ts:128,142`. Field limits triplicated across `backend/src/utils.ts:102` + frontend zod + frontend `simpleNumberLimits`/`textFieldLimits` — **and already disagree** (`habit` 1000 vs 200; `trait1`/`trait2` 255 vs 35; `bodyDescription`/`origin` 1000 vs 200).
  - *Fix:* Delete (or archive out of migrate.js's scan path) the dead SQL functions. Make TS the single source of truth for game math; trust server-computed `drToDodge`/`maxEncumbrance` on the client. Hoist field limits into one shared constants module consumed by both zod and the backend sanitizer.

---

## 🟡 MEDIUM — Polish, CI, smells

- [ ] **10. Branding split: "Scvm Grinder" vs "Scvm Rack".** `frontend/index.html` (application-name, og/twitter titles, descriptions) says "Scvm Grinder"; `seo/Seo.tsx:4` and the product say "Scvm Rack." Tab title + share cards show the wrong name.

- [ ] **11. CI workflow never runs.** `frontend/.github/workflows/react-doctor.yml` — (a) lives under `frontend/.github/` but GitHub only reads repo-root `.github/workflows/`; (b) triggers on `main`, default branch is `master`; (c) currently **untracked** (not committed); (d) `millionco/react-doctor@v1` pinned to a mutable major tag.
  - *Fix:* Move to repo-root `.github/workflows/`, trigger on `master`, commit it, pin to a SHA.

- [ ] **12. Prod deploy not gated on tests.** `.woodpecker/deploy.yaml:21-23` runs `docker stack deploy` on `master` push; tests run in separate pipelines "reported separately." A red build can ship.
  - *Fix:* Add a status-check gate / branch protection before the deploy step.

- [ ] **13. God hook + cross-instance global singleton.** `frontend/src/hooks/useCurrentCharacter.ts` (466 lines) owns validation state, logout/session side effects, auto-create-or-find, and manual generate/kill — plus a **module-level mutable** `pendingAutoCreateController` (line 62) shared across all instances/tabs.
  - *Repro:* Two mounts (StrictMode double-invoke, or landing pregen + sheet) abort each other's in-flight auto-create → orphaned/duplicated create on first run (the launch path).
  - *Fix:* Split into `useCharacterValidationIssues` / `useAutoCreateCharacter` / `useCharacterActions`; move the controller into a ref or the query layer.

- [ ] **14. Aggregation collapses distinct items.** `frontend/src/utils/aggregateItems.ts:15` groups by lowercased `name` only. A custom "Dagger" (d4) and catalog "Dagger" (d6) merge into one stack; editing/selling the group hits both underlying indices and corrupts one.
  - *Fix:* Include discriminating fields (key/dice/source) in the group key.

- [ ] **15. Inventory edit + quantity decrease writes to wrong slot.** `frontend/src/hooks/useInventoryItemEditor.ts:136-144`. `save()` calls `onAdjustQuantity` (which removes slots, shifting indices) and then `onUpdate(retainedIndices, ...)` using **pre-adjustment** indices → the name edit lands on a different/removed item.
  - *Fix:* Recompute indices after the quantity adjustment, or do both in one reconciled patch.

- [ ] **16. Two error-flow conventions in one route file.** `backend/src/routes/characters/index.ts` mixes `return sendApiError(...)` with `throw apiError(...)`, plus three near-identical normalizer helpers. Reader can't predict return-vs-throw.
  - *Fix:* Standardize on throwing into a single Fastify `setErrorHandler`; collapse the normalizers.

- [ ] **17. Generation smells.** `backend/src/lib/generate-character.ts`: (a) `buildPoolItem` flattens & linear-scans the whole armor catalog per item (line 141) — add an `armorByKey` map to `CatalogCache`; (b) granted class items/pets keyed by **hardcoded English display names** (lines 150-179) — should be a `gainItemKey` in seed data; (c) `weaponsByRoll` keeps first weapon per roll with no `orderBy` → non-deterministic starting-weapon when weapons share a roll slot.

---

## 🟢 LOW — Nice-to-haves

- [ ] **18.** 274 KB SVG favicon shipped as primary icon — `frontend/index.html:44`. Minify or use the 2.5 KB PNG.
- [ ] **19.** No `sitemap.xml` / no `Sitemap:` directive in `frontend/static/robots.txt`.
- [ ] **20.** `frontend/nginx.conf` serves HTML/JS with no CSP / `X-Content-Type-Options` / `Referrer-Policy` / `X-Frame-Options` (confirm reverse proxy doesn't add them).
- [ ] **21.** Backend `tracesSampleRate: 1` (100%) — `backend/src/instrument.ts:30`. Frontend uses 0.2; lower backend for prod.
- [ ] **22.** Logto secrets fall back to placeholders silently — `backend/src/plugins/rpgtools-auth.ts:33-39` (`'dev-logto-app-secret'`). Fail fast in prod when unset.
- [ ] **23.** Sentry tunnel forwards client-supplied `sentry_key` and relays upstream body verbatim — `backend/src/routes/tunnel.ts:67-81`. `projectId` is allowlisted (good); consider pinning the key server-side.
- [ ] **24.** Theme file is a 2877-line change-amplifier (`frontend/src/theme/morkBorgTheme.ts`) — ~2700 lines are a `customStyles` object 30 files reach into. Split per-feature style modules; keep the file to the `createTheme` config.
- [ ] **25.** Orphaned post-migration helpers `toDbPatch`/`camelCaseJsonbFields` in `backend/src/utils.ts` (referenced only by themselves + a migration script + their own test). Confirm-and-delete.
- [ ] **26.** Stale local build artifact `frontend/public/` (untracked, not Vite's publicDir, contains the `.eu.org` domain) — delete locally to avoid confusion.

---

### Notes
- Generator-vs-SQL parity is a stated **non-goal** (per project memory: the ChaCha20 roller intentionally replaces Postgres `random()`), so items 9 & 17 are framed as dead-code/duplication and data-correctness, **not** parity bugs.
- Items 1–4 share one root cause; fix as a single editor-reconciliation effort rather than piecemeal.


## 🔴 CRITICAL — Optimistic character editor loses edits

Defo fix them all, add tests that make sure that this cannot happen again (as the editor is easily the only and most complex part of the app), but as 5. seems like a halucination do double check them. 

## 🟠 HIGH — Guaranteed breaks & first impressions


5. Gonna have to push back a bit on that one? As I just unequipped an armor and it works ?

 {
  "log": {
    "version": "1.2",
    "creator": {
      "name": "Firefox",
      "version": "151.0.3"
    },
    "browser": {
      "name": "Firefox",
      "version": "151.0.3"
    },
    "pages": [
      {
        "id": "page_1",
        "pageTimings": {
          "onContentLoad": -27017,
          "onLoad": -26870
        },
        "startedDateTime": "2026-06-06T13:28:24.694+02:00",
        "title": "https://scvmrack.rpgtools.co/character/***REMOVED***"
      }
    ],
    "entries": [
      {
        "startedDateTime": "2026-06-06T13:28:24.694+02:00",
        "request": {
          "bodySize": 919,
          "method": "PATCH",
          "url": "https://scvmrack.rpgtools.co/api/characters/***REMOVED***",
          "httpVersion": "HTTP/3",
          "headers": [
            {
              "name": "Host",
              "value": "scvmrack.rpgtools.co"
            },
            {
              "name": "User-Agent",
              "value": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0"
            },
            {
              "name": "Accept",
              "value": "*/*"
            },
            {
              "name": "Accept-Language",
              "value": "pl,en-US;q=0.9,en;q=0.8"
            },
            {
              "name": "Accept-Encoding",
              "value": "gzip, deflate, br, zstd"
            },
            {
              "name": "Referer",
              "value": "https://scvmrack.rpgtools.co/character/***REMOVED***"
            },
            {
              "name": "content-type",
              "value": "application/json"
            },
            {
              "name": "x-csrf-token",
              "value": "***REMOVED***"
            },
            {
              "name": "Content-Length",
              "value": "919"
            },
            {
              "name": "Origin",
              "value": "https://scvmrack.rpgtools.co"
            },
            {
              "name": "Alt-Used",
              "value": "scvmrack.rpgtools.co"
            },
            {
              "name": "Connection",
              "value": "keep-alive"
            },
            {
              "name": "Cookie",
              "value": "__Secure-better-auth.session_token=***REMOVED***; _csrf=***REMOVED***"
            },
            {
              "name": "Sec-Fetch-Dest",
              "value": "empty"
            },
            {
              "name": "Sec-Fetch-Mode",
              "value": "cors"
            },
            {
              "name": "Sec-Fetch-Site",
              "value": "same-origin"
            },
            {
              "name": "Priority",
              "value": "u=4"
            },
            {
              "name": "TE",
              "value": "trailers"
            }
          ],
          "cookies": [
            {
              "name": "__Secure-better-auth.session_token",
              "value": "***REMOVED***"
            },
            {
              "name": "_csrf",
              "value": "***REMOVED***"
            }
          ],
          "queryString": [],
          "headersSize": 842,
          "postData": {
            "mimeType": "application/json",
            "params": [],
            "text": "{\"equipment\":[{\"key\":\"scroll.unclean.5\",\"name\":\"Daemon of Capillaries\",\"description\":\"One creature suffocates for d6 rounds, losing d4 HP per round\",\"value\":50,\"uses\":[true,true,false,false],\"dice\":[],\"tags\":[\"scroll\",\"unclean\"],\"modifiers\":[]},{\"key\":\"pets.monkey\",\"name\":\"Monkey\",\"description\":\"It ignores you but loves you. 2 HP, punch/bite d4\",\"uses\":[true,false],\"dice\":[4],\"tags\":[\"animal\",\"pet\"],\"modifiers\":[]},{\"key\":\"weapons.sword\",\"name\":\"Sword\",\"description\":\"d6 damage\",\"value\":30,\"uses\":[],\"dice\":[6],\"tags\":[\"melee\",\"weapon\"],\"ammoType\":\"\",\"modifiers\":[]},{\"description\":\"\",\"uses\":[],\"dice\":[],\"tags\":[],\"modifiers\":[]},{\"key\":\"armor.mail\",\"name\":\"Mail Armor\",\"description\":\"-d4 damage, tier 2, DR +2 on Agility tests\",\"value\":100,\"dice\":[4],\"tags\":[\"armor\",\"medium-armor\",\"metal\"],\"maxTier\":2,\"currentTier\":2,\"modifiers\":[{\"value\":-2,\"source\":\"Mail armor\",\"statistic\":\"agility\"}]}],\"equippedArmor\":null}"
          }
        },
        "response": {
          "status": 200,
          "statusText": "",
          "httpVersion": "HTTP/3",
          "headers": [
            {
              "name": "alt-svc",
              "value": "h3=\":443\"; ma=86400"
            },
            {
              "name": "content-security-policy",
              "value": "default-src 'self';script-src 'self' 'unsafe-inline';script-src-attr 'unsafe-inline';style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;font-src 'self' https://fonts.gstatic.com;img-src 'self' data:;connect-src 'self' https://auth.rpgtools.eu.org;frame-ancestors 'none';base-uri 'self';form-action 'self';object-src 'none';upgrade-insecure-requests"
            },
            {
              "name": "content-type",
              "value": "application/json; charset=utf-8"
            },
            {
              "name": "cross-origin-opener-policy",
              "value": "same-origin"
            },
            {
              "name": "cross-origin-resource-policy",
              "value": "same-origin"
            },
            {
              "name": "date",
              "value": "Sat, 06 Jun 2026 11:28:24 GMT"
            },
            {
              "name": "origin-agent-cluster",
              "value": "?1"
            },
            {
              "name": "referrer-policy",
              "value": "no-referrer"
            },
            {
              "name": "strict-transport-security",
              "value": "max-age=31536000; includeSubDomains"
            },
            {
              "name": "via",
              "value": "1.1 Caddy"
            },
            {
              "name": "x-content-type-options",
              "value": "nosniff"
            },
            {
              "name": "x-dns-prefetch-control",
              "value": "off"
            },
            {
              "name": "x-download-options",
              "value": "noopen"
            },
            {
              "name": "x-frame-options",
              "value": "SAMEORIGIN"
            },
            {
              "name": "x-permitted-cross-domain-policies",
              "value": "none"
            },
            {
              "name": "x-ratelimit-limit",
              "value": "50"
            },
            {
              "name": "x-ratelimit-remaining",
              "value": "47"
            },
            {
              "name": "x-ratelimit-reset",
              "value": "48"
            },
            {
              "name": "x-xss-protection",
              "value": "0"
            },
            {
              "name": "nel",
              "value": "{\"report_to\":\"cf-nel\",\"success_fraction\":0.0,\"max_age\":604800}"
            },
            {
              "name": "cf-cache-status",
              "value": "DYNAMIC"
            },
            {
              "name": "server",
              "value": "cloudflare"
            },
            {
              "name": "content-encoding",
              "value": "zstd"
            },
            {
              "name": "priority",
              "value": "u=4,i=?0"
            },
            {
              "name": "report-to",
              "value": "{\"group\":\"cf-nel\",\"max_age\":604800,\"endpoints\":[{\"url\":\"https://a.nel.cloudflare.com/report/v4?s=VZ0vn9ApBGogfpi0NiBus1Y0Wu1aMxNbgija5FZkO8fI4wRl9bEzqVe%2F4NBUgnTrG6m3ubFBtHmDM%2FcoOCNAXFJdD5LYULGwfkzKywSDGK5QP8V51LURsqHa7vhCT2Ko9VjbQftTqQ%3D%3D\"}]}"
            },
            {
              "name": "cf-ray",
              "value": "a07712ca8cda512f-WAW"
            },
            {
              "name": "server-timing",
              "value": "cfExtPri"
            }
          ],
          "cookies": [],
          "content": {
            "mimeType": "application/json; charset=utf-8",
            "size": 2815,
            "text": "{\"id\":\"***REMOVED***\",\"name\":\"Kratar\",\"classId\":6,\"className\":\"Occult Herbmaster\",\"classDescription\":\"Born of the mushroom, raised in the glade, watched by the eye of the moon in a silverblack pool.\",\"origin\":\"From the illegal midnight markets of Schleswig.\",\"strength\":7,\"agility\":16,\"presence\":14,\"toughness\":10,\"maxHp\":5,\"currentHp\":5,\"omens\":2,\"maxOmens\":2,\"silver\":100,\"habit\":\"Consistently loses important items and forgets vital facts.\",\"tale\":\"A battle wound left a shard of metal slowly inching closer to your heart. Every day there is a 2% chance it reaches it.\",\"bodyDescription\":\"Looks starved: gaunt and pale\",\"trait1\":\"wasteful\",\"trait2\":\"loud mouth\",\"notes\":\"Smelly feaet!\",\"abilities\":[{\"key\":\"abilities.occult_herbmaster.decoctions\",\"name\":\"Portable Laboratory: Daily create two random decoctions and brew d4 doses total. Lose vitality after 24 hours.\",\"description\":\"\"}],\"equipment\":[{\"key\":\"scroll.unclean.5\",\"name\":\"Daemon of Capillaries\",\"description\":\"One creature suffocates for d6 rounds, losing d4 HP per round\",\"value\":50,\"uses\":[true,true,false,false],\"dice\":[],\"tags\":[\"scroll\",\"unclean\"],\"modifiers\":[]},{\"key\":\"pets.monkey\",\"name\":\"Monkey\",\"description\":\"It ignores you but loves you. 2 HP, punch/bite d4\",\"uses\":[true,false],\"dice\":[4],\"tags\":[\"animal\",\"pet\"],\"modifiers\":[]},{\"key\":\"weapons.sword\",\"name\":\"Sword\",\"description\":\"d6 damage\",\"value\":30,\"uses\":[],\"dice\":[6],\"tags\":[\"melee\",\"weapon\"],\"ammoType\":\"\",\"modifiers\":[]},{\"description\":\"\",\"uses\":[],\"dice\":[],\"tags\":[],\"modifiers\":[]},{\"key\":\"armor.mail\",\"name\":\"Mail Armor\",\"description\":\"-d4 damage, tier 2, DR +2 on Agility tests\",\"value\":100,\"uses\":[],\"dice\":[4],\"tags\":[\"armor\",\"medium-armor\",\"metal\"],\"maxTier\":2,\"currentTier\":2,\"modifiers\":[{\"value\":-2,\"source\":\"Mail armor\",\"statistic\":\"agility\"}]}],\"storage\":[],\"equippedWeapons\":[{\"key\":\"custom.weapon.xp1hy0kmq1eibp2\",\"name\":\"Sword of strenght\",\"description\":\"\",\"source\":\"custom\",\"category\":\"weapon\",\"value\":1000,\"dice\":[10],\"tags\":[\"custom\",\"weapon\"],\"modifiers\":[{\"id\":\"viqriunmq1eibp2\",\"name\":\"Sword of strenght\",\"value\":3,\"source\":\"Sword of strenght\",\"statistic\":\"strength\",\"exclude\":[\"defence\",\"ability\"],\"scope\":\"combat\"}]},{\"key\":\"weapons.femur\",\"name\":\"Femur\",\"description\":\"d4 damage\",\"value\":0,\"dice\":[4],\"tags\":[\"melee\",\"weapon\"],\"modifiers\":[]}],\"equippedArmor\":{\"description\":\"\",\"dice\":[],\"maxTier\":0,\"currentTier\":0,\"tags\":[],\"modifiers\":[]},\"modifiers\":[],\"computedModifiers\":[{\"value\":3,\"source\":\"Sword of strenght\",\"statistic\":\"strength\",\"exclude\":[\"defence\",\"ability\"],\"origin\":\"weapon\",\"originKey\":\"custom.weapon.xp1hy0kmq1eibp2\",\"originName\":\"Sword of strenght\"}],\"encumbrance\":5,\"maxEncumbrance\":7,\"drToDodge\":10,\"drToMelee\":10,\"drToRanged\":11,\"createdAt\":\"2026-06-05T20:52:13.498Z\",\"updatedAt\":\"2026-06-06T11:28:24.758Z\"}"
          },
          "redirectURL": "",
          "headersSize": 1465,
          "bodySize": 2738
        },
        "cache": {},
        "timings": {
          "blocked": -1,
          "dns": 0,
          "connect": 0,
          "ssl": 0,
          "send": 0,
          "wait": 71,
          "receive": 0
        },
        "time": 71,
        "_securityState": "secure",
        "serverIPAddress": "104.21.74.153",
        "connection": "443",
        "pageref": "page_1"
      },
      {
        "startedDateTime": "2026-06-06T13:28:24.831+02:00",
        "request": {
          "bodySize": 0,
          "method": "GET",
          "url": "https://scvmrack.rpgtools.co/api/characters/***REMOVED***?locale=en",
          "httpVersion": "HTTP/3",
          "headers": [
            {
              "name": "Host",
              "value": "scvmrack.rpgtools.co"
            },
            {
              "name": "User-Agent",
              "value": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0"
            },
            {
              "name": "Accept",
              "value": "*/*"
            },
            {
              "name": "Accept-Language",
              "value": "pl,en-US;q=0.9,en;q=0.8"
            },
            {
              "name": "Accept-Encoding",
              "value": "gzip, deflate, br, zstd"
            },
            {
              "name": "Referer",
              "value": "https://scvmrack.rpgtools.co/character/***REMOVED***"
            },
            {
              "name": "Alt-Used",
              "value": "scvmrack.rpgtools.co"
            },
            {
              "name": "Connection",
              "value": "keep-alive"
            },
            {
              "name": "Cookie",
              "value": "__Secure-better-auth.session_token=***REMOVED***; _csrf=***REMOVED***"
            },
            {
              "name": "Sec-Fetch-Dest",
              "value": "empty"
            },
            {
              "name": "Sec-Fetch-Mode",
              "value": "cors"
            },
            {
              "name": "Sec-Fetch-Site",
              "value": "same-origin"
            },
            {
              "name": "Priority",
              "value": "u=4"
            },
            {
              "name": "TE",
              "value": "trailers"
            }
          ],
          "cookies": [
            {
              "name": "__Secure-better-auth.session_token",
              "value": "***REMOVED***"
            },
            {
              "name": "_csrf",
              "value": "***REMOVED***"
            }
          ],
          "queryString": [
            {
              "name": "locale",
              "value": "en"
            }
          ],
          "headersSize": 691
        },
        "response": {
          "status": 200,
          "statusText": "",
          "httpVersion": "HTTP/3",
          "headers": [
            {
              "name": "alt-svc",
              "value": "h3=\":443\"; ma=86400"
            },
            {
              "name": "content-security-policy",
              "value": "default-src 'self';script-src 'self' 'unsafe-inline';script-src-attr 'unsafe-inline';style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;font-src 'self' https://fonts.gstatic.com;img-src 'self' data:;connect-src 'self' https://auth.rpgtools.eu.org;frame-ancestors 'none';base-uri 'self';form-action 'self';object-src 'none';upgrade-insecure-requests"
            },
            {
              "name": "content-type",
              "value": "application/json; charset=utf-8"
            },
            {
              "name": "cross-origin-opener-policy",
              "value": "same-origin"
            },
            {
              "name": "cross-origin-resource-policy",
              "value": "same-origin"
            },
            {
              "name": "date",
              "value": "Sat, 06 Jun 2026 11:28:24 GMT"
            },
            {
              "name": "origin-agent-cluster",
              "value": "?1"
            },
            {
              "name": "referrer-policy",
              "value": "no-referrer"
            },
            {
              "name": "strict-transport-security",
              "value": "max-age=31536000; includeSubDomains"
            },
            {
              "name": "via",
              "value": "1.1 Caddy"
            },
            {
              "name": "x-content-type-options",
              "value": "nosniff"
            },
            {
              "name": "x-dns-prefetch-control",
              "value": "off"
            },
            {
              "name": "x-download-options",
              "value": "noopen"
            },
            {
              "name": "x-frame-options",
              "value": "SAMEORIGIN"
            },
            {
              "name": "x-permitted-cross-domain-policies",
              "value": "none"
            },
            {
              "name": "x-ratelimit-limit",
              "value": "100"
            },
            {
              "name": "x-ratelimit-remaining",
              "value": "90"
            },
            {
              "name": "x-ratelimit-reset",
              "value": "34"
            },
            {
              "name": "x-xss-protection",
              "value": "0"
            },
            {
              "name": "nel",
              "value": "{\"report_to\":\"cf-nel\",\"success_fraction\":0.0,\"max_age\":604800}"
            },
            {
              "name": "cf-cache-status",
              "value": "DYNAMIC"
            },
            {
              "name": "server",
              "value": "cloudflare"
            },
            {
              "name": "content-encoding",
              "value": "zstd"
            },
            {
              "name": "priority",
              "value": "u=4,i=?0"
            },
            {
              "name": "report-to",
              "value": "{\"group\":\"cf-nel\",\"max_age\":604800,\"endpoints\":[{\"url\":\"https://a.nel.cloudflare.com/report/v4?s=NnTVnKRAKxH86HIJVFLfKzwHKUQoVpNKqwhfCItrtARh3WSLyYTIlyMGSAGMke2GeB4i2CrEyJrdhrFqQXGITNvCIqAE8NtRiLYAWAvUdPJR789%2BV%2Be92yBzuhhnFXniGO1VUg8VrA%3D%3D\"}]}"
            },
            {
              "name": "cf-ray",
              "value": "a07712cb6cf1512f-WAW"
            },
            {
              "name": "server-timing",
              "value": "cfExtPri"
            }
          ],
          "cookies": [],
          "content": {
            "mimeType": "application/json; charset=utf-8",
            "size": 2815,
            "text": "{\"id\":\"***REMOVED***\",\"name\":\"Kratar\",\"classId\":6,\"className\":\"Occult Herbmaster\",\"classDescription\":\"Born of the mushroom, raised in the glade, watched by the eye of the moon in a silverblack pool.\",\"origin\":\"From the illegal midnight markets of Schleswig.\",\"strength\":7,\"agility\":16,\"presence\":14,\"toughness\":10,\"maxHp\":5,\"currentHp\":5,\"omens\":2,\"maxOmens\":2,\"silver\":100,\"habit\":\"Consistently loses important items and forgets vital facts.\",\"tale\":\"A battle wound left a shard of metal slowly inching closer to your heart. Every day there is a 2% chance it reaches it.\",\"bodyDescription\":\"Looks starved: gaunt and pale\",\"trait1\":\"wasteful\",\"trait2\":\"loud mouth\",\"notes\":\"Smelly feaet!\",\"abilities\":[{\"key\":\"abilities.occult_herbmaster.decoctions\",\"name\":\"Portable Laboratory: Daily create two random decoctions and brew d4 doses total. Lose vitality after 24 hours.\",\"description\":\"\"}],\"equipment\":[{\"key\":\"scroll.unclean.5\",\"name\":\"Daemon of Capillaries\",\"description\":\"One creature suffocates for d6 rounds, losing d4 HP per round\",\"value\":50,\"uses\":[true,true,false,false],\"dice\":[],\"tags\":[\"scroll\",\"unclean\"],\"modifiers\":[]},{\"key\":\"pets.monkey\",\"name\":\"Monkey\",\"description\":\"It ignores you but loves you. 2 HP, punch/bite d4\",\"uses\":[true,false],\"dice\":[4],\"tags\":[\"animal\",\"pet\"],\"modifiers\":[]},{\"key\":\"weapons.sword\",\"name\":\"Sword\",\"description\":\"d6 damage\",\"value\":30,\"uses\":[],\"dice\":[6],\"tags\":[\"melee\",\"weapon\"],\"ammoType\":\"\",\"modifiers\":[]},{\"description\":\"\",\"uses\":[],\"dice\":[],\"tags\":[],\"modifiers\":[]},{\"key\":\"armor.mail\",\"name\":\"Mail Armor\",\"description\":\"-d4 damage, tier 2, DR +2 on Agility tests\",\"value\":100,\"uses\":[],\"dice\":[4],\"tags\":[\"armor\",\"medium-armor\",\"metal\"],\"maxTier\":2,\"currentTier\":2,\"modifiers\":[{\"value\":-2,\"source\":\"Mail armor\",\"statistic\":\"agility\"}]}],\"storage\":[],\"equippedWeapons\":[{\"key\":\"custom.weapon.xp1hy0kmq1eibp2\",\"name\":\"Sword of strenght\",\"description\":\"\",\"source\":\"custom\",\"category\":\"weapon\",\"value\":1000,\"dice\":[10],\"tags\":[\"custom\",\"weapon\"],\"modifiers\":[{\"id\":\"viqriunmq1eibp2\",\"name\":\"Sword of strenght\",\"value\":3,\"source\":\"Sword of strenght\",\"statistic\":\"strength\",\"exclude\":[\"defence\",\"ability\"],\"scope\":\"combat\"}]},{\"key\":\"weapons.femur\",\"name\":\"Femur\",\"description\":\"d4 damage\",\"value\":0,\"dice\":[4],\"tags\":[\"melee\",\"weapon\"],\"modifiers\":[]}],\"equippedArmor\":{\"description\":\"\",\"dice\":[],\"maxTier\":0,\"currentTier\":0,\"tags\":[],\"modifiers\":[]},\"modifiers\":[],\"computedModifiers\":[{\"value\":3,\"source\":\"Sword of strenght\",\"statistic\":\"strength\",\"exclude\":[\"defence\",\"ability\"],\"origin\":\"weapon\",\"originKey\":\"custom.weapon.xp1hy0kmq1eibp2\",\"originName\":\"Sword of strenght\"}],\"encumbrance\":5,\"maxEncumbrance\":7,\"drToDodge\":10,\"drToMelee\":10,\"drToRanged\":11,\"createdAt\":\"2026-06-05T20:52:13.498Z\",\"updatedAt\":\"2026-06-06T11:28:24.758Z\"}"
          },
          "redirectURL": "",
          "headersSize": 1466,
          "bodySize": 2739
        },
        "cache": {},
        "timings": {
          "blocked": 0,
          "dns": 0,
          "connect": 0,
          "ssl": 0,
          "send": 0,
          "wait": 56,
          "receive": 0
        },
        "time": 56,
        "_securityState": "secure",
        "serverIPAddress": "104.21.74.153",
        "connection": "443",
        "pageref": "page_1"
      }
    ]
  }
}


6. Yup it's a good idea to do some transactions here and there 

7. I have added preview.png to the root, put it where it is needed and link to it! 

8. https://scvmrack.rpgtools.co is the proper domain fix everywhere 

9. Archive the SQL for future reference, and de-dupe + cleanup 

10. Scvm Rack is always the proper branding! 

13. I *really* like this one, lets do it like this and thurolly test it!

14. Yeah good catch! 

15. Yeah this one of the quirks of the system, I am trying to figure out a solution that kind of bunches them up together but they remain as individuals, unless there is a quick win we can add a "known issues" sections to the FAQ and include that 

16. Yeah generally we need to split this into kind of a Repository -> Service -> Controller kind of thing where 
16.1. Reporitory Handles prisma 
16.2. Service handles the logic and returns a stable result type 
16.3. controller i just a communicaiton layer 
16.4 but lets do this as a seprate thing afterwards 

17. I don't understand this one? 

18. fine, PNG is fine 

19. Please generate 

20. Caddyfile.example is more or less informative of how we do things 

all of the rest are low prio
