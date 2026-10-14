import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import prisma from '../../../src/lib/prisma.js';
import { blankClassDraft, type ClassDraft } from '../../../src/lib/class-draft.js';
import { blankedContent, versionColumns } from '../../../src/lib/class-version.js';
import {
  deleteVersion,
  readVersionDraft,
  snapshotLineage,
  writeLineageContent,
  writeVersion,
} from '../../../src/repositories/class-version-repository.js';

const MARKER = '[removed by moderation]';

const draft = (): ClassDraft => ({
  ...blankClassDraft(),
  name: { en: 'Footprint Witch', pl: '' },
  description: { en: 'Leaves nothing behind.', pl: '' },
  origins: [{ en: 'A sunken bell', pl: '' }],
  abilities: [
    {
      random: false,
      name: { en: 'Mire Grip', pl: '' },
      text: { en: 'Grab and drown.', pl: '' },
      modifiers: [{ statistic: 'strength', value: 1, exclude: [] }],
      grantItem: 'new:hook',
      grantPet: null,
      table: null,
    },
  ],
  items: [
    {
      ref: 'new:hook',
      type: 'weapon',
      name: { en: 'Drowning Hook', pl: '' },
      description: { en: 'Rusted and hungry.', pl: '' },
      value: 5,
      weapon: {
        diceCount: 1,
        diceFaces: 6,
        damageModifier: 0,
        reach: 'ranged',
        ammo: 'counted',
        ammoCount: 4,
        ammoName: 'Bog teeth',
        modifiers: [{ statistic: 'agility', value: 1, exclude: [] }],
      },
      armor: { tier: 1, modifiers: [] },
      gear: { kind: 'carried', uses: 0, effect: 'text', effectDie: 6, statuses: [] },
      pet: { hp: 4, actionDie: 4, action: 'attack', humanoid: false, buffs: [] },
    },
  ],
});

/** Every user-written value a version's rows hold, so the test can see what a removal leaves behind. */
async function versionText(id: number): Promise<string> {
  const [translations, modifiers, weapons] = await Promise.all([
    prisma.translation.findMany({
      where: { OR: [{ key: { startsWith: `cc.${id}.` } }, { key: { contains: `.cc-${id}-` } }] },
      select: { locale: true, key: true, value: true },
      orderBy: [{ key: 'asc' }, { locale: 'asc' }],
    }),
    prisma.classAbilityModifier.findMany({ where: { classId: id }, select: { source: true }, orderBy: { id: 'asc' } }),
    prisma.weapon.findMany({ where: { classId: id }, select: { key: true, ammoType: true, modifiers: true } }),
  ]);
  return JSON.stringify({ translations, modifiers, weapons });
}

test('a Class Version saves, reads back, blanks every user-written string, restores, and deletes cleanly', async () => {
  const lineageId = randomUUID();
  const { id } = await prisma.class.create({
    data: { ...versionColumns(draft()), source: 'user', visibility: 'public', status: 'active', lineageId },
    select: { id: true },
  });
  try {
    await prisma.$transaction((tx) => writeVersion(tx, id, draft()));
    const row = await prisma.class.findUniqueOrThrow({ where: { id } });
    const read = await readVersionDraft(prisma, row);
    assert.equal(read.name.en, 'Footprint Witch');
    assert.equal(read.abilities[0].name.en, 'Mire Grip');
    assert.equal(read.items[0].name.en, 'Drowning Hook');
    assert.equal(read.abilities[0].grantItem, read.items[0].ref, 'the grant follows the saved item key');
    const saved = await versionText(id);
    for (const text of ['Footprint Witch', 'Mire Grip', 'Drowning Hook', 'Rusted and hungry.', 'Bog teeth']) {
      assert.ok(saved.includes(text), `saved version holds "${text}"`);
    }

    const evidence = await prisma.$transaction((tx) => snapshotLineage(tx, lineageId));
    await prisma.$transaction((tx) => writeLineageContent(tx, blankedContent(evidence, MARKER)));
    const blanked = await versionText(id);
    for (const text of ['Footprint Witch', 'Mire Grip', 'Drowning Hook', 'Rusted and hungry.']) {
      assert.ok(!blanked.includes(text), `removal blanks "${text}"`);
    }
    assert.ok(blanked.includes('Bog teeth'), 'removal keeps the ammo type inventories match on');

    await prisma.$transaction((tx) => writeLineageContent(tx, evidence));
    assert.equal(await versionText(id), saved);

    await prisma.$transaction((tx) => deleteVersion(tx, id));
    assert.equal(await prisma.class.count({ where: { id } }), 0);
    const left = JSON.parse(await versionText(id)) as Record<string, unknown[]>;
    assert.deepEqual(
      Object.values(left).map((rows) => rows.length),
      [0, 0, 0],
      'deleting a version leaves none of its rows or translations'
    );
  } finally {
    await prisma.$transaction((tx) => deleteVersion(tx, id)).catch(() => undefined);
    await prisma.$disconnect();
  }
});
