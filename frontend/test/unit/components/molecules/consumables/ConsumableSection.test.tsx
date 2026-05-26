import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import ConsumableSection from '@/components/molecules/consumables/ConsumableSection';
import UnitTestProvider from '../../../UnitTestProvider';
import * as consumableHook from '@/hooks/useConsumableSection';

vi.mock('@/hooks/useConsumableSection', () => ({
  useConsumableSection: vi.fn(),
}));

describe('ConsumableSection Component', () => {
  const mockMarkPipPending = vi.fn();
  const mockIsPipPending = vi.fn().mockReturnValue(false);

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPipPending.mockReturnValue(false);
  });

  it('renders null when there are no consumables', async () => {
    vi.mocked(consumableHook.useConsumableSection).mockReturnValue({
      consumablesWithIndices: [],
      hasPendingPipSave: false,
      isPipPending: mockIsPipPending,
      markPipPending: mockMarkPipPending,
    } as any);

    render(
      <UnitTestProvider>
        <ConsumableSection />
      </UnitTestProvider>
    );

    expect(screen.queryByText(/consumables/i)).not.toBeInTheDocument();
  });

  it('shows the section label when showLabel is true', async () => {
    vi.mocked(consumableHook.useConsumableSection).mockReturnValue({
      consumablesWithIndices: [
        {
          item: {
            name: 'Medicine Chest',
            key: 'equipment.medicine-chest',
            description: 'Stops bleeding',
          },
          equipmentIndex: 3,
          uses: [false, false],
        },
      ],
      hasPendingPipSave: false,
      isPipPending: mockIsPipPending,
      markPipPending: mockMarkPipPending,
    } as any);

    render(
      <UnitTestProvider>
        <ConsumableSection showLabel={true} />
      </UnitTestProvider>
    );

    expect(screen.getByText(/CONSUMABLES/i)).toBeVisible();
    expect(screen.getByText('Medicine Chest')).toBeVisible();
  });

  it('hides the section label when showLabel is false', async () => {
    vi.mocked(consumableHook.useConsumableSection).mockReturnValue({
      consumablesWithIndices: [
        {
          item: {
            name: 'Lantern',
            key: 'equipment.lantern',
            description: 'With oil',
          },
          equipmentIndex: 1,
          uses: [false, false, false],
        },
      ],
      hasPendingPipSave: false,
      isPipPending: mockIsPipPending,
      markPipPending: mockMarkPipPending,
    } as any);

    render(
      <UnitTestProvider>
        <ConsumableSection showLabel={false} />
      </UnitTestProvider>
    );

    expect(screen.queryByText(/CONSUMABLES/i)).not.toBeInTheDocument();
    expect(screen.getByText('Lantern')).toBeVisible();
  });

  it('clicking a pip calls markPipPending with correct indices', async () => {
    vi.mocked(consumableHook.useConsumableSection).mockReturnValue({
      consumablesWithIndices: [
        {
          item: {
            name: 'Life Elixir',
            key: 'equipment.life-elixir',
            description: 'Heals d6 HP',
          },
          equipmentIndex: 6,
          uses: [false, false],
        },
      ],
      hasPendingPipSave: false,
      isPipPending: mockIsPipPending,
      markPipPending: mockMarkPipPending,
    } as any);

    render(
      <UnitTestProvider>
        <ConsumableSection />
      </UnitTestProvider>
    );
    const user = userEvent.setup();

    const firstPip = screen.getByRole('button', {
      name: 'Mark used: Life Elixir use 1',
      exact: true,
    });
    expect(firstPip).toBeVisible();

    await user.click(firstPip);

    await waitFor(() => expect(mockMarkPipPending).toHaveBeenCalledWith(6, 0));
  });
});
