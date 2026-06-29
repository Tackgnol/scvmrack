import { useCharacter } from "@/CharacterContext/CharacterContext";
import { CharacterSheet } from "@/components/organisms/CharacterSheet";
import { ObrTokenBar } from "./ObrTokenBar";
import { ObrPartyRoster } from "./ObrPartyRoster";
import { ObrAuthedPicker } from "./ObrAuthedPicker";
import { ObrEnemiesGmSlot, ObrEnemiesPlayerSlot } from "./ObrEnemiesSlot";
import { ObrUnavailableState } from "./ObrUnavailableState";
import { useObrRole } from "@/hooks/useObrRole";
import { broadcastCharacterCardChanged } from "@/obr/roster";
import { useObrSession } from "@/hooks/useObrSession";
import { getApiLocale } from "@/hooks/utils";
import { PathsApiCharactersGetParametersQueryLocale } from "@/api/schema";
import { Button } from "@mui/material";
import OBR from "@owlbear-rodeo/sdk";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  BrandTitle,
  Centered,
  ErrorText,
  Hint,
  Panel,
  Spinner,
} from "./ObrCharacterRoute.styles";

// The OBR panel body. Auth-aware empty state (the detection keys off this
// iframe's OWN partitioned session, never a silent Logto peek), then the real
// CharacterSheet once a character is active.
export function ObrCharacterRoute() {
  const role = useObrRole();
  const { t } = useTranslation();

  if (OBR.isAvailable === false || !hasObrReference()) {
    return <ObrUnavailableState />;
  }

  if (role === null) {
    return (
      <Centered>
        <Spinner
          aria-label={t("obr.route.checkingRole", "Checking Owlbear role")}
        />
      </Centered>
    );
  }

  if (role === "GM") {
    return (
      <>
        <ObrPartyRoster />
        <ObrEnemiesGmSlot />
      </>
    );
  }

  return <ObrPlayerCharacterRoute />;
}

function hasObrReference(): boolean {
  return new URLSearchParams(window.location.search).has("obrref");
}

function ObrPlayerCharacterRoute() {
  const { i18n, t } = useTranslation();
  const { character, setCharacterId, generateNew } = useCharacter();
  const { isLoading, isAuthenticated, signIn } = useObrSession();
  const [signInError, setSignInError] = useState<string | null>(null);
  const lastCardPulseRef = useRef<{
    characterId: string;
    updatedAt: string;
  } | null>(null);

  // Guests hold a single scvm, so a fresh roll must replace it or the BE 409s
  // (SCVM_ALREADY_EXISTS). Authenticated accounts keep their full roster, so
  // they create alongside.
  const rollNew = () =>
    generateNew(undefined, isAuthenticated ? undefined : { replace: true });

  useEffect(() => {
    const characterId = character?.id;
    const updatedAt = character?.updatedAt;
    if (!characterId || !updatedAt) return;

    const previous = lastCardPulseRef.current;
    lastCardPulseRef.current = { characterId, updatedAt };

    if (
      !previous ||
      previous.characterId !== characterId ||
      previous.updatedAt === updatedAt
    ) {
      return;
    }

    void broadcastCharacterCardChanged(characterId);
  }, [character?.id, character?.updatedAt]);

  // A character is active — OBR token-bind strip above the real sheet.
  if (character) {
    return (
      <>
        <ObrEnemiesPlayerSlot characterId={character.id ?? null} />
        {character.id && (
          <ObrTokenBar
            characterId={character.id}
            characterName={character.name ?? "Scvm"}
          />
        )}
        <CharacterSheet
          stamping={false}
          onGenerateNew={rollNew}
          onKillScvm={() => generateNew(undefined, { replace: true })}
        />
      </>
    );
  }

  if (isLoading) {
    return (
      <Centered>
        <Spinner />
      </Centered>
    );
  }

  async function handleSignIn() {
    setSignInError(null);
    try {
      await signIn();
    } catch (e) {
      const reason = e instanceof Error ? e.message : "failed";
      setSignInError(
        reason === "popup-blocked"
          ? t(
              "obr.player.popupBlocked",
              "Allow the sign-in popup, then try again.",
            )
          : t("obr.player.signInFailed", "Sign-in did not complete."),
      );
    }
  }

  return (
    <>
      <ObrEnemiesPlayerSlot characterId={null} />
      <Centered>
        <Panel>
          <BrandTitle>Scvmrack</BrandTitle>

          {isAuthenticated ? (
            <ObrAuthedPicker
              locale={getApiLocale<PathsApiCharactersGetParametersQueryLocale>(
                i18n.language,
              )}
              onPick={(id) => void setCharacterId(id)}
              onRollNew={rollNew}
            />
          ) : (
            <>
              <Hint>
                {t(
                  "obr.player.emptyHint",
                  "Roll a wretch to play right now, or sign in to load your warband.",
                )}
              </Hint>
              <Button fullWidth variant="contained" onClick={rollNew}>
                {t("obr.player.rollScvm", "Roll a scvm")}
              </Button>
              <Button fullWidth variant="outlined" onClick={handleSignIn}>
                {t("obr.player.signIn", "Sign in")}
              </Button>
              {signInError && <ErrorText>{signInError}</ErrorText>}
            </>
          )}
        </Panel>
      </Centered>
    </>
  );
}
