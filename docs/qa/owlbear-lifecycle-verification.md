# Owlbear lifecycle verification — 26 October 2026

Application branch: `codex/obr-participation-lifecycle`, based on `dev`.
Shared-auth branch: `codex/obr-approved-handoff`, PR [rpgtools-shared-auth #8](https://github.com/Tackgnol/rpgtools-shared-auth/pull/8), reviewed through `6de36c1`.

Shared-auth PR #8 is merged as `c294292`; its tree matches the reviewed candidate exactly. With the maintainer's explicit approval, the tested 2.0.0 archive was published to the private registry. The registry SHA-1 and integrity match the application lockfiles exactly. The application PR targets `dev`; it has not been merged or deployed.

## Results

| Check | Result | Local evidence |
| --- | --- | --- |
| Shared-auth complete TypeScript check, including tests | Pass | package npx tsc --noEmit -p . |
| Shared-auth build | Pass | package `npm run build` |
| Shared-auth full suite | 127/127 | `.worktrees/shared-auth-lifecycle/.scratch/pr8-rereview-tests.log` |
| Final backend/frontend TypeScript checks | Pass | `npx tsc --noEmit` in each app |
| Clean backend/frontend registry installs | Pass | `npm ci --ignore-scripts --no-audit --no-fund --prefer-online`; backend Prisma generated separately |
| Backend full unit suite, Node 22.23.4 | 462/462 | `output/pr63-review-backend-unit-node22.log` |
| Backend full unit suite without database configuration | 462/462 | `output/pr63-review-backend-clean-env.log`; database variables removed, working directory `/tmp` |
| Assignment/party unit recheck after review | 81/81 | `output/obr-lifecycle-backend-unit-final-recheck.log` |
| Frontend full unit suite | 539/539 | `output/pr63-review-frontend-unit-complete.log` |
| Frontend full unit suite without local env files | 539/539 | `output/pr63-review-frontend-clean-env.log`; temporary Vite runner used `envDir: false` |
| Full PostgreSQL/API suite | 85/85 | `output/pr63-review-integration-all.log` |
| Room/auth real API recheck with reviewed package | 12/12 | `output/obr-lifecycle-pr8-integration.log` |
| Final package re-review API/database recheck | 12/12 | `output/obr-lifecycle-rereview-integration.log` |
| Full browser component suite | 581/581 | `output/pr63-review-browser-all.log` |
| Card-file isolated rerun | 4/4 | `output/obr-lifecycle-card-recheck.log` |
| Final sheet/GM component recheck | 27/27 | `output/obr-lifecycle-browser-bind-final.log` |
| Full end-to-end suite | 68/68 | `output/pr63-review-e2e-all.log` |
| Reviewed code-entry, tab and room E2E recheck | 7/7 | `output/obr-lifecycle-pr8-e2e.log` |
| Frontend production build | Pass; existing large-chunk warning | `output/pr63-review-build-complete.log` |
| Frontend lint | 0 errors, 19 existing warnings | `output/pr63-review-lint-complete.log` |
| React Doctor | 64/100, matching recent baseline | `output/pr63-review-doctor-final.log` |

An earlier component run timed out in the unchanged `ObrCard` modifier-details case; the final full 581-test run passes, including that file. A repeated integration run also exposed a fixed-ID moderator fixture collision; the fixture now reuses the configured test moderator, and the complete 85-test run passes. The host Node 24 full backend run stalled; the complete suite passed in the supported Node 22.23.4 runtime.

The E2E suite uses the real application/API/PostgreSQL. The room contracts replace only the external Owlbear SDK boundary. The popup contracts replace only the external Logto redirect with an identity fixture; provider sign-in and real live-room deployment still need canary verification after release.

The receiver failure cases also inject faults at the opener/HTTP transport boundaries: an incorrect declared identity, a malformed body after a real redemption, and one failed sign-out response followed by successful real revocation. No account creation, redemption or game-state success response is fabricated. A failed revocation clears local credentials immediately and persists quarantine across reload; auth reads, bootstrap, API requests and cookie-only party streams remain blocked until recovery succeeds. Sign-out is bounded to two seconds and the receiving page offers a retry.

## Standards

The review found one documented-standard breach: approval server state lived in an effect. It now uses a handoff-keyed TanStack query. The SDK cache projection remains a controlled compatibility seam: version 0.1.1 is pinned, the bridge is isolated, and its upgrade contract includes the live-join browser scenario. Re-review found no remaining hard standards finding.

PR #63 review corrections move controllers into `routes/obr/`, schemas into `schemas/obr.ts`, and share the route limit, query-key factories, error conversion and sign-in code component. The approval form uses React Hook Form/Zod and one status union. Six repository-mocked service cases cover member/binding removal, receipt replay, denials, fresh generations, an assignment after departure and server failure. Hook unit cases cover operation-ID reuse and scene cleanup failures/retries. Destination validation has ten unit cases. Formatting and legacy names/comments are corrected.

The clean-checkout re-review found two test fixture dependencies that the initial local environment masked. The claim-route unit test now mocks the unrelated room-participation service before route registration, preventing a Prisma import. Shared frontend test setup now supplies the API URL before test-module imports, rather than in a later `beforeAll`. Both failures were reproduced without local configuration, then both full unit suites passed in those configurations. These corrections change test setup only.

## Spec

Review found assignment claiming outside the revocation transaction and stale SDK writes after rejoin. Claim read/check/ownership transfer now share the room lock. Binding captures token IDs once; bind, unbind and removal cleanup reconcile character ID and generation together against current server state after SDK writes. Held-response and reopened-cleanup browser contracts pass. Re-review closed both findings.

The late-arrival browser case now creates player and token bindings after the GM panel opens, removes both plus membership with one click, and preserves the owned character. A real API regression confirms quick roll and forge confirmation already persist the player's assignment transactionally, without a mount-time write. Forge preloads the room actor so its click reserves a tab before any SDK await; actual Safari popup behavior remains a live-browser check. Cleanup after commit, attached-room leave/kick reuse and durable receipt retention are deliberate choices documented in `owlbear-lifecycle-rollout.md`. Final standards and spec re-review closed the additional receiver failure-path and cookie-only stream findings.

A temporary WebKit component probe did not provide a reliable first-click popup oracle: the result changed after a plain control-button interaction in the Vitest frame. The exploratory test was removed; no Safari verification is claimed. Confirm the first Forge click in actual Safari inside the live Owlbear room before treating that browser/host combination as verified.

Maintainer review of shared-auth also removed approval-page code disclosure, added malformed/legacy-row validation, tightened registration limits, covered wrong secrets/account/code/origin/expiry/rejection, fixed popup close/retry behavior, and bounded all sign-in HTTP operations. Package-owned tests now cover spoofed source/origin/nonce messages, timeout cleanup, a held poll and cancellation, and a late approval. The tested archive was published after the maintainer merged the package PR and explicitly approved publication.

## Canary CATS

The independently requested bounded CATS run completed 364 cases against the existing canary: no 5xx, 429, transport failures or confirmed application defect. It covered 23 GET operations and eight character-edit fields; disposable characters were deleted. Authentication/validation/schema diagnostics were triaged separately. Evidence is in `output/playwright/canary-20261025-cats/report.md`, `summary.json` and `triage.json`.

CATS tested the deployed canary preceding these changes. It does not verify this application candidate or substitute for the live two-account/Owlbear checklist in `owlbear-lifecycle-rollout.md`.

## Candidate archive

SHA-1: `a1f7068b8996a8cd1dee361a1aef703d3ce00d24`. The allowlist contains 62 files, limited to built entrypoints, README and package metadata. The archive contains no source tests, scratch files or credentials.

The final re-review removes the duplicate Better Auth registration cap; Fastify retains the visitor-aware 10/min limit. The regression explicitly enables Better Auth production limiting. Test fixtures now pass full TypeScript checking, including the previously excluded tests. Standards and spec re-review found no remaining findings in this delta.
