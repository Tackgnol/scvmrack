# FE browser test audit (P2)

Date: 2026-05-26
Status: Approved
Owner: Adam (with Claude Code)

## Context

`frontend/test/browser/` contains 68 `*.test.tsx` files that run under Vitest's browser mode against real Chromium / Firefox / WebKit (`vitest.browser.config.ts`). 66 of those files use the `vitest-browser-react` API; 2 reach for browser-only globals (animation, observers, focus).

The remaining `~64 files` are render-and-assert tests for atomic/molecular components. They run in a real browser only because that was the convention when the suite was set up — not because the component itself requires browser-only behavior.

Industry convention is the opposite: pure component-render tests live in JSDOM; real-browser tests are reserved for behavior that JSDOM cannot honestly simulate (focus management, layout, animation, observers, real keyboard navigation). The current arrangement signals "this might need a real browser" for everything, which makes future test authors uncertain where to place new tests.

The goal of P2 is to fix the signal: every file in `test/browser/` should be there because it genuinely needs a real browser. Everything else moves to `test/unit/components/` (a new directory; `test/unit/` is currently `.test.ts` only).

The work is two-phase: audit first to classify each file by what it actually exercises; then surgical migration of the "clear-JSDOM" bucket. The "needs-real-browser" bucket stays put. "Borderline" cases are flagged for manual review and only moved after individual verification.

The browser-suite runtime is ~58s today across three browsers (Chromium, Firefox, WebKit) with `fileParallelism: false`. Post-P2 the browser suite carries far fewer files; the rough envelope is "considerably less than 58s," but the actual gain depends on per-file cost vs. fixed browser-startup overhead. Wall-clock improvement is a side benefit; the real driver is intent clarity.

## Goal

Every `test/browser/*.test.tsx` file is there because the test genuinely needs a real browser. Pure render-and-assert tests live in `test/unit/components/` under JSDOM with the standard Testing Library API.

## Non-goals

- No migration of `test/browser/` files that exercise focus, layout, animation, observers, or real keyboard navigation.
- No code change to anything under `frontend/src/`. Tests are reorganised; source is not.
- No new tests written.
- No change to backend tests.
- No change to the existing 42 logic-only files under `test/unit/`.

## Phase A — Audit

### Classification buckets

A test file is classified into exactly one of three buckets:

| Bucket | Definition |
|---|---|
| **clear-JSDOM** | The file does not match any "needs-real-browser" marker (see below) and does not match any "borderline" marker. Safe to migrate. |
| **needs-real-browser** | The file matches at least one "needs-real-browser" marker. Stays in `test/browser/`. |
| **borderline** | The file does not match a hard "needs-real-browser" marker but matches a "borderline" marker (portals, MUI Dialog/Menu/Popover, async motion). Stays in `test/browser/` until manually reviewed in a follow-up. |

**Needs-real-browser markers (regex, case-sensitive unless noted):**

