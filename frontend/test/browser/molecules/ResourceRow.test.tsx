import { render } from 'vitest-browser-react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import ResourceRow from '@/components/molecules/ResourceRow';
import BrowserTestProvider from '../BrowserTestProvider';
import * as CharacterContextModule from '@/CharacterContext/CharacterContext';

vi.mock('@/CharacterContext/CharacterContext', () => ({
    useCharacter: vi.fn(),
}));

vi.mock('@/components/atoms/AnimatedNumber', () => ({
    default: ({ value }: { value: number }) => <span>{value}</span>,
}));

describe('ResourceRow Component', () => {
    const mockUpdateField = vi.fn();
    const mockUpdateArmorField = vi.fn();
    const mockKillAndReplace = vi.fn();

    const renderWithCharacter = async (charOverrides: any) => {
        vi.mocked(CharacterContextModule.useCharacter).mockReturnValue({
            character: {
                id: 'test-char',
                currentHp: 10,
                maxHp: 15,
                omens: 2,
                silver: 50,
                equippedArmor: { currentTier: 1, maxTier: 3 },
                ...charOverrides,
            },
            updateField: mockUpdateField,
            updateArmorField: mockUpdateArmorField,
            killAndReplace: mockKillAndReplace,
        } as any);

        return render(
            <BrowserTestProvider>
                <ResourceRow />
            </BrowserTestProvider>
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('handles HP increases and decreases', async () => {
        await renderWithCharacter({ currentHp: 5 });

        const incBtn = page.getByTestId('hp-increase');
        const decBtn = page.getByTestId('hp-decrease');
        
        await userEvent.click(incBtn);
        expect(mockUpdateField).toHaveBeenCalledWith('currentHp', 6);

        await userEvent.click(decBtn);
        expect(mockUpdateField).toHaveBeenCalledWith('currentHp', 4);
    });

    it('respects HP lower bounds', async () => {
         // Decrease from 0 to -1 should be disabled and ignore clicks
        await renderWithCharacter({ currentHp: 0 });

        const decBtn = page.getByTestId('hp-decrease');
        await expect.element(decBtn).toBeDisabled();
        expect(mockUpdateField).not.toHaveBeenCalled();
    });

    it('allows typing new HP directly', async () => {
        await renderWithCharacter({ currentHp: 5 });

        const hpInput = page.getByTestId('hp-input');
        // Clear input to force a typed string
        await userEvent.fill(hpInput, '12');

        expect(mockUpdateField).toHaveBeenCalledWith('currentHp', 12);
    });

    it('spawns the Death Modal when HP reaches 0 and handles Kill And Replace', async () => {
        // Render with 1 HP
        const { rerender } = await renderWithCharacter({ currentHp: 1 });

        // Update the mock to return 0 HP
        vi.mocked(CharacterContextModule.useCharacter).mockReturnValue({
            character: {
                id: 'test-char',
                currentHp: 0,
                maxHp: 15,
                omens: 2,
                silver: 50,
                equippedArmor: { currentTier: 1, maxTier: 3 }
            },
            updateField: mockUpdateField,
            updateArmorField: mockUpdateArmorField,
            killAndReplace: mockKillAndReplace,
        } as any);

        // Rerender the context provider which provides useCharacter downwards
        await rerender(
            <BrowserTestProvider>
                <ResourceRow />
            </BrowserTestProvider>
        );

        // The death modal should be open.
        const deathModalBtn = page.getByTestId('death-modal-kill-button');
        await expect.element(deathModalBtn).toBeVisible();

        await userEvent.click(deathModalBtn);
        expect(mockKillAndReplace).toHaveBeenCalledOnce();
    });

    it('allows omens modal interactions', async () => {
        await renderWithCharacter({ omens: 2 });

        const omensBtn = page.getByRole('button', { name: /Omens/i }); // t('omensModal.title') + omens count gives "Omens: 2"
        await userEvent.click(omensBtn);

        // Modal should appear
        const addOmenBtn = page.getByRole('button', { name: /Add Omen/i });
        const useOmenBtn = page.getByRole('button', { name: /Use Omen/i });
        await expect.element(addOmenBtn).toBeVisible();
        await expect.element(useOmenBtn).toBeVisible();

        await userEvent.click(addOmenBtn);
        expect(mockUpdateField).toHaveBeenCalledWith('omens', 3);
    });

    it('updates Silver via typing', async () => {
        await renderWithCharacter({ silver: 45 });

        const silverInput = page.getByTestId('silver-input');
        await userEvent.fill(silverInput, '125');

        expect(mockUpdateField).toHaveBeenCalledWith('silver', 125);
    });

    it('handles armored characters tier boundaries', async () => {
        await renderWithCharacter({ equippedArmor: { currentTier: 1, maxTier: 2 } });

        const increaseTierBtn = page.getByRole('button', { name: /Increase armor tier/i });
        const decreaseTierBtn = page.getByRole('button', { name: /Decrease armor tier/i });

        await expect.element(increaseTierBtn).toBeVisible();
        
        await userEvent.click(increaseTierBtn);
        expect(mockUpdateArmorField).toHaveBeenCalledWith('currentTier', 2);

        await userEvent.click(decreaseTierBtn);
        expect(mockUpdateArmorField).toHaveBeenCalledWith('currentTier', 0);
    });

    it('renders disabled dash for unarmored characters', async () => {
         await renderWithCharacter({ equippedArmor: null });

         // The generic increase/decrease buttons aren't rendered. Just a readonly textbox.
         const increaseTierBtn = page.getByRole('button', { name: /Increase armor tier/i });
         await expect.element(increaseTierBtn).not.toBeInTheDocument();

         const dashInput = page.getByRole('textbox');
         await expect.element(dashInput).toBeVisible();
    });
});
