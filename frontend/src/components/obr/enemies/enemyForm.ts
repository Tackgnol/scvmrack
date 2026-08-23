import { z } from "zod";
import {
  createEnemyRowId,
  createEnemyStatusId,
  createObrEnemyId,
  DEFAULT_ENEMY_STATUS_BANDS,
  toHealthPercent,
  type ObrEnemy,
} from "@/obr/enemies";

const enemyStatusFormSchema = z.object({
  id: z.string().trim().min(1),
  percent: z.coerce.number().int().min(1).max(100),
  label: z.string().trim().min(1).max(48),
});

const enemyAttackFormSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().max(80),
  die: z.string().trim().max(24).default(""),
});

const enemySpecialFormSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().max(80),
  description: z.string().trim().max(240).default(""),
});

const enemyLootFormSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().max(60),
  value: z.string().trim().max(60).default(""),
});

export const enemyFormSchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: z.string().trim().max(80).default(""),
  habitat: z.string().trim().max(120).default(""),
  description: z.string().trim().max(500).default(""),
  playerDescription: z.string().trim().max(500).default(""),
  currentHealth: z.coerce.number().int().min(0).max(999),
  maxHealth: z.coerce.number().int().min(1).max(999),
  morale: z.coerce.number().int().min(0).max(99),
  armorDie: z.string().trim().max(24).default(""),
  armorDescription: z.string().trim().max(120).default(""),
  attacks: z.array(enemyAttackFormSchema).max(8),
  specials: z.array(enemySpecialFormSchema).max(8),
  loot: z.array(enemyLootFormSchema).max(8),
  statuses: z.array(enemyStatusFormSchema).min(1).max(8),
});

export type EnemyFormInput = z.input<typeof enemyFormSchema>;
export type EnemyFormValues = z.output<typeof enemyFormSchema>;

export function getDefaultEnemyFormValues(): EnemyFormValues {
  const maxHealth = 8;
  return {
    name: "",
    type: "",
    habitat: "",
    description: "",
    playerDescription: "",
    currentHealth: maxHealth,
    maxHealth,
    morale: 7,
    armorDie: "-d2",
    armorDescription: "",
    attacks: [createEmptyAttack()],
    specials: [createEmptySpecial()],
    loot: [
      { id: createEnemyRowId(), label: "Head", value: "" },
      { id: createEnemyRowId(), label: "Captured", value: "" },
      { id: createEnemyRowId(), label: "Killed", value: "" },
    ],
    statuses: DEFAULT_ENEMY_STATUS_BANDS.map((band) => ({ ...band })),
  };
}

export function toEnemyFormValues(enemy: ObrEnemy): EnemyFormValues {
  return {
    name: enemy.name,
    type: enemy.type,
    habitat: enemy.habitat,
    description: enemy.description,
    playerDescription: enemy.playerDescription,
    currentHealth: enemy.currentHealth,
    maxHealth: enemy.maxHealth,
    morale: enemy.morale,
    armorDie: enemy.armorDie,
    armorDescription: enemy.armorDescription,
    attacks:
      enemy.attacks.length > 0
        ? enemy.attacks.map((attack) => ({ ...attack }))
        : [createEmptyAttack()],
    specials:
      enemy.specials.length > 0
        ? enemy.specials.map((special) => ({ ...special }))
        : [createEmptySpecial()],
    loot:
      enemy.loot.length > 0
        ? enemy.loot.map((loot) => ({ ...loot }))
        : [createEmptyLoot()],
    statuses: enemy.statuses.map((band) => ({ ...band })),
  };
}

export function toObrEnemy(
  values: EnemyFormValues,
  enemyId?: string,
): ObrEnemy {
  const currentHealth = clampCurrentHealth(
    values.currentHealth,
    values.maxHealth,
  );
  return {
    id: enemyId ?? createObrEnemyId(),
    name: values.name,
    type: values.type,
    habitat: values.habitat,
    description: values.description,
    playerDescription: values.playerDescription,
    currentHealth,
    healthPercent: toHealthPercent(currentHealth, values.maxHealth),
    maxHealth: values.maxHealth,
    morale: values.morale,
    armorDie: values.armorDie,
    armorDescription: values.armorDescription,
    attacks: values.attacks
      .filter((attack) => attack.name.trim().length > 0)
      .map((attack) => ({
        id: attack.id || createEnemyRowId(),
        name: attack.name,
        die: attack.die,
      })),
    specials: values.specials
      .filter((special) => special.name.trim().length > 0)
      .map((special) => ({
        id: special.id || createEnemyRowId(),
        name: special.name,
        description: special.description,
      })),
    loot: values.loot
      .filter(
        (loot) => loot.label.trim().length > 0 || loot.value.trim().length > 0,
      )
      .map((loot) => ({
        id: loot.id || createEnemyRowId(),
        label: loot.label.trim() || "Loot",
        value: loot.value,
      })),
    statuses: values.statuses.map((status) => ({
      id: status.id || createEnemyStatusId(),
      percent: status.percent,
      label: status.label,
    })),
  };
}

export function createEmptyAttack() {
  return { id: createEnemyRowId(), name: "", die: "d4" };
}

export function createEmptySpecial() {
  return { id: createEnemyRowId(), name: "", description: "" };
}

export function createEmptyLoot() {
  return { id: createEnemyRowId(), label: "", value: "" };
}

export function clampCurrentHealth(value: number, maxHealth: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(
    Math.max(1, Math.round(maxHealth)),
    Math.max(0, Math.round(value)),
  );
}
