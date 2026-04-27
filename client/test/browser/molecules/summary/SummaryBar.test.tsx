import { render } from 'vitest-browser-react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import SummaryBar from '@/components/molecules/summary/SummaryBar';
import BrowserTestProvider from '../../BrowserTestProvider';
import * as CharacterContextModule from '@/CharacterContext/CharacterContext';

vi.mock('@/CharacterContext/CharacterContext', () => ({
  useCharacter: vi.fn(),
}));

// AnimatedNumber uses the motion library — render as plain value in tests
vi.mock('@/components/atoms/AnimatedNumber', () => ({
  default: ({ value }: { value: number }) => <span>{value}</span>,
}));

// SummaryDetailPopper contains a ClickAwayListener that would catch the same
// click that opens it (event bubbles to document) and immediately call closeNow(),
// resetting aria-expanded back to false in the same tick. Mock it out so the
// SummaryStatButton state can be tested in isolation.
vi.mock('@/components/molecules/summary/SummaryDetailPopper', () => ({
  default: () => null,
}));

const baseCharacter = {
  id: 'test-char',
  agility: 14,   // modifier +2 → toDodge = 12 - 2 = 10
  strength: 16,  // modifier +3 → toHitMelee = 12 - 3 = 9
  presence: 10,  // modifier 0  → toHitRanged = 12
  equipment: [
    { key: 'rope', name: 'Rope' },
    { key: 'torch', name: 'Torch' },
  ],
  computedModifiers: [],
  modifiers: [],
  drToDodge: 10,
  drToMelee: 9,
  drToRanged: 12,
};

describe('SummaryBar Browser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(CharacterContextModule.useCharacter).mockReturnValue({
      character: baseCharacter,
    } as any);
  });

  it('renders all four stat labels', async () => {
    await render(
      <BrowserTestProvider>
        <SummaryBar />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText(/dodge/i)).toBeVisible();
    await expect.element(page.getByText(/melee/i)).toBeVisible();
    await expect.element(page.getByText(/ranged/i)).toBeVisible();
    await expect.element(page.getByText(/encumbrance/i)).toBeVisible();
  });

  it('displays computed stat values from character data', async () => {
    await render(
      <BrowserTestProvider>
        <SummaryBar />
      </BrowserTestProvider>
    );

    // drToDodge=10, drToMelee=9, drToRanged=12 from baseCharacter
    await expect.element(page.getByRole('button', { name: /dodge/i })).toHaveTextContent('10');
    await expect.element(page.getByRole('button', { name: /melee/i })).toHaveTextContent('9');
    await expect.element(page.getByRole('button', { name: /ranged/i })).toHaveTextContent('12');
  });

  it('displays encumbrance as current / max', async () => {
    await render(
      <BrowserTestProvider>
        <SummaryBar />
      </BrowserTestProvider>
    );

    // encumbrance=2, maxEncumbrance=10 — scope to the encumbrance button to avoid
    // substring collision with other stat values (e.g. '2' inside '12')
    const encumbranceButton = page.getByRole('button', { name: /encumbrance/i });
    await expect.element(encumbranceButton).toHaveTextContent('2');
    await expect.element(encumbranceButton).toHaveTextContent('10');
  });

  it('opens the detail popper when a stat button is clicked', async () => {
    await render(
      <BrowserTestProvider>
        <SummaryBar />
      </BrowserTestProvider>
    );

    const dodgeButton = page.getByRole('button', { name: /dodge/i });
    await userEvent.click(dodgeButton);

    // aria-expanded reflects pinned/open state — avoids MUI Portal timing issues
    await expect.element(dodgeButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes the detail popper when the same stat button is clicked again', async () => {
    await render(
      <BrowserTestProvider>
        <SummaryBar />
      </BrowserTestProvider>
    );

    const dodgeButton = page.getByRole('button', { name: /dodge/i });

    // Open
    await userEvent.click(dodgeButton);
    await expect.element(dodgeButton).toHaveAttribute('aria-expanded', 'true');

    // Close (second click toggles pin off)
    await userEvent.click(dodgeButton);
    await expect.element(dodgeButton).not.toHaveAttribute('aria-expanded', 'true');
  });
});
