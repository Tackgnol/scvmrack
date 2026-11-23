import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useOwlbear } from "@/obr/owlbear";
import { useObrEnemies } from "@/obr/useObrEnemies";
import { EmptyEnemies, EnemyShell } from "../ObrEnemies.styles";
import { enemyErrorMessage } from "./enemyErrorMessage";
import { EnemyEditorForm } from "./EnemyEditorForm";
import { toObrEnemy } from "./enemyForm";
import { enemyLoadStatus } from "./enemyLoadStatus";
import { EnemyStatusScreen } from "./EnemyStatusScreen";
import type { ObrEnemyGmWindowProps } from "./ObrEnemyGmWindow.models";

export function ObrEnemyGmWindow({ enemyId, roomId }: ObrEnemyGmWindowProps) {
  const { t } = useTranslation();
  const owlbear = useOwlbear();
  const [actionError, setActionError] = useState<string | null>(null);
  const state = useObrEnemies({ mode: "gm", roomId });
  const enemy = state.enemies.find((item) => item.id === enemyId);
  const status = enemyLoadStatus(state, Boolean(enemy), t);

  if (status !== null || !enemy) {
    return <EnemyStatusScreen message={status ?? ""} />;
  }

  return (
    <EnemyShell as="main">
      <EnemyEditorForm
        key={enemy.id}
        enemy={enemy}
        title={t("obr.enemies.editTitle", "Edit enemy")}
        onSubmit={async (values) => {
          setActionError(null);
          try {
            await state.saveEnemy(toObrEnemy(values, enemy.id));
            await owlbear.notify(
              t("obr.enemies.saveSuccess", "Enemy saved"),
              "SUCCESS",
            );
          } catch (saveError) {
            setActionError(
              enemyErrorMessage(
                saveError,
                t("obr.enemies.saveFailed", "Could not save enemy"),
                t,
              ),
            );
          }
        }}
      />
      {actionError && <EmptyEnemies role="alert">{actionError}</EmptyEnemies>}
    </EnemyShell>
  );
}
