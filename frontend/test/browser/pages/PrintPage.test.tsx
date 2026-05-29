import { render } from 'vitest-browser-react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import BrowserTestProvider from '../BrowserTestProvider';
import { PrintPage } from '@/pages/PrintPage';
import { useCharacter } from '@/CharacterContext/CharacterContext';
import { appHistory } from '@/router/history';

const mockPrint = vi.fn();

vi.mock('@/seo/Seo', () => ({
  Seo: () => null,
}));

vi.mock('@/CharacterContext/CharacterContext', () => ({
  useCharacter: vi.fn(),
}));

vi.mock('@/router/history', () => ({
  appHistory: {
    push: vi.fn(),
    replace: vi.fn(),
  },
}));

vi.mock('@/router/navigation', () => ({
  buildHomeCallbackUrl: vi.fn((characterId: string | null) =>
    characterId ? `/character/${characterId}` : '/character'
  ),
  buildPrintCallbackUrl: vi.fn((characterId: string | null) =>
    characterId ? `/print?character=${characterId}` : '/print'
  ),
}));

const printableCharacter = {
  id: 'char-1',
  name: 'Rot-Prone Sigrid',
  className: 'Gutterborn Scvm',
  currentHp: 3,
  maxHp: 7,
  omens: 1,
  maxOmens: 2,
  silver: 12,
  encumbrance: 2,
  maxEncumbrance: 8,
  drToDodge: 12,
  drToMelee: 10,
  drToRanged: 11,
  strength: 10,
  agility: 8,
  presence: 14,
  toughness: 6,
  equippedArmor: { name: 'Leather' },
  equipment: [
    { key: 'weapon.sword', name: 'Rusty Sword', description: 'd6' },
    { key: 'scroll.rot', name: 'Rot Scroll', uses: [false, true] },
    { key: 'pet.mule', name: 'Mule', tags: ['pet'] },
    { key: 'ration', name: 'Ration', tags: ['consumable'], uses: [false] },
  ],
  storage: [{ key: 'rope', name: 'Rope', amount: 2 }],
  abilities: [{ key: 'ability.1', name: 'Filthy Luck', description: 'Survive.' }],
  trait1: 'filthy',
  trait2: 'doomed',
  habit: 'mutters',
  bodyDescription: 'scarred',
  origin: 'ditch',
  computedModifiers: [
    {
      originName: 'Blessing',
      value: 1,
      statistic: 'strength',
      exclude: ['ranged'],
    },
  ],
  modifiers: [
    {
      name: 'Bad Knee',
      value: -1,
      statistic: 'agility',
      comment: 'limps',
    },
  ],
  notes: 'Owes silver to everyone.',
};

describe('PrintPage', () => {
  const renderPrintPage = async (
    overrides: Partial<ReturnType<typeof useCharacter>> = {}
  ) => {
    vi.mocked(useCharacter).mockReturnValue({
      character: printableCharacter,
      characterId: 'char-1',
      lastCharacterId: null,
      isLoading: false,
      ...overrides,
    } as ReturnType<typeof useCharacter>);

    return render(
      <BrowserTestProvider>
        <PrintPage />
      </BrowserTestProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.classList.remove('print-route-active');
    vi.stubGlobal('print', mockPrint);
  });

  it('renders printable character sections and marks the print route active', async () => {
    await renderPrintPage();

    expect(document.body.classList.contains('print-route-active')).toBe(true);
    await expect
      .element(page.getByRole('heading', { name: /rot-prone sigrid/i }))
      .toBeVisible();
    await expect.element(page.getByText('Gutterborn Scvm')).toBeVisible();
    await expect.element(page.getByText('Rusty Sword')).toBeVisible();
    await expect.element(page.getByText('Rope')).toBeVisible();
    await expect.element(page.getByText('Rot Scroll')).toBeVisible();
    await expect.element(page.getByText('Mule')).toBeVisible();
    await expect.element(page.getByText('Ration')).toBeVisible();
    await expect.element(page.getByText(/owes silver/i)).toBeVisible();
  });

  it('redirects print URLs to the remembered character when needed', async () => {
    await renderPrintPage({
      character: undefined,
      characterId: null,
      lastCharacterId: 'last-char',
    });

    await expect.poll(() => appHistory.replace).toHaveBeenCalledWith(
      '/print?character=last-char'
    );
  });

  it('navigates back to the active sheet', async () => {
    await renderPrintPage();

    await userEvent.click(page.getByRole('button', { name: /^sheet$/i }));

    expect(appHistory.push).toHaveBeenCalledWith('/character/char-1');
  });

  it('prints the current page', async () => {
    await renderPrintPage();

    await userEvent.click(page.getByRole('button', { name: /print sheet/i }));

    expect(mockPrint).toHaveBeenCalled();
  });

  it('shows loading and missing-character placeholders', async () => {
    await renderPrintPage({
      character: undefined,
      isLoading: true,
    });

    await expect.element(page.getByText(/loading/i)).toBeVisible();
  });

  it('shows a not-found placeholder after loading finishes without a character', async () => {
    await renderPrintPage({
      character: undefined,
      isLoading: false,
    });

    await expect.element(page.getByText(/scvm not found/i)).toBeVisible();
  });

  it('shows access denied instead of not found when the scvm belongs elsewhere', async () => {
    await renderPrintPage({
      character: undefined,
      isLoading: false,
      error: {
        statusCode: 403,
        code: 'CHARACTER_ACCESS_DENIED',
        message: "You don't have access to this scvm",
      },
    });

    await expect
      .element(page.getByText(/belongs to another session or account/i))
      .toBeVisible();
    expect(document.body.textContent).not.toMatch(/scvm not found/i);
  });
});
