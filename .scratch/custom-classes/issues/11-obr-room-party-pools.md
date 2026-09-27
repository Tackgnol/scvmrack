# Which Party Class Pool does an Owlbear room party owned by `system:obr-room` use?

Type: grilling
Status: resolved

## Question

Room parties can be system-owned with no signed-in GM. Decide whether they roll Book Classes only until a signed-in GM claims the party, and how the pool behaves across claim and room re-attach. Roll/Forge mechanics in rooms are tickets 13 and 14.

## Answer

Grilled 2026-09-27, against `party-service.ts` (`promoteRoom`, `attachRoom`, `detachRoom`).

- **Unclaimed room parties** (owner `system:obr-room`) roll from the **default pool**: Book Classes on, Zine and Rack Classes off, classless on. With no GM, nobody can change it, so it never holds a Custom Class.
- **Claim**: when a signed-in GM claims the room party through `/promote`, the party keeps the default pool as its starting point. From then on the GM edits the pool in the GM screen like any of their parties, including their Custom Classes. Existing characters are untouched.
- **Attaching a GM's own party to a room with an auto-created party**:
  - If the system party has **no members**, the attach replaces it: the empty system party is deleted and the GM's party (with its pool) takes the room.
  - If it **has members**, the attach stays a 409, with a hint: "Players already joined this room's party. Claim it instead, from inside the room."
  - Players already in a party are never moved.
- **Detach**: the party keeps its pool and characters and rolls through its invite link as usual. The room has no party, and rolling there follows ticket 13's "room with no party" rule.
- **Room trust**: anyone holding the room id can see the full content of the room party's pool, Custom Classes included. It's accepted as part of the existing room-trust residual (and matches ticket 05's accepted invite-link visibility). `CLAUDE.md`'s security table gets "Party Class Pool content" added to its OBR row when this ships (ticket 22).
