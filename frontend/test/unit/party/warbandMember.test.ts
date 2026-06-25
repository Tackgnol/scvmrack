import { describe, expect, it } from 'vitest';
import { toWarbandMember } from '@/components/organisms/party/warbandMember';
import type { Character } from '@/hooks/models';

const baseCharacter: Character = {
  id: 'pyron',
  name: 'Pyron',
  className: 'Esoteric Hermit',
  // Abilities are raw d20-style SCORES (as the API returns them), not modifiers.
  // rollToModifier maps: 7→−1, 15→+2, 13→+1, 10→0.
  strength: 7,
  agility: 15,
  presence: 13,
  toughness: 10,
  currentHp: 8,
  maxHp: 11,
  omens: 1,
  maxOmens: 2,
  silver: 47,
  trait1: 'Esoteric',
  trait2: 'Hollow',
  habit: 'Whispers to the scab on his wrist.',
  bodyDescription: 'Gaunt; ash-grey skin.',
  origin: 'Crawled from a salt cave.',
  drToDodge: 14,
  drToMelee: 9,
  drToRanged: 12,
  equippedWeapons: [{ name: 'Femur club', dice: [4] }],
  equippedArmor: { name: 'Hide', currentTier: 1 },
  equipment: [
    { name: 'Tallow candle stub', description: 'One scene of dim light.' },
  ],
  modifiers: [
    {
      name: 'Esoteric Eye',
      value: 1,
      statistic: 'presence',
      comment: 'A third eye weeps.',
    },
    {
      name: 'Wretched Cough',
      value: -1,
      statistic: 'toughness',
      comment: 'A wet cough.',
    },
  ],
  computedModifiers: [
    { statistic: 'agility', value: 2, originName: 'Gutter Instinct' },
  ],
};

describe('toWarbandMember', () => {
  it('formats identity, hp, and signed abilities', () => {
    const m = toWarbandMember(baseCharacter);
    expect(m.name).toBe('Pyron');
    expect(m.cls).toBe('Esoteric Hermit');
    expect(m.hpText).toBe('8/11');
    expect(m.hpPct).toBe(73); // round(8/11*100)
    expect(m.str).toBe('−1'); // proper minus sign
    expect(m.agi).toBe('+2');
    expect(m.dead).toBe(false);
  });

  it('labels equipped weapon and armor and derives armor DR', () => {
    const m = toWarbandMember(baseCharacter);
    expect(m.weapon).toBe('Femur club (d4)');
    expect(m.armor).toBe('Hide (−d2)');
    expect(m.dr).toBe(2); // currentTier 1 → −d2 → 2
  });

  it('falls back to unarmed / none / 0 DR when nothing is equipped', () => {
    const m = toWarbandMember({
      ...baseCharacter,
      equippedWeapons: [],
      equippedArmor: null,
    });
    expect(m.weapon).toBe('Unarmed (d2)');
    expect(m.armor).toBe('None');
    expect(m.dr).toBe(0);
  });

  it('classifies modifiers as buff or debuff', () => {
    const m = toWarbandMember({ ...baseCharacter, computedModifiers: [] });
    expect(m.hasMods).toBe(true);
    expect(m.modCount).toBe(2);
    expect(m.modifiers).toHaveLength(2);
    expect(m.modifiers[0]).toMatchObject({
      kind: 'buff',
      effect: '+1 PRESENCE',
    });
    expect(m.modifiers[1]).toMatchObject({
      kind: 'debuff',
      effect: '−1 TOUGHNESS',
    });
  });

  it('projects computed equipment and class modifiers as active warband modifiers', () => {
    const m = toWarbandMember({
      ...baseCharacter,
      modifiers: [],
      computedModifiers: [
        {
          origin: 'armor',
          originName: 'Scale Armor',
          source: 'Scale Armor',
          statistic: 'agility',
          value: -2,
        },
        {
          origin: 'system',
          originName: 'Clumsy and Dull-witted',
          source: 'Clumsy and Dull-witted',
          statistic: 'agility',
          value: -2,
        },
      ],
    });

    expect(m.hasMods).toBe(true);
    expect(m.modCount).toBe(2);
    expect(m.modifiers).toEqual([
      expect.objectContaining({
        label: 'Scale Armor',
        effect: '−2 AGILITY',
        kind: 'debuff',
        descKey: 'modifiers.computed.originDescriptions.armor',
      }),
      expect.objectContaining({
        label: 'Clumsy and Dull-witted',
        effect: '−2 AGILITY',
        kind: 'debuff',
        descKey: 'modifiers.computed.originDescriptions.system',
      }),
    ]);
  });

  it('builds contributing rows including matching computed modifiers', () => {
    const m = toWarbandMember(baseCharacter);
    expect(m.dodgeC[0]).toEqual({
      label: 'Base test',
      labelKey: 'gm.baseTest',
      val: 'DR12',
    });
    expect(m.dodgeC[1]).toEqual({
      label: 'Agility',
      labelKey: 'attributes.agility',
      val: '+2',
    });
    expect(m.dodgeC).toContainEqual({ label: 'Gutter Instinct', val: '+2' });
    // Melee is governed by strength — the agility computed mod must not leak in.
    expect(m.meleeC.some((r) => r.label === 'Gutter Instinct')).toBe(false);
  });

  it('marks a 0-hp scvm dead without inventing afflictions', () => {
    const m = toWarbandMember({ ...baseCharacter, currentHp: 0 });
    expect(m.dead).toBe(true);
  });

  it('projects equipment with a count', () => {
    const m = toWarbandMember({
      ...baseCharacter,
      equipment: [
        { name: 'Tallow candle stub', description: 'One scene of dim light.' },
        { name: 'Tallow candle stub', description: 'One scene of dim light.' },
        { name: 'Rope', description: 'Frayed but useful.' },
      ],
    });

    expect(m.equipCount).toBe(3);
    expect(m.equipment).toEqual([
      {
        name: 'Tallow candle stub x2',
        desc: 'One scene of dim light.',
      },
      {
        name: 'Rope',
        desc: 'Frayed but useful.',
      },
    ]);
  });

  it('aggregates duplicate carried equipment into multiples', () => {
    const m = toWarbandMember({
      ...baseCharacter,
      equipment: [
        {
          key: 'equipment.torches',
          name: 'Torches',
          description: 'Presence +4.',
        },
        {
          key: 'equipment.torches',
          name: 'Torches',
          description: 'Presence +4.',
        },
        {
          key: 'equipment.torches',
          name: 'Torches',
          description: 'Presence +4.',
        },
        {
          key: 'equipment.rope',
          name: 'Rope',
          description: 'Frayed but useful.',
        },
      ],
    });

    expect(m.equipCount).toBe(4);
    expect(m.equipment).toEqual([
      {
        name: 'Torches x3',
        desc: 'Presence +4.',
      },
      {
        name: 'Rope',
        desc: 'Frayed but useful.',
      },
    ]);
  });
});
