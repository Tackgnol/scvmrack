import { useTranslation } from "react-i18next";
import { type ObrEnemiesPlayerState } from "@/obr/useObrEnemies";
import {
  EmptyEnemies,
  EnemyHeader,
  EnemyList,
  EnemyShell,
  EnemySubhead,
  EnemyTitle,
} from "../ObrEnemies.styles";
import { EnemySummaryCard } from "./EnemySummaryCard";

export function ObrEnemyPlayerPanel({
  enemies,
  isReady,
  error,
}: ObrEnemiesPlayerState) {
  const { t } = useTranslation();

  if (!isReady || enemies.length === 0) {
    return null;
  }

  return (
    <EnemyShell aria-label={t("obr.enemies.playerRegion", "Enemy view")}>
      <EnemyHeader>
        <div>
          <EnemyTitle>
            {t("obr.enemies.playerTitle", "Enemies {{count}}", {
              count: enemies.length,
            })}
          </EnemyTitle>
          <EnemySubhead>
            {t("obr.enemies.playerSubhead", "Known threats")}
          </EnemySubhead>
        </div>
      </EnemyHeader>
      {error ? (
        <EmptyEnemies role="status">
          {t("obr.enemies.loadFailed", "Could not load enemies")}
        </EmptyEnemies>
      ) : (
        <EnemyList>
          {enemies.map((enemy) => (
            <EnemySummaryCard key={enemy.id} enemy={enemy} />
          ))}
        </EnemyList>
      )}
    </EnemyShell>
  );
}
