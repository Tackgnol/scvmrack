import type { ReactNode } from "react";

export type ReorderMethod = "move" | "drag";

export type ReorderableProps = {
  children: ReactNode;
  count: number;
  index: number;
  itemId: string;
  label: string;
  listId: string;
  onMove: (
    from: number,
    to: number,
    method: ReorderMethod,
    source: string,
  ) => void;
};
