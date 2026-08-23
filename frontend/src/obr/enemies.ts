import OBR, { type ContextMenuContext } from "@owlbear-rodeo/sdk";
import {
  bindEnemyToSelection as bindEnemyToSelectionCore,
  broadcastEnemiesChanged as broadcastEnemiesChangedCore,
  createEnemyRowId,
  createEnemyStatusId,
  createObrEnemyId,
  DEFAULT_ENEMY_STATUS_BANDS,
  enemiesChannel,
  enemyMetaKey,
  getContextEnemyId as getContextEnemyIdCore,
  isObrEnemiesBroadcast as isObrEnemiesBroadcastCore,
  normalizeStatusBands,
  resolveEnemyStatus,
  toHealthPercent,
  translateEnemyStatusLabel,
  type ObrEnemiesBroadcast,
} from "@tackgnol/rpgtools-owlbear";
import type { EnemyCard, EnemyFull } from "@/api/enemies";
import { scvmrackObrExtension } from "./extension";

export const ENEMY_META_KEY = enemyMetaKey(scvmrackObrExtension);
export const OBR_ENEMIES_CHANNEL = enemiesChannel(scvmrackObrExtension);

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
export type { ObrEnemiesBroadcast };

export {
  DEFAULT_ENEMY_STATUS_BANDS,
  createObrEnemyId,
  createEnemyStatusId,
  createEnemyRowId,
  normalizeStatusBands,
  toHealthPercent,
};

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

export { resolveEnemyStatus, translateEnemyStatusLabel };

export async function bindEnemyToSelection(enemy: ObrEnemy): Promise<number> {
  return bindEnemyToSelectionCore(scvmrackObrExtension, OBR, enemy);
}

type EnemyTokenText = {
  plainText: string;
  richText: Array<{ type: "paragraph"; children: Array<{ text: string }> }>;
  type: "PLAIN" | "RICH";
};

// Mirrors the package's bind-time token naming for a single known item id.
export async function rebindTokenToEnemy(
  itemId: string,
  enemy: { id: string; name: string },
): Promise<void> {
  await OBR.scene.items.updateItems([itemId], (items) => {
    for (const item of items) {
      item.metadata[ENEMY_META_KEY] = enemy.id;
      item.name = enemy.name;
      const token = item as typeof item & {
        text?: EnemyTokenText;
        textItemType?: "LABEL" | "TEXT";
      };
      if (!token.text) {
        continue;
      }
      token.text.plainText = enemy.name;
      token.text.richText = [
        { type: "paragraph", children: [{ text: enemy.name }] },
      ];
      token.text.type = "PLAIN";
      token.textItemType = "LABEL";
    }
  });
}

export function getContextEnemyId(
  context: Pick<ContextMenuContext, "items">,
): string | null {
  return getContextEnemyIdCore(scvmrackObrExtension, context);
}

export function isObrEnemiesBroadcast(
  data: unknown,
): data is ObrEnemiesBroadcast {
  return isObrEnemiesBroadcastCore(data);
}

export async function broadcastEnemiesChanged(): Promise<void> {
  await broadcastEnemiesChangedCore(scvmrackObrExtension, OBR);
}
