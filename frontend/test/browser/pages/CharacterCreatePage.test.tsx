import { render } from 'vitest-browser-react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import BrowserTestProvider from '../BrowserTestProvider';
import { CharacterCreatePage } from '@/pages/CharacterCreatePage';
import { useCharacterDraft } from '@/hooks/useCharacterDraft';
import { useExistingGuestScvm } from '@/hooks/useExistingGuestScvm';

vi.mock('@/seo/Seo', () => ({ Seo: () => null }));
vi.mock('@/hooks/useCharacterDraft', () => ({
  useCharacterDraft: vi.fn(),
}));
// The page reads adoptCreatedCharacter + isGuest from the character context; the
// full CharacterProvider isn't mounted in these isolated UI tests.
vi.mock('@/CharacterContext/CharacterContext', () => ({
  useCharacter: () => ({ adoptCreatedCharacter: vi.fn(), isGuest: false }),
}));
// Isolate the guest-scvm lookup (it would otherwise need a QueryClient); tests
// drive its return directly.
vi.mock('@/hooks/useExistingGuestScvm', () => ({
  useExistingGuestScvm: vi.fn(() => null),
}));
vi.mock('@/components/organisms/character-create/ClassGate', () => ({
  ClassGate: ({ onPick }: { onPick: (choice: unknown) => void }) => (
    <button data-testid="mock-class-gate" onClick={() => onPick({ classId: 1 })}>gate</button>
  ),
}));
vi.mock('@/router/history', () => ({
  appHistory: {
    push: vi.fn().mockResolvedValue({ type: 'PUSHED' }),
    flush: vi.fn(),
    subscribe: vi.fn(() => () => {}),
    location: { search: '', pathname: '/', hash: '', state: null },
  },
}));

const preview = {
  id: undefined,
  name: 'Brint',
  classId: 1,
  className: 'Gutterborn Scvm',
  strength: 10,
  agility: 10,
  presence: 12,
  toughness: 8,
  maxHp: 5,
  currentHp: 5,
  omens: 2,
  silver: 60,
  habit: 'habit text',
  tale: 'tale text',
  bodyDescription: 'gnarled',
  trait1: 'bitter',
  trait2: 'hungry',
  abilities: [{ key: 'a.one', name: 'Pickpocket' }],
  equipment: [{ key: 'equipment.rope', name: 'Rope' }],
  equippedWeapons: [{ key: 'weapons.club', name: 'Femur Club' }],
  equippedArmor: null,
};

const classlessStatOptions = [
  { ability: 'strength', dice: [6, 6, 1, 1], minTotal: 8, maxTotal: 13, selected: true },
  { ability: 'agility', dice: [2, 2, 2, 2], minTotal: 6, maxTotal: 6, selected: false },
  { ability: 'presence', dice: [6, 5, 4, 3], minTotal: 12, maxTotal: 15, selected: false },
  { ability: 'toughness', dice: [1, 2, 3, 4], minTotal: 6, maxTotal: 9, selected: false },
];

const classlessPreview = {
  ...preview,
  classId: null,
  className: null,
  strength: 13,
  agility: 6,
  presence: 12,
  toughness: 6,
  abilities: [],
};

