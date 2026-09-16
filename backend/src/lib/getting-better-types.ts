import type { AbilityStat } from './ability-modifiers.js';

export type { AbilityStat } from './ability-modifiers.js';
export { ABILITY_STATS } from './ability-modifiers.js';

export type RollSource = 'server' | 'table';

export type RollValue = {
  source: RollSource;
  dice?: number[];
  total: number;
};

export type ImprovementCharacterSnapshot = {
  characterUpdatedAt: string;
  maxHp: number;
  silver: number;
  abilities: Record<AbilityStat, number>;
  abilityKeys: string[];
  equipmentFingerprint: string;
  snapshotHash: string;
};

export type ImprovementCharacterSnapshotInput = Omit<
  ImprovementCharacterSnapshot,
  'snapshotHash'
>;

export type ImprovementHpRoll = {
  check: RollValue;
  fromMaxHp: number;
  succeeds: boolean;
  increase: RollValue | null;
  toMaxHp: number;
};

export type ImprovementDebrisRoll =
  | { roll: RollValue; kind: 'nothing' }
  | { roll: RollValue; kind: 'silver'; silver: RollValue; amount: number }
  | {
      roll: RollValue;
      kind: 'uncleanScroll';
      scroll: RollValue;
      itemKey: string;
    }
  | {
      roll: RollValue;
      kind: 'sacredScroll';
      scroll: RollValue;
      itemKey: string;
    };

export type ImprovementAbilityRoll = {
  roll: RollValue;
  fromScore: number;
  fromModifier: number;
  toModifier: number;
  toScore: number;
  outcome: 'increase' | 'decrease' | 'same';
};

export type SpecialtySlot = {
  key: string;
  rollValue: number;
};

export type SpecialtyRoll = SpecialtySlot & {
  roll: RollValue;
};

export type ScumSpecialtyDraft =
  | { kind: 'notScum' }
  | { kind: 'firstImprovement'; existing: SpecialtySlot; added: SpecialtyRoll }
  | {
      kind: 'laterImprovement';
      primary: SpecialtySlot;
      secondary: SpecialtySlot;
      rerollMode: 'none' | 'primary' | 'secondary' | 'both';
    };

export type ImprovementDraft = {
  sequence: number;
  snapshot: ImprovementCharacterSnapshot;
  hp: ImprovementHpRoll;
  debris: ImprovementDebrisRoll;
  abilities: Record<AbilityStat, ImprovementAbilityRoll>;
  scumSpecialties: ScumSpecialtyDraft;
};

export type AppliedImprovement = {
  draftId: string;
  sequence: number;
  appliedAt: string;
  draft: ImprovementDraft;
  changes: {
    maxHp?: { from: number; to: number };
    silver?: { from: number; to: number };
    equipmentAdded?: Array<{ itemKey: string }>;
    abilities: Partial<
      Record<AbilityStat, { fromScore: number; toScore: number }>
    >;
    abilityKeys?: { from: string[]; to: string[] };
  };
};

export type RollResult = {
  total: number;
  dice?: number[];
};

export type GettingBetterRoller = {
  roll(notation: string): Promise<RollResult>;
};

export type ScrollFamily = 'unclean' | 'sacred';

export type GettingBetterCatalog = {
  scrollKeys(family: ScrollFamily): readonly string[];
  scumSpecialties?(): readonly SpecialtySlot[];
  scumFixedAbilityKeys?(): readonly string[];
};

export type HpImprovementCharacter = {
  maxHp: number;
};

export type ScumSpecialtyCharacter = {
  isGutterbornScum: boolean;
  abilityKeys: readonly string[];
};

export type AppliedImprovementCharacter = {
  maxHp: number;
  silver: number;
  abilities: Record<AbilityStat, number>;
  abilityKeys: readonly string[];
  scumSpecialtyKeys?: readonly string[];
};

export type BuildAppliedImprovementOptions = {
  draftId: string;
  appliedAt: string;
};

export class GettingBetterRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GettingBetterRuleError';
  }
}
