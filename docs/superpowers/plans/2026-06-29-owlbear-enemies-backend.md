# Owlbear Enemies → Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move OBR enemy stat blocks out of shared Owlbear room metadata into the scvmrack backend, owned by the durable party, with GM-full vs player-safe projections gated server-side.

**Architecture:** Enemies become a `Enemy` table FK'd to `Party` (cascade delete). All access is room-centric (`/api/parties/by-room/:roomId/enemies*`): the **authenticated party owner** gets full stat blocks and all mutations; **players** get a safe projection gated by the recorded `(roomId, characterId)` pair (identical credential to `GET /api/characters/cards`). The OBR iframe keeps a tiny `broadcast` "enemies changed" ping for live refresh (data now comes from the API, not room metadata). This closes the two High findings in `docs/owlbear-integration-review.md` (room-metadata leak + 16 kB cap) and the read-modify-write race (health becomes an atomic `UPDATE`).

**Tech Stack:** Fastify 5 + Prisma 6 (PostgreSQL, JSON columns), `node:test` with `--experimental-test-module-mocks`, React 18 + TanStack Query, `@owlbear-rodeo/sdk` 3.

## Global Constraints

- **Layering:** Prisma only inside `src/repositories/*`; logic + gating inside `src/services/*` returning `ServiceResult<T>` from `src/services/result.ts`; routes are thin and translate via `sendServiceError(reply, request, error)`. (CLAUDE.md "API Layering".)
- **No new dependencies.** Reuse existing libs only.
- **Enemies are signed-in only.** Anonymous GMs get no enemy manager (a teaser). Secret data requires an authenticated owner.
- **Enemy data NEVER goes into OBR room/scene metadata.** Only the per-scene token binding (`ENEMY_META_KEY` on a scene item) stays — it holds just an enemy id, which is scene-lifecycle-appropriate.
- **OBR `player.getRole()` is UI-only, never an authorization input.**
- **Backend unit tests:** `node:test`, mock collaborators with `mock.module`, build a real Fastify app with `app.inject` for route tests. Repositories are intentionally NOT unit-tested (they only exercise Prisma).
- **Prisma version 6.19.3** — migrations created with `npx prisma migrate dev --name <name>` from `backend/`.
- **Commit after every task.** Branch is `feat/owlbear_enemies` (already checked out).

### Command reference (exact)

- Single backend unit test file: `cd backend/tests/unit-be && node --import tsx --experimental-test-module-mocks --test "<file>.test.ts"`
- All backend unit tests (gate): `cd backend && npm run test:unit`
- Prisma create+apply migration (dev DB): `cd backend && npx prisma migrate dev --name <name>`
- Prisma client regen only: `cd backend && npm run prisma:generate`
- Frontend type check: `cd frontend && npx tsc --noEmit`
- Frontend lint: `cd frontend && npm run lint`
- Frontend browser tests: `cd frontend && npm run test:browser`
- Frontend single browser test: `cd frontend && npx vitest run --config vitest.browser.config.ts <path>`
- React health: `cd frontend && npm run doctor`
- Regenerate OpenAPI client (backend must be running on :3000): `cd frontend && npm run generate-api`

---

## File structure

**Backend (create):**
- `backend/prisma/migrations/<ts>_enemies/migration.sql` — `enemies` table.
- `backend/src/lib/enemy-card.ts` — pure projections (`toEnemyFull`, `toEnemyCard`, `resolveEnemyStatusLabel`) + shared enemy TS types.
- `backend/src/repositories/enemy-repository.ts` — the only Prisma access for enemies.
- `backend/src/services/enemy-service.ts` — gating + invariants, returns `ServiceResult`.
- `backend/src/schemas/enemy.ts` — JSON schemas for bodies/params/responses.
- `backend/tests/unit-be/enemy-card.test.ts`, `enemy-service.test.ts`, `enemies-route.test.ts`.

**Backend (modify):**
- `backend/prisma/schema.prisma` — add `Enemy` model + `Party.enemies` relation.
- `backend/src/routes/parties/index.ts` — add 6 enemy routes.

**Frontend (create):**
- `frontend/src/api/enemies.ts` — typed client wrappers.
- `frontend/test/browser/obr/useObrEnemies.test.tsx` — hook behavior.

**Frontend (modify):**
- `frontend/src/obr/enemies.ts` — delete room-metadata storage; keep types, token binding, broadcast ping, status helpers.
- `frontend/src/obr/useObrEnemies.ts` — fetch from backend; mutations call API; broadcast on change.
- `frontend/src/components/obr/ObrEnemies.tsx` — pass `roomId`/`characterId`; player panel uses safe cards.
- `frontend/src/obr/contextMenu.ts` — enemy context menu becomes GM-only; popover gets full data.
- `frontend/src/components/obr/ObrCharacterRoute.tsx` — pass active `characterId` to the player enemy panel.

**Frontend (delete):** `frontend/test/unit/obr/` enemy-metadata tests that assert room-metadata read/write (replaced).

---

### Task 1: Enemy table (Prisma model + migration)

**Files:**
- Modify: `backend/prisma/schema.prisma` (Party model ~lines 29-43; append new model after Character ~line 150)
- Create: `backend/prisma/migrations/<ts>_enemies/migration.sql` (generated)

**Interfaces:**
- Produces: Prisma `Enemy` model + `prisma.enemy` client delegate. Columns: `id uuid pk`, `partyId uuid fk→parties cascade`, `name`, `type`, `habitat`, `description`, `healthPercent int`, `maxHealth int`, `morale int`, `armorDie`, `armorDescription`, `attacks/specials/loot/statuses Json`, `createdAt`, `updatedAt`.

- [ ] **Step 1: Add the relation field to `Party`**

In `backend/prisma/schema.prisma`, inside `model Party`, add `enemies` next to `members`:

```prisma
  owner   User        @relation(fields: [ownerUserId], references: [id], onDelete: Cascade)
  members Character[]
  enemies Enemy[]
```

- [ ] **Step 2: Add the `Enemy` model**

Append after the `Character` model (after line 150):

```prisma
model Enemy {
  id               String   @id @default(uuid()) @db.Uuid
  partyId          String   @map("party_id") @db.Uuid
  name             String   @db.VarChar(80)
  type             String   @default("") @db.VarChar(80)
  habitat          String   @default("") @db.VarChar(120)
  description      String   @default("") @db.VarChar(500)
  healthPercent    Int      @default(100) @map("health_percent")
  maxHealth        Int      @default(1) @map("max_health")
  morale           Int      @default(0)
  armorDie         String   @default("") @map("armor_die") @db.VarChar(24)
  armorDescription String   @default("") @map("armor_description") @db.VarChar(120)
  attacks          Json     @default("[]")
  specials         Json     @default("[]")
  loot             Json     @default("[]")
  statuses         Json     @default("[]")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  party Party @relation(fields: [partyId], references: [id], onDelete: Cascade)

  @@index([partyId])
  @@map("enemies")
}
```

- [ ] **Step 3: Create + apply the migration**

Run: `cd backend && npx prisma migrate dev --name enemies`
Expected: a new `backend/prisma/migrations/<ts>_enemies/migration.sql` is created and applied; output ends with "Your database is now in sync with your schema." and the Prisma client regenerates.

- [ ] **Step 4: Verify schema validity + client**

Run: `cd backend && npx prisma validate && npm run build:ts`
Expected: "The schema at prisma/schema.prisma is valid 🚀" and `tsc` exits 0.

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations
git commit -m "feat(enemies): add Enemy table owned by Party"
```

---

### Task 2: Enemy projections (`lib/enemy-card.ts`)

**Files:**
- Create: `backend/src/lib/enemy-card.ts`
- Test: `backend/tests/unit-be/enemy-card.test.ts`

**Interfaces:**
- Produces:
  - `interface EnemyFull { id; partyId; name; type; habitat; description; healthPercent; maxHealth; morale; armorDie; armorDescription; attacks: EnemyAttack[]; specials: EnemySpecial[]; loot: EnemyLoot[]; statuses: EnemyStatusBand[]; }`
  - `interface EnemyCard { id: string; name: string; type: string; habitat: string; description: string; healthPercent: number; statusLabel: string; }`
  - `function toEnemyFull(row: Record<string, unknown>): EnemyFull`
  - `function toEnemyCard(row: Record<string, unknown>): EnemyCard`
  - `function resolveEnemyStatusLabel(healthPercent: number, statuses: EnemyStatusBand[]): string`
  - types `EnemyAttack {id;name;die}`, `EnemySpecial {id;name;description}`, `EnemyLoot {id;label;value}`, `EnemyStatusBand {id;percent;label}`, `DEFAULT_ENEMY_STATUS_BANDS`.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/unit-be/enemy-card.test.ts`:

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  toEnemyCard,
  toEnemyFull,
  resolveEnemyStatusLabel,
  DEFAULT_ENEMY_STATUS_BANDS,
} from '../../src/lib/enemy-card.js';

const row = {
  id: 'e1',
  partyId: 'p1',
  name: 'Goblin',
  type: 'Beast',
  habitat: 'Swamp',
  description: 'Nasty',
  healthPercent: 40,
  maxHealth: 8,
  morale: 7,
  armorDie: '-d2',
  armorDescription: 'Rags',
  attacks: [{ id: 'a1', name: 'Bite', die: 'd4' }],
  specials: [{ id: 's1', name: 'Sneak', description: 'hides' }],
  loot: [{ id: 'l1', label: 'Teeth', value: '2sp' }],
  statuses: DEFAULT_ENEMY_STATUS_BANDS,
};

test('toEnemyCard exposes only safe fields with a resolved status label', () => {
  const card = toEnemyCard(row);
  assert.deepEqual(card, {
    id: 'e1',
    name: 'Goblin',
    type: 'Beast',
    habitat: 'Swamp',
    description: 'Nasty',
    healthPercent: 40,
    statusLabel: 'Severely wounded',
  });
  // Secret fields must be absent.
  assert.equal('morale' in card, false);
  assert.equal('loot' in card, false);
  assert.equal('attacks' in card, false);
  assert.equal('maxHealth' in card, false);
});

test('toEnemyFull keeps every field and coerces JSON arrays', () => {
  const full = toEnemyFull(row);
  assert.equal(full.morale, 7);
  assert.equal(full.attacks[0]?.name, 'Bite');
  assert.equal(full.loot.length, 1);
});

