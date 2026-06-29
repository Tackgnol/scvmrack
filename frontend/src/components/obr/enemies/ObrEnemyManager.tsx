import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import LinkIcon from "@mui/icons-material/Link";
import RemoveIcon from "@mui/icons-material/Remove";
import OBR from "@owlbear-rodeo/sdk";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { type ObrEnemy } from "@/obr/enemies";
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
        toMessage(
          saveError,
          t("obr.enemies.saveFailed", "Could not save enemy"),
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
        toMessage(
          deleteError,
          t("obr.enemies.deleteFailed", "Could not delete enemy"),
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
      const message = toMessage(
        bindError,
        t("obr.enemies.bindFailed", "Could not bind enemy"),
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
        toMessage(
          healthError,
          t("obr.enemies.healthFailed", "Could not update health"),
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
          {t("obr.enemies.loadFailed", "Could not load enemies")}
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

function toMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
