import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { CatalogGrantPicker } from '@/components/organisms/class-creator/AbilityGrants/CatalogGrantPicker';
import * as itemSearch from '@/hooks/useEquipmentSearch';
import BrowserTestProvider from '../BrowserTestProvider';

vi.mock('@/hooks/useEquipmentSearch', () => ({ useItemSearch: vi.fn() }));

describe('CatalogGrantPicker', () => {
  it('shows a fuzzy catalog match and grants it with the keyboard', async () => {
    const search = vi.fn();
    const onSelect = vi.fn();
    vi.mocked(itemSearch.useItemSearch).mockReturnValue({
      results: [{ id: 1, key: 'weapons.brownScimitar', name: 'Brown Scimitar', itemType: 'weapon', tags: [] }],
      isLoading: false,
      error: null,
      search,
      clearResults: vi.fn(),
    });

    await render(
      <BrowserTestProvider>
        <CatalogGrantPicker
          id="grant-item"
          label="Grants an item"
          pinnedOptions={[]}
          disabledPinnedKeys={[]}
          pet={false}
          onSelect={onSelect}
          onClear={vi.fn()}
        />
      </BrowserTestProvider>,
    );

    const input = page.getByRole('combobox', { name: 'Grants an item' });
    await userEvent.fill(input, 'brwn scimtr');
    await expect.poll(() => search).toHaveBeenCalledWith('brwn scimtr');
    await expect.element(page.getByRole('option', { name: 'Brown Scimitar' })).toBeVisible();
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect.poll(() => onSelect).toHaveBeenCalledWith('weapons.brownScimitar');
  });

  it('puts this class first and Escape closes without changing the grant', async () => {
    const onSelect = vi.fn();
    const onClear = vi.fn();
    vi.mocked(itemSearch.useItemSearch).mockReturnValue({
      results: [{ id: 1, key: 'weapons.brownScimitar', name: 'Brown Scimitar', itemType: 'weapon', tags: [] }],
      isLoading: false,
      error: null,
      search: vi.fn(),
      clearResults: vi.fn(),
    });

    await render(
      <BrowserTestProvider>
        <CatalogGrantPicker
          id="grant-item"
          label="Grants an item"
          pinnedOptions={[{ id: -1, key: 'new:own', name: 'Own Scimitar', itemType: 'weapon', tags: [] }]}
          disabledPinnedKeys={[]}
          pet={false}
          onSelect={onSelect}
          onClear={onClear}
        />
      </BrowserTestProvider>,
    );

    const input = page.getByRole('combobox', { name: 'Grants an item' });
    await userEvent.fill(input, 'scim');
    await expect.element(page.getByText('This class')).toBeVisible();
    await expect.element(page.getByRole('option').nth(0)).toHaveTextContent('Own Scimitar');
    await expect.element(page.getByRole('option').nth(1)).toHaveTextContent('Brown Scimitar');
    await userEvent.keyboard('{Escape}');
    await expect.element(input).toHaveAttribute('aria-expanded', 'false');
    expect(onSelect).not.toHaveBeenCalled();
    expect(onClear).not.toHaveBeenCalled();
  });

  it('keeps weapons out of the pet grant field', async () => {
    vi.mocked(itemSearch.useItemSearch).mockReturnValue({
      results: [
        { id: 1, key: 'pets.rat', name: 'Rat Familiar', itemType: 'pet', tags: [] },
        { id: 2, key: 'weapons.ratBlade', name: 'Rat Blade', itemType: 'weapon', tags: [] },
      ],
      isLoading: false,
      error: null,
      search: vi.fn(),
      clearResults: vi.fn(),
    });

    await render(
      <BrowserTestProvider>
        <CatalogGrantPicker
          id="grant-pet"
          label="Grants a pet"
          pinnedOptions={[{ id: -1, key: 'new:pet', name: 'Rat Companion', itemType: 'pet', tags: [] }]}
          disabledPinnedKeys={[]}
          pet
          onSelect={vi.fn()}
          onClear={vi.fn()}
        />
      </BrowserTestProvider>,
    );

    await userEvent.fill(page.getByRole('combobox', { name: 'Grants a pet' }), 'rat');
    await expect.element(page.getByRole('option', { name: 'Rat Companion' })).toBeVisible();
    await expect.element(page.getByRole('option', { name: 'Rat Familiar' })).toBeVisible();
    await expect.element(page.getByRole('option', { name: 'Rat Blade' })).not.toBeInTheDocument();
  });
});
