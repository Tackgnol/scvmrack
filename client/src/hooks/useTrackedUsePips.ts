import { useCallback, useEffect, useState } from 'react';

interface UseTrackedUsePipsParams {
  isSaving: boolean;
  onToggle: (equipmentIndex: number, useIndex: number) => void;
}

export function useTrackedUsePips({
  isSaving,
  onToggle,
}: UseTrackedUsePipsParams) {
  const [pendingPips, setPendingPips] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isSaving && pendingPips.size > 0) {
      setPendingPips(new Set());
    }
  }, [isSaving, pendingPips]);

  const markPipPending = useCallback(
    (equipmentIndex: number, useIndex: number) => {
      const pipKey = `${equipmentIndex}:${useIndex}`;

      setPendingPips((previous) => {
        if (previous.has(pipKey)) {
          return previous;
        }
        const next = new Set(previous);
        next.add(pipKey);
        return next;
      });

      onToggle(equipmentIndex, useIndex);
    },
    [onToggle],
  );

  const hasPendingPipSave = isSaving && pendingPips.size > 0;

  const isPipPending = useCallback(
    (equipmentIndex: number, useIndex: number) =>
      hasPendingPipSave && pendingPips.has(`${equipmentIndex}:${useIndex}`),
    [hasPendingPipSave, pendingPips],
  );

  return {
    hasPendingPipSave,
    isPipPending,
    markPipPending,
  };
}
