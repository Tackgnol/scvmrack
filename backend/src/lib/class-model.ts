import type { Class, ClassSource, ClassStatus, ClassVisibility, GettingBetterRule } from '@prisma/client';

export type { ClassSource, ClassStatus, ClassVisibility, GettingBetterRule };

/**
 * Lists every value of a database enum as a tuple JSON schemas can use.
 * Compiles only when the tuple names exactly the enum's values, so the API cannot drift from the schema.
 */
const enumValues =
  <T extends string>() =>
  <const A extends readonly T[]>(values: A & ([T] extends [A[number]] ? unknown : never)): A =>
    values;

export const CLASS_SOURCES = enumValues<ClassSource>()(['main_book', 'zine', 'the_rack', 'user']);
export const CLASS_STATUSES = enumValues<ClassStatus>()(['draft', 'active', 'archived']);
export const CLASS_VISIBILITIES = enumValues<ClassVisibility>()(['private', 'public']);
export const GETTING_BETTER_RULES = enumValues<GettingBetterRule>()(['book', 'book_plus_ability', 'specialist']);

/** Prefix of every translation key a Custom Class owns (`cc.<classId>.…`); Book keys never use it. */
export const CUSTOM_CLASS_KEY_PREFIX = 'cc.';

/** The root every key of one Custom Class hangs off, e.g. `cc.12` for `cc.12.name`. */
export function customClassKeyRoot(classId: number): string {
  return `${CUSTOM_CLASS_KEY_PREFIX}${classId}`;
}

/** JSON-schema pattern for a Custom Class's numbered `kind` key, e.g. `cc.12.origin.3`. */
export function customClassKeyPattern(kind: string): string {
  return `^${CUSTOM_CLASS_KEY_PREFIX.replace('.', '\\.')}[0-9]{1,9}\\.${kind}\\.[0-9]{1,9}$`;
}

/** Whether a translation or ability key belongs to a Custom Class rather than the Book. */
export function isCustomClassKey(key: string): boolean {
  return key.startsWith(CUSTOM_CLASS_KEY_PREFIX);
}

/** The columns that identify one version of a class and decide who may see it. */
export type ClassVersionRef = Pick<
  Class,
  'id' | 'lineageId' | 'version' | 'source' | 'status' | 'visibility' | 'ownerUserId' | 'takenDownAt'
>;

/** Whether a class version can be used at all: active and not taken down. */
export function isAvailable(row: Pick<ClassVersionRef, 'status' | 'takenDownAt'>): boolean {
  return row.status === 'active' && row.takenDownAt === null;
}

/** Whether `viewerId` may use a class: built-in, public, or their own. */
export function mayUse(
  row: Pick<ClassVersionRef, 'source' | 'visibility' | 'ownerUserId'>,
  viewerId: string | null
): boolean {
  return row.source !== 'user' || row.visibility === 'public' || (viewerId !== null && row.ownerUserId === viewerId);
}
