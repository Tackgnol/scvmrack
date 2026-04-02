export type AbilityName = 'agility' | 'presence' | 'strength' | 'toughness';

export interface AbilityCardProps {
  ability: AbilityName;
  rotate?: number;
}

export interface AbilityConfigItem {
  ability: AbilityName;
  rotate: number;
}
