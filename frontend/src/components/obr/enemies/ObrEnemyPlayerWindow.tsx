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

  const load = enemyLoadStatus(
    state,
    state.enemies.find((item) => item.id === enemyId),
    t,
  );
  if ("message" in load) {
    return <EnemyStatusScreen message={load.message} />;
  }

  return (
    <EnemyShell as="main">
      <EnemySummaryCard enemy={load.enemy} />
    </EnemyShell>
  );
}
