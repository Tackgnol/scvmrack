import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import EquippedBar from '@/components/molecules/equipped/EquippedBar';
import UnitTestProvider from '../../../UnitTestProvider';
import * as useEquippedBarHook from '@/hooks/useEquippedBar';

vi.mock('@/hooks/useEquippedBar', () => ({
  useEquippedBar: vi.fn(),
}));

const baseReturn = {
  weaponAnchor: null,
  armorAnchor: null,
  setArmorAnchor: vi.fn(),
  activeWeaponSlot: 0,
  weaponSlotRef: { current: null },
  armorSlotRef: { current: null },
  mainWeapon: null,
  offhandWeapon: null,
  equippedArmor: null,
  equippedWeapons: [null, null] as [null, null],
  inventoryWeapons: [],
  inventoryArmor: [],
  canOpenWeaponSlot0: false,
  canOpenWeaponSlot1: false,
  canOpenArmor: false,
  openWeaponMenu: vi.fn(),
  closeWeaponMenu: vi.fn(),
  closeArmorMenu: vi.fn(),
  selectWeapon: vi.fn(),
  selectArmor: vi.fn(),
  unequipActiveWeapon: vi.fn(),
  unequipCurrentArmor: vi.fn(),
  mainWeaponAmmo: { ammoCount: null, equipmentIndex: null },
  offhandWeaponAmmo: { ammoCount: null, equipmentIndex: null },
  useMainWeaponAmmo: vi.fn(),
  useOffhandWeaponAmmo: vi.fn(),
  resolveAmmo: vi.fn(),
};

describe('EquippedBar Browser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows weapon slot with unarmed when no weapon equipped', async () => {
    vi.mocked(useEquippedBarHook.useEquippedBar).mockReturnValue({
      ...baseReturn,
      mainWeapon: null,
      canOpenWeaponSlot0: false,
    } as any);

    render(
      <UnitTestProvider>
        <EquippedBar />
      </UnitTestProvider>
    );

    expect(screen.getByTestId('equipped-weapon-slot-0')).toBeVisible();
    expect(screen.getByText('Bare handed', { exact: true })).toBeVisible();
  });

  it('shows equipped weapon name and dice', async () => {
    vi.mocked(useEquippedBarHook.useEquippedBar).mockReturnValue({
      ...baseReturn,
      mainWeapon: { key: 'w1', name: 'Rusty Sword', dice: [6] },
      canOpenWeaponSlot0: true,
      mainWeaponAmmo: { ammoCount: null, equipmentIndex: null },
    } as any);

    render(
      <UnitTestProvider>
        <EquippedBar />
      </UnitTestProvider>
    );

    expect(screen.getByTestId('equipped-weapon-slot-0')).toBeVisible();
    expect(screen.getByText('Rusty Sword', { exact: true })).toBeVisible();
    expect(screen.getByText('d6', { exact: true })).toBeVisible();
  });

  it('shows offhand weapon when equipped', async () => {
    vi.mocked(useEquippedBarHook.useEquippedBar).mockReturnValue({
      ...baseReturn,
      mainWeapon: { key: 'w1', name: 'Rusty Sword', dice: [6] },
      offhandWeapon: { key: 'w2', name: 'Rusty Dagger', dice: [4] },
      canOpenWeaponSlot0: true,
      canOpenWeaponSlot1: true,
      mainWeaponAmmo: { ammoCount: null, equipmentIndex: null },
      offhandWeaponAmmo: { ammoCount: null, equipmentIndex: null },
    } as any);

    render(
      <UnitTestProvider>
        <EquippedBar />
      </UnitTestProvider>
    );

    expect(screen.getByTestId('equipped-weapon-slot-0')).toBeVisible();
    expect(screen.getByTestId('equipped-weapon-slot-1')).toBeVisible();
    expect(screen.getByText('Rusty Dagger', { exact: true })).toBeVisible();
  });

  it('shows armor slot with unarmored when no armor equipped', async () => {
    vi.mocked(useEquippedBarHook.useEquippedBar).mockReturnValue({
      ...baseReturn,
      equippedArmor: null,
      canOpenArmor: false,
    } as any);

    render(
      <UnitTestProvider>
        <EquippedBar />
      </UnitTestProvider>
    );

    expect(screen.getByTestId('equipped-armor-slot')).toBeVisible();
    expect(screen.getByText('Birthday suit', { exact: true })).toBeVisible();
  });

  it('shows equipped armor name and dice', async () => {
    vi.mocked(useEquippedBarHook.useEquippedBar).mockReturnValue({
      ...baseReturn,
      equippedArmor: { key: 'a1', name: 'Leather Armor', dice: [4] },
      canOpenArmor: true,
    } as any);

    render(
      <UnitTestProvider>
        <EquippedBar />
      </UnitTestProvider>
    );

    expect(screen.getByTestId('equipped-armor-slot')).toBeVisible();
    expect(screen.getByText('Leather Armor', { exact: true })).toBeVisible();
    expect(screen.getByText('-d4', { exact: true })).toBeVisible();
  });

  it('shows ammo count when weapon has ammo', async () => {
    vi.mocked(useEquippedBarHook.useEquippedBar).mockReturnValue({
      ...baseReturn,
      mainWeapon: { key: 'w1', name: 'Crossbow', dice: [8] },
      canOpenWeaponSlot0: true,
      mainWeaponAmmo: { ammoCount: 12, equipmentIndex: 5 },
    } as any);

    render(
      <UnitTestProvider>
        <EquippedBar />
      </UnitTestProvider>
    );

    expect(screen.getByTestId('equipped-weapon-slot-0-ammo')).toBeVisible();
    expect(screen.getByText('12', { exact: true })).toBeVisible();
  });
});
