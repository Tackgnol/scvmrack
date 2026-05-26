# FE Browser Test Audit (P2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Classify every file in `frontend/test/browser/` into clear-JSDOM / needs-real-browser / borderline buckets via a regex audit script, then migrate the clear-JSDOM bucket to `frontend/test/unit/components/` running under JSDOM.

**Architecture:** Phase A: one-shot Node script (`frontend/scripts/audit-browser-tests.mjs`) walks `test/browser/**/*.test.tsx`, regex-matches a fixed marker set per file, and emits a markdown report. Phase B: create `UnitTestProvider.tsx` + adjust `setup-dom.ts` for i18n, then migrate clear-JSDOM files in batches of 8–12 per commit, rewriting the vitest-browser API into the @testing-library/react + @testing-library/user-event API.

**Tech Stack:** Vitest 4.1.2 (browser mode + JSDOM), `@vitest/browser-playwright`, `vitest-browser-react`, `@testing-library/react` 16.3.2, `@testing-library/user-event` (already a transitive dep — verify), React 19, MUI 7, i18next.

**Spec:** `docs/superpowers/specs/2026-05-26-fe-browser-audit-design.md`

---

## File map

**Phase A — Audit (Task 1–2):**
- Create: `frontend/scripts/audit-browser-tests.mjs` — one-shot classification script.
- Create: `docs/superpowers/audits/2026-05-26-fe-browser-classification.md` — generated report; committed permanently.

**Phase B — Prep (Task 3):**
- Create: `frontend/test/unit/UnitTestProvider.tsx` — JSDOM-stage theme + i18n wrapper.
- Modify: `frontend/test/setup-dom.ts` — add `await loadLanguage('en')` in `beforeAll` so migrated tests that read translated strings hydrate before assertion.

**Phase B — Migration (Tasks 4..N):**
- Move: many `frontend/test/browser/**/*.test.tsx` → `frontend/test/unit/components/**/*.test.tsx`. Exact list comes from the audit report (Task 2). The directory structure under `test/unit/components/` mirrors `test/browser/`.
- Modify: each moved file — API rewrite per the spec's table.
- (Optional, last commit) Delete: `frontend/test/browser/BrowserTestProvider.tsx` if no file under `test/browser/` still imports it after migration.

**No source code (`frontend/src/**`) is touched in this plan.**

---

## Pre-flight (read once)

- Working directory for all commands: `C:/Users/Adam/WebstormProjects/scvmrack` unless explicitly inside `frontend/`.
- Branch: master (user works directly on master).
- **No `Co-Authored-By` trailer on commits.** Strict user preference.
- Bash tool is available; use it for shell commands. Edit tool for code changes. Read tool before editing any file you haven't already opened.
- `@testing-library/user-event` may not currently be a top-level dep. Verify with `cd frontend && npm ls @testing-library/user-event` before the first migration batch. If absent, install with `npm install --save-dev @testing-library/user-event` as part of Task 3.
- The audit report lists files. Each migration batch picks the next N from the clear-JSDOM bucket. Walk the list top-to-bottom; don't reorder.

---

## Task 1: Write the audit script

**Files:**
- Create: `frontend/scripts/audit-browser-tests.mjs`

- [ ] **Step 1: Create the script with the exact content below**

The script reads every `*.test.tsx` file under `frontend/test/browser/`, regex-matches a fixed marker set, and prints a markdown report to stdout. No external deps — pure Node.

