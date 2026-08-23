import { $api } from "@/api";
import { type PathsApiCharactersGetParametersQueryLocale } from "@/api/schema";
import { type CharacterListItem } from "@/hooks/models";
import { Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  InlineSpinner,
  PickButton,
  PickList,
} from "./ObrCharacterRoute.styles";

const FORGE_SCVM_PATH = "/character/create";

export function ObrAuthedPicker({
  locale,
  onPick,
  onRollNew,
}: {
  locale: PathsApiCharactersGetParametersQueryLocale;
  onPick: (id: string) => void;
  onRollNew: () => void;
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
        href={FORGE_SCVM_PATH}
        target="_blank"
        rel="noreferrer"
      >
        {t("obr.player.forgeScvm", "Forge scvm")}
      </Button>
    </PickList>
  );
}
