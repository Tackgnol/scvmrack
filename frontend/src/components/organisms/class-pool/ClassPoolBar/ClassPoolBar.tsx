import SearchIcon from "@mui/icons-material/Search";
import { useTranslation } from "react-i18next";
import type { PoolFilter, PoolLanguage } from "../classPool.models";
import { ActButton } from "../classPool.styles";
import type { ClassPoolBarProps } from "./ClassPoolBar.models";
import { Bar, Search, Segment } from "./ClassPoolBar.styles";

const FILTERS: Array<[PoolFilter, string]> = [
  ["all", "All"],
  ["book", "Book"],
  ["zr", "Zine & Rack"],
  ["mine", "My classes only"],
  ["public", "Public"],
];

const LANGUAGES: Array<[PoolLanguage, string]> = [
  ["any", "Any language"],
  ["en", "EN"],
  ["pl", "PL"],
];

/** Search, source filter and language filter over the pool's classes. */
export function ClassPoolBar({
  text,
  filter,
  language,
  onTextChange,
  onFilterChange,
  onLanguageChange,
}: ClassPoolBarProps) {
  const { t } = useTranslation();
  return (
    <Bar>
      <Search>
        <SearchIcon aria-hidden="true" />
        <input
          type="search"
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          placeholder={t(
            "classPool.search.placeholder",
            "Search classes, authors or blurbs",
          )}
          aria-label={t("classPool.search.label", "Search classes")}
        />
      </Search>
      <Segment role="group" aria-label={t("classPool.filters.label", "Show")}>
        {FILTERS.map(([value, fallback]) => (
          <ActButton
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => onFilterChange(value)}
          >
            {t(`classPool.filters.${value}`, fallback)}
          </ActButton>
        ))}
      </Segment>
      <Segment
        role="group"
        aria-label={t("classPool.languages.label", "Language")}
      >
        {LANGUAGES.map(([value, fallback]) => (
          <ActButton
            key={value}
            type="button"
            aria-pressed={language === value}
            onClick={() => onLanguageChange(value)}
          >
            {t(`classPool.languages.${value}`, fallback)}
          </ActButton>
        ))}
      </Segment>
    </Bar>
  );
}
