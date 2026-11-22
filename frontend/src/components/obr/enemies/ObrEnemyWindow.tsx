import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useObrRole } from "@/hooks/useObrRole";
import { restorePlayerCharacterId } from "@/obr/roomCharacterBinding";
import { useObrRoomId } from "@/obr/useObrRoomId";
import { EnemyStatusScreen } from "./EnemyStatusScreen";
import { ObrEnemyGmWindow } from "./ObrEnemyGmWindow";
import { ObrEnemyPlayerWindow } from "./ObrEnemyPlayerWindow";

export function ObrEnemyWindow({
  enemyId = getSearchParam("id"),
  roomId: initialRoomId = getSearchParam("room"),
  characterId: initialCharacterId = getSearchParam("character"),
}: {
  enemyId?: string | null;
  roomId?: string | null;
  characterId?: string | null;
}) {
  const { t } = useTranslation();
  const role = useObrRole();
  const readyRoomId = useObrRoomId();
  const roomId = initialRoomId?.trim() || readyRoomId;
  const [playerCharacterId, setPlayerCharacterId] = useState(
    initialCharacterId?.trim() || null,
  );
  const [
    hasAttemptedPlayerCharacterRestore,
    setHasAttemptedPlayerCharacterRestore,
  ] = useState(Boolean(initialCharacterId?.trim()));

  useEffect(() => {
    if (
      role !== "PLAYER" ||
      playerCharacterId ||
      hasAttemptedPlayerCharacterRestore
    ) {
      return;
    }

    let active = true;
    void restorePlayerCharacterId()
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
      <EnemyStatusScreen
        message={t("obr.enemies.missingId", "Missing enemy id")}
      />
    );
  }

  const isRestoringPlayerCharacter =
    role === "PLAYER" &&
    !playerCharacterId &&
    !hasAttemptedPlayerCharacterRestore;

  if (!roomId || !role || isRestoringPlayerCharacter) {
    return (
      <EnemyStatusScreen message={t("obr.enemies.loading", "Loading enemies")} />
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

function getSearchParam(
  name: string,
  search = window.location.search,
): string | null {
  return new URLSearchParams(search).get(name)?.trim() || null;
}
