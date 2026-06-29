import { fetchObrCards } from "@/api/obr";
import {
  PathsApiCharactersCardsGetParametersQueryLocale,
  type paths,
} from "@/api/schema";
import { useQuery } from "@tanstack/react-query";
import { WarbandCardView } from "@/components/organisms/party/WarbandCardView";
import {
  toWarbandMemberFromCard,
  type CompactWarbandCard,
} from "@/components/organisms/party/warbandMember";
import { getApiLocale } from "@/hooks/utils";
import { useTranslation } from "react-i18next";
import { CardShell, StatusFrame } from "./ObrCard.styles";

type CharacterCardsResponse =
  paths["/api/characters/cards"]["get"]["responses"][200]["content"]["application/json"];

export type ObrCardCharacter = CharacterCardsResponse[number];

type ObrCardRouteProps = {
  characterId?: string | null;
  roomId?: string | null;
};

type ObrCardProps = {
  card: ObrCardCharacter | null;
  error?: string | null;
  isLoading?: boolean;
};

export function ObrCardRoute({
  characterId = getObrCardCharacterId(),
  roomId = getObrCardRoomId(),
}: ObrCardRouteProps) {
  const { i18n, t } = useTranslation();
  const locale = getApiLocale<PathsApiCharactersCardsGetParametersQueryLocale>(
    i18n.language,
  );
  const ids = characterId?.trim() ?? "";
  const room = roomId?.trim() ?? "";
  const {
    data: cardQueryData,
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    queryKey: ["obr", "cards", room, ids, locale],
    queryFn: () => fetchObrCards([ids], room, locale),
    enabled: ids.length > 0 && room.length > 0,
  });
  const cards = cardQueryData as ObrCardCharacter[] | undefined;
  const card = cards?.[0] ?? null;

  if (!ids) {
    return <ObrCard card={null} error={t("obr.card.missingId", "Missing scvm id")} />;
  }

  if (isLoading || isFetching) {
    return <ObrCard card={null} isLoading />;
  }

  if (isError) {
    return <ObrCard card={null} error={t("obr.card.loadFailed", "Could not load scvm")} />;
  }

  return <ObrCard card={card} error={card ? null : t("obr.card.notFound", "Scvm not found")} />;
}

export function ObrCard({
  card,
  error = null,
  isLoading = false,
}: ObrCardProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <CardShell>
        <StatusFrame role="status">
          {t("obr.card.loading", "Loading scvm")}
        </StatusFrame>
      </CardShell>
    );
  }

  if (error || !card) {
    return (
      <CardShell>
        <StatusFrame role="status">
          {error ?? t("obr.card.notFound", "Scvm not found")}
        </StatusFrame>
      </CardShell>
    );
  }

  const member = toWarbandMemberFromCard(card as CompactWarbandCard, {
    armorNone: t("gm.armorNone", "None"),
    unarmed: t("gm.unarmed", "Unarmed"),
    unnamedScvm: t("obr.common.unnamedScvm", "Unnamed scvm"),
    classless: t("obr.common.classless", "Classless"),
  });

  return (
    <CardShell>
      <WarbandCardView member={member} />
    </CardShell>
  );
}

function getObrCardCharacterId(search = window.location.search): string | null {
  const id = new URLSearchParams(search).get("id")?.trim();
  return id ? id : null;
}

function getObrCardRoomId(search = window.location.search): string | null {
  const room = new URLSearchParams(search).get("room")?.trim();
  return room ? room : null;
}
