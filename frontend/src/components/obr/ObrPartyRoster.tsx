import { type ComponentProps, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { usePartyLimits } from "@/hooks/usePartyRepository";
import { ObrBindingControls } from "./ObrBindingControls";
import { ObrPartyRosterRow } from "./ObrPartyRosterRow";
import { ObrRoomPromotion } from "./ObrRoomPromotion";
import {
  type ObrConnectedPlayer,
  type ObrPartyRosterBindingRow,
  type ObrPartyRosterCard,
  useObrRosterCards,
} from "@/obr/useObrRosterCards";
import {
  RosterActionMessage,
  RosterBindingActions,
  RosterBindingButton,
  RosterBindingFallback,
  RosterBindingItem,
  RosterEmpty,
  RosterHeader,
  RosterList,
  RosterShell,
  RosterTitle,
} from "./ObrPartyRoster.styles";

type ObrPartyRosterProps = {
  cards?: ObrPartyRosterCard[];
  rows?: ObrPartyRosterBindingRow[];
  maxMembers?: number;
  connectedPlayers?: ObrConnectedPlayer[];
  action?: { pending: boolean; message: string | null; error: string | null };
  onRefresh?: () => Promise<void>;
  bindSelectedToken?: (input: {
    characterId: string;
    characterName: string;
    playerId?: string | null;
  }) => Promise<void>;
  assignPlayer?: (input: {
    characterId: string;
    playerId: string;
  }) => Promise<void>;
  unassignPlayer?: (playerId: string) => Promise<void>;
  unbindToken?: (tokenId: string) => Promise<void>;
};

const FALLBACK_MAX_MEMBERS = 10;
const NO_CONNECTED_PLAYERS: ObrConnectedPlayer[] = [];

export function ObrPartyRoster({
  cards,
  rows,
  maxMembers,
  connectedPlayers,
  action,
  onRefresh,
  bindSelectedToken,
  assignPlayer,
  unassignPlayer,
  unbindToken,
}: ObrPartyRosterProps) {
  if (cards) {
    return (
      <ObrPartyRosterView
        rows={cards.map(cardToRosterRow)}
        maxMembers={maxMembers ?? FALLBACK_MAX_MEMBERS}
        connectedPlayers={connectedPlayers}
        action={action}
        onRefresh={onRefresh}
        bindSelectedToken={bindSelectedToken}
        assignPlayer={assignPlayer}
        unassignPlayer={unassignPlayer}
        unbindToken={unbindToken}
      />
    );
  }

  if (rows) {
    return (
      <ObrPartyRosterView
        rows={rows}
        maxMembers={maxMembers ?? FALLBACK_MAX_MEMBERS}
        connectedPlayers={connectedPlayers}
        action={action}
        onRefresh={onRefresh}
        bindSelectedToken={bindSelectedToken}
        assignPlayer={assignPlayer}
        unassignPlayer={unassignPlayer}
        unbindToken={unbindToken}
      />
    );
  }

  return <ObrPartyRosterContainer />;
}

function ObrPartyRosterContainer() {
  const roster = useObrRosterCards();
  const limits = usePartyLimits();
  return (
    <ObrPartyRosterView
      rows={roster.rows}
      maxMembers={limits.data?.maxMembers ?? FALLBACK_MAX_MEMBERS}
      connectedPlayers={roster.connectedPlayers}
      action={roster.action}
      onRefresh={roster.refresh}
      bindSelectedToken={roster.bindSelectedToken}
      assignPlayer={roster.assignPlayer}
      unassignPlayer={roster.unassignPlayer}
      unbindToken={roster.unbindToken}
      promotion={<ObrRoomPromotion />}
    />
  );
}

function ObrPartyRosterView({
  rows,
  maxMembers,
  promotion = null,
  connectedPlayers = NO_CONNECTED_PLAYERS,
  action = null,
  onRefresh,
  bindSelectedToken,
  assignPlayer,
  unassignPlayer,
  unbindToken,
}: {
  rows: ObrPartyRosterBindingRow[];
  maxMembers: number;
  promotion?: ReactNode;
  connectedPlayers?: ObrConnectedPlayer[];
  action?: {
    pending: boolean;
    message: string | null;
    error: string | null;
  } | null;
  onRefresh?: () => Promise<void>;
  bindSelectedToken?: (input: {
    characterId: string;
    characterName: string;
    playerId?: string | null;
  }) => Promise<void>;
  assignPlayer?: (input: {
    characterId: string;
    playerId: string;
  }) => Promise<void>;
  unassignPlayer?: (playerId: string) => Promise<void>;
  unbindToken?: (tokenId: string) => Promise<void>;
}) {
  const { t } = useTranslation();

  return (
    <RosterShell aria-label="GM party roster">
      <RosterHeader>
        <RosterTitle>
          {t("obr.roster.title", "GM · OVERVIEW {{count}}/{{max}}", {
            count: rows.length,
            max: maxMembers,
          })}
        </RosterTitle>
        {onRefresh && (
          <RosterBindingButton
            type="button"
            disabled={action?.pending ?? false}
            onClick={() => void onRefresh()}
          >
            {t("obr.roster.refresh", "Refresh")}
          </RosterBindingButton>
        )}
        {promotion}
      </RosterHeader>

      {action?.message && (
        <RosterActionMessage>{action.message}</RosterActionMessage>
      )}
      {action?.error && (
        <RosterActionMessage role="alert">{action.error}</RosterActionMessage>
      )}

      {rows.length > 0 ? (
        <RosterList aria-label="Bound scvm cards">
          {rows.map((row) => (
            <RosterBindingListItem
              key={row.id}
              row={row}
              connectedPlayers={connectedPlayers}
              pending={action?.pending ?? false}
              bindSelectedToken={bindSelectedToken}
              assignPlayer={assignPlayer}
              unassignPlayer={unassignPlayer}
              unbindToken={unbindToken}
            />
          ))}
        </RosterList>
      ) : (
        <RosterEmpty role="status">
          {t(
            "obr.roster.empty",
            "No bound scvm yet. Players must bind a scvm to a token.",
          )}
        </RosterEmpty>
      )}
    </RosterShell>
  );
}

function RosterBindingListItem({
  row,
  connectedPlayers,
  pending,
  bindSelectedToken,
  assignPlayer,
  unassignPlayer,
  unbindToken,
}: {
  row: ObrPartyRosterBindingRow;
  connectedPlayers: ObrConnectedPlayer[];
  pending: boolean;
  bindSelectedToken?: (input: {
    characterId: string;
    characterName: string;
    playerId?: string | null;
  }) => Promise<void>;
  assignPlayer?: (input: {
    characterId: string;
    playerId: string;
  }) => Promise<void>;
  unassignPlayer?: (playerId: string) => Promise<void>;
  unbindToken?: (tokenId: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const characterName =
    row.card?.name ??
    t("obr.roster.missingCardName", "Missing scvm {{id}}", {
      id: shortId(row.characterId),
    });
  const assignedPlayerId = row.players[0]?.playerId ?? null;
  const canBindToken = Boolean(bindSelectedToken);
  const hasGmControls = Boolean(assignPlayer || unassignPlayer || unbindToken);
  const gmControls: ComponentProps<typeof ObrBindingControls> | null =
    hasGmControls
      ? {
          row,
          connectedPlayers,
          pending,
          onAssignPlayer: (input) => void assignPlayer?.(input),
          onUnassignPlayer: (playerId) => void unassignPlayer?.(playerId),
          onUnbindToken: (tokenId) => void unbindToken?.(tokenId),
        }
      : null;

  return (
    <RosterBindingItem>
      {row.card ? (
        <ObrPartyRosterRow card={row.card} row={row} gmControls={gmControls} />
      ) : (
        <>
          <RosterBindingFallback>
            {t("obr.roster.missingCard", "Scvm not found {{id}}", {
              id: row.characterId,
            })}
          </RosterBindingFallback>
          {gmControls && <ObrBindingControls {...gmControls} />}
        </>
      )}

      {canBindToken && (
        <RosterBindingActions>
          <RosterBindingButton
            type="button"
            disabled={pending}
            onClick={() =>
              void bindSelectedToken?.({
                characterId: row.characterId,
                characterName,
                playerId: assignedPlayerId,
              })
            }
          >
            {t("obr.roster.bindSelectedToken", "Bind selected token")}
          </RosterBindingButton>
        </RosterBindingActions>
      )}
    </RosterBindingItem>
  );
}

function cardToRosterRow(card: ObrPartyRosterCard): ObrPartyRosterBindingRow {
  const id = typeof card.id === "string" && card.id.length > 0 ? card.id : "";
  return {
    id,
    characterId: id,
    card,
    players: [],
    tokens: [],
  };
}

function shortId(id: string): string {
  return id.length > 8 ? id.slice(0, 8) : id;
}

export type { ObrPartyRosterBindingRow, ObrPartyRosterCard };