test('resolveEnemyStatusLabel picks the lowest band at or above health', () => {
  assert.equal(resolveEnemyStatusLabel(100, DEFAULT_ENEMY_STATUS_BANDS), 'Healthy');
  assert.equal(resolveEnemyStatusLabel(10, DEFAULT_ENEMY_STATUS_BANDS), "At death's door");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend/tests/unit-be && node --import tsx --experimental-test-module-mocks --test "enemy-card.test.ts"`
Expected: FAIL — cannot find module `../../src/lib/enemy-card.js`.

- [ ] **Step 3: Implement `lib/enemy-card.ts`**

Create `backend/src/lib/enemy-card.ts`:

```ts
// Pure projections for enemy reads. GM/owner gets EnemyFull; players get EnemyCard
// (safe, table-visible). Allowlist only — never spread the row. Secret fields
// (morale, maxHealth, armor, attacks, specials, loot) must stay out of EnemyCard.

export interface EnemyAttack { id: string; name: string; die: string }
export interface EnemySpecial { id: string; name: string; description: string }
export interface EnemyLoot { id: string; label: string; value: string }
export interface EnemyStatusBand { id: string; percent: number; label: string }

export interface EnemyFull {
  id: string;
  partyId: string;
  name: string;
  type: string;
  habitat: string;
  description: string;
  healthPercent: number;
  maxHealth: number;
  morale: number;
  armorDie: string;
  armorDescription: string;
  attacks: EnemyAttack[];
  specials: EnemySpecial[];
  loot: EnemyLoot[];
  statuses: EnemyStatusBand[];
}

export interface EnemyCard {
  id: string;
  name: string;
  type: string;
  habitat: string;
  description: string;
  healthPercent: number;
  statusLabel: string;
}

export const DEFAULT_ENEMY_STATUS_BANDS: EnemyStatusBand[] = [
  { id: 'healthy', percent: 100, label: 'Healthy' },
  { id: 'wounded', percent: 75, label: 'Wounded' },
  { id: 'severely-wounded', percent: 50, label: 'Severely wounded' },
  { id: 'deaths-door', percent: 25, label: "At death's door" },
];

function asArray<T>(raw: unknown): T[] {
  return Array.isArray(raw) ? (raw as T[]) : [];
}

function clampPercent(value: unknown, min: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(100, Math.max(min, Math.round(n)));
}

export function resolveEnemyStatusLabel(
  healthPercent: number,
  statuses: EnemyStatusBand[]
): string {
  const bands = (statuses.length > 0 ? statuses : DEFAULT_ENEMY_STATUS_BANDS)
    .slice()
    .sort((a, b) => a.percent - b.percent);
  const hp = clampPercent(healthPercent, 0);
  const band = bands.find((b) => hp <= b.percent) ?? bands[bands.length - 1];
  return band?.label ?? DEFAULT_ENEMY_STATUS_BANDS[0].label;
}

export function toEnemyFull(row: Record<string, unknown>): EnemyFull {
  return {
    id: (row.id as string) ?? '',
    partyId: (row.partyId as string) ?? '',
    name: (row.name as string) ?? '',
    type: (row.type as string) ?? '',
    habitat: (row.habitat as string) ?? '',
    description: (row.description as string) ?? '',
    healthPercent: clampPercent(row.healthPercent, 0),
    maxHealth: Math.max(1, Math.round((row.maxHealth as number) ?? 1)),
    morale: Math.max(0, Math.round((row.morale as number) ?? 0)),
    armorDie: (row.armorDie as string) ?? '',
    armorDescription: (row.armorDescription as string) ?? '',
    attacks: asArray<EnemyAttack>(row.attacks),
    specials: asArray<EnemySpecial>(row.specials),
    loot: asArray<EnemyLoot>(row.loot),
    statuses: asArray<EnemyStatusBand>(row.statuses),
  };
}

export function toEnemyCard(row: Record<string, unknown>): EnemyCard {
  const statuses = asArray<EnemyStatusBand>(row.statuses);
  const healthPercent = clampPercent(row.healthPercent, 0);
  return {
    id: (row.id as string) ?? '',
    name: (row.name as string) ?? '',
    type: (row.type as string) ?? '',
    habitat: (row.habitat as string) ?? '',
    description: (row.description as string) ?? '',
    healthPercent,
    statusLabel: resolveEnemyStatusLabel(healthPercent, statuses),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend/tests/unit-be && node --import tsx --experimental-test-module-mocks --test "enemy-card.test.ts"`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/lib/enemy-card.ts backend/tests/unit-be/enemy-card.test.ts
git commit -m "feat(enemies): add GM-full and player-safe projections"
```

---

### Task 3: Enemy repository + service (gating + invariants)

**Files:**
- Create: `backend/src/repositories/enemy-repository.ts`
- Create: `backend/src/services/enemy-service.ts`
- Test: `backend/tests/unit-be/enemy-service.test.ts`

**Interfaces:**
- Consumes: `partyRepository.getPartyByObrRoomId(roomId)` → `PartyWithMembers | null` (party-repository.ts:145); `characterRepository.filterIdsInRoom(ids, roomId)` → `string[]` (character-repository.ts:93); `toEnemyFull`/`toEnemyCard` (Task 2); `ServiceResult`, `ok`, `fail`, `unexpected` (result.ts); `apiError`, `badRequest`, `notFound`, `unauthorized` (errors.ts).
- Produces:
  - `enemyRepository` with `listByParty(partyId): Promise<EnemyRow[]>`, `create(partyId, data): Promise<EnemyRow>`, `update(enemyId, partyId, data): Promise<EnemyRow | null>`, `setHealth(enemyId, partyId, healthPercent): Promise<EnemyRow | null>`, `delete(enemyId, partyId): Promise<number>`.
  - `createEnemyService(log)` returning `{ listForOwner, listCardsForPlayer, create, update, setHealth, remove }` each `→ ServiceResult<...>`.
  - `type EnemyInput` = the create/update payload (name + optional fields + nested arrays).

- [ ] **Step 1: Implement the repository (no unit test — Prisma-only, per convention)**

Create `backend/src/repositories/enemy-repository.ts`:

```ts
import prisma from '../lib/prisma.js';
import { Prisma } from '@prisma/client';

/** Enemy data-access layer. The ONLY place that talks to Prisma for enemies. */

export type EnemyRow = {
  id: string;
  partyId: string;
  name: string;
  type: string;
  habitat: string;
  description: string;
  healthPercent: number;
  maxHealth: number;
  morale: number;
  armorDie: string;
  armorDescription: string;
  attacks: unknown;
  specials: unknown;
  loot: unknown;
  statuses: unknown;
};

export type EnemyWriteData = {
  name: string;
  type: string;
  habitat: string;
  description: string;
  healthPercent: number;
  maxHealth: number;
  morale: number;
  armorDie: string;
  armorDescription: string;
  attacks: unknown;
  specials: unknown;
  loot: unknown;
  statuses: unknown;
};

const SELECT = {
  id: true, partyId: true, name: true, type: true, habitat: true,
  description: true, healthPercent: true, maxHealth: true, morale: true,
  armorDie: true, armorDescription: true, attacks: true, specials: true,
  loot: true, statuses: true,
} as const;

export const enemyRepository = {
  listByParty(partyId: string): Promise<EnemyRow[]> {
    return prisma.enemy.findMany({
      where: { partyId },
      orderBy: { createdAt: 'asc' },
      select: SELECT,
    }) as Promise<EnemyRow[]>;
  },

  create(partyId: string, data: EnemyWriteData): Promise<EnemyRow> {
    return prisma.enemy.create({
      data: { partyId, ...toPrismaJson(data) },
      select: SELECT,
    }) as Promise<EnemyRow>;
  },

  // Scope updates to (enemyId, partyId) so one party can never edit another's enemy.
  async update(
    enemyId: string,
    partyId: string,
    data: EnemyWriteData
  ): Promise<EnemyRow | null> {
    const result = await prisma.enemy.updateMany({
      where: { id: enemyId, partyId },
      data: toPrismaJson(data),
    });
    if (result.count === 0) return null;
    return prisma.enemy.findUnique({ where: { id: enemyId }, select: SELECT }) as Promise<EnemyRow | null>;
  },

  // Atomic single-column write — closes the read-modify-write race from the review.
  async setHealth(
    enemyId: string,
    partyId: string,
    healthPercent: number
  ): Promise<EnemyRow | null> {
    const result = await prisma.enemy.updateMany({
      where: { id: enemyId, partyId },
      data: { healthPercent },
    });
    if (result.count === 0) return null;
    return prisma.enemy.findUnique({ where: { id: enemyId }, select: SELECT }) as Promise<EnemyRow | null>;
  },

  async delete(enemyId: string, partyId: string): Promise<number> {
    const result = await prisma.enemy.deleteMany({ where: { id: enemyId, partyId } });
    return result.count;
  },
};

function toPrismaJson(data: EnemyWriteData) {
  return {
    name: data.name,
    type: data.type,
    habitat: data.habitat,
    description: data.description,
    healthPercent: data.healthPercent,
    maxHealth: data.maxHealth,
    morale: data.morale,
    armorDie: data.armorDie,
    armorDescription: data.armorDescription,
    attacks: data.attacks as Prisma.InputJsonValue,
    specials: data.specials as Prisma.InputJsonValue,
    loot: data.loot as Prisma.InputJsonValue,
    statuses: data.statuses as Prisma.InputJsonValue,
  };
}
```

- [ ] **Step 2: Write the failing service test**

Create `backend/tests/unit-be/enemy-service.test.ts`:

```ts
import assert from 'node:assert/strict';
import test, { mock, beforeEach } from 'node:test';

type AppSession = {
  session?: { id?: string | null } | null;
  user?: { id?: string | null; isAnonymous?: boolean | null } | null;
} | null;

const ROOM = 'room-1';
const PARTY = { id: 'party-1', ownerUserId: 'gm-1' };
const GM: AppSession = { session: { id: 's' }, user: { id: 'gm-1', isAnonymous: false } };
const OTHER: AppSession = { session: { id: 's2' }, user: { id: 'gm-2', isAnonymous: false } };

const enemyRow = {
  id: 'e1', partyId: 'party-1', name: 'Goblin', type: '', habitat: '',
  description: '', healthPercent: 50, maxHealth: 8, morale: 7, armorDie: '',
  armorDescription: '', attacks: [], specials: [], loot: [],
  statuses: [{ id: 'h', percent: 100, label: 'Healthy' }],
};

let partyByRoom: { id: string; ownerUserId: string } | null = PARTY;
let idsInRoom: string[] = ['char-1'];
const repoCalls: string[] = [];

mock.module('../../src/repositories/party-repository.js', {
  namedExports: {
    partyRepository: { getPartyByObrRoomId: async () => partyByRoom },
  },
});
mock.module('../../src/repositories/character-repository.js', {
  namedExports: {
    characterRepository: { filterIdsInRoom: async () => idsInRoom },
  },
});
mock.module('../../src/repositories/enemy-repository.js', {
  namedExports: {
    enemyRepository: {
      listByParty: async () => { repoCalls.push('list'); return [enemyRow]; },
      create: async () => { repoCalls.push('create'); return enemyRow; },
      update: async () => { repoCalls.push('update'); return enemyRow; },
      setHealth: async () => { repoCalls.push('setHealth'); return enemyRow; },
      delete: async () => { repoCalls.push('delete'); return 1; },
    },
  },
});

const { createEnemyService } = await import('../../src/services/enemy-service.js');
const log = { error: () => {}, warn: () => {}, info: () => {}, debug: () => {} };

beforeEach(() => {
  partyByRoom = PARTY;
  idsInRoom = ['char-1'];
  repoCalls.length = 0;
});

const body = {
  name: 'Goblin', healthPercent: 50, maxHealth: 8, morale: 7,
  statuses: [{ id: 'h', percent: 100, label: 'Healthy' }],
};

test('listForOwner returns full enemies to the room party owner', async () => {
  const res = await createEnemyService(log).listForOwner({ session: GM, roomId: ROOM });
  assert.equal(res.ok, true);
  if (res.ok) assert.equal((res.value as Array<{ morale: number }>)[0].morale, 7);
});

test('listForOwner 404s a non-owner', async () => {
  const res = await createEnemyService(log).listForOwner({ session: OTHER, roomId: ROOM });
  assert.equal(res.ok, false);
  if (!res.ok) assert.equal(res.error.statusCode, 404);
});

test('listForOwner 401s an anonymous caller', async () => {
  const res = await createEnemyService(log).listForOwner({
    session: { session: { id: 'a' }, user: { id: 'anon', isAnonymous: true } },
    roomId: ROOM,
  });
  assert.equal(res.ok, false);
  if (!res.ok) assert.equal(res.error.statusCode, 401);
});

test('listCardsForPlayer returns safe cards when characterId is bound to the room', async () => {
  const res = await createEnemyService(log).listCardsForPlayer({
    roomId: ROOM, characterId: 'char-1',
  });
  assert.equal(res.ok, true);
  if (res.ok) {
    const card = (res.value as Array<Record<string, unknown>>)[0];
    assert.equal('morale' in card, false);
    assert.equal('loot' in card, false);
    assert.equal(card.statusLabel, 'Healthy');
  }
});

test('listCardsForPlayer returns [] when the character is not bound to the room', async () => {
  idsInRoom = [];
  const res = await createEnemyService(log).listCardsForPlayer({
    roomId: ROOM, characterId: 'char-1',
  });
  assert.equal(res.ok, true);
  if (res.ok) assert.deepEqual(res.value, []);
});

test('create rejects a non-owner before writing', async () => {
  const res = await createEnemyService(log).create({ session: OTHER, roomId: ROOM, body });
  assert.equal(res.ok, false);
  assert.equal(repoCalls.includes('create'), false);
});

test('setHealth clamps and writes for the owner', async () => {
  const res = await createEnemyService(log).setHealth({
    session: GM, roomId: ROOM, enemyId: 'e1', healthPercent: 999,
  });
  assert.equal(res.ok, true);
  assert.equal(repoCalls.includes('setHealth'), true);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd backend/tests/unit-be && node --import tsx --experimental-test-module-mocks --test "enemy-service.test.ts"`
Expected: FAIL — cannot find module `../../src/services/enemy-service.js`.

- [ ] **Step 4: Implement the service**

Create `backend/src/services/enemy-service.ts`:

```ts
import { partyRepository } from '../repositories/party-repository.js';
import { characterRepository } from '../repositories/character-repository.js';
import {
  enemyRepository,
  type EnemyRow,
  type EnemyWriteData,
} from '../repositories/enemy-repository.js';
import { toEnemyCard, toEnemyFull } from '../lib/enemy-card.js';
import { isValidUUID } from '../utils.js';
import { ApiHttpError, badRequest, notFound, unauthorized } from '../errors.js';
import { fail, ok, unexpected, type ServiceLogger, type ServiceResult } from './result.js';

export type AppSession = {
  session?: { id?: string | null } | null;
  user?: { id?: string | null; isAnonymous?: boolean | null } | null;
} | null;

export type EnemyInput = {
  name: string;
  type?: string;
  habitat?: string;
  description?: string;
  healthPercent: number;
  maxHealth?: number;
  morale?: number;
  armorDie?: string;
  armorDescription?: string;
  attacks?: Array<{ id: string; name: string; die?: string }>;
  specials?: Array<{ id: string; name: string; description?: string }>;
  loot?: Array<{ id: string; label: string; value?: string }>;
  statuses: Array<{ id: string; percent: number; label: string }>;
};

const MAX_ROWS = 8;

function userId(s: AppSession): string | null {
  return s?.user?.id ?? null;
}
function isGm(s: AppSession): boolean {
  return Boolean(userId(s)) && s?.user?.isAnonymous !== true;
}
function clampPercent(v: number, min: number): number {
  if (!Number.isFinite(v)) return min;
  return Math.min(100, Math.max(min, Math.round(v)));
}

/** Normalize a validated body into the repository's write shape. */
function toWriteData(body: EnemyInput): EnemyWriteData {
  return {
    name: body.name.trim(),
    type: (body.type ?? '').trim(),
    habitat: (body.habitat ?? '').trim(),
    description: (body.description ?? '').trim(),
    healthPercent: clampPercent(body.healthPercent, 0),
    maxHealth: Math.max(1, Math.min(999, Math.round(body.maxHealth ?? 1))),
    morale: Math.max(0, Math.min(99, Math.round(body.morale ?? 0))),
    armorDie: (body.armorDie ?? '').trim(),
    armorDescription: (body.armorDescription ?? '').trim(),
    attacks: (body.attacks ?? []).slice(0, MAX_ROWS),
    specials: (body.specials ?? []).slice(0, MAX_ROWS),
    loot: (body.loot ?? []).slice(0, MAX_ROWS),
    statuses: (body.statuses ?? []).slice(0, MAX_ROWS),
  };
}

export function createEnemyService(log: ServiceLogger) {
  // Resolve the room's party AND assert the caller owns it. Missing party and
  // not-owned both collapse to 404 (never leak existence).
  async function ensureOwnedParty(
    session: AppSession,
    roomId: string
  ): Promise<{ partyId: string } | ApiHttpError> {
    if (!isGm(session)) return unauthorized();
    const room = typeof roomId === 'string' ? roomId.trim() : '';
    if (room.length === 0) return badRequest('INVALID_OBR_ROOM_ID', 'Owlbear room ID is required');
    const party = await partyRepository.getPartyByObrRoomId(room);
    if (!party || party.ownerUserId !== userId(session)) {
      return notFound('PARTY_NOT_FOUND', 'Party not found');
    }
    return { partyId: party.id };
  }

  return {
    async listForOwner(input: {
      session: AppSession;
      roomId: string;
    }): Promise<ServiceResult<unknown>> {
      try {
        const owned = await ensureOwnedParty(input.session, input.roomId);
        if ('statusCode' in owned) return fail(owned);
        const rows = await enemyRepository.listByParty(owned.partyId);
        return ok(rows.map((r) => toEnemyFull(r as unknown as Record<string, unknown>)));
      } catch (err) {
        return fail(unexpected(log, err, 'ENEMY_LIST_FAILED', 'Failed to list enemies'));
      }
    },

    // Session-less safe read. Gated by the (roomId, characterId) pair: the caller
    // must present a scvm bound to this room (character.obrRoomId === roomId), the
    // same credential as GET /api/characters/cards.
    async listCardsForPlayer(input: {
      roomId: string;
      characterId: string;
    }): Promise<ServiceResult<unknown>> {
      const room = typeof input.roomId === 'string' ? input.roomId.trim() : '';
      if (room.length === 0 || !isValidUUID(input.characterId)) return ok([]);
      try {
        const inRoom = await characterRepository.filterIdsInRoom([input.characterId], room);
        if (inRoom.length === 0) return ok([]);
        const party = await partyRepository.getPartyByObrRoomId(room);
        if (!party) return ok([]);
        const rows = await enemyRepository.listByParty(party.id);
        return ok(rows.map((r) => toEnemyCard(r as unknown as Record<string, unknown>)));
      } catch (err) {
        return fail(unexpected(log, err, 'ENEMY_CARDS_FAILED', 'Failed to fetch enemy cards'));
      }
    },

    async create(input: {
      session: AppSession;
      roomId: string;
      body: EnemyInput;
    }): Promise<ServiceResult<unknown>> {
      try {
        const owned = await ensureOwnedParty(input.session, input.roomId);
        if ('statusCode' in owned) return fail(owned);
        const row = await enemyRepository.create(owned.partyId, toWriteData(input.body));
        return ok(toEnemyFull(row as unknown as Record<string, unknown>));
      } catch (err) {
        return fail(unexpected(log, err, 'ENEMY_CREATE_FAILED', 'Failed to create enemy'));
      }
    },

    async update(input: {
      session: AppSession;
      roomId: string;
      enemyId: string;
      body: EnemyInput;
    }): Promise<ServiceResult<unknown>> {
      if (!isValidUUID(input.enemyId)) return fail(badRequest('INVALID_ENEMY_ID', 'Invalid enemy ID'));
      try {
        const owned = await ensureOwnedParty(input.session, input.roomId);
        if ('statusCode' in owned) return fail(owned);
        const row = await enemyRepository.update(input.enemyId, owned.partyId, toWriteData(input.body));
        if (!row) return fail(notFound('ENEMY_NOT_FOUND', 'Enemy not found'));
        return ok(toEnemyFull(row as unknown as Record<string, unknown>));
      } catch (err) {
        return fail(unexpected(log, err, 'ENEMY_UPDATE_FAILED', 'Failed to update enemy'));
      }
    },

    async setHealth(input: {
      session: AppSession;
      roomId: string;
      enemyId: string;
      healthPercent: number;
    }): Promise<ServiceResult<unknown>> {
      if (!isValidUUID(input.enemyId)) return fail(badRequest('INVALID_ENEMY_ID', 'Invalid enemy ID'));
      try {
        const owned = await ensureOwnedParty(input.session, input.roomId);
        if ('statusCode' in owned) return fail(owned);
        const row = await enemyRepository.setHealth(
          input.enemyId,
          owned.partyId,
          clampPercent(input.healthPercent, 0)
        );
        if (!row) return fail(notFound('ENEMY_NOT_FOUND', 'Enemy not found'));
        return ok(toEnemyFull(row as unknown as Record<string, unknown>));
      } catch (err) {
        return fail(unexpected(log, err, 'ENEMY_HEALTH_FAILED', 'Failed to update enemy health'));
      }
    },

    async remove(input: {
      session: AppSession;
      roomId: string;
      enemyId: string;
    }): Promise<ServiceResult<void>> {
      if (!isValidUUID(input.enemyId)) return fail(badRequest('INVALID_ENEMY_ID', 'Invalid enemy ID'));
      try {
        const owned = await ensureOwnedParty(input.session, input.roomId);
        if ('statusCode' in owned) return fail(owned);
        const count = await enemyRepository.delete(input.enemyId, owned.partyId);
        if (count === 0) return fail(notFound('ENEMY_NOT_FOUND', 'Enemy not found'));
        return ok(undefined);
      } catch (err) {
        return fail(unexpected(log, err, 'ENEMY_DELETE_FAILED', 'Failed to delete enemy'));
      }
    },
  };
}
```

> Note: `ensureOwnedParty` returns either `{ partyId }` or an `ApiHttpError`; the `'statusCode' in owned` guard distinguishes them. Confirmed against `backend/src/errors.ts:19-20`: `ApiHttpError` is a class with a public `readonly statusCode: number`, so the guard and the test's `res.error.statusCode` reads are correct as written.

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend/tests/unit-be && node --import tsx --experimental-test-module-mocks --test "enemy-service.test.ts"`
Expected: PASS (7 tests).

- [ ] **Step 6: Commit**

```bash
git add backend/src/repositories/enemy-repository.ts backend/src/services/enemy-service.ts backend/tests/unit-be/enemy-service.test.ts
git commit -m "feat(enemies): repository + service with owner/room-pair gating"
```

---

### Task 4: Enemy schemas + routes

**Files:**
- Create: `backend/src/schemas/enemy.ts`
- Modify: `backend/src/routes/parties/index.ts` (add 6 routes + imports)
- Test: `backend/tests/unit-be/enemies-route.test.ts`

**Interfaces:**
- Consumes: `createEnemyService` (Task 3); `sendServiceError` (errors.ts); `request.appSession`.
- Produces routes (all under the `parties` plugin, which is mounted at `/api/parties`):
  - `GET /by-room/:roomId/enemies` → owner full list
  - `GET /by-room/:roomId/enemies/cards?characterId=` → player safe list
  - `POST /by-room/:roomId/enemies` → create (201, full)
  - `PATCH /by-room/:roomId/enemies/:enemyId` → update (200, full)
  - `PATCH /by-room/:roomId/enemies/:enemyId/health` → set health (200, full)
  - `DELETE /by-room/:roomId/enemies/:enemyId` → 204

- [ ] **Step 1: Create the schemas**

Create `backend/src/schemas/enemy.ts`:

```ts
// JSON schemas for the enemy routes. Same style as schemas/party.ts.
export { ErrorSchema } from './character.js';

export const RoomParamsSchema = {
  type: 'object',
  required: ['roomId'],
  properties: { roomId: { type: 'string', minLength: 1, maxLength: 256 } },
} as const;

export const RoomEnemyParamsSchema = {
  type: 'object',
  required: ['roomId', 'enemyId'],
  properties: {
    roomId: { type: 'string', minLength: 1, maxLength: 256 },
    enemyId: { type: 'string', format: 'uuid' },
  },
} as const;

export const EnemyCardsQuerySchema = {
  type: 'object',
  required: ['characterId'],
  properties: { characterId: { type: 'string', format: 'uuid' } },
} as const;

const rowItem = (extra: Record<string, unknown>) => ({
  type: 'object',
  additionalProperties: false,
  required: ['id', ...Object.keys(extra).filter((k) => extra[k]?.['__req'])],
  properties: extra,
});

const attackItems = {
  type: 'array',
  maxItems: 8,
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'name'],
    properties: {
      id: { type: 'string', minLength: 1 },
      name: { type: 'string', minLength: 1, maxLength: 80 },
      die: { type: 'string', maxLength: 24 },
    },
  },
} as const;

const specialItems = {
  type: 'array',
  maxItems: 8,
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'name'],
    properties: {
      id: { type: 'string', minLength: 1 },
      name: { type: 'string', minLength: 1, maxLength: 80 },
      description: { type: 'string', maxLength: 240 },
    },
  },
} as const;

