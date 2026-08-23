# Owlbear Room Party Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn the Owlbear Rodeo room itself into a live scvmrack party — players' bound tokens form the roster, the GM sees a roster overview while players see their own sheet, anyone can right-click a token to peek a compact card, and a logged-in GM can graduate the room into a durable scvmrack Party.

**Architecture:** The OBR room *is* the ephemeral party. Membership = the set of scvmrack character ids stamped into scene-item metadata (the existing `CHARACTER_META_KEY` token-binding seam). No new `rodeo_party` table and no new SSE channel: OBR's scene sync + `broadcast` are the realtime transport, and OBR's `getRole()` is the GM toggle. The only durable artifact is the existing `Party` entity, which a logged-in GM can promote the room into via one new nullable `obrRoomId` column. The backend gains exactly one read endpoint (`GET /api/characters/cards`) — a compact projection over the existing `getCharacterFull` — plus the `obrRoomId` column for promotion. Everything else is frontend in the OBR iframe.

**Tech Stack:** Fastify 5 + Prisma + PostgreSQL (backend, Repository→Service→Controller layering); React 18 + `@owlbear-rodeo/sdk` (OBR iframe entry, separate from the main app bundle); Vitest (backend unit) / browser tests (frontend).

**Decisions locked before this plan (do not re-derive):**
- The "ROZŁĄCZONY / disconnected" presence badge is **cut from OBR entirely** — it lives only in the main rack web view. The OBR GM roster shows no presence state. This sidesteps OBR's connection-scoped player-id trap.
- Roster source = **scene-item scan** (`OBR.scene.items` filtered by `CHARACTER_META_KEY`). Requires an active scene, which is fine — binding a scvm already requires selecting a token, so every member already has one.
- The cards endpoint is an **intentional capability-by-UUID read of table-visible fields only** — it is what powers both the GM roster *and* the "view scvm" peek any player can open. It must never return private fields (notes, full storage/inventory secrets). Character ids are unguessable UUIDs; the exposed fields are the same combat stats already drawn on a token at the table.
- OBR `getRole()` is **client-asserted** to our backend, so the GM view stays strictly **read-only**. Spoofing "I'm GM" grants nothing — promotion and any binding still go through the existing server-side ownership checks (`ownsCharacter`).

**Phasing:**
- **Phase 1 (steps 1–4): in-room experience.** Role detection, GM roster vs player sheet, compact-card peek, live sync. Ships standalone and is the bulk of the value.
- **Phase 2 (step 5): promote to scvmrack.** The `obrRoomId` column + "move party to scvmrack" for a logged-in GM.

**Backend testing conventions (match these — NOT vitest):**
- Unit tests live in `backend/tests/unit-be/<name>.test.ts` and run on **`node:test`**: `import { test, beforeEach, mock } from 'node:test'` + `import assert from 'node:assert/strict'`. Module mocking is `mock.module(...)` under `--experimental-test-module-mocks`. **Template to mirror: `backend/tests/unit-be/character-service.test.ts`** (mutable `state` object → repository/lib mocks → service-under-test).
- Run unit tests: `cd backend && npm run test:unit` (whole suite), or a single file: `cd backend && node --import tsx --experimental-test-module-mocks --test tests/unit-be/<name>.test.ts`.
- Integration tests live in `backend/tests/integration-be/src/<name>.integration.test.ts` and run against a real DB via Docker: `cd backend && npm run test:integration`. Template: `backend/tests/integration-be/src/api.integration.test.ts`.
- Services are tested with mocked repository/lib; repositories are intentionally not unit-tested (per CLAUDE.md).

---

## Phase 1 — In-room experience

### Task 1: Backend — compact card projection (pure function)

A pure projection from `getCharacterFull`'s output to the table-visible card DTO. Isolating it as a pure function makes the security allowlist testable without a DB.

**Files:**
- Create: `backend/src/lib/character-card.ts`
- Test: `backend/tests/unit-be/character-card.test.ts`

**Step 1: Write the failing test** (`node:test` + `node:assert`, mirroring the repo convention)

```ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { toCharacterCard } from '../../src/lib/character-card.js';

const full = {
  id: 'c1', name: 'Karg', className: 'Hermetyczny pustelnik',
  strength: 13, agility: 8, presence: 11, toughness: 10,
  currentHp: 2, maxHp: 2, omens: 2, maxOmens: 2, silver: 10,
  drToDodge: 14, drToMelee: 10, drToRanged: 11,
  equippedWeapons: [{ name: 'Kostur', dice: [4] }],
  equippedArmor: { name: null },
  computedModifiers: [],
  bodyDescription: 'gaunt', trait1: 'grim', trait2: 'patient',
  // fields that MUST NOT leak:
  notes: 'secret GM note', storage: [{ key: 'equipment.gold' }],
  equipment: [{ key: 'weapon.dagger' }],
};

test('toCharacterCard projects the table-visible card fields', () => {
  assert.deepEqual(toCharacterCard(full), {
    id: 'c1', name: 'Karg', className: 'Hermetyczny pustelnik',
    currentHp: 2, maxHp: 2,
    strength: 13, agility: 8, presence: 11, toughness: 10,
    drToDodge: 14, drToMelee: 10, drToRanged: 11,
    omens: 2, maxOmens: 2, silver: 10,
    equippedWeapons: [{ name: 'Kostur', dice: [4] }],
    equippedArmor: { name: null },
    computedModifiers: [],
    bodyDescription: 'gaunt', trait1: 'grim', trait2: 'patient',
  });
});

test('toCharacterCard never leaks private fields', () => {
  const card = toCharacterCard(full) as Record<string, unknown>;
  assert.ok(!('notes' in card));
  assert.ok(!('storage' in card));
  assert.ok(!('equipment' in card));
});
```

**Step 2: Run it, confirm it fails** — `cd backend && node --import tsx --experimental-test-module-mocks --test tests/unit-be/character-card.test.ts` → FAIL (module not found).

**Step 3: Implement**

```ts
// backend/src/lib/character-card.ts

// Compact, TABLE-VISIBLE projection of a hydrated character (getCharacterFull
// output). This is the ONLY character data exposed by GET /api/characters/cards,
// which is readable by anyone holding the (unguessable UUID) id — it powers the
// OBR GM roster and the "view scvm" peek. Allowlist only; never spread the full
// object. Private fields (notes, full inventory/storage) must stay out.
const WEAPON_KEYS = ['name', 'dice'] as const;

export interface CharacterCard {
  id: string | null;
  name: string;
  className: string | null;
  currentHp: number;
  maxHp: number;
  strength: number;
  agility: number;
  presence: number;
  toughness: number;
  drToDodge: number;
  drToMelee: number;
  drToRanged: number;
  omens: number;
  maxOmens: number;
  silver: number;
  equippedWeapons: Array<{ name: string | null; dice: number[] }>;
  equippedArmor: { name: string | null };
  computedModifiers: unknown[];
  bodyDescription: string | null;
  trait1: string | null;
  trait2: string | null;
}

export function toCharacterCard(full: Record<string, unknown>): CharacterCard {
  const weapons = Array.isArray(full.equippedWeapons) ? full.equippedWeapons : [];
  const armor = (full.equippedArmor ?? {}) as Record<string, unknown>;
  return {
    id: (full.id as string | null) ?? null,
    name: (full.name as string) ?? '',
    className: (full.className as string | null) ?? null,
    currentHp: (full.currentHp as number) ?? 0,
    maxHp: (full.maxHp as number) ?? 0,
    strength: (full.strength as number) ?? 0,
    agility: (full.agility as number) ?? 0,
    presence: (full.presence as number) ?? 0,
    toughness: (full.toughness as number) ?? 0,
    drToDodge: (full.drToDodge as number) ?? 0,
    drToMelee: (full.drToMelee as number) ?? 0,
    drToRanged: (full.drToRanged as number) ?? 0,
    omens: (full.omens as number) ?? 0,
    maxOmens: (full.maxOmens as number) ?? 0,
    silver: (full.silver as number) ?? 0,
    equippedWeapons: (weapons as Record<string, unknown>[]).map((w) => ({
      name: (w.name as string | null) ?? null,
      dice: Array.isArray(w.dice) ? (w.dice as number[]) : [],
    })),
    equippedArmor: { name: (armor.name as string | null) ?? null },
    computedModifiers: Array.isArray(full.computedModifiers) ? full.computedModifiers : [],
    bodyDescription: (full.bodyDescription as string | null) ?? null,
    trait1: (full.trait1 as string | null) ?? null,
    trait2: (full.trait2 as string | null) ?? null,
  };
}
// ponytail: projection over getCharacterFull, not a new query. If the per-call
// catalog work ever shows up under a large party, add a batched read then.
```

