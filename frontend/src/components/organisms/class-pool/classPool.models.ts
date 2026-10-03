import type { PoolClass, PoolGroup } from "@/api/classPool";

export type PoolFilter = "all" | "book" | "zr" | "mine" | "public";
export type PoolLanguage = "any" | "en" | "pl";

export type PoolSearch = {
  text: string;
  filter: PoolFilter;
  language: PoolLanguage;
};

export type PoolGroupSection = {
  group: PoolGroup;
  shown: PoolClass[];
  total: number;
  on: number;
};
