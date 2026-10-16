/**
 * Everything one Class Version owns: its class row columns, translations under both
 * key schemes (`cc.<id>.*` for class text, `<table>.cc-<id>-<n>` for Class Items),
 * origins, abilities, ability modifiers and Class Item catalog rows. Every read,
 * write and delete of a version's rows goes through here; `lib/class-version.ts`
 * decides what those rows hold.
 */

import type { Prisma } from '@prisma/client';
import { itemRow, type ItemRowRead } from '../lib/class-items.js';
import type { ClassDraft, ClassItemDraft } from '../lib/class-draft.js';
import { customClassKeyRoot } from '../lib/class-model.js';
import {
  draftFromVersion,
  grantedItemKeys,
  planVersionWrite,
  type VersionContent,
  type VersionRow,
} from '../lib/class-version.js';
import { advisoryLock } from './advisory-lock.js';

type Tx = Prisma.TransactionClient;

/** Every translation a version owns, class text and Class Item text alike. */
function versionTextWhere(id: number): Prisma.TranslationWhereInput {
  return {
    OR: [
      { key: { startsWith: `${customClassKeyRoot(id)}.` } },
      { key: { contains: `.cc-${id}-` } },
    ],
  };
}

/** Writes one Class Item's catalog row; a retyped item gets a row under its new key. */
async function upsertItem(
  tx: Tx,
  key: string,
  item: ClassItemDraft,
  classId: number,
  source: string,
  position: number
): Promise<void> {
  const row = itemRow(item, classId, source, position);
  const args = {
    where: { key },
    create: { key, ...row.data },
    update: row.data,
  };
  switch (row.table) {
    case 'weapon':
      await tx.weapon.upsert(args as Prisma.WeaponUpsertArgs);
      break;
    case 'armor':
      await tx.armor.upsert(args as Prisma.ArmorUpsertArgs);
      break;
    case 'equipment':
      await tx.equipment.upsert(args as Prisma.EquipmentUpsertArgs);
      break;
    case 'pet':
      await tx.pet.upsert(args as Prisma.PetUpsertArgs);
      break;
  }
}

/** Writes `draft` over version `id`, as `planVersionWrite` plans it from the keys the version gave out. */
export async function writeVersion(tx: Tx, id: number, draft: ClassDraft): Promise<void> {
  const owned = { where: { classId: id }, select: { key: true } };
  const [texts, modifierRows, weapons, armors, equipment, pets] = await Promise.all([
    tx.translation.findMany({
      where: { key: { startsWith: `${customClassKeyRoot(id)}.` } },
      select: { key: true },
    }),
    tx.classAbilityModifier.findMany({ where: { classId: id }, select: { abilityKey: true } }),
    tx.weapon.findMany(owned),
    tx.armor.findMany(owned),
    tx.equipment.findMany(owned),
    tx.pet.findMany(owned),
  ]);
  const plan = planVersionWrite(id, draft, {
    textKeys: texts.map((t) => t.key),
    modifierAbilityKeys: modifierRows.map((m) => m.abilityKey),
    itemKeys: [...weapons, ...armors, ...equipment, ...pets].map((row) => row.key),
  });

  await tx.translation.deleteMany({ where: { key: { in: plan.replaced.textKeys } } });
  await tx.translation.createMany({ data: plan.translations });

  await tx.origin.deleteMany({ where: { classId: id } });
  await tx.origin.createMany({
    data: plan.originKeys.map((key, i) => ({ classId: id, roll: i + 1, key })),
  });

  for (const entry of plan.items) {
    await upsertItem(tx, entry.key, entry.item, id, entry.source, entry.position);
  }

  await tx.ability.deleteMany({ where: { classId: id } });
  await tx.ability.createMany({
    data: plan.abilities.map(({ tableRows: _rows, modifiers: _modifiers, ...ability }) => ({ classId: id, ...ability })),
  });
  await tx.classAbilityModifier.deleteMany({
    where: { classId: id, abilityKey: { in: plan.replaced.modifierAbilityKeys } },
  });
  const savedAbilities = await tx.ability.findMany({
    where: { key: { in: plan.abilities.map((ability) => ability.key) } },
    select: { id: true, key: true },
  });
  const abilityIdByKey = new Map(savedAbilities.map((ability) => [ability.key, ability.id]));
  await tx.abilityTableRow.createMany({
    data: plan.abilities.flatMap((ability) =>
      ability.tableRows.map((row) => ({ abilityId: abilityIdByKey.get(ability.key)!, ...row }))
    ),
  });
  await tx.classAbilityModifier.createMany({
    data: plan.abilities.flatMap((ability) =>
      ability.modifiers.map((modifier) => ({ classId: id, abilityKey: ability.key, ...modifier }))
    ),
  });

  await tx.class.update({ where: { id }, data: plan.columns });
}

