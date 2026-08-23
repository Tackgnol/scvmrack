# Owlbear Room Bindings Architecture Plan

> **For agentic workers:** Use TDD. Keep each task independently runnable, and keep controllers thin: repository -> service -> route.

**Goal:** Make scvmrack and Owlbear talk through a reliable room binding module instead of scattered iframe state. Bindings must survive refresh, allow a GM to reassign a scvm when a player loses their Owlbear temp identity, allow reliable unbinds, and make unlogged enemy management possible under an explicit room-trust model.

**Current problem:** OBR item metadata points at scvmrack ids, while backend `Character.obrRoomId` and `Party.obrRoomId` are loose fields. There is no durable interface for "this room player/token is assigned to this scvm." Refresh falls back to browser/session state, and GM recovery has no backend seam.

**Architecture:** Add an **Owlbear Room Binding** module. Owlbear metadata stays a fast live pointer for the extension UI; scvmrack stores durable room-scoped bindings and safe projections. The module owns the Interface between `roomId`, `playerId`, `connectionId`, `tokenId`, `characterId`, `enemyId`, and party/enemy reads.

## Decisions

- **Owlbear is not the owner of characters.** Characters remain scvmrack-owned by account/anonymous session. Owlbear gets room-scoped bindings to those characters.
- **Room-scoped access is table-trust, not account-grade auth.** A caller presenting `roomId + owlbearPlayerId + role` can operate on scene data. This is acceptable for OBR room collaboration, but must not expose private account-only character fields.
- **GM role is a UI/collaboration input.** The backend cannot cryptographically prove `OBR.player.getRole()`. Endpoints using it are room-management endpoints, not secret-account endpoints.
- **Full character sheets stay owner-gated.** Room APIs return compact safe cards or binding records, never full private character data.
- **Enemies can become unlogged when represented as room-party data.** If the GM wants secret enemy fields protected from players outside table trust, use logged-in durable party ownership. If the GM wants no-login OBR enemies, accept room-scoped trust and keep player projections separate.
- **OBR metadata remains namespaced pointers only.** Token/player metadata should contain ids and status flags, not full stat blocks.

## Target Data Model

Add tables or equivalent Prisma models:

- `ObrRoomBinding`

  - `obrRoomId` unique
  - optional `partyId`
  - `createdAt`, `updatedAt`

- `ObrPlayerCharacterBinding`

  - `obrRoomId`
  - `obrPlayerId`
  - optional `obrConnectionId`
  - `characterId`
  - `assignedByPlayerId`
  - unique `(obrRoomId, obrPlayerId)`

- `ObrTokenCharacterBinding`

  - `obrRoomId`
  - `obrTokenId`
  - `characterId`
  - optional `assignedPlayerId`
  - unique `(obrRoomId, obrTokenId)`
  - index `(obrRoomId, characterId)`

- Optional later: `ObrTokenEnemyBinding`
  - `obrRoomId`
  - `obrTokenId`
  - `enemyId`
  - unique `(obrRoomId, obrTokenId)`

This lets reads answer "which scvms are visible in this room?" without relying on a single mutable `Character.obrRoomId`.

## API Interface

Create `backend/src/routes/obr/index.ts` or a similar room-scoped route module:

- `GET /api/obr/rooms/:roomId/bindings`

  - returns room roster bindings: token id, player id, character safe card, stale flags.

- `PUT /api/obr/rooms/:roomId/players/:playerId/character`

  - body: `{ characterId, connectionId? }`
  - used by a player to persist their active scvm and by a GM to reassign.

- `DELETE /api/obr/rooms/:roomId/players/:playerId/character`

  - clears stale player assignment.

- `PUT /api/obr/rooms/:roomId/tokens/:tokenId/character`

  - body: `{ characterId, playerId? }`
  - durable token bind.

- `DELETE /api/obr/rooms/:roomId/tokens/:tokenId/character`

  - durable token unbind.

- `GET /api/obr/rooms/:roomId/cards`
  - returns safe character cards for currently bound token/player assignments.

Enemy routes should either be moved under `/api/obr/rooms/:roomId/enemies` or keep the existing party route while accepting a room actor for OBR-local management.

## Frontend Module

Create `frontend/src/obr/roomBinding.ts` as the single adapter for OBR room/player/token binding.

Responsibilities:

- read/write active character id in `OBR.player.metadata`
- read/write token pointer in item metadata
- call backend room-binding endpoints
- broadcast `roster` or `enemies` refresh pings
- expose pure helpers for tests

The UI should call this adapter instead of individually calling `OBR.player`, `OBR.scene.items`, and `/api/characters/:id/obr-room`.

## TDD Tasks

- [x] **Task 1: Persist active player scvm across refresh.**

  - Done in the first small patch: `PLAYER_CHARACTER_META_KEY` + `playerBinding.ts` + route restore tests.

- [x] **Task 2: Introduce backend room binding service.**

  - Repository owns Prisma.
  - Service validates room/player/token ids and returns `ServiceResult`.
  - Route tests cover set/get/delete player and token bindings.

- [x] **Task 3: Replace `Character.obrRoomId` card gate with binding-table gate.**

  - `GET /api/characters/cards` should read ids from `ObrTokenCharacterBinding`/`ObrPlayerCharacterBinding`.
  - Keep backwards compatibility during migration, then remove `Character.obrRoomId`.

- [x] **Task 4: Make bind/unbind atomic from the frontend perspective.**

  - Binding writes backend first, then OBR metadata.
  - If OBR metadata write fails after backend success, show recoverable warning and allow retry.
  - Unbind deletes both backend binding and OBR metadata/marker.

- [x] **Task 5: Add GM management UI.**

  - In the GM Party tab, show players, tokens, assigned scvms, and stale bindings.
  - Actions: assign selected scvm to player, bind selected token, unbind token, clear stale assignment.
  - Use compact punk control rows, not modal-heavy forms.

- [x] **Task 6: Support lost Owlbear temp account recovery.**

  - GM can bind a party member scvm to the new OBR player id.
  - The player route restores from player metadata first, then backend player binding, then falls back to roll/pick.

- [x] **Task 7: Make enemies available unlogged in OBR room mode.**

  - Add a room-actor input to enemy service or move OBR enemies under the room binding module.
  - Full GM enemy payload is writable by an OBR GM actor.
  - Player enemy payload remains safe projection.

- [x] **Task 8: Delete dead split-brain code.**
  - Remove `bindObrRoom` and `Character.obrRoomId` after migration.
  - Keep OBR metadata helpers only in the room binding adapter.
  - Update OpenAPI client and browser/backend integration tests.

## Validation Gate

- `cd backend && npm run test:unit`
- `cd backend && npm run test:integration`
- `cd frontend && npm run build`
- `cd frontend && npm run test:browser`
- `cd frontend && npm run lint`

## Risks

- OBR role is not server-verifiable. Do not route private account data through room-management endpoints.
- Player ids can change for temporary Owlbear users. This is why GM reassignment is part of the module, not an edge case.
- Token metadata and backend bindings can drift. The UI must show stale states and provide explicit unbind/repair actions.
