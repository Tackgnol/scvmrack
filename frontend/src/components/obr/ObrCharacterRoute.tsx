import { useCharacter } from "@/CharacterContext/CharacterContext";
import { CharacterSheet } from "@/components/organisms/CharacterSheet";
import { ObrTokenBar } from "./ObrTokenBar";
import { ObrOpenInScvmrackButton } from "./ObrOpenInScvmrackButton";
import { ObrAuthedPicker } from "./ObrAuthedPicker";
import { ObrGmView } from "./ObrGmView";
import { ObrUnavailableState } from "./ObrUnavailableState";
import { useObrRole } from "@/hooks/useObrRole";
import {
  broadcastCharacterCardChanged,
  getCurrentObrRoomActor,
  isObrRosterBroadcast,
  persistCurrentObrCharacterId,
  restoreCurrentObrCharacterId,
  rosterChannel,
} from "@tackgnol/rpgtools-owlbear";
import { scvmrackObrExtension } from "@/obr/extension";
import {
  claimAssignedObrCharacter,
  obrRoomBindingsClient,
} from "@/obr/obrApiClient";
import { useObrSession } from "@/obr/useObrSession";
import { getApiLocale, getCharacterKey } from "@/hooks/utils";
import { PathsApiCharactersGetParametersQueryLocale } from "@/api/schema";
import { Button } from "@mui/material";
import OBR from "@owlbear-rodeo/sdk";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  BrandTitle,
  Centered,
  ErrorText,
  Hint,
  Panel,
  PlayerSheetShell,
  PlayerToolbar,
  Spinner,
} from "./ObrCharacterRoute.styles";

const FORGE_SCVM_PATH = "/character/create";

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
    return <ObrGmView />;
  }

  return <ObrPlayerCharacterRoute />;
}

function hasObrReference(): boolean {
  return new URLSearchParams(window.location.search).has("obrref");
}

function ObrPlayerCharacterRoute() {
  const { i18n, t } = useTranslation();
  const { character, setCharacterId, generateNew } = useCharacter();
  const { isLoading, isAuthenticated, signIn, issueObrExchangeToken } =
    useObrSession();
  const queryClient = useQueryClient();
  const locale = getApiLocale<PathsApiCharactersGetParametersQueryLocale>(
    i18n.language,
  );
  const characterId = character?.id ?? null;
  const [signInError, setSignInError] = useState<string | null>(null);
  const [isRestoringCharacter, setIsRestoringCharacter] = useState(true);
  const restoreCheckedRef = useRef(false);
  const restoreInFlightRef = useRef(false);
  const restoreAssignedCharacterRef = useRef<(force?: boolean) => Promise<void>>(
    async () => {},
  );
  const setCharacterIdRef = useRef(setCharacterId);
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
    setCharacterIdRef.current = setCharacterId;
  }, [setCharacterId]);

  useEffect(() => {
    restoreAssignedCharacterRef.current = async (force = false) => {
      if (characterId) {
        restoreCheckedRef.current = true;
        setIsRestoringCharacter(false);
        return;
      }

      if (restoreInFlightRef.current) return;
      if (!force && restoreCheckedRef.current) return;

      restoreInFlightRef.current = true;
      setIsRestoringCharacter(true);

      try {
        const storedCharacterId = await restoreCurrentObrCharacterId(
          scvmrackObrExtension,
          OBR,
          obrRoomBindingsClient,
        );

        if (storedCharacterId) {
          let selectedCharacterId = storedCharacterId;

          try {
            const actor = await getCurrentObrRoomActor(OBR);
            const claimedCharacter = await claimAssignedObrCharacter({
              roomId: actor.roomId,
              playerId: actor.playerId,
              locale,
            });
            const claimedCharacterId = claimedCharacter.id?.trim();

            if (claimedCharacterId) {
              selectedCharacterId = claimedCharacterId;
              queryClient.setQueryData(
                getCharacterKey(claimedCharacterId, locale),
                claimedCharacter,
              );
            }
          } catch {
            // Existing player metadata can still point at a character the current
            // session owns. Claiming is only required for GM-assigned scvms.
          }

          await setCharacterIdRef.current(selectedCharacterId);
        }
      } catch {
        // Missing or unreadable OBR metadata should fall through to the normal
        // roll/sign-in empty state.
      }

      restoreCheckedRef.current = true;
      restoreInFlightRef.current = false;
      setIsRestoringCharacter(false);
    };
  }, [characterId, locale, queryClient]);

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (active) {
        void restoreAssignedCharacterRef.current();
      }
    });

    return () => {
      active = false;
    };
  }, [characterId, locale, queryClient]);

  useEffect(() => {
    let active = true;
    let unsubscribeBroadcast: (() => void) | null = null;

    OBR.onReady(() => {
      if (!active) return;

      unsubscribeBroadcast = OBR.broadcast.onMessage(
        rosterChannel(scvmrackObrExtension),
        (event) => {
          const message = isObrRosterBroadcast(event.data) ? event.data : null;
          if (message?.kind !== "roster") return;

          restoreCheckedRef.current = false;
          queueMicrotask(() => {
            if (active) {
              void restoreAssignedCharacterRef.current(true);
            }
          });
        },
      );
    });

    return () => {
      active = false;
      unsubscribeBroadcast?.();
    };
  }, []);

  useEffect(() => {
    if (characterId) {
      restoreCheckedRef.current = true;
      setIsRestoringCharacter(false);
    }
  }, [characterId]);

  useEffect(() => {
    const characterId = character?.id?.trim();
    if (!characterId) return;

    void persistCurrentObrCharacterId(
      scvmrackObrExtension,
      OBR,
      obrRoomBindingsClient,
      characterId,
    ).catch(() => {
      // Browser/session storage still has the active character. Player metadata
      // and backend room binding are recovery hints, so failure here should not
      // block play.
    });
  }, [character?.id]);

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

    void broadcastCharacterCardChanged(scvmrackObrExtension, OBR, characterId);
  }, [character?.id, character?.updatedAt]);

  // A character is active — OBR token-bind strip above the real sheet.
  if (character) {
    return (
      <PlayerSheetShell>
        {character.id && (
          <PlayerToolbar>
            <ObrTokenBar
              characterId={character.id}
              characterName={character.name ?? "Scvm"}
            />
            {isAuthenticated && (
              <ObrOpenInScvmrackButton
                characterId={character.id}
                issueObrExchangeToken={issueObrExchangeToken}
              />
            )}
          </PlayerToolbar>
        )}
        <CharacterSheet
          stamping={false}
          onGenerateNew={rollNew}
          onKillScvm={() => generateNew(undefined, { replace: true })}
        />
      </PlayerSheetShell>
    );
  }

  if (isLoading || isRestoringCharacter) {
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
      <Centered>
        <Panel>
          <BrandTitle>Scvmrack</BrandTitle>

          {isAuthenticated ? (
            <ObrAuthedPicker
              locale={locale}
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
              <Button
                fullWidth
                variant="outlined"
                href={FORGE_SCVM_PATH}
                target="_blank"
                rel="noreferrer"
              >
                {t("obr.player.forgeScvm", "Forge scvm")}
              </Button>
              <Button fullWidth variant="outlined" onClick={handleSignIn}>
                {t("obr.player.signIn", "Login")}
              </Button>
              {signInError && <ErrorText>{signInError}</ErrorText>}
            </>
          )}
        </Panel>
      </Centered>
    </>
  );
}
