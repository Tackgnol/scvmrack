import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import { useState } from 'react';
import ResourceRow from '@/components/molecules/ResourceRow';
import UnitTestProvider from '../../UnitTestProvider';
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

  const renderWithCharacter = (
    charOverrides: any,
    options: { stateful?: boolean } = {}
  ) => {
    const initialCharacter = {
      id: 'test-char',
      currentHp: 10,
      maxHp: 15,
      omens: 2,
      silver: 50,
      equippedArmor: { currentTier: 1, maxTier: 3 },
      ...charOverrides,
    };

    if (!options.stateful) {
      vi.mocked(CharacterContextModule.useCharacter).mockReturnValue({
        character: initialCharacter,
        updateField: mockUpdateField,
        updateArmorField: mockUpdateArmorField,
        killAndReplace: mockKillAndReplace,
      } as any);

      return render(
        <UnitTestProvider>
          <ResourceRow />
        </UnitTestProvider>
      );
    }

    function useMockCharacter() {
      const [character, setCharacter] = useState<any>(initialCharacter);

      return {
        character,
        updateField: (field: string, value: unknown) => {
          mockUpdateField(field, value);
          setCharacter((previous: any) => ({
            ...previous,
            [field]:
              value === 0 && (field === 'currentHp' || field === 'silver')
                ? ''
                : value,
          }));
        },
        updateArmorField: (field: string, value: unknown) => {
          mockUpdateArmorField(field, value);
          setCharacter((previous: any) => ({
            ...previous,
            equippedArmor: previous.equippedArmor
              ? { ...previous.equippedArmor, [field]: value }
              : previous.equippedArmor,
          }));
        },
        killAndReplace: mockKillAndReplace,
      } as any;
    }

    vi.mocked(CharacterContextModule.useCharacter).mockImplementation(
      useMockCharacter
    );

    return render(
      <UnitTestProvider>
        <ResourceRow />
      </UnitTestProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles HP increases and decreases', async () => {
    renderWithCharacter({ currentHp: 5 });

    const user = userEvent.setup();
    const incBtn = screen.getByTestId('hp-increase');
    const decBtn = screen.getByTestId('hp-decrease');

    await user.click(incBtn);
    expect(mockUpdateField).toHaveBeenCalledWith('currentHp', 6);

    await user.click(decBtn);
    expect(mockUpdateField).toHaveBeenCalledWith('currentHp', 4);
  });

  it('respects HP lower bounds', async () => {
    // Decrease from 0 to -1 should be disabled and ignore clicks
    renderWithCharacter({ currentHp: 0 });

    const decBtn = screen.getByTestId('hp-decrease') as HTMLButtonElement;
    expect(decBtn.disabled).toBe(true);
    expect(mockUpdateField).not.toHaveBeenCalled();
  });

  it('allows typing new HP directly', async () => {
    renderWithCharacter({ currentHp: 5 }, { stateful: true });

    const user = userEvent.setup();
    const hpInput = screen.getByTestId('hp-input');
    await user.clear(hpInput);
    await user.type(hpInput, '12');

    expect(mockUpdateField).toHaveBeenCalledWith('currentHp', 12);
  });

  it('spawns the Death Modal when HP reaches 0 and handles Kill And Replace', async () => {
    const { rerender } = renderWithCharacter({ currentHp: 1 });
    const user = userEvent.setup();

    vi.mocked(CharacterContextModule.useCharacter).mockReturnValue({
      character: {
        id: 'test-char',
        currentHp: 0,
        maxHp: 15,
        omens: 2,
        silver: 50,
        equippedArmor: { currentTier: 1, maxTier: 3 },
      },
      updateField: mockUpdateField,
      updateArmorField: mockUpdateArmorField,
      killAndReplace: mockKillAndReplace,
    } as any);

    rerender(
      <UnitTestProvider>
        <ResourceRow />
      </UnitTestProvider>
    );

    const deathModalBtn = await screen.findByTestId('death-modal-kill-button');
    expect(deathModalBtn).toBeTruthy();

    await user.click(deathModalBtn);
    expect(mockKillAndReplace).toHaveBeenCalledOnce();
  });

  it('allows omens modal interactions', async () => {
    renderWithCharacter({ omens: 2 });

    const user = userEvent.setup();
    const omensBtn = screen.getByRole('button', { name: /Omens/i });
    await user.click(omensBtn);

    const addOmenBtn = await screen.findByRole('button', { name: /Add Omen/i });
    const useOmenBtn = screen.getByRole('button', { name: /Use Omen/i });
    expect(addOmenBtn).toBeTruthy();
    expect(useOmenBtn).toBeTruthy();

    await user.click(addOmenBtn);
    expect(mockUpdateField).toHaveBeenCalledWith('omens', 3);
  });

  it('updates Silver via typing', async () => {
    renderWithCharacter({ silver: 45 }, { stateful: true });

    const user = userEvent.setup();
    const silverInput = screen.getByTestId('silver-input');
    await user.clear(silverInput);
    await user.type(silverInput, '125');

    expect(mockUpdateField).toHaveBeenCalledWith('silver', 125);
  });

  it('handles armored characters tier boundaries', async () => {
    renderWithCharacter({ equippedArmor: { currentTier: 1, maxTier: 2 } });

    const user = userEvent.setup();
    const increaseTierBtn = screen.getByRole('button', {
      name: /Increase armor tier/i,
    });
    const decreaseTierBtn = screen.getByRole('button', {
      name: /Decrease armor tier/i,
    });

    expect(increaseTierBtn).toBeTruthy();

    await user.click(increaseTierBtn);
    expect(mockUpdateArmorField).toHaveBeenCalledWith('currentTier', 2);

    await user.click(decreaseTierBtn);
    expect(mockUpdateArmorField).toHaveBeenCalledWith('currentTier', 0);
  });

  it('renders disabled dash for unarmored characters', async () => {
    renderWithCharacter({ equippedArmor: null });

    const increaseTierBtn = screen.queryByRole('button', {
      name: /Increase armor tier/i,
    });
    expect(increaseTierBtn).toBeNull();

    const dashInput = screen.getByRole('textbox');
    expect(dashInput).toBeTruthy();
  });
});
