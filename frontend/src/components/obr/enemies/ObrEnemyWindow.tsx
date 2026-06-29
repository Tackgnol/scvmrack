import OBR from "@owlbear-rodeo/sdk";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useObrRole } from "@/hooks/useObrRole";
import { useObrEnemies } from "@/obr/useObrEnemies";
import { EmptyEnemies, EnemyShell } from "../ObrEnemies.styles";
import { EnemyEditorForm } from "./EnemyEditorForm";
import { toObrEnemy } from "./enemyForm";
import { EnemySummaryCard } from "./EnemySummaryCard";

export function ObrEnemyWindow({
  enemyId = getObrEnemyId(),
}: {
  enemyId?: string | null;
}) {
  const { t } = useTranslation();
  const role = useObrRole();
  const [roomId, setRoomId] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    OBR.onReady(() => {
      if (active) {
        setRoomId(OBR.room.id);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const state = useObrEnemies({ mode: "gm", roomId });
  const enemy = state.enemies.find((item) => item.id === enemyId);

  if (!enemyId) {
    return (
      <EnemyShell as="main">
        <EmptyEnemies role="status">
          {t("obr.enemies.missingId", "Missing enemy id")}
        </EmptyEnemies>
      </EnemyShell>
    );
  }

  if (!roomId || !state.isReady) {
    return (
      <EnemyShell as="main">
        <EmptyEnemies role="status">
          {t("obr.enemies.loading", "Loading enemies")}
        </EmptyEnemies>
      </EnemyShell>
    );
  }

  if (state.error || !enemy) {
    return (
      <EnemyShell as="main">
        <EmptyEnemies role="status">
          {state.error
            ? t("obr.enemies.loadFailed", "Could not load enemies")
            : t("obr.enemies.notFound", "Enemy not found")}
        </EmptyEnemies>
      </EnemyShell>
    );
  }

  if (!role) {
    return (
      <EnemyShell as="main">
        <EmptyEnemies role="status">
          {t("obr.enemies.loading", "Loading enemies")}
        </EmptyEnemies>
      </EnemyShell>
    );
  }

  if (role === "GM") {
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
              await OBR.notification.show(
                t("obr.enemies.saveSuccess", "Enemy saved"),
                "SUCCESS",
              );
            } catch (saveError) {
              setActionError(
                toMessage(
                  saveError,
                  t("obr.enemies.saveFailed", "Could not save enemy"),
                ),
              );
            }
          }}
        />
        {actionError && <EmptyEnemies role="alert">{actionError}</EmptyEnemies>}
      </EnemyShell>
    );
  }

  return (
    <EnemyShell as="main">
      <EnemySummaryCard enemy={enemy} />
    </EnemyShell>
  );
}

function getObrEnemyId(search = window.location.search): string | null {
  const id = new URLSearchParams(search).get("id")?.trim();
  return id ? id : null;
}

function toMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
