import type { PoolClass } from "@/api/classPool";

export type ClassPoolRowProps = {
  cls: PoolClass;
  onSwitch: (cls: PoolClass, enabled: boolean) => void;
};
