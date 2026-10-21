# Owlbear validation — 2026-10-21

Branch: `codex/obr-070-release-tests`, based on `dev` at `65e69ab5`. [PR #55](https://github.com/Tackgnol/scvmrack/pull/55) contains the implementation and the approved eight-scenario suite. Commands and test boundaries are in [owlbear-testing.md](owlbear-testing.md).

## Findings fixed

- **RPG-326:** Book and Custom Class sheets crashed in Owlbear because class/report links required the main app router. Native links now open a separate tab from the embedded sheet; typed SPA links retain route parameters/search in the main app.
- **RPG-327:** Roll discarded `classlessEnabled`, cached old room choices and had no explicit Classless creation request. The picker refreshes on reopening and the API validates explicit Classless against the room pool.
- **RPG-328:** Session expiry could discard an edit, remain marked expired after sign-in, and deadlock behind the pending-save navigation guard. The exact request remains queued, recovery signals bypass that guard, and the visible recovery control signs in and retries. Redirect state resets so later expiries can recover again.
- The 0.7.0 manifest and cache key now match the app; compact chrome wraps and token binding explains its scene prerequisite. Existing guest E2E readiness checks now use HP instead of a button no longer offered to guests. The Polish action assertion uses the correct accusative “Siłę”.

## Validation results

| Layer | Observed result |
| --- | --- |
| Frontend unit | 529 passed |
| Frontend browser | Full run: 549 passed, one consumable-pip click timed out waiting for animation stability. The affected file passed all four tests on an isolated rerun. All new Owlbear tests passed. |
| Backend unit, Node 22 Docker | 451 passed; one file hit the extra 30-second diagnostic cap during concurrent local runs. That file passed all 18 tests when rerun without the extra cap. No backend unit assertion failed. |
| Real API integration | Full suite: 75 passed. The extended Owlbear rejection/new-session/retry/persistence cases also passed after the final recovery changes. |
| First-party E2E | Full final run: 56 passed, three guest startup/editing timeouts. All three passed serially with other suites finished, in 52.1 seconds. The earlier private-class link regression was repaired and passed its real-browser rerun. |
| Real Owlbear host | GM sign-in/admission, player roll, HP save, reopen, EN/PL, GM roster and full-sheet handoff passed using the local frontend build with the real canary API. |
| Static checks | Frontend/backend TypeScript and frontend production build passed. Frontend lint: zero errors, 19 existing warnings. Generated OpenAPI output matched the new request schema. |
| React Doctor | Full score 62, matching the documented baseline. The final changed-code scan reported no issues. |

The broad-run timeouts and isolated reruns are recorded separately rather than presented as one clean full-suite run. Avoid running several browser suites, Docker tests and health scans concurrently when reproducing these checks on a workstation.

The composed recovery regression uses the real repository, editor, request middleware, auth/query/history hooks and sheet UI, substituting only HTTP and the external popup. It also verifies cancelled sign-in retains the edit and a second expiry can recover in the same mounted sheet. The API suite independently validates ownership and persistence with real Fastify, shared-auth, Prisma and PostgreSQL. The compact matrix covers player sheets, GM rosters, class picking and GM/player enemy views in EN/PL with inherited light/dark CSS color schemes.

## Standards

Zero remaining findings. Both review passes preserved backend layering, component layout, synchronized translations and changelog conventions, including the repository's documented deviations.

## Spec

Zero remaining actionable implementation findings after correcting routed links, composing the save-recovery sequence and expanding the compact view matrix. The approved scenarios and the explicit host release gates are mapped in the runbook.

Review totals: Standards 0; Spec 0. Neither axis has an outstanding issue.

## Remaining release gates

This is local implementation validation, not a deployed-canary or production sign-off. Merge/deploy the fix, refresh the installed manifest, and run the live suite without `OWLBEAR_LOCAL_DIST`. Then verify actual scene token selection/context menus, host popup policies/session recovery, GM/player behavior and Owlbear-selected light/dark themes. CSS color-scheme tests and mocked SDK boundaries do not replace those host checks.

Before/after screenshots are embedded in RPG-326. Credentials and browser authentication state are not committed; `.owlbear_account` is gitignored. Live test runs leave their named QA scvms in the designated room, as documented in the runbook.

## PR review follow-up

All six comments on `e63e3e3d` are addressed. Editor queues, optimistic copies, failed-save requests and callbacks are scoped to their original character. Switching sheets preserves a failed save for recovery on that scvm; a late response cannot clear another scvm's edits. Previous-locale placeholder data is retained only for the same character. After a 401, edits stay queued and navigation or unmount cannot silently retry; explicit recovery resends the original body and save ID before later edits.

Owlbear expiry and recovery keep `/obr.html`, room/scvm parameters and the view hash. Classless-only pools offer the explicit Classless action without an invalid Random roll; empty disabled pools explain why rolling is unavailable. Room summaries describe all four combinations of named classes and Classless in EN/PL. Live-room screenshots and Playwright output under `output/playwright/owlbear-live/` are ignored, verified with `git check-ignore`.

Follow-up validation: all **534 frontend unit tests**, **559 browser tests** (112 files, retries disabled), and **452 backend unit tests** passed. Frontend TypeScript, production build and lint passed; lint retains the same 19 baseline warnings. Full React Doctor remains **62**; the changed-code scan reported no issues. The native Node 24 backend run stalled in module mocks and was stopped; the complete passing backend run used Node 22 Docker with read-only source mounts and no network. An initial approval-service usage-limit error cleared after its reset window; no checks remain blocked by it.

The follow-up Standards and Spec reviews each reported **zero remaining findings**. The deployed Owlbear release gates above still apply; no deployment or new real-room run was performed for this review follow-up.
