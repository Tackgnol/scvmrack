import { beforeEach, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import BrowserTestProvider from '../BrowserTestProvider';
import InventoryItemEditorModal from '@/components/organisms/InventoryItemEditorModal';
import type { EquipmentItem } from '@/hooks/models';

const state = vi.hoisted(() => ({ equipment: [] as EquipmentItem[] }));
vi.mock('@/CharacterContext/CharacterContext', () => ({
  useCharacter: () => ({ character: { equipment: state.equipment, storage: [] }, equipArmor: vi.fn(), equipWeapon: vi.fn() }),
}));

beforeEach(() => vi.clearAllMocks());

it.each([49, 50])('keeps the quantity editor within the remaining On Hand capacity at %i items', async (count) => {
  const item = { key: 'equipment.rope', name: 'Rope', description: '', comments: '' };
  state.equipment = [item, ...Array.from({ length: count - 1 }, (_, i) => ({ key: `equipment.${i}`, name: `Item ${i}` }))];
  const onAdjustQuantity = vi.fn();
  const onClose = vi.fn();
  await render(
    <BrowserTestProvider>
      <InventoryItemEditorModal
        open
        aggregated={{ item, indices: [0], quantity: 1 }}
        location="equipment"
        onClose={onClose}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onMove={vi.fn()}
        onAdjustQuantity={onAdjustQuantity}
      />
    </BrowserTestProvider>,
  );
  const increase = page.getByRole('button', { name: 'Increase quantity', exact: true });
  await expect.element(increase).toBeVisible();
  if (count === 49) {
    await userEvent.click(increase);
  }
  await expect.element(increase).toBeDisabled();
  await expect.element(page.getByText('On Hand is limited to 50 items.')).toBeVisible();
  await userEvent.click(page.getByRole('button', { name: 'Save', exact: true }));
  if (count === 49) {
    await expect.poll(() => onAdjustQuantity).toHaveBeenCalledWith(item, 2, [0]);
  } else {
    expect(onAdjustQuantity).not.toHaveBeenCalled();
  }
  await expect.poll(() => onClose).toHaveBeenCalled();
});
