import { type EquipmentItem } from '@/hooks/models';

export interface EquipmentUseEntry {
  item: EquipmentItem;
  equipmentIndex: number;
  uses: boolean[];
}
