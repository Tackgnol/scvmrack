# Owlbear participation and approved sign-in rollout

This change addresses RPG-336 (partial roster removal) and RPG-323 (unapproved account transfer). The approved scenarios are in `features/owlbear-gm-bindings.feature` and `features/owlbear-auth-handoff.feature`.

## Boundaries

The application owns room participation. A room transaction reads current membership and bindings, checks the actor, removes both, and records the operation and pending scene cleanup together. Replaying the same operation cannot remove a later rejoin. Normal party kick and self-leave use this command for attached rooms. The character itself is preserved. Attachment, joins and binding writes take the same room lock.

The participation response is the authoritative roster snapshot. Party SSE refreshes it; the Owlbear SDK binding cache is a derived projection. Signing in refreshes auth and room queries centrally and reconnects the party stream with the current bearer. Character editing retains its existing optimistic save queue.

Shared-auth 2.0 owns handoff registration, approval, cancellation, expiry and atomic redemption. The extension keeps a server-issued secret in memory. The first-party approval page shows the account and comparison code, requires a deliberate approval, and binds that approval to the account displayed. The extension reports completion only after reading its receiving identity. A copied callback URL cannot redeem the account. Full-sheet, forge and class tabs use an opener/origin-bound message exchange with a receiving secret; credentials never appear in their URLs. A different existing first-party account requires confirmation before replacement.

## Coordinated upgrade

1. Review and release the shared-auth 2.0 candidate first. The application dependency must be updated to the published artifact and its registry integrity before merging the application PR. The old client API is intentionally incompatible.
2. Apply `backend/prisma/migrations/20261025000000_room_participation/migration.sql` with the normal Prisma deploy flow, before starting the new API. It adds token generations, operation receipts and pending scene cleanup; it does not delete existing bindings or members.
3. Deploy the matching backend and frontend together. Old automatic handoff publication fails closed with 410. Ask users to reload old embedded panels after the upgrade.
4. Run the live canary scenarios below before promoting to stage/production. Local contract tests replace only the external Logto/Owlbear SDK boundary; they do not prove a live provider or room deployment.

Rollback must keep the new handoff endpoints closed: rolling back to the old shared-auth package reintroduces the security defect. Prefer reverting the application UI while keeping the fixed auth server. The additive database columns/tables can remain during a rollback.

## Existing data preview

Review suspected legacy orphans without changing data:

```sql
SELECT b.obr_room_id, b.character_id, c.party_id, p.id AS attached_party_id
FROM obr_token_character_bindings b
JOIN characters c ON c.id = b.character_id
LEFT JOIN parties p ON p.obr_room_id = b.obr_room_id
WHERE c.party_id IS DISTINCT FROM p.id;
```

A bound character outside the party can be intentional. Do not bulk-delete these rows. The owning GM can remove a selected legacy entry through the room command; unrelated accounts and other rooms cannot use this recovery.

Pending cleanup survives closing/reopening the panel. With the original scene open, retry clears only matching old token metadata and acknowledges the task. A new binding generation is preserved. A missing token stays pending because the application cannot distinguish a deleted token from one in another scene. No automatic database purge guesses that distinction. Visual labels remain an Owlbear SDK concern; the authoritative backend binding and character metadata determine access/binding state.

## Verification map

- `backend/tests/integration-be/src/owlbear-table.integration.test.ts`: real HTTP/auth/PostgreSQL; stale roster removal, normal kick/leave, denials, replay, new generations, cancellation/expiry, ownership carryover, concurrent single redemption and receiving-secret checks.
- `backend/tests/e2e/tests/authed/obr-participation.spec.ts`: real roster UI/API/database, external SDK surrogate; scene failure, reopen/retry, actual metadata cleanup and live party join/removal.
- `backend/tests/e2e/tests/authed/obr-auth-lifecycle.spec.ts`: real shared-auth HTTP and browser tabs; explicit approval, two distinct accounts, inherited session storage, popup cancellation and verified receiving identity. Only external Logto redirects use a local identity fixture.
- `backend/tests/e2e/tests/guest/obr-handoff.spec.ts`: real full-sheet tab transfer; editable guest character and copied-link rejection.
- Shared-auth `src/tests/plugin.test.ts`: public HTTP protocol checks with the supported adapter; `client.test.ts` covers client wire contracts.

The old tests that asserted client-side kick/unbind ordering, automatic callback publication or token-bearing URLs have been replaced by these public lifecycle contracts. Existing sheet/layout/control component tests continue to cover presentation.

## Live canary checklist

Use two separate test accounts. Verify a new party join appears in an already-open GM panel and can be removed once; then exercise normal kick, self-leave and intentional rejoin. Interrupt scene access during removal and finish cleanup after reopening the original scene. Confirm an unrelated account cannot mutate the room.

Sign in from an anonymous embedded panel, compare the code, approve the displayed account and verify ownership carryover. Cancel/close once, then retry. Open a full sheet, a private custom class and the forge. A different account already signed into the receiving tab must prompt before switching. A copied URL and a legacy automatic callback must fail without adopting an account.