Note: `WEAPON_KEYS` above is illustrative — delete if unused; the mapping is inline.

**Step 4: Run, confirm PASS.**

**Step 5: Commit** — `feat(obr): add table-visible character card projection`.

---

### Task 2: Backend — `getCards` service method

**Files:**
- Modify: `backend/src/services/character-service.ts` (add method to the returned object)
- Test: extend `backend/tests/unit-be/character-service.test.ts` (already mocks `get-character-full` + the repository via `mock.module` and the mutable `state` object — add `getCards` cases there rather than a new file)

**Behaviour:**
- Input: `{ ids: string[]; locale: string }`. No session/ownership check — capability is the UUID.
- Validate each id with `isValidUUID`; **drop** invalid ids silently (a roster scrape shouldn't 400 the whole batch over one bad token). If the resulting list is empty, return `ok([])`.
- Cap the batch (e.g. `ids.slice(0, 50)`) to bound work — a scene won't have more party tokens than that.
- For each id, `getCharacterFull(id, locale)`; skip nulls (deleted char still bound to a stale token); map survivors through `toCharacterCard`.
- Return `ok(cards)`. Wrap in `unexpected(log, ...)`.

**Step 1: Failing test** — drive `getCharacterFull` via the existing `state`/`mock.module` setup in `character-service.test.ts` (extend `state` with a `cardsFullResults` map keyed by id if helpful). Assert: two valid ids → two cards in input order; one invalid (non-UUID) id dropped; a null-returning id dropped; output uses `toCharacterCard` shape (no `notes`).

**Step 2:** run `cd backend && npm run test:unit` → FAIL.

**Step 3: Implement** inside `createCharacterService`'s returned object:

```ts
async getCards(input: {
  ids: string[];
  locale: string;
}): Promise<ServiceResult<unknown>> {
  const ids = (Array.isArray(input.ids) ? input.ids : [])
    .filter((id) => isValidUUID(id))
    .slice(0, 50);
  if (ids.length === 0) {
    return ok([]);
  }
  try {
    const fulls = await Promise.all(
      ids.map((id) => getCharacterFull(id, input.locale))
    );
    const cards = fulls
      .filter((f): f is Record<string, unknown> => f !== null)
      .map(toCharacterCard);
    return ok(cards);
  } catch (err) {
    return fail(
      unexpected(log, err, 'CHARACTER_CARDS_FAILED', 'Failed to fetch character cards')
    );
  }
},
```

Add `import { toCharacterCard } from '../lib/character-card.js';` at the top.

**Step 4:** run → PASS.

**Step 5: Commit** — `feat(obr): character-service getCards (compact batch read)`.

---

### Task 3: Backend — `GET /api/characters/cards` route + schema

**Files:**
- Modify: `backend/src/schemas/character.ts` (add `CardsQuerySchema` + `CharacterCardSchema` response, mirroring existing schema style)
- Modify: `backend/src/routes/characters/index.ts` (register the route)
- Test: route-level unit test in `backend/tests/unit-be/characters-route.test.ts` (mirror the existing file — builds the Fastify app with mocked service). Optional fuller coverage: `backend/tests/integration-be/src/characters-cards.integration.test.ts` (real DB, run via `npm run test:integration`).

**Critical ordering note:** Fastify matches routes in registration order. `GET /:id` already exists and would swallow `/cards` if `/cards` is registered after it. **Register `/cards` BEFORE the `/:id` route** in `index.ts`.

**Query contract:** `GET /api/characters/cards?ids=<comma-separated uuids>&locale=en`. Parse `ids` by splitting on `,`. (Comma-list keeps it a simple GET; the service caps and validates.)

**Schema (style-match `backend/src/schemas/character.ts`):**

```ts
export const CardsQuerySchema = {
  type: 'object',
  properties: {
    ids: { type: 'string' },       // comma-separated UUIDs
    locale: { type: 'string' },
  },
  required: ['ids'],
} as const;

export const CharacterCardSchema = {
  type: 'object',
  properties: {
    id: { type: ['string', 'null'] },
    name: { type: 'string' },
    className: { type: ['string', 'null'] },
    currentHp: { type: 'number' }, maxHp: { type: 'number' },
    strength: { type: 'number' }, agility: { type: 'number' },
    presence: { type: 'number' }, toughness: { type: 'number' },
    drToDodge: { type: 'number' }, drToMelee: { type: 'number' }, drToRanged: { type: 'number' },
    omens: { type: 'number' }, maxOmens: { type: 'number' }, silver: { type: 'number' },
    equippedWeapons: { type: 'array', items: { type: 'object', additionalProperties: true } },
    equippedArmor: { type: 'object', additionalProperties: true },
    computedModifiers: { type: 'array', items: { type: 'object', additionalProperties: true } },
    bodyDescription: { type: ['string', 'null'] },
    trait1: { type: ['string', 'null'] },
    trait2: { type: ['string', 'null'] },
  },
} as const;
```

**Route (register before `/:id`):**

```ts
// GET /cards?ids=a,b,c - Compact, table-visible cards for the OBR roster / peek.
// Capability-by-UUID read: no ownership check, compact fields only.
fastify.get<{ Querystring: { ids?: string; locale?: string } }>(
  '/cards',
  {
    config: { rateLimit: { max: process.env.NODE_ENV === 'test' ? 10000 : 30, timeWindow: '1 minute' } },
    schema: {
      description: 'Compact table-visible character cards by id list',
      tags: ['characters'],
      querystring: CardsQuerySchema,
      response: {
        200: { type: 'array', items: CharacterCardSchema },
        500: ErrorSchema,
      },
    },
  },
  async (request, reply) => {
    const ids = (request.query.ids ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    const result = await createCharacterService(request.log, request.server.partyBus).getCards({
      ids,
      locale: request.query.locale ?? 'en',
    });
    if (!result.ok) {
      return sendServiceError(reply, request, result.error);
    }
    return result.value;
  }
);
```

Add `CardsQuerySchema, CharacterCardSchema` to the import from `../../schemas/character.js`.

**Comma-split stays in the controller** (`(request.query.ids ?? '').split(',')`): it's transport-encoding translation, the controller's job — the service receives a clean `string[]` and stays format-agnostic. This keeps the thin-controller / logic-in-service split intact.

**Step-by-step:** write a failing route-level test in `characters-route.test.ts` for `GET /api/characters/cards?ids=<id>` expecting `200` + an array whose item lacks `notes` (mock the service to return one card); run `npm run test:unit` → FAIL; implement schema + route (registered before `/:id`); run → PASS; then regenerate the frontend OpenAPI client (see Task 7 note); commit `feat(obr): GET /api/characters/cards endpoint`.

---

### Task 4: Frontend — `useObrRole` hook

**Files:**
- Create: `frontend/src/hooks/useObrRole.ts`
- Test: `frontend/src/hooks/useObrRole.browser.test.tsx` (mock `@owlbear-rodeo/sdk`)

```ts
import OBR from '@owlbear-rodeo/sdk';
import { useEffect, useState } from 'react';

// The OBR room role drives which big-window view renders. Client-asserted to our
// backend, so it ONLY toggles UI — never grants server-side authority.
export function useObrRole(): 'GM' | 'PLAYER' | null {
  const [role, setRole] = useState<'GM' | 'PLAYER' | null>(null);
  useEffect(() => {
    let unsub = () => {};
    const stop = OBR.onReady(async () => {
      setRole(await OBR.player.getRole());
      unsub = OBR.player.onChange((p) => setRole(p.role));
    });
    return () => { unsub(); stop(); };
  }, []);
  return role;
}
```

Test: assert it resolves to `'GM'` when `getRole` mocks `'GM'`, and updates on `onChange`. Commit `feat(obr): useObrRole hook`.

---

### Task 5: Frontend — role-switch the big window

**Files:**
- Modify: `frontend/src/components/obr/ObrCharacterRoute.tsx`
- Create: `frontend/src/components/obr/ObrPartyRoster.tsx` (+ `.styles.ts`)

**Behaviour:** At the top of `ObrCharacterRoute`, read `useObrRole()`. When `role === 'GM'`, render `<ObrPartyRoster />` instead of the player flow. `PLAYER`/`null` keep the existing flow unchanged (auth-aware empty state → `CharacterSheet`).

```tsx
const role = useObrRole();
if (role === 'GM') {
  return <ObrPartyRoster />;
}
// ...existing player flow unchanged
```

`ObrPartyRoster` skeleton (data wiring in Task 6): renders the `MISTRZ GRY · PRZEGLĄD n/max` header and a list of `CharacterCard` rows styled per `Owlbear_gm_view.png` (name + class, HP bar, the four ability mods, combat row DEF/MELEE/RANGED, omens, a `Mody` expander for `computedModifiers`). **No disconnected badge.**

Commit `feat(obr): GM sees party roster, player sees own sheet`.

---

### Task 6: Frontend — roster data from scene scan + live sync

**Files:**
- Create: `frontend/src/obr/roster.ts` (scene-scan helpers)
- Modify: `frontend/src/components/obr/ObrPartyRoster.tsx` (consume)
- Modify: `frontend/src/obr/tokenBinding.ts` (broadcast a roster-changed pulse after bind)
- Test: `frontend/src/obr/roster.browser.test.tsx`

**6a. Scene scan** — collect distinct bound character ids from scene items:

```ts
import OBR, { isImage } from '@owlbear-rodeo/sdk';
import { CHARACTER_META_KEY } from './extension';

export async function getBoundCharacterIds(): Promise<string[]> {
  if (!(await OBR.scene.isReady())) return [];
  const items = await OBR.scene.items.getItems();
  const ids = new Set<string>();
  for (const item of items) {
    const id = item.metadata[CHARACTER_META_KEY];
    if (typeof id === 'string' && id) ids.add(id);
  }
  return [...ids];
}
```

**6b. Roster component** — on mount and on every scene change, rescan ids → fetch cards via the generated client (`$api.useQuery('get', '/api/characters/cards', { params: { query: { ids: ids.join(','), locale } } })`, enabled when ids non-empty). Subscribe with `OBR.scene.items.onChange(() => rescan())` and `OBR.scene.onReadyChange(...)`. Refetch the cards query when ids change or a broadcast pulse arrives.

**6c. Live stat sync (no scvmrack SSE).** Two pulses over OBR `broadcast`, channel `"co.rpgtools.scvmrack/roster"`:
- After a successful token bind (`tokenBinding.ts`), `OBR.broadcast.sendMessage(CHANNEL, { kind: 'roster' }, { destination: 'REMOTE' })` so the GM rescans.
- When a player edits their sheet in-iframe, broadcast `{ kind: 'card', characterId }`. Hook this into the editor's flush success (`useCharacterEditor` / `useCharacterRepository`) **only in the OBR entry** — simplest: in `ObrCharacterRoute`, subscribe to the active character's `updatedAt` and broadcast on change, so the editor stays untouched. GM roster's `onMessage` handler invalidates the cards query (or just that `characterId`).

```ts
// In ObrPartyRoster:
useEffect(() => {
  return OBR.broadcast.onMessage(CHANNEL, () => {
    void queryClient.invalidateQueries({ queryKey: ['get', '/api/characters/cards'] });
    void rescan();
  });
}, []);
```

**Test:** `getBoundCharacterIds` dedupes ids and returns `[]` when no scene. Commit `feat(obr): roster from scene scan + broadcast live sync`.

---

### Task 7: Frontend — "view scvm" context menu → compact card peek (small window)

**Files:**
- Create: `frontend/src/obr/contextMenu.ts` (register on ready)
- Modify: `frontend/src/obr-entry.tsx` (call the register fn) or `ObrLayout` `onReady`
- Reuse: the compact `CharacterCard` rendering from Task 5/6 (extract a shared `<ObrCard characterId>` if not already shared)

**Behaviour:** Register a context-menu item that appears only on items carrying `CHARACTER_META_KEY` (use the menu `filter` on `metadata`). Clicking opens the compact card for that token's character id — via `OBR.popover.open` (or `embed`) pointing at a small route that renders `<ObrCard>` fed by the cards endpoint. Anyone (GM or player) can open it; it's the small yellow window in both mocks.

```ts
import OBR from '@owlbear-rodeo/sdk';
import { CHARACTER_META_KEY, EXTENSION_ID } from './extension';

export function registerScvmContextMenu() {
  OBR.contextMenu.create({
    id: `${EXTENSION_ID}/view-scvm`,
    icons: [{ icon: '/obr-icon.svg', label: 'View scvm', filter: {
      roles: ['GM', 'PLAYER'],
      every: [{ key: ['metadata', CHARACTER_META_KEY], operator: '!=', value: undefined }],
    } }],
    onClick: (ctx) => {
      const id = ctx.items[0]?.metadata[CHARACTER_META_KEY];
      if (typeof id !== 'string') return;
      void OBR.popover.open({
        id: `${EXTENSION_ID}/card`,
        url: `/obr-card?id=${id}`,
        width: 380, height: 560,
      });
    },
  });
}
```

(Confirm the exact `filter` predicate shape against `docs/owlbear/Context Menu …htm` — the `metadata` key path + operator — before finalizing; the rest holds.)

Add an `/obr-card` route/entry that renders `<ObrCard characterId={id} />` reading the query param. Commit `feat(obr): view-scvm context menu opens compact card`.

---

### Task 8: Phase 1 validation

Run the full frontend checklist (per CLAUDE.md):
- `cd frontend && npx tsc --noEmit`
- `cd frontend && npm run lint`
- `cd backend && npm run test:unit`
- `cd frontend && npm run test:browser`
- `cd frontend && npm run doctor`

Manually: load the extension in OBR local dev (per `64d5616`), open as GM → roster of bound tokens; open as player → own sheet; right-click a bound token → compact card. Commit any fixes. **Phase 1 ships here.**

---

## Phase 2 — Promote room to scvmrack party (step 5)

### Task 9: Backend — `Party.obrRoomId` column

**Files:**
- Modify: `backend/prisma/schema.prisma` (Party model)
- Create: `backend/prisma/migrations/<timestamp>_party_obr_room/migration.sql`

Add to `model Party`:
```prisma
  obrRoomId String? @unique @map("obr_room_id")
```
Generate the migration: `cd backend && npx prisma migrate dev --name party_obr_room` (writes the `ALTER TABLE parties ADD COLUMN obr_room_id ... UNIQUE` SQL + regenerates the client). Verify the SQL is the additive nullable-unique column, nothing else. Commit `feat(obr): add Party.obrRoomId for room promotion`.

### Task 10: Backend — promotion service + route

**Files:**
- Modify: `backend/src/repositories/party-repository.ts` (`getPartyByObrRoomId`, accept `obrRoomId` in `createParty`)
- Modify: `backend/src/services/party-service.ts` (`promoteRoom`)
- Modify: `backend/src/routes/parties/index.ts` + `backend/src/schemas/party.ts`

**`promoteRoom({ session, obrRoomId, name })`:**
- Require `isGm(session)` (a real logged-in account) → else `unauthorized()`.
- `getPartyByObrRoomId(obrRoomId)`: if it exists and is owned by this GM → return it (idempotent). If owned by someone else → 409 `ROOM_ALREADY_PROMOTED`.
- Else `createParty({ ownerUserId, name, inviteToken, obrRoomId })`.
- Return the manage view (id, name, inviteToken, invitePath). The GM shares that invite link / players join via the **existing** `joinParty` flow — anonymous members can't graduate (no account to own `partyId`), which is the documented behaviour.

TDD with a mocked repository as the existing party-service tests do. Route: `POST /api/parties/promote` (CSRF applies; mutation). Commit `feat(obr): promote OBR room to a scvmrack party`.

### Task 11: Frontend — "Move party to scvmrack" (GM, logged-in only)

**Files:**
- Modify: `frontend/src/components/obr/ObrPartyRoster.tsx`

Show a "Move party to scvmrack" button in the GM roster **only when `isAuthenticated`** (from `useObrSession`). On click: read `OBR.room.id`, `POST /api/parties/promote { obrRoomId, name }`, then surface the invite link (and a "manage in scvmrack" deep link). For anonymous GMs, show a one-line "Sign in to save this party" prompt instead. Commit `feat(obr): GM can graduate the room into a scvmrack party`.

### Task 12: Phase 2 validation + docs

- Re-run the full checklist (Task 8).
- Update `docs/superpowers/plans/2026-06-26-owlbear-extension.md` cross-reference and `changelog/frontend.md` + `changelog/backend.md`.
- If this is a release, follow the CLAUDE.md release checklist (version bump, `release/<v>.md`, ReleasePage card, en/pl i18n keys).

---

## Out of scope (named, not built)
- `rodeo_party` table — the room (OBR storage) is the party; only the promoted `Party` is durable.
- A second SSE channel inside OBR — `broadcast` + scene sync cover it.
- Drawn HP-bars over tokens — the rendering trap deferred in the existing OBR plan.
- Disconnected/presence badge in OBR — main rack only, by decision.
- Per-member presence correlation — depends on connection-scoped ids; not attempted.
