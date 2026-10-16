import type { ItemSearchHit } from '@/hooks/useEquipmentSearch.ts';

export type CatalogGrantPickerProps = {
  id: string;
  label: string;
  pinnedOptions: ItemSearchHit[];
  disabledPinnedKeys: string[];
  pet: boolean;
  onSelect: (key: string) => void;
  onClear: () => void;
};
