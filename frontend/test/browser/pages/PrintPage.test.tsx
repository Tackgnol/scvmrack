import { render } from 'vitest-browser-react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import { page } from 'vitest/browser';
import { PrintPage } from '@/pages/PrintPage';
import BrowserTestProvider from '../BrowserTestProvider';
import * as CharacterContextModule from '@/CharacterContext/CharacterContext';

vi.mock('@/CharacterContext/CharacterContext', async (importOriginal) => {
  const actual = await importOriginal<typeof CharacterContextModule>();
  return {
    ...actual,
    useCharacter: vi.fn(),
  };
});

// Mock router-related hooks
vi.mock('@tanstack/react-router', () => ({
    useRouterState: vi.fn().mockReturnValue({ location: { pathname: '/print' } }),
}));

describe('PrintPage Browser', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('groups equipment items correctly', async () => {
        const mockCharacter = {
            name: 'Test Character',
            className: 'Test Class',
            currentHp: 10,
            maxHp: 10,
            omens: 2,
            maxOmens: 2,
            silver: 50,
            equipment: [
                { key: 'equipment.rations', name: 'Rations', description: 'Food' },
                { key: 'equipment.rations', name: 'Rations', description: 'Food' },
                { key: 'equipment.torch', name: 'Torch', description: 'Light' },
            ],
            storage: [],
            computedModifiers: [],
            modifiers: [],
            abilities: [],
        };

        vi.mocked(CharacterContextModule.useCharacter).mockReturnValue({
            character: mockCharacter,
            characterId: 'char-123',
            lastCharacterId: 'char-123',
            isLoading: false,
            isSaving: false,
            isJustLoggedOut: false,
            validationIssues: [],
        } as any);

        await render(
            <BrowserTestProvider>
                <PrintPage />
            </BrowserTestProvider>
        );

        await expect.element(page.getByText('2x Rations')).toBeVisible();
        await expect.element(page.getByText('Torch')).toBeVisible();
    });

    it('groups equipment items with pre-existing amounts correctly', async () => {
        const mockCharacter = {
            name: 'Test Character',
            equipment: [
                { key: 'equipment.rations', name: 'Rations', amount: 5 },
                { key: 'equipment.rations', name: 'Rations', amount: 2 },
            ],
            storage: [],
            computedModifiers: [],
            modifiers: [],
            abilities: [],
        };

        vi.mocked(CharacterContextModule.useCharacter).mockReturnValue({
            character: mockCharacter,
            characterId: 'char-123',
            isLoading: false,
        } as any);

        await render(
            <BrowserTestProvider>
                <PrintPage />
            </BrowserTestProvider>
        );

        await expect.element(page.getByText('7x Rations')).toBeVisible();
    });
});
