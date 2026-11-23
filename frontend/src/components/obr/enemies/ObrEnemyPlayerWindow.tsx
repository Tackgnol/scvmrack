import { useTranslation } from "react-i18next";
import { useObrEnemies } from "@/obr/useObrEnemies";
import { EnemyShell } from "../ObrEnemies.styles";
import { enemyLoadStatus } from "./enemyLoadStatus";
import { EnemyStatusScreen } from "./EnemyStatusScreen";
import { EnemySummaryCard } from "./EnemySummaryCard";
import type { ObrEnemyPlayerWindowProps } from "./ObrEnemyPlayerWindow.models";

export function ObrEnemyPlayerWindow({
  enemyId,
  roomId,
  characterId,
}: ObrEnemyPlayerWindowProps) {
  const { t } = useTranslation();
  const state = useObrEnemies({ mode: "player", roomId, characterId });
  const enemy = state.enemies.find((item) => item.id === enemyId);

  if (!characterId) {
    return (
      <EnemyStatusScreen
        message={t(
          "obr.enemies.playerCharacterRequired",
          "Load your scvm before viewing enemy cards.",
        )}
      />
    );
  }

  const status = enemyLoadStatus(state, Boolean(enemy), t);
  if (status !== null || !enemy) {
    return <EnemyStatusScreen message={status ?? ""} />;
  }

  return (
    <EnemyShell as="main">
      <EnemySummaryCard enemy={enemy} />
    </EnemyShell>
  );
}
