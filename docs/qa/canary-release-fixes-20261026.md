# Canary release fixes — 26 October 2026

Branch: `codex/canary-release-fixes`, based on `dev`. Scope: RPG-337, RPG-338, RPG-339 and the five response-contract gaps from the 479-case canary CATS run. The contrast/footer work remains separate in PR #64.

## Behavior and boundaries

- **RPG-337:** shared-auth 2.1.0 stops treating `Window.closed` as cancellation. The initiating extension offers explicit cancellation using an AbortSignal until redemption begins; cancellation interrupts held registration/polling requests and delays, preserves the original error even if the host rejects window closure, and cancels the registered proof. Once redemption starts, Cancel disappears and caller aborts do not interrupt receiving-identity verification; the deadline still applies. Code approval, expiry, recipient secrets, identity verification, quarantine and one-use redemption remain enforced. A companion shared-auth PR is required; the revised package candidate remains unpublished.
- **RPG-338:** the recovery banner, tabs and panels share one vertical GM shell. Composed browser tests exercise real pointer clicks, retry, visible comparison code, cancellation and both tabs at 420px in English and Polish.
- **RPG-339:** monitoring prepares its own CSRF protection when enabled, before its first envelope. The transport preserves SDK keepalive options and refreshes once after a 403. Initialization failures are caught; active reports can retry preparation. Public monitoring does not bootstrap an anonymous account or bypass CSRF.
- **CATS contracts:** add class-list/detail validation responses, a complete catalog-row union, health bodies and room binding bodies. Reuse participation binding definitions so nullable connection/player fields and token generations remain consistent. Generated client changes are limited to these five paths.

The 18 native browser protocol checks cover Chromium, Firefox and WebKit using real shared-auth HTTP, a memory auth adapter, the installed Sentry SDK, the protected tunnel, and local provider/GlitchTip fixtures. The isolated popup actually reports a closed handle while its page stays interactive; approval follows several pending polls. Aborts after real redemption and confirmation responses still finish with the approved identity and one ownership transfer. See [protocol suite](../../backend/tests/protocol/README.md). Real PostgreSQL integration tests separately cover ownership transfer and binding contracts.

Review caught and corrected a missing Cancel control while registration is still pending. The composed GM test now cancels both registration and code waiting before a successful retry, in both languages.

## Verification

- Shared-auth: build and 133 tests pass. Revised 2.1.0 candidate archive SHA-1: `30d88dcfa8c9d536c5372e1fe2f5260aa2331cd2`. Both app locks install this archive from cache, and their compiled popup helpers match it. The earlier 2.0.1 publication was authorized, but GitHub rejected the existing credentials: Scvmrack's npm configuration received 403 (insufficient scope), and the shared-auth project's configuration received 401. A registry query confirmed that 2.0.1 is absent. Review requested 2.1.0 for the public option and changed cancellation behavior; its README explicitly retires `popup-closed`. Publishing the revised archive requires approval and a valid package-write credential before registry installation and CI can be verified. Companion: [shared-auth PR #9](https://github.com/Tackgnol/rpgtools-shared-auth/pull/9).
- Backend: all 463 unit tests pass with 2.1.0. The initial candidate also passed all 88 PostgreSQL/HTTP integration tests; this follow-up changes no server behavior.
- Frontend: all 539 unit tests pass with 2.1.0. The initial candidate passed all 581 browser tests; all 28 affected component tests pass again after the redemption-cancellation review correction. Type checks, lint and production build pass. Lint retains 19 existing warnings; React Doctor remains 64 with its existing diagnostics.
- Browser protocols: 18 checks pass across Chromium, Firefox and WebKit, without retries. Fixtures use the installed 2.1.0 candidate; the compiled popup helper matches the archive.
- Whole-app E2E: the initial candidate passed all 68 tests using a fresh runner built from committed sources, covering guest and signed-in character flows, persistence, custom classes, parties, Owlbear handoff and room participation. After the 2.1.0 redemption-cancellation correction, all seven affected guest handoff and signed-in auth E2E tests pass again against the updated web container and package archive.
- Standards review: no actionable findings. Spec review: the registration-cancellation finding was corrected and the final recheck passed. Neither axis has remaining actionable findings.

The first integration attempt ran before the restarted API was ready; the normal health gate preceded the successful full run. An existing E2E runner image contained stale tests; it was replaced with an image built from the committed tracked test sources. Those orchestration attempts are retained in local logs and are not counted as candidate passes.

During the 2.1.0 follow-up, copying unit tests into the development API container triggered its file watcher and interrupted the focused E2E run. The stable rerun passed all seven tests. The first backend unit attempt inherited the E2E stack's 1000-fold rate-limit scale and failed its two default-limit assertions; the full rerun with the normal scale passed all 463 tests. These interrupted/misconfigured attempts remain in the local review logs.

## CATS contract verification

Replayed only the five changed GET endpoints against the isolated local API and database: 22 OpenAPI 3.1 cases plus six OpenAPI 3.0 numeric boundary cases. Raw results: 18 successes, 10 errors, zero warnings. The 10 errors are expected fuzzer-status assumptions: optional invalid values correctly return 400, invented invite context returns 410, and synthetic class resources return 404. All 28 actual response bodies were independently validated against their declared status schema: zero undocumented statuses, zero invalid bodies and zero 5xx responses. The numeric pass was six successes.

Contracts, raw CATS reports and per-case validation are retained locally under `output/playwright/canary-release-fixes/cats/`. This candidate verification does not change the earlier canary run's raw results.

## Release limits

This is local candidate verification. The final deployed Logto/Owlbear journey still needs a canary retest. The monitoring fixture proves protected local ingestion during an in-flight navigation; it does not establish production GlitchTip ingestion, guarantee every event created during unload, or cover actual macOS/iOS Safari. Browser keepalive limits remain. No merge, deployment or package publication is included.
