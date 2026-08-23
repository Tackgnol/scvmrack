import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import LinkIcon from "@mui/icons-material/Link";
import RemoveIcon from "@mui/icons-material/Remove";
import OBR from "@owlbear-rodeo/sdk";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { rebindTokenToEnemy, type ObrEnemy } from "@/obr/enemies";
import { cloneEnemy } from "@/obr/enemyClone";
import { useEnemyTokens } from "@/obr/useEnemyTokens";
import { type ObrEnemiesGmState } from "@/obr/useObrEnemies";
import {
  EmptyEnemies,
  EnemyButton,
  EnemyDangerButton,
  EnemyHeader,
  EnemyList,
  EnemyShell,
  EnemySubhead,
  EnemyTitle,
} from "../ObrEnemies.styles";
import { EnemyEditorForm } from "./EnemyEditorForm";
import {
  clampCurrentHealth,
  toObrEnemy,
  type EnemyFormValues,
} from "./enemyForm";
import { enemyErrorMessage } from "./enemyErrorMessage";
import { EnemySummaryCard } from "./EnemySummaryCard";

export function ObrEnemyManager({
  enemies,
  isReady,
  error,
  saveEnemy,
  deleteEnemy,
  updateEnemyHealth,
  bindEnemy,
}: ObrEnemiesGmState & {
  bindEnemy: (enemy: ObrEnemy) => Promise<number>;
}) {
  const { t } = useTranslation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEnemy, setEditingEnemy] = useState<ObrEnemy | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const enemiesRef = useRef(enemies);
  useEffect(() => {
    enemiesRef.current = enemies;
  });
  // Names handed out to clones this session; the enemies query can lag a
  // burst of copies, so this keeps "Skeleton 2/3/4" from colliding.
  const cloneNamesRef = useRef<string[]>([]);
  const copyQueueRef = useRef<Promise<void> | null>(null);

  async function handleClone(enemy: ObrEnemy): Promise<ObrEnemy | null> {
    setActionError(null);
    try {
      const clone = cloneEnemy(enemy, [
        ...enemiesRef.current.map((existing) => existing.name),
        ...cloneNamesRef.current,
      ]);
      cloneNamesRef.current.push(clone.name);
      return await saveEnemy(clone);
    } catch (cloneError) {
      setActionError(
        enemyErrorMessage(
          cloneError,
          t("obr.enemies.cloneFailed", "Could not clone enemy"),
          t,
        ),
      );
      return null;
    }
  }

  async function handleTokenCopied(enemyId: string, itemId: string) {
    const source = enemiesRef.current.find((enemy) => enemy.id === enemyId);
    if (!source) {
      return;
    }
    const clone = await handleClone(source);
    if (clone) {
      await rebindTokenToEnemy(itemId, clone);
    }
  }

  const tokensByEnemy = useEnemyTokens((enemyId, itemId) => {
    copyQueueRef.current = (copyQueueRef.current ?? Promise.resolve())
      .then(() => handleTokenCopied(enemyId, itemId))
      .catch(() => {});
  });

  async function handleSelectTokens(enemy: ObrEnemy) {
    const tokenIds = tokensByEnemy.get(enemy.id) ?? [];
    if (tokenIds.length > 0) {
      await OBR.player.select(tokenIds, true);
    }
  }

  function openCreateForm() {
    setActionError(null);
    setEditingEnemy(null);
    setIsFormOpen(true);
  }

  function openEditForm(enemy: ObrEnemy) {
    setActionError(null);
    setEditingEnemy(enemy);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingEnemy(null);
  }

  async function submitEnemy(values: EnemyFormValues) {
    setActionError(null);
    try {
      await saveEnemy(toObrEnemy(values, editingEnemy?.id));
      closeForm();
    } catch (saveError) {
      setActionError(
        enemyErrorMessage(
          saveError,
          t("obr.enemies.saveFailed", "Could not save enemy"),
          t,
        ),
      );
    }
  }

  async function handleDelete(enemy: ObrEnemy) {
    setActionError(null);
    try {
      await deleteEnemy(enemy.id);
      if (editingEnemy?.id === enemy.id) {
        closeForm();
      }
    } catch (deleteError) {
      setActionError(
        enemyErrorMessage(
          deleteError,
          t("obr.enemies.deleteFailed", "Could not delete enemy"),
          t,
        ),
      );
    }
  }

  async function handleBind(enemy: ObrEnemy) {
    setActionError(null);
    try {
      const count = await bindEnemy(enemy);
      if (count === 0) {
        await OBR.notification.show(
          t("obr.enemies.selectTokenFirst", "Select a token on the map first"),
          "WARNING",
        );
        return;
      }

      await OBR.notification.show(
        count === 1
          ? t("obr.enemies.bindSuccessOne", "Bound {{name}} to 1 token", {
              name: enemy.name,
            })
          : t(
              "obr.enemies.bindSuccessMany",
              "Bound {{name}} to {{count}} tokens",
              {
                name: enemy.name,
                count,
              },
            ),
        "SUCCESS",
      );
    } catch (bindError) {
      const message = enemyErrorMessage(
        bindError,
        t("obr.enemies.bindFailed", "Could not bind enemy"),
        t,
      );
      setActionError(message);
      await OBR.notification.show(message, "ERROR");
    }
  }

  async function stepHealth(enemy: ObrEnemy, deltaHealth: number) {
    setActionError(null);
    try {
      const nextHealth = clampCurrentHealth(
        enemy.currentHealth + deltaHealth,
        enemy.maxHealth,
      );
      await updateEnemyHealth(enemy.id, nextHealth);
    } catch (healthError) {
      setActionError(
        enemyErrorMessage(
          healthError,
          t("obr.enemies.healthFailed", "Could not update health"),
          t,
        ),
      );
    }
  }

  return (
    <EnemyShell aria-label={t("obr.enemies.gmRegion", "GM enemies")}>
      <EnemyHeader>
        <div>
          <EnemyTitle>
            {t("obr.enemies.gmTitle", "GM enemies {{count}}", {
              count: enemies.length,
            })}
          </EnemyTitle>
          <EnemySubhead>
            {t("obr.enemies.gmSubhead", "Table threats")}
          </EnemySubhead>
        </div>
        <EnemyButton
          type="button"
          onClick={openCreateForm}
          startIcon={<AddIcon />}
        >
          {t("obr.enemies.newEnemy", "New enemy")}
        </EnemyButton>
      </EnemyHeader>

      {isFormOpen && (
        <EnemyEditorForm
          key={editingEnemy?.id ?? "new-enemy"}
          enemy={editingEnemy}
          title={
            editingEnemy
              ? t("obr.enemies.editTitle", "Edit enemy")
              : t("obr.enemies.createTitle", "Add enemy")
          }
          onSubmit={submitEnemy}
          onCancel={closeForm}
        />
      )}

      {actionError && <EmptyEnemies role="alert">{actionError}</EmptyEnemies>}
      {error && (
        <EmptyEnemies role="status">
          {enemyErrorMessage(
            error,
            t("obr.enemies.loadFailed", "Could not load enemies"),
            t,
          )}
        </EmptyEnemies>
      )}
      {!isReady && (
        <EmptyEnemies role="status">
          {t("obr.enemies.loading", "Loading enemies")}
        </EmptyEnemies>
      )}
      {isReady && !error && enemies.length === 0 && (
        <EmptyEnemies role="status">
          {t("obr.enemies.emptyGm", "No enemies yet. Add one for the table.")}
        </EmptyEnemies>
      )}
      {isReady && enemies.length > 0 && (
        <EnemyList>
          {enemies.map((enemy) => (
            <EnemySummaryCard
              key={enemy.id}
              enemy={enemy}
              actions={
                <>
                  <EnemyButton
                    type="button"
                    onClick={() => void stepHealth(enemy, -1)}
                    startIcon={<RemoveIcon />}
                  >
                    {t("obr.enemies.damage", "Damage 1 HP")}
                  </EnemyButton>
                  <EnemyButton
                    type="button"
                    onClick={() => void stepHealth(enemy, 1)}
                    startIcon={<AddIcon />}
                  >
                    {t("obr.enemies.heal", "Heal 1 HP")}
                  </EnemyButton>
                  <EnemyButton
                    type="button"
                    onClick={() => void handleBind(enemy)}
                    startIcon={<LinkIcon />}
                  >
                    {t("obr.enemies.bindToken", "Bind token")}
                  </EnemyButton>
                  {(tokensByEnemy.get(enemy.id)?.length ?? 0) > 0 && (
                    <EnemyButton
                      type="button"
                      onClick={() => void handleSelectTokens(enemy)}
                      startIcon={<GpsFixedIcon />}
                    >
                      {t("obr.enemies.selectToken", "Select token")}
                    </EnemyButton>
                  )}
                  <EnemyButton
                    type="button"
                    onClick={() => void handleClone(enemy)}
                    startIcon={<ContentCopyIcon />}
                  >
                    {t("obr.enemies.clone", "Clone")}
                  </EnemyButton>
                  <EnemyButton
                    type="button"
                    onClick={() => openEditForm(enemy)}
                    startIcon={<EditIcon />}
                  >
                    {t("obr.enemies.edit", "Edit")}
                  </EnemyButton>
                  <EnemyDangerButton
                    type="button"
                    onClick={() => void handleDelete(enemy)}
                    startIcon={<DeleteIcon />}
                  >
                    {t("obr.enemies.delete", "Delete")}
                  </EnemyDangerButton>
                </>
              }
            />
          ))}
        </EnemyList>
      )}
    </EnemyShell>
  );
}
