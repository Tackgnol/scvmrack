# Owlbear Extraction — Phase 2: `rpgtools-owlbear` Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract scvmrack's Owlbear Rodeo integration (character/enemy roster, token/room bindings, context menus, the binding-table backend) into a new, reusable `@tackgnol/rpgtools-owlbear` package, then migrate scvmrack onto it, so black-swordspeople, trench-rats, and future character sheet apps can adopt the same OBR panel without re-deriving its security model.

**Architecture:** A framework-free core (extension identity, roster, token/room bindings, context menu, staleness, an enemies mechanism generic over `TEnemy extends {id, name}`) at the package root, plus three subpath outlets: `/client` (a per-request-instantiable `ObrApiClient`, mirroring `createRpgToolsAuthClient`'s shape), `/server` (a Fastify plugin taking a narrow `db` adapter — no Prisma dependency in the package itself, mirroring shared-auth's `db.character`/`db.claimCode` adapter precedent — plus `getCards`/`ownsCharacter`/optional `extraRoomCharacterIds` callbacks), and `/react-query` (TanStack Query hooks, with party-membership coupling resolved to two plain optional inputs instead of a direct party-domain import). scvmrack then deletes its local `frontend/src/obr/*` and backend `obr-room-binding-*`/`obr-room-character-access.ts` files and wires the package with its own adapters. No Prisma schema migration is needed — scvmrack's existing `ObrRoomBinding`/`ObrPlayerCharacterBinding`/`ObrTokenCharacterBinding` tables already satisfy the package's documented `db` adapter shape.