```javascript
#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ROOT = new URL('../test/browser/', import.meta.url);
const REPO_ROOT = new URL('../../', import.meta.url);

const NEEDS_BROWSER = [
  { name: 'getBoundingClientRect', re: /getBoundingClientRect/ },
  { name: 'offset(Width|Height|Top|Left)', re: /\boffset(Width|Height|Top|Left)\b/ },
  { name: 'scroll(Top|Left|Into*)', re: /\bscroll(Top|Left|Into[A-Z]\w*)/ },
  { name: 'getComputedStyle', re: /\bgetComputedStyle\b/ },
  { name: 'ResizeObserver', re: /\bResizeObserver\b/ },
  { name: 'IntersectionObserver', re: /\bIntersectionObserver\b/ },
  { name: '.focus()', re: /\.focus\s*\(/ },
  { name: 'focusTrap', re: /focusTrap\b/ },
  { name: 'motion import', re: /from\s+['"]motion['"]/ },
  { name: 'framer-motion import', re: /from\s+['"]framer-motion['"]/ },
  { name: 'Tab key navigation', re: /key:\s*['"]Tab['"]|\bTab\b.*key/i },
];

const BORDERLINE = [
  { name: 'MUI Dialog', re: /\bDialog\b/ },
  { name: 'MUI Menu', re: /\bMenu\b/ },
  { name: 'MUI Popover', re: /\bPopover\b/ },
  { name: 'MUI Tooltip', re: /\bTooltip\b/ },
  { name: 'setTimeout', re: /\bsetTimeout\b/ },
  { name: 'waitFor', re: /\bwaitFor\b/ },
];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const out = [];
  for (const e of entries) {
    const p = new URL(e.name + (e.isDirectory() ? '/' : ''), dir);
    if (e.isDirectory()) {
      out.push(...(await walk(p)));
    } else if (e.name.endsWith('.test.tsx')) {
      out.push(p);
    }
  }
  return out;
}

function classify(content) {
  const browserMarkers = NEEDS_BROWSER.filter((m) => m.re.test(content)).map((m) => m.name);
  const borderlineMarkers = BORDERLINE.filter((m) => m.re.test(content)).map((m) => m.name);
  if (browserMarkers.length > 0) return { bucket: 'needs-real-browser', markers: browserMarkers };
  if (borderlineMarkers.length > 0) return { bucket: 'borderline', markers: borderlineMarkers };
  return { bucket: 'clear-JSDOM', markers: [] };
}

const files = await walk(ROOT);
const classified = [];
for (const f of files) {
  const content = await readFile(f, 'utf-8');
  const rel = relative(new URL('.', REPO_ROOT).pathname, f.pathname).replace(/\\/g, '/');
  classified.push({ path: rel, ...classify(content) });
}

const buckets = { 'clear-JSDOM': [], 'needs-real-browser': [], borderline: [] };
for (const c of classified) buckets[c.bucket].push(c);
for (const b of Object.values(buckets)) b.sort((a, b) => a.path.localeCompare(b.path));

const total = classified.length;

const lines = [];
lines.push('# FE browser test classification — 2026-05-26');
lines.push('');
lines.push('Generated by `frontend/scripts/audit-browser-tests.mjs`. Re-run with:');
lines.push('');
lines.push('```');
lines.push('node frontend/scripts/audit-browser-tests.mjs > docs/superpowers/audits/2026-05-26-fe-browser-classification.md');
lines.push('```');
lines.push('');
lines.push('## Summary');
lines.push('');
lines.push(`- Total files: ${total}`);
lines.push(`- clear-JSDOM: ${buckets['clear-JSDOM'].length}`);
lines.push(`- needs-real-browser: ${buckets['needs-real-browser'].length}`);
lines.push(`- borderline: ${buckets.borderline.length}`);
lines.push('');
for (const name of ['clear-JSDOM', 'needs-real-browser', 'borderline']) {
  lines.push(`## ${name} (${buckets[name].length} files)`);
  lines.push('');
  if (buckets[name].length === 0) {
    lines.push('_(none)_');
  } else {
    for (const c of buckets[name]) {
      const m = c.markers.length === 0 ? 'none' : c.markers.join(', ');
      lines.push(`- \`${c.path}\` — markers: ${m}`);
    }
  }
  lines.push('');
}

process.stdout.write(lines.join('\n'));
```

- [ ] **Step 2: Verify the script syntax**

Run:
```bash
cd frontend && node --check scripts/audit-browser-tests.mjs
```

Expected: exit 0, no output.

- [ ] **Step 3: Commit**

```bash
git add frontend/scripts/audit-browser-tests.mjs
git commit -m "[CHORE] (testing): add FE browser test audit script