- `getBoundingClientRect`
- `\boffset(Width|Height|Top|Left)\b`
- `\bscroll(Top|Left|Into[A-Z])`
- `getComputedStyle\b`
- `\bResizeObserver\b`
- `\bIntersectionObserver\b`
- `\.focus\s*\(`
- `focusTrap\b`
- `import .* from ['"]motion['"]` (the project's animation lib)
- `import .* from ['"]framer-motion['"]`
- `key:\s*['"]Tab['"]` or `\bTab\b.*key` (real keyboard nav)

**Borderline markers (regex):**

- `Dialog\b|Menu\b|Popover\b|Tooltip\b` from `@mui/material` — portal-rendered, JSDOM handles most cases but edge cases exist
- `\bsetTimeout\b` in the test body (timing-sensitive)
- `waitFor\b` with non-default timeout (test author expected slow behavior)

### Audit script

A small Node script that walks `test/browser/**/*.test.tsx`, regex-matches every marker above against each file's content, and emits a markdown report.

Location: `frontend/scripts/audit-browser-tests.mjs`. Executable via `node frontend/scripts/audit-browser-tests.mjs > docs/superpowers/audits/2026-05-26-fe-browser-classification.md`.

Output format:

```markdown
# FE browser test classification — 2026-05-26

## Summary

- Total files: 66
- clear-JSDOM: NN
- needs-real-browser: NN
- borderline: NN

## clear-JSDOM (NN files)

- `test/browser/atoms/Flag.test.tsx` — markers: none
- `test/browser/atoms/FlagContainer.test.tsx` — markers: none
...

## needs-real-browser (NN files)

- `test/browser/X.test.tsx` — markers: getBoundingClientRect, .focus(
- ...

## borderline (NN files)

- `test/browser/Y.test.tsx` — markers: Dialog, waitFor
- ...
```

The script and the report are committed permanently. Future readers asking "why does this file live in `test/browser/`?" can re-run the script or grep the report. The script is small enough that the maintenance cost is near zero.

## Phase B — Surgical migration

Migrate exactly the **clear-JSDOM** bucket. **Borderline** files stay in `test/browser/` with a TODO note; **needs-real-browser** files stay untouched.

### One-time setup

Before migrating the first file, create `frontend/test/unit/UnitTestProvider.tsx`:

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

Compared to `BrowserTestProvider`:
- Dropped: `CssBaseline`, yellow background wrapper, animation-killing `<style>`. None of these matter in JSDOM (no real layout, no animation, no visual styling).
- Kept: theme + i18n providers, which components require to render.

### Per-file migration procedure

For each file in the **clear-JSDOM** bucket:

1. `git mv test/browser/<path>/X.test.tsx test/unit/components/<path>/X.test.tsx`. The directory structure under `test/unit/components/` mirrors `test/browser/` so file moves are obvious in `git mv` diffs.
2. Rewrite the imports and API per the table below.
3. Replace `BrowserTestProvider` with `UnitTestProvider` in the imports and JSX (the wrapper component itself stays in `test/browser/` until **all** clear-JSDOM files migrate; then it's safe to leave or move, but it's not needed by JSDOM tests).
4. Run `npm run test:unit -- test/unit/components/<path>/X.test.tsx` (path-scoped). The test must pass cleanly.
5. If it fails for non-API reasons (e.g., the test was secretly relying on real browser behavior), reclassify the file as **borderline** in the audit report and `git mv` it back to `test/browser/`. Capture the failure mode in the report's borderline section so future readers know what tripped.

### API rewrite table

| Browser (`vitest-browser-react` / `vitest/browser`) | JSDOM (`@testing-library/react` / `@testing-library/user-event`) |
|---|---|
| `import { render } from 'vitest-browser-react';` | `import { render, screen } from '@testing-library/react';` |
| `import { page, userEvent } from 'vitest/browser';` | `import userEvent from '@testing-library/user-event';` (drop `page`, use `screen`) |
| `const { rerender } = await render(<X />);` | `const { rerender } = render(<X />);` (drop `await`) |
| `page.getByRole('button', { name: 'X' })` | `screen.getByRole('button', { name: 'X' })` |
| `await expect.element(x).toBeVisible();` | `expect(x).toBeVisible();` (jest-dom matcher; already wired in `setup-dom.ts`) |
| `await expect.element(x).not.toBeInTheDocument();` | `expect(x).not.toBeInTheDocument();` |
| `await userEvent.click(button);` | `const user = userEvent.setup(); await user.click(button);` — testing-library v14 convention; instantiate `userEvent.setup()` once per test |
| `await expect.poll(() => mockFn).toHaveBeenCalledWith(...);` | `await waitFor(() => expect(mockFn).toHaveBeenCalledWith(...));` |

### Batching

Migrate in batches of 8–12 files per commit. Each batch must leave both `npm run test:unit` and `npm run test:browser` green. Group by directory if possible (`atoms/` together, `molecules/` together) so commit history is readable.

Approximate batch count: 5–7 commits (assuming ~40–60 clear-JSDOM files post-audit).

### `BrowserTestProvider` cleanup

If Phase B migrates every file that imported `BrowserTestProvider`, the wrapper becomes unused. Verify with a final grep at the end of Phase B; if unused, delete it in a final cleanup commit. If any **needs-real-browser** file still imports it, leave it where it is.

## Acceptance

Phase A:
- `frontend/scripts/audit-browser-tests.mjs` exists.
- `docs/superpowers/audits/2026-05-26-fe-browser-classification.md` exists, summarises counts, lists every file under exactly one bucket.

Phase B:
- Every **clear-JSDOM** file lives under `test/unit/components/`.
- `frontend/test/unit/UnitTestProvider.tsx` exists and is imported by the migrated tests.
- `npm run test:unit` passes; test count is up by N (the clear-JSDOM bucket size).
- `npm run test:browser` passes; file count is down by N.
- Combined runtime is no worse than the pre-P2 baseline. Realistic expectation: browser suite ~10–20s, unit suite ~25–35s, combined ≤ pre-P2.
- Each batch commit is independently green.

## Risks

- **Hidden environment dependencies.** A "clear-JSDOM" file may secretly rely on real-browser behaviour (e.g., a focus assertion that happens to pass because the test runs in a tab with no other focusable elements, but fails in JSDOM where focus semantics differ). Mitigation: the per-file verification step. If the migrated test fails, it gets reclassified to borderline and moved back.
- **`userEvent.setup()` ordering bug.** The migrated `userEvent` from `@testing-library/user-event` requires `.setup()` per test. Forgetting it causes events to fire synchronously without timers advancing, breaking async assertions. Mitigation: include the `userEvent.setup()` call in the API rewrite table; spot-check the first batch carefully.
- **MUI Dialog portal queries.** `screen.getByRole('dialog')` finds portaled content in JSDOM, but tests that look up content inside the dialog by direct DOM traversal may not work. Borderline classification catches these; if one slips through, the verification step exposes it.
- **i18n hydration timing.** `setup-browser.ts` does `await loadLanguage('en')` in `beforeAll`. `setup-dom.ts` does not. The first migrated test that depends on translated strings may fail. Mitigation: add an equivalent `beforeAll(() => loadLanguage('en'))` to `setup-dom.ts` (one-line addition) before the first batch.
- **Snapshot files.** Verified absent during scoping (`find test/browser -name __snapshots__` returns nothing). If any are added between now and implementation, the audit script should also check for sibling `__snapshots__/` directories.
- **Bundle size impact on JSDOM.** Migrating ~50 component test files to JSDOM means Vitest's pre-bundle step has to handle the MUI/Emotion graph for many more entries. Likely fine — the existing 42 JSDOM unit tests already pull this graph in for hook tests — but worth confirming the JSDOM suite runtime stays sane.

## What lands next

P2 is the test-suite intent-clarity stream. Remaining sub-streams of the test overhaul:

- **P3** — BE unit suite growth: cover schemas, validation branches, plugin wiring. Today: 1 file, 5 tests on `utils.ts`.
- **P4** — Misc cleanup: fix the 5 FE `navigation.test.ts` failures (stale `/?` → `/character?` route assertions), fix the integration test that targets `/health` instead of `/api/health`, make `test:coverage:merge` resilient to per-suite failure, fix `Dockerfile.dev`'s separate `RUN rm .npmrc` layer that leaves a credential window in intermediate images.

Each gets its own spec → plan → PR.
