import type { AbilityName } from '@components/abilities/types';

export interface PendingAbilityChange {
  characterKey: string;
  ability: AbilityName;
  fromScore: number;
  toScore: number;
}
