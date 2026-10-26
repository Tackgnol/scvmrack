# Canary release fixes — 26 October 2026

Branch: `codex/canary-release-fixes`, based on `dev`. Scope: RPG-337, RPG-338, RPG-339 and the five response-contract gaps from the 479-case canary CATS run. The contrast/footer work remains separate in PR #64.

## Behavior and boundaries

- **RPG-337:** shared-auth 2.0.1 stops treating `Window.closed` as cancellation. The initiating extension offers explicit cancellation using an AbortSignal; cancellation interrupts held requests and delays, preserves the original error even if the host rejects window closure, and cancels the registered proof. Code approval, expiry, recipient secrets, identity verification, quarantine and one-use redemption remain enforced. A companion shared-auth PR is required; the package candidate remains unpublished because the configured publishing credentials were rejected after publication was authorized.
- **RPG-338:** the recovery banner, tabs and panels share one vertical GM shell. Composed browser tests exercise real pointer clicks, retry, visible comparison code, cancellation and both tabs at 420px in English and Polish.
- **RPG-339:** monitoring prepares its own CSRF protection when enabled, before its first envelope. The transport preserves SDK keepalive options and refreshes once after a 403. Initialization failures are caught; active reports can retry preparation. Public monitoring does not bootstrap an anonymous account or bypass CSRF.
- **CATS contracts:** add class-list/detail validation responses, a complete catalog-row union, health bodies and room binding bodies. Reuse participation binding definitions so nullable connection/player fields and token generations remain consistent. Generated client changes are limited to these five paths.

The 12 native browser protocol checks cover Chromium, Firefox and WebKit using real shared-auth HTTP, a memory auth adapter, the installed Sentry SDK, the protected tunnel, and local provider/GlitchTip fixtures. The isolated popup actually reports a closed handle while its page stays interactive; approval follows several pending polls. See [protocol suite](../../backend/tests/protocol/README.md). Real PostgreSQL integration tests separately cover ownership transfer and binding contracts.

Review caught and corrected a missing Cancel control while registration is still pending. The composed GM test now cancels both registration and code waiting before a successful retry, in both languages.

## Verification

- Shared-auth: build and 129 tests pass. Candidate archive SHA-1: `101aba655ca1974275e1155d23035fda877d798f`. It is installed locally from the archive. Publication was authorized, but GitHub rejected the existing credentials: Scvmrack's npm configuration received 403 (insufficient scope), and the shared-auth project's configuration received 401. A subsequent registry query confirmed that 2.0.1 is absent. A valid package-write credential is required before registry installation and CI can be verified. Companion: [shared-auth PR #9](https://github.com/Tackgnol/rpgtools-shared-auth/pull/9).
- Backend: all 463 unit tests and 88 PostgreSQL/HTTP integration tests pass.
- Frontend: all 539 unit tests and 581 browser tests pass; 28 affected component tests pass again after the registration-cancellation review correction. Type checks, lint and production build pass. Lint retains 19 existing warnings; React Doctor remains 64.
- Browser protocols: 12 checks pass across Chromium, Firefox and WebKit, without retries. Fixtures use the installed candidate; the compiled popup helper matches the archive.
- Whole-app E2E: all 68 tests pass using a fresh runner built from committed sources, covering guest and signed-in character flows, persistence, custom classes, parties, Owlbear handoff and room participation. After the final registration-cancellation UI correction, all seven affected guest handoff and signed-in auth E2E tests pass again against the updated web container.
- Standards review: no actionable findings. Spec review: the registration-cancellation finding was corrected and the final recheck passed. Neither axis has remaining actionable findings.

The first integration attempt ran before the restarted API was ready; the normal health gate preceded the successful full run. An existing E2E runner image contained stale tests; it was replaced with an image built from the committed tracked test sources. Those orchestration attempts are retained in local logs and are not counted as candidate passes.

## CATS contract verification

Replayed only the five changed GET endpoints against the isolated local API and database: 22 OpenAPI 3.1 cases plus six OpenAPI 3.0 numeric boundary cases. Raw results: 18 successes, 10 errors, zero warnings. The 10 errors are expected fuzzer-status assumptions: optional invalid values correctly return 400, invented invite context returns 410, and synthetic class resources return 404. All 28 actual response bodies were independently validated against their declared status schema: zero undocumented statuses, zero invalid bodies and zero 5xx responses. The numeric pass was six successes.

Contracts, raw CATS reports and per-case validation are retained locally under `output/playwright/canary-release-fixes/cats/`. This candidate verification does not change the earlier canary run's raw results.

## Release limits

This is local candidate verification. The final deployed Logto/Owlbear journey still needs a canary retest. The monitoring fixture proves protected local ingestion during an in-flight navigation; it does not establish production GlitchTip ingestion, guarantee every event created during unload, or cover actual macOS/iOS Safari. Browser keepalive limits remain. No merge, deployment or package publication is included.
