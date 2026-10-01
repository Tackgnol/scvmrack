# How do Owlbear's Roll and Forge use the room party's pool and join in one step?

Type: grilling
Status: resolved
Blocked by: 11

## Question

Apply the party-aware generation rules (ticket 05) to Owlbear. The player panel offers `Roll a scvm` (rolls in the iframe, party-unaware) and `Forge scvm` (opens `/character/create` in a new tab with no room or party context). Decide how both key off the room id (already an accepted capability for room-scoped endpoints) to use the room party's Party Class Pool, go through the class screen like the web join flow, and create + join/bind in one transaction; and what happens in rooms with no party.

## Answer

Grilled 2026-09-27, against the code as it stands:
- **Roll** (`ObrCharacterRoute.tsx`, `useCharacterActions.generateNew`) picks a random class 1–6 in the browser, calls `POST /api/characters/new`, then binds the player in a separate call. It never joins the room's party.
- **Forge** is a plain link to `/character/create` with no context.
- **Ticket 05's web join flow** is specified but not built yet: generation endpoints take no token, and create and join are separate calls. **Build tickets 05 and 13 together.**

Decisions:
- **Roll goes through a compact class picker** in the Owlbear popover (420×600): the room pool's classes as small cards with **Random first**, then confirm (two taps for "just roll me something"). It follows ticket 05's rule that every party character sees the pool.
- **One room-scoped create**: an endpoint like `POST /api/obr/rooms/:roomId/players/:playerId/character/new` (`classId` or random), with a matching `GET .../classes` for the picker. In **one transaction** it:
  1. resolves the room's party and Party Class Pool
  2. re-checks the class is in the pool (ticket 05's re-check on confirm, with the same friendly return to the picker)
  3. creates the character
  4. joins the party
  5. binds the player

  It replaces today's create-then-bind pair. The room id is the accepted room-scoped capability.
- **A room with no party** rolls Book Classes only (ticket 05's no-party rule), creates the character without a party, and binds the player as today.
- **A full room party** (`PARTY_MAX_MEMBERS`, default 10, unclaimed system parties included): nothing is created, and the player sees "This room's party is full. Ask the GM to make room." A party room never gets a partyless character.
- **Forge in a new tab** opens `/character/create?obrRoom=<roomId>&obrPlayer=<playerId>`. The forge page shows the room pool in `ClassGate`, and confirm goes through the same room-scoped create, join and bind. Which session the new tab uses is ticket 14.
- **A guest's replace roll** (`replace: true`): if the replaced scvm was in the room's party, it leaves the party the way a deleted character does, and the new one joins in the same transaction.
- **Picking an existing scvm** (signed-in players) stays binding-only: it doesn't join the room's party. Joining a party with an existing character is party behaviour outside this effort.
