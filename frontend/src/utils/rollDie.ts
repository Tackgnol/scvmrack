import { OSRandomEngine, Roller } from "@tackgnol/rpg-tools-roller";

const roller = new Roller({ engine: new OSRandomEngine() });

/** Rolls one die with the given number of faces. */
export async function rollDie(faces: number): Promise<number> {
  return (await roller.roll(`1d${faces}`)).total;
}
