import { render } from 'vitest-browser-react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { StorageSection } from '@/components/organisms/StorageSection';
import BrowserTestProvider from '../BrowserTestProvider';
import * as storageHook from '@/hooks/useStorageSection';
import * as CharacterContextModule from '@/CharacterContext/CharacterContext';

vi.mock('@/CharacterContext/CharacterContext', () => ({
  useCharacter: vi.fn(),
}));

vi.mock('@/hooks/useStorageSection', () => ({
  useStorageSection: vi.fn(),
}));

describe('StorageSection Component', () => {
    const mockSetEditingGroup = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(CharacterContextModule.useCharacter).mockReturnValue({
            character: { id: 'test', silver: 10 },
            updateField: vi.fn(),
            equipWeapon: vi.fn(),
            equipArmor: vi.fn(),
        } as any);

        vi.mocked(storageHook.useStorageSection).mockReturnValue({
            aggregated: [{ item: { id: 3, name: 'Stored Rope', tags: [] }, indices: [0], quantity: 1 }],
            editingGroup: null,
            setEditingGroup: mockSetEditingGroup,
            handleAdjustQuantity: vi.fn(),
            handleUpdate: vi.fn(),
            handleDelete: vi.fn(),
            handleMove: vi.fn(),
        } as any);
    });

    it('returns null when no items are available', async () => {
         vi.mocked(storageHook.useStorageSection).mockReturnValue({
            aggregated: [],
            editingGroup: null,
         } as any);

         await render(
            <BrowserTestProvider>
                <StorageSection />
            </BrowserTestProvider>
         );

         await expect.element(page.getByText('STORED ITEMS', { exact: false })).not.toBeInTheDocument();
    });

    it('renders items grouping and modals seamlessly', async () => {
        await render(
            <BrowserTestProvider>
                <StorageSection />
            </BrowserTestProvider>
        );

        await expect.element(page.getByText('STORED ITEMS', { exact: false })).toBeVisible();
        await expect.element(page.getByText('Stored Rope')).toBeVisible();

        // Click slot triggers editor opening
        await userEvent.click(page.getByText('Stored Rope'));
        await expect.poll(() => mockSetEditingGroup).toHaveBeenCalledWith({ item: { id: 3, name: 'Stored Rope', tags: [] }, indices: [0], quantity: 1 });
    });
});
