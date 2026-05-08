import { render } from 'vitest-browser-react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { EquipmentSection } from '@/components/organisms/EquipmentSection';
import BrowserTestProvider from '../BrowserTestProvider';
import * as CharacterContextModule from '@/CharacterContext/CharacterContext';

vi.mock('@/CharacterContext/CharacterContext', () => ({
  useCharacter: vi.fn(),
}));

// We mock ItemAutocomplete to just act as a button we can click on, avoiding external HTTP hook integrations cleanly.
vi.mock('@/components/molecules/ItemAutocomplete', () => ({
  default: (props: any) => <button onClick={() => props.onSelect({ name: 'AutoSword' })}>MockAutocomplete</button>
}));

describe('EquipmentSection Component', () => {
  const mockUpdateWeaponField = vi.fn();
  const mockUpdateArmorField = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(CharacterContextModule.useCharacter).mockReturnValue({
      character: {
        id: 'test-char',
        equippedWeapons: [
           { name: 'Sword', description: 'Sharp' },
           { name: '', description: '' }
        ],
        equippedArmor: { name: 'Leather', description: 'Tough' },
      },
      updateWeaponField: mockUpdateWeaponField,
      updateArmorField: mockUpdateArmorField,
    } as any);
  });

  it('renders equipped gear slots clearly', async () => {
    await render(
      <BrowserTestProvider>
        <EquipmentSection />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('Sword')).toBeVisible();
    await expect.element(page.getByText('Sharp')).toBeVisible();
    await expect.element(page.getByText('Leather')).toBeVisible();
    await expect.element(page.getByText('Tough')).toBeVisible();
    await expect.element(page.getByText('Empty Slot')).toBeVisible(); // Offhand
  });

  it('opens modal and saves edits cleanly to a weapon slot', async () => {
    await render(
      <BrowserTestProvider>
        <EquipmentSection />
      </BrowserTestProvider>
    );

    await userEvent.click(page.getByText('Sword'));

    const nameInput = page.getByRole('textbox', { name: 'Name' });
    await userEvent.fill(nameInput, 'Greatsword');

    const saveBtn = page.getByRole('button', { name: 'Save' });
    await userEvent.click(saveBtn);

    expect(mockUpdateWeaponField).toHaveBeenCalledWith(0, 'name', 'Greatsword');
  });

  it('opens modal and saves edits cleanly to armor slot', async () => {
    await render(
      <BrowserTestProvider>
        <EquipmentSection />
      </BrowserTestProvider>
    );

    await userEvent.click(page.getByText('Leather'));

    const descInput = page.getByRole('textbox', { name: 'Description / Damage' });
    await userEvent.fill(descInput, 'Very Tough');

    const saveBtn = page.getByRole('button', { name: 'Save' });
    await userEvent.click(saveBtn);

    expect(mockUpdateArmorField).toHaveBeenCalledWith('description', 'Very Tough');
  });

  it('incorporates auto-complete additions smoothly to default weapon slots', async () => {
    await render(
      <BrowserTestProvider>
        <EquipmentSection />
      </BrowserTestProvider>
    );

    await userEvent.click(page.getByRole('button', { name: 'MockAutocomplete' }));
    
    // Weapon[0] is strictly selected because it already exists... wait, it overwrites slot 0 if weapon 1 is empty?
    // According to handleAutocompleteSelect: 
    // const w0Empty = ... const w1Empty = ... 
    // if (!w0Empty && w1Empty) targetIndex = 1; else 0
    expect(mockUpdateWeaponField).toHaveBeenCalledWith(1, 'name', 'AutoSword');
  });

});
