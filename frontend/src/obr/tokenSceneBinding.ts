import OBR from "@owlbear-rodeo/sdk";
import { scvmrackObrExtension, unbindCharacterFromToken } from "./extension";

/** Clears a token's scvm binding from the scene only; server bindings are untouched. */
export async function unbindTokenInScene(tokenId: string): Promise<void> {
  await unbindCharacterFromToken(scvmrackObrExtension, OBR, tokenId);
}
