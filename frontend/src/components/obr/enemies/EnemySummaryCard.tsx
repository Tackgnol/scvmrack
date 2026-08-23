import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  isFullObrEnemy,
  resolveEnemyStatus,
  translateEnemyStatusLabel,
  type ObrEnemyView,
} from "@/obr/enemies";
import {
  EnemyActionRow,
  EnemyCard,
  EnemyCardTop,
  EnemyDetailBox,
  EnemyDetailGrid,
  EnemyDetailLabel,
  EnemyDetailValue,
  EnemyEntryDescription,
  EnemyEntryList,
  EnemyEntryName,
  EnemyEntryRow,
  EnemyEntryValue,
  EnemyHealthFill,
  EnemyHealthTrack,
  EnemyListItem,
  EnemyMeta,
  EnemyName,
  EnemySectionLabel,
  EnemyStatus,
  EnemyVisibleDescription,
} from "../ObrEnemies.styles";

export function EnemySummaryCard({
  enemy,
  actions = null,
}: {
  enemy: ObrEnemyView;
  actions?: ReactNode;
}) {
  const { t } = useTranslation();
  const status = resolveEnemyStatus(enemy);
  const statusLabel = translateEnemyStatusLabel(status, t);
  const tone = getHealthTone(enemy.healthPercent);
  const fullEnemy = isFullObrEnemy(enemy) ? enemy : null;
  const isDetailed = Boolean(actions && fullEnemy);
  const publicMeta = [enemy.type, enemy.habitat].filter(Boolean).join(" / ");
  const armorText = [fullEnemy?.armorDie, fullEnemy?.armorDescription]
    .filter(Boolean)
    .join(" / ");
  const gmDescription = fullEnemy?.description.trim() ?? "";
  const playerDescription = enemy.playerDescription.trim();

  return (
    <EnemyListItem>
      <EnemyCard>
        <EnemyCardTop>
          <EnemyName>{enemy.name}</EnemyName>
          <EnemyStatus $tone={tone}>{statusLabel}</EnemyStatus>
        </EnemyCardTop>
        {publicMeta && <EnemyMeta>{publicMeta}</EnemyMeta>}

        <div>
          <EnemyHealthTrack
            role="progressbar"
            aria-label={t("obr.enemies.healthProgress", "{{name}} health", {
              name: enemy.name,
            })}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={enemy.healthPercent}
          >
            <EnemyHealthFill $value={clampHealth(enemy.healthPercent)} />
          </EnemyHealthTrack>
          <EnemyMeta>
            <span>
              {t("obr.enemies.healthMeta", "{{value}}% health", {
                value: enemy.healthPercent,
              })}
            </span>
            {isDetailed && (
              <span>
                {t("obr.enemies.hpMeta", "{{current}}/{{max}} HP", {
                  current: fullEnemy?.currentHealth ?? 0,
                  max: fullEnemy?.maxHealth ?? 0,
                })}
              </span>
            )}
          </EnemyMeta>
        </div>

        {isDetailed && (
          <>
            <EnemyDetailGrid>
              <EnemyDetailBox>
                <EnemyDetailLabel>
                  {t("obr.enemies.moraleLabel", "Morale")}
                </EnemyDetailLabel>
                <EnemyDetailValue>{fullEnemy?.morale}</EnemyDetailValue>
              </EnemyDetailBox>
              <EnemyDetailBox>
                <EnemyDetailLabel>
                  {t("obr.enemies.armorLabel", "Armor")}
                </EnemyDetailLabel>
                <EnemyDetailValue>{armorText || "-"}</EnemyDetailValue>
              </EnemyDetailBox>
            </EnemyDetailGrid>

            {fullEnemy && fullEnemy.attacks.length > 0 && (
              <div>
                <EnemySectionLabel>
                  {t("obr.enemies.attacksTitle", "Attacks")}
                </EnemySectionLabel>
                <EnemyEntryList
                  aria-label={t(
                    "obr.enemies.attacksLabel",
                    "{{name}} attacks",
                    { name: enemy.name },
                  )}
                >
                  {fullEnemy.attacks.map((attack) => (
                    <EnemyEntryRow key={attack.id}>
                      <EnemyEntryName>{attack.name}</EnemyEntryName>
                      {attack.die && (
                        <EnemyEntryValue>{attack.die}</EnemyEntryValue>
                      )}
                    </EnemyEntryRow>
                  ))}
                </EnemyEntryList>
              </div>
            )}

            {fullEnemy && fullEnemy.specials.length > 0 && (
              <div>
                <EnemySectionLabel>
                  {t("obr.enemies.specialsTitle", "Special skills")}
                </EnemySectionLabel>
                <EnemyEntryList
                  aria-label={t(
                    "obr.enemies.specialsLabel",
                    "{{name}} special skills",
                    { name: enemy.name },
                  )}
                >
                  {fullEnemy.specials.map((special) => (
                    <EnemyEntryRow key={special.id}>
                      <div>
                        <EnemyEntryName>{special.name}</EnemyEntryName>
                        {special.description && (
                          <EnemyEntryDescription>
                            {special.description}
                          </EnemyEntryDescription>
                        )}
                      </div>
                    </EnemyEntryRow>
                  ))}
                </EnemyEntryList>
              </div>
            )}

            {gmDescription && (
              <DescriptionBlock
                label={t("obr.enemies.gmDescriptionLabel", "GM description")}
                text={gmDescription}
              />
            )}

            {playerDescription && (
              <DescriptionBlock
                label={t(
                  "obr.enemies.playerDescriptionLabel",
                  "Player description",
                )}
                text={playerDescription}
              />
            )}

            {fullEnemy && fullEnemy.loot.length > 0 && (
              <div>
                <EnemySectionLabel>
                  {t("obr.enemies.lootTitle", "Loot & bounty")}
                </EnemySectionLabel>
                <EnemyEntryList
                  aria-label={t("obr.enemies.lootLabel", "{{name}} loot", {
                    name: enemy.name,
                  })}
                >
                  {fullEnemy.loot.map((loot) => (
                    <EnemyEntryRow key={loot.id}>
                      <EnemyEntryName>{loot.label}</EnemyEntryName>
                      {loot.value && (
                        <EnemyEntryValue>{loot.value}</EnemyEntryValue>
                      )}
                    </EnemyEntryRow>
                  ))}
                </EnemyEntryList>
              </div>
            )}
          </>
        )}

        {playerDescription && !isDetailed && (
          <EnemyVisibleDescription>{playerDescription}</EnemyVisibleDescription>
        )}

        {actions && <EnemyActionRow>{actions}</EnemyActionRow>}
      </EnemyCard>
    </EnemyListItem>
  );
}

function DescriptionBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <EnemySectionLabel>{label}</EnemySectionLabel>
      <EnemyVisibleDescription>{text}</EnemyVisibleDescription>
    </div>
  );
}

function getHealthTone(healthPercent: number): "good" | "warn" | "bad" {
  if (healthPercent <= 25) {
    return "bad";
  }

  if (healthPercent <= 75) {
    return "warn";
  }

  return "good";
}

function clampHealth(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}
