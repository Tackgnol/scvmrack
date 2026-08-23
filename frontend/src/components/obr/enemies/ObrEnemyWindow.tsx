import OBR from "@owlbear-rodeo/sdk";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useObrRole } from "@/hooks/useObrRole";
import { useObrEnemies } from "@/obr/useObrEnemies";
import { restoreCurrentObrCharacterId } from "@tackgnol/rpgtools-owlbear";
import { scvmrackObrExtension } from "@/obr/extension";
import { obrRoomBindingsClient } from "@/obr/obrApiClient";
import { EmptyEnemies, EnemyShell } from "../ObrEnemies.styles";
import { enemyErrorMessage } from "./enemyErrorMessage";
import { EnemyEditorForm } from "./EnemyEditorForm";
import { toObrEnemy } from "./enemyForm";
import { EnemySummaryCard } from "./EnemySummaryCard";

export function ObrEnemyWindow({
  enemyId = getObrEnemyId(),
  roomId: initialRoomId = getObrEnemyRoomId(),
  characterId: initialCharacterId = getObrEnemyCharacterId(),
}: {
  enemyId?: string | null;
  roomId?: string | null;
  characterId?: string | null;
}) {
  const { t } = useTranslation();
  const role = useObrRole();
  const [roomId, setRoomId] = useState(initialRoomId?.trim() ?? "");
  const [playerCharacterId, setPlayerCharacterId] = useState(
    initialCharacterId?.trim() || null,
  );
  const [
    hasAttemptedPlayerCharacterRestore,
    setHasAttemptedPlayerCharacterRestore,
  ] = useState(Boolean(initialCharacterId?.trim()));

  useEffect(() => {
    let active = true;
    OBR.onReady(() => {
      if (active && !roomId) {
        setRoomId(OBR.room.id);
      }
    });
    return () => {
      active = false;
    };
  }, [roomId]);

  useEffect(() => {
    if (
      role !== "PLAYER" ||
      playerCharacterId ||
      hasAttemptedPlayerCharacterRestore
    ) {
      return;
    }

    let active = true;
    void restoreCurrentObrCharacterId(
      scvmrackObrExtension,
      OBR,
      obrRoomBindingsClient,
    )
      .then((storedCharacterId) => {
        if (active && storedCharacterId) {
          setPlayerCharacterId(storedCharacterId);
        }
      })
      .catch(() => {
        // The player popover can still render a specific error state below.
      })
      .finally(() => {
        if (active) {
          setHasAttemptedPlayerCharacterRestore(true);
        }
      });

    return () => {
      active = false;
    };
  }, [hasAttemptedPlayerCharacterRestore, playerCharacterId, role]);

  if (!enemyId) {
    return (
      <EnemyShell as="main">
        <EmptyEnemies role="status">
          {t("obr.enemies.missingId", "Missing enemy id")}
        </EmptyEnemies>
      </EnemyShell>
    );
  }

  const isRestoringPlayerCharacter =
    role === "PLAYER" &&
    !playerCharacterId &&
    !hasAttemptedPlayerCharacterRestore;

  if (!roomId || !role || isRestoringPlayerCharacter) {
    return (
      <EnemyShell as="main">
        <EmptyEnemies role="status">
          {t("obr.enemies.loading", "Loading enemies")}
        </EmptyEnemies>
      </EnemyShell>
    );
  }

  if (role === "GM") {
    return <ObrEnemyGmWindow enemyId={enemyId} roomId={roomId} />;
  }

  return (
    <ObrEnemyPlayerWindow
      enemyId={enemyId}
      roomId={roomId}
      characterId={playerCharacterId}
    />
  );
}

function ObrEnemyGmWindow({
  enemyId,
  roomId,
}: {
  enemyId: string;
  roomId: string;
}) {
  const { t } = useTranslation();
  const [actionError, setActionError] = useState<string | null>(null);
  const state = useObrEnemies({ mode: "gm", roomId });
  const enemy = state.enemies.find((item) => item.id === enemyId);

  if (!state.isReady) {
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
            ? enemyErrorMessage(
                state.error,
                t("obr.enemies.loadFailed", "Could not load enemies"),
                t,
              )
            : t("obr.enemies.notFound", "Enemy not found")}
        </EmptyEnemies>
      </EnemyShell>
    );
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
            await OBR.notification.show(
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

function ObrEnemyPlayerWindow({
  enemyId,
  roomId,
  characterId,
}: {
  enemyId: string;
  roomId: string;
  characterId: string | null;
}) {
  const { t } = useTranslation();
  const state = useObrEnemies({ mode: "player", roomId, characterId });
  const enemy = state.enemies.find((item) => item.id === enemyId);

  if (!characterId) {
    return (
      <EnemyShell as="main">
        <EmptyEnemies role="status">
          {t(
            "obr.enemies.playerCharacterRequired",
            "Load your scvm before viewing enemy cards.",
          )}
        </EmptyEnemies>
      </EnemyShell>
    );
  }

  if (!state.isReady) {
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
            ? enemyErrorMessage(
                state.error,
                t("obr.enemies.loadFailed", "Could not load enemies"),
                t,
              )
            : t("obr.enemies.notFound", "Enemy not found")}
        </EmptyEnemies>
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

function getObrEnemyRoomId(search = window.location.search): string | null {
  const room = new URLSearchParams(search).get("room")?.trim();
  return room ? room : null;
}

function getObrEnemyCharacterId(search = window.location.search): string | null {
  const character = new URLSearchParams(search).get("character")?.trim();
  return character ? character : null;
}
