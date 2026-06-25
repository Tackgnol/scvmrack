import { render } from 'vitest-browser-react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { OnHandSection } from '@/components/organisms/OnHandSection';
import BrowserTestProvider from '../BrowserTestProvider';
import * as onHandHook from '@/hooks/useOnHandSection';
import * as CharacterContextModule from '@/CharacterContext/CharacterContext';

vi.mock('@/CharacterContext/CharacterContext', () => ({
  useCharacter: vi.fn(),
}));

vi.mock('@/hooks/useOnHandSection', () => ({
  useOnHandSection: vi.fn(),
}));

vi.mock('@/components/molecules/ItemAutocomplete', () => ({
  default: (props: any) => <button data-testid="mock-autocomplete" onClick={() => props.onSelect({ name: 'New Item' })}>Autosuggest</button>
}));

describe('OnHandSection Component', () => {
    const mockSetEditingGroup = vi.fn();
    const mockHandleAddItem = vi.fn();
    const mockHandleUpdate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(CharacterContextModule.useCharacter).mockReturnValue({
            character: { id: 'test', silver: 10 },
            updateField: vi.fn(),
            equipWeapon: vi.fn(),
            equipArmor: vi.fn(),
        } as any);

        vi.mocked(onHandHook.useOnHandSection).mockReturnValue({
            aggregated: [{ item: { id: 1, name: 'Torch', description: '' }, indices: [0], quantity: 1 }],
            loadingItems: [{ id: 2, name: 'LoadingThing' } as any],
            editingGroup: null,
            setEditingGroup: mockSetEditingGroup,
            handleAddItem: mockHandleAddItem,
            handleAdjustQuantity: vi.fn(),
            handleUpdate: mockHandleUpdate,
            handleDelete: vi.fn(),
            handleMove: vi.fn(),
        } as any);
    });

    it('renders slots, title, and the stable add controls', async () => {
        await render(
            <BrowserTestProvider>
                <OnHandSection />
            </BrowserTestProvider>
        );

        await expect.element(page.getByText('ON HAND', { exact: false })).toBeVisible();
        await expect.element(page.getByText('Torch')).toBeVisible();
        await expect.element(page.getByTestId('mock-autocomplete')).toBeVisible();
    });

    it('triggers autocomplete add item', async () => {
        await render(
            <BrowserTestProvider>
                <OnHandSection />
            </BrowserTestProvider>
        );

        await userEvent.click(page.getByTestId('mock-autocomplete'));
        await expect.poll(() => mockHandleAddItem).toHaveBeenCalledWith({ name: 'New Item' });
    });

    it('interacts with modal correctly via opened group', async () => {
        const group = { item: { id: 1, name: 'Torch', tags: [] }, indices: [0], quantity: 1 };
        vi.mocked(onHandHook.useOnHandSection).mockReturnValue({
            aggregated: [group as any],
            loadingItems: [],
            editingGroup: group, // Modal opened
            setEditingGroup: mockSetEditingGroup,
            handleAddItem: mockHandleAddItem,
            handleAdjustQuantity: vi.fn(),
            handleUpdate: mockHandleUpdate,
            handleDelete: vi.fn(),
            handleMove: vi.fn(),
        } as any);

        await render(
            <BrowserTestProvider>
                <OnHandSection />
            </BrowserTestProvider>
        );

        // Modal should be visible
        await expect.element(page.getByRole('dialog')).toBeVisible();

        // Close it
        await userEvent.click(page.getByRole('button', { name: 'Cancel' }));
        await expect.poll(() => mockSetEditingGroup).toHaveBeenCalledWith(null);

        // Update it
        // The modal has Name text box. 
        const nameBox = page.getByRole('textbox', { name: /item name/i });
        await userEvent.fill(nameBox, 'Updated Torch');
        await userEvent.click(page.getByRole('button', { name: /Save/i }));
        
        await expect.poll(() => mockHandleUpdate).toHaveBeenCalledWith([0], expect.objectContaining({ name: 'Updated Torch' }));
    });
});
