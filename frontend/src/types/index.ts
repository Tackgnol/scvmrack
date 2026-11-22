export type StatType =
  | 'all'
  | 'agi'
  | 'pre'
  | 'str'
  | 'tou'
  | 'def'
  | 'hp'
  | 'atk'
  | 'dmg';

export interface MorkBorgColors {
  yellow: string;
  pink: string;
  black: string;
  white: string;
  grey: string;
  darkGrey: string;
  blood: string;
}

export type StatColorMap = Record<StatType, string>;
