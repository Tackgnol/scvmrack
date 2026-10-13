import { useCharacter } from "@/CharacterContext/CharacterContext";
import { CharacterSheet } from "@/components/organisms/CharacterSheet";
import { ObrTokenBar } from "./ObrTokenBar";
import { ObrOpenInScvmrackButton } from "./ObrOpenInScvmrackButton";
import { ObrAuthedPicker } from "./ObrAuthedPicker";
import { ObrGmView } from "./ObrGmView";
import { ObrUnavailableState } from "./ObrUnavailableState";
import { ObrRollPicker } from "./ObrRollPicker/ObrRollPicker";
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
import { getApiErrorCode } from "@/utils/errorUtils";
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
  const locale = getApiLocale(
    i18n.language,
  );
  const characterId = character?.id ?? null;
  const [signInError, setSignInError] = useState<string | null>(null);
  const [forgeError, setForgeError] = useState<string | null>(null);
  const [rollError, setRollError] = useState<string | null>(null);
  const [rollPickerOpen, setRollPickerOpen] = useState(false);
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

  const openRollPicker = () => {
    setRollError(null);
    setRollPickerOpen(true);
  };

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

      if (restoreInFlightRef.current) {
        return;
      }
      if (!force && restoreCheckedRef.current) {
        return;
      }

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
    const refreshBinding = () => {
      restoreCheckedRef.current = false;
      void restoreAssignedCharacterRef.current(true);
    };
    window.addEventListener("focus", refreshBinding);
    return () => window.removeEventListener("focus", refreshBinding);
  }, []);
  useEffect(() => {
    let active = true;
    let unsubscribeBroadcast: (() => void) | null = null;

    OBR.onReady(() => {
      if (!active) {
        return;
      }

      unsubscribeBroadcast = OBR.broadcast.onMessage(
        rosterChannel(scvmrackObrExtension),
        (event) => {
          const message = isObrRosterBroadcast(event.data) ? event.data : null;
          if (message?.kind !== "roster") {
            return;
          }

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
    if (!characterId) {
      return;
    }

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
    if (!characterId || !updatedAt) {
      return;
    }

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
      <>
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
            onGenerateNew={openRollPicker}
            onKillScvm={openRollPicker}
          />
          {rollError && <ErrorText>{rollError}</ErrorText>}
        </PlayerSheetShell>
        <ObrRollPicker
          open={rollPickerOpen}
          roomId={OBR.room.id}
          locale={locale}
          onClose={() => setRollPickerOpen(false)}
          onChoose={(classId) => void handleRoomRoll(classId)}
        />
      </>
    );
  }

  if (isLoading || isRestoringCharacter) {
    return (
      <Centered>
        <Spinner />
      </Centered>
    );
  }

  async function handleRoomRoll(classId: number | null) {
    setRollPickerOpen(false);
    setRollError(null);
    try {
      const actor = await getCurrentObrRoomActor(OBR);
      generateNew(classId, {
        replace: !isAuthenticated,
        obrRoomId: actor.roomId,
        obrPlayerId: actor.playerId,
        onError: (error) => {
          const code = getApiErrorCode(error);
          if (code === "PARTY_FULL") {
            setRollError(
              t("obr.player.partyFull", "This room's party is full. Ask the GM to make room."),
            );
          } else if (code === "CLASS_NOT_AVAILABLE") {
            setRollPickerOpen(true);
          }
        },
      });
    } catch {
      setRollError(t("obr.player.rollFailed", "Could not roll a scvm. Try again."));
    }
  }
  async function handleForge() {
    setForgeError(null);
    try {
      const actor = await getCurrentObrRoomActor(OBR);
      const token = await issueObrExchangeToken();
      const params = new URLSearchParams({
        token,
        to: "forge",
        obrRoom: actor.roomId,
        obrPlayer: actor.playerId,
      });
      if (!window.open(`/obr-open?${params}`, "_blank", "noopener,noreferrer")) {
        throw new Error("popup-blocked");
      }
    } catch {
      setForgeError(
        t("obr.player.forgeFailed", "Could not open the forge. Allow popups and try again."),
      );
    }
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
              onRollNew={openRollPicker}
              onForge={() => void handleForge()}
            />
          ) : (
            <>
              <Hint>
                {t(
                  "obr.player.emptyHint",
                  "Roll a wretch to play right now, or sign in to load your warband.",
                )}
              </Hint>
              <Button fullWidth variant="contained" onClick={openRollPicker}>
                {t("obr.player.rollScvm", "Roll a scvm")}
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => void handleForge()}
              >
                {t("obr.player.forgeScvm", "Forge scvm")}
              </Button>
              <Button fullWidth variant="outlined" onClick={handleSignIn}>
                {t("obr.player.signIn", "Login")}
              </Button>
              {signInError && <ErrorText>{signInError}</ErrorText>}
              {forgeError && <ErrorText>{forgeError}</ErrorText>}
              {rollError && <ErrorText>{rollError}</ErrorText>}
            </>
          )}
        </Panel>
      </Centered>
      <ObrRollPicker
        open={rollPickerOpen}
        roomId={OBR.room.id}
        locale={locale}
        onClose={() => setRollPickerOpen(false)}
        onChoose={(classId) => void handleRoomRoll(classId)}
      />
    </>
  );
}
