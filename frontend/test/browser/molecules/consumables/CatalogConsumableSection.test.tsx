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
