import OBR, { type ContextMenuContext } from "@owlbear-rodeo/sdk";
import type { EnemyCard, EnemyFull, EnemyStatusBand } from "@/api/enemies";
import { EXTENSION_ID } from "./extension";

export const ENEMY_META_KEY = `${EXTENSION_ID}/enemyId`;
export const OBR_ENEMIES_CHANNEL = `${EXTENSION_ID}/enemies`;

export type {
  EnemyAttack,
  EnemyCard,
  EnemyFull,
  EnemyLoot,
  EnemySpecial,
  EnemyStatusBand,
} from "@/api/enemies";

export type ObrEnemy = Omit<EnemyFull, "partyId"> & { partyId?: string };
export type ObrEnemyCard = EnemyCard;
export type ObrEnemyView = ObrEnemy | ObrEnemyCard;
export type ObrEnemiesBroadcast = { kind: "enemies" };

type EnemyBindableItem = ContextMenuContext["items"][number] & {
  text?: {
    plainText: string;
    richText: Array<{
      type: "paragraph";
      children: Array<{ text: string }>;
    }>;
    type: "PLAIN" | "RICH";
  };
  textItemType?: "LABEL" | "TEXT";
};

export const DEFAULT_ENEMY_STATUS_BANDS: EnemyStatusBand[] = [
  { id: "healthy", percent: 100, label: "Healthy" },
  { id: "wounded", percent: 75, label: "Wounded" },
  { id: "severely-wounded", percent: 50, label: "Severely wounded" },
  { id: "deaths-door", percent: 25, label: "At death's door" },
];

const DEFAULT_ENEMY_STATUS_TRANSLATIONS: Record<
  string,
  { key: string; label: string }
> = {
  healthy: { key: "obr.enemies.status.healthy", label: "Healthy" },
  wounded: { key: "obr.enemies.status.wounded", label: "Wounded" },
  "severely-wounded": {
    key: "obr.enemies.status.severelyWounded",
    label: "Severely wounded",
  },
  "deaths-door": {
    key: "obr.enemies.status.deathsDoor",
    label: "At death's door",
  },
};

type StatusTranslator = (key: string, fallback: string) => string;

export function createObrEnemyId(): string {
  return createStableId("enemy");
}

export function createEnemyStatusId(): string {
  return createStableId("status");
}

export function createEnemyRowId(): string {
  return createStableId("row");
}

export function isFullObrEnemy(enemy: ObrEnemyView): enemy is ObrEnemy {
  return (
    "maxHealth" in enemy &&
    "morale" in enemy &&
    "attacks" in enemy &&
    "specials" in enemy &&
    "loot" in enemy &&
    "statuses" in enemy
  );
}

export function normalizeStatusBands(
  bands: EnemyStatusBand[] | undefined,
): EnemyStatusBand[] {
  const normalized = (bands ?? [])
    .filter((band): band is EnemyStatusBand => {
      return (
        typeof band.id === "string" &&
        typeof band.label === "string" &&
        typeof band.percent === "number" &&
        Number.isFinite(band.percent)
      );
    })
    .map((band) => ({
      id: band.id.trim(),
      percent: clampPercent(band.percent, 1),
      label: band.label.trim(),
    }))
    .filter((band) => band.id && band.label)
    .sort((left, right) => left.percent - right.percent);

  return normalized.length > 0 ? normalized : DEFAULT_ENEMY_STATUS_BANDS;
}

export function resolveEnemyStatus(enemy: ObrEnemyView): EnemyStatusBand {
  if ("statusLabel" in enemy && enemy.statusLabel.trim()) {
    return {
      id: enemy.statusId || "safe-card-status",
      percent: clampPercent(enemy.healthPercent, 0),
      label: enemy.statusLabel.trim(),
    };
  }

  const healthPercent = clampPercent(enemy.healthPercent, 0);
  const bands = normalizeStatusBands(
    isFullObrEnemy(enemy) ? enemy.statuses : undefined,
  );

  return (
    bands.find((band) => healthPercent <= band.percent) ??
    bands[bands.length - 1] ??
    DEFAULT_ENEMY_STATUS_BANDS[0]
  );
}

export function translateEnemyStatusLabel(
  status: EnemyStatusBand,
  t: StatusTranslator,
): string {
  const defaultStatus = DEFAULT_ENEMY_STATUS_TRANSLATIONS[status.id];
  if (!defaultStatus || status.label !== defaultStatus.label) {
    return status.label;
  }

  return t(defaultStatus.key, defaultStatus.label);
}

export function toHealthPercent(
  currentHealth: number,
  maxHealth: number,
): number {
  const max = Math.max(1, Math.round(maxHealth));
  const current = Math.min(max, Math.max(0, Math.round(currentHealth)));
  return clampPercent((current / max) * 100, 0);
}

export async function bindEnemyToSelection(enemy: ObrEnemy): Promise<number> {
  const selection = (await OBR.player.getSelection()) ?? [];
  if (selection.length === 0) {
    return 0;
  }

  await OBR.scene.items.updateItems(selection, (items) => {
    for (const item of items) {
      item.metadata[ENEMY_META_KEY] = enemy.id;
      setEnemyTokenName(item, enemy.name);
    }
  });

  return selection.length;
}

export function getContextEnemyId(
  context: Pick<ContextMenuContext, "items">,
): string | null {
  const enemyId = context.items[0]?.metadata[ENEMY_META_KEY];
  return typeof enemyId === "string" && enemyId.trim() ? enemyId.trim() : null;
}

export function isObrEnemiesBroadcast(
  data: unknown,
): data is ObrEnemiesBroadcast {
  return (
    data !== null &&
    typeof data === "object" &&
    (data as Record<string, unknown>).kind === "enemies"
  );
}

export async function broadcastEnemiesChanged(): Promise<void> {
  await OBR.broadcast.sendMessage(
    OBR_ENEMIES_CHANNEL,
    { kind: "enemies" } satisfies ObrEnemiesBroadcast,
    { destination: "ALL" },
  );
}

function setEnemyTokenName(
  item: ContextMenuContext["items"][number],
  name: string,
): void {
  item.name = name;

  const token = item as EnemyBindableItem;
  if (!token.text) {
    return;
  }

  token.text.plainText = name;
  token.text.richText = [
    {
      type: "paragraph",
      children: [{ text: name }],
    },
  ];
  token.text.type = "PLAIN";
  token.textItemType = "LABEL";
}

function clampPercent(value: number, min: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(100, Math.max(min, Math.round(value)));
}

function createStableId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}
