import { render } from 'vitest-browser-react';
import { expect, describe, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import AbilityCardsGrid from '@/components/molecules/ability/AbilityCardsGrid';
import BrowserTestProvider from '../../BrowserTestProvider';
import { CharacterContext } from '@/CharacterContext/CharacterContext';
import i18n, { loadLanguage } from '@/i18n';

describe('AbilityCardsGrid Browser', () => {
  const mockCharacter = {
    agility: 12,
    presence: 10,
    strength: 8,
    toughness: 14,
    id: 'test-id',
  };

  const mockUpdateField = vi.fn();

  const mockContextValue = {
    character: mockCharacter,
    updateField: mockUpdateField,
    // Add other required fields from useCurrentCharacter if necessary
  } as any;

  it('announces attribute actions in Polish', async () => {
    await loadLanguage('pl');
    await i18n.changeLanguage('pl');
    await render(
      <BrowserTestProvider>
        <CharacterContext.Provider value={mockContextValue}>
          <AbilityCardsGrid />
        </CharacterContext.Provider>
      </BrowserTestProvider>
    );
    for (const stat of ['Zwinność', 'Opanowanie', 'Siła', 'Wytrzymałość']) {
      await expect.element(page.getByRole('button', { name: `Zmniejsz ${stat}`, exact: true })).toBeVisible();
      await expect.element(page.getByRole('button', { name: `Zwiększ ${stat}`, exact: true })).toBeVisible();
    }
    await expect.element(page.getByRole('button', { name: /^(Increase|Decrease) / }).first()).not.toBeInTheDocument();
  });

  it('renders all ability cards from config', async () => {
    await render(
      <BrowserTestProvider>
        <CharacterContext.Provider value={mockContextValue}>
          <AbilityCardsGrid />
        </CharacterContext.Provider>
      </BrowserTestProvider>
    );

    // ABILITY_CARD_CONFIG has 4 abilities: agility, presence, strength, toughness
    // We check for their labels (localized in BrowserTestProvider's i18n)
    
    // In en.json (guessed names)
    await expect.element(page.getByText('Agility', { exact: false })).toBeVisible();
    await expect.element(page.getByText('Presence', { exact: false })).toBeVisible();
    await expect.element(page.getByText('Strength', { exact: false })).toBeVisible();
    await expect.element(page.getByText('Toughness', { exact: false })).toBeVisible();

  });
});
