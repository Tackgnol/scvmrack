# How does forging from Owlbear in a new tab keep the player's identity?

Type: grilling
Status: resolved

## Question

`Forge scvm` opens a new top-level tab, which gets a different (unpartitioned) cookie jar from the Owlbear iframe's CHIPS-partitioned one, so an anonymous player's forged character lands in a different session. The RPG-68 spike (`docs/superpowers/research/2026-09-13-rpg-68-anonymous-obr-handoff.md`) recommends extending the `obr-exchange` session bridge. Decide whether forging must happen in the new tab via that bridge, move into the iframe, or require sign-in, given that party forges now carry the room/party context.

## Answer

Grilled 2026-09-27. The RPG-68 bridge the question refers to is already built:
- `obrExchange: { allowAnonymousIssue: true }` in `backend/src/plugins/rpgtools-auth.ts`
- the `/obr-open` route
- `ObrLayout.tsx` opening `/obr-open?token=…&character=…` to carry a guest's Owlbear identity into a new tab

This ticket reuses it for forging.

- **Forging happens in the new tab, through the existing bridge.** "Forge scvm" mints an exchange token in the panel and opens `/obr-open?token=…&to=forge&obrRoom=…&obrPlayer=…`. The bridge redeems the token, so the tab runs as the same guest or user as the Owlbear panel, scrubs the token from the address bar, then goes to `/character/create?obrRoom=…&obrPlayer=…`. There, ticket 13's room-scoped create, join and bind finishes the forge. Signed-in players go through the same bridge.
- **The panel learns about it from the binding**: the Owlbear panel refetches its player binding when it regains focus or becomes visible, and shows the new scvm. The new tab ends on "Forged. Back to Owlbear". There's no messaging channel between the tab and the panel.
- **Fail loud on a different signed-in account**: if the new tab already holds a signed-in (non-guest) session that differs from the Owlbear identity, the bridge stops and asks: "You're signed in here as A, but Owlbear uses a different identity. Forge as the Owlbear identity (signs A out in this browser), or cancel." It never swaps accounts silently.
- **Failures reuse what exists**: an expired or reused token (60-second, single-use, redeemed as the tab loads) shows the bridge's existing failure screen ("go back to Owlbear and try again"), and a blocked popup shows the existing fallback link.
