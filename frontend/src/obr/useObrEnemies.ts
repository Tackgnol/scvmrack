import { useObrEnemies as useObrEnemiesCore } from "@tackgnol/rpgtools-owlbear/react-query";
import OBR from "@owlbear-rodeo/sdk";
import {
  createEnemy,
  deleteEnemy as deleteEnemyApi,
  fetchEnemiesFull,
  fetchEnemyCards,
  setEnemyHealth as setEnemyHealthApi,
  updateEnemy,
  type EnemyInput,
} from "@/api/enemies";
import { scvmrackObrExtension } from "@/obr/extension";
import type { ObrEnemy, ObrEnemyCard } from "./enemies";

type GmOptions = { mode: "gm"; roomId: string };
type PlayerOptions = { mode: "player"; roomId: string; characterId: string | null };
type Options = GmOptions | PlayerOptions;
type GmCoreOptions = Parameters<
  typeof useObrEnemiesCore<ObrEnemy, EnemyInput>
>[0];
type PlayerCoreOptions = Parameters<typeof useObrEnemiesCore<ObrEnemyCard>>[0];
type CoreOptions = GmCoreOptions | PlayerCoreOptions;

type BaseState<TEnemy> = {
  enemies: TEnemy[];
  isReady: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

export type ObrEnemiesGmState = BaseState<ObrEnemy> & {
  saveEnemy: (enemy: ObrEnemy) => Promise<ObrEnemy>;
  deleteEnemy: (enemyId: string) => Promise<void>;
  updateEnemyHealth: (
    enemyId: string,
    currentHealth: number,
  ) => Promise<ObrEnemy>;
};

export type ObrEnemiesPlayerState = BaseState<ObrEnemyCard>;

export function useObrEnemies(options: GmOptions): ObrEnemiesGmState;
export function useObrEnemies(options: PlayerOptions): ObrEnemiesPlayerState;
export function useObrEnemies(
  options: Options,
): ObrEnemiesGmState | ObrEnemiesPlayerState {
  const coreOptions =
    options.mode === "gm" ? toGmCoreOptions(options) : toPlayerCoreOptions(options);

  return useTypedObrEnemiesCore(coreOptions);
}

function useTypedObrEnemiesCore(
  coreOptions: CoreOptions,
): ObrEnemiesGmState | ObrEnemiesPlayerState {
  // The package exposes overloads, so a union of GM/player options needs one adapter cast.
  return useObrEnemiesCore(coreOptions as never) as
    | ObrEnemiesGmState
    | ObrEnemiesPlayerState;
}

function toGmCoreOptions(options: GmOptions): GmCoreOptions {
  return {
    ...baseCoreOptions(options.roomId),
    mode: "gm",
    fetchEnemiesFull,
    fetchEnemyCards,
    createEnemy,
    updateEnemy,
    setEnemyHealth: setEnemyHealthApi,
    deleteEnemy: deleteEnemyApi,
    toEnemyInput,
  };
}

function toPlayerCoreOptions(options: PlayerOptions): PlayerCoreOptions {
  return {
    ...baseCoreOptions(options.roomId),
    mode: "player",
    characterId: options.characterId,
    fetchEnemiesFull: fetchEnemiesFullUnusedInPlayerMode,
    fetchEnemyCards,
  };
}

function baseCoreOptions(roomId: string) {
  return {
    ext: scvmrackObrExtension,
    obr: OBR,
    roomId,
  } satisfies Pick<GmCoreOptions, "ext" | "obr" | "roomId">;
}

function fetchEnemiesFullUnusedInPlayerMode(): Promise<ObrEnemyCard[]> {
  // Required by the 0.1.0 player options type; player mode never calls it.
  return Promise.resolve([]);
}

function toEnemyInput(enemy: ObrEnemy): EnemyInput {
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
    attacks: enemy.attacks,
    specials: enemy.specials,
    loot: enemy.loot,
    statuses: enemy.statuses,
  };
}
