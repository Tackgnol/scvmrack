import type { TFunction } from "i18next";
import {
  getUserFacingApiErrorMessage,
  isApiUnauthorized,
} from "@/utils/errorUtils";
import type { CharacterLoadIssue } from "./CharacterLoadErrorModals.models";

export function getCharacterLoadErrorCopy(
  issue: CharacterLoadIssue,
  error: unknown,
  t: TFunction,
) {
  if (issue === "session-required") {
    return {
      title: t("characters.sessionRequiredTitle", "Sign in to open this Scvm"),
      body: t(
        "characters.sessionRequiredDescription",
        "No active session was found in this browser. Return to Start and sign in to open this Scvm.",
      ),
    };
  }
  if (issue === "not-found") {
    return {
      title: t("characters.notFound"),
      body: t("characters.notFoundDescription"),
    };
  }
  if (issue === "access-denied") {
    return {
      title: t("characters.accessDenied", "You don't have access to this scvm"),
      body: t(
        "characters.accessDeniedDescription",
        "This scvm belongs to another session or account. Generate a new one or open one of yours.",
      ),
    };
  }
  return {
    title: isApiUnauthorized(error)
      ? t("errors.unauthorizedTitle", "Session expired")
      : t("characters.loadError", "Failed to load character"),
    body: getUserFacingApiErrorMessage(error, t, "Failed to load character"),
  };
}
