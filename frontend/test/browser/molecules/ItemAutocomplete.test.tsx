import { render } from 'vitest-browser-react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import ItemAutocomplete from '@/components/molecules/ItemAutocomplete';
import BrowserTestProvider from '../BrowserTestProvider';
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
        await render(
            <BrowserTestProvider>
                <ItemAutocomplete onSelect={vi.fn()} />
            </BrowserTestProvider>
        );

        const input = page.getByRole('combobox', { name: /add item/i });
        await userEvent.fill(input, 'a');

        await expect.poll(() => mockClearResults).toHaveBeenCalled();
        expect(mockSearch).not.toHaveBeenCalled();
    });

    it('searches when >=2 chars are typed', async () => {
        await render(
            <BrowserTestProvider>
                <ItemAutocomplete onSelect={vi.fn()} />
            </BrowserTestProvider>
        );

        const input = page.getByRole('combobox', { name: /add item/i });
        await userEvent.fill(input, 'sw');

        await expect.poll(() => mockSearch).toHaveBeenCalledWith('sw');
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

        await render(
            <BrowserTestProvider>
                <ItemAutocomplete onSelect={mockOnSelect} />
            </BrowserTestProvider>
        );

        const input = page.getByRole('combobox', { name: /add item/i });
        await userEvent.fill(input, 'swo');

        const swordOption = page.getByRole('option', { name: /sword/i });
        await expect.element(swordOption).toBeVisible();
        await expect.element(input).toHaveAttribute('aria-expanded', 'true');

        await userEvent.keyboard('{ArrowDown}');
        await userEvent.keyboard('{Enter}');

        await expect.poll(() => mockOnSelect).toHaveBeenCalledWith(mockItem);
        await expect.poll(() => mockClearResults).toHaveBeenCalled();
        await expect.element(input).toHaveValue('');
        await expect.element(input).toHaveAttribute('aria-expanded', 'false');
        await expect.element(input).toHaveFocus();
    });

    it('keeps the selected item in a busy input until async add finishes', async () => {
        const mockItem = { id: 1, name: 'Sword', itemType: 'weapon' };
        vi.mocked(itemSearch.useItemSearch).mockReturnValue({
            results: [mockItem as any],
            isLoading: false,
            search: mockSearch,
            clearResults: mockClearResults,
        } as any);

        let resolveSelect = () => {};
        const mockOnSelect = vi.fn(
            () => new Promise<void>((resolve) => {
                resolveSelect = resolve;
            }),
        );

        await render(
            <BrowserTestProvider>
                <ItemAutocomplete onSelect={mockOnSelect} />
            </BrowserTestProvider>
        );

        const input = page.getByRole('combobox', { name: /add item/i });
        await userEvent.fill(input, 'swo');
        await userEvent.click(page.getByRole('option', { name: /sword/i }));

        await expect.poll(() => mockOnSelect).toHaveBeenCalledWith(mockItem);
        await expect.element(input).toHaveValue('Sword');
        await expect.element(input).toHaveAttribute('aria-busy', 'true');
        await expect.element(page.getByText(/adding sword/i)).toBeVisible();

        resolveSelect();

        await expect.element(input).toHaveValue('');
        await expect.element(input).not.toHaveAttribute('aria-busy', 'true');
    });
});
