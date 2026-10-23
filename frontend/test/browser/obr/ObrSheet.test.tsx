import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n, { loadLanguage } from '@/i18n';
import { CharacterContext } from '@/CharacterContext/CharacterContext';
import { CharacterSheet } from '@/components/organisms/CharacterSheet';
import { openClassDetails } from '@/obr/openClassDetails';
import type { useCurrentCharacter } from '@/hooks/useCurrentCharacter';
import type { Character } from '@/hooks/models';
import BrowserTestProvider from '../BrowserTestProvider';

describe('the real sheet in the router-less Owlbear entry', () => {
  afterEach(async () => {
    vi.restoreAllMocks();
    document.body.style.colorScheme = '';
    await page.viewport(1280, 720);
  });
  it('opens private class rules through the embedded identity handoff from the real sheet', async () => {
    await i18n.changeLanguage('en');
    const character: Character = { id: 'obr-private-sheet', classId: 17, name: 'QA Scvm',
      className: 'Private Ash Cartographer', classCustom: true, currentHp: 6, maxHp: 8,
      omens: 2, silver: 10, strength: 10, agility: 10, presence: 10, toughness: 10,
      abilities: [], equipment: [], modifiers: [], computedModifiers: [] };
    const context = { character, characterId: character.id, locale: 'en', updateField: vi.fn(),
      isLoading: false, isAuthenticated: false, validationIssues: {} } as unknown as ReturnType<typeof useCurrentCharacter>;
    const replace = vi.fn();
    const popup = { opener: window, location: { replace }, close: vi.fn() };
    const open = vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window);
    const issue = vi.fn(async () => 'test-exchange');
    await render(<BrowserTestProvider><QueryClientProvider client={new QueryClient()}>
      <CharacterContext.Provider value={context}>
        <CharacterSheet stamping={false} onGenerateNew={vi.fn()} onKillScvm={vi.fn()}
          onClassLinkClick={event => { event.preventDefault(); void openClassDetails(17, issue); }} />
      </CharacterContext.Provider>
    </QueryClientProvider></BrowserTestProvider>);
    await userEvent.click(page.getByRole('link', { name: 'Private Ash Cartographer', exact: true }));
    await expect.poll(() => replace).toHaveBeenCalledWith('/obr-open?to=class&classId=17&token=test-exchange');
    expect(open).toHaveBeenCalledWith('about:blank', '_blank');
    expect(popup.opener).toBeNull();
  });
  it.each([
    { className: 'Fanged Deserter', classCustom: false, classReportable: true },
    { className: 'Ash Cartographer', classCustom: true, classReportable: true },
  ].flatMap(cls => ['en', 'pl'].flatMap(locale => ['light', 'dark'].map(scheme => ({ ...cls, locale, scheme })))) )('opens $className in compact $locale / $scheme without a router', async ({ locale, scheme, ...classFields }) => {
    await page.viewport(420, 600);
    document.body.style.colorScheme = scheme;
    await loadLanguage(locale);
    await i18n.changeLanguage(locale);
    const character: Character = {
      id: 'obr-sheet', classId: 17, name: 'QA Scvm',
      ...classFields,
      currentHp: 6, maxHp: 8, omens: 2, silver: 10,
      strength: 10, agility: 10, presence: 10, toughness: 10,
      abilities: [], equipment: [], storage: [], modifiers: [], computedModifiers: [],
    };
    const updateField = vi.fn();
    // Supply the public context boundary; every sheet component and router link
    // remains real. Unused editing actions are outside this render regression.
    const context = { character, characterId: character.id, locale: 'en', updateField,
      isLoading: false, isAuthenticated: false, validationIssues: {},
    } as unknown as ReturnType<typeof useCurrentCharacter>;
    await render(
      <BrowserTestProvider>
        <QueryClientProvider client={new QueryClient()}>
          <CharacterContext.Provider value={context}>
            <CharacterSheet stamping={false} onGenerateNew={vi.fn()} onKillScvm={vi.fn()} />
          </CharacterContext.Provider>
        </QueryClientProvider>
      </BrowserTestProvider>,
    );
    await expect.element(page.getByText(classFields.className, { exact: true })).toBeVisible();
    const report = page.getByRole('link', { name: i18n.t('report.link'), exact: true });
    await expect.element(report).toHaveAttribute('href', '/report?classId=17');
    await expect.element(report).toHaveAttribute('target', '_blank');
    if (classFields.classCustom) {
      await expect.element(page.getByRole('link', { name: classFields.className, exact: true }))
        .toHaveAttribute('href', '/classes/17');
    }
    await userEvent.click(page.getByTestId('hp-increase'));
    await expect.poll(() => updateField).toHaveBeenCalledWith('currentHp', 7);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  });
});
