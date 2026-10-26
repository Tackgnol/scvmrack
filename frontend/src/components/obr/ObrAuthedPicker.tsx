import { $api, type ApiLocale } from "@/api";
import { type CharacterListItem } from "@/hooks/models";
import { Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  InlineSpinner,
  PickButton,
  PickList,
} from "./ObrCharacterRoute.styles";

export function ObrAuthedPicker({
  locale,
  onPick,
  onRollNew,
  onForge,
  forgeReady = true,
}: {
  locale: ApiLocale;
  onPick: (id: string) => void;
  onRollNew: () => void;
  onForge: () => void;
  forgeReady?: boolean;
}) {
  const { t } = useTranslation();
  const charactersQuery = $api.useQuery(
    "get",
    "/api/characters",
    { params: { query: { locale } } },
    { refetchOnMount: "always" },
  );
  const characters =
    (charactersQuery.data as CharacterListItem[] | undefined) ?? [];

  return (
    <PickList>
      {charactersQuery.isLoading ? (
        <InlineSpinner size={20} />
      ) : (
        characters.map((character) => (
          <PickButton
            key={character.id}
            fullWidth
            variant="outlined"
            onClick={() => character.id && onPick(character.id)}
          >
            {character.name || t("obr.common.unnamedScvm", "Unnamed scvm")}
          </PickButton>
        ))
      )}
      <Button fullWidth variant="contained" onClick={onRollNew}>
        {t("obr.player.rollNew", "Roll new")}
      </Button>
      <Button
        fullWidth
        variant="outlined"
        onClick={onForge}
        disabled={!forgeReady}
      >
        {t("obr.player.forgeScvm", "Forge scvm")}
      </Button>
    </PickList>
  );
}
