import { render } from 'vitest-browser-react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import PetSection from '@/components/molecules/pets/PetSection';
import BrowserTestProvider from '../../BrowserTestProvider';
import * as petHook from '@/hooks/usePetSection';
import i18n, { loadLanguage } from '@/i18n';

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

  it('announces pet hit point actions in Polish', async () => {
    await loadLanguage('pl');
    await i18n.changeLanguage('pl');
    vi.mocked(petHook.usePetSection).mockReturnValue({
      petsWithIndices: [{ item: { name: 'Jastrząb', key: 'pet.hawk' }, equipmentIndex: 0, uses: [false, true] }],
      hasPendingPipSave: false, isPipPending: mockIsPipPending, markPipPending: mockMarkPipPending,
    } as ReturnType<typeof petHook.usePetSection>);
    await render(<BrowserTestProvider><PetSection /></BrowserTestProvider>);
    await expect.element(page.getByRole('button', { name: 'Zaznacz punkt życia jako pełny: Jastrząb, punkt 1' })).toBeVisible();
    await expect.element(page.getByRole('button', { name: 'Zaznacz punkt życia jako pusty: Jastrząb, punkt 2' })).toBeVisible();
  });

  it('renders null when there are no pets', async () => {
    vi.mocked(petHook.usePetSection).mockReturnValue({
      petsWithIndices: [],
      hasPendingPipSave: false,
      isPipPending: mockIsPipPending,
      markPipPending: mockMarkPipPending,
    } as any);

    await render(
      <BrowserTestProvider>
        <PetSection />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText(/pets/i)).not.toBeInTheDocument();
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

    await render(
      <BrowserTestProvider>
        <PetSection showLabel={true} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText(/PETS/i)).toBeVisible();
    await expect.element(page.getByText('Loyal Hound')).toBeVisible();
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

    await render(
      <BrowserTestProvider>
        <PetSection showLabel={false} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText(/PETS/i)).not.toBeInTheDocument();
    await expect.element(page.getByText('Loyal Hound')).toBeVisible();
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

    await render(
      <BrowserTestProvider>
        <PetSection />
      </BrowserTestProvider>
    );

    // PetSection doesn't pass pipTestId to TrackedUseRow, so no data-testid on pips.
    // Use aria-label which is always set by UsePipButton.
    const firstPip = page.getByRole('button', {
      name: 'Mark hit point filled: Shadow Cat point 1',
      exact: true,
    });
    await expect.element(firstPip).toBeVisible();

    await userEvent.click(firstPip);

    await expect.poll(() => mockMarkPipPending).toHaveBeenCalledWith(7, 0);
  });
});
