import {
  getApiErrorCode,
  isApiNotFound,
  isApiUnauthorized,
} from "@/utils/errorUtils";

type Translate = (key: string, fallback: string) => string;

export function enemyErrorMessage(
  error: unknown,
  fallback: string,
  t: Translate,
): string {
  const code = getApiErrorCode(error);

  if (isApiUnauthorized(error) || code === "SESSION_REQUIRED") {
    return t(
      "obr.enemies.signInRequired",
      "Sign in to save enemies for this Owlbear room.",
    );
  }

  if (isApiNotFound(error) || code === "PARTY_NOT_FOUND") {
    return t(
      "obr.enemies.partyRequired",
      "Move this room to scvmrack before saving enemies.",
    );
  }

  return fallback;
}

export function enemyGateErrorMessage(
  error: unknown,
  fallback: string,
  t: Translate,
): string {
  const code = getApiErrorCode(error);

  if (isApiUnauthorized(error) || code === "SESSION_REQUIRED") {
    return t(
      "obr.enemies.signInRequired",
      "Sign in to save enemies for this Owlbear room.",
    );
  }

  if (code === "ROOM_ALREADY_PROMOTED") {
    return t(
      "obr.enemies.roomAlreadyPromoted",
      "This Owlbear room is already owned by another scvmrack GM.",
    );
  }

  return fallback;
}