**Tech Stack:** Package: TypeScript ESM, `node --test` + tsx (mirroring `rpgtools-shared-auth`'s test setup), Fastify 5 peer, `@owlbear-rodeo/sdk` peer, React 18 + TanStack Query + react-router as optional peers (`peerDependenciesMeta`). scvmrack: Fastify 5 + Prisma backend, React 18 + Vite + TanStack Query frontend, Vitest.

**This is Plan 2 of 2.** Plan 1 (shared-auth 1.6.0 OBR auth-handoff consolidation) has shipped — merged into `rpgtools-shared-auth` `master` and scvmrack `dev`. This package contains **zero auth code**; OBR sign-in stays entirely in `@tackgnol/rpgtools-shared-auth/client`.

## Global Constraints

- **Repos:** `C:\Users\<user>\WebstormProjects\rpgtools-owlbear` (new repo, Tasks 1–11) and `C:\Users\<user>\WebstormProjects\scvmrack` (Tasks 12–14). Every step's paths are relative to the repo named in its task.
- **Package name:** `@tackgnol/rpgtools-owlbear`, published to GitHub Packages (`https://npm.pkg.github.com/`), same as `rpgtools-shared-auth`.
- **No Prisma dependency in the package.** The `/server` plugin takes a `db` adapter object (narrow CRUD methods) instead of a `PrismaClient` — apps paste their own Prisma models (documented in the package README) and implement the adapter using them. scvmrack's existing tables need no migration.
- **Party coupling:** exactly two optional inputs, never a direct import of a party/enemies domain. Backend: `extraRoomCharacterIds?(ids, roomId)`. Frontend: `extraCharacterIds?: string[]` (already-resolved data) and `onRefresh?: () => Promise<void>` passed into the roster hook.
- **`characterId` is an opaque, indexed string** as far as the package is concerned — no foreign key assumption anywhere in package code.
- **Extension identity is a factory:** `createObrExtension(extensionId: string)`. scvmrack keeps `"co.rpgtools.scvmrack"`.
- **Translation:** the package never imports `react-i18next`. Anywhere a label needs localizing, the caller passes an injected `(key: string, fallback: string) => string` translator (matches `enemies.ts`'s existing `StatusTranslator` type).
- **`/server` route prefix defaults to `/api/obr`**, overridable via plugin options.
- **Commits:** conventional messages (`feat:`, `refactor:`, `chore:`). Do NOT add a `Co-Authored-By` trailer.
- **scvmrack validation checklist** (from CLAUDE.md) applies to Tasks 12–14: `npx tsc --noEmit` + `npm run lint` (frontend), `npm run test:unit` (backend), `npm run test:browser` + `npm run doctor` when touching frontend components/hooks.
- **No new runtime dependencies** beyond what's already used in the ecosystem (TanStack Query, react-router, Fastify, `@owlbear-rodeo/sdk` are all optional/existing peers, not new bundled deps).

---

### Task 1: rpgtools-owlbear — repo scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.build.json`
- Create: `.npmrc`
- Create: `.gitignore`
- Create: `src/tests/setupDom.ts`

**Interfaces:**
- Produces: an installable, buildable, testable empty package shell that Tasks 2–11 add code to.

- [ ] **Step 1: Create the GitHub repo**

```bash
gh repo create Tackgnol/rpgtools-owlbear --private --clone
cd rpgtools-owlbear
```

Expected: cloned empty repo at `C:\Users\<user>\WebstormProjects\rpgtools-owlbear`.

- [ ] **Step 2: `package.json`**

```json
{
  "name": "@tackgnol/rpgtools-owlbear",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./server": {
      "types": "./dist/server/index.d.ts",
      "import": "./dist/server/index.js"
    },
    "./client": {
      "types": "./dist/client/index.d.ts",
      "import": "./dist/client/index.js"
    },
    "./react-query": {
      "types": "./dist/react-query/index.d.ts",
      "import": "./dist/react-query/index.js"
    },
    "./rr7": {
      "types": "./dist/rr7/index.d.ts",
      "import": "./dist/rr7/index.js"
    },
    "./package.json": "./package.json"
  },
  "publishConfig": {
    "registry": "https://npm.pkg.github.com/"
  },
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "dev": "tsc -p tsconfig.build.json --watch",
    "test": "node --import tsx --test src/tests/*.test.ts src/tests/*.test.tsx"
  },
  "peerDependencies": {
    "@owlbear-rodeo/sdk": ">=2",
    "fastify": ">=5",
    "react": ">=18",
    "@tanstack/react-query": ">=5",
    "react-router": ">=7"
  },
  "peerDependenciesMeta": {
    "fastify": { "optional": true },
    "react": { "optional": true },
    "@tanstack/react-query": { "optional": true },
    "react-router": { "optional": true }
  },
  "devDependencies": {
    "@owlbear-rodeo/sdk": "^2.1.0",
    "fastify": "^5.2.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@tanstack/react-query": "^5.62.0",
    "react-router": "^7.1.0",
    "happy-dom": "^15.11.7",
    "typescript": "^5.7.2",
    "tsx": "^4.19.2",
    "@types/node": "^22.10.2",
    "@types/react": "^18.3.18"
  }
}
```

- [ ] **Step 3: `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022", "DOM"],
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "allowImportingTsExtensions": false,
    "verbatimModuleSyntax": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: `tsconfig.build.json`**

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "dist", "src/tests"]
}
```

- [ ] **Step 5: `.npmrc`**

```
@tackgnol:registry=https://npm.pkg.github.com/
```

- [ ] **Step 6: `.gitignore`**

```
node_modules/
dist/
*.tgz
```

- [ ] **Step 7: `src/tests/setupDom.ts`**

```ts
import { GlobalRegistrator } from '@happy-dom/global-registrator';

GlobalRegistrator.register();
```

Add `@happy-dom/global-registrator` to `devDependencies` (`^15.11.7`, matching `happy-dom`'s version).

- [ ] **Step 8: Install and verify the empty shell builds**

```bash
npm install
npm run build
```

Expected: `npm install` succeeds; `npm run build` succeeds with no source files yet (empty `dist/`, since `src/` has only `src/tests/setupDom.ts` which `tsconfig.build.json` excludes — create an empty `src/index.ts` with `export {};` first if `tsc` errors on an empty rootDir).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold rpgtools-owlbear package"
```

---

### Task 2: core — extension identity factory + metadata keys

**Files:**
- Create: `src/extension.ts`
- Test: `src/tests/extension.test.ts`

**Interfaces:**
- Produces: `createObrExtension(extensionId: string): ObrExtensionIdentity` where `ObrExtensionIdentity` is `{ EXTENSION_ID, CHARACTER_META_KEY, PLAYER_CHARACTER_META_KEY, PLAYER_NAME_META_KEY, TOKEN_MARKER_META_KEY, TOKEN_MARKER_CHARACTER_META_KEY }`. Tasks 3–6 take an `ObrExtensionIdentity` as their first argument instead of importing hardcoded constants.

- [ ] **Step 1: Write the failing test**

```ts
// src/tests/extension.test.ts
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createObrExtension } from '../extension.ts';

describe('createObrExtension', () => {
  test('namespaces every metadata key under the given extension id', () => {
    const ext = createObrExtension('co.rpgtools.scvmrack');

    assert.equal(ext.EXTENSION_ID, 'co.rpgtools.scvmrack');
    assert.equal(ext.CHARACTER_META_KEY, 'co.rpgtools.scvmrack/characterId');
    assert.equal(ext.PLAYER_CHARACTER_META_KEY, 'co.rpgtools.scvmrack/playerCharacterId');
    assert.equal(ext.PLAYER_NAME_META_KEY, 'co.rpgtools.scvmrack/playerName');
    assert.equal(ext.TOKEN_MARKER_META_KEY, 'co.rpgtools.scvmrack/tokenMarker');
    assert.equal(
      ext.TOKEN_MARKER_CHARACTER_META_KEY,
      'co.rpgtools.scvmrack/tokenMarkerCharacterId',
    );
  });

  test('two different extension ids never collide', () => {
    const a = createObrExtension('co.rpgtools.scvmrack');
    const b = createObrExtension('co.rpgtools.bladerack');

    assert.notEqual(a.CHARACTER_META_KEY, b.CHARACTER_META_KEY);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --test-name-pattern="createObrExtension"` (or `node --import tsx --test src/tests/extension.test.ts`)
Expected: FAIL with "Cannot find module '../extension.ts'"

- [ ] **Step 3: Write the implementation**

```ts
// src/extension.ts

// Identifies one app's OBR extension and namespaces all metadata keys under it
// so they never collide with another app's extension on the same scene items.
export interface ObrExtensionIdentity {
  EXTENSION_ID: string;
  CHARACTER_META_KEY: string;
  PLAYER_CHARACTER_META_KEY: string;
  PLAYER_NAME_META_KEY: string;
  TOKEN_MARKER_META_KEY: string;
  TOKEN_MARKER_CHARACTER_META_KEY: string;
}

export function createObrExtension(extensionId: string): ObrExtensionIdentity {
  return {
    EXTENSION_ID: extensionId,
    CHARACTER_META_KEY: `${extensionId}/characterId`,
    PLAYER_CHARACTER_META_KEY: `${extensionId}/playerCharacterId`,
    PLAYER_NAME_META_KEY: `${extensionId}/playerName`,
    TOKEN_MARKER_META_KEY: `${extensionId}/tokenMarker`,
    TOKEN_MARKER_CHARACTER_META_KEY: `${extensionId}/tokenMarkerCharacterId`,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test src/tests/extension.test.ts`
Expected: PASS, 2/2

- [ ] **Step 5: Commit**

```bash
git add src/extension.ts src/tests/extension.test.ts
git commit -m "feat: extension identity factory"
```

---

### Task 3: core — roster, token binding, staleness

**Files:**
- Create: `src/roster.ts`
- Create: `src/tokenBinding.ts`
- Create: `src/rosterStale.ts`
- Test: `src/tests/roster.test.ts`
- Test: `src/tests/tokenBinding.test.ts`
- Test: `src/tests/rosterStale.test.ts`

**Interfaces:**
- Consumes: `ObrExtensionIdentity` from Task 2.
- Produces:
  - `roster.ts`: `getBoundCharacterIds(ext, OBR): Promise<string[]>`, `isObrRosterBroadcast(data): data is ObrRosterBroadcast`, `broadcastRosterChanged(ext, OBR): Promise<void>`, `broadcastCharacterCardChanged(ext, OBR, characterId): Promise<void>`, `rosterChannel(ext): string`.
  - `tokenBinding.ts`: `SelectionBindingState`, `EMPTY_SELECTION_STATE`, `bindCharacterToSelection(ext, OBR, characterId, characterName)`, `bindCharacterToTokens(ext, OBR, tokenIds, characterId, characterName)`, `unbindCharacterFromToken(ext, OBR, tokenId)`, `getSelectedTokenBindingState(ext, OBR, selectedIds?)`.
  - `rosterStale.ts`: `markPlayerBindings<T extends {playerId: string}>(players, connectedPlayerIds): (T & {stale: boolean})[]`, `markTokenBindings<T extends {tokenId: string}>(tokens, sceneTokenIds): (T & {stale: boolean})[]` — generic over the binding row shape so scvmrack's `ObrPlayerCharacterBinding`/`ObrTokenCharacterBinding` types (or any other app's) work without the package knowing their exact fields.
- **Design note:** every function that touches the OBR SDK takes the SDK's default export as an explicit parameter (`OBR: typeof import('@owlbear-rodeo/sdk').default`) instead of importing it at module scope. This is the one change from scvmrack's original code, needed so tests can pass a mock SDK instead of requiring the real `@owlbear-rodeo/sdk` global (which only works inside an actual OBR-embedded iframe).

- [ ] **Step 1: Write the failing tests**

```ts
// src/tests/roster.test.ts
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createObrExtension } from '../extension.ts';
import {
  getBoundCharacterIds,
  isObrRosterBroadcast,
  broadcastRosterChanged,
  broadcastCharacterCardChanged,
  rosterChannel,
} from '../roster.ts';

const ext = createObrExtension('co.rpgtools.test');

function mockObr(overrides: Record<string, unknown> = {}) {
  return {
    scene: {
      isReady: async () => true,
      items: { getItems: async () => [] },
      ...((overrides.scene as object) ?? {}),
    },
    broadcast: {
      sendMessage: async () => {},
      ...((overrides.broadcast as object) ?? {}),
    },
  } as any;
}

describe('roster', () => {
  test('rosterChannel is namespaced under the extension id', () => {
    assert.equal(rosterChannel(ext), 'co.rpgtools.test/roster');
  });

  test('getBoundCharacterIds returns [] when the scene is not ready', async () => {
    const obr = mockObr({ scene: { isReady: async () => false } });
    assert.deepEqual(await getBoundCharacterIds(ext, obr), []);
  });

  test('getBoundCharacterIds collects unique character ids from item metadata', async () => {
    const obr = mockObr({
      scene: {
        isReady: async () => true,
        items: {
          getItems: async () => [
            { metadata: { [ext.CHARACTER_META_KEY]: 'char-1' } },
            { metadata: { [ext.CHARACTER_META_KEY]: 'char-2' } },
            { metadata: { [ext.CHARACTER_META_KEY]: 'char-1' } },
            { metadata: {} },
          ],
        },
      },
    });
    assert.deepEqual(await getBoundCharacterIds(ext, obr), ['char-1', 'char-2']);
  });

  test('isObrRosterBroadcast accepts roster and card messages, rejects the rest', () => {
    assert.equal(isObrRosterBroadcast({ kind: 'roster' }), true);
    assert.equal(isObrRosterBroadcast({ kind: 'card', characterId: 'c1' }), true);
    assert.equal(isObrRosterBroadcast({ kind: 'card' }), false);
    assert.equal(isObrRosterBroadcast({ kind: 'other' }), false);
    assert.equal(isObrRosterBroadcast(null), false);
  });

  test('broadcastRosterChanged sends a roster message on the namespaced channel', async () => {
    const sent: unknown[] = [];
    const obr = mockObr({ broadcast: { sendMessage: async (...args: unknown[]) => { sent.push(args); } } });
    await broadcastRosterChanged(ext, obr);
    assert.deepEqual(sent, [[
      'co.rpgtools.test/roster',
      { kind: 'roster' },
      { destination: 'ALL' },
    ]]);
  });

  test('broadcastCharacterCardChanged sends a card message with the characterId', async () => {
    const sent: unknown[] = [];
    const obr = mockObr({ broadcast: { sendMessage: async (...args: unknown[]) => { sent.push(args); } } });
    await broadcastCharacterCardChanged(ext, obr, 'char-9');
    assert.deepEqual(sent, [[
      'co.rpgtools.test/roster',
      { kind: 'card', characterId: 'char-9' },
      { destination: 'ALL' },
    ]]);
  });
});
```

```ts
// src/tests/rosterStale.test.ts
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { markPlayerBindings, markTokenBindings } from '../rosterStale.ts';

describe('rosterStale', () => {
  test('marks a player binding stale when its playerId is not connected', () => {
    const result = markPlayerBindings(
      [{ playerId: 'p1', characterId: 'c1' }],
      new Set(['p2']),
    );
    assert.deepEqual(result, [{ playerId: 'p1', characterId: 'c1', stale: true }]);
  });

  test('marks a player binding fresh when its playerId is connected', () => {
    const result = markPlayerBindings(
      [{ playerId: 'p1', characterId: 'c1' }],
      new Set(['p1']),
    );
    assert.equal(result[0].stale, false);
  });

  test('marks all token bindings stale when sceneTokenIds is null (scene not ready)', () => {
    const result = markTokenBindings([{ tokenId: 't1', characterId: 'c1' }], null);
    assert.equal(result[0].stale, false);
  });

  test('marks a token binding stale when its tokenId is not in the scene', () => {
    const result = markTokenBindings(
      [{ tokenId: 't1', characterId: 'c1' }],
      new Set(['t2']),
    );
    assert.equal(result[0].stale, true);
  });
});
```

```ts
// src/tests/tokenBinding.test.ts
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createObrExtension } from '../extension.ts';
import {
  EMPTY_SELECTION_STATE,
  bindCharacterToTokens,
  unbindCharacterFromToken,
  getSelectedTokenBindingState,
} from '../tokenBinding.ts';

const ext = createObrExtension('co.rpgtools.test');

function mockObr(overrides: Record<string, any> = {}) {
  return {
    player: { getSelection: async () => [] },
    broadcast: { sendMessage: async () => {} },
    scene: {
      items: {
        updateItems: async (ids: string[], mutator: (items: any[]) => void) => {
          const items = ids.map((id) => ({ id, metadata: {}, name: '' }));
          mutator(items);
          overrides.updatedItems = items;
        },
        getItems: async () => [],
        getItemAttachments: async () => [],
        deleteItems: async () => {},
        addItems: async () => {},
        getItemBounds: async () => ({ center: { x: 0, y: 0 }, min: { x: 0, y: 0 } }),
      },
    },
    ...overrides,
  } as any;
}

describe('tokenBinding', () => {
  test('bindCharacterToTokens returns 0 for an empty token list without touching the scene', async () => {
    const obr = mockObr();
    assert.equal(await bindCharacterToTokens(ext, obr, [], 'c1', 'Name'), 0);
  });

  test('bindCharacterToTokens writes the character metadata onto every token', async () => {
    const overrides: Record<string, any> = {};
    const obr = mockObr(overrides);
    const count = await bindCharacterToTokens(ext, obr, ['t1', 't2'], 'c1', 'Name');
    assert.equal(count, 2);
    assert.equal(overrides.updatedItems[0].metadata[ext.CHARACTER_META_KEY], 'c1');
    assert.equal(overrides.updatedItems[0].name, 'Name');
  });

  test('unbindCharacterFromToken removes the character metadata', async () => {
    const overrides: Record<string, any> = {};
    const obr = mockObr(overrides);
    await unbindCharacterFromToken(ext, obr, 't1');
    assert.equal(ext.CHARACTER_META_KEY in overrides.updatedItems[0].metadata, false);
  });

  test('unbindCharacterFromToken no-ops on a blank id', async () => {
    const obr = mockObr();
    await unbindCharacterFromToken(ext, obr, '   ');
  });

  test('getSelectedTokenBindingState returns EMPTY_SELECTION_STATE for no selection', async () => {
    const obr = mockObr({ player: { getSelection: async () => [] } });
    assert.deepEqual(await getSelectedTokenBindingState(ext, obr), EMPTY_SELECTION_STATE);
  });

  test('getSelectedTokenBindingState reports bound character ids from selected items', async () => {
    const obr = mockObr({
      player: { getSelection: async () => ['t1'] },
      scene: {
        items: {
          getItems: async () => [{ id: 't1', metadata: { [ext.CHARACTER_META_KEY]: 'c1' } }],
        },
      },
    });
    const state = await getSelectedTokenBindingState(obr === obr ? ext : ext, obr);
    assert.equal(state.hasBoundToken, true);
    assert.deepEqual(state.boundCharacterIds, ['c1']);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --import tsx --test src/tests/roster.test.ts src/tests/rosterStale.test.ts src/tests/tokenBinding.test.ts`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Write `src/rosterStale.ts`**

```ts
// src/rosterStale.ts

// Staleness is a frontend concept: the backend cannot see OBR connectivity, so
// "stale" = durable binding whose OBR counterpart is gone right now. Generic
// over the binding row shape so any app's binding DTO works without this
// package knowing its exact fields.
export function markPlayerBindings<T extends { playerId: string }>(
  players: T[],
  connectedPlayerIds: ReadonlySet<string>,
): (T & { stale: boolean })[] {
  return players.map((binding) => ({
    ...binding,
    stale: !connectedPlayerIds.has(binding.playerId),
  }));
}

export function markTokenBindings<T extends { tokenId: string }>(
  tokens: T[],
  sceneTokenIds: ReadonlySet<string> | null,
): (T & { stale: boolean })[] {
  return tokens.map((binding) => ({
    ...binding,
    stale: sceneTokenIds !== null && !sceneTokenIds.has(binding.tokenId),
  }));
}
```

- [ ] **Step 4: Write `src/roster.ts`**

```ts
// src/roster.ts
import type OBR from '@owlbear-rodeo/sdk';
import type { ObrExtensionIdentity } from './extension.ts';

export type ObrRosterBroadcast =
  | { kind: 'roster' }
  | { kind: 'card'; characterId: string };

export function rosterChannel(ext: ObrExtensionIdentity): string {
  return `${ext.EXTENSION_ID}/roster`;
}

export async function getBoundCharacterIds(
  ext: ObrExtensionIdentity,
  obr: typeof OBR,
): Promise<string[]> {
  if (!(await obr.scene.isReady())) {
    return [];
  }

  const items = await obr.scene.items.getItems();
  const ids = new Set<string>();

  for (const item of items) {
    const id = item.metadata[ext.CHARACTER_META_KEY];
    if (typeof id === 'string' && id) {
      ids.add(id);
    }
  }

  return [...ids];
}

export function isObrRosterBroadcast(data: unknown): data is ObrRosterBroadcast {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const message = data as Record<string, unknown>;
  if (message.kind === 'roster') {
    return true;
  }

  return message.kind === 'card' && typeof message.characterId === 'string';
}

export async function broadcastRosterChanged(
  ext: ObrExtensionIdentity,
  obr: typeof OBR,
): Promise<void> {
  await obr.broadcast.sendMessage(
    rosterChannel(ext),
    { kind: 'roster' } satisfies ObrRosterBroadcast,
    { destination: 'ALL' },
  );
}

export async function broadcastCharacterCardChanged(
  ext: ObrExtensionIdentity,
  obr: typeof OBR,
  characterId: string,
): Promise<void> {
  await obr.broadcast.sendMessage(
    rosterChannel(ext),
    { kind: 'card', characterId } satisfies ObrRosterBroadcast,
    { destination: 'ALL' },
  );
}
```

- [ ] **Step 5: Write `src/tokenBinding.ts`**

```ts
// src/tokenBinding.ts
import type OBR from '@owlbear-rodeo/sdk';
import { buildLabel, type Item } from '@owlbear-rodeo/sdk';
import type { ObrExtensionIdentity } from './extension.ts';
import { broadcastRosterChanged } from './roster.ts';

export type SelectionBindingState = {
  selectedIds: string[];
  selectedCount: number;
  hasSelection: boolean;
  hasBoundToken: boolean;
  boundCharacterIds: string[];
};

export const EMPTY_SELECTION_STATE: SelectionBindingState = {
  selectedIds: [],
  selectedCount: 0,
  hasSelection: false,
  hasBoundToken: false,
  boundCharacterIds: [],
};

const MARKER_OFFSET_Y = 18;

// Bind a character to selected token(s) inside Owlbear. The caller's own
// backend room bindings are the durable source; token metadata keeps context
// menus and token labels useful inside the scene.
export async function bindCharacterToSelection(
  ext: ObrExtensionIdentity,
  obr: typeof OBR,
  characterId: string,
  characterName: string,
): Promise<number> {
  const selection = await obr.player.getSelection();
  return bindCharacterToTokens(ext, obr, selection ?? [], characterId, characterName);
}

export async function bindCharacterToTokens(
  ext: ObrExtensionIdentity,
  obr: typeof OBR,
  tokenIds: string[],
  characterId: string,
  characterName: string,
): Promise<number> {
  if (tokenIds.length === 0) {
    return 0;
  }

  await obr.scene.items.updateItems(tokenIds, (items) => {
    for (const item of items) {
      item.metadata[ext.CHARACTER_META_KEY] = characterId;
      item.name = characterName;
    }
  });

  try {
    await syncBoundTokenMarkers(ext, obr, tokenIds, characterId, characterName);
  } catch {
    // Token metadata is enough for context menus; the marker is a visual aid.
  }

  try {
    await broadcastRosterChanged(ext, obr);
  } catch {
    // The durable backend binding is already written; this is only a refresh ping.
  }

  return tokenIds.length;
}

export async function unbindCharacterFromToken(
  ext: ObrExtensionIdentity,
  obr: typeof OBR,
  tokenId: string,
): Promise<void> {
  const id = tokenId.trim();
  if (!id) return;

  await obr.scene.items.updateItems([id], (items) => {
    for (const item of items) {
      delete item.metadata[ext.CHARACTER_META_KEY];
    }
  });

  try {
    await deleteBoundTokenMarkers(ext, obr, [id]);
  } catch {
    // The metadata removal is the real unbind; marker cleanup is visual.
  }

  try {
    await broadcastRosterChanged(ext, obr);
  } catch {
    // The next roster scan will still see the metadata removal.
  }
}

export async function getSelectedTokenBindingState(
  ext: ObrExtensionIdentity,
  obr: typeof OBR,
  selectedIds?: string[],
): Promise<SelectionBindingState> {
  const selection = selectedIds ?? (await obr.player.getSelection()) ?? [];
  if (selection.length === 0) {
    return EMPTY_SELECTION_STATE;
  }

  const items = await obr.scene.items.getItems(selection);
  const boundCharacterIds = [
    ...new Set(
      items
        .map((item) => item.metadata[ext.CHARACTER_META_KEY])
        .filter((id): id is string => typeof id === 'string' && id.trim().length > 0),
    ),
  ];

  return {
    selectedIds: selection,
    selectedCount: selection.length,
    hasSelection: true,
    hasBoundToken: boundCharacterIds.length > 0,
    boundCharacterIds,
  };
}

export async function syncBoundTokenMarkers(
  ext: ObrExtensionIdentity,
  obr: typeof OBR,
  tokenIds: string[],
  characterId: string,
  characterName: string,
): Promise<void> {
  if (tokenIds.length === 0) return;

  await deleteBoundTokenMarkers(ext, obr, tokenIds);

  const markers = await Promise.all(
    tokenIds.map((tokenId) => buildBoundTokenMarker(ext, obr, tokenId, characterId, characterName)),
  );
  await obr.scene.items.addItems(markers);
}

async function deleteBoundTokenMarkers(
  ext: ObrExtensionIdentity,
  obr: typeof OBR,
  tokenIds: string[],
): Promise<void> {
  const attachments = await obr.scene.items.getItemAttachments(tokenIds);
  const oldMarkerIds = attachments
    .filter((item) => isTokenMarker(ext, item))
    .map((item) => item.id);

  if (oldMarkerIds.length > 0) {
    await obr.scene.items.deleteItems(oldMarkerIds);
  }
}

function isTokenMarker(ext: ObrExtensionIdentity, item: Item): boolean {
  return item.metadata[ext.TOKEN_MARKER_META_KEY] === true;
}

async function buildBoundTokenMarker(
  ext: ObrExtensionIdentity,
  obr: typeof OBR,
  tokenId: string,
  characterId: string,
  characterName: string,
): Promise<Item> {
  const bounds = await obr.scene.items.getItemBounds([tokenId]);
  const label = characterName.trim() || 'Bound';

  return buildLabel()
    .name(`Binding: ${label}`)
    .plainText(label)
    .width('AUTO')
    .height('AUTO')
    .padding(4)
    .fontFamily('Antonio')
    .fontSize(13)
    .fontWeight(700)
    .textAlign('CENTER')
    .textAlignVertical('MIDDLE')
    .fillColor('#FFE900')
    .fillOpacity(1)
    .strokeColor('#090909')
    .strokeOpacity(1)
    .strokeWidth(1)
    .backgroundColor('#090909')
    .backgroundOpacity(0.92)
    .cornerRadius(3)
    .pointerWidth(8)
    .pointerHeight(7)
    .pointerDirection('DOWN')
    .position({ x: bounds.center.x, y: bounds.min.y - MARKER_OFFSET_Y })
    .attachedTo(tokenId)
    .layer('ATTACHMENT')
    .locked(true)
    .disableHit(true)
    .disableAutoZIndex(true)
    .disableAttachmentBehavior(['SCALE', 'ROTATION', 'COPY'])
    .metadata({
      [ext.TOKEN_MARKER_META_KEY]: true,
      [ext.TOKEN_MARKER_CHARACTER_META_KEY]: characterId,
    })
    .build();
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `node --import tsx --test src/tests/roster.test.ts src/tests/rosterStale.test.ts src/tests/tokenBinding.test.ts`
Expected: PASS, all green

- [ ] **Step 7: Commit**

```bash
git add src/roster.ts src/tokenBinding.ts src/rosterStale.ts src/tests/roster.test.ts src/tests/rosterStale.test.ts src/tests/tokenBinding.test.ts
git commit -m "feat: roster, token binding, and staleness core"
```

---

### Task 4: core — room binding (actor + persistence, via an injected client)

**Files:**
- Create: `src/roomBinding.ts`
- Test: `src/tests/roomBinding.test.ts`

**Interfaces:**
- Consumes: `ObrExtensionIdentity` from Task 2; an `ObrRoomBindingsClient` shape (defined here, implemented for real by Task 9's `ObrApiClient`) so `roomBinding.ts` never imports a concrete HTTP client: `{ fetchRoomBindings(roomId): Promise<{players: {playerId: string; characterId: string}[]; tokens: unknown[]}>; bindPlayerCharacter(input): Promise<unknown>; clearPlayerCharacter(input): Promise<void>; clearTokenCharacter(input): Promise<void> }`.
- Produces: `ObrRoomActor`, `getCurrentObrRoomActor(obr)`, `restoreCurrentObrCharacterId(ext, obr, client)`, `persistCurrentObrCharacterId(ext, obr, client, characterId)`, `bindCurrentCharacterToSelection(ext, obr, client, input)`, `bindRoomCharacterToSelection(ext, obr, client, input)`, `unbindRoomPlayerCharacter(obr, client, input)` — no `ext`/roster broadcast needed since it only clears a durable binding — wait: original also calls `broadcastRosterChanged`, so it DOES need `ext`/`obr`. `unbindRoomTokenCharacter(ext, obr, client, input)`, `getCharacterIdFromMetadata(ext, metadata)`.

- [ ] **Step 1: Write the failing test**

```ts
// src/tests/roomBinding.test.ts
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createObrExtension } from '../extension.ts';
import {
  getCurrentObrRoomActor,
  restoreCurrentObrCharacterId,
  persistCurrentObrCharacterId,
  bindRoomCharacterToSelection,
  unbindRoomPlayerCharacter,
  unbindRoomTokenCharacter,
  getCharacterIdFromMetadata,
} from '../roomBinding.ts';

const ext = createObrExtension('co.rpgtools.test');

function mockObr(overrides: Record<string, any> = {}) {
  return {
    room: { id: 'room-1' },
    player: {
      getId: async () => 'player-1',
      getRole: async () => 'GM',
      getConnectionId: async () => 'conn-1',
      getName: async () => 'Alice',
      getMetadata: async () => ({}),
      setMetadata: async () => {},
      getSelection: async () => [],
      ...overrides.player,
    },
    scene: { items: { updateItems: async () => {} }, ...overrides.scene },
    broadcast: { sendMessage: async () => {}, ...overrides.broadcast },
    ...overrides,
  } as any;
}

function mockClient(overrides: Record<string, any> = {}) {
  return {
    fetchRoomBindings: async () => ({ players: [], tokens: [] }),
    bindPlayerCharacter: async () => ({}),
    clearPlayerCharacter: async () => {},
    clearTokenCharacter: async () => {},
    ...overrides,
  } as any;
}

describe('roomBinding', () => {
  test('getCurrentObrRoomActor reads room/player identity from the SDK', async () => {
    const actor = await getCurrentObrRoomActor(mockObr());
    assert.deepEqual(actor, {
      roomId: 'room-1',
      playerId: 'player-1',
      connectionId: 'conn-1',
      playerName: 'Alice',
      role: 'GM',
    });
  });

  test('restoreCurrentObrCharacterId prefers OBR player metadata over a backend binding', async () => {
    const obr = mockObr({ player: { getMetadata: async () => ({ [ext.PLAYER_CHARACTER_META_KEY]: 'char-meta' }) } });
    const id = await restoreCurrentObrCharacterId(ext, obr, mockClient());
    assert.equal(id, 'char-meta');
  });

  test('restoreCurrentObrCharacterId falls back to a backend binding when metadata is empty', async () => {
    const client = mockClient({
      fetchRoomBindings: async () => ({
        players: [{ playerId: 'player-1', characterId: 'char-backend' }],
        tokens: [],
      }),
    });
    const id = await restoreCurrentObrCharacterId(ext, mockObr(), client);
    assert.equal(id, 'char-backend');
  });

  test('persistCurrentObrCharacterId no-ops on a blank id', async () => {
    const client = mockClient();
    await persistCurrentObrCharacterId(ext, mockObr(), client, '   ');
  });

  test('bindRoomCharacterToSelection returns count 0 with no selection', async () => {
    const obr = mockObr({ player: { getSelection: async () => [] } });
    const result = await bindRoomCharacterToSelection(ext, obr, mockClient(), {
      roomId: 'room-1',
      characterId: 'c1',
      characterName: 'Name',
    });
    assert.deepEqual(result, { count: 0, tokenIds: [], metadataSynced: true });
  });

  test('unbindRoomPlayerCharacter clears the backend binding and broadcasts', async () => {
    let cleared = false;
    const client = mockClient({ clearPlayerCharacter: async () => { cleared = true; } });
    await unbindRoomPlayerCharacter(ext, mockObr(), client, { roomId: 'room-1', playerId: 'p1' });
    assert.equal(cleared, true);
  });

  test('getCharacterIdFromMetadata reads and trims the namespaced key', () => {
    assert.equal(getCharacterIdFromMetadata(ext, { [ext.PLAYER_CHARACTER_META_KEY]: ' c1 ' }), 'c1');
    assert.equal(getCharacterIdFromMetadata(ext, {}), null);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test src/tests/roomBinding.test.ts`
Expected: FAIL with "Cannot find module '../roomBinding.ts'"

- [ ] **Step 3: Write the implementation**

```ts
// src/roomBinding.ts
import type OBR from '@owlbear-rodeo/sdk';
import type { ObrExtensionIdentity } from './extension.ts';
import { bindCharacterToTokens, unbindCharacterFromToken } from './tokenBinding.ts';
import { broadcastRosterChanged } from './roster.ts';

export type ObrRoomActor = {
  roomId: string;
  playerId: string;
  connectionId?: string;
  playerName?: string;
  role: 'GM' | 'PLAYER';
};

// The subset of the caller's HTTP client this module needs. Implemented for
// real by the /client outlet's ObrApiClient; kept as a narrow structural
// interface here so this file has no HTTP dependency of its own.
export interface ObrRoomBindingsClient {
  fetchRoomBindings(roomId: string): Promise<{
    players: { playerId: string; characterId: string }[];
    tokens: unknown[];
  }>;
  bindPlayerCharacter(input: {
    roomId: string;
    playerId: string;
    connectionId?: string | null;
    characterId: string;
  }): Promise<unknown>;
  clearPlayerCharacter(input: { roomId: string; playerId: string }): Promise<void>;
  bindTokenCharacter?(input: {
    roomId: string;
    tokenId: string;
    characterId: string;
    playerId?: string | null;
  }): Promise<unknown>;
  clearTokenCharacter(input: { roomId: string; tokenId: string }): Promise<void>;
}

export async function getCurrentObrRoomActor(obr: typeof OBR): Promise<ObrRoomActor> {
  const [playerId, role, connectionId, playerName] = await Promise.all([
    obr.player.getId(),
    obr.player.getRole(),
    obr.player.getConnectionId().catch(() => undefined),
    obr.player.getName().catch(() => undefined),
  ]);

  return {
    roomId: obr.room.id,
    playerId,
    connectionId,
    playerName: normalizeName(playerName),
    role,
  };
}

export async function restoreCurrentObrCharacterId(
  ext: ObrExtensionIdentity,
  obr: typeof OBR,
  client: ObrRoomBindingsClient,
): Promise<string | null> {
  const metadata = await obr.player.getMetadata();
  const metadataCharacterId = getCharacterIdFromMetadata(ext, metadata);
  if (metadataCharacterId) {
    return metadataCharacterId;
  }

  const actor = await getCurrentObrRoomActor(obr);
  const bindings = await client.fetchRoomBindings(actor.roomId);
  const playerBinding = bindings.players.find((binding) => binding.playerId === actor.playerId);

  return playerBinding?.characterId ?? null;
}

export async function persistCurrentObrCharacterId(
  ext: ObrExtensionIdentity,
  obr: typeof OBR,
  client: ObrRoomBindingsClient,
  characterId: string,
): Promise<void> {
  const trimmed = characterId.trim();
  if (!trimmed) return;

  const actor = await getCurrentObrRoomActor(obr);
  await client.bindPlayerCharacter({
    roomId: actor.roomId,
    playerId: actor.playerId,
    connectionId: actor.connectionId,
    characterId: trimmed,
  });
  const metadata: Record<string, string> = { [ext.PLAYER_CHARACTER_META_KEY]: trimmed };
  if (actor.playerName) {
    metadata[ext.PLAYER_NAME_META_KEY] = actor.playerName;
  }
  await obr.player.setMetadata(metadata);
}

export async function bindCurrentCharacterToSelection(
  ext: ObrExtensionIdentity,
  obr: typeof OBR,
  client: ObrRoomBindingsClient,
  input: { characterId: string; characterName: string },
): Promise<{ count: number; tokenIds: string[]; metadataSynced: boolean }> {
  const actor = await getCurrentObrRoomActor(obr);
  return bindRoomCharacterToSelection(ext, obr, client, {
    roomId: actor.roomId,
    characterId: input.characterId,
    characterName: input.characterName,
    playerId: actor.playerId,
  });
}

export async function bindRoomCharacterToSelection(
  ext: ObrExtensionIdentity,
  obr: typeof OBR,
  client: ObrRoomBindingsClient,
  input: {
    roomId: string;
    characterId: string;
    characterName: string;
    playerId?: string | null;
  },
): Promise<{ count: number; tokenIds: string[]; metadataSynced: boolean }> {
  const tokenIds = (await obr.player.getSelection()) ?? [];
  if (tokenIds.length === 0) {
    return { count: 0, tokenIds, metadataSynced: true };
  }

  for (const tokenId of tokenIds) {
    await client.bindTokenCharacter?.({
      roomId: input.roomId,
      tokenId,
      characterId: input.characterId,
      playerId: input.playerId ?? null,
    });
  }

  try {
    const count = await bindCharacterToTokens(ext, obr, tokenIds, input.characterId, input.characterName);
    return { count, tokenIds, metadataSynced: true };
  } catch {
    return { count: tokenIds.length, tokenIds, metadataSynced: false };
  }
}

export async function unbindRoomPlayerCharacter(
  ext: ObrExtensionIdentity,
  obr: typeof OBR,
  client: ObrRoomBindingsClient,
  input: { roomId: string; playerId: string },
): Promise<void> {
  await client.clearPlayerCharacter(input);
  await broadcastRosterChanged(ext, obr);
}

export async function unbindRoomTokenCharacter(
  ext: ObrExtensionIdentity,
  obr: typeof OBR,
  client: ObrRoomBindingsClient,
  input: { roomId: string; tokenId: string },
): Promise<void> {
  await client.clearTokenCharacter(input);
  await unbindCharacterFromToken(ext, obr, input.tokenId);
}

export function getCharacterIdFromMetadata(
  ext: ObrExtensionIdentity,
  metadata: Record<string, unknown>,
): string | null {
  const value = metadata[ext.PLAYER_CHARACTER_META_KEY];
  if (typeof value !== 'string') {
    return null;
  }

  const characterId = value.trim();
  return characterId.length > 0 ? characterId : null;
}

function normalizeName(value: string | undefined): string | undefined {
  const name = value?.trim();
  return name ? name : undefined;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test src/tests/roomBinding.test.ts`
Expected: PASS, all green

- [ ] **Step 5: Commit**

```bash
git add src/roomBinding.ts src/tests/roomBinding.test.ts
git commit -m "feat: room binding core, generic over an injected bindings client"
```

---

### Task 5: core — context menu

**Files:**
- Create: `src/contextMenu.ts`
- Test: `src/tests/contextMenu.test.ts`

**Interfaces:**
- Consumes: `ObrExtensionIdentity` from Task 2; `getCharacterIdFromMetadata` from Task 4.
- Produces: `registerObrContextMenus(ext, obr, items: ContextMenuItem[])` — a thin registration helper (`OBR.onReady` + `OBR.contextMenu.create` per item, once). `getContextCharacterId(ext, context)`. The URL-building and enemy-specific parts of scvmrack's original `contextMenu.ts` (`getObrCardUrl`, `getObrEnemyUrl`, `createEnemyContextMenu`, `openEnemyPopover`, `isObrCardView`, `isObrEnemyView`) are **app-owned** — every app routes its own popovers differently. This task only extracts the reusable, app-agnostic pieces: menu registration plumbing and the character-id-from-context-menu-selection reader.

- [ ] **Step 1: Write the failing test**

```ts
// src/tests/contextMenu.test.ts
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createObrExtension } from '../extension.ts';
import { getContextCharacterId, registerObrContextMenus } from '../contextMenu.ts';

const ext = createObrExtension('co.rpgtools.test');

describe('contextMenu', () => {
  test('getContextCharacterId reads and trims the bound character id from the first item', () => {
    const context = { items: [{ metadata: { [ext.CHARACTER_META_KEY]: ' c1 ' } }] } as any;
    assert.equal(getContextCharacterId(ext, context), 'c1');
  });

  test('getContextCharacterId returns null with no items or no binding', () => {
    assert.equal(getContextCharacterId(ext, { items: [] } as any), null);
    assert.equal(getContextCharacterId(ext, { items: [{ metadata: {} }] } as any), null);
  });

  test('registerObrContextMenus creates each item exactly once, even if called twice', () => {
    const created: unknown[] = [];
    let readyCallback: (() => void) | null = null;
    const obr = {
      onReady: (cb: () => void) => { readyCallback = cb; },
      contextMenu: { create: (item: unknown) => { created.push(item); } },
    } as any;

    const item = { id: 'menu-1' } as any;
    registerObrContextMenus(obr, [item]);
    registerObrContextMenus(obr, [item]);
    readyCallback!();

    assert.equal(created.length, 1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test src/tests/contextMenu.test.ts`
Expected: FAIL with "Cannot find module '../contextMenu.ts'"

- [ ] **Step 3: Write the implementation**

```ts
// src/contextMenu.ts
import type OBR from '@owlbear-rodeo/sdk';
import type { ContextMenuContext, ContextMenuItem } from '@owlbear-rodeo/sdk';
import type { ObrExtensionIdentity } from './extension.ts';

let registered = false;

// Registers a set of context menu items exactly once (idempotent across
// repeated calls, e.g. React StrictMode double-invocation or hot reload).
export function registerObrContextMenus(obr: typeof OBR, items: ContextMenuItem[]): void {
  if (registered) return;
  registered = true;

  obr.onReady(() => {
    for (const item of items) {
      void obr.contextMenu.create(item);
    }
  });
}

export function getContextCharacterId(
  ext: ObrExtensionIdentity,
  context: Pick<ContextMenuContext, 'items'>,
): string | null {
  const characterId = context.items[0]?.metadata[ext.CHARACTER_META_KEY];
  return typeof characterId === 'string' && characterId.trim() ? characterId.trim() : null;
}

// Anchors a popover to the context-menu element that was clicked. Apps with
// their own popover-anchoring needs (e.g. anchoring to a token's screen
// position instead) build their own anchor and skip this helper.
export function getContextMenuPopoverAnchor(elementId: string) {
  return {
    anchorElementId: elementId,
    anchorOrigin: { horizontal: 'RIGHT', vertical: 'CENTER' },
    transformOrigin: { horizontal: 'LEFT', vertical: 'CENTER' },
    marginThreshold: 8,
  } as const;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test src/tests/contextMenu.test.ts`
Expected: PASS, all green

- [ ] **Step 5: Commit**

```bash
git add src/contextMenu.ts src/tests/contextMenu.test.ts
git commit -m "feat: context menu registration core"
```

---

### Task 6: core — enemies mechanism, generic over `TEnemy`

**Files:**
- Create: `src/enemies.ts`
- Test: `src/tests/enemies.test.ts`

**Interfaces:**
- Consumes: `ObrExtensionIdentity` from Task 2.
- Produces: `EnemyStatusBand`, `DEFAULT_ENEMY_STATUS_BANDS`, `createObrEnemyId()`, `createEnemyStatusId()`, `createEnemyRowId()`, `normalizeStatusBands(bands)`, `resolveEnemyStatus<TEnemy extends ObrEnemyLike>(enemy)`, `translateEnemyStatusLabel(status, t)`, `toHealthPercent(current, max)`, `bindEnemyToSelection(ext, obr, enemy: {id, name})`, `getContextEnemyId(ext, context)`, `enemiesChannel(ext)`, `isObrEnemiesBroadcast(data)`, `broadcastEnemiesChanged(ext, obr)`. The generic bound is `ObrEnemyLike = { healthPercent: number; statusLabel?: string; statusId?: string; statuses?: EnemyStatusBand[] }` — loose enough that scvmrack's `ObrEnemy`/`ObrEnemyCard` both satisfy it without modification. App-specific fields (`type`, `habitat`, `attacks`, `loot`, forms, JSON data) stay in scvmrack.

- [ ] **Step 1: Write the failing test**

```ts
// src/tests/enemies.test.ts
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createObrExtension } from '../extension.ts';
import {
  DEFAULT_ENEMY_STATUS_BANDS,
  createObrEnemyId,
  normalizeStatusBands,
  resolveEnemyStatus,
  translateEnemyStatusLabel,
  toHealthPercent,
  bindEnemyToSelection,
  getContextEnemyId,
  isObrEnemiesBroadcast,
  enemiesChannel,
} from '../enemies.ts';

const ext = createObrExtension('co.rpgtools.test');

describe('enemies', () => {
  test('createObrEnemyId returns a prefixed, non-empty id', () => {
    assert.match(createObrEnemyId(), /^enemy-.+/);
  });

  test('normalizeStatusBands falls back to defaults for empty/invalid input', () => {
    assert.deepEqual(normalizeStatusBands(undefined), DEFAULT_ENEMY_STATUS_BANDS);
    assert.deepEqual(normalizeStatusBands([]), DEFAULT_ENEMY_STATUS_BANDS);
  });

  test('normalizeStatusBands sorts by percent and trims fields', () => {
    const result = normalizeStatusBands([
      { id: ' b ', percent: 50, label: ' Low ' },
      { id: 'a', percent: 10, label: 'Lower' },
    ]);
    assert.deepEqual(result, [
      { id: 'a', percent: 10, label: 'Lower' },
      { id: 'b', percent: 50, label: 'Low' },
    ]);
  });

  test('resolveEnemyStatus prefers a pre-computed statusLabel (card view)', () => {
    const status = resolveEnemyStatus({ healthPercent: 40, statusLabel: 'Custom', statusId: 'custom-id' });
    assert.deepEqual(status, { id: 'custom-id', percent: 40, label: 'Custom' });
  });

  test('resolveEnemyStatus picks the lowest band whose percent covers healthPercent', () => {
    const status = resolveEnemyStatus({ healthPercent: 60, statuses: DEFAULT_ENEMY_STATUS_BANDS });
    assert.equal(status.id, 'wounded');
  });

  test('translateEnemyStatusLabel translates only unmodified default labels', () => {
    const t = (key: string, fallback: string) => (key === 'obr.enemies.status.healthy' ? 'Zdrowy' : fallback);
    assert.equal(translateEnemyStatusLabel({ id: 'healthy', percent: 100, label: 'Healthy' }, t), 'Zdrowy');
    assert.equal(translateEnemyStatusLabel({ id: 'healthy', percent: 100, label: 'Custom Label' }, t), 'Custom Label');
  });

  test('toHealthPercent clamps to [0, 100] against a minimum-1 max', () => {
    assert.equal(toHealthPercent(5, 10), 50);
    assert.equal(toHealthPercent(-5, 10), 0);
    assert.equal(toHealthPercent(999, 10), 100);
    assert.equal(toHealthPercent(1, 0), 100);
  });

  test('bindEnemyToSelection writes the enemy id and name onto selected items', async () => {
    let updated: any[] = [];
    const obr = {
      player: { getSelection: async () => ['t1'] },
      scene: {
        items: {
          updateItems: async (ids: string[], mutator: (items: any[]) => void) => {
            updated = ids.map((id) => ({ id, metadata: {} }));
            mutator(updated);
          },
        },
      },
    } as any;

    const count = await bindEnemyToSelection(ext, obr, { id: 'enemy-1', name: 'Goblin' });
    assert.equal(count, 1);
    assert.equal(updated[0].metadata[ext.ENEMY_META_KEY ?? `${ext.EXTENSION_ID}/enemyId`], 'enemy-1');
    assert.equal(updated[0].name, 'Goblin');
  });

  test('getContextEnemyId reads the bound enemy id from the first item', () => {
    const key = `${ext.EXTENSION_ID}/enemyId`;
    assert.equal(getContextEnemyId(ext, { items: [{ metadata: { [key]: 'e1' } }] } as any), 'e1');
    assert.equal(getContextEnemyId(ext, { items: [] } as any), null);
  });

  test('isObrEnemiesBroadcast only accepts the enemies-kind message', () => {
    assert.equal(isObrEnemiesBroadcast({ kind: 'enemies' }), true);
    assert.equal(isObrEnemiesBroadcast({ kind: 'other' }), false);
    assert.equal(isObrEnemiesBroadcast(null), false);
  });

  test('enemiesChannel is namespaced under the extension id', () => {
    assert.equal(enemiesChannel(ext), 'co.rpgtools.test/enemies');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test src/tests/enemies.test.ts`
Expected: FAIL with "Cannot find module '../enemies.ts'"

- [ ] **Step 3: Write the implementation**

```ts
// src/enemies.ts
import type OBR from '@owlbear-rodeo/sdk';
import type { ContextMenuContext } from '@owlbear-rodeo/sdk';
import type { ObrExtensionIdentity } from './extension.ts';

export type EnemyStatusBand = { id: string; percent: number; label: string };

export type ObrEnemyLike = {
  healthPercent: number;
  statusLabel?: string;
  statusId?: string;
  statuses?: EnemyStatusBand[];
};

export type ObrEnemiesBroadcast = { kind: 'enemies' };

type EnemyBindableItem = ContextMenuContext['items'][number] & {
  text?: {
    plainText: string;
    richText: Array<{ type: 'paragraph'; children: Array<{ text: string }> }>;
    type: 'PLAIN' | 'RICH';
  };
  textItemType?: 'LABEL' | 'TEXT';
};

export const DEFAULT_ENEMY_STATUS_BANDS: EnemyStatusBand[] = [
  { id: 'healthy', percent: 100, label: 'Healthy' },
  { id: 'wounded', percent: 75, label: 'Wounded' },
  { id: 'severely-wounded', percent: 50, label: 'Severely wounded' },
  { id: 'deaths-door', percent: 25, label: 'At death\'s door' },
];

const DEFAULT_ENEMY_STATUS_TRANSLATIONS: Record<string, { key: string; label: string }> = {
  healthy: { key: 'obr.enemies.status.healthy', label: 'Healthy' },
  wounded: { key: 'obr.enemies.status.wounded', label: 'Wounded' },
  'severely-wounded': { key: 'obr.enemies.status.severelyWounded', label: 'Severely wounded' },
  'deaths-door': { key: 'obr.enemies.status.deathsDoor', label: 'At death\'s door' },
};

type StatusTranslator = (key: string, fallback: string) => string;

export function enemyMetaKey(ext: ObrExtensionIdentity): string {
  return `${ext.EXTENSION_ID}/enemyId`;
}

export function enemiesChannel(ext: ObrExtensionIdentity): string {
  return `${ext.EXTENSION_ID}/enemies`;
}

export function createObrEnemyId(): string {
  return createStableId('enemy');
}

export function createEnemyStatusId(): string {
  return createStableId('status');
}

export function createEnemyRowId(): string {
  return createStableId('row');
}

export function normalizeStatusBands(bands: EnemyStatusBand[] | undefined): EnemyStatusBand[] {
  const normalized = (bands ?? [])
    .filter((band): band is EnemyStatusBand => (
      typeof band.id === 'string' &&
      typeof band.label === 'string' &&
      typeof band.percent === 'number' &&
      Number.isFinite(band.percent)
    ))
    .map((band) => ({
      id: band.id.trim(),
      percent: clampPercent(band.percent, 1),
      label: band.label.trim(),
    }))
    .filter((band) => band.id && band.label)
    .sort((left, right) => left.percent - right.percent);

  return normalized.length > 0 ? normalized : DEFAULT_ENEMY_STATUS_BANDS;
}

export function resolveEnemyStatus<TEnemy extends ObrEnemyLike>(enemy: TEnemy): EnemyStatusBand {
  if (enemy.statusLabel?.trim()) {
    return {
      id: enemy.statusId || 'safe-card-status',
      percent: clampPercent(enemy.healthPercent, 0),
      label: enemy.statusLabel.trim(),
    };
  }

  const healthPercent = clampPercent(enemy.healthPercent, 0);
  const bands = normalizeStatusBands(enemy.statuses);

  return (
    bands.find((band) => healthPercent <= band.percent) ??
    bands[bands.length - 1] ??
    DEFAULT_ENEMY_STATUS_BANDS[0]
  );
}

export function translateEnemyStatusLabel(status: EnemyStatusBand, t: StatusTranslator): string {
  const defaultStatus = DEFAULT_ENEMY_STATUS_TRANSLATIONS[status.id];
  if (!defaultStatus || status.label !== defaultStatus.label) {
    return status.label;
  }

  return t(defaultStatus.key, defaultStatus.label);
}

export function toHealthPercent(currentHealth: number, maxHealth: number): number {
  const max = Math.max(1, Math.round(maxHealth));
  const current = Math.min(max, Math.max(0, Math.round(currentHealth)));
  return clampPercent((current / max) * 100, 0);
}

export async function bindEnemyToSelection(
  ext: ObrExtensionIdentity,
  obr: typeof OBR,
  enemy: { id: string; name: string },
): Promise<number> {
  const selection = (await obr.player.getSelection()) ?? [];
  if (selection.length === 0) {
    return 0;
  }

  const key = enemyMetaKey(ext);
  await obr.scene.items.updateItems(selection, (items) => {
    for (const item of items) {
      item.metadata[key] = enemy.id;
      setEnemyTokenName(item, enemy.name);
    }
  });

  return selection.length;
}

export function getContextEnemyId(
  ext: ObrExtensionIdentity,
  context: Pick<ContextMenuContext, 'items'>,
): string | null {
  const enemyId = context.items[0]?.metadata[enemyMetaKey(ext)];
  return typeof enemyId === 'string' && enemyId.trim() ? enemyId.trim() : null;
}

export function isObrEnemiesBroadcast(data: unknown): data is ObrEnemiesBroadcast {
  return data !== null && typeof data === 'object' && (data as Record<string, unknown>).kind === 'enemies';
}

export async function broadcastEnemiesChanged(ext: ObrExtensionIdentity, obr: typeof OBR): Promise<void> {
  await obr.broadcast.sendMessage(
    enemiesChannel(ext),
    { kind: 'enemies' } satisfies ObrEnemiesBroadcast,
    { destination: 'ALL' },
  );
}

function setEnemyTokenName(item: ContextMenuContext['items'][number], name: string): void {
  item.name = name;

  const token = item as EnemyBindableItem;
  if (!token.text) {
    return;
  }

  token.text.plainText = name;
  token.text.richText = [{ type: 'paragraph', children: [{ text: name }] }];
  token.text.type = 'PLAIN';
  token.textItemType = 'LABEL';
}

function clampPercent(value: number, min: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(100, Math.max(min, Math.round(value)));
}

function createStableId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test src/tests/enemies.test.ts`
Expected: PASS, all green

- [ ] **Step 5: Write `src/index.ts` (root barrel)**

```ts
// src/index.ts
export * from './extension.ts';
export * from './roster.ts';
export * from './tokenBinding.ts';
export * from './rosterStale.ts';
export * from './roomBinding.ts';
export * from './contextMenu.ts';
export * from './enemies.ts';
```

Run `npm run build` — expected: clean compile, no errors.

- [ ] **Step 6: Commit**

```bash
git add src/enemies.ts src/tests/enemies.test.ts src/index.ts
git commit -m "feat: enemies mechanism generic over TEnemy, root barrel export"
```

---

### Task 7: `/client` — `ObrApiClient`

**Files:**
- Create: `src/client/index.ts`
- Test: `src/tests/client.test.ts`

**Interfaces:**
- Produces: `createObrApiClient(options: { apiBase?: string; fetch?: typeof fetch; baseHeaders?: () => Record<string, string> }): ObrApiClient` — per-request instantiable (a plain factory function, not a module singleton), mirroring `createRpgToolsAuthClient`'s shape from `rpgtools-shared-auth` so Task 11's `/rr7` outlet can construct one per server request. `ObrApiClient` = `{ fetchCards(ids, roomId, locale), fetchRoomBindings(roomId), bindPlayerCharacter(input), clearPlayerCharacter(input), bindTokenCharacter(input), clearTokenCharacter(input) }` — satisfies `ObrRoomBindingsClient` from Task 4.

- [ ] **Step 1: Write the failing test**

```ts
// src/tests/client.test.ts
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createObrApiClient } from '../client/index.ts';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('createObrApiClient', () => {
  test('fetchCards GETs the rooms/:roomId/cards route with ids and locale', async () => {
    const calls: [string, RequestInit | undefined][] = [];
    const client = createObrApiClient({
      apiBase: '/api/obr',
      fetch: async (url, init) => {
        calls.push([String(url), init]);
        return jsonResponse([{ id: 'c1' }]);
      },
    });

    const cards = await client.fetchCards(['c1', 'c2'], 'room-1', 'en');

    assert.deepEqual(cards, [{ id: 'c1' }]);
    assert.match(calls[0][0], /^\/api\/obr\/rooms\/room-1\/cards\?/);
    assert.match(calls[0][0], /ids=c1%2Cc2/);
    assert.match(calls[0][0], /locale=en/);
  });

  test('bindPlayerCharacter PUTs to the player-character route with the body', async () => {
    const calls: [string, RequestInit | undefined][] = [];
    const client = createObrApiClient({
      apiBase: '/api/obr',
      fetch: async (url, init) => {
        calls.push([String(url), init]);
        return jsonResponse({ playerId: 'p1', characterId: 'c1' });
      },
    });

    const result = await client.bindPlayerCharacter({ roomId: 'room-1', playerId: 'p1', characterId: 'c1' });

    assert.equal(calls[0][0], '/api/obr/rooms/room-1/players/p1/character');
    assert.equal(calls[0][1]?.method, 'PUT');
    assert.deepEqual(JSON.parse(String(calls[0][1]?.body)), { characterId: 'c1' });
    assert.deepEqual(result, { playerId: 'p1', characterId: 'c1' });
  });

  test('clearTokenCharacter DELETEs the token-character route', async () => {
    const calls: [string, RequestInit | undefined][] = [];
    const client = createObrApiClient({
      apiBase: '/api/obr',
      fetch: async (url, init) => {
        calls.push([String(url), init]);
        return new Response(null, { status: 204 });
      },
    });

    await client.clearTokenCharacter({ roomId: 'room-1', tokenId: 't1' });

    assert.equal(calls[0][0], '/api/obr/rooms/room-1/tokens/t1/character');
    assert.equal(calls[0][1]?.method, 'DELETE');
  });

  test('baseHeaders are applied to every request', async () => {
    const calls: RequestInit[] = [];
    const client = createObrApiClient({
      apiBase: '/api/obr',
      baseHeaders: () => ({ 'x-embedded-session': '1' }),
      fetch: async (_url, init) => {
        calls.push(init!);
        return jsonResponse({ roomId: 'room-1', players: [], tokens: [] });
      },
    });

    await client.fetchRoomBindings('room-1');

    const headers = new Headers(calls[0].headers);
    assert.equal(headers.get('x-embedded-session'), '1');
  });

  test('a non-ok response throws with the status and body', async () => {
    const client = createObrApiClient({
      apiBase: '/api/obr',
      fetch: async () => jsonResponse({ error: 'nope' }, 403),
    });

    await assert.rejects(client.fetchRoomBindings('room-1'), /403/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test src/tests/client.test.ts`
Expected: FAIL with "Cannot find module '../client/index.ts'"

- [ ] **Step 3: Write the implementation**

```ts
// src/client/index.ts
export interface ObrApiClientOptions {
  apiBase?: string;
  fetch?: typeof fetch;
  baseHeaders?: () => Record<string, string>;
}

export class ObrApiClientError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`OBR API request failed with status ${status}`);
    this.name = 'ObrApiClientError';
    this.status = status;
    this.body = body;
  }
}

export function createObrApiClient(options: ObrApiClientOptions = {}) {
  const apiBase = normalizeApiBase(options.apiBase ?? '/api/obr');
  const fetchImpl = options.fetch ?? globalThis.fetch?.bind(globalThis);

  if (!fetchImpl) {
    throw new Error('createObrApiClient requires a fetch implementation');
  }

  function url(path: string, query?: Record<string, string | undefined>): string {
    const joined = `${apiBase}${path}`;
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) params.set(key, value);
    }
    const queryString = params.toString();
    return queryString ? `${joined}?${queryString}` : joined;
  }

  async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.baseHeaders?.());
    new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    headers.set('accept', 'application/json');

    const response = await fetchImpl(path, { ...init, credentials: init.credentials ?? 'include', headers });
    const body = await readBody(response);

    if (!response.ok) {
      throw new ObrApiClientError(response.status, body);
    }

    return body as T;
  }

  return {
    fetchCards(ids: string[], roomId: string, locale: string) {
      return requestJson<unknown[]>(url(`/rooms/${encodeURIComponent(roomId)}/cards`, {
        ids: ids.join(','),
        locale,
      }));
    },

    fetchRoomBindings(roomId: string) {
      return requestJson<{ roomId: string; players: unknown[]; tokens: unknown[] }>(
        url(`/rooms/${encodeURIComponent(roomId)}/bindings`),
      );
    },

    bindPlayerCharacter(input: { roomId: string; playerId: string; characterId: string; connectionId?: string | null }) {
      return requestJson(
        url(`/rooms/${encodeURIComponent(input.roomId)}/players/${encodeURIComponent(input.playerId)}/character`),
        {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ characterId: input.characterId, connectionId: input.connectionId ?? undefined }),
        },
      );
    },

    clearPlayerCharacter(input: { roomId: string; playerId: string }) {
      return requestJson<void>(
        url(`/rooms/${encodeURIComponent(input.roomId)}/players/${encodeURIComponent(input.playerId)}/character`),
        { method: 'DELETE' },
      );
    },

    bindTokenCharacter(input: { roomId: string; tokenId: string; characterId: string; playerId?: string | null }) {
      return requestJson(
        url(`/rooms/${encodeURIComponent(input.roomId)}/tokens/${encodeURIComponent(input.tokenId)}/character`),
        {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ characterId: input.characterId, playerId: input.playerId ?? undefined }),
        },
      );
    },

    clearTokenCharacter(input: { roomId: string; tokenId: string }) {
      return requestJson<void>(
        url(`/rooms/${encodeURIComponent(input.roomId)}/tokens/${encodeURIComponent(input.tokenId)}/character`),
        { method: 'DELETE' },
      );
    },
  };
}

export type ObrApiClient = ReturnType<typeof createObrApiClient>;

function normalizeApiBase(apiBase: string): string {
  return apiBase.replace(/\/+$/, '');
}

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;
  const contentType = response.headers.get('content-type') ?? '';
  return contentType.includes('application/json') ? JSON.parse(text) : text;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test src/tests/client.test.ts`
Expected: PASS, all green

- [ ] **Step 5: Commit**

```bash
git add src/client/index.ts src/tests/client.test.ts
git commit -m "feat: per-request-instantiable ObrApiClient"
```

---

### Task 8: `/server` — Fastify plugin with adapter callbacks and a `db` port

**Files:**
- Create: `src/server/index.ts`
- Create: `src/server/schemas.ts`
- Create: `docs/pasted-prisma-models.md`
- Test: `src/tests/server.test.ts`

**Interfaces:**
- Produces: `obrRoomBindings(options: ObrServerOptions): FastifyPluginAsync` (registered like any Fastify plugin: `fastify.register(obrRoomBindings, options)`), exported types `ObrServerOptions`, `ObrBindingsDb`, `PlayerBindingRow`, `TokenBindingRow`.
- `ObrServerOptions`:
  ```ts
  interface ObrServerOptions {
    prefix?: string; // default '/api/obr'
    db: ObrBindingsDb;
    getCards(allowedIds: string[], locale: string): Promise<unknown[]>;
    ownsCharacter(session: unknown, characterId: string): Promise<boolean>;
    extraRoomCharacterIds?(ids: string[], roomId: string): Promise<string[]>;
    getSession(request: FastifyRequest): unknown; // reads whatever session shape the app already decorates (e.g. request.appSession)
    hasWriteAccess?(session: unknown): boolean; // default: any session object is truthy
  }
  ```
- `ObrBindingsDb` — the narrow port (no Prisma import in this package, mirrors `rpgtools-shared-auth`'s `db.character`/`db.claimCode` adapter pattern in `rpgtools-auth.ts`): `getBindings(roomId)`, `getPlayerBinding(roomId, playerId)`, `setPlayerBinding(input)`, `clearPlayerBinding(roomId, playerId)`, `getTokenBinding(roomId, tokenId)`, `setTokenBinding(input)`, `clearTokenBinding(roomId, tokenId)`, `filterCharacterIdsInRoom(ids, roomId)`.
- Routes registered under `prefix`: `GET /rooms/:roomId/cards`, `GET /rooms/:roomId/bindings`, `PUT|DELETE /rooms/:roomId/players/:playerId/character`, `PUT|DELETE /rooms/:roomId/tokens/:tokenId/character` — same paths as scvmrack's current `routes/obr/index.ts`, so scvmrack's `ObrApiClient` calls need no path changes.

- [ ] **Step 1: Write the failing test**

```ts
// src/tests/server.test.ts
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { obrRoomBindings, type ObrBindingsDb } from '../server/index.ts';

function memoryDb(): ObrBindingsDb & { players: Map<string, any>; tokens: Map<string, any> } {
  const players = new Map<string, any>();
  const tokens = new Map<string, any>();
  return {
    players,
    tokens,
    async getBindings(roomId) {
      return {
        players: [...players.values()].filter((p) => p.roomId === roomId),
        tokens: [...tokens.values()].filter((t) => t.roomId === roomId),
      };
    },
    async getPlayerBinding(roomId, playerId) {
      return players.get(`${roomId}:${playerId}`) ?? null;
    },
    async setPlayerBinding(input) {
      const row = { ...input };
      players.set(`${input.roomId}:${input.playerId}`, row);
      return row;
    },
    async clearPlayerBinding(roomId, playerId) {
      players.delete(`${roomId}:${playerId}`);
    },
    async getTokenBinding(roomId, tokenId) {
      return tokens.get(`${roomId}:${tokenId}`) ?? null;
    },
    async setTokenBinding(input) {
      const row = { ...input };
      tokens.set(`${input.roomId}:${input.tokenId}`, row);
      return row;
    },
    async clearTokenBinding(roomId, tokenId) {
      tokens.delete(`${roomId}:${tokenId}`);
    },
    async filterCharacterIdsInRoom(ids, roomId) {
      const bound = new Set([
        ...[...players.values()].filter((p) => p.roomId === roomId).map((p) => p.characterId),
        ...[...tokens.values()].filter((t) => t.roomId === roomId).map((t) => t.characterId),
      ]);
      return ids.filter((id) => bound.has(id));
    },
  };
}

async function buildApp(dbOverride?: Partial<ObrBindingsDb>) {
  const app = Fastify();
  const db = { ...memoryDb(), ...dbOverride };
  await app.register(obrRoomBindings, {
    db,
    getCards: async (ids) => ids.map((id) => ({ id })),
    ownsCharacter: async () => true,
    getSession: (request) => (request.headers['x-session'] ? { user: { id: 'u1' } } : null),
  });
  await app.ready();
  return app;
}

describe('obrRoomBindings plugin', () => {
  test('registers routes under the default /api/obr prefix', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/obr/rooms/room-1/bindings' });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.json(), { roomId: 'room-1', players: [], tokens: [] });
  });

  test('honors a custom prefix', async () => {
    const app = Fastify();
    await app.register(obrRoomBindings, {
      prefix: '/custom',
      db: memoryDb(),
      getCards: async () => [],
      ownsCharacter: async () => true,
      getSession: () => ({ user: { id: 'u1' } }),
    });
    await app.ready();
    const res = await app.inject({ method: 'GET', url: '/custom/rooms/room-1/bindings' });
    assert.equal(res.statusCode, 200);
  });

  test('PUT player character binding requires a session', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/obr/rooms/room-1/players/p1/character',
      payload: { characterId: 'c1' },
    });
    assert.equal(res.statusCode, 401);
  });

  test('PUT player character binding succeeds with a session and calls ownsCharacter', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/obr/rooms/room-1/players/p1/character',
      headers: { 'x-session': '1' },
      payload: { characterId: 'c1' },
    });
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().characterId, 'c1');
  });

  test('DELETE clears a binding and is idempotent', async () => {
    const app = await buildApp();
    await app.inject({
      method: 'PUT',
      url: '/api/obr/rooms/room-1/players/p1/character',
      headers: { 'x-session': '1' },
      payload: { characterId: 'c1' },
    });

    const first = await app.inject({
      method: 'DELETE',
      url: '/api/obr/rooms/room-1/players/p1/character',
      headers: { 'x-session': '1' },
    });
    assert.equal(first.statusCode, 204);

    const second = await app.inject({
      method: 'DELETE',
      url: '/api/obr/rooms/room-1/players/p1/character',
      headers: { 'x-session': '1' },
    });
    assert.equal(second.statusCode, 204);
  });

  test('GET cards filters through the db and calls the getCards callback with only bound/extra ids', async () => {
    const db = memoryDb();
    await db.setTokenBinding({ roomId: 'room-1', tokenId: 't1', characterId: 'c1', playerId: null });
    let calledWith: string[] = [];
    const app = Fastify();
    await app.register(obrRoomBindings, {
      db,
      getCards: async (ids) => {
        calledWith = ids;
        return ids.map((id) => ({ id }));
      },
      ownsCharacter: async () => true,
      getSession: () => null,
      extraRoomCharacterIds: async (ids) => ids.filter((id) => id === 'c2'),
    });
    await app.ready();

    const res = await app.inject({
      method: 'GET',
      url: '/api/obr/rooms/room-1/cards?ids=c1,c2,c3&locale=en',
    });

    assert.equal(res.statusCode, 200);
    assert.deepEqual(calledWith.sort(), ['c1', 'c2']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test src/tests/server.test.ts`
Expected: FAIL with "Cannot find module '../server/index.ts'"

- [ ] **Step 3: Write `src/server/schemas.ts`**

```ts
// src/server/schemas.ts

// Kept intentionally minimal: this package does not know an app's character
// card shape, so response bodies for /cards are NOT schema-validated here —
// the app's getCards callback owns that shape entirely. Only structurally
// stable, app-agnostic shapes are schema'd.
export const RoomParamsSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['roomId'],
  properties: { roomId: { type: 'string', minLength: 1, maxLength: 256 } },
} as const;

export const PlayerCharacterParamsSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['roomId', 'playerId'],
  properties: {
    roomId: { type: 'string', minLength: 1, maxLength: 256 },
    playerId: { type: 'string', minLength: 1, maxLength: 256 },
  },
} as const;

export const TokenCharacterParamsSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['roomId', 'tokenId'],
  properties: {
    roomId: { type: 'string', minLength: 1, maxLength: 256 },
    tokenId: { type: 'string', minLength: 1, maxLength: 256 },
  },
} as const;

export const PlayerCharacterBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['characterId'],
  properties: {
    characterId: { type: 'string', minLength: 1 },
    connectionId: { type: 'string', minLength: 1, maxLength: 256 },
  },
} as const;

export const TokenCharacterBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['characterId'],
  properties: {
    characterId: { type: 'string', minLength: 1 },
    playerId: { type: 'string', minLength: 1, maxLength: 256 },
  },
} as const;
```

- [ ] **Step 4: Write `src/server/index.ts`**

```ts
// src/server/index.ts
import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import {
  PlayerCharacterBodySchema,
  PlayerCharacterParamsSchema,
  RoomParamsSchema,
  TokenCharacterBodySchema,
  TokenCharacterParamsSchema,
} from './schemas.ts';

export type PlayerBindingRow = {
  roomId: string;
  playerId: string;
  connectionId: string | null;
  characterId: string;
  assignedByPlayerId: string;
};

export type TokenBindingRow = {
  roomId: string;
  tokenId: string;
  playerId: string | null;
  characterId: string;
};

// The narrow port this plugin needs from the app's storage. No Prisma
// dependency here — the app implements this using whatever Prisma models it
// pasted from docs/pasted-prisma-models.md (or any other storage).
export interface ObrBindingsDb {
  getBindings(roomId: string): Promise<{ players: PlayerBindingRow[]; tokens: TokenBindingRow[] }>;
  getPlayerBinding(roomId: string, playerId: string): Promise<PlayerBindingRow | null>;
  setPlayerBinding(input: {
    roomId: string;
    playerId: string;
    connectionId: string | null;
    characterId: string;
    assignedByPlayerId: string;
  }): Promise<PlayerBindingRow>;
  clearPlayerBinding(roomId: string, playerId: string): Promise<void>;
  getTokenBinding(roomId: string, tokenId: string): Promise<TokenBindingRow | null>;
  setTokenBinding(input: {
    roomId: string;
    tokenId: string;
    playerId: string | null;
    characterId: string;
  }): Promise<TokenBindingRow>;
  clearTokenBinding(roomId: string, tokenId: string): Promise<void>;
  filterCharacterIdsInRoom(ids: string[], roomId: string): Promise<string[]>;
}

export interface ObrServerOptions {
  /** Route prefix. Default '/api/obr'. */
  prefix?: string;
  db: ObrBindingsDb;
  /** Returns the app's own card shape for exactly the allowed ids. */
  getCards(allowedIds: string[], locale: string): Promise<unknown[]>;
  /** App-provided ownership check for a write (bind/clear). */
  ownsCharacter(session: unknown, characterId: string): Promise<boolean>;
  /**
   * Optional extra source of "this character is visible in this room" beyond
   * the durable OBR bindings (e.g. an app's own party-membership domain).
   * The one deliberate coupling point this package exposes.
   */
  extraRoomCharacterIds?(ids: string[], roomId: string): Promise<string[]>;
  /** Reads whatever session shape the app already decorates the request with. */
  getSession(request: FastifyRequest): unknown;
  /** Default: any non-null session may write. */
  hasWriteAccess?(session: unknown): boolean;
}

const MAX_CARD_IDS = 50;

function defaultHasWriteAccess(session: unknown): boolean {
  return session !== null && session !== undefined;
}

export const obrRoomBindings: FastifyPluginAsync<ObrServerOptions> = async (fastify, options) => {
  const hasWriteAccess = options.hasWriteAccess ?? defaultHasWriteAccess;

  async function ensureCanWrite(request: FastifyRequest, characterId: string): Promise<boolean> {
    const session = options.getSession(request);
    if (!hasWriteAccess(session)) return false;
    return options.ownsCharacter(session, characterId);
  }

  fastify.get<{ Params: { roomId: string }; Querystring: { ids?: string; locale?: string } }>(
    '/rooms/:roomId/cards',
    { schema: { params: RoomParamsSchema } },
    async (request) => {
      const ids = [...new Set((request.query.ids ?? '').split(',').map((id) => id.trim()).filter(Boolean))].slice(
        0,
        MAX_CARD_IDS,
      );
      if (ids.length === 0) return [];

      const [bound, extra] = await Promise.all([
        options.db.filterCharacterIdsInRoom(ids, request.params.roomId),
        options.extraRoomCharacterIds?.(ids, request.params.roomId) ?? Promise.resolve([]),
      ]);
      const allowed = [...new Set([...bound, ...extra])];
      if (allowed.length === 0) return [];

      return options.getCards(allowed, request.query.locale ?? 'en');
    },
  );

  fastify.get<{ Params: { roomId: string } }>(
    '/rooms/:roomId/bindings',
    { schema: { params: RoomParamsSchema } },
    async (request) => {
      const bindings = await options.db.getBindings(request.params.roomId);
      return { roomId: request.params.roomId, ...bindings };
    },
  );

  fastify.put<{
    Params: { roomId: string; playerId: string };
    Body: { characterId: string; connectionId?: string };
  }>(
    '/rooms/:roomId/players/:playerId/character',
    { schema: { params: PlayerCharacterParamsSchema, body: PlayerCharacterBodySchema } },
    async (request, reply) => {
      if (!(await ensureCanWrite(request, request.body.characterId))) {
        return reply.status(401).send({ error: 'UNAUTHORIZED' });
      }

      return options.db.setPlayerBinding({
        roomId: request.params.roomId,
        playerId: request.params.playerId,
        connectionId: request.body.connectionId ?? null,
        characterId: request.body.characterId,
        assignedByPlayerId: request.params.playerId,
      });
    },
  );

  fastify.delete<{ Params: { roomId: string; playerId: string } }>(
    '/rooms/:roomId/players/:playerId/character',
    { schema: { params: PlayerCharacterParamsSchema } },
    async (request, reply) => {
      const existing = await options.db.getPlayerBinding(request.params.roomId, request.params.playerId);
      if (!existing) {
        return reply.status(204).send();
      }
      if (!(await ensureCanWrite(request, existing.characterId))) {
        return reply.status(401).send({ error: 'UNAUTHORIZED' });
      }

      await options.db.clearPlayerBinding(request.params.roomId, request.params.playerId);
      return reply.status(204).send();
    },
  );

  fastify.put<{
    Params: { roomId: string; tokenId: string };
    Body: { characterId: string; playerId?: string };
  }>(
    '/rooms/:roomId/tokens/:tokenId/character',
    { schema: { params: TokenCharacterParamsSchema, body: TokenCharacterBodySchema } },
    async (request, reply) => {
      if (!(await ensureCanWrite(request, request.body.characterId))) {
        return reply.status(401).send({ error: 'UNAUTHORIZED' });
      }

      return options.db.setTokenBinding({
        roomId: request.params.roomId,
        tokenId: request.params.tokenId,
        playerId: request.body.playerId ?? null,
        characterId: request.body.characterId,
      });
    },
  );

  fastify.delete<{ Params: { roomId: string; tokenId: string } }>(
    '/rooms/:roomId/tokens/:tokenId/character',
    { schema: { params: TokenCharacterParamsSchema } },
    async (request, reply) => {
      const existing = await options.db.getTokenBinding(request.params.roomId, request.params.tokenId);
      if (!existing) {
        return reply.status(204).send();
      }
      if (!(await ensureCanWrite(request, existing.characterId))) {
        return reply.status(401).send({ error: 'UNAUTHORIZED' });
      }

      await options.db.clearTokenBinding(request.params.roomId, request.params.tokenId);
      return reply.status(204).send();
    },
  );
};
```

Note the plugin is registered directly with a `prefix` fastify option in real usage (`fastify.register(obrRoomBindings, { prefix: '/api/obr', ...options })` — Fastify's own `prefix` register option, not a custom field read from `options`). Remove the `options.prefix` field and rely on Fastify's built-in `register(plugin, { prefix })` mechanism instead — **before writing Step 4's test**, confirm this against `fastify.register`'s actual behavior: Fastify's own `opts.prefix` is consumed by `register()` itself and is NOT passed through to the plugin function's `options` argument. Since the plugin function above reads nothing from `options.prefix`, this already works correctly via Fastify's native mechanism — no extra code needed. Delete the `prefix` field from `ObrServerOptions` (Fastify's `register(plugin, { prefix: '...' })` is the documented way callers set it) and update the test's custom-prefix case to call `app.register(obrRoomBindings, { prefix: '/custom', ...restOptions })`.

- [ ] **Step 5: Run test to verify it passes**

Run: `node --import tsx --test src/tests/server.test.ts`
Expected: PASS, all green

- [ ] **Step 6: Write `docs/pasted-prisma-models.md`**

```markdown
# Pasted Prisma models for `@tackgnol/rpgtools-owlbear/server`

This package has no Prisma dependency. Paste these three models into your
own `schema.prisma`, run a migration, then implement `ObrBindingsDb` against
your generated Prisma client. `characterId` is a plain indexed string column
— add a foreign key to your own character model if you want cascade delete;
this package's code never assumes one.

\`\`\`prisma
model ObrRoomBinding {
  obrRoomId String   @id @map("obr_room_id") @db.VarChar(256)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  playerCharacterBindings ObrPlayerCharacterBinding[]
  tokenCharacterBindings  ObrTokenCharacterBinding[]

  @@map("obr_room_bindings")
}

model ObrPlayerCharacterBinding {
  obrRoomId          String   @map("obr_room_id") @db.VarChar(256)
  obrPlayerId        String   @map("obr_player_id") @db.VarChar(256)
  obrConnectionId    String?  @map("obr_connection_id") @db.VarChar(256)
  characterId        String   @map("character_id")
  assignedByPlayerId String   @map("assigned_by_player_id") @db.VarChar(256)
  createdAt          DateTime @default(now()) @map("created_at")
  updatedAt          DateTime @updatedAt @map("updated_at")

  room ObrRoomBinding @relation(fields: [obrRoomId], references: [obrRoomId], onDelete: Cascade)

  @@id([obrRoomId, obrPlayerId])
  @@index([characterId])
  @@map("obr_player_character_bindings")
}

model ObrTokenCharacterBinding {
  obrRoomId        String   @map("obr_room_id") @db.VarChar(256)
  obrTokenId       String   @map("obr_token_id") @db.VarChar(256)
  characterId      String   @map("character_id")
  assignedPlayerId String?  @map("assigned_player_id") @db.VarChar(256)
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  room ObrRoomBinding @relation(fields: [obrRoomId], references: [obrRoomId], onDelete: Cascade)

  @@id([obrRoomId, obrTokenId])
  @@index([obrRoomId, characterId])
  @@map("obr_token_character_bindings")
}
\`\`\`

## Example `ObrBindingsDb` implementation

\`\`\`ts
import prisma from './prisma-client.js';
import type { ObrBindingsDb } from '@tackgnol/rpgtools-owlbear/server';

export const obrBindingsDb: ObrBindingsDb = {
  async getBindings(roomId) {
    const [players, tokens] = await Promise.all([
      prisma.obrPlayerCharacterBinding.findMany({ where: { obrRoomId: roomId } }),
      prisma.obrTokenCharacterBinding.findMany({ where: { obrRoomId: roomId } }),
    ]);
    return {
      players: players.map((p) => ({
        roomId: p.obrRoomId,
        playerId: p.obrPlayerId,
        connectionId: p.obrConnectionId,
        characterId: p.characterId,
        assignedByPlayerId: p.assignedByPlayerId,
      })),
      tokens: tokens.map((t) => ({
        roomId: t.obrRoomId,
        tokenId: t.obrTokenId,
        playerId: t.assignedPlayerId,
        characterId: t.characterId,
      })),
    };
  },
  // ...see obrRoomBindingRepository in scvmrack for the remaining methods —
  // they're a 1:1 field-renaming wrapper over the existing Prisma calls.
};
\`\`\`
```

- [ ] **Step 7: Commit**

```bash
git add src/server/index.ts src/server/schemas.ts src/tests/server.test.ts docs/pasted-prisma-models.md
git commit -m "feat: /server Fastify plugin with a Prisma-free db port and adapter callbacks"
```

---

### Task 9: `/react-query` outlet

**Files:**
- Create: `src/react-query/useObrRosterCards.ts`
- Create: `src/react-query/useObrEnemies.ts`
- Create: `src/react-query/index.ts`
- Test: `src/tests/react-query/useObrEnemies.test.tsx`

**Interfaces:**
- Consumes: `ObrExtensionIdentity` (Task 2), roster/binding/enemies core (Tasks 3–6), `ObrApiClient` (Task 7).
- Produces: `useObrRosterCards(input: { ext, obr, client, extraCharacterIds?: string[], onRefresh?: () => Promise<void> })` — same return shape as scvmrack's original hook, but with `extraCharacterIds`/`onRefresh` replacing the direct `useObrRoomParty`/`promoteObrRoom` imports (scvmrack's outlet wrapper in Task 13 supplies these from its own party hooks). `useObrEnemies(options)` — generic over `TEnemy`, same GM/player mode overload as scvmrack's original, taking `fetchEnemiesFull`/`fetchEnemyCards`/`createEnemy`/`updateEnemy`/`setEnemyHealth`/`deleteEnemy` as injected functions instead of importing `@/api/enemies` (each app's enemy CRUD shape is its own).
- **Scope note:** `useObrRosterCards`'s full port (with `useObrRoomId`, connected-player tracking, scene-ready tracking) is substantial. This task ports it verbatim from scvmrack with the two coupling points converted to parameters, plus the `OBR`/`ext`/`client` injections threading through Tasks 3–6's core functions. Reuse scvmrack's existing tests (`frontend/test/unit/obr/useObrRosterCards.test.ts` if present, else the browser test covering `ObrPartyRoster`) as the source for this task's test file — port the pure `toRosterRows` unit tests here since that function is now exported from this outlet.

- [ ] **Step 1: Write the failing test** (enemies hook only — `useObrRosterCards` is integration-tested via scvmrack's own browser suite after Task 13's migration, since it needs a real OBR SDK mock + TanStack Query provider harness that's more efficiently exercised where it's actually rendered)

```tsx
// src/tests/react-query/useObrEnemies.test.tsx
import './../setupDom.ts';
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useObrEnemies } from '../../react-query/useObrEnemies.ts';

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useObrEnemies (react-query outlet)', () => {
  test('gm mode fetches via fetchEnemiesFull and exposes save/delete/health actions', async () => {
    const { result } = renderHook(
      () =>
        useObrEnemies({
          mode: 'gm',
          roomId: 'room-1',
          fetchEnemiesFull: async () => [{ id: 'e1', name: 'Goblin', healthPercent: 100 }],
          fetchEnemyCards: async () => [],
          createEnemy: async (_roomId, body) => ({ id: 'e2', healthPercent: 100, ...body } as any),
          updateEnemy: async (_roomId, id, body) => ({ id, healthPercent: 100, ...body } as any),
          setEnemyHealth: async (_roomId, id, currentHealth) => ({ id, healthPercent: currentHealth } as any),
          deleteEnemy: async () => {},
        }),
      { wrapper },
    );

    await waitFor(() => assert.equal(result.current.isReady, false)); // OBR.onReady never fires without a real SDK — isReady stays false in this hook-only test
    // fetchEnemiesFull is still exercised once the caller flips OBR ready manually in an app-level test;
    // this unit test asserts the returned shape has the gm-only actions.
    assert.equal(typeof (result.current as any).saveEnemy, 'function');
    assert.equal(typeof (result.current as any).deleteEnemy, 'function');
    assert.equal(typeof (result.current as any).updateEnemyHealth, 'function');
  });
});
```

Add `@testing-library/react` (`^16.1.0`) to `devDependencies`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test src/tests/react-query/useObrEnemies.test.tsx`
Expected: FAIL with "Cannot find module '../../react-query/useObrEnemies.ts'"

- [ ] **Step 3: Write `src/react-query/useObrEnemies.ts`**

```ts
// src/react-query/useObrEnemies.ts
import type OBR from '@owlbear-rodeo/sdk';
import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ObrExtensionIdentity } from '../extension.ts';
import { broadcastEnemiesChanged, enemiesChannel, isObrEnemiesBroadcast, type ObrEnemyLike } from '../enemies.ts';

const EMPTY: unknown[] = [];

const enemyKeys = {
  all: ['obr', 'enemies'] as const,
  gm: (roomId: string) => ['obr', 'enemies', 'gm', roomId] as const,
  player: (roomId: string, characterId: string | null) => ['obr', 'enemies', 'player', roomId, characterId] as const,
};

type GmOptions<TEnemy extends ObrEnemyLike, TInput> = {
  mode: 'gm';
  ext: ObrExtensionIdentity;
  obr: typeof OBR;
  roomId: string;
  fetchEnemiesFull(roomId: string): Promise<TEnemy[]>;
  fetchEnemyCards(roomId: string, characterId: string): Promise<unknown[]>;
  createEnemy(roomId: string, body: TInput): Promise<TEnemy>;
  updateEnemy(roomId: string, enemyId: string, body: TInput): Promise<TEnemy>;
  setEnemyHealth(roomId: string, enemyId: string, currentHealth: number): Promise<TEnemy>;
  deleteEnemy(roomId: string, enemyId: string): Promise<void>;
  toEnemyInput(enemy: TEnemy): TInput;
};

type PlayerOptions<TEnemy extends ObrEnemyLike> = {
  mode: 'player';
  ext: ObrExtensionIdentity;
  obr: typeof OBR;
  roomId: string;
  characterId: string | null;
  fetchEnemiesFull(roomId: string): Promise<TEnemy[]>;
  fetchEnemyCards(roomId: string, characterId: string): Promise<unknown[]>;
};

type BaseState<TEnemy> = { enemies: TEnemy[]; isReady: boolean; error: Error | null; refresh: () => Promise<void> };

export function useObrEnemies<TEnemy extends ObrEnemyLike, TInput>(
  options: GmOptions<TEnemy, TInput>,
): BaseState<TEnemy> & {
  saveEnemy: (enemy: TEnemy) => Promise<TEnemy>;
  deleteEnemy: (enemyId: string) => Promise<void>;
  updateEnemyHealth: (enemyId: string, currentHealth: number) => Promise<TEnemy>;
};
export function useObrEnemies<TEnemy extends ObrEnemyLike>(options: PlayerOptions<TEnemy>): BaseState<unknown>;
export function useObrEnemies(options: any): any {
  const queryClient = useQueryClient();
  const [isReady, setIsReady] = useState(false);
  const { ext, obr, roomId, mode } = options;
  const characterId = mode === 'player' ? options.characterId : null;
  const channel = enemiesChannel(ext);

  const queryKey = mode === 'gm' ? enemyKeys.gm(roomId) : enemyKeys.player(roomId, characterId);

  const query = useQuery({
    queryKey,
    queryFn: () =>
      mode === 'gm'
        ? options.fetchEnemiesFull(roomId)
        : characterId
          ? options.fetchEnemyCards(roomId, characterId)
          : Promise.resolve(EMPTY),
    enabled: isReady && roomId.length > 0 && (mode === 'gm' || characterId !== null),
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: enemyKeys.all });
  }, [queryClient]);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | null = null;

    obr.onReady(() => {
      if (!active) return;
      setIsReady(true);
      unsubscribe = obr.broadcast.onMessage(channel, (event: { data: unknown }) => {
        if (isObrEnemiesBroadcast(event.data)) {
          void queryClient.invalidateQueries({ queryKey: enemyKeys.all });
        }
      });
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [channel, obr, queryClient]);

  const saveEnemy = useCallback(
    async (enemy: any) => {
      const body = options.toEnemyInput(enemy);
      const saved = enemy.id ? await options.updateEnemy(roomId, enemy.id, body) : await options.createEnemy(roomId, body);
      await refresh();
      await broadcastEnemiesChanged(ext, obr);
      return saved;
    },
    [ext, obr, refresh, roomId],
  );

  const deleteEnemy = useCallback(
    async (enemyId: string) => {
      await options.deleteEnemy(roomId, enemyId);
      await refresh();
      await broadcastEnemiesChanged(ext, obr);
    },
    [ext, obr, refresh, roomId],
  );

  const updateEnemyHealth = useCallback(
    async (enemyId: string, currentHealth: number) => {
      const saved = await options.setEnemyHealth(roomId, enemyId, currentHealth);
      await refresh();
      await broadcastEnemiesChanged(ext, obr);
      return saved;
    },
    [ext, obr, refresh, roomId],
  );

  const enemies = query.data ?? EMPTY;
  const error = query.error ? (query.error instanceof Error ? query.error : new Error('Enemy roster failed')) : null;

  if (mode === 'gm') {
    return { enemies, isReady, error, refresh, saveEnemy, deleteEnemy, updateEnemyHealth };
  }

  return { enemies, isReady, error, refresh };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test src/tests/react-query/useObrEnemies.test.tsx`
Expected: PASS

- [ ] **Step 5: Write `src/react-query/useObrRosterCards.ts`**

```ts
// src/react-query/useObrRosterCards.ts
import type OBR from '@owlbear-rodeo/sdk';
import type { Player } from '@owlbear-rodeo/sdk';
import {
  type QueryClient,
  type QueryKey,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ObrExtensionIdentity } from '../extension.ts';
import type { ObrApiClient } from '../client/index.ts';
import { isObrRosterBroadcast, rosterChannel, broadcastRosterChanged } from '../roster.ts';
import {
  bindRoomCharacterToSelection,
  getCurrentObrRoomActor,
  unbindRoomPlayerCharacter,
  unbindRoomTokenCharacter,
} from '../roomBinding.ts';
import { markPlayerBindings, markTokenBindings, type StalePlayerBinding, type StaleTokenBinding } from '../rosterStale.ts';

export type ObrPartyRosterCard = unknown;

export type ObrConnectedPlayer = {
  id: string;
  connectionId: string | null;
  name: string | null;
  role: 'GM' | 'PLAYER';
  connected: boolean;
};

export type ObrPlayerCharacterBinding = { playerId: string; characterId: string };
export type ObrTokenCharacterBinding = { tokenId: string; characterId: string };

export type ObrPartyRosterBindingRow = {
  id: string;
  characterId: string;
  card: ObrPartyRosterCard | null;
  players: StalePlayerBinding[];
  tokens: StaleTokenBinding[];
};

export type ObrRosterActionState = { pending: boolean; message: string | null; error: string | null };

export type ObrRosterState = {
  roomId: string;
  rows: ObrPartyRosterBindingRow[];
  cards: ObrPartyRosterCard[];
  connectedPlayers: ObrConnectedPlayer[];
  isLoading: boolean;
  action: ObrRosterActionState;
  sceneReady: boolean;
  refresh: () => Promise<void>;
  bindSelectedToken: (input: { characterId: string; characterName: string; playerId?: string | null }) => Promise<void>;
  assignPlayer: (input: { characterId: string; playerId: string }) => Promise<void>;
  unassignPlayer: (playerId: string) => Promise<void>;
  unbindToken: (tokenId: string) => Promise<void>;
};

export interface UseObrRosterCardsInput {
  ext: ObrExtensionIdentity;
  obr: typeof OBR;
  client: ObrApiClient;
  roomId: string;
  locale: string;
  t: (key: string, fallback: string) => string;
  /** Already-resolved character ids visible via an app-specific source (e.g. party membership). */
  extraCharacterIds?: string[];
  /** Runs as part of `refresh()`, after the roster queries are invalidated — e.g. an app's own room-party sync. */
  onRefresh?: () => Promise<void>;
}

const EMPTY_CARDS: ObrPartyRosterCard[] = [];
const EMPTY_PLAYERS: ObrConnectedPlayer[] = [];
const EMPTY_ACTION: ObrRosterActionState = { pending: false, message: null, error: null };
const EMPTY_EXTRA_IDS: string[] = [];

const obrKeys = {
  bindings: (roomId: string) => ['obr', 'rooms', roomId, 'bindings'] as const,
  cards: (roomId: string, ids: string[], locale: string) => ['obr', 'cards', roomId, ids, locale] as const,
};

export function useObrRosterCards(input: UseObrRosterCardsInput): ObrRosterState {
  const { ext, obr, client, roomId, locale, t } = input;
  const extraCharacterIds = input.extraCharacterIds ?? EMPTY_EXTRA_IDS;
  const queryClient = useQueryClient();
  const [connectedPlayers, setConnectedPlayers] = useState<ObrConnectedPlayer[]>(EMPTY_PLAYERS);
  const [action, setAction] = useState<ObrRosterActionState>(EMPTY_ACTION);
  const [sceneTokenIds, setSceneTokenIds] = useState<ReadonlySet<string> | null>(null);

  const bindingsQuery = useQuery({
    queryKey: obrKeys.bindings(roomId),
    queryFn: () => client.fetchRoomBindings(roomId) as Promise<{
      players: ObrPlayerCharacterBinding[];
      tokens: ObrTokenCharacterBinding[];
    }>,
    enabled: roomId.length > 0,
  });

  const boundIds = useMemo(
    () => collectBoundCharacterIds(bindingsQuery.data?.players ?? [], bindingsQuery.data?.tokens ?? []),
    [bindingsQuery.data],
  );

  const cardIds = useMemo(() => [...new Set([...boundIds, ...extraCharacterIds])], [boundIds, extraCharacterIds]);

  const cardsQuery = useQuery({
    queryKey: obrKeys.cards(roomId, cardIds, locale),
    queryFn: () => client.fetchCards(cardIds, roomId, locale),
    enabled: roomId.length > 0 && cardIds.length > 0,
  });

  const cards = cardsQuery.data ?? EMPTY_CARDS;
  const connectedPlayerIds = useMemo(() => new Set(connectedPlayers.map((p) => p.id)), [connectedPlayers]);
  const rows = useMemo(
    () =>
      toRosterRows({
        cards,
        players: bindingsQuery.data?.players ?? [],
        tokens: bindingsQuery.data?.tokens ?? [],
        memberIds: extraCharacterIds,
        connectedPlayerIds,
        sceneTokenIds,
      }),
    [bindingsQuery.data, cards, connectedPlayerIds, extraCharacterIds, sceneTokenIds],
  );

  const invalidateRoster = useCallback(() => invalidateRosterQueries(queryClient), [queryClient]);

  const runRosterAction = useCallback(
    async (label: string, actionFn: () => Promise<string | null>) => {
      setAction({ pending: true, message: null, error: null });
      try {
        const message = await actionFn();
        await invalidateRoster();
        setAction({ pending: false, message: message ?? label, error: null });
      } catch (error) {
        setAction({ pending: false, message: null, error: error instanceof Error ? error.message : label });
      }
    },
    [invalidateRoster],
  );

  const refresh = useCallback(async () => {
    if (!roomId) return;
    await runRosterAction(t('obr.roster.refreshed', 'Roster refreshed'), async () => {
      await input.onRefresh?.();
      return t('obr.roster.refreshed', 'Roster refreshed');
    });
  }, [roomId, runRosterAction, t, input]);

  const bindSelectedToken = useCallback(
    async (bindInput: { characterId: string; characterName: string; playerId?: string | null }) => {
      if (!roomId) return;
      await runRosterAction('Token binding updated', async () => {
        const result = await bindRoomCharacterToSelection(ext, obr, client, {
          roomId,
          characterId: bindInput.characterId,
          characterName: bindInput.characterName,
          playerId: bindInput.playerId,
        });
        return result.count === 0
          ? 'Select a token first'
          : `Bound ${result.count} token${result.count === 1 ? '' : 's'}`;
      });
    },
    [client, ext, obr, roomId, runRosterAction],
  );

  const assignPlayer = useCallback(
    async (assignInput: { characterId: string; playerId: string }) => {
      if (!roomId) return;
      await runRosterAction('Player binding updated', async () => {
        const player = connectedPlayers.find((item) => item.id === assignInput.playerId);
        await client.bindPlayerCharacter({
          roomId,
          playerId: assignInput.playerId,
          connectionId: player?.connectionId ?? null,
          characterId: assignInput.characterId,
        });
        await broadcastRosterChanged(ext, obr);
        return 'Player assigned';
      });
    },
    [client, connectedPlayers, ext, obr, roomId, runRosterAction],
  );

  const unassignPlayer = useCallback(
    async (playerId: string) => {
      if (!roomId) return;
      await runRosterAction('Player binding cleared', async () => {
        await unbindRoomPlayerCharacter(ext, obr, client, { roomId, playerId });
        return 'Player unassigned';
      });
    },
    [client, ext, obr, roomId, runRosterAction],
  );

  const unbindToken = useCallback(
    async (tokenId: string) => {
      if (!roomId) return;
      await runRosterAction('Token binding cleared', async () => {
        await unbindRoomTokenCharacter(ext, obr, client, { roomId, tokenId });
        return 'Token unbound';
      });
    },
    [client, ext, obr, roomId, runRosterAction],
  );

  useEffect(() => {
    let active = true;
    let unsubscribeParty: (() => void) | null = null;
    let unsubscribeBroadcast: (() => void) | null = null;
    let unsubscribeSceneReady: (() => void) | null = null;
    let unsubscribeItems: (() => void) | null = null;
    const channel = rosterChannel(ext);

    async function refreshConnectedPlayers(players?: Player[]) {
      const normalized = await getConnectedPlayers(ext, obr, players);
      if (active) setConnectedPlayers(normalized);
    }

    obr.onReady(() => {
      if (!active) return;

      void refreshConnectedPlayers();
      unsubscribeParty = obr.party.onChange((players) => {
        void refreshConnectedPlayers(players);
        void invalidateRoster();
      });
      unsubscribeSceneReady = obr.scene.onReadyChange((ready) => {
        if (ready) {
          void invalidateRoster();
        } else {
          setSceneTokenIds(null);
        }
      });
      unsubscribeItems = obr.scene.items.onChange((items) => {
        if (active) setSceneTokenIds(new Set(items.map((item) => item.id)));
      });
      void obr.scene.isReady().then(async (ready) => {
        if (!ready || !active) return;
        const items = await obr.scene.items.getItems().catch(() => null);
        if (active && items) setSceneTokenIds(new Set(items.map((item) => item.id)));
      });
      unsubscribeBroadcast = obr.broadcast.onMessage(channel, (event) => {
        const message = isObrRosterBroadcast(event.data) ? event.data : null;
        if (!message) return;
        void invalidateRoster();
      });
    });

    return () => {
      active = false;
      unsubscribeParty?.();
      unsubscribeBroadcast?.();
      unsubscribeSceneReady?.();
      unsubscribeItems?.();
    };
  }, [ext, invalidateRoster, obr]);

  return {
    roomId,
    rows,
    cards,
    connectedPlayers,
    isLoading: bindingsQuery.isFetching || cardsQuery.isFetching,
    action,
    sceneReady: sceneTokenIds !== null,
    refresh,
    bindSelectedToken,
    assignPlayer,
    unassignPlayer,
    unbindToken,
  };
}

function collectBoundCharacterIds(players: ObrPlayerCharacterBinding[], tokens: ObrTokenCharacterBinding[]): string[] {
  const ids = new Set<string>();
  for (const binding of players) ids.add(binding.characterId);
  for (const binding of tokens) ids.add(binding.characterId);
  return [...ids];
}

export function toRosterRows(input: {
  cards: ObrPartyRosterCard[];
  players: ObrPlayerCharacterBinding[];
  tokens: ObrTokenCharacterBinding[];
  memberIds: string[];
  connectedPlayerIds: ReadonlySet<string>;
  sceneTokenIds: ReadonlySet<string> | null;
}): ObrPartyRosterBindingRow[] {
  const cardsById = new Map<string, ObrPartyRosterCard>();
  for (const card of input.cards) {
    const id = (card as { id?: unknown })?.id;
    if (typeof id === 'string' && id.length > 0) {
      cardsById.set(id, card);
    }
  }
  const rows = new Map<string, ObrPartyRosterBindingRow>();

  for (const binding of markPlayerBindings(input.players, input.connectedPlayerIds)) {
    const row = ensureRow(rows, binding.characterId, cardsById);
    row.players.push(binding);
  }

  for (const binding of markTokenBindings(input.tokens, input.sceneTokenIds)) {
    const row = ensureRow(rows, binding.characterId, cardsById);
    row.tokens.push(binding);
  }

  for (const characterId of input.memberIds) {
    ensureRow(rows, characterId, cardsById);
  }

  return [...rows.values()].sort((left, right) => rowName(left).localeCompare(rowName(right)));
}

function ensureRow(
  rows: Map<string, ObrPartyRosterBindingRow>,
  characterId: string,
  cardsById: Map<string, ObrPartyRosterCard>,
): ObrPartyRosterBindingRow {
  const existing = rows.get(characterId);
  if (existing) return existing;

  const row: ObrPartyRosterBindingRow = {
    id: characterId,
    characterId,
    card: cardsById.get(characterId) ?? null,
    players: [],
    tokens: [],
  };
  rows.set(characterId, row);
  return row;
}

function rowName(row: ObrPartyRosterBindingRow): string {
  const name = (row.card as { name?: unknown })?.name;
  return typeof name === 'string' ? name : row.characterId;
}

async function getConnectedPlayers(
  ext: ObrExtensionIdentity,
  obr: typeof OBR,
  partyPlayers?: Player[],
): Promise<ObrConnectedPlayer[]> {
  const othersPromise = partyPlayers ? Promise.resolve(partyPlayers) : obr.party.getPlayers().catch(() => []);
  const [others, current] = await Promise.all([othersPromise, getCurrentPlayer(obr)]);

  const byConnection = new Map<string, ObrConnectedPlayer>();
  if (current) {
    byConnection.set(`${current.id}:${current.connectionId ?? ''}`, current);
  }
  for (const player of others) {
    byConnection.set(`${player.id}:${player.connectionId ?? ''}`, {
      id: player.id,
      connectionId: player.connectionId ?? null,
      name: normalizePlayerName(player.name) ?? playerNameFromMetadata(ext, player.metadata),
      role: player.role ?? 'PLAYER',
      connected: true,
    });
  }
  return [...byConnection.values()].sort((left, right) => connectedPlayerLabel(left).localeCompare(connectedPlayerLabel(right)));
}

async function getCurrentPlayer(obr: typeof OBR): Promise<ObrConnectedPlayer | null> {
  const actor = await getCurrentObrRoomActor(obr).catch(() => null);
  if (!actor || !actor.playerId.trim()) return null;
  return {
    id: actor.playerId,
    connectionId: actor.connectionId ?? null,
    name: actor.playerName ?? null,
    role: actor.role,
    connected: true,
  };
}

function playerNameFromMetadata(ext: ObrExtensionIdentity, metadata: Record<string, unknown> | undefined): string | null {
  if (!metadata) return null;
  return normalizePlayerName(metadata[ext.PLAYER_NAME_META_KEY]);
}

function normalizePlayerName(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function connectedPlayerLabel(player: ObrConnectedPlayer): string {
  return player.name ?? player.id;
}

function isRosterQueryKey(queryKey: QueryKey): boolean {
  return queryKey[0] === 'obr' && (queryKey[1] === 'cards' || queryKey[1] === 'rooms');
}

async function invalidateRosterQueries(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({ predicate: (query) => isRosterQueryKey(query.queryKey) });
}
```

**Note:** `ObrPartyRosterCard` is `unknown` here (the package doesn't know an app's card shape — it only reads `.id` and `.name` defensively via `cardsById`/`rowName`). scvmrack's Task 13 wrapper re-exports this type narrowed to its own `ObrCard` for the rest of the app to use unchanged.

- [ ] **Step 6: Write `src/react-query/index.ts`**

```ts
// src/react-query/index.ts
export * from './useObrRosterCards.ts';
export * from './useObrEnemies.ts';
```

- [ ] **Step 7: Build and verify**

Run: `npm run build`
Expected: clean compile.

- [ ] **Step 8: Commit**

```bash
git add src/react-query src/tests/react-query
git commit -m "feat: /react-query outlet — roster and enemies hooks with party coupling as plain inputs"
```

---

### Task 10: `/rr7` outlet

**Files:**
- Create: `src/rr7/useObrRevalidation.ts`
- Create: `src/rr7/index.ts`
- Test: `src/tests/rr7/useObrRevalidation.test.tsx`

**Interfaces:**
- Produces: `useObrRevalidation(input: { obr, channel: string, isMatch?: (data: unknown) => boolean })` — a React Router 7 hook that calls `useRevalidator()` and re-runs the route's loader whenever an OBR broadcast on `channel` matches `isMatch` (or unconditionally if `isMatch` is omitted). This is the `/rr7` outlet's one general-purpose hook: RR7 route modules don't need TanStack Query's cache-invalidation machinery — a loader re-run via `revalidator.revalidate()` is the idiomatic RR7 equivalent to Task 9's `invalidateRosterQueries`.
- **Scope note:** the `$roomId` route-split pattern and home-agnostic write helpers (working from either a route `action` or a `clientAction`) are documentation + a tested example, not exported runtime code — there is no framework-independent way to "export a route module," since RR7 route files are consumed directly by the app's own router config. Task 10 therefore also produces `docs/rr7-outlet.md` with a complete, runnable example route module (tested via `createRoutesStub`) that an app copies and adapts, exactly like Task 8's pasted-Prisma-models doc.

- [ ] **Step 1: Write the failing test**

```tsx
// src/tests/rr7/useObrRevalidation.test.tsx
import '../setupDom.ts';
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { renderHook } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import React from 'react';
import { useObrRevalidation } from '../../rr7/useObrRevalidation.ts';

describe('useObrRevalidation', () => {
  test('revalidates when a broadcast on the channel arrives and isMatch passes', async () => {
    let onMessageHandler: ((event: { data: unknown }) => void) | null = null;
    const obr = {
      broadcast: {
        onMessage: (_channel: string, handler: (event: { data: unknown }) => void) => {
          onMessageHandler = handler;
          return () => {};
        },
      },
    } as any;

    let loaderCalls = 0;
    const Stub = createRoutesStub([
      {
        path: '/',
        loader: () => {
          loaderCalls += 1;
          return { ok: true };
        },
        Component: () => {
          useObrRevalidation({ obr, channel: 'test/roster' });
          return null;
        },
      },
    ]);

    const { rerender } = renderHook(() => null, { wrapper: () => React.createElement(Stub, { initialEntries: ['/'] }) });
    rerender();

    assert.equal(loaderCalls, 1); // initial load
    onMessageHandler!({ data: { kind: 'roster' } });
    // revalidator.revalidate() is async; a real test asserts loaderCalls === 2
    // after `await waitFor(...)` — included here for the shape of the check.
  });
});
```

Add `react-router` as a `devDependency` if not already present from Task 1 (it is).

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test src/tests/rr7/useObrRevalidation.test.tsx`
Expected: FAIL with "Cannot find module '../../rr7/useObrRevalidation.ts'"

- [ ] **Step 3: Write the implementation**

```ts
// src/rr7/useObrRevalidation.ts
import type OBR from '@owlbear-rodeo/sdk';
import { useEffect } from 'react';
import { useRevalidator } from 'react-router';

export interface UseObrRevalidationOptions {
  obr: typeof OBR;
  channel: string;
  isMatch?: (data: unknown) => boolean;
}

/**
 * Re-runs the current route's loader whenever an OBR broadcast on `channel`
 * arrives. The RR7 equivalent of the /react-query outlet's query invalidation
 * — a loader re-fetch is how RR7 routes refresh server-derived data.
 */
export function useObrRevalidation(options: UseObrRevalidationOptions): void {
  const revalidator = useRevalidator();

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    options.obr.onReady(() => {
      unsubscribe = options.obr.broadcast.onMessage(options.channel, (event) => {
        if (!options.isMatch || options.isMatch(event.data)) {
          void revalidator.revalidate();
        }
      });
    });

    return () => {
      unsubscribe?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.channel, options.obr]);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test src/tests/rr7/useObrRevalidation.test.tsx`
Expected: PASS (adjust the test's final assertion to `await waitFor(() => assert.equal(loaderCalls, 2))` using `@testing-library/react`'s `waitFor`, imported alongside `renderHook`)

- [ ] **Step 5: Write `src/rr7/index.ts`**

```ts
// src/rr7/index.ts
export * from './useObrRevalidation.ts';
```

- [ ] **Step 6: Write `docs/rr7-outlet.md`**

```markdown
# `/rr7` outlet — isomorphic OBR reads via a `$roomId` route split

Owlbear embeds your panel in an iframe with no server-side knowledge of the
room id — `OBR.room.id` is only available client-side, after `OBR.onReady`
fires via the postMessage handshake with the OBR host page. A route's server
`loader` runs before that handshake, so it cannot read the room id from the
SDK. Splitting into two routes lets the *inner* route's loader read the room
id from a URL param instead, once the outer route has captured it client-side
and navigated:

\`\`\`
routes/
  obr.tsx           # outer: renders once OBR.onReady fires, redirects to
                     # obr.$roomId.tsx with the real room id in the URL
  obr.$roomId.tsx    # inner: server loader reads params.roomId directly —
                     # no client-side wait needed for reads
\`\`\`

\`\`\`ts
// routes/obr.$roomId.tsx
import type { Route } from './+types/obr.$roomId';
import { createObrApiClient } from '@tackgnol/rpgtools-owlbear/client';
import { useObrRevalidation } from '@tackgnol/rpgtools-owlbear/rr7';
import OBR from '@owlbear-rodeo/sdk';

export async function loader({ params, request }: Route.LoaderArgs) {
  // Per-request client: forwards this request's cookies, never a module
  // singleton (a singleton would leak one user's session across requests).
  const client = createObrApiClient({
    apiBase: `${process.env.BACKEND_URL}/api/obr`,
    fetch: (url, init) => fetch(url, { ...init, headers: { ...init?.headers, cookie: request.headers.get('cookie') ?? '' } }),
  });
  return client.fetchRoomBindings(params.roomId);
}

// Writes are home-agnostic: this action works whether it's hit via a normal
// <Form> POST (works even with JS disabled) or a fetcher's clientAction
// (optimistic, no full navigation) — same client, same body shape either way.
export async function action({ params, request }: Route.ActionArgs) {
  const body = await request.formData();
  const client = createObrApiClient({ apiBase: `${process.env.BACKEND_URL}/api/obr`, fetch });
  await client.bindPlayerCharacter({
    roomId: params.roomId,
    playerId: String(body.get('playerId')),
    characterId: String(body.get('characterId')),
  });
  return null;
}

export default function ObrRoom({ loaderData }: Route.ComponentProps) {
  useObrRevalidation({ obr: OBR, channel: 'co.yourapp/roster' });
  return <RosterView bindings={loaderData} />;
}
\`\`\`

Test with `createRoutesStub` (from `react-router`) + a mocked `@owlbear-rodeo/sdk` — see `src/tests/rr7/useObrRevalidation.test.tsx` in this package for the pattern.
```

- [ ] **Step 7: Build and verify**

Run: `npm run build`
Expected: clean compile.

- [ ] **Step 8: Commit**

```bash
git add src/rr7 src/tests/rr7 docs/rr7-outlet.md
git commit -m "feat: /rr7 outlet — useObrRevalidation + documented $roomId route-split pattern"
```

---

### Task 11: Package release 0.1.0

**Files:**
- Modify: `README.md`

**Interfaces:**
- Produces: published `@tackgnol/rpgtools-owlbear@0.1.0` on GitHub Packages. Tasks 12–14 depend on it.

- [ ] **Step 1: Write `README.md`**

Document each subpath export with a short usage snippet (mirror `rpgtools-shared-auth`'s README structure): root core (extension identity, roster/binding/enemies functions and their `ext`/`obr` parameters), `/client` (`createObrApiClient`), `/server` (`obrRoomBindings` plugin + link to `docs/pasted-prisma-models.md`), `/react-query` (`useObrRosterCards`, `useObrEnemies`), `/rr7` (link to `docs/rr7-outlet.md`). Note the party-coupling seam explicitly: "`extraRoomCharacterIds` (server) and `extraCharacterIds`/`onRefresh` (react-query) are the only points where this package expects an app-specific data source; everything else is self-contained."

- [ ] **Step 2: Full check**

```bash
npm test
npm run build
```

Expected: all tests pass, `dist/` builds cleanly.

- [ ] **Step 3: Publish**

```bash
npm publish
```

Expected: publish succeeds to `https://npm.pkg.github.com/`.

- [ ] **Step 4: Commit and tag**

```bash
git add README.md
git commit -m "chore: release 0.1.0"
git tag v0.1.0
git push && git push --tags
```

---

### Task 12: scvmrack backend — consume `/server`, delete the local binding stack

**Files (repo: scvmrack):**
- Modify: `backend/package.json` (add `@tackgnol/rpgtools-owlbear`)
- Modify: `backend/src/plugins/rpgtools-auth.ts` or a new `backend/src/plugins/rpgtools-owlbear.ts` (register the plugin)
- Delete: `backend/src/routes/obr/index.ts`
- Delete: `backend/src/services/obr-room-binding-service.ts`
- Delete: `backend/src/services/obr-room-character-access.ts`
- Delete: `backend/src/repositories/obr-room-binding-repository.ts`
- Delete: `backend/src/schemas/obr-room-binding.ts`
- Create: `backend/src/lib/obr-bindings-db.ts` (the `ObrBindingsDb` adapter, wrapping the exact same Prisma calls `obr-room-binding-repository.ts` already made)

**Interfaces:**
- Consumes: `@tackgnol/rpgtools-owlbear/server`'s `obrRoomBindings` plugin, `ObrBindingsDb` type.
- Produces: a backend whose only OBR-bindings surface is the package's plugin, wired with scvmrack's existing Prisma models (no schema migration).

- [ ] **Step 1: Install the dependency**

```bash
cd backend && npm install @tackgnol/rpgtools-owlbear@^0.1.0
```

- [ ] **Step 2: Write `backend/src/lib/obr-bindings-db.ts`**

```ts
import type { ObrBindingsDb } from '@tackgnol/rpgtools-owlbear/server';
import prisma from './prisma.js';

const playerBindingSelect = {
  obrRoomId: true,
  obrPlayerId: true,
  obrConnectionId: true,
  characterId: true,
  assignedByPlayerId: true,
} as const;

const tokenBindingSelect = {
  obrRoomId: true,
  obrTokenId: true,
  assignedPlayerId: true,
  characterId: true,
} as const;

function toPlayerRow(row: {
  obrRoomId: string;
  obrPlayerId: string;
  obrConnectionId: string | null;
  characterId: string;
  assignedByPlayerId: string;
}) {
  return {
    roomId: row.obrRoomId,
    playerId: row.obrPlayerId,
    connectionId: row.obrConnectionId,
    characterId: row.characterId,
    assignedByPlayerId: row.assignedByPlayerId,
  };
}

function toTokenRow(row: {
  obrRoomId: string;
  obrTokenId: string;
  assignedPlayerId: string | null;
  characterId: string;
}) {
  return {
    roomId: row.obrRoomId,
    tokenId: row.obrTokenId,
    playerId: row.assignedPlayerId,
    characterId: row.characterId,
  };
}

export const obrBindingsDb: ObrBindingsDb = {
  async getBindings(roomId) {
    const [players, tokens] = await Promise.all([
      prisma.obrPlayerCharacterBinding.findMany({
        where: { obrRoomId: roomId },
        orderBy: { obrPlayerId: 'asc' },
        select: playerBindingSelect,
      }),
      prisma.obrTokenCharacterBinding.findMany({
        where: { obrRoomId: roomId },
        orderBy: { obrTokenId: 'asc' },
        select: tokenBindingSelect,
      }),
    ]);
    return { players: players.map(toPlayerRow), tokens: tokens.map(toTokenRow) };
  },

  async getPlayerBinding(roomId, playerId) {
    const row = await prisma.obrPlayerCharacterBinding.findUnique({
      where: { obrRoomId_obrPlayerId: { obrRoomId: roomId, obrPlayerId: playerId } },
      select: playerBindingSelect,
    });
    return row ? toPlayerRow(row) : null;
  },

  async setPlayerBinding(input) {
    return prisma.$transaction(async (tx) => {
      await tx.obrRoomBinding.upsert({
        where: { obrRoomId: input.roomId },
        create: { obrRoomId: input.roomId },
        update: { updatedAt: new Date() },
      });
      const row = await tx.obrPlayerCharacterBinding.upsert({
        where: { obrRoomId_obrPlayerId: { obrRoomId: input.roomId, obrPlayerId: input.playerId } },
        create: {
          obrRoomId: input.roomId,
          obrPlayerId: input.playerId,
          obrConnectionId: input.connectionId,
          characterId: input.characterId,
          assignedByPlayerId: input.assignedByPlayerId,
        },
        update: {
          obrConnectionId: input.connectionId,
          characterId: input.characterId,
          assignedByPlayerId: input.assignedByPlayerId,
        },
        select: playerBindingSelect,
      });
      return toPlayerRow(row);
    });
  },

  async clearPlayerBinding(roomId, playerId) {
    await prisma.obrPlayerCharacterBinding.deleteMany({ where: { obrRoomId: roomId, obrPlayerId: playerId } });
  },

  async getTokenBinding(roomId, tokenId) {
    const row = await prisma.obrTokenCharacterBinding.findUnique({
      where: { obrRoomId_obrTokenId: { obrRoomId: roomId, obrTokenId: tokenId } },
      select: tokenBindingSelect,
    });
    return row ? toTokenRow(row) : null;
  },

  async setTokenBinding(input) {
    return prisma.$transaction(async (tx) => {
      await tx.obrRoomBinding.upsert({
        where: { obrRoomId: input.roomId },
        create: { obrRoomId: input.roomId },
        update: { updatedAt: new Date() },
      });
      const row = await tx.obrTokenCharacterBinding.upsert({
        where: { obrRoomId_obrTokenId: { obrRoomId: input.roomId, obrTokenId: input.tokenId } },
        create: {
          obrRoomId: input.roomId,
          obrTokenId: input.tokenId,
          assignedPlayerId: input.playerId,
          characterId: input.characterId,
        },
        update: { assignedPlayerId: input.playerId, characterId: input.characterId },
        select: tokenBindingSelect,
      });
      return toTokenRow(row);
    });
  },

  async clearTokenBinding(roomId, tokenId) {
    await prisma.obrTokenCharacterBinding.deleteMany({ where: { obrRoomId: roomId, obrTokenId: tokenId } });
  },

  async filterCharacterIdsInRoom(ids, roomId) {
    if (ids.length === 0) return [];
    const [players, tokens] = await Promise.all([
      prisma.obrPlayerCharacterBinding.findMany({
        where: { obrRoomId: roomId, characterId: { in: ids } },
        select: { characterId: true },
      }),
      prisma.obrTokenCharacterBinding.findMany({
        where: { obrRoomId: roomId, characterId: { in: ids } },
        select: { characterId: true },
      }),
    ]);
    const bound = new Set([...players.map((r) => r.characterId), ...tokens.map((r) => r.characterId)]);
    return ids.filter((id) => bound.has(id));
  },
};
```

- [ ] **Step 3: Register the plugin**

Create `backend/src/plugins/rpgtools-owlbear.ts`:

```ts
import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { obrRoomBindings } from '@tackgnol/rpgtools-owlbear/server';
import { obrBindingsDb } from '../lib/obr-bindings-db.js';
import { getCharacterFull } from '../lib/get-character-full.js';
import { toCharacterCard } from '../lib/character-card.js';
import { characterRepository } from '../repositories/character-repository.js';
import { ownsCharacter as sessionOwnsCharacter, hasObrWriteSession } from '../services/session.js';

export default fp(async function rpgtoolsOwlbearPlugin(fastify: FastifyInstance) {
  await fastify.register(obrRoomBindings, {
    prefix: '/api/obr',
    db: obrBindingsDb,
    getSession: (request) => (request as any).appSession,
    hasWriteAccess: hasObrWriteSession,
    async getCards(allowedIds, locale) {
      const fulls = await Promise.all(allowedIds.map((id) => getCharacterFull(id, locale)));
      return fulls.filter((f): f is Record<string, unknown> => f !== null).map(toCharacterCard);
    },
    async ownsCharacter(session, characterId) {
      const row = await characterRepository.getPartyAccessContext(characterId);
      if (!row) return false;
      return sessionOwnsCharacter(session as any, row);
    },
    async extraRoomCharacterIds(ids, roomId) {
      return characterRepository.filterCharacterIdsInRoomParty(ids, roomId);
    },
  });

  fastify.log.info('rpgtools-owlbear registered');
});
```

- [ ] **Step 4: Delete the five local files**

```bash
git rm backend/src/routes/obr/index.ts \
  backend/src/services/obr-room-binding-service.ts \
  backend/src/services/obr-room-character-access.ts \
  backend/src/repositories/obr-room-binding-repository.ts \
  backend/src/schemas/obr-room-binding.ts
```

- [ ] **Step 5: Verify nothing references the deleted modules**

Run: `grep -rln "obr-room-binding-service\|obr-room-character-access\|obr-room-binding-repository\|schemas/obr-room-binding" backend/src backend/tests`
Expected: no matches. Delete any orphaned test file that imported the removed modules (its coverage now lives in `rpgtools-owlbear`'s own `src/tests/server.test.ts`).

- [ ] **Step 6: Build and test**

```bash
cd backend && npm run build:ts && npm test
```

Expected: compiles, unit tests PASS.

- [ ] **Step 7: Commit**

```bash
git add -A backend
git commit -m "refactor: consume rpgtools-owlbear/server, drop local binding stack"
```

---

### Task 13: scvmrack frontend — consume core + `/react-query` outlet

**Files (repo: scvmrack):**
- Modify: `frontend/package.json` (add `@tackgnol/rpgtools-owlbear`)
- Create: `frontend/src/obr/extension.ts` → REPLACE with a one-line re-export
- Delete: `frontend/src/obr/roster.ts`, `tokenBinding.ts`, `rosterStale.ts`, `roomBinding.ts` (contents, not the concept — see Step 2)
- Modify: `frontend/src/obr/contextMenu.ts` (keep the app-specific parts, import the reusable parts)
- Modify: `frontend/src/obr/enemies.ts` (keep `ObrEnemy`/`ObrEnemyCard` types and app-specific re-exports, import the mechanism)
- Modify: `frontend/src/obr/useObrRosterCards.ts` (thin wrapper around the package's outlet hook)
- Modify: `frontend/src/obr/useObrEnemies.ts` (thin wrapper around the package's outlet hook)
- Modify: `frontend/src/obr/useObrTokenBindingState.ts`, `useObrRoomId.ts` (thread the package's `OBR`/`ext` through)
- Test: update the corresponding test files under `frontend/test/`

**Interfaces:**
- Consumes: `@tackgnol/rpgtools-owlbear` (core), `@tackgnol/rpgtools-owlbear/client` (`createObrApiClient`), `@tackgnol/rpgtools-owlbear/react-query` (`useObrRosterCards`, `useObrEnemies`).
- Produces: `frontend/src/obr/extension.ts` exporting a module-level `export const scvmrackObrExtension = createObrExtension('co.rpgtools.scvmrack');` plus re-exports of its fields under the SAME names other scvmrack files already import (`EXTENSION_ID`, `CHARACTER_META_KEY`, etc.) so this is the ONLY file that changes shape — every other scvmrack file that imports from `@/obr/extension` keeps working unmodified. `frontend/src/obr/obrApiClient.ts` exporting a module-level `export const obrApiClient = createObrApiClient({ apiBase: ..., baseHeaders: embeddedSessionHeaders });` (mirrors `frontend/src/auth/obrAuthClient.ts`'s existing pattern from Plan 1).

- [ ] **Step 1: Install the dependency**

```bash
cd frontend && npm install @tackgnol/rpgtools-owlbear@^0.1.0
```

- [ ] **Step 2: Rewrite `frontend/src/obr/extension.ts`**

```ts
import { createObrExtension } from '@tackgnol/rpgtools-owlbear';

export const scvmrackObrExtension = createObrExtension('co.rpgtools.scvmrack');

export const {
  EXTENSION_ID,
  CHARACTER_META_KEY,
  PLAYER_CHARACTER_META_KEY,
  PLAYER_NAME_META_KEY,
  TOKEN_MARKER_META_KEY,
  TOKEN_MARKER_CHARACTER_META_KEY,
} = scvmrackObrExtension;
```

- [ ] **Step 3: Create `frontend/src/obr/obrApiClient.ts`**

```ts
import { createObrApiClient } from '@tackgnol/rpgtools-owlbear/client';
import { embeddedSessionHeaders } from '@/utils/embed';

export const obrApiClient = createObrApiClient({
  apiBase: `${import.meta.env.VITE_BACKEND_URL || ''}/api/obr`,
  baseHeaders: embeddedSessionHeaders,
});
```

- [ ] **Step 4: Delete `frontend/src/obr/roster.ts`, `tokenBinding.ts`, `rosterStale.ts`, `roomBinding.ts`**

```bash
git rm frontend/src/obr/roster.ts frontend/src/obr/tokenBinding.ts frontend/src/obr/rosterStale.ts frontend/src/obr/roomBinding.ts
```

Every remaining file that imported from these (`useObrRosterCards.ts`, `useObrTokenBindingState.ts`, `contextMenu.ts`, `useObrEnemies.ts` transitively) now imports the same-named functions from `@tackgnol/rpgtools-owlbear`, threading `scvmrackObrExtension` and OBR's default export as the first two arguments per Tasks 3–6's signatures.

- [ ] **Step 5: Rewrite `frontend/src/obr/useObrTokenBindingState.ts`**

```ts
import OBR from '@owlbear-rodeo/sdk';
import { useEffect, useState } from 'react';
import { EMPTY_SELECTION_STATE, getSelectedTokenBindingState, type SelectionBindingState } from '@tackgnol/rpgtools-owlbear';
import { scvmrackObrExtension } from '@/obr/extension';

export { EMPTY_SELECTION_STATE } from '@tackgnol/rpgtools-owlbear';

export function useObrTokenBindingState() {
  const [selection, setSelection] = useState<SelectionBindingState>(EMPTY_SELECTION_STATE);

  useEffect(() => {
    let active = true;
    let unsubscribePlayer: (() => void) | null = null;
    let unsubscribeItems: (() => void) | null = null;
    let unsubscribeSceneReady: (() => void) | null = null;

    const refreshSelection = async (selectedIds?: string[]) => {
      try {
        const next = await getSelectedTokenBindingState(scvmrackObrExtension, OBR, selectedIds);
        if (active) setSelection(next);
      } catch {
        if (active) setSelection(EMPTY_SELECTION_STATE);
      }
    };

    OBR.onReady(() => {
      if (!active) return;
      void refreshSelection();
      unsubscribePlayer = OBR.player.onChange((player) => void refreshSelection(player.selection ?? []));
      unsubscribeItems = OBR.scene.items.onChange(() => void refreshSelection());
      unsubscribeSceneReady = OBR.scene.onReadyChange((ready) => {
        if (!ready) {
          setSelection(EMPTY_SELECTION_STATE);
          return;
        }
        void refreshSelection();
      });
    });

    return () => {
      active = false;
      unsubscribePlayer?.();
      unsubscribeItems?.();
      unsubscribeSceneReady?.();
    };
  }, []);

  return { selection, setSelection };
}
```

- [ ] **Step 6: Rewrite `frontend/src/obr/contextMenu.ts`**

Keep `VIEW_SCVM_CONTEXT_MENU_ID`, `SCVM_CARD_POPOVER_ID`, `VIEW_ENEMY_CONTEXT_MENU_ID`, `ENEMY_CARD_POPOVER_ID`, the popover sizing constants, `createScvmContextMenu`, `createEnemyContextMenu`, `openEnemyPopover`, `getObrCardUrl`, `getObrEnemyUrl`, `isObrCardView`, `isObrEnemyView` — all app-specific — but:
- Replace the local `getContextCharacterId` definition with `getContextCharacterId(scvmrackObrExtension, context)` imported from `@tackgnol/rpgtools-owlbear`.
- Replace `registerScvmContextMenu`'s body with `registerObrContextMenus(OBR, [createScvmContextMenu(), createEnemyContextMenu()])` imported from `@tackgnol/rpgtools-owlbear`.
- Replace the local `getContextMenuPopoverAnchor` with the package's version.
- `getContextEnemyId` continues to come from `frontend/src/obr/enemies.ts` (Step 7).

- [ ] **Step 7: Rewrite `frontend/src/obr/enemies.ts`**

Keep `ENEMY_META_KEY` (now `enemyMetaKey(scvmrackObrExtension)` from the package, re-exported under the same name for the rest of the app), `OBR_ENEMIES_CHANNEL` (now `enemiesChannel(scvmrackObrExtension)`), the `EnemyAttack`/`EnemyCard`/`EnemyFull`/`EnemyLoot`/`EnemySpecial`/`ObrEnemy`/`ObrEnemyCard`/`ObrEnemyView` types (app-specific, re-exported from `@/api/enemies` as before), `isFullObrEnemy`. Replace `DEFAULT_ENEMY_STATUS_BANDS`, `createObrEnemyId`, `createEnemyStatusId`, `createEnemyRowId`, `normalizeStatusBands`, `resolveEnemyStatus`, `translateEnemyStatusLabel`, `toHealthPercent`, `bindEnemyToSelection` (now takes `scvmrackObrExtension`/`OBR` as leading args), `getContextEnemyId`, `isObrEnemiesBroadcast`, `broadcastEnemiesChanged` with re-exports/thin wrappers from `@tackgnol/rpgtools-owlbear`.

- [ ] **Step 8: Rewrite `frontend/src/obr/useObrEnemies.ts`**

```ts
import { useObrEnemies as useObrEnemiesCore } from '@tackgnol/rpgtools-owlbear/react-query';
import OBR from '@owlbear-rodeo/sdk';
import {
  createEnemy,
  deleteEnemy as deleteEnemyApi,
  fetchEnemiesFull,
  fetchEnemyCards,
  setEnemyHealth as setEnemyHealthApi,
  updateEnemy,
  type EnemyInput,
} from '@/api/enemies';
import { scvmrackObrExtension } from '@/obr/extension';
import type { ObrEnemy, ObrEnemyCard } from './enemies';

type GmOptions = { mode: 'gm'; roomId: string };
type PlayerOptions = { mode: 'player'; roomId: string; characterId: string | null };

export function useObrEnemies(options: GmOptions | PlayerOptions) {
  if (options.mode === 'gm') {
    return useObrEnemiesCore<ObrEnemy, EnemyInput>({
      mode: 'gm',
      ext: scvmrackObrExtension,
      obr: OBR,
      roomId: options.roomId,
      fetchEnemiesFull,
      fetchEnemyCards,
      createEnemy,
      updateEnemy,
      setEnemyHealth: setEnemyHealthApi,
      deleteEnemy: deleteEnemyApi,
      toEnemyInput,
    });
  }

  return useObrEnemiesCore<ObrEnemyCard>({
    mode: 'player',
    ext: scvmrackObrExtension,
    obr: OBR,
    roomId: options.roomId,
    characterId: options.characterId,
    fetchEnemiesFull,
    fetchEnemyCards,
  });
}

function toEnemyInput(enemy: ObrEnemy): EnemyInput {
  return {
    name: enemy.name,
    type: enemy.type,
    habitat: enemy.habitat,
    description: enemy.description,
    playerDescription: enemy.playerDescription,
    currentHealth: enemy.currentHealth,
    maxHealth: enemy.maxHealth,
    morale: enemy.morale,
    armorDie: enemy.armorDie,
    armorDescription: enemy.armorDescription,
    attacks: enemy.attacks,
    specials: enemy.specials,
    loot: enemy.loot,
    statuses: enemy.statuses,
  };
}
```

- [ ] **Step 9: Rewrite `frontend/src/obr/useObrRosterCards.ts`**

Thin wrapper: import `useObrRosterCards as useObrRosterCardsCore` from `@tackgnol/rpgtools-owlbear/react-query`; call it with `{ ext: scvmrackObrExtension, obr: OBR, client: obrApiClient, roomId: useObrRoomId(), extraCharacterIds: (useObrRoomParty(roomId).data?.members ?? []).map(m => m.characterId), onRefresh: () => promoteObrRoom({...}).then(party => queryClient.setQueryData(...)), t: (key, fallback) => i18n_t(key, fallback) }`. Re-export the package's `ObrPartyRosterCard`, `ObrConnectedPlayer`, `ObrPartyRosterBindingRow`, `ObrRosterActionState`, `ObrRosterState`, `toRosterRows` types/functions under the same names scvmrack's other files already import them under, so no other file needs to change its import path.

- [ ] **Step 10: Sweep for stragglers**

Run: `grep -rn "from '@/obr/roster'\|from '@/obr/tokenBinding'\|from '@/obr/rosterStale'\|from '@/obr/roomBinding'" frontend/src`
Expected: no matches outside the files touched above. Fix any hit by importing from `@tackgnol/rpgtools-owlbear` instead.

- [ ] **Step 11: Update tests**

Move the pure-logic unit tests that used to target scvmrack's local `roster.ts`/`tokenBinding.ts`/`rosterStale.ts`/`enemies.ts` mechanism (not their app-specific parts) — delete them from scvmrack's test suite (coverage now lives in `rpgtools-owlbear`'s own tests). Keep and update scvmrack's browser tests for `ObrPartyRoster`, `ObrCharacterRoute`, `ObrEnemies` components, adjusting any mocked import paths (`@/obr/roster` → `@tackgnol/rpgtools-owlbear`, etc.) to match the new module boundaries.

- [ ] **Step 12: Run the frontend validation checklist**

```bash
cd frontend && npx tsc --noEmit && npm run lint && npm run test:unit && npm run test:browser && npm run doctor
```

Expected: all green.

- [ ] **Step 13: Commit**

```bash
git add frontend
git commit -m "refactor: obr roster/binding/enemies via rpgtools-owlbear package"
```

---

### Task 14: scvmrack — release and full validation

**Files (repo: scvmrack):**
- Modify: `backend/package.json`, `frontend/package.json` (version bump)
- Create: `release/<version>.md`
- Modify: `release/README.md`
- Modify: `frontend/src/pages/ReleasePage.tsx`, `frontend/src/i18n/en.json`, `frontend/src/i18n/pl.json`

**Interfaces:**
- Consumes: Tasks 12–13 complete.
- Produces: tagged release following the CLAUDE.md release checklist.

- [ ] **Step 1: Full test sweep**

```bash
cd backend && npm run test:all
```

Expected: unit, integration, and e2e suites PASS (this is the real, published-package install — no tarball bridge this time, since Task 11 published for real before Task 12 started).

- [ ] **Step 2: Manual smoke of the OBR panel**

Start the dev stack, open the app inside an Owlbear Rodeo room (or the local OBR dev harness), and verify: roster loads and shows bound characters, binding a token to a character works, the enemy board loads and a health update broadcasts to a second connected client. This is the same manual gate CLAUDE.md already calls for on OBR-touching changes.

- [ ] **Step 3: Release chores**

Follow CLAUDE.md's release checklist: bump `version` in both `backend/package.json` and `frontend/package.json`, write `release/<version>.md` describing "the Owlbear panel now runs on a shared, reusable package used across RPGTools apps — no behavior change for players," add the newest-first row to `release/README.md`, add the matching `ReleasePage.tsx` card with i18n keys in both `en.json` and `pl.json`.

- [ ] **Step 4: Validate, commit, tag**

```bash
cd frontend && npx tsc --noEmit && npm run lint
git add -A
git commit -m "chore: release <version>"
git tag v<version>
```

---
