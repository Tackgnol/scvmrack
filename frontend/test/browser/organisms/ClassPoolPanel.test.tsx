import { render } from 'vitest-browser-react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BrowserTestProvider from '../BrowserTestProvider';
import { ClassPoolPanel } from '@/components/organisms/class-pool/ClassPoolPanel/ClassPoolPanel';
import {
  getClassPool,
  setPoolClass,
  setPoolClassless,
  type ClassPoolView,
  type PoolClass,
} from '@/api/classPool';

vi.mock('@/api/classPool', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/classPool')>()),
  getClassPool: vi.fn(),
  setPoolClass: vi.fn(),
  setPoolClassless: vi.fn(),
}));

const cls = (name: string, overrides: Partial<PoolClass> = {}): PoolClass => ({
  lineageId: `lin-${name}`,
  classId: 1,
  group: 'book',
  name,
  blurb: `${name} blurb`,
  languages: ['en', 'pl'],
  attribution: null,
  abilityCount: 7,
  randomAbilityCount: 1,
  classItemCount: 0,
  gettingBetterRule: 'book',
  version: 1,
  playingHere: 0,
  enabled: true,
  ...overrides,
});

const baseView = (): ClassPoolView => ({
  classlessEnabled: true,
  classes: [
    cls('Fanged Deserter', { playingHere: 2 }),
    cls('Esoteric Hermit', { enabled: false }),
    cls('Ossuary Knight', {
      group: 'zine',
      enabled: false,
      attribution: { kind: 'credit', work: 'Terrible Dungeons', author: 'Toby', url: null },
    }),
  ],
  removed: [],
});

function renderPanel() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserTestProvider>
        <ClassPoolPanel partyId="p1" />
      </BrowserTestProvider>
    </QueryClientProvider>
  );
}

