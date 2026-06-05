import { useState } from 'react';

interface UseTrackedUsePipsParams {
  isSaving: boolean;
  onToggle: (equipmentIndex: number, useIndex: number) => void;
}

export function useTrackedUsePips({
  isSaving,
  onToggle,
}: UseTrackedUsePipsParams) {
  const [pendingPips, setPendingPips] = useState<Set<string>>(new Set());
  const [prevIsSaving, setPrevIsSaving] = useState(isSaving);

  // Clear stale pending markers the moment isSaving transitions to false.
  if (prevIsSaving !== isSaving) {
    setPrevIsSaving(isSaving);
    if (!isSaving) setPendingPips(new Set());
  }

  const markPipPending = (equipmentIndex: number, useIndex: number) => {
    const pipKey = `${equipmentIndex}:${useIndex}`;

    setPendingPips((previous) => {
      if (previous.has(pipKey)) return previous;
      const next = new Set(previous);
      next.add(pipKey);
      return next;
    });

    onToggle(equipmentIndex, useIndex);
  };

  const hasPendingPipSave = isSaving && pendingPips.size > 0;

  const isPipPending = (equipmentIndex: number, useIndex: number) =>
    hasPendingPipSave && pendingPips.has(`${equipmentIndex}:${useIndex}`);

  return {
    hasPendingPipSave,
    isPipPending,
    markPipPending,
  };
}
