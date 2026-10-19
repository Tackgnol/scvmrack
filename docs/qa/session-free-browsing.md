# Session-free browsing pilot (RPG-294)

Owner approved the scenarios in `features/session-free-browsing.feature` and the Scvm Rack-only implementation on 19 October 2026. This supersedes the planning map's earlier no-implementation boundary for this pilot. Other apps and production deployment remain outside this PR.

## Route and action contract

| Entry or action | Session behavior |
| --- | --- |
| Landing, FAQ, legal information, Updates, Owlbear guide, GM preview, public class detail | Read an existing session; never mint a guest. Sessionless navigation makes no private-list or character/draft requests. |
| Storage acknowledgement | Allows storage-dependent actions; does not itself activate a session on a public page. |
| `/character/create` | Class selection remains public. Starting a draft awaits a usable existing or new guest session. Stored drafts resume after storage acknowledgement. |
| `/character` or `/character/new` | Direct entry is an explicit roll/open-sheet action. After acknowledgement, read or establish a session, recover an existing scvm, otherwise create one. |
| Private character link | Await the existing-session read. Without a session, show recovery without creating a replacement owner. With a session, keep the normal ownership checks. |
| Saved-character list and GM tools | Sessionless visitors see the existing account-required view; no anonymous session is created. |
| Public report submission | Stays session-free and uses the existing CSRF and rate-limit controls. |
| Party invitation / party forge | Keep the invite flow's awaited session boundary and party membership checks. |
| Sign-out / expiry | Sign-out returns to public browsing. Known guest/account recovery is preserved. Unknown-session expiry returns to the landing page instead of silently creating an owner. |
| Print | Uses an existing session; does not activate one. |
| Owlbear panel and exchange | The panel explicitly opts into its existing guest lifecycle. Exchange tokens still redeem before anonymous bootstrap and private sheet loading. |

`isGuest` means an established anonymous owner. A visitor with no session is separately exposed as `isSessionless`; it must not enable guest replacement protection or private queries.

## Ownership and monitoring

The pilot uses the existing app-local auth helper and shared-auth's existing endpoints. Concurrent creation actions share only an in-flight bootstrap promise; no successful session is held globally for later owners. Public composition and route policy stay app-local. No new package, shared-auth release or other-app adoption is included. The RPG-296 audit found Murmur affected, Roster and Constancia structurally safe for this trigger, and the remaining consumers unverified; those are later efforts.

The crawler hint is used only for telemetry, never authorization. See `../monitoring.md` for the raw User-Agent and explicit outcome policy. Failed/ambiguous verification remains observable. This change removes mandatory sessions; it does not promise indexing or change the SPA rendering stack.

## Validation and release handoff

- Auth API/hook tests cover sessionless consumers, concurrent bootstrap, cookie/tab-token recovery, failed session verification and no retries of a 429.
- Draft tests cover waiting for a usable session. Existing character editor, invite and Owlbear tests remain the regression coverage for those flows.
- `backend/tests/e2e/tests/guest/session-free-browsing.spec.ts` drives the full provider/router tree with intercepted APIs; it can run against local Vite without a database. The existing database-backed home and character-create tests cover persisted creation/ownership when Docker is available.
- Outgoing-event fixtures use Googlebot, bingbot and meta-webindexer raw User-Agent headers without parsed contexts, and retain public rendering, chunk, server, unknown-client and ordinary-browser auth failures.
- Run the repository frontend checklist and preserve the React Doctor baseline of 62. Run Docker integration and full E2E in CI when unavailable locally.
- The existing bare `/character` entry currently resolves to the router's explicit trailing-slash 404 surface. This pilot leaves that routing behavior in place and verifies that even `/character?character=<id>` creates no guest; `/character/new?character=<id>` exercises the legacy query-link recovery flow.
- Keep the current 0.7.0 version and existing release integration; this PR does not bump, tag, deploy or change unrelated release work. No new user-facing copy or EN/PL keys are needed.
- After deployment, inspect public pages and navigation from a clean context without creating accounts. Watch anonymous-user growth and auth verification failures alongside public rendering/chunk/server errors; fewer crawler auth events alone is not success. If activation or recovery regresses, revert the pilot commit and retain the incident evidence. Deployment and any rollback require the normal release process.