One-shot classifier for the P2 spec. Walks test/browser/**/*.test.tsx,
regex-matches a fixed marker set, emits a markdown report grouping
files into clear-JSDOM, needs-real-browser, and borderline buckets."
```

---

## Task 2: Generate the audit report

**Files:**
- Create: `docs/superpowers/audits/2026-05-26-fe-browser-classification.md`

- [ ] **Step 1: Ensure the audits directory exists**

```bash
mkdir -p docs/superpowers/audits
```

- [ ] **Step 2: Run the audit script and write the report**

```bash
node frontend/scripts/audit-browser-tests.mjs > docs/superpowers/audits/2026-05-26-fe-browser-classification.md
```

- [ ] **Step 3: Sanity-check the report**

```bash
head -20 docs/superpowers/audits/2026-05-26-fe-browser-classification.md
```

Expected: starts with `# FE browser test classification — 2026-05-26`, includes the Summary section with three non-zero counts (or zero only if the bucket truly is empty).

Sanity check: the Total should equal the file count from `find frontend/test/browser -name "*.test.tsx" | wc -l`. If they disagree, the script has a walk bug — fix before continuing.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/audits/2026-05-26-fe-browser-classification.md
git commit -m "[DOCS] (testing): add FE browser test classification report

Generated by frontend/scripts/audit-browser-tests.mjs. Drives the
Phase B migration: clear-JSDOM files move to test/unit/components/,
needs-real-browser stays in test/browser/, borderline stays put
until manual review."
```

---

## Task 3: One-time Phase-B setup

**Files:**
- Create: `frontend/test/unit/UnitTestProvider.tsx`
- Modify: `frontend/test/setup-dom.ts` — add i18n hydration in `beforeAll`.

- [ ] **Step 1: Verify `@testing-library/user-event` is available**

```bash
cd frontend && npm ls @testing-library/user-event 2>&1 | head -3
```

If the output shows the package, skip Step 2. If "empty" or "no such dependency", do Step 2.

- [ ] **Step 2 (conditional): Install `@testing-library/user-event`**

```bash
cd frontend && npm install --save-dev @testing-library/user-event
```

If installed, commit the lockfile and package.json change as a separate commit before continuing:

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "[CHORE] (testing): add @testing-library/user-event for JSDOM tests

Needed by Phase B of the FE browser audit migration: JSDOM tests
that simulate user input use this library instead of vitest/browser's
auto-bound userEvent."
```

- [ ] **Step 3: Create `frontend/test/unit/UnitTestProvider.tsx`**

```tsx
import React from 'react';
import { ThemeProvider } from '@mui/material';
import { morkBorgTheme } from '@/theme/morkBorgTheme';
import i18n from '@/i18n';
import { I18nextProvider } from 'react-i18next';

interface UnitTestProviderProps {
  children: React.ReactNode;
}

export default function UnitTestProvider({ children }: UnitTestProviderProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={morkBorgTheme}>{children}</ThemeProvider>
    </I18nextProvider>
  );
}
```

- [ ] **Step 4: Patch `frontend/test/setup-dom.ts` to hydrate i18n**

Read `frontend/test/setup-dom.ts` first to confirm the current state matches the spec's snapshot. Then add the import + `beforeAll` hydration.

Apply this exact edit. Old block (top of file):

```ts
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

beforeAll(() => {
  vi.stubEnv('VITE_BACKEND_URL', 'http://localhost:3000');
});
```

New block:

```ts
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { loadLanguage } from '@/i18n';

beforeAll(async () => {
  vi.stubEnv('VITE_BACKEND_URL', 'http://localhost:3000');
  await loadLanguage('en');
});
```

Notes for the engineer:
- The existing `beforeAll` is synchronous; the new one is `async`. That's fine — Vitest awaits async setup hooks.
- `loadLanguage` is the i18n bootstrap also used in `setup-browser.ts`. Same import path.

- [ ] **Step 5: Verify the unit suite still passes**

```bash
cd frontend && npm run test:unit 2>&1 | tail -10
```

Expected: same baseline as before P2 (234 passed, 5 failed in `navigation.test.ts` — those 5 are P4 work, ignore them).

If the count drops by anything other than 0, the i18n hydration change broke something. Stop, surface, do not commit.

- [ ] **Step 6: Commit**

