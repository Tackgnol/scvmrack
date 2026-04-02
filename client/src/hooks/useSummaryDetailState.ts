import { useEffect, useRef, useState } from 'react';
import { morkBorgColors, statColors } from '@/theme/morkBorgTheme';
import { type SummaryDetailKey } from '@/hooks/useSummaryMetrics';

const getAccentColor = (detail: SummaryDetailKey): string => {
  if (detail === 'dodge') return statColors.agi;
  if (detail === 'melee') return statColors.str;
  if (detail === 'ranged') return statColors.pre;
  return morkBorgColors.yellow;
};

export function useSummaryDetailState() {
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeDetail, setActiveDetail] = useState<SummaryDetailKey | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [isPinned, setIsPinned] = useState(false);

  const clearCloseTimer = () => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const closeNow = () => {
    clearCloseTimer();
    setActiveDetail(null);
    setAnchorEl(null);
    setIsPinned(false);
  };

  const scheduleClose = () => {
    if (isPinned) return;
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setActiveDetail(null);
      setAnchorEl(null);
      setIsPinned(false);
    }, 140);
  };

  const openHoverDetail = (detail: SummaryDetailKey, element: HTMLElement) => {
    if (isPinned && activeDetail !== detail) return;
    clearCloseTimer();
    setActiveDetail(detail);
    setAnchorEl(element);
  };

  const togglePinnedDetail = (detail: SummaryDetailKey, element: HTMLElement) => {
    clearCloseTimer();
    if (isPinned && activeDetail === detail) {
      closeNow();
      return;
    }

    setActiveDetail(detail);
    setAnchorEl(element);
    setIsPinned(true);
  };

  useEffect(() => {
    return () => {
      clearCloseTimer();
    };
  }, []);

  const popperOpen = Boolean(activeDetail && anchorEl);
  const popperAccent = activeDetail
    ? getAccentColor(activeDetail)
    : morkBorgColors.yellow;

  return {
    activeDetail,
    anchorEl,
    popperOpen,
    popperAccent,
    clearCloseTimer,
    closeNow,
    scheduleClose,
    openHoverDetail,
    togglePinnedDetail,
  };
}
