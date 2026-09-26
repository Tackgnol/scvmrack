# How do Owlbear's Roll and Forge use the room party's pool and join in one step?

Type: grilling
Status: open
Blocked by: 11

## Question

Apply the party-aware generation rules (ticket 05) to Owlbear. The player panel offers `Roll a scvm` (rolls in the iframe, party-unaware) and `Forge scvm` (opens `/character/create` in a new tab with no room or party context). Decide how both key off the room id (already an accepted capability for room-scoped endpoints) to use the room party's Party Class Pool, go through the class screen like the web join flow, and create + join/bind in one transaction; and what happens in rooms with no party.
