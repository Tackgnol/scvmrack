import type { PartyEventBus } from '../plugins/party-bus.js';
import { characterRepository, type CharacterUpdateAudience } from '../repositories/character-repository.js';
import { notificationRepository } from '../repositories/notification-repository.js';
import type { ServiceLogger } from './result.js';

/** Best-effort notification; a committed save remains successful if delivery fails. */
export async function publishCharacterUpdates(
  bus: PartyEventBus | undefined,
  characterIds: readonly string[],
  fields: string[],
  log: ServiceLogger
): Promise<void> {
  if (!bus || characterIds.length === 0) {
    return;
  }
  let audiences: CharacterUpdateAudience[];
  try {
    audiences = await characterRepository.getUpdateAudiences(characterIds);
  } catch (err) {
    log.error({ err, characterIds }, 'Saved characters: failed to look up live-update audiences');
    notificationRepository.reportFailure('audience_lookup');
    return;
  }
  for (const { characterId, partyIds } of audiences) {
    for (const partyId of partyIds) {
      try {
        bus.publish(partyId, { type: 'character.updated', characterId, fields });
      } catch (err) {
        log.error({ err, characterId, partyId }, 'Saved character: failed to publish live update');
        notificationRepository.reportFailure('publish');
      }
    }
  }
}
