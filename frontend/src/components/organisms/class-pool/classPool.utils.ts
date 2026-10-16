import type { TFunction } from "i18next";
import type { PoolClass, PoolGroup } from "@/api/classPool";
import type { PoolSwitch } from "@/hooks/useClassPool";
import type {
  PoolFilter,
  PoolGroupSection,
  PoolSearch,
} from "./classPool.models";

export const GROUP_ORDER: PoolGroup[] = ["book", "zine", "rack", "mine", "public"];

/** The groups each filter shows; picking a filter also opens them. */
export const FILTER_GROUPS: Record<Exclude<PoolFilter, "all">, PoolGroup[]> = {
  book: ["book"],
  zr: ["zine", "rack"],
  mine: ["mine"],
  public: ["public"],
};

function searchText(c: PoolClass): string {
  const a = c.attribution;
  const who =
    a?.kind === "credit" ? `${a.work} ${a.author}` : a?.kind === "owner" ? a.name : "";
  return `${c.name} ${c.blurb ?? ""} ${who ?? ""}`.toLowerCase();
}

/** The non-empty groups after search, filter and language, with each group's on/total. */
export function poolSections(
  classes: PoolClass[],
  search: PoolSearch,
): PoolGroupSection[] {
  const text = search.text.trim().toLowerCase();
  const matches = (c: PoolClass) =>
    (search.filter === "all" || FILTER_GROUPS[search.filter].includes(c.group)) &&
    (search.language === "any" || c.languages.includes(search.language)) &&
    (!text || searchText(c).includes(text));

  return GROUP_ORDER.map((group) => {
    const all = classes.filter((c) => c.group === group);
    return {
      group,
      shown: all.filter(matches),
      total: all.length,
      on: all.filter((c) => c.enabled).length,
    };
  }).filter((section) => section.shown.length > 0);
}

/** Classes switched on, per group, in group order (empty groups left out). */
export function poolTally(classes: PoolClass[]): Array<[PoolGroup, number]> {
  return GROUP_ORDER.map(
    (group): [PoolGroup, number] => [
      group,
      classes.filter((c) => c.group === group && c.enabled).length,
    ],
  ).filter(([, n]) => n > 0);
}

/** The row's "from X by Y" / "created by …" line, or null for Book classes. */
export function attributionText(t: TFunction, c: PoolClass): string | null {
  const a = c.attribution;
  if (!a) {
    return null;
  }
  if (a.kind === "credit") {
    return t("classPool.attribution.credit", "from {{work}} by {{author}}", {
      work: a.work,
      author: a.author,
    });
  }
  if (c.group === "mine") {
    return a.private
      ? t("classPool.attribution.minePrivate", "created by you · private")
      : t("classPool.attribution.mine", "created by you");
  }
  return a.name
    ? t("classPool.attribution.owner", "created by {{name}}", { name: a.name })
    : t("classPool.attribution.ownerFormer", "created by a former GM");
}

/** "English and Polish" for a class's languages. */
export function languageNames(t: TFunction, languages: string[]): string {
  return languages
    .map((l) => t(`classPool.languageNames.${l}`, l.toUpperCase()))
    .join(t("classPool.languageJoin", " and "));
}

/** The status line once a switch has saved. */
export function savedMessage(t: TFunction, change: PoolSwitch): string {
  if (change.kind === "classless") {
    return change.enabled
      ? t("classPool.status.classlessOn", "Classless on. Saved.")
      : t("classPool.status.classlessOff", "Classless off. Saved.");
  }
  return change.enabled
    ? t("classPool.status.added", "{{name}} added to the pool. Saved.", { name: change.name })
    : t("classPool.status.removed", "{{name}} removed from the pool. Saved.", {
        name: change.name,
      });
}
