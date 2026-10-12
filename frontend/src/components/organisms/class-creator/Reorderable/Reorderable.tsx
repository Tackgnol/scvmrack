import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { Menu, MenuItem } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ReorderableProps } from "./Reorderable.models";

const DRAG_DISTANCE = 6;
const SCROLL_EDGE = 72;

/** A keyboard, pointer, and menu control for one entry in an ordered creator list. */
export function Reorderable({
  children,
  count,
  index,
  itemId,
  label,
  listId,
  onMove,
}: ReorderableProps) {
  const { t } = useTranslation();
  const rootRef = useRef<HTMLDivElement>(null);
  const gripRef = useRef<HTMLButtonElement>(null);
  const pointerRef = useRef<{
    id: number;
    startY: number;
    dragging: boolean;
    target: number;
    mids?: number[];
  } | null>(null);
  const suppressClickRef = useRef(false);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const source = `creator-reorder-${listId}-${itemId}`;
  const enabled = count > 1;

  const entries = () =>
    [
      ...document.querySelectorAll<HTMLElement>(
        `[data-reorder-list="${listId}"]`,
      ),
    ].sort(
      (left, right) =>
        Number(left.dataset.reorderIndex) - Number(right.dataset.reorderIndex),
    );
  const clearPreview = () =>
    entries().forEach((entry) => entry.style.removeProperty("transform"));
  const preview = (target: number) => {
    const list = entries();
    clearPreview();
    if (target === index) return;
    const height = list[index]?.getBoundingClientRect().height ?? 0;
    list.forEach((entry, entryIndex) => {
      if (index < target && entryIndex > index && entryIndex <= target)
        entry.style.transform = `translateY(${-height}px)`;
      if (target < index && entryIndex >= target && entryIndex < index)
        entry.style.transform = `translateY(${height}px)`;
    });
  };
  /** Page-relative midpoints, measured before the preview starts shifting entries. */
  const midpoints = () =>
    entries().map((entry) => {
      const rect = entry.getBoundingClientRect();
      return rect.top + window.scrollY + rect.height / 2;
    });
  const targetAt = (clientY: number, mids: number[]) => {
    const found = mids.findIndex((mid) => clientY + window.scrollY < mid);
    return found === -1 ? mids.length - 1 : found;
  };
  const reset = () => {
    pointerRef.current = null;
    clearPreview();
  };
  const move = (to: number, method: "move" | "drag") => {
    if (to === index || to < 0 || to >= count) return;
    onMove(index, to, method, source);
    requestAnimationFrame(() => gripRef.current?.focus());
  };

  useEffect(() => {
    const cancel = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !pointerRef.current?.dragging) return;
      event.preventDefault();
      reset();
      gripRef.current?.focus();
    };
    window.addEventListener("keydown", cancel, { capture: true });
    return () =>
      window.removeEventListener("keydown", cancel, { capture: true });
  });

  return (
    <div
      ref={rootRef}
      data-testid={`reorder-${listId}-${index}`}
      data-reorder-item={itemId}
      data-reorder-index={index}
      data-reorder-list={listId}
      onKeyDown={(event) => {
        if (
          !enabled ||
          !event.altKey ||
          (event.key !== "ArrowUp" && event.key !== "ArrowDown")
        )
          return;
        if (
          event.target instanceof Element &&
          event.target.closest("input, textarea, [contenteditable=true]")
        )
          return;
        event.preventDefault();
        move(index + (event.key === "ArrowUp" ? -1 : 1), "move");
      }}
      style={{
        display: "grid",
        gridTemplateColumns: enabled ? "40px minmax(0, 1fr)" : "minmax(0, 1fr)",
        alignItems: "start",
        position: "relative",
        transition: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? undefined : "transform 160ms ease",
        zIndex: anchor ? 2 : undefined,
      }}
    >
      {enabled && (
        <button
          ref={gripRef}
          id={source}
          type="button"
          aria-label={t("creator.reorder.grip", "Move {{label}}", { label })}
          aria-haspopup="menu"
          aria-expanded={Boolean(anchor)}
          onClick={(event) => {
            if (suppressClickRef.current) {
              suppressClickRef.current = false;
              event.preventDefault();
              return;
            }
            setAnchor(event.currentTarget);
          }}
          onPointerDown={(event) => {
            pointerRef.current = {
              id: event.pointerId,
              startY: event.clientY,
              dragging: false,
              target: index,
            };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            const pointer = pointerRef.current;
            if (!pointer || pointer.id !== event.pointerId) return;
            if (
              !pointer.dragging &&
              Math.abs(event.clientY - pointer.startY) < DRAG_DISTANCE
            )
              return;
            if (!pointer.dragging) pointer.mids = midpoints();
            pointer.dragging = true;
            pointer.target = targetAt(event.clientY, pointer.mids ?? []);
            preview(pointer.target);
            if (event.clientY < SCROLL_EDGE)
              window.scrollBy({ top: -24, behavior: "auto" });
            if (event.clientY > window.innerHeight - SCROLL_EDGE)
              window.scrollBy({ top: 24, behavior: "auto" });
          }}
          onPointerUp={(event) => {
            const pointer = pointerRef.current;
            if (!pointer || pointer.id !== event.pointerId) return;
            if (pointer.dragging) {
              event.preventDefault();
              suppressClickRef.current = true;
              move(pointer.target, "drag");
            }
            reset();
          }}
          onPointerCancel={reset}
          style={{
            alignItems: "center",
            alignSelf: "stretch",
            background: "transparent",
            border: 0,
            color: "inherit",
            cursor: "grab",
            display: "inline-flex",
            justifyContent: "center",
            minHeight: 44,
            touchAction: "none",
          }}
        >
          <DragIndicatorIcon aria-hidden="true" />
        </button>
      )}
      {children}
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
      >
        <MenuItem
          disabled={index === 0}
          onClick={() => move(index - 1, "move")}
        >
          {t("creator.reorder.up", "Move up")}
        </MenuItem>
        <MenuItem
          disabled={index === count - 1}
          onClick={() => move(index + 1, "move")}
        >
          {t("creator.reorder.down", "Move down")}
        </MenuItem>
        <MenuItem disabled={index === 0} onClick={() => move(0, "move")}>
          {t("creator.reorder.top", "To the top")}
        </MenuItem>
        <MenuItem
          disabled={index === count - 1}
          onClick={() => move(count - 1, "move")}
        >
          {t("creator.reorder.bottom", "To the bottom")}
        </MenuItem>
      </Menu>
    </div>
  );
}
