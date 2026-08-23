import OBR, { type Item } from "@owlbear-rodeo/sdk";
import { useEffect, useRef, useState } from "react";
import { ENEMY_META_KEY } from "@/obr/enemies";

const EMPTY_TOKENS: ReadonlyMap<string, string[]> = new Map();

/**
 * Tracks which scene tokens carry an enemy binding.
 *
 * Returns a map of enemyId -> bound token item ids. When a brand-new item
 * appears already carrying an enemy binding while another bound token for the
 * same enemy exists, it was copied/duplicated inside Owlbear and
 * `onTokenCopied` fires so the caller can clone the enemy and rebind.
 */
export function useEnemyTokens(
  onTokenCopied: (enemyId: string, itemId: string) => void,
): ReadonlyMap<string, string[]> {
  const [tokensByEnemy, setTokensByEnemy] =
    useState<ReadonlyMap<string, string[]>>(EMPTY_TOKENS);
  const onTokenCopiedRef = useRef(onTokenCopied);
  onTokenCopiedRef.current = onTokenCopied;

  useEffect(() => {
    let active = true;
    let knownItemIds: Set<string> | null = null;
    let unsubscribeItems: (() => void) | null = null;
    let unsubscribeSceneReady: (() => void) | null = null;

    const handleItems = (items: Item[]) => {
      if (!active) {
        return;
      }

      const next = new Map<string, string[]>();
      const freshTagged: Array<{ enemyId: string; itemId: string }> = [];
      for (const item of items) {
        const enemyId = item.metadata[ENEMY_META_KEY];
        if (typeof enemyId !== "string" || !enemyId) {
          continue;
        }
        next.set(enemyId, [...(next.get(enemyId) ?? []), item.id]);
        if (knownItemIds && !knownItemIds.has(item.id)) {
          freshTagged.push({ enemyId, itemId: item.id });
        }
      }

      knownItemIds = new Set(items.map((item) => item.id));
      setTokensByEnemy(next);

      for (const fresh of freshTagged) {
        // Only treat it as a copy when another token still holds the same
        // binding; a lone reappearing token (undo, cut/paste) keeps its enemy.
        if ((next.get(fresh.enemyId)?.length ?? 0) > 1) {
          onTokenCopiedRef.current(fresh.enemyId, fresh.itemId);
        }
      }
    };

    const seed = async () => {
      try {
        if (!(await OBR.scene.isReady()) || knownItemIds !== null) {
          return;
        }
        const items = await OBR.scene.items.getItems();
        // An onChange may have seeded the baseline while we awaited.
        if (knownItemIds === null) {
          handleItems(items);
        }
      } catch {
        // Scene unavailable; the onChange subscription seeds the baseline.
      }
    };

    OBR.onReady(() => {
      if (!active) {
        return;
      }
      void seed();
      unsubscribeItems = OBR.scene.items.onChange(handleItems);
      unsubscribeSceneReady = OBR.scene.onReadyChange((ready) => {
        knownItemIds = null;
        if (!ready) {
          setTokensByEnemy(EMPTY_TOKENS);
          return;
        }
        void seed();
      });
    });

    return () => {
      active = false;
      unsubscribeItems?.();
      unsubscribeSceneReady?.();
    };
  }, []);

  return tokensByEnemy;
}
