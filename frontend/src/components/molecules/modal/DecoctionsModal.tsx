import React from "react";
import { Box, Typography, Divider } from "@mui/material";
import MorkBorgModal from "./MorkBorgModal";
import { customStyles } from "../../../theme/morkBorgTheme";
import { useTranslation } from "react-i18next";

const decoctions = [
  {
    id: 1,
    nameKey: "abilities.occult_herbmaster.red_poison",
    fallbackName: "Red Poison",
    fallbackDesc: "Toughness DR12 or -D10 HP.",
  },
  {
    id: 2,
    nameKey: "abilities.occult_herbmaster.ezumiel",
    fallbackName: "Ezumiel's Vapor",
    fallbackDesc:
      "Pass a DR14 test or severe (and arguably fun) hallucinations for D4 hours.",
  },
  {
    id: 3,
    nameKey: "abilities.occult_herbmaster.frog",
    fallbackName: "Southern Frog Stew",
    fallbackDesc:
      "Vomit for D4 hours, pass a DR14 test or you can do nothing else.",
  },
  {
    id: 4,
    nameKey: "abilities.occult_herbmaster.vitalis",
    fallbackName: "Elixir Vitalis",
    fallbackDesc: "Heals D6 HP and stops infection. Can be habit-forming.",
  },
  {
    id: 5,
    nameKey: "abilities.occult_herbmaster.soup",
    fallbackName: "Spider-Owl Soup",
    fallbackDesc: "See in darkness, climb on walls for 30 minutes.",
  },
  {
    id: 6,
    nameKey: "abilities.occult_herbmaster.philtre",
    fallbackName: "Fernor's Philtre",
    fallbackDesc:
      "Translucent oil, must be dabbed right into the eye. Heals infection and gives +2 on Presence tests for D4 hours.",
  },
  {
    id: 7,
    nameKey: "abilities.occult_herbmaster.hyphos",
    fallbackName: "Hyphos' Enervating Snuff",
    fallbackDesc:
      "Berserk! Two attacks per round but defend with DR14. Lasts one fight. Must be snorted, causes sneezing.",
  },
  {
    id: 8,
    nameKey: "abilities.occult_herbmaster.black_poison",
    fallbackName: "Black Poison",
    fallbackDesc: "Toughness DR14 or -D6 HP and blinded for one hour.",
  },
];

interface DecoctionsModalProps {
  open: boolean;
  onClose: () => void;
}

const DecoctionsModal: React.FC<DecoctionsModalProps> = ({ open, onClose }) => {
  const { t } = useTranslation();

  return (
    <MorkBorgModal
      open={open}
      onClose={onClose}
      title={t(
        "abilities.occult_herbmaster.decoctions_title",
        "Occult Herbmaster Decoctions (d8)",
      )}
      maxWidth="sm"
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {decoctions.map((decoction, index) => {
          const translatedText = t(
            decoction.nameKey,
            `${decoction.fallbackName}: ${decoction.fallbackDesc}`,
          );
          const parts = translatedText.split(":");
          const name = parts[0] || decoction.fallbackName;
          const desc =
            parts.slice(1).join(":").trim() || decoction.fallbackDesc;

          return (
            <Box key={decoction.id} sx={{ mb: 1 }}>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5 }}>
                <Typography
                  sx={{
                    ...customStyles.characterDescriptors.abilityIndex,
                    fontSize: "1.2rem",
                    minWidth: "1.5rem",
                  }}
                >
                  {index + 1}
                </Typography>
                <Box>
                  <Typography
                    sx={{
                      ...customStyles.characterDescriptors.abilityName,
                      fontSize: "1rem",
                      color: "#FFE900", // yellow
                    }}
                  >
                    {name.toUpperCase()}
                  </Typography>
                  <Typography
                    sx={{
                      ...customStyles.characterDescriptors.abilityDescription,
                      mt: 0.25,
                      fontSize: "0.85rem",
                      opacity: 0.9,
                    }}
                  >
                    {desc}
                  </Typography>
                </Box>
              </Box>
              {index < decoctions.length - 1 && (
                <Divider
                  sx={{
                    mt: 1.5,
                    borderColor: "rgba(255, 62, 181, 0.2)",
                    borderStyle: "dashed",
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>
    </MorkBorgModal>
  );
};

export default DecoctionsModal;
