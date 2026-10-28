import type { PartyEventBus } from '../plugins/party-bus.js';
import { characterRepository } from '../repositories/character-repository.js';
import type { ServiceLogger } from './result.js';

/** Best-effort notification; a committed save remains successful if delivery fails. */
export async function publishCharacterUpdated(
  bus: PartyEventBus | undefined,
  characterId: string,
  fields: string[],
  log: ServiceLogger
): Promise<void> {
  if (!bus) {
    return;
  }
  let partyIds: string[];
  try {
    partyIds = await characterRepository.getUpdatePartyIds(characterId);
  } catch (err) {
    log.error({ err, characterId }, 'Saved character: failed to look up live-update audiences');
    return;
  }
  for (const partyId of partyIds) {
    try {
      bus.publish(partyId, { type: 'character.updated', characterId, fields });
    } catch (err) {
      log.error({ err, characterId, partyId }, 'Saved character: failed to publish live update');
    }
  }
}
