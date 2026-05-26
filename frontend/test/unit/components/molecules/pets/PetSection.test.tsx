import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import PetSection from '@/components/molecules/pets/PetSection';
import UnitTestProvider from '../../../UnitTestProvider';
import * as petHook from '@/hooks/usePetSection';

vi.mock('@/hooks/usePetSection', () => ({
  usePetSection: vi.fn(),
}));

describe('PetSection Component', () => {
  const mockMarkPipPending = vi.fn();
  const mockIsPipPending = vi.fn().mockReturnValue(false);

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPipPending.mockReturnValue(false);
  });

  it('renders null when there are no pets', async () => {
    vi.mocked(petHook.usePetSection).mockReturnValue({
      petsWithIndices: [],
      hasPendingPipSave: false,
      isPipPending: mockIsPipPending,
      markPipPending: mockMarkPipPending,
    } as any);

    render(
      <UnitTestProvider>
        <PetSection />
      </UnitTestProvider>
    );

    expect(screen.queryByText(/pets/i)).toBeNull();
  });

  it('shows the section label when showLabel is true', async () => {
    vi.mocked(petHook.usePetSection).mockReturnValue({
      petsWithIndices: [
        { item: { name: 'Loyal Hound', key: 'pet.hound', description: 'A good boy', dice: [4] }, equipmentIndex: 3, uses: [false] }
      ],
      hasPendingPipSave: false,
      isPipPending: mockIsPipPending,
      markPipPending: mockMarkPipPending,
    } as any);

    render(
      <UnitTestProvider>
        <PetSection showLabel={true} />
      </UnitTestProvider>
    );

    expect(screen.getByText(/PETS/i)).toBeTruthy();
    expect(screen.getByText('Loyal Hound')).toBeTruthy();
  });

  it('hides the section label when showLabel is false', async () => {
    vi.mocked(petHook.usePetSection).mockReturnValue({
      petsWithIndices: [
        { item: { name: 'Loyal Hound', key: 'pet.hound', description: 'A good boy', dice: [4] }, equipmentIndex: 3, uses: [false] }
      ],
      hasPendingPipSave: false,
      isPipPending: mockIsPipPending,
      markPipPending: mockMarkPipPending,
    } as any);

    render(
      <UnitTestProvider>
        <PetSection showLabel={false} />
      </UnitTestProvider>
    );

    expect(screen.queryByText(/PETS/i)).toBeNull();
    expect(screen.getByText('Loyal Hound')).toBeTruthy();
  });

  it('clicking a pip calls markPipPending with correct indices', async () => {
    vi.mocked(petHook.usePetSection).mockReturnValue({
      petsWithIndices: [
        { item: { name: 'Shadow Cat', key: 'pet.cat', description: 'Sneaky', dice: [6] }, equipmentIndex: 7, uses: [false, false] }
      ],
      hasPendingPipSave: false,
      isPipPending: mockIsPipPending,
      markPipPending: mockMarkPipPending,
    } as any);

    render(
      <UnitTestProvider>
        <PetSection />
      </UnitTestProvider>
    );

    const user = userEvent.setup();
    // PetSection doesn't pass pipTestId to TrackedUseRow, so no data-testid on pips.
    // Use aria-label which is always set by UsePipButton.
    const firstPip = screen.getByRole('button', {
      name: 'Mark hit point filled: Shadow Cat point 1',
      exact: true,
    });
    expect(firstPip).toBeTruthy();

    await user.click(firstPip);

    await waitFor(() => expect(mockMarkPipPending).toHaveBeenCalledWith(7, 0));
  });
});