const lootItems = {
  type: 'array',
  maxItems: 8,
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'label'],
    properties: {
      id: { type: 'string', minLength: 1 },
      label: { type: 'string', minLength: 1, maxLength: 60 },
      value: { type: 'string', maxLength: 60 },
    },
  },
} as const;

const statusItems = {
  type: 'array',
  minItems: 1,
  maxItems: 8,
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'percent', 'label'],
    properties: {
      id: { type: 'string', minLength: 1 },
      percent: { type: 'integer', minimum: 1, maximum: 100 },
      label: { type: 'string', minLength: 1, maxLength: 48 },
    },
  },
} as const;

export const EnemyBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'healthPercent', 'statuses'],
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 80 },
    type: { type: 'string', maxLength: 80 },
    habitat: { type: 'string', maxLength: 120 },
    description: { type: 'string', maxLength: 500 },
    healthPercent: { type: 'integer', minimum: 0, maximum: 100 },
    maxHealth: { type: 'integer', minimum: 1, maximum: 999 },
    morale: { type: 'integer', minimum: 0, maximum: 99 },
    armorDie: { type: 'string', maxLength: 24 },
    armorDescription: { type: 'string', maxLength: 120 },
    attacks: attackItems,
    specials: specialItems,
    loot: lootItems,
    statuses: statusItems,
  },
} as const;

