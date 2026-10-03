import type { PoolFilter, PoolLanguage } from "../classPool.models";

export type ClassPoolBarProps = {
  text: string;
  filter: PoolFilter;
  language: PoolLanguage;
  onTextChange: (text: string) => void;
  onFilterChange: (filter: PoolFilter) => void;
  onLanguageChange: (language: PoolLanguage) => void;
};
