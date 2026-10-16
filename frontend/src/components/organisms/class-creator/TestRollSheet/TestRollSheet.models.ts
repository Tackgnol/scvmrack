import type { CharacterResponse } from "@/hooks/models";

export type TestRollSheetProps = {
  scvm: CharacterResponse;
  className: string;
  /** The draft changed since this roll. */
  stale: boolean;
  /** Another blocking message is showing; the stale notice steps back to ink. */
  quiet: boolean;
};
