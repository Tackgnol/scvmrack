import { render } from 'vitest-browser-react';
import { expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { CharacterContext } from '@/CharacterContext/CharacterContext';
import ConsumableSection from '@/components/molecules/consumables/ConsumableSection';
import BrowserTestProvider from '../../BrowserTestProvider';
import { catalogTorches } from '../../../fixtures/catalogConsumables';

test('catalog Torches render both sets of uses and target the chosen copy', async () => {
  const toggleScrollUse = vi.fn();
  await render(
    <BrowserTestProvider>
      <CharacterContext.Provider value={{
        character: { equipment: [catalogTorches, { ...catalogTorches }] },
        isSaving: false,
        toggleScrollUse,
      } as never}>
        <ConsumableSection />
      </CharacterContext.Provider>
    </BrowserTestProvider>
  );
  await expect.element(page.getByRole('button', { name: 'Mark used: Torches use 6', exact: true }).nth(1)).toBeVisible();
  await userEvent.click(page.getByRole('button', { name: 'Mark used: Torches use 1', exact: true }).nth(1));
  await expect.poll(() => toggleScrollUse).toHaveBeenCalledWith(1, 0);
});

test('two copies of one catalog consumable get distinct row identities (RPG-310)', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  await render(
    <BrowserTestProvider>
      <CharacterContext.Provider value={{
        character: { equipment: [catalogTorches, { ...catalogTorches }] },
        isSaving: false,
        toggleScrollUse: vi.fn(),
      } as never}>
        <ConsumableSection />
      </CharacterContext.Provider>
    </BrowserTestProvider>
  );
  await expect.element(page.getByRole('button', { name: 'Mark used: Torches use 1', exact: true }).nth(1)).toBeVisible();
  expect(consoleError.mock.calls.flat().join(' ')).not.toMatch(/same key/);
  consoleError.mockRestore();
});

test('duplicate catalog consumables keep their own uses through reorder and removal (RPG-310)', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  const toggleScrollUse = vi.fn();
  const burnt = { ...catalogTorches, uses: [true, false, false, false, false, false] };
  const fresh = { ...catalogTorches };
  const sheet = (equipment: typeof catalogTorches[]) => (
    <BrowserTestProvider>
      <CharacterContext.Provider value={{ character: { equipment }, isSaving: false, toggleScrollUse } as never}>
        <ConsumableSection />
      </CharacterContext.Provider>
    </BrowserTestProvider>
  );
  const firstPips = () => page.getByRole('button', { name: /Torches use 1$/ });

  const screen = await render(sheet([burnt, fresh]));
  await expect.element(firstPips().nth(0)).toHaveAccessibleName('Mark unused: Torches use 1');
  await expect.element(firstPips().nth(1)).toHaveAccessibleName('Mark used: Torches use 1');

  await screen.rerender(sheet([fresh, burnt]));
  await expect.element(firstPips().nth(0)).toHaveAccessibleName('Mark used: Torches use 1');
  await expect.element(firstPips().nth(1)).toHaveAccessibleName('Mark unused: Torches use 1');

  await screen.rerender(sheet([burnt]));
  await expect.element(firstPips().nth(1)).not.toBeInTheDocument();
  await expect.element(firstPips()).toHaveAccessibleName('Mark unused: Torches use 1');
  await userEvent.click(firstPips());
  await expect.poll(() => toggleScrollUse).toHaveBeenCalledWith(0, 0);

  expect(consoleError.mock.calls.flat().join(' ')).not.toMatch(/same key/);
  consoleError.mockRestore();
});
