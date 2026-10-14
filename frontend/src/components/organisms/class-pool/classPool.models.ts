import type { ClassLanguage } from "@/api/classes";
import type { PoolClass, PoolGroup } from "@/api/classPool";

export type PoolFilter = "all" | "book" | "zr" | "mine" | "public";
export type PoolLanguage = "any" | ClassLanguage;

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
