# Owlbear test suite

The approved acceptance scenarios are in [owlbear-extension.feature](features/owlbear-extension.feature). CI already discovers the unit, browser and API files below; the real Owlbear account is never needed by CI.

| Scenario | Automated boundary |
| --- | --- |
| Release and standalone entry | `frontend/test/unit/obr/manifest.test.ts`, `frontend/test/browser/ObrCharacterRoute.test.tsx` |
| Custom class, starting gear, room membership, handoff | `backend/tests/integration-be/src/owlbear-table.integration.test.ts`, `backend/tests/e2e/tests/guest/obr-handoff.spec.ts` |
| Room pool and explicit Classless | `frontend/test/browser/obr/ObrRollPicker.test.tsx`, `ObrCharacterRoute.test.tsx`, real API suite above, backend generator unit test |
| Token binding, cards, resources and removal | API suite above; existing `ObrCard.test.tsx`, `ObrPartyRoster.test.tsx`, `ObrCharacterRoute.test.tsx`, `obr/contextMenu.test.tsx` browser tests |
| Durable party, Miseries, enemy projection and attach/detach | API suite above; `ObrEnemies.test.tsx` and `ObrPartyRoster.test.tsx` browser tests |
| No scene and unavailable storage | `ObrCharacterRoute.test.tsx` scene transition; `frontend/test/unit/hooks/useAuth.test.ts` storage failure; `test/unit/utils/embed.test.ts` embedded cookie marker |
| Cancelled login, expired session and recovery | `ObrCharacterRoute.test.tsx` cancellation; API suite sign-out/rejected save; existing auth, session gate, editor and exchange gate unit tests |
| Compact EN/PL interface | `ObrLayout.test.tsx` at 420×600; real sheet without router in `obr/ObrSheet.test.tsx`; live host smoke below |

These layers deliberately keep the SDK as the browser boundary and exercise ownership/persistence against real Fastify, shared-auth, Prisma and PostgreSQL. The integration suite changes the fixture GM's anonymous flag directly, then uses HTTP for all product actions. It never bypasses ownership checks in application code. Room capability access remains the documented accepted policy; the safe enemy card must omit GM-only fields.

## Local commands

From `frontend/`:

```powershell
npm run test:obr:unit
npm run test:obr:browser
npx tsc --noEmit
npm run lint
npm run doctor
```

From `backend/`, use `npm run test:integration` for the real API suite and `npm run test:e2e` for first-party browser flows. `npm run test:all` runs the repository-wide checks. Node 22 is the supported backend test runtime. If Windows native module mocks hang, use the Docker test runtime rather than suppressing assertions.

## Real Owlbear room smoke

This is an explicit opt-in suite, outside the default Playwright test directory. It signs into the designated GM account, admits a new guest player, rolls a Book class, saves HP, reopens, switches EN/PL, checks the GM roster and redeems the full-sheet handoff. It leaves a named QA player/scvm in the room; use a dedicated QA room with space in its party. Repeated runs consume party slots.

Create `.owlbear_account` at the repository root with literal `OWLBEAR_USER=value` and `OWLBEAR_PASS=value` lines. This file is gitignored. The runner loads it in memory and preserves password characters such as `#` and `=`; it does not print the values or export browser auth state. Traces, videos and automatic screenshots are disabled. Screenshots are taken only after sign-in, with no authentication URL in view. Do not upload failure contexts or login logs without sanitizing them.

From `backend/tests/e2e/`:

```powershell
$env:OWLBEAR_LIVE='1'
$env:OWLBEAR_ROOM_URL='https://www.owlbear.rodeo/room/YOUR-QA-ROOM/YOUR-ROOM-NAME'
npm run test:owlbear:live
```

Chrome must be installed. Terms acceptance for the account must be authorized before running sign-in. A CAPTCHA or host outage is an external blocker, not a passing test.

To validate an un-deployed frontend with the real Owlbear SDK and canary API, build `frontend/` with `VITE_BACKEND_URL=https://scvmrack-canary.rpgtools.co`, then set `OWLBEAR_LOCAL_DIST` to its absolute `dist` directory. The runner substitutes only that origin's `obr.html` and locally available static assets. API requests and Owlbear remain real; the full-sheet handoff may use the deployed main app. Always distinguish this result from a deployed-canary pass.

## Release gate

Both manifests must match the package version and use a fresh popover cache key. Installing/updating the manifest in Owlbear and deploying the frontend are separate steps; a local test does not update the installed extension.

After deployment, rerun the live smoke **without** `OWLBEAR_LOCAL_DIST`, then check actual scene token selection/context menus, GM/player permissions, popup cancellation and session recovery, and Owlbear's selected light/dark themes. The automated API/SDK tests do not prove the host's scene UI or browser popup policies. Keep these checks explicit in the release report rather than marking them passed from a mocked SDK.
