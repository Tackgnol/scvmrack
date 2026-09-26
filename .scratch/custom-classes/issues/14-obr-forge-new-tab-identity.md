# How does forging from Owlbear in a new tab keep the player's identity?

Type: grilling
Status: open

## Question

`Forge scvm` opens a new top-level tab, which gets a different (unpartitioned) cookie jar from the Owlbear iframe's CHIPS-partitioned one, so an anonymous player's forged character lands in a different session. The RPG-68 spike (`docs/superpowers/research/2026-09-13-rpg-68-anonymous-obr-handoff.md`) recommends extending the `obr-exchange` session bridge. Decide whether forging must happen in the new tab via that bridge, move into the iframe, or require sign-in, given that party forges now carry the room/party context.
