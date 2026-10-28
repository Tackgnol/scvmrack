import type { PartyEventBus } from '../plugins/party-bus.js';
import { characterRepository } from '../repositories/character-repository.js';

/** Notify every current audience without changing the scvm's party or bindings. */
export async function publishCharacterUpdated(
  bus: PartyEventBus | undefined,
  characterId: string,
  fields: string[]
): Promise<void> {
  if (!bus) {
    return;
  }
  const partyIds = await characterRepository.getUpdatePartyIds(characterId);
  for (const partyId of partyIds) {
    bus.publish(partyId, { type: 'character.updated', characterId, fields });
  }
}
