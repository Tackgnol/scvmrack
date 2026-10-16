import { expect, test } from 'vitest';
import { isConsumableUseItem } from '@/hooks/useEquipmentSections';
import { catalogTorches } from '../../fixtures/catalogConsumables';

test('catalog Torches expose controls while fresh or fully spent', () => {
  expect(isConsumableUseItem(catalogTorches)).toBe(true);
  expect(isConsumableUseItem({ ...catalogTorches, uses: catalogTorches.uses?.map(() => true) })).toBe(true);
});