export const EnemyHealthBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['healthPercent'],
  properties: { healthPercent: { type: 'integer', minimum: 0, maximum: 100 } },
} as const;

// Response shapes are permissive objects (additionalProperties: true) — the
// service already allowlists via toEnemyFull / toEnemyCard, mirroring how
// parties routes return `{ type: 'object', additionalProperties: true }`.
export const EnemyFullSchema = { type: 'object', additionalProperties: true } as const;
export const EnemyListSchema = { type: 'array', items: EnemyFullSchema } as const;
export const EnemyCardListSchema = { type: 'array', items: { type: 'object', additionalProperties: true } } as const;
```

> Remove the unused `rowItem` helper if your linter flags it — it was a scratch helper; the concrete `attackItems`/etc. above are what's used. (Do not ship dead code.)

- [ ] **Step 2: Write the failing route test**

Create `backend/tests/unit-be/enemies-route.test.ts`:

```ts
import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import Fastify from 'fastify';
import { apiError, type ApiHttpError } from '../../src/errors.js';

type AppSession = {
  session?: { id?: string | null } | null;
  user?: { id?: string | null; isAnonymous?: boolean | null } | null;
} | null;

const ENEMY = { id: 'e1', partyId: 'p1', name: 'Goblin', morale: 7, healthPercent: 50 };
const CARD = { id: 'e1', name: 'Goblin', healthPercent: 50, statusLabel: 'Severely wounded' };

let session: AppSession = null;
let ownerResult: { ok: true; value: unknown } | { ok: false; error: ApiHttpError } = { ok: true, value: [ENEMY] };
let cardsResult: { ok: true; value: unknown } | { ok: false; error: ApiHttpError } = { ok: true, value: [CARD] };
const calls: Array<{ method: string; arg: unknown }> = [];

mock.module('../../src/services/enemy-service.js', {
  namedExports: {
    createEnemyService: () => ({
      listForOwner: async (a: unknown) => { calls.push({ method: 'listForOwner', arg: a }); return ownerResult; },
      listCardsForPlayer: async (a: unknown) => { calls.push({ method: 'listCardsForPlayer', arg: a }); return cardsResult; },
      create: async (a: unknown) => { calls.push({ method: 'create', arg: a }); return { ok: true, value: ENEMY }; },
      update: async (a: unknown) => { calls.push({ method: 'update', arg: a }); return { ok: true, value: ENEMY }; },
      setHealth: async (a: unknown) => { calls.push({ method: 'setHealth', arg: a }); return { ok: true, value: ENEMY }; },
      remove: async (a: unknown) => { calls.push({ method: 'remove', arg: a }); return { ok: true, value: undefined }; },
    }),
  },
});

const { default: errorHandlerPlugin } = await import('../../src/plugins/error-handler.js');
const { default: partyRoutes } = await import('../../src/routes/parties/index.js');

async function buildApp() {
  const app = Fastify({ logger: false });
  app.decorateRequest('appSession', null);
  app.decorate('partyBus', { publish: () => {}, subscribe: () => () => {}, connectPresence: () => () => {}, presenceSnapshot: () => ({}) });
  app.addHook('onRequest', async (request) => {
    (request as typeof request & { appSession: AppSession }).appSession = session;
  });
  await app.register(errorHandlerPlugin);
  await app.register(partyRoutes);
  await app.ready();
  return app;
}

const validBody = {
  name: 'Goblin', healthPercent: 50,
  statuses: [{ id: 'h', percent: 100, label: 'Healthy' }],
};
const UUID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

test('GET by-room enemies forwards owner read', async () => {
  calls.length = 0; session = { session: { id: 's' }, user: { id: 'gm', isAnonymous: false } };
  ownerResult = { ok: true, value: [ENEMY] };
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/by-room/room-1/enemies' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json()[0].morale, 7);
  assert.equal(calls[0].method, 'listForOwner');
  await app.close();
});

test('GET enemies/cards forwards (roomId, characterId)', async () => {
  calls.length = 0; session = null; cardsResult = { ok: true, value: [CARD] };
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: `/by-room/room-1/enemies/cards?characterId=${UUID}` });
  assert.equal(res.statusCode, 200);
  assert.equal('morale' in res.json()[0], false);
  assert.deepEqual(calls[0].arg, { roomId: 'room-1', characterId: UUID });
  await app.close();
});