describe('ClassPoolPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getClassPool).mockResolvedValue(baseView());
  });

  it('shows the tally, Classless and the open Book group with its fraction', async () => {
    renderPanel();

    await expect
      .element(page.getByTestId('class-pool-tally'))
      .toHaveAttribute('aria-label', 'Pool summary: 1 class on, plus Classless');
    await expect.element(page.getByRole('switch', { name: 'Classless scvm in the pool' })).toBeChecked();
    await expect.element(page.getByRole('switch', { name: 'Fanged Deserter in the pool' })).toBeChecked();
    await expect.element(page.getByText('2 scvm play it here')).toBeVisible();
    await expect
      .element(page.getByRole('button', { name: /Book Classes/ }))
      .toHaveAccessibleName(/1 of 2 on/);
    // Zine starts collapsed
    await expect.element(page.getByText('Ossuary Knight')).not.toBeInTheDocument();
  });

  it('saves a switch at once and announces it', async () => {
    const after = baseView();
    after.classes[1].enabled = true;
    vi.mocked(setPoolClass).mockResolvedValue(after);
    renderPanel();

    const hermit = page.getByRole('switch', { name: 'Esoteric Hermit in the pool' });
    await hermit.click();

    await expect.element(hermit).toBeChecked();
    expect(setPoolClass).toHaveBeenCalledWith({
      partyId: 'p1',
      lineageId: 'lin-Esoteric Hermit',
      enabled: true,
      locale: 'en',
    });
    await expect
      .element(page.getByRole('status').filter({ hasText: 'Saved' }))
      .toHaveTextContent('Esoteric Hermit added to the pool. Saved.');
  });

  it('rolls a switch back when the save fails', async () => {
    vi.mocked(setPoolClass).mockRejectedValue(new Error('nope'));
    renderPanel();

    const deserter = page.getByRole('switch', { name: 'Fanged Deserter in the pool' });
    await deserter.click();

    await expect.element(page.getByText("That change didn't save. Try again.")).toBeVisible();
    await expect.element(deserter).toBeChecked();
  });

  it('opens the sections a filter shows', async () => {
    renderPanel();

    await page.getByRole('button', { name: 'Zine & Rack' }).click();

    await expect.element(page.getByText('Ossuary Knight').first()).toBeVisible();
    await expect.element(page.getByText('from Terrible Dungeons by Toby').first()).toBeVisible();
    await expect.element(page.getByText('Fanged Deserter')).not.toBeInTheDocument();
  });

  it('a search opens the groups it matches, which still collapse', async () => {
    renderPanel();

    await page.getByRole('searchbox', { name: 'Search classes' }).fill('toby');
    await expect.element(page.getByText('Ossuary Knight').first()).toBeVisible();

    await page.getByRole('button', { name: /Zine Classes/ }).click();
    await expect.element(page.getByText('Ossuary Knight')).not.toBeInTheDocument();
  });

  it('links a public Custom Class to its report form', async () => {
    const withPublic = baseView();
    withPublic.classes.push(
      cls('Public Wretch', {
        classId: 77,
        group: 'public',
        attribution: { kind: 'owner', name: 'Ada', private: false },
      })
    );
    vi.mocked(getClassPool).mockResolvedValue(withPublic);
    renderPanel();

    await page.getByRole('button', { name: /Other GMs' public classes/ }).click();
    await expect
      .element(page.getByRole('link', { name: 'Report a class' }))
      .toHaveAttribute('href', '/report?classId=77');
  });

  it('a class whose author is gone is not called taken down', async () => {
    const withRemoved = baseView();
    withRemoved.removed = [{ lineageId: 'lin-gone', name: 'Orphan', by: null, reason: 'unpublished' }];
    vi.mocked(getClassPool).mockResolvedValue(withRemoved);
    renderPanel();

    await expect
      .element(page.getByTestId('removed-class-notice'))
      .toHaveTextContent('“Orphan” has been removed by its author (made private by its author).');
  });

  it('reports a failed switch even after a later one saved', async () => {
    let failFirst!: (error: Error) => void;
    vi.mocked(setPoolClass)
      .mockImplementationOnce(() => new Promise((_resolve, reject) => (failFirst = reject)))
      .mockResolvedValueOnce(baseView());
    renderPanel();

    const deserter = page.getByRole('switch', { name: 'Fanged Deserter in the pool' });
    const hermit = page.getByRole('switch', { name: 'Esoteric Hermit in the pool' });
    await deserter.click();
    await hermit.click();
    await expect.element(hermit).toBeChecked();
    // switches save one at a time: the second waits for the first
    expect(setPoolClass).toHaveBeenCalledTimes(1);

    failFirst(new Error('nope'));

    await expect.poll(() => vi.mocked(setPoolClass).mock.calls.length).toBe(2);
    await expect.element(page.getByText('Esoteric Hermit added to the pool. Saved.')).toBeVisible();
    await expect.element(deserter).toBeChecked();
  });

  it('warns when the pool is empty', async () => {
    const empty = baseView();
    empty.classlessEnabled = false;
    empty.classes = empty.classes.map((c) => ({ ...c, enabled: false }));
    vi.mocked(getClassPool).mockResolvedValue(empty);
    renderPanel();

    await expect
      .element(page.getByRole('alert'))
      .toHaveTextContent('Nobody can roll a scvm with an empty pool.');
  });

  it('dismissing a removed notice takes the class out of the pool', async () => {
    const withRemoved = baseView();
    withRemoved.removed = [
      { lineageId: 'lin-gone', name: "Grave Warden's Due", by: 'Morbid Marta', reason: 'archived' },
    ];
    vi.mocked(getClassPool).mockResolvedValue(withRemoved);
    vi.mocked(setPoolClass).mockResolvedValue(baseView());
    renderPanel();

    await expect
      .element(page.getByTestId('removed-class-notice'))
      .toHaveTextContent(
        "“Grave Warden's Due” has been removed by Morbid Marta (archived by its author)."
      );
    await page.getByRole('button', { name: 'Got it' }).click();

    await expect.element(page.getByTestId('removed-class-notice')).not.toBeInTheDocument();
    expect(setPoolClass).toHaveBeenCalledWith(
      expect.objectContaining({ lineageId: 'lin-gone', enabled: false })
    );
  });

  it('switches Classless', async () => {
    vi.mocked(setPoolClassless).mockResolvedValue({ ...baseView(), classlessEnabled: false });
    renderPanel();

    const classless = page.getByRole('switch', { name: 'Classless scvm in the pool' });
    await classless.click();

    await expect.element(classless).not.toBeChecked();
    expect(setPoolClassless).toHaveBeenCalledWith({ partyId: 'p1', enabled: false, locale: 'en' });
  });
});