```bash
git add frontend/test/unit/UnitTestProvider.tsx frontend/test/setup-dom.ts
git commit -m "[CHORE] (testing): add UnitTestProvider + i18n hydration in setup-dom

Prep for Phase B of the FE browser audit migration. UnitTestProvider
mirrors BrowserTestProvider but drops CssBaseline, the yellow wrapper,
and the animation-killer style block — none of those matter in JSDOM.
setup-dom.ts now awaits loadLanguage('en') in beforeAll so migrated
component tests see translated strings."
```

---

## Task 4: Migration batch loop

This task is iterative: repeat until the clear-JSDOM bucket in the audit report is empty.

**Per-batch procedure:**

For each batch of 8–12 files from the **top of** the clear-JSDOM bucket in `docs/superpowers/audits/2026-05-26-fe-browser-classification.md`:

- [ ] **Step 1: Pick the next batch**

Read the audit report. Take the next 8–12 unmigrated files from the clear-JSDOM section. Prefer batching by directory (e.g., all `test/browser/atoms/` together, then all `test/browser/molecules/...`). Smaller batches are fine if a directory has fewer than 8 files.

Write the list of file paths into a working note (not committed).

- [ ] **Step 2: For each file in the batch, perform the migration**

Repeat steps 2a–2e for every file in the batch before moving on. Do not commit between files within a batch.

**2a. Move the file**

Replace `frontend/test/browser/<rel>/X.test.tsx` with `frontend/test/unit/components/<rel>/X.test.tsx`. Use `git mv` so the diff shows as a rename:

```bash
git mv frontend/test/browser/<rel>/X.test.tsx frontend/test/unit/components/<rel>/X.test.tsx
```

If `<rel>` is empty (file at the top level of `test/browser/`), move into `test/unit/components/` directly:

```bash
git mv frontend/test/browser/X.test.tsx frontend/test/unit/components/X.test.tsx
```

If the target directory does not exist, `git mv` creates it. If it errors saying the destination directory does not exist, `mkdir -p` it first, then `git mv`.

**2b. Rewrite imports**

Open the moved file. Apply these replacements:

| Find | Replace with |
|---|---|
| `import { render } from 'vitest-browser-react';` | `import { render, screen } from '@testing-library/react';` |
| `import { page, userEvent } from 'vitest/browser';` | `import userEvent from '@testing-library/user-event';` |
| `import BrowserTestProvider from '../BrowserTestProvider';` (or any relative path) | `import UnitTestProvider from '../UnitTestProvider';` — adjust the relative path to point from the new file location to `frontend/test/unit/UnitTestProvider.tsx` |
| `<BrowserTestProvider>` JSX | `<UnitTestProvider>` |
| `</BrowserTestProvider>` JSX | `</UnitTestProvider>` |

Some files may import only `render` (without `page`/`userEvent`). In that case the `import { page, userEvent } from 'vitest/browser';` line is absent — skip the second row of the table.

If a file imports something else from `vitest-browser-react` (e.g., a fixture, a custom render), pause: that's not a "clear-JSDOM" case — reclassify (Step 4) and skip.

**2c. Rewrite the API in the test body**

For each occurrence in the file body, apply these replacements:

| Find | Replace with |
|---|---|
| `await render(<Foo />);` | `render(<Foo />);` (drop the `await`) |
| `const { rerender } = await render(<Foo />);` | `const { rerender } = render(<Foo />);` |
| `page.getByRole(` | `screen.getByRole(` |
| `page.getByText(` | `screen.getByText(` |
| `page.getByTestId(` | `screen.getByTestId(` |
| `page.getByLabelText(` | `screen.getByLabelText(` |
| `page.getByPlaceholderText(` | `screen.getByPlaceholderText(` |
| `page.getByDisplayValue(` | `screen.getByDisplayValue(` |
| `page.getByTitle(` | `screen.getByTitle(` |
| `page.getByAltText(` | `screen.getByAltText(` |
| `await expect.element(x).toBeVisible();` | `expect(x).toBeVisible();` |
| `await expect.element(x).toBeInTheDocument();` | `expect(x).toBeInTheDocument();` |
| `await expect.element(x).not.toBeInTheDocument();` | `expect(x).not.toBeInTheDocument();` |
| `await expect.element(x).toHaveTextContent(...)` | `expect(x).toHaveTextContent(...)` |
| `await expect.element(x).toBeDisabled()` | `expect(x).toBeDisabled()` |
| `await expect.element(x).toHaveAttribute(...)` | `expect(x).toHaveAttribute(...)` |
| `await expect.poll(() => mockFn).toHaveBeenCalledWith(...);` | `await waitFor(() => expect(mockFn).toHaveBeenCalledWith(...));` (and add `waitFor` to the `@testing-library/react` import) |
| `await userEvent.click(x);` (when `userEvent` was from `vitest/browser`) | First add `const user = userEvent.setup();` once near the top of the test body, then `await user.click(x);` |
| `await userEvent.type(x, '...');` | `await user.type(x, '...');` (after `userEvent.setup()`) |
| `await userEvent.keyboard('...');` | `await user.keyboard('...');` |

