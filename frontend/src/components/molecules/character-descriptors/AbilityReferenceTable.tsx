import { useId, useState } from "react";
import { Box, Button, Collapse, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { rollDie } from "@/utils/rollDie";
import { abilityReferenceTableStyles as styles } from "./AbilityReferenceTable.styles";
import { type Props } from "./AbilityReferenceTable.models";

/** An ability's dN reference table: collapsed by default; rolling marks a row but never applies it. */
export default function AbilityReferenceTable({ table }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [rolled, setRolled] = useState<number | null>(null);
  const listId = useId();

  const roll = async () => {
    setOpen(true);
    setRolled(await rollDie(table.die));
  };

  // The ability card toggles its comment on click and Enter; table controls must not.
  return (
    <Box onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
      <Box sx={styles.controls}>
        <Button
          size="small"
          variant="outlined"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls={listId}
          sx={styles.button}
        >
          {t("abilityTable.toggle", "d{{die}} table", { die: table.die })}
        </Button>
        <Button size="small" variant="outlined" onClick={roll} sx={styles.button}>
          {t("abilityTable.roll", "Roll d{{die}}", { die: table.die })}
        </Button>
        {rolled !== null && (
          <Typography sx={styles.result} role="status">
            {t("abilityTable.rolled", "Rolled {{roll}}", { roll: rolled })}
          </Typography>
        )}
      </Box>
      <Collapse in={open}>
        <Box component="ol" id={listId} sx={styles.rows}>
          {table.rows.map((row) => (
            <Box
              component="li"
              key={row.roll}
              sx={styles.row(row.roll === rolled)}
              aria-current={row.roll === rolled ? "true" : undefined}
            >
              <Typography component="span" sx={styles.roll}>
                {row.roll}
              </Typography>
              <Box>
                <Typography sx={styles.text}>{row.text}</Typography>
                {row.itemName && (
                  <Typography sx={styles.item}>
                    {t("abilityTable.gives", "Gives {{item}}", { item: row.itemName })}
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}
