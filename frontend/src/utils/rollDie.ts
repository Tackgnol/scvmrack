import { OSRandomEngine, Roller } from "@tackgnol/rpg-tools-roller";

/** The dice a weapon, gear effect, stat or hit points can roll. */
export const DIE_FACES = [2, 4, 6, 8, 10, 12] as const;

const roller = new Roller({ engine: new OSRandomEngine() });

/** Rolls one die with the given number of faces. */
export async function rollDie(faces: number): Promise<number> {
  return (await roller.roll(`1d${faces}`)).total;
}