describe('CharacterCreatePage', () => {
  const start = vi.fn();
  const reroll = vi.fn();
  const setName = vi.fn();
  const setDropLowestAbilities = vi.fn();
  const confirm = vi.fn();
  const restart = vi.fn();

  const mockDraftState = (overrides: Record<string, unknown> = {}) => {
    vi.mocked(useCharacterDraft).mockReturnValue({
      phase: 'sheet',
      draft: { classId: 1, classless: false, seeds: {} },
      preview,
      classlessStatOptions: null,
      rollingSection: null,
      isChoosingStats: false,
      isStarting: false,
      isConfirming: false,
      error: null,
      start,
      reroll,
      setName,
      setDropLowestAbilities,
      confirm,
      restart,
      ...overrides,
    } as unknown as ReturnType<typeof useCharacterDraft>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useExistingGuestScvm).mockReturnValue(null);
  });

  it('shows the class gate in the class-gate phase', async () => {
    mockDraftState({ phase: 'class-gate', draft: null, preview: null });
    render(<BrowserTestProvider><CharacterCreatePage /></BrowserTestProvider>);

    await expect.element(page.getByTestId('mock-class-gate')).toBeVisible();
    await userEvent.click(page.getByTestId('mock-class-gate'));
    expect(start).toHaveBeenCalledWith({ classId: 1 });
  });

  it('shows all sections and the confirm bar in the sheet phase', async () => {
    mockDraftState();
    render(<BrowserTestProvider><CharacterCreatePage /></BrowserTestProvider>);

    await expect.element(page.getByTestId('draft-name')).toBeVisible();
    await expect.element(page.getByTestId('draft-stats')).toBeVisible();
    await expect.element(page.getByTestId('draft-stats-hp')).toHaveTextContent('HP: 5');
    await expect.element(page.getByTestId('draft-gear')).toBeVisible();
    await expect.element(page.getByTestId('create-confirm-button')).toBeVisible();
  });

  it('re-rolls a section through its die button', async () => {
    mockDraftState();
    render(<BrowserTestProvider><CharacterCreatePage /></BrowserTestProvider>);

    await userEvent.click(page.getByTestId('draft-stats-reroll'));
    expect(reroll).toHaveBeenCalledWith('stats');
  });

  it('marks only the active section die as rolling', async () => {
    mockDraftState({ rollingSection: 'stats' });
    render(<BrowserTestProvider><CharacterCreatePage /></BrowserTestProvider>);

    await expect.element(page.getByTestId('draft-stats-reroll')).toHaveAttribute('data-rolling', 'true');
    await expect.element(page.getByTestId('draft-name-reroll')).not.toHaveAttribute('data-rolling', 'true');
  });

  it('keeps the active rolling section visually stable', async () => {
    mockDraftState({ rollingSection: 'stats' });
    render(<BrowserTestProvider><CharacterCreatePage /></BrowserTestProvider>);

    const statsSection = page.getByTestId('draft-stats');
    await expect.element(statsSection).toBeVisible();

    const sectionElement = statsSection.element()!;
    const contentElement = sectionElement.querySelector('[aria-busy="true"]')!;

    expect(getComputedStyle(sectionElement).animationName).toBe('none');
    expect(getComputedStyle(contentElement).opacity).toBe('1');
  });

  it('edits the draft name', async () => {
    mockDraftState();
    render(<BrowserTestProvider><CharacterCreatePage /></BrowserTestProvider>);

    const nameInput = page.getByTestId('draft-name-input');
    await expect.element(nameInput).toBeVisible();
    await userEvent.fill(nameInput, 'Rotmaw');

    expect(setName).toHaveBeenCalledWith('Rotmaw');
  });

  it('lets classless drafts pick the second MAX stat', async () => {
    mockDraftState({
      draft: {
        classId: null,
        classless: true,
        dropLowestAbilities: ['strength'],
        seeds: {},
      },
      preview: classlessPreview,
      classlessStatOptions,
    });
    render(<BrowserTestProvider><CharacterCreatePage /></BrowserTestProvider>);

    await expect.element(page.getByTestId('draft-classless-stat-choice')).toBeVisible();
    await expect.element(page.getByTestId('draft-classless-stat-count')).toHaveTextContent('1/2 chosen');
    await expect.element(page.getByTestId('draft-stat-dice-strength')).toHaveTextContent('6611');

    await userEvent.click(page.getByTestId('draft-stat-choice-presence'));
    expect(setDropLowestAbilities).toHaveBeenCalledWith(['strength', 'presence']);
  });

  it('blocks confirmation until classless drafts choose two MAX stats', async () => {
    mockDraftState({
      draft: {
        classId: null,
        classless: true,
        dropLowestAbilities: ['strength'],
        seeds: {},
      },
      preview: classlessPreview,
      classlessStatOptions,
    });
    render(<BrowserTestProvider><CharacterCreatePage /></BrowserTestProvider>);

    await expect.element(page.getByText(/pick 1\/2 max stats/i)).toBeVisible();
    await expect.element(page.getByTestId('create-confirm-button')).toBeDisabled();
  });

  it('confirms through the summary bar', async () => {
    mockDraftState();
    render(<BrowserTestProvider><CharacterCreatePage /></BrowserTestProvider>);

    await userEvent.click(page.getByTestId('create-confirm-button'));
    expect(confirm).toHaveBeenCalled();
  });

  it('surfaces errors as an alert', async () => {
    mockDraftState({ error: 'Failed to re-roll' });
    render(<BrowserTestProvider><CharacterCreatePage /></BrowserTestProvider>);

    await expect.element(page.getByText(/failed to re-roll/i)).toBeVisible();
  });

  it('warns a guest that forging replaces their existing scvm', async () => {
    vi.mocked(useExistingGuestScvm).mockReturnValue({ id: 'old-1', name: 'Rotmaw' });
    mockDraftState();
    render(<BrowserTestProvider><CharacterCreatePage /></BrowserTestProvider>);

    await expect.element(page.getByText(/forging replaces your only scvm/i)).toBeVisible();
    await expect.element(page.getByText(/rotmaw/i)).toBeVisible();
  });

  it('gates confirmation behind the replace modal when a scvm already exists', async () => {
    vi.mocked(useExistingGuestScvm).mockReturnValue({ id: 'old-1', name: 'Rotmaw' });
    mockDraftState();
    render(<BrowserTestProvider><CharacterCreatePage /></BrowserTestProvider>);

    await userEvent.click(page.getByTestId('create-confirm-button'));
    expect(confirm).not.toHaveBeenCalled();

    await userEvent.click(page.getByTestId('forge-replace-confirm'));
    expect(confirm).toHaveBeenCalled();
  });
});