test('POST enemies validates the body before the service', async () => {
  calls.length = 0; session = { session: { id: 's' }, user: { id: 'gm', isAnonymous: false } };
  const app = await buildApp();
  const res = await app.inject({ method: 'POST', url: '/by-room/room-1/enemies', payload: { name: '' } });
  assert.equal(res.statusCode, 400);
  assert.equal(calls.length, 0);
  await app.close();
});

test('PATCH health forwards the value', async () => {
  calls.length = 0; session = { session: { id: 's' }, user: { id: 'gm', isAnonymous: false } };
  const app = await buildApp();
  const res = await app.inject({ method: 'PATCH', url: `/by-room/room-1/enemies/${UUID}/health`, payload: { healthPercent: 30 } });
  assert.equal(res.statusCode, 200);
  assert.equal(calls[0].method, 'setHealth');
  await app.close();
});

test('DELETE enemy returns 204', async () => {
  calls.length = 0; session = { session: { id: 's' }, user: { id: 'gm', isAnonymous: false } };
  const app = await buildApp();
  const res = await app.inject({ method: 'DELETE', url: `/by-room/room-1/enemies/${UUID}` });
  assert.equal(res.statusCode, 204);
  await app.close();
});

test('owner read surfaces a service 404', async () => {
  calls.length = 0; session = { session: { id: 's' }, user: { id: 'gm', isAnonymous: false } };
  ownerResult = { ok: false, error: apiError(404, 'PARTY_NOT_FOUND', 'Party not found') };
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/by-room/room-1/enemies' });
  assert.equal(res.statusCode, 404);
  await app.close();
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd backend/tests/unit-be && node --import tsx --experimental-test-module-mocks --test "enemies-route.test.ts"`
Expected: FAIL — the new routes 404 (not registered yet).

- [ ] **Step 4: Wire the routes into the parties plugin**

In `backend/src/routes/parties/index.ts`, add the import near the top (after the existing schema import block):

```ts
import {
  EnemyBodySchema,
  EnemyCardListSchema,
  EnemyCardsQuerySchema,
  EnemyHealthBodySchema,
  EnemyListSchema,
  EnemyFullSchema,
  RoomEnemyParamsSchema,
  RoomParamsSchema,
} from '../../schemas/enemy.js';
import { createEnemyService } from '../../services/enemy-service.js';
```

Then, inside the plugin body (before the final closing `};` of `const parties`), add:

```ts
  const enemyService = (request: { log: Parameters<typeof createEnemyService>[0] }) =>
    createEnemyService(request.log);

  // GET /by-room/:roomId/enemies - full stat blocks for the room party owner
  fastify.get<{ Params: { roomId: string } }>(
    '/by-room/:roomId/enemies',
    {
      schema: {
        description: 'List full enemies for the room party owner (GM)',
        tags: ['enemies'],
        params: RoomParamsSchema,
        response: { 200: EnemyListSchema, 400: ErrorSchema, 401: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema },
      },
    },
    async (request, reply) => {
      const result = await enemyService(request).listForOwner({
        session: request.appSession,
        roomId: request.params.roomId,
      });
      if (!result.ok) return sendServiceError(reply, request, result.error);
      return result.value;
    }
  );

  // GET /by-room/:roomId/enemies/cards?characterId= - safe projection for players
  fastify.get<{ Params: { roomId: string }; Querystring: { characterId: string } }>(
    '/by-room/:roomId/enemies/cards',
    {
      config: { rateLimit: { max: process.env.NODE_ENV === 'test' ? 10000 : 30, timeWindow: '1 minute' } },
      schema: {
        description: 'Safe enemy cards for a player bound to the room',
        tags: ['enemies'],
        params: RoomParamsSchema,
        querystring: EnemyCardsQuerySchema,
        response: { 200: EnemyCardListSchema, 400: ErrorSchema, 429: ErrorSchema, 500: ErrorSchema },
      },
    },
    async (request, reply) => {
      const result = await enemyService(request).listCardsForPlayer({
        roomId: request.params.roomId,
        characterId: request.query.characterId,
      });
      if (!result.ok) return sendServiceError(reply, request, result.error);
      return result.value;
    }
  );

  // POST /by-room/:roomId/enemies - create (owner)
  fastify.post<{ Params: { roomId: string }; Body: Record<string, unknown> }>(
    '/by-room/:roomId/enemies',
    {
      schema: {
        description: 'Create an enemy (GM)',
        tags: ['enemies'],
        params: RoomParamsSchema,
        body: EnemyBodySchema,
        response: { 201: EnemyFullSchema, 400: ErrorSchema, 401: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema },
      },
    },
    async (request, reply) => {
      const result = await enemyService(request).create({
        session: request.appSession,
        roomId: request.params.roomId,
        body: request.body as never,
      });
      if (!result.ok) return sendServiceError(reply, request, result.error);
      return reply.status(201).send(result.value);
    }
  );

  // PATCH /by-room/:roomId/enemies/:enemyId - full update (owner)
  fastify.patch<{ Params: { roomId: string; enemyId: string }; Body: Record<string, unknown> }>(
    '/by-room/:roomId/enemies/:enemyId',
    {
      schema: {
        description: 'Update an enemy (GM)',
        tags: ['enemies'],
        params: RoomEnemyParamsSchema,
        body: EnemyBodySchema,
        response: { 200: EnemyFullSchema, 400: ErrorSchema, 401: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema },
      },
    },
    async (request, reply) => {
      const result = await enemyService(request).update({
        session: request.appSession,
        roomId: request.params.roomId,
        enemyId: request.params.enemyId,
        body: request.body as never,
      });
      if (!result.ok) return sendServiceError(reply, request, result.error);
      return result.value;
    }
  );

  // PATCH /by-room/:roomId/enemies/:enemyId/health - atomic health set (owner)
  fastify.patch<{ Params: { roomId: string; enemyId: string }; Body: { healthPercent: number } }>(
    '/by-room/:roomId/enemies/:enemyId/health',
    {
      schema: {
        description: 'Set an enemy health percent (GM)',
        tags: ['enemies'],
        params: RoomEnemyParamsSchema,
        body: EnemyHealthBodySchema,
        response: { 200: EnemyFullSchema, 400: ErrorSchema, 401: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema },
      },
    },
    async (request, reply) => {
      const result = await enemyService(request).setHealth({
        session: request.appSession,
        roomId: request.params.roomId,
        enemyId: request.params.enemyId,
        healthPercent: request.body.healthPercent,
      });
      if (!result.ok) return sendServiceError(reply, request, result.error);
      return result.value;
    }
  );

  // DELETE /by-room/:roomId/enemies/:enemyId - delete (owner)
  fastify.delete<{ Params: { roomId: string; enemyId: string } }>(
    '/by-room/:roomId/enemies/:enemyId',
    {
      schema: {
        description: 'Delete an enemy (GM)',
        tags: ['enemies'],
        params: RoomEnemyParamsSchema,
        response: { 204: { type: 'null' }, 400: ErrorSchema, 401: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema },
      },
    },
    async (request, reply) => {
      const result = await enemyService(request).remove({
        session: request.appSession,
        roomId: request.params.roomId,
        enemyId: request.params.enemyId,
      });
      if (!result.ok) return sendServiceError(reply, request, result.error);
      return reply.status(204).send();
    }
  );
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend/tests/unit-be && node --import tsx --experimental-test-module-mocks --test "enemies-route.test.ts"`
Expected: PASS (6 tests).

- [ ] **Step 6: Full backend type check + unit suite**

Run: `cd backend && npm run build:ts && npm run test:unit`
Expected: `tsc` exits 0; all unit tests pass (existing + new enemy tests).

- [ ] **Step 7: Commit**

```bash
git add backend/src/schemas/enemy.ts backend/src/routes/parties/index.ts backend/tests/unit-be/enemies-route.test.ts
git commit -m "feat(enemies): room-scoped enemy routes (owner CRUD + player cards)"
```

---

### Task 5: Regenerate the OpenAPI client

**Files:**
- Modify: `frontend/src/api/schema.ts` (generated)

**Interfaces:**
- Produces: `paths['/api/parties/by-room/{roomId}/enemies']` etc. in the generated types, consumed by Task 6.

- [ ] **Step 1: Start the backend**

Run (background): `cd backend && npm run dev`
Wait until it logs that it is listening on port 3000. Verify: `curl -s http://localhost:3000/openapi.json | head -c 60` prints JSON.

- [ ] **Step 2: Regenerate**

Run: `cd frontend && npm run generate-api`
Expected: `frontend/src/api/schema.ts` is rewritten with no errors.

- [ ] **Step 3: Verify the new paths exist**

Run: `cd frontend && npx tsc --noEmit`
Expected: exits 0. Confirm the file contains `by-room` enemy paths:

Run (Grep, not bash): search `frontend/src/api/schema.ts` for `by-room/{roomId}/enemies`.
Expected: at least the list, cards, create, health, and delete paths are present.

- [ ] **Step 4: Stop the backend** (kill the dev server) and **commit**

```bash
git add frontend/src/api/schema.ts
git commit -m "chore(api): regenerate client for enemy routes"
```

---

### Task 6: Frontend enemy API client (`api/enemies.ts`)

**Files:**
- Create: `frontend/src/api/enemies.ts`

**Interfaces:**
- Consumes: `client` from `@/api`; generated `paths` from `@/api/schema`; `toApiClientError` from `@/utils/errorUtils` (pattern copied from `frontend/src/api/obr.ts`).
- Produces:
  - `type EnemyFull` (from the list response item), `type EnemyCard` (from the cards response item)
  - `fetchEnemiesFull(roomId): Promise<EnemyFull[]>`
  - `fetchEnemyCards(roomId, characterId): Promise<EnemyCard[]>`
  - `createEnemy(roomId, body): Promise<EnemyFull>`
  - `updateEnemy(roomId, enemyId, body): Promise<EnemyFull>`
  - `setEnemyHealth(roomId, enemyId, healthPercent): Promise<EnemyFull>`
  - `deleteEnemy(roomId, enemyId): Promise<void>`
  - `type EnemyInput` (create/update body)

- [ ] **Step 1: Implement the client wrappers**

Create `frontend/src/api/enemies.ts`:

```ts
import { client } from '@/api';
import type { paths } from '@/api/schema';
import { toApiClientError } from '@/utils/errorUtils';

type FullList =
  paths['/api/parties/by-room/{roomId}/enemies']['get']['responses'][200]['content']['application/json'];
export type EnemyFull = FullList[number];

type CardList =
  paths['/api/parties/by-room/{roomId}/enemies/cards']['get']['responses'][200]['content']['application/json'];
export type EnemyCard = CardList[number];

export type EnemyInput =
  paths['/api/parties/by-room/{roomId}/enemies']['post']['requestBody']['content']['application/json'];

type ApiResult<T> = { data?: T; error?: unknown; response?: Response };

async function unwrap<T>(result: ApiResult<T>, fallback: string): Promise<T> {
  const responseOk = result.response?.ok ?? !result.error;
  if (result.error || !responseOk) {
    throw toApiClientError(result.error, result.response, fallback);
  }
  return result.data as T;
}

export async function fetchEnemiesFull(roomId: string): Promise<EnemyFull[]> {
  return unwrap(
    await client.GET('/api/parties/by-room/{roomId}/enemies', {
      params: { path: { roomId } },
    }),
    'Failed to load enemies'
  );
}

export async function fetchEnemyCards(roomId: string, characterId: string): Promise<EnemyCard[]> {
  return unwrap(
    await client.GET('/api/parties/by-room/{roomId}/enemies/cards', {
      params: { path: { roomId }, query: { characterId } },
    }),
    'Failed to load enemies'
  );
}

export async function createEnemy(roomId: string, body: EnemyInput): Promise<EnemyFull> {
  return unwrap(
    await client.POST('/api/parties/by-room/{roomId}/enemies', {
      params: { path: { roomId } },
      body,
    }),
    'Failed to create enemy'
  );
}

export async function updateEnemy(roomId: string, enemyId: string, body: EnemyInput): Promise<EnemyFull> {
  return unwrap(
    await client.PATCH('/api/parties/by-room/{roomId}/enemies/{enemyId}', {
      params: { path: { roomId, enemyId } },
      body,
    }),
    'Failed to update enemy'
  );
}

export async function setEnemyHealth(roomId: string, enemyId: string, healthPercent: number): Promise<EnemyFull> {
  return unwrap(
    await client.PATCH('/api/parties/by-room/{roomId}/enemies/{enemyId}/health', {
      params: { path: { roomId, enemyId } },
      body: { healthPercent },
    }),
    'Failed to update enemy health'
  );
}

export async function deleteEnemy(roomId: string, enemyId: string): Promise<void> {
  await unwrap(
    await client.DELETE('/api/parties/by-room/{roomId}/enemies/{enemyId}', {
      params: { path: { roomId, enemyId } },
    }),
    'Failed to delete enemy'
  );
}
```

- [ ] **Step 2: Type check**

Run: `cd frontend && npx tsc --noEmit`
Expected: exits 0. (If a `client.PATCH`/`DELETE` path string is rejected, confirm the exact generated path keys in `schema.ts` and match them verbatim.)

- [ ] **Step 3: Commit**

```bash
git add frontend/src/api/enemies.ts
git commit -m "feat(enemies): frontend API client for backend enemies"
```

---

### Task 7: Rewrite the OBR enemy data layer

**Files:**
- Modify: `frontend/src/obr/enemies.ts` (remove room-metadata storage; keep types, token binding, broadcast, status helpers)
- Modify: `frontend/src/obr/useObrEnemies.ts` (backend-backed)
- Test: `frontend/test/browser/obr/useObrEnemies.test.tsx`

**Interfaces:**
- Consumes: `frontend/src/api/enemies.ts` (Task 6); `OBR.broadcast`, `OBR.onReady` (sdk).
- Produces:
  - `frontend/src/obr/enemies.ts` keeps exports: `ObrEnemy` (alias of `EnemyFull`), `EnemyAttack/EnemySpecial/EnemyLoot/EnemyStatusBand`, `ENEMY_META_KEY`, `OBR_ENEMIES_CHANNEL`, `ObrEnemiesBroadcast`, `isObrEnemiesBroadcast`, `broadcastEnemiesChanged`, `bindEnemyToSelection`, `getContextEnemyId`, `DEFAULT_ENEMY_STATUS_BANDS`, `resolveEnemyStatus`, `createObrEnemyId`, `createEnemyStatusId`, `createEnemyRowId`, `normalizeStatusBands`.
  - REMOVED exports (no longer exist): `ENEMIES_META_KEY`, `parseObrEnemiesMetadata`, `readObrEnemies`, `saveObrEnemy`, `deleteObrEnemy`, `setObrEnemyHealth`, `writeObrEnemies`.
  - `useObrEnemies(opts)` where `opts` is `{ mode: 'gm'; roomId: string } | { mode: 'player'; roomId: string; characterId: string | null }`, returning `{ enemies, isReady, error, refresh, saveEnemy?, deleteEnemy?, updateEnemyHealth?, bindEnemy? }` (mutations present only in `gm` mode).

- [ ] **Step 1: Trim `obr/enemies.ts` to types + scene/broadcast helpers**

Replace the full contents of `frontend/src/obr/enemies.ts` with:

```ts
import OBR, { type ContextMenuContext } from "@owlbear-rodeo/sdk";
import { z } from "zod";
import type { EnemyFull } from "@/api/enemies";
import { EXTENSION_ID } from "./extension";

// Enemy id stamped onto a scene item (token). Scene-lifecycle data only — the
// durable enemy record lives in the scvmrack backend, not in OBR metadata.
export const ENEMY_META_KEY = `${EXTENSION_ID}/enemyId`;
export const OBR_ENEMIES_CHANNEL = `${EXTENSION_ID}/enemies`;

export type EnemyStatusBand = { id: string; percent: number; label: string };
export type EnemyAttack = { id: string; name: string; die: string };
export type EnemySpecial = { id: string; name: string; description: string };
export type EnemyLoot = { id: string; label: string; value: string };

// The full enemy shape is the backend projection.
export type ObrEnemy = EnemyFull;

export type ObrEnemiesBroadcast = { kind: "enemies" };

type EnemyBindableItem = ContextMenuContext["items"][number] & {
  text?: {
    plainText: string;
    richText: Array<{ type: "paragraph"; children: Array<{ text: string }> }>;
    type: "PLAIN" | "RICH";
  };
  textItemType?: "LABEL" | "TEXT";
};

export const DEFAULT_ENEMY_STATUS_BANDS: EnemyStatusBand[] = [
  { id: "healthy", percent: 100, label: "Healthy" },
  { id: "wounded", percent: 75, label: "Wounded" },
  { id: "severely-wounded", percent: 50, label: "Severely wounded" },
  { id: "deaths-door", percent: 25, label: "At death's door" },
];

const enemyStatusBandSchema = z.object({
  id: z.string().trim().min(1),
  percent: z.coerce.number().int().min(1).max(100),
  label: z.string().trim().min(1).max(48),
});

export function createObrEnemyId(): string {
  return createStableId("enemy");
}
export function createEnemyStatusId(): string {
  return createStableId("status");
}
export function createEnemyRowId(): string {
  return createStableId("row");
}

export function normalizeStatusBands(bands: EnemyStatusBand[]): EnemyStatusBand[] {
  const normalized = bands
    .map((band) => enemyStatusBandSchema.safeParse(band))
    .filter((r): r is z.ZodSafeParseSuccess<EnemyStatusBand> => r.success)
    .map(({ data }) => ({ id: data.id.trim(), percent: data.percent, label: data.label.trim() }))
    .sort((a, b) => a.percent - b.percent);
  return normalized.length > 0 ? normalized : DEFAULT_ENEMY_STATUS_BANDS;
}

export function resolveEnemyStatus(enemy: Pick<ObrEnemy, "healthPercent" | "statuses">): EnemyStatusBand {
  const hp = Math.min(100, Math.max(0, Math.round(enemy.healthPercent)));
  const bands = normalizeStatusBands(enemy.statuses ?? []);
  return bands.find((b) => hp <= b.percent) ?? bands[bands.length - 1] ?? DEFAULT_ENEMY_STATUS_BANDS[0];
}

// Stamp the enemy id onto the player's selected token(s) and rename them. This is
// the only OBR-side write — scene-scoped, no secret data.
export async function bindEnemyToSelection(enemy: ObrEnemy): Promise<number> {
  const selection = (await OBR.player.getSelection()) ?? [];
  if (selection.length === 0) return 0;
  await OBR.scene.items.updateItems(selection, (items) => {
    for (const item of items) {
      item.metadata[ENEMY_META_KEY] = enemy.id;
      setEnemyTokenName(item, enemy.name);
    }
  });
  return selection.length;
}

export function getContextEnemyId(context: Pick<ContextMenuContext, "items">): string | null {
  const enemyId = context.items[0]?.metadata[ENEMY_META_KEY];
  return typeof enemyId === "string" && enemyId.trim() ? enemyId.trim() : null;
}

export function isObrEnemiesBroadcast(data: unknown): data is ObrEnemiesBroadcast {
  return Boolean(data) && typeof data === "object" &&
    (data as Record<string, unknown>).kind === "enemies";
}

export async function broadcastEnemiesChanged(): Promise<void> {
  await OBR.broadcast.sendMessage(
    OBR_ENEMIES_CHANNEL,
    { kind: "enemies" } satisfies ObrEnemiesBroadcast,
    { destination: "ALL" }
  );
}

function setEnemyTokenName(item: ContextMenuContext["items"][number], name: string): void {
  item.name = name;
  const token = item as EnemyBindableItem;
  if (!token.text) return;
  token.text.plainText = name;
  token.text.richText = [{ type: "paragraph", children: [{ text: name }] }];
  token.text.type = "PLAIN";
  token.textItemType = "LABEL";
}

function createStableId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
```

- [ ] **Step 2: Write the failing hook test**

Create `frontend/test/browser/obr/useObrEnemies.test.tsx`. This test mocks the API module and the SDK and asserts the hook loads from the backend and that a GM save broadcasts:

```tsx
import { renderHook, waitFor, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const broadcast = vi.fn();
vi.mock('@owlbear-rodeo/sdk', () => ({
  default: {
    onReady: (cb: () => void) => { cb(); return () => {}; },
    broadcast: {
      sendMessage: (...args: unknown[]) => { broadcast(...args); return Promise.resolve(); },
      onMessage: () => () => {},
    },
  },
}));

const fetchEnemiesFull = vi.fn();
const fetchEnemyCards = vi.fn();
const createEnemy = vi.fn();
vi.mock('@/api/enemies', () => ({
  fetchEnemiesFull: (...a: unknown[]) => fetchEnemiesFull(...a),
  fetchEnemyCards: (...a: unknown[]) => fetchEnemyCards(...a),
  createEnemy: (...a: unknown[]) => createEnemy(...a),
  updateEnemy: vi.fn(),
  setEnemyHealth: vi.fn(),
  deleteEnemy: vi.fn(),
}));

const { useObrEnemies } = await import('@/obr/useObrEnemies');

const ENEMY = { id: 'e1', partyId: 'p1', name: 'Goblin', healthPercent: 50, maxHealth: 8,
  morale: 7, type: '', habitat: '', description: '', armorDie: '', armorDescription: '',
  attacks: [], specials: [], loot: [], statuses: [{ id: 'h', percent: 100, label: 'Healthy' }] };

beforeEach(() => { broadcast.mockClear(); fetchEnemiesFull.mockResolvedValue([ENEMY]); fetchEnemyCards.mockResolvedValue([]); createEnemy.mockResolvedValue(ENEMY); });
afterEach(() => vi.clearAllMocks());

describe('useObrEnemies', () => {
  it('GM mode loads full enemies from the backend by room', async () => {
    const { result } = renderHook(() => useObrEnemies({ mode: 'gm', roomId: 'room-1' }));
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await waitFor(() => expect(result.current.enemies).toHaveLength(1));
    expect(fetchEnemiesFull).toHaveBeenCalledWith('room-1');
  });

  it('player mode loads safe cards with the active character id', async () => {
    fetchEnemyCards.mockResolvedValue([{ id: 'e1', name: 'Goblin', healthPercent: 50, statusLabel: 'Severely wounded' }]);
    const { result } = renderHook(() => useObrEnemies({ mode: 'player', roomId: 'room-1', characterId: 'char-1' }));
    await waitFor(() => expect(result.current.enemies).toHaveLength(1));
    expect(fetchEnemyCards).toHaveBeenCalledWith('room-1', 'char-1');
  });

  it('GM save calls the API then broadcasts a change ping', async () => {
    const { result } = renderHook(() => useObrEnemies({ mode: 'gm', roomId: 'room-1' }));
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await act(async () => { await result.current.saveEnemy?.(ENEMY); });
    expect(createEnemy).toHaveBeenCalled();
    expect(broadcast).toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd frontend && npx vitest run --config vitest.browser.config.ts test/browser/obr/useObrEnemies.test.tsx`
Expected: FAIL — `useObrEnemies` signature mismatch / still references removed metadata functions.

- [ ] **Step 4: Rewrite `useObrEnemies.ts`**

Replace the full contents of `frontend/src/obr/useObrEnemies.ts` with:

```ts
import OBR from "@owlbear-rodeo/sdk";
import { useCallback, useEffect, useState } from "react";
import {
  createEnemy,
  deleteEnemy as deleteEnemyApi,
  fetchEnemiesFull,
  fetchEnemyCards,
  setEnemyHealth as setEnemyHealthApi,
  updateEnemy,
  type EnemyInput,
} from "@/api/enemies";
import {
  broadcastEnemiesChanged,
  isObrEnemiesBroadcast,
  OBR_ENEMIES_CHANNEL,
  type ObrEnemy,
} from "./enemies";

const EMPTY: ObrEnemy[] = [];

type Options =
  | { mode: "gm"; roomId: string }
  | { mode: "player"; roomId: string; characterId: string | null };

// Backend-backed enemies. Data lives in the scvmrack DB (gated by ownership /
// (roomId, characterId)); the OBR broadcast channel is only a cross-client
// "refetch" ping, since enemies no longer live in room metadata.
export function useObrEnemies(options: Options) {
  const [enemies, setEnemies] = useState<ObrEnemy[]>(EMPTY);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const roomId = options.roomId;
  const mode = options.mode;
  const characterId = mode === "player" ? options.characterId : null;

  const refresh = useCallback(async () => {
    try {
      setError(null);
      if (mode === "gm") {
        setEnemies((await fetchEnemiesFull(roomId)) as ObrEnemy[]);
      } else if (characterId) {
        setEnemies((await fetchEnemyCards(roomId, characterId)) as unknown as ObrEnemy[]);
      } else {
        setEnemies(EMPTY);
      }
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Enemy roster failed"));
      setEnemies(EMPTY);
    }
  }, [mode, roomId, characterId]);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | null = null;
    OBR.onReady(() => {
      if (!active) return;
      setIsReady(true);
      void refresh();
      unsubscribe = OBR.broadcast.onMessage(OBR_ENEMIES_CHANNEL, (event) => {
        if (isObrEnemiesBroadcast(event.data)) void refresh();
      });
    });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [refresh]);

  const saveEnemy = useCallback(
    async (enemy: ObrEnemy) => {
      const body = toEnemyInput(enemy);
      const saved = enemy.id && !enemy.id.startsWith("enemy-")
        ? await updateEnemy(roomId, enemy.id, body)
        : await createEnemy(roomId, body);
      await refresh();
      await broadcastEnemiesChanged();
      return saved as ObrEnemy;
    },
    [roomId, refresh]
  );

  const deleteEnemy = useCallback(
    async (enemyId: string) => {
      await deleteEnemyApi(roomId, enemyId);
      await refresh();
      await broadcastEnemiesChanged();
    },
    [roomId, refresh]
  );

  const updateEnemyHealth = useCallback(
    async (enemyId: string, healthPercent: number) => {
      const saved = await setEnemyHealthApi(roomId, enemyId, healthPercent);
      await refresh();
      await broadcastEnemiesChanged();
      return saved as ObrEnemy;
    },
    [roomId, refresh]
  );

  if (mode === "gm") {
    return { enemies, isReady, error, refresh, saveEnemy, deleteEnemy, updateEnemyHealth };
  }
  return { enemies, isReady, error, refresh };
}

function toEnemyInput(enemy: ObrEnemy): EnemyInput {
  return {
    name: enemy.name,
    type: enemy.type,
    habitat: enemy.habitat,
    description: enemy.description,
    healthPercent: enemy.healthPercent,
    maxHealth: enemy.maxHealth,
    morale: enemy.morale,
    armorDie: enemy.armorDie,
    armorDescription: enemy.armorDescription,
    attacks: enemy.attacks,
    specials: enemy.specials,
    loot: enemy.loot,
    statuses: enemy.statuses,
  } as EnemyInput;
}
```

> Note on create-vs-update: a freshly built enemy uses a client-side `createObrEnemyId()` (prefixed `enemy-`); a persisted enemy has a server UUID. The `enemy.id.startsWith("enemy-")` check routes new vs existing. The `bindEnemy` capability from the old hook moves to the component, which already imports `bindEnemyToSelection` directly.

- [ ] **Step 5: Run test to verify it passes**

Run: `cd frontend && npx vitest run --config vitest.browser.config.ts test/browser/obr/useObrEnemies.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/obr/enemies.ts frontend/src/obr/useObrEnemies.ts frontend/test/browser/obr/useObrEnemies.test.tsx
git commit -m "feat(enemies): backend-backed OBR enemy hook; drop room-metadata storage"
```

---

### Task 8: Wire components + GM-only enemy context menu

**Files:**
- Modify: `frontend/src/components/obr/ObrEnemies.tsx`
- Modify: `frontend/src/components/obr/ObrCharacterRoute.tsx`
- Modify: `frontend/src/obr/contextMenu.ts`
- Test: `frontend/test/browser/ObrEnemies.test.tsx` (update existing)

**Interfaces:**
- Consumes: `useObrEnemies(options)` (Task 7); `bindEnemyToSelection` (Task 7 enemies.ts); `OBR.room.id`, `OBR.player.getSelection`.
- Produces: `ObrEnemiesPanel` now takes `{ role; roomId; characterId? }`; `ObrEnemyWindow` (popover) player branch fetches a safe card; the enemy context menu filter is GM-only.

- [ ] **Step 1: Update `ObrEnemiesPanel` to thread room/character + new hook shape**

In `frontend/src/components/obr/ObrEnemies.tsx`:

Change the props type and the panel dispatch:

```tsx
type ObrEnemiesPanelProps =
  | { role: "GM"; roomId: string }
  | { role: "PLAYER"; roomId: string; characterId: string | null };

export function ObrEnemiesPanel(props: ObrEnemiesPanelProps) {
  if (props.role === "GM") {
    return <ObrEnemyManagerConnected roomId={props.roomId} />;
  }
  return <ObrEnemyPlayerConnected roomId={props.roomId} characterId={props.characterId} />;
}

function ObrEnemyManagerConnected({ roomId }: { roomId: string }) {
  const state = useObrEnemies({ mode: "gm", roomId });
  const bindEnemy = (enemy: ObrEnemy) => bindEnemyToSelection(enemy);
  return <ObrEnemyManager {...state} bindEnemy={bindEnemy} />;
}

function ObrEnemyPlayerConnected({ roomId, characterId }: { roomId: string; characterId: string | null }) {
  const state = useObrEnemies({ mode: "player", roomId, characterId });
  return <ObrEnemyPlayerPanel {...state} />;
}
```

Update the `import` block at the top of the file to add `bindEnemyToSelection` and remove the now-unused `useObrEnemies` re-exports that referenced metadata; ensure these imports exist:

```tsx
import { useObrEnemies } from "@/obr/useObrEnemies";
import {
  bindEnemyToSelection,
  createEnemyRowId,
  createEnemyStatusId,
  createObrEnemyId,
  DEFAULT_ENEMY_STATUS_BANDS,
  resolveEnemyStatus,
  type ObrEnemy,
} from "@/obr/enemies";
```

Update `ObrEnemyManager`'s prop type to accept the connected hook return plus `bindEnemy`:

```tsx
function ObrEnemyManager({
  enemies, isReady, error, saveEnemy, deleteEnemy, updateEnemyHealth, bindEnemy,
}: ReturnType<typeof useObrEnemies> & {
  saveEnemy: NonNullable<ReturnType<typeof useObrEnemies>["saveEnemy"]>;
  deleteEnemy: NonNullable<ReturnType<typeof useObrEnemies>["deleteEnemy"]>;
  updateEnemyHealth: NonNullable<ReturnType<typeof useObrEnemies>["updateEnemyHealth"]>;
  bindEnemy: (enemy: ObrEnemy) => Promise<number>;
}) {
```

The body of `ObrEnemyManager`, `ObrEnemyPlayerPanel`, `EnemyEditorForm`, and `EnemySummaryCard` stay as-is (they already operate on `ObrEnemy`/`healthPercent`/`statuses`). `getCurrentHealth`/`toHealthPercent` already use `enemy.maxHealth`, which is present on the GM full type.

- [ ] **Step 2: Update `ObrEnemyWindow` (popover) to fetch by room/role**

Replace `ObrEnemyWindow` so the player branch reads a safe card and the GM branch reads full from the room. Use `OBR.room.id` for the room and the URL `id` for the enemy:

```tsx
export function ObrEnemyWindow({ enemyId = getObrEnemyId() }: { enemyId?: string | null }) {
  const { t } = useTranslation();
  const role = useObrRole();
  const [roomId, setRoomId] = useState("");
  useEffect(() => {
    let active = true;
    OBR.onReady(() => { if (active) setRoomId(OBR.room.id); });
    return () => { active = false; };
  }, []);

  // GM popover: full data via the owner room read. (Player enemy peek is served
  // by the always-on panel; the enemy context menu is GM-only — see contextMenu.ts.)
  const state = useObrEnemies({ mode: "gm", roomId });
  const enemy = state.enemies.find((e) => e.id === enemyId);

  if (!enemyId) return <EnemyShell as="main"><EmptyEnemies role="status">{t("obr.enemies.missingId", "Missing enemy id")}</EmptyEnemies></EnemyShell>;
  if (!roomId || !state.isReady) return <EnemyShell as="main"><EmptyEnemies role="status">{t("obr.enemies.loading", "Loading enemies")}</EmptyEnemies></EnemyShell>;
  if (state.error || !enemy) return <EnemyShell as="main"><EmptyEnemies role="status">{state.error ? t("obr.enemies.loadFailed", "Could not load enemies") : t("obr.enemies.notFound", "Enemy not found")}</EmptyEnemies></EnemyShell>;
  if (!role) return <EnemyShell as="main"><EmptyEnemies role="status">{t("obr.enemies.loading", "Loading enemies")}</EmptyEnemies></EnemyShell>;

  if (role === "GM") {
    return (
      <EnemyShell as="main">
        <EnemyEditorForm
          key={enemy.id}
          enemy={enemy}
          title={t("obr.enemies.editTitle", "Edit enemy")}
          onSubmit={async (values) => { await state.saveEnemy?.(toObrEnemy(values, enemy.id)); await OBR.notification.show(t("obr.enemies.saveSuccess", "Enemy saved"), "SUCCESS"); }}
        />
      </EnemyShell>
    );
  }
  return <EnemyShell as="main"><EnemySummaryCard enemy={enemy} /></EnemyShell>;
}
```

> The previous `ObrEnemyWindow` used `saveEnemy` from a metadata hook and a local `actionError`; this version routes through the backend hook. Keep the existing `getObrEnemyId`, `toObrEnemy`, `EnemyEditorForm`, `EnemySummaryCard`, and styled imports unchanged. Add `useState`/`useEffect` to the React import if not already present, and `OBR` from the sdk (already imported).

- [ ] **Step 3: Make the enemy context menu GM-only + drop the unused popover sizing**

In `frontend/src/obr/contextMenu.ts`, change the enemy context menu filter roles to GM only and simplify `openEnemyPopover` (no role branch — always GM size):

In `createEnemyContextMenu`, change:

```ts
        filter: {
          roles: ["GM"],
          every: [
            { key: ["metadata", ENEMY_META_KEY], operator: "!=", value: undefined },
          ],
        },
```

Replace `openEnemyPopover` with:

```ts
async function openEnemyPopover(context: ContextMenuContext, elementId: string): Promise<void> {
  const enemyId = getContextEnemyId(context);
  if (!enemyId) return;
  await OBR.popover.open({
    id: ENEMY_CARD_POPOVER_ID,
    url: getObrEnemyUrl(enemyId),
    width: ENEMY_GM_POPOVER_WIDTH,
    height: ENEMY_GM_POPOVER_HEIGHT,
    ...getContextMenuPopoverAnchor(elementId),
  });
}
```

Delete the now-unused `getCurrentObrRole`, `ENEMY_PLAYER_POPOVER_WIDTH`, and `ENEMY_PLAYER_POPOVER_HEIGHT` constants. Keep `ENEMY_GM_POPOVER_WIDTH/HEIGHT`.

- [ ] **Step 4: Pass `roomId`/`characterId` from `ObrCharacterRoute`**

In `frontend/src/components/obr/ObrCharacterRoute.tsx`:

- The GM branch renders the enemies panel — give it the room id. Add an effect that captures `OBR.room.id` once ready, or read it inline since the panel is only shown when OBR is available. Simplest: a small wrapper. Replace the GM branch:

```tsx
  if (role === 'GM') {
    return (
      <>
        <ObrPartyRoster />
        <ObrEnemiesGmSlot />
      </>
    );
  }
```

Add near the bottom of the file:

```tsx
function ObrEnemiesGmSlot() {
  const [roomId, setRoomId] = useState('');
  useEffect(() => {
    let active = true;
    OBR.onReady(() => { if (active) setRoomId(OBR.room.id); });
    return () => { active = false; };
  }, []);
  if (!roomId) return null;
  return <ObrEnemiesPanel role="GM" roomId={roomId} />;
}
```

- In `ObrPlayerCharacterRoute`, the player enemy panel must pass `roomId` + the active character id. Replace the three `<ObrEnemiesPanel role="PLAYER" />` usages with a single connected slot. Add:

```tsx
function ObrEnemiesPlayerSlot({ characterId }: { characterId: string | null }) {
  const [roomId, setRoomId] = useState('');
  useEffect(() => {
    let active = true;
    OBR.onReady(() => { if (active) setRoomId(OBR.room.id); });
    return () => { active = false; };
  }, []);
  if (!roomId) return null;
  return <ObrEnemiesPanel role="PLAYER" roomId={roomId} characterId={characterId} />;
}
```

Then replace each `<ObrEnemiesPanel role="PLAYER" />` with `<ObrEnemiesPlayerSlot characterId={character?.id ?? null} />` (in the active-character branch use `character.id`; in the empty/sign-in branches pass `null`). Ensure `useState`/`useEffect` and `OBR` are imported (they already are).

- [ ] **Step 5: Update the existing component test**

Open `frontend/test/browser/ObrEnemies.test.tsx`. Update its render calls to the new props (`<ObrEnemiesPanel role="GM" roomId="room-1" />` and `role="PLAYER" roomId="room-1" characterId="char-1"`) and mock `@/api/enemies` instead of room metadata (mirror the mocks in `useObrEnemies.test.tsx`). Keep the assertions about what GM vs player render (GM sees morale/loot; player does not). Run it after editing.

- [ ] **Step 6: Type check, lint, run enemy browser tests**

Run: `cd frontend && npx tsc --noEmit && npm run lint`
Expected: both exit 0.

Run: `cd frontend && npx vitest run --config vitest.browser.config.ts test/browser/ObrEnemies.test.tsx test/browser/obr/contextMenu.test.tsx`
Expected: PASS (update `contextMenu.test.tsx` expectations to GM-only enemy menu if it asserted PLAYER visibility).

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/obr/ObrEnemies.tsx frontend/src/components/obr/ObrCharacterRoute.tsx frontend/src/obr/contextMenu.ts frontend/test/browser/ObrEnemies.test.tsx frontend/test/browser/obr/contextMenu.test.tsx
git commit -m "feat(enemies): GM full / player safe panels; GM-only enemy context menu"
```

---

### Task 9: Remove dead code + full validation gate

**Files:**
- Delete: any `frontend/test/unit/obr/` test that asserts enemy **room-metadata** read/write (e.g. enemy metadata parsing). Keep tests for `resolveEnemyStatus`/`normalizeStatusBands`/token binding if present (update import paths).
- Modify: `docs/owlbear-integration-review.md` (mark the two High enemy findings resolved).

- [ ] **Step 1: Find references to removed exports**

Run (Grep, not bash): search the `frontend/` tree for `parseObrEnemiesMetadata`, `readObrEnemies`, `saveObrEnemy`, `writeObrEnemies`, `ENEMIES_META_KEY`, `setObrEnemyHealth`, `deleteObrEnemy`.
Expected: only matches are in obsolete tests under `frontend/test/unit/obr/`. Delete those obsolete test files (or trim the obsolete cases). If any non-test source still references them, that's a bug to fix now.

- [ ] **Step 2: Mark review findings resolved**

In `docs/owlbear-integration-review.md`, under the two `🔴 High` enemy findings, append:

```markdown
> **RESOLVED 2026-06-29** — enemies moved to the backend (`Enemy` table, party-owned) with server-side GM-full / player-safe projections. No enemy data in OBR room metadata. See `docs/superpowers/plans/2026-06-29-owlbear-enemies-backend.md`.
```

- [ ] **Step 3: Full validation gate (backend + frontend)**

Run: `cd backend && npm run build:ts && npm run test:unit`
Expected: `tsc` exits 0; all backend + frontend unit tests pass.

Run: `cd frontend && npx tsc --noEmit && npm run lint && npm run test:browser && npm run doctor`
Expected: type check + lint clean, browser tests pass, react-doctor reports no new regressions.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(enemies): drop room-metadata enemy code; mark review findings resolved"
```

---

## Self-review notes

- **Spec coverage:** D4 (enemies → backend, signed-in only) → Tasks 1–9. D5 gating (owner full / `(roomId,characterId)` safe / OBR role UI-only / broadcast ping) → Tasks 3, 4, 7, 8. Review High findings (leak, 16 kB) → removed by Task 9 (no room metadata). Read-modify-write race → Task 3 atomic `setHealth`.
- **Out of scope (separate plans):** party↔room re-point/attach (Phase 2), bearer-token session (Phase 0/3), theme/accessibility/manifest verification polish (Phase 4). Phase 1 depends only on the existing `promoteRoom` to attach a party to a room.
- **Type consistency:** `EnemyFull`/`EnemyCard` defined in `lib/enemy-card.ts` (backend) and re-derived from generated types in `api/enemies.ts` (frontend); `ObrEnemy = EnemyFull`. `useObrEnemies` options `{ mode, roomId, characterId? }` used identically in Tasks 7 & 8. Repo methods `listByParty/create/update/setHealth/delete` consistent across Tasks 3–4.
- **Verified:** `ApiHttpError` exposes a public `readonly statusCode: number` (errors.ts:19-20), so the `'statusCode' in owned` guard and the service-test `res.error.statusCode` reads are correct.
```
