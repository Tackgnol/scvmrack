// Pure projections for enemy reads. GM/owner gets EnemyFull; players get
// EnemyCard (safe, table-visible). Allowlist only; never spread the row.
// Secret fields (morale, maxHealth, armor, attacks, specials, loot) must stay
// out of EnemyCard.

export interface EnemyAttack {
  id: string;
  name: string;
  die: string;
}

export interface EnemySpecial {
  id: string;
  name: string;
  description: string;
}

export interface EnemyLoot {
  id: string;
  label: string;
  value: string;
}

export interface EnemyStatusBand {
  id: string;
  percent: number;
  label: string;
}

export interface EnemyFull {
  id: string;
  partyId: string;
  name: string;
  type: string;
  habitat: string;
  description: string;
  playerDescription: string;
  currentHealth: number;
  healthPercent: number;
  maxHealth: number;
  morale: number;
  armorDie: string;
  armorDescription: string;
  attacks: EnemyAttack[];
  specials: EnemySpecial[];
  loot: EnemyLoot[];
  statuses: EnemyStatusBand[];
}

export interface EnemyCard {
  id: string;
  name: string;
  type: string;
  habitat: string;
  playerDescription: string;
  healthPercent: number;
  statusId: string;
  statusLabel: string;
}

export const DEFAULT_ENEMY_STATUS_BANDS: EnemyStatusBand[] = [
  { id: 'healthy', percent: 100, label: 'Healthy' },
  { id: 'wounded', percent: 75, label: 'Wounded' },
  { id: 'severely-wounded', percent: 50, label: 'Severely wounded' },
  { id: 'deaths-door', percent: 25, label: "At death's door" },
];

function asArray<T>(raw: unknown): T[] {
  return Array.isArray(raw) ? (raw as T[]) : [];
}

function clampPercent(value: unknown, min: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) {
    return min;
  }
  return Math.min(100, Math.max(min, Math.round(n)));
}

function clampInteger(
  value: unknown,
  min: number,
  max = Number.MAX_SAFE_INTEGER
): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) {
    return min;
  }
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function toHealthPercent(
  currentHealth: number,
  maxHealth: number
): number {
  const max = clampInteger(maxHealth, 1);
  return clampPercent((clampInteger(currentHealth, 0, max) / max) * 100, 0);
}

export function resolveEnemyStatusBand(
  healthPercent: number,
  statuses: EnemyStatusBand[]
): EnemyStatusBand {
  const bands = (statuses.length > 0 ? statuses : DEFAULT_ENEMY_STATUS_BANDS)
    .slice()
    .sort((a, b) => a.percent - b.percent);
  const hp = clampPercent(healthPercent, 0);
  const band = bands.find((b) => hp <= b.percent) ?? bands[bands.length - 1];
  return band ?? DEFAULT_ENEMY_STATUS_BANDS[0];
}

export function resolveEnemyStatusLabel(
  healthPercent: number,
  statuses: EnemyStatusBand[]
): string {
  return resolveEnemyStatusBand(healthPercent, statuses).label;
}

export function toEnemyFull(row: Record<string, unknown>): EnemyFull {
  const maxHealth = clampInteger(row.maxHealth, 1, 999);
  const currentHealth = clampInteger(row.currentHealth, 0, maxHealth);
  return {
    id: (row.id as string) ?? '',
    partyId: (row.partyId as string) ?? '',
    name: (row.name as string) ?? '',
    type: (row.type as string) ?? '',
    habitat: (row.habitat as string) ?? '',
    description: (row.description as string) ?? '',
    playerDescription: (row.playerDescription as string) ?? '',
    currentHealth,
    healthPercent: toHealthPercent(currentHealth, maxHealth),
    maxHealth,
    morale: Math.max(0, Math.round((row.morale as number) ?? 0)),
    armorDie: (row.armorDie as string) ?? '',
    armorDescription: (row.armorDescription as string) ?? '',
    attacks: asArray<EnemyAttack>(row.attacks),
    specials: asArray<EnemySpecial>(row.specials),
    loot: asArray<EnemyLoot>(row.loot),
    statuses: asArray<EnemyStatusBand>(row.statuses),
  };
}

export function toEnemyCard(row: Record<string, unknown>): EnemyCard {
  const statuses = asArray<EnemyStatusBand>(row.statuses);
  const maxHealth = clampInteger(row.maxHealth, 1, 999);
  const currentHealth = clampInteger(row.currentHealth, 0, maxHealth);
  const healthPercent = toHealthPercent(currentHealth, maxHealth);
  const status = resolveEnemyStatusBand(healthPercent, statuses);
  return {
    id: (row.id as string) ?? '',
    name: (row.name as string) ?? '',
    type: (row.type as string) ?? '',
    habitat: (row.habitat as string) ?? '',
    playerDescription: (row.playerDescription as string) ?? '',
    healthPercent,
    statusId: status.id,
    statusLabel: status.label,
  };
}
