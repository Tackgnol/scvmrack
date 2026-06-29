import { useTranslation } from "react-i18next";
import { BrandTitle, Centered, Hint, Panel } from "./ObrCharacterRoute.styles";

export function ObrUnavailableState() {
  const { t } = useTranslation();

  return (
    <Centered>
      <Panel>
        <BrandTitle>Scvmrack</BrandTitle>
        <Hint>
          {t(
            "obr.route.openFromOwlbear",
            "Open Scvmrack from Owlbear Rodeo to read the room role.",
          )}
        </Hint>
      </Panel>
    </Centered>
  );
}
