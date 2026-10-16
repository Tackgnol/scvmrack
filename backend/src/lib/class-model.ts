import { apiError } from '../errors.js';
import type { Class, ClassSource, ClassStatus, ClassVisibility, GettingBetterRule, Prisma } from '@prisma/client';

export type { ClassSource, ClassStatus, ClassVisibility, GettingBetterRule };

/**
 * Lists every value of a database enum as a tuple JSON schemas can use.
 * Compiles only when the tuple names exactly the enum's values, so the API cannot drift from the schema.
 */
export const enumValues =
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

/** The text a moderation removal puts in place of a class's user-written content. */
export const REMOVAL_MARKER = '[removed by moderation]';

/**
 * Who may do what with a class version. Every read, offer and report check goes through
 * these, so a change to the rules (such as a new status) lands in one place.
 */

/** `isAvailable` as a database filter, for queries that must agree with it. */
export const availableWhere = { status: 'active', takenDownAt: null } satisfies Prisma.ClassWhereInput;

/** `mayUse` as a database filter, for queries that must agree with it. */
export function usableByWhere(viewerId: string) {
  return {
    OR: [{ source: { not: 'user' } }, { visibility: 'public' }, { ownerUserId: viewerId }],
  } satisfies Prisma.ClassWhereInput;
}

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

/** The refusal for a class a party's pool doesn't offer. */
export const classNotAvailable = (message: string) => apiError(409, 'CLASS_NOT_AVAILABLE', message);

/** Whether a party may offer a class version: available, and usable by the party's owner. */
export function mayOffer(row: ClassVersionRef, partyOwnerId: string | null): boolean {
  return isAvailable(row) && mayUse(row, partyOwnerId);
}

/**
 * Whether a viewer may open a class version's detail page: moderators always; others while it is
 * available and theirs to use, or enabled in the pool of a party they play in. `pooledForViewer`
 * is only asked when nothing else decides.
 */
export async function mayRead(
  row: ClassVersionRef,
  viewer: { userId: string | null; moderator: boolean; pooledForViewer: () => Promise<boolean> }
): Promise<boolean> {
  if (viewer.moderator) {
    return true;
  }
  if (!isAvailable(row)) {
    return false;
  }
  return mayUse(row, viewer.userId) || viewer.pooledForViewer();
}

/** Whether anyone may report a class version: any Built-in Class, or a Public Custom Class still up. */
export function isReportable(row: Pick<ClassVersionRef, 'source' | 'visibility' | 'takenDownAt'>): boolean {
  return row.source !== 'user' || (row.visibility === 'public' && row.takenDownAt === null);
}

/** Every version of each lineage, with its latest one. */
export function byLineage<T extends Pick<ClassVersionRef, 'lineageId' | 'version'>>(
  rows: T[]
): Array<{ latest: T; versions: T[] }> {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    groups.set(row.lineageId, [...(groups.get(row.lineageId) ?? []), row]);
  }
  return [...groups.values()].map((versions) => ({
    latest: versions.reduce((a, b) => (b.version > a.version ? b : a)),
    versions,
  }));
}
