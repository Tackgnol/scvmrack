# Owlbear lifecycle verification — 25 October 2026

Application branch: `codex/obr-participation-lifecycle`, based on `dev`.
Shared-auth branch: `codex/obr-approved-handoff`, PR [rpgtools-shared-auth #8](https://github.com/Tackgnol/rpgtools-shared-auth/pull/8), reviewed through `6de36c1`.

The shared-auth 2.0.0 archive is **unpublished**, as requested by the maintainer. The application draft depends on publishing that exact reviewed archive (or regenerating the locks for the final release artifact). Local checks used the actual package archive; registry CI cannot install it until publication. Neither branch has been merged or deployed.

## Results

| Check | Result | Local evidence |
| --- | --- | --- |
| Shared-auth complete TypeScript check, including tests | Pass | package npx tsc --noEmit -p . |
| Shared-auth build | Pass | package `npm run build` |
| Shared-auth full suite | 127/127 | `.worktrees/shared-auth-lifecycle/.scratch/pr8-rereview-tests.log` |
| Final backend/frontend TypeScript checks | Pass | `npx tsc --noEmit` in each app |
| Backend full unit suite, Node 22.23.4 | 456/456 | `output/obr-lifecycle-backend-unit.log` |
| Assignment/party unit recheck after review | 81/81 | `output/obr-lifecycle-backend-unit-final-recheck.log` |
| Frontend full unit suite | 522/522 | `output/obr-lifecycle-unit-final.log` |
| Full PostgreSQL/API suite | 84/84 | `output/obr-lifecycle-integration-complete.log` |
| Room/auth real API recheck with reviewed package | 12/12 | `output/obr-lifecycle-pr8-integration.log` |
| Final package re-review API/database recheck | 12/12 | `output/obr-lifecycle-rereview-integration.log` |
| Full browser component suite | 580 passed; one card timing failure | `output/obr-lifecycle-browser-final.log` |
| Card-file isolated rerun | 4/4 | `output/obr-lifecycle-card-recheck.log` |
| Final sheet/GM component recheck | 27/27 | `output/obr-lifecycle-browser-bind-final.log` |
| Full end-to-end suite | 65/65 | `output/obr-lifecycle-e2e-final.log` |
| Reviewed code-entry, tab and room E2E recheck | 7/7 | `output/obr-lifecycle-pr8-e2e.log` |
| Frontend production build | Pass; existing large-chunk warning | `output/obr-lifecycle-pr8-build.log` |
| Frontend lint | 0 errors, 19 existing warnings | `output/obr-lifecycle-review-lint.log` |
| React Doctor | 64/100, matching recent baseline | `output/obr-lifecycle-pr8-doctor.log` |

The component timeout was in the unchanged `ObrCard` modifier-details case; its entire four-test file passed on isolated rerun. This was not a completely green single component-suite invocation. A repeated integration run also exposed a fixed-ID moderator fixture collision; the fixture now reuses the configured test moderator, and the complete 84-test run passes.

The E2E suite uses the real application/API/PostgreSQL. The room contracts replace only the external Owlbear SDK boundary. The popup contracts replace only the external Logto redirect with an identity fixture; provider sign-in and real live-room deployment still need canary verification after release.

## Standards

The review found one documented-standard breach: approval server state lived in an effect. It now uses a handoff-keyed TanStack query. The SDK cache projection remains a controlled compatibility seam: version 0.1.1 is pinned, the bridge is isolated, and its upgrade contract includes the live-join browser scenario. Re-review found no remaining hard standards finding.

## Spec

Review found assignment claiming outside the revocation transaction and stale SDK writes after rejoin. Claim read/check/ownership transfer now share the room lock. Binding captures token IDs once; bind, unbind and removal cleanup reconcile character ID and generation together against current server state after SDK writes. Held-response and reopened-cleanup browser contracts pass. Re-review closed both findings.

Maintainer review of shared-auth also removed approval-page code disclosure, added malformed/legacy-row validation, tightened registration limits, covered wrong secrets/account/code/origin/expiry/rejection, fixed popup close/retry behavior, and bounded all sign-in HTTP operations. Package-owned tests now cover spoofed source/origin/nonce messages, timeout cleanup, a held poll and cancellation, and a late approval. No package was published.

## Canary CATS

The independently requested bounded CATS run completed 364 cases against the existing canary: no 5xx, 429, transport failures or confirmed application defect. It covered 23 GET operations and eight character-edit fields; disposable characters were deleted. Authentication/validation/schema diagnostics were triaged separately. Evidence is in `output/playwright/canary-20261025-cats/report.md`, `summary.json` and `triage.json`.

CATS tested the deployed canary preceding these changes. It does not verify the unpublished candidate or substitute for the live two-account/Owlbear checklist in `owlbear-lifecycle-rollout.md`.

## Candidate archive

SHA-1: `a1f7068b8996a8cd1dee361a1aef703d3ce00d24`. The allowlist contains 62 files, limited to built entrypoints, README and package metadata. The archive contains no source tests, scratch files or credentials.

The final re-review removes the duplicate Better Auth registration cap; Fastify retains the visitor-aware 10/min limit. The regression explicitly enables Better Auth production limiting. Test fixtures now pass full TypeScript checking, including the previously excluded tests. Standards and spec re-review found no remaining findings in this delta.
