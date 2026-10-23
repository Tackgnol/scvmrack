import { obrBindingsDb } from '../lib/obr-bindings-db.js';
import { characterRepository } from '../repositories/character-repository.js';
import { isValidUUID } from '../utils.js';
import { gmUserId, hasObrWriteSession, ownsCharacter, type AppSession } from './session.js';

/** Character owners and the signed-in owner of this room's attached party may manage bindings. */
export async function canManageObrBinding(
  session: AppSession,
  characterId: string,
  roomId: string
): Promise<boolean> {
  if (!hasObrWriteSession(session) || !isValidUUID(characterId) || !roomId) {
    return false;
  }
  const row = await characterRepository.getObrBindingAccessContext(characterId);
  if (!row) {
    return false;
  }
  if (ownsCharacter(session, row)) {
    return true;
  }
  const ownerId = gmUserId(session);
  return ownerId !== null && row.party?.ownerUserId === ownerId && row.party.obrRoomId === roomId;
}

/**
 * A scvm is visible in an Owlbear room when it is either explicitly bound to a
 * room player/token or belongs to the party attached to that room.
 */
export async function filterVisibleCharacterIdsInObrRoom(
  ids: string[],
  roomId: string
): Promise<string[]> {
  const uniqueIds = [...new Set(ids.filter(isValidUUID))];
  if (uniqueIds.length === 0) {
    return [];
  }

  const [bound, partyMembers] = await Promise.all([
    obrBindingsDb.filterCharacterIdsInRoom(uniqueIds, roomId),
    characterRepository.filterCharacterIdsInRoomParty(uniqueIds, roomId),
  ]);

  const visible = new Set([...bound, ...partyMembers]);
  return uniqueIds.filter((id) => visible.has(id));
}

export async function filterAdditionalVisibleCharacterIdsInObrRoom(
  ids: string[],
  roomId: string
): Promise<string[]> {
  const uniqueIds = [...new Set(ids.filter(isValidUUID))];
  if (uniqueIds.length === 0) {
    return [];
  }
  const partyMembers = await characterRepository.filterCharacterIdsInRoomParty(
    uniqueIds,
    roomId
  );
  const partyMemberSet = new Set(partyMembers);
  return uniqueIds.filter((id) => partyMemberSet.has(id));
}

export async function isCharacterVisibleInObrRoom(
  characterId: string,
  roomId: string
): Promise<boolean> {
  const visible = await filterVisibleCharacterIdsInObrRoom([characterId], roomId);
  return visible.length > 0;
}

export async function canUseCharacterInObrRoom(
  session: AppSession,
  characterId: string,
  roomId: string
): Promise<boolean> {
  if (!isValidUUID(characterId)) {
    return false;
  }

  const row = await characterRepository.getPartyAccessContext(characterId);
  if (!row) {
    return false;
  }

  if (ownsCharacter(session, row)) {
    return true;
  }
  return isCharacterVisibleInObrRoom(characterId, roomId);
}