**Important — `userEvent.setup()` placement:**

`@testing-library/user-event` v14+ requires `userEvent.setup()` once per test (NOT once per file). Add `const user = userEvent.setup();` inside each `it(...)` block that interacts with the user-event API, immediately after the `render(...)` call.

If the test uses `userEvent` in multiple `it` blocks, each block needs its own `user.setup()` call. Repeating the `setup()` line is the correct pattern.

**2d. Run the migrated test**

```bash
cd frontend && npx vitest run test/unit/components/<rel>/X.test.tsx
```

Expected: green. Specifically the file passes all its assertions.

If it fails with a stack trace pointing at API rewrite mistakes (e.g., `userEvent.click is not a function`), fix and re-run.

If it fails for a substantive reason that suggests the test relies on real-browser behaviour (e.g., focus-related assertion fails, layout-dependent assertion, a portaled element that screen can't find even with `screen.getByRole('dialog')`), proceed to Step 2e.

**2e. (Conditional) Reclassify as borderline**

If the migrated test cannot be made green without altering its meaning, move it back:

```bash
git mv frontend/test/unit/components/<rel>/X.test.tsx frontend/test/browser/<rel>/X.test.tsx
```

Then revert the API rewrites:

```bash
git checkout HEAD -- frontend/test/browser/<rel>/X.test.tsx
```

(This restores the original content of the file at the new path.)

Finally, update the audit report `docs/superpowers/audits/2026-05-26-fe-browser-classification.md`:
- Remove the entry from the clear-JSDOM list.
- Add it to the borderline list with a marker like `verification-failed: <one-line reason>`.

Don't commit the report update as a separate commit; include it with the batch's commit at Step 4.

- [ ] **Step 3: Run the full unit + browser suites for the batch**

After every file in the batch is either green-in-JSDOM or reclassified-to-borderline:

```bash
cd frontend && npm run test:unit 2>&1 | tail -5
```

Expected: pass count increased by N (where N is the number of files actually migrated in this batch, i.e. clear-JSDOM minus reclassified). 5 failures from `navigation.test.ts` remain (P4 work). No other failures.

```bash
cd frontend && npm run test:browser 2>&1 | tail -10
```

Expected: pass count decreased by N. No new failures.

If either suite has a new failure that wasn't expected, stop. Investigate. Do not commit the batch.

- [ ] **Step 4: Commit the batch**

Stage the moves, the modified file contents, and any updates to the audit report (if files were reclassified):

```bash
git add frontend/test/browser frontend/test/unit/components docs/superpowers/audits/2026-05-26-fe-browser-classification.md
```

Commit. Use a message that names the directory or batch range:

```bash
git commit -m "[REFACTOR] (testing): migrate <directory-or-range> from test/browser to test/unit/components

Moves N JSDOM-eligible test files from the vitest browser stage to
the JSDOM unit stage. Rewrites vitest-browser-react / vitest/browser
API into @testing-library/react + @testing-library/user-event.
<M reclassified to borderline because of <reason>, if applicable.>

Part of the P2 spec for FE browser test audit + migration."
```

- [ ] **Step 5: Decide next batch or finish**

Open the audit report again. If the clear-JSDOM bucket still has unmigrated files, go back to Step 1 of this task and pick the next batch.

If the clear-JSDOM bucket is empty (every file moved or reclassified), proceed to Task 5.

---

## Task 5: Final cleanup and verification

**Files:**
- Maybe delete: `frontend/test/browser/BrowserTestProvider.tsx`

- [ ] **Step 1: Check if `BrowserTestProvider` is still referenced**

```bash
cd frontend && grep -rln "BrowserTestProvider" test/browser 2>&1 | head -10
```

If the only match is `test/browser/BrowserTestProvider.tsx` itself (the definition file), no spec imports it any more.

- [ ] **Step 2 (conditional): Delete the unused provider**

If Step 1 showed no importers:

```bash
rm frontend/test/browser/BrowserTestProvider.tsx
```

If there are still importers (files in the `needs-real-browser` or `borderline` buckets), skip this step.

- [ ] **Step 3: Verify both suites end-to-end**

```bash
cd frontend && npm run test:unit 2>&1 | tail -5
cd frontend && npm run test:browser 2>&1 | tail -5
```

Expected:
- `test:unit`: passes; pass count is ~ baseline + (number of files migrated in Phase B). 5 failures in `navigation.test.ts` (P4) remain.
- `test:browser`: passes; file count is the size of the needs-real-browser + borderline buckets combined.

- [ ] **Step 4: Compare runtime against pre-P2 baseline**

Capture each suite's wall-clock. Pre-P2 baseline: `test:browser` ~58s (3 browsers), `test:unit` ~21s. Post-P2 envelope: `test:browser` smaller in proportion to file count; `test:unit` larger by ~10–20s for the migrated tests.

If `test:unit` grew dramatically more than expected (e.g., over 60s) or `test:browser` did not shrink, surface that — there may be redundant work in JSDOM (e.g., heavy MUI imports per file that could share a pre-bundle).

This step does not block the commit if numbers are reasonable. Just record them in the final report.

- [ ] **Step 5: Commit if anything was modified in Step 2**

```bash
git add -A frontend/test/browser
git commit -m "[CHORE] (testing): delete unused BrowserTestProvider after Phase B migration

Every file that imported BrowserTestProvider has migrated to the
JSDOM unit stage and now uses UnitTestProvider. The wrapper is no
longer referenced."
```

If nothing was modified, skip the commit.

- [ ] **Step 6: Produce a one-paragraph completion note**

Capture:
- Number of files in each bucket from the audit (clear-JSDOM, needs-real-browser, borderline)
- Number actually migrated vs reclassified
- Pre/post wall-clock for both suites
- Commit SHAs landed (audit script, report, prep, batch commits, optional final cleanup)
- Hand back to the user.

---

## Acceptance recap (from the spec)

- `frontend/scripts/audit-browser-tests.mjs` exists. ✅ Task 1.
- `docs/superpowers/audits/2026-05-26-fe-browser-classification.md` exists with three buckets summarised. ✅ Task 2.
- Every clear-JSDOM file lives under `test/unit/components/`. ✅ Task 4 loop.
- `frontend/test/unit/UnitTestProvider.tsx` exists and is imported by the migrated tests. ✅ Task 3 + Task 4 rewrite.
- `npm run test:unit` passes; count is up by the migrated-file count. ✅ Task 5.
- `npm run test:browser` passes; file count is down by the migrated-file count. ✅ Task 5.
- Each batch commit is independently green. ✅ Task 4 Step 3.

## Self-review

**Spec coverage:**
- Spec Phase A → Tasks 1–2. ✓
- Spec Phase B one-time setup → Task 3. ✓
- Spec Phase B per-file procedure → Task 4 steps 2a–2e. ✓
- Spec Phase B batching → Task 4 Step 4. ✓
- Spec `BrowserTestProvider` cleanup → Task 5. ✓
- Spec acceptance → Task 5 Step 3. ✓
- Spec risks → mitigated by Task 4 verification step + reclassification path.

**Placeholder scan:** No TBDs. Every step has concrete content. Counts depend on Task 2 output but the procedure is fully spelled out.

**Type consistency:** `UnitTestProvider` named identically across Tasks 3 and 4. `userEvent.setup()` and `user.click()` pattern used consistently in Task 4 rewrite table. Audit-script bucket names (`clear-JSDOM`, `needs-real-browser`, `borderline`) match across Tasks 1, 2, 4, 5.
