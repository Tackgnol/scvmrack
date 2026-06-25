import { render } from 'vitest-browser-react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import BrowserTestProvider from '../BrowserTestProvider';
import { ClassGate } from '@/components/organisms/character-create/ClassGate';
import { fetchClasses } from '@/api/draft';

vi.mock('@/api/draft', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/draft')>()),
  fetchClasses: vi.fn(),
}));

const classes = [
  { id: 1, name: 'Esoteric Hermit', description: 'A lonely mystic.' },
  { id: 2, name: 'Fanged Deserter', description: 'Bites first.' },
];

describe('ClassGate', () => {
  const onPick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchClasses).mockResolvedValue(classes);
  });

  it('renders a card per class plus Classless and Random', async () => {
    render(
      <BrowserTestProvider>
        <ClassGate onPick={onPick} busy={false} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('Esoteric Hermit')).toBeVisible();
    await expect.element(page.getByText('Fanged Deserter')).toBeVisible();
    await expect.element(page.getByTestId('class-gate-classless')).toBeVisible();
    await expect.element(page.getByTestId('class-gate-random')).toBeVisible();
    await expect.element(page.getByTestId('class-gate-random-mark')).toBeVisible();
  });

  it('dispatches the right choice per card', async () => {
    render(
      <BrowserTestProvider>
        <ClassGate onPick={onPick} busy={false} />
      </BrowserTestProvider>
    );

    await userEvent.click(page.getByText('Fanged Deserter'));
    expect(onPick).toHaveBeenCalledWith({ classId: 2 });

    await userEvent.click(page.getByTestId('class-gate-classless'));
    expect(onPick).toHaveBeenCalledWith({ classless: true });

    await userEvent.click(page.getByTestId('class-gate-random'));
    expect(onPick).toHaveBeenCalledWith({});
  });

  it('disables cards while busy', async () => {
    render(
      <BrowserTestProvider>
        <ClassGate onPick={onPick} busy={true} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByTestId('class-gate-random')).toBeDisabled();
  });
});
