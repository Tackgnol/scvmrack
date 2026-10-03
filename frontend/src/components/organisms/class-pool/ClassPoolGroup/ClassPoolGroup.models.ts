import type { PoolClass } from "@/api/classPool";
import type { PoolGroupSection } from "../classPool.models";

export type ClassPoolGroupProps = {
  section: PoolGroupSection;
  open: boolean;
  onToggle: () => void;
  onSwitch: (cls: PoolClass, enabled: boolean) => void;
};
