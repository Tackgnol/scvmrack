import { Box } from "@mui/material";
import { visuallyHidden } from "@mui/utils";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useTranslation } from "react-i18next";
import { ClassPoolRow } from "../ClassPoolRow/ClassPoolRow";
import type { ClassPoolGroupProps } from "./ClassPoolGroup.models";
import { Group, Header, Rows } from "./ClassPoolGroup.styles";

/** A collapsible source group (Book, Zine, …) with its on/total fraction. */
export function ClassPoolGroup({
  section,
  open,
  onToggle,
  onSwitch,
}: ClassPoolGroupProps) {
  const { t } = useTranslation();
  const rowsId = `class-pool-group-${section.group}`;
  return (
    <Group>
      <Header
        type="button"
        aria-expanded={open}
        aria-controls={rowsId}
        onClick={onToggle}
      >
        <span className="title">{t(`classPool.groups.${section.group}.title`)}</span>
        <span className="desc">{t(`classPool.groups.${section.group}.desc`)}</span>
        <span className={section.on > 0 ? "fraction" : "fraction none"}>
          <span aria-hidden="true">
            {section.on}
            <span className="of">/{section.total}</span>
            <small>{t("classPool.groups.on", "on")}</small>
          </span>
          <Box component="span" sx={visuallyHidden}>
            {t("classPool.groups.fraction", "{{on}} of {{total}} on", {
              on: section.on,
              total: section.total,
            })}
          </Box>
        </span>
        <KeyboardArrowDownIcon aria-hidden="true" fontSize="small" />
      </Header>
      {open && (
        <Rows id={rowsId}>
          {section.shown.map((cls) => (
            <ClassPoolRow key={cls.lineageId} cls={cls} onSwitch={onSwitch} />
          ))}
        </Rows>
      )}
    </Group>
  );
}
