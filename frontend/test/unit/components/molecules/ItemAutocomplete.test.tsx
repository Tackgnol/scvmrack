import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import ItemAutocomplete from '@/components/molecules/ItemAutocomplete';
import UnitTestProvider from '../../UnitTestProvider';
import * as itemSearch from '@/hooks/useEquipmentSearch';

vi.mock('@/hooks/useEquipmentSearch', () => ({
    useItemSearch: vi.fn(),
}));

describe('ItemAutocomplete Component', () => {
    const mockSearch = vi.fn();
    const mockClearResults = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(itemSearch.useItemSearch).mockReturnValue({
            results: [],
            isLoading: false,
            search: mockSearch,
            clearResults: mockClearResults,
        } as any);
    });

    it('does not search on <2 chars typing', async () => {
        render(
            <UnitTestProvider>
                <ItemAutocomplete onSelect={vi.fn()} />
            </UnitTestProvider>
        );

        const user = userEvent.setup();
        const input = screen.getByRole('combobox', { name: /add item/i });
        await user.type(input, 'a');

        await waitFor(() => expect(mockClearResults).toHaveBeenCalled());
        expect(mockSearch).not.toHaveBeenCalled();
    });

    it('searches when >=2 chars are typed', async () => {
        render(
            <UnitTestProvider>
                <ItemAutocomplete onSelect={vi.fn()} />
            </UnitTestProvider>
        );

        const user = userEvent.setup();
        const input = screen.getByRole('combobox', { name: /add item/i });
        await user.type(input, 'sw');

        await waitFor(() => expect(mockSearch).toHaveBeenCalledWith('sw'));
    });

    it('supports keyboard navigation, preserves focus, and clears the combobox after selecting an item', async () => {
        const mockItem = { id: 1, name: 'Sword', itemType: 'weapon' };
        const otherItem = { id: 2, name: 'Spear', itemType: 'weapon' };
        vi.mocked(itemSearch.useItemSearch).mockReturnValue({
            results: [mockItem as any, otherItem as any],
            isLoading: false,
            search: mockSearch,
            clearResults: mockClearResults,
        } as any);

        const mockOnSelect = vi.fn();

        render(
            <UnitTestProvider>
                <ItemAutocomplete onSelect={mockOnSelect} />
            </UnitTestProvider>
        );

        const user = userEvent.setup();
        const input = screen.getByRole('combobox', { name: /add item/i }) as HTMLInputElement;
        await user.type(input, 'swo');

        const swordOption = screen.getByRole('option', { name: /sword/i });
        expect(swordOption).toBeTruthy();
        expect(input.getAttribute('aria-expanded')).toBe('true');

        await user.keyboard('{ArrowDown}');
        await user.keyboard('{Enter}');

        await waitFor(() => expect(mockOnSelect).toHaveBeenCalledWith(mockItem));
        await waitFor(() => expect(mockClearResults).toHaveBeenCalled());
        expect(input.value).toBe('');
        expect(input.getAttribute('aria-expanded')).toBe('false');
        expect(document.activeElement).toBe(input);
    });
});