/** Reads the rows a version's draft is rebuilt from and rebuilds it. */
export async function readVersionDraft(db: Tx, cls: VersionRow): Promise<ClassDraft> {
  const id = cls.id;
  const [origins, abilities, modifiers, translations] = await Promise.all([
    db.origin.findMany({ where: { classId: id }, orderBy: { roll: 'asc' }, select: { key: true } }),
    db.ability.findMany({
      where: { classId: id },
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
      select: {
        key: true,
        isRandom: true,
        grantItemKey: true,
        grantPetKey: true,
        tableDie: true,
        tableRows: { orderBy: { roll: 'asc' }, select: { roll: true, textKey: true, itemKey: true } },
      },
    }),
    db.classAbilityModifier.findMany({ where: { classId: id }, orderBy: { id: 'asc' } }),
    db.translation.findMany({ where: { key: { startsWith: `${customClassKeyRoot(id)}.` } } }),
  ]);
  const itemKeys = grantedItemKeys(abilities);
  const [items, itemTexts] = itemKeys.length === 0 ? [[], []] : await loadItemRows(db, id, itemKeys);
  return draftFromVersion(cls, { origins, abilities, modifiers, translations, items, itemTexts });
}

/** A version's Class Item catalog rows among `keys`, with their name and description text. */
async function loadItemRows(db: Tx, classId: number, keys: string[]) {
  const where = { classId, key: { in: keys } };
  const [weapons, armors, equipment, pets, texts] = await Promise.all([
    db.weapon.findMany({ where }),
    db.armor.findMany({ where }),
    db.equipment.findMany({ where }),
    db.pet.findMany({ where }),
    db.translation.findMany({ where: { key: { in: keys.flatMap((k) => [k, `${k}.description`]) } } }),
  ]);
  const rows: ItemRowRead[] = [...weapons, ...armors, ...equipment, ...pets];
  return [rows, texts] as const;
}

/** Removes a version that no character references, including its private catalog rows. */
export async function deleteVersion(tx: Tx, id: number): Promise<void> {
  await Promise.all([
    tx.classAbilityModifier.deleteMany({ where: { classId: id } }),
    tx.origin.deleteMany({ where: { classId: id } }),
    tx.weapon.deleteMany({ where: { classId: id } }),
    tx.armor.deleteMany({ where: { classId: id } }),
    tx.equipment.deleteMany({ where: { classId: id } }),
    tx.pet.deleteMany({ where: { classId: id } }),
    tx.translation.deleteMany({ where: versionTextWhere(id) }),
  ]);
  // Ability table rows cascade from abilities.
  await tx.ability.deleteMany({ where: { classId: id } });
  await tx.class.delete({ where: { id } });
}

async function itemRowsOf(tx: Tx, classId: number) {
  const where = { classId };
  const select = { key: true, modifiers: true } as const;
  const [weapons, armors] = await Promise.all([
    tx.weapon.findMany({ where, select }),
    tx.armor.findMany({ where, select }),
  ]);
  return [
    ...weapons.map((row) => ({ table: 'weapon' as const, ...row })),
    ...armors.map((row) => ({ table: 'armor' as const, ...row })),
  ];
}

/** Reads every version's user-written content, so it can be blanked and later restored. */
export async function snapshotLineage(tx: Tx, lineageId: string): Promise<VersionContent> {
  const versions = await tx.class.findMany({
    where: { lineageId },
    select: { id: true, name: true, appendix: true },
  });
  return {
    versions: await Promise.all(versions.map(async (version) => ({
      ...version,
      translations: await tx.translation.findMany({
        where: versionTextWhere(version.id),
        select: { locale: true, key: true, value: true },
      }),
      modifiers: await tx.classAbilityModifier.findMany({
        where: { classId: version.id },
        select: { id: true, source: true },
      }),
      items: await itemRowsOf(tx, version.id),
    }))),
  };
}

/** Writes recorded content back over the versions it names: a blanked copy, or the original to restore. */
export async function writeLineageContent(tx: Tx, content: VersionContent): Promise<void> {
  for (const version of content.versions) {
    await tx.class.update({ where: { id: version.id }, data: { appendix: version.appendix } });
    for (const translation of version.translations) {
      await tx.translation.upsert({
        where: { locale_key: { locale: translation.locale, key: translation.key } },
        create: translation,
        update: { value: translation.value },
      });
    }
    for (const modifier of version.modifiers) {
      await tx.classAbilityModifier.update({ where: { id: modifier.id }, data: { source: modifier.source } });
    }
    for (const item of version.items ?? []) {
      const data = { modifiers: (item.modifiers ?? []) as Prisma.InputJsonValue };
      const where = { key: item.key };
      if (item.table === 'weapon') {
        await tx.weapon.update({ where, data });
      } else {
        await tx.armor.update({ where, data });
      }
    }
  }
}

/** Serializes saves and moderation decisions on one lineage until the transaction ends. */
export function lockLineage(tx: Tx, lineageId: string): Promise<void> {
  return advisoryLock(tx, 'lineage', lineageId);
}

/** Drops the lineage from party pools, except the pools of `keepOwnerUserId`'s parties. */
export async function removeLineageFromPools(tx: Tx, lineageId: string, keepOwnerUserId?: string): Promise<void> {
  await tx.partyClassPool.deleteMany({
    where: {
      lineageId,
      ...(keepOwnerUserId ? { party: { ownerUserId: { not: keepOwnerUserId } } } : {}),
    },
  });
}

/** The lineage lock and pool removal, bound to `tx`, for the repositories' transaction operations. */
export function lineageTxOps(tx: Tx) {
  return {
    lockLineage: (lineageId: string) => lockLineage(tx, lineageId),
    removeFromPools: (lineageId: string, keepOwnerUserId?: string) => removeLineageFromPools(tx, lineageId, keepOwnerUserId),
  };
}
