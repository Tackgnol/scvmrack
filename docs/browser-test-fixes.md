# Browser Test Review — Fixes

Findings from reviewing the Vitest 4.1 browser tests added in the components reorganisation.

---

## Fix 1: Triple cleanup — source of the suppressed webkit error

**Files affected:** `client/test/setup-browser.ts`, every test file

`vitest-browser-react` (default entry, not `/pure`) already registers auto-cleanup internally before each test. On top of that, `setup-browser.ts` adds a second `afterEach(cleanup)`, and every test body calls `await unmount()`. The result is three cleanup passes per test, and the suppressed `"evaluating 'e.includes'"` webkit error in `setup-browser.ts` is a symptom of this.

### Why the `unmount()` calls are the culprit

When a test calls `await unmount()`, it removes the component from the internal tracking list and triggers the unmount lifecycle synchronously in the browser. Both `afterEach` passes that follow then find nothing left — so they're no-ops, not a true double-unmount. But the webkit error (`"evaluating 'e.includes'"`) fires *during* the explicit `unmount()` call — something in vitest-browser-react's internals misfires on that code path in webkit specifically. The auto-cleanup path doesn't hit it, which is why suppressing the error "works" but is the wrong fix.

### The fix: just delete the `unmount()` calls

**Option A** — rely on auto-cleanup (simplest, recommended):
- Remove `afterEach(cleanup)` from `setup-browser.ts` (duplicate of the default entry's own afterEach)
- Remove all `await unmount()` calls from individual tests
- Remove the `window.onerror` suppression block — the error will stop occurring
- Auto-cleanup from the default entry handles everything

**Option B** — explicit control via `/pure`:
- Change all imports to `from 'vitest-browser-react/pure'`
- Keep `afterEach(cleanup)` in `setup-browser.ts`
- Remove `await unmount()` calls from individual tests (redundant with afterEach)
- Remove the `window.onerror` suppression block

---

## Fix 2: `BrowserTestProvider` re-initialises i18n on every test

**File:** `client/test/browser/BrowserTestProvider.tsx`

Every test renders `null` first, then triggers a state update after `loadLanguage` resolves inside a `useEffect`. This adds async latency before every assertion can pass and makes tests flaky if the language load is slow.

**Fix:** Call `loadLanguage('en')` once in the setup file instead, and remove the `ready` gate from `BrowserTestProvider`:

```ts
// client/test/setup-browser.ts
import { loadLanguage } from '@/i18n';

beforeAll(async () => {
  await loadLanguage('en');
});
```

Then `BrowserTestProvider` can drop the `useState(false)` / `useEffect` / `if (!ready) return null` block entirely and render children directly.

---

## Fix 3: DOM leak in `SummaryDetailPopper` test

**File:** `client/test/browser/molecules/summary/SummaryDetailPopper.test.tsx`

The `onClickAway` test appends a div to `document.body` and removes it at the end. But `removeChild` is never reached if an assertion throws, leaking the element into the DOM for all subsequent tests in the file (browser tests share the same page).

**Fix:** Wrap in `try/finally`:

```ts
const outside = document.createElement('div');
// ... configure outside element ...
document.body.appendChild(outside);
try {
  const { unmount } = await render(...);
  await userEvent.click(page.getByTestId('outside'));
  await expect.poll(() => defaultProps.onClickAway).toHaveBeenCalled();
  await unmount();
} finally {
  document.body.removeChild(outside);
}
```

---

## Fix 4: `sleep()` for timing in `NetworkActivityIndicator` is fragile

**File:** `client/test/browser/atoms/NetworkActivityIndicator.test.tsx`

```ts
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
await sleep(200); // component has 150ms internal delay
```

Real-timer sleeps fail under CI load. Since these tests don't use `userEvent`, the `userEvent + fake-timer` conflict doesn't apply here, making fake timers safe to use.

**Fix:**

```ts
beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

it('becomes visible after SHOW_DELAY_MS when fetching starts', async () => {
  vi.mocked(rq.useIsFetching).mockReturnValue(1);
  const { unmount } = await render(...);

  await expect.element(page.getByRole('presentation')).not.toBeInTheDocument();
  await vi.advanceTimersByTimeAsync(200); // flushes async microtasks too
  await expect.element(page.getByAltText('')).toBeVisible();
});
```

Use `vi.advanceTimersByTimeAsync` (not `vi.advanceTimersByTime`) so async microtasks triggered by the timer also flush.

---

## Fix 5: Multi-render tests break without mid-test cleanup

**Files affected:** `PowersSection.test.tsx`, `SummaryStatButton.test.tsx`

Some tests rendered a component twice in a single `it()` block and relied on the explicit `unmount()` calls between renders to clear the DOM. Auto-cleanup only fires *between* `it()` blocks, not mid-test. After removing `unmount()`, the second render's DOM overlapped with the first's, causing assertions like `.not.toBeInTheDocument()` to fail because the element from the first render was still present.

**Fix:** Split any test that renders twice into two separate `it()` blocks. Each `it()` gets a clean DOM via auto-cleanup.

```ts
// Before — fragile (relies on mid-test unmount)
it('shows/hides label based on prop', async () => {
  await render(<Component showLabel={true} />);
  await expect.element(page.getByText('LABEL')).toBeVisible();
  // unmount() was here — now gone

  await render(<Component showLabel={false} />);
  await expect.element(page.getByText('LABEL')).not.toBeInTheDocument(); // sees DOM from first render!
});

// After — correct
it('shows label when showLabel is true', async () => {
  await render(<Component showLabel={true} />);
  await expect.element(page.getByText('LABEL')).toBeVisible();
});

it('hides label when showLabel is false', async () => {
  await render(<Component showLabel={false} />);
  await expect.element(page.getByText('LABEL')).not.toBeInTheDocument();
});
```

**Rule:** one render per `it()`. If you need to test multiple prop combinations, use multiple `it()` blocks.
