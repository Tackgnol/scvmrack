import { render } from 'vitest-browser-react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import ConsumableSection from '@/components/molecules/consumables/ConsumableSection';
import BrowserTestProvider from '../../BrowserTestProvider';
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

    await render(
      <BrowserTestProvider>
        <ConsumableSection />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText(/consumables/i)).not.toBeInTheDocument();
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

    await render(
      <BrowserTestProvider>
        <ConsumableSection showLabel={true} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText(/CONSUMABLES/i)).toBeVisible();
    await expect.element(page.getByText('Medicine Chest')).toBeVisible();
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

    await render(
      <BrowserTestProvider>
        <ConsumableSection showLabel={false} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText(/CONSUMABLES/i)).not.toBeInTheDocument();
    await expect.element(page.getByText('Lantern')).toBeVisible();
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

    await render(
      <BrowserTestProvider>
        <ConsumableSection />
      </BrowserTestProvider>
    );

    const firstPip = page.getByRole('button', {
      name: 'Mark used: Life Elixir use 1',
      exact: true,
    });
    await expect.element(firstPip).toBeVisible();

    await userEvent.click(firstPip);

    await expect.poll(() => mockMarkPipPending).toHaveBeenCalledWith(6, 0);
  });
});
