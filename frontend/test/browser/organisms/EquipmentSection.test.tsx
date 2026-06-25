import { render } from 'vitest-browser-react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { EquipmentSection } from '@/components/organisms/EquipmentSection';
import BrowserTestProvider from '../BrowserTestProvider';
import * as CharacterContextModule from '@/CharacterContext/CharacterContext';
import i18n, { loadLanguage } from '@/i18n';

vi.mock('@/CharacterContext/CharacterContext', () => ({
  useCharacter: vi.fn(),
}));

// We mock ItemAutocomplete to just act as a button we can click on, avoiding external HTTP hook integrations cleanly.
vi.mock('@/components/molecules/ItemAutocomplete', () => ({
  default: (props: any) => (
    <>
      <input aria-label="mock equipment search" placeholder={props.placeholder} />
      <button onClick={() => props.onSelect({ name: 'AutoSword' })}>MockAutocomplete</button>
    </>
  ),
}));

describe('EquipmentSection Component', () => {
  const mockUpdateWeaponField = vi.fn();
  const mockUpdateArmorField = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage('en');
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
    await expect.element(page.getByText('Currently empty')).toBeVisible(); // Offhand
  });

  it('translates modal controls and search copy in Polish', async () => {
    await loadLanguage('pl');
    await i18n.changeLanguage('pl');
    await render(
      <BrowserTestProvider>
        <EquipmentSection />
      </BrowserTestProvider>
    );

    await expect.element(page.getByPlaceholder('Szukaj wyposażenia...')).toBeVisible();
    await userEvent.click(page.getByRole('button', { name: /Sword/i }));

    await expect.element(page.getByRole('dialog', { name: /edytuj: broń/i })).toBeVisible();
    await expect.element(page.getByRole('textbox', { name: /nazwa przedmiotu/i })).toBeVisible();
    await expect.element(page.getByRole('textbox', { name: /opis \/ obrażenia/i })).toBeVisible();
    await expect.element(page.getByRole('textbox', { name: /komentarze \/ notatki/i })).toBeVisible();
    await expect.element(page.getByPlaceholder('Dodaj własne notatki...')).toBeVisible();
    await expect.element(page.getByRole('button', { name: /anuluj/i })).toBeVisible();
    await expect.element(page.getByRole('button', { name: /zapisz/i })).toBeVisible();
  });

  it('opens modal and saves edits cleanly to a weapon slot', async () => {
    await render(
      <BrowserTestProvider>
        <EquipmentSection />
      </BrowserTestProvider>
    );

    await userEvent.click(page.getByRole('button', { name: /Sword/i }));

    const nameInput = page.getByRole('textbox', { name: 'Item Name' });
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

    await userEvent.click(page.getByRole('button', { name: /Leather/i }));

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
