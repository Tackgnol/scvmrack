import { partyColors } from '@/theme/partyTokens';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, IconButton, styled } from '@mui/material';
import {
  Children,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';

type PartyStripProps = {
  children: ReactNode;
  /** Fixed track width per card, in px. */
  cardWidth?: number;
  gap?: number;
};

const EDGE_EPSILON = 2;

const getScrollAvailability = (el: HTMLDivElement) => {
  const maxScroll = el.scrollWidth - el.clientWidth;
  return {
    canLeft: el.scrollLeft > EDGE_EPSILON,
    canRight: el.scrollLeft < maxScroll - EDGE_EPSILON,
  };
};

const StripRoot = styled(Box)({
  position: 'relative',
  flex: 1,
  minHeight: 0,
});

const StripArrow = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== 'side' && prop !== 'enabled',
})<{ side: 'left' | 'right'; enabled: boolean }>(({ side, enabled }) => ({
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  [side]: 6,
  zIndex: 2,
  width: 40,
  height: 56,
  borderRadius: 0,
  background: partyColors.pink,
  color: partyColors.black,
  border: `2px solid ${partyColors.black}`,
  boxShadow: `${side === 'left' ? '3px' : '-3px'} 3px 0 rgba(10,10,10,0.4)`,
  transition: 'opacity .15s ease-out',
  opacity: enabled ? 1 : 0,
  pointerEvents: enabled ? 'auto' : 'none',
  '&:hover': { background: partyColors.yellow },
  '&.Mui-disabled': { background: partyColors.darkGrey, color: partyColors.grey },
}));

const StripTrack = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'gap',
})<{ gap: number }>(({ gap }) => ({
  height: '100%',
  display: 'flex',
  alignItems: 'stretch',
  gap: `${gap}px`,
  overflowX: 'auto',
  overflowY: 'hidden',
  paddingLeft: '6px',
  paddingRight: '6px',
  paddingTop: '2px',
  paddingBottom: '2px',
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  '&::-webkit-scrollbar': { display: 'none' },
}));

const StripCard = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'cardWidth',
})<{ cardWidth: number }>(({ cardWidth }) => ({
  flex: `0 0 ${cardWidth}px`,
  maxWidth: `${cardWidth}px`,
}));

// Horizontal warband strip. Overflow runs sideways and is paged by the flanking
// arrows rather than a scrollbar (the scrollbar is hidden) — a card at a time, so a
// big warband stays one swipe-free row. The track is still natively scrollable, so
// touch/trackpad and keyboard focus order keep working underneath the arrows.
export function PartyStrip({ children, cardWidth = 300, gap = 18 }: PartyStripProps) {
  const { t } = useTranslation();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const count = Children.count(children);

  useLayoutEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const next = getScrollAvailability(el);
    setCanLeft(next.canLeft);
    setCanRight(next.canRight);
  }, [count]);

  useEffect(() => {
    const onResize = () => {
      const el = trackRef.current;
      if (!el) return;
      const next = getScrollAvailability(el);
      setCanLeft(next.canLeft);
      setCanRight(next.canRight);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const next = getScrollAvailability(el);
    setCanLeft(next.canLeft);
    setCanRight(next.canRight);
  };

  const page = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({
      left: direction * (cardWidth + gap),
      behavior: reduce ? 'auto' : 'smooth',
    });
  };

  return (
    <StripRoot>
      <StripArrow
        side="left"
        enabled={canLeft}
        aria-label={t('party.scrollPrev', 'Previous scvm')}
        onClick={() => page(-1)}
        disabled={!canLeft}
      >
        <ChevronLeftIcon />
      </StripArrow>

      <StripTrack ref={trackRef} onScroll={handleScroll} data-testid="party-strip-track" gap={gap}>
        {Children.map(children, (child) => (
          <StripCard cardWidth={cardWidth}>{child}</StripCard>
        ))}
      </StripTrack>

      <StripArrow
        side="right"
        enabled={canRight}
        aria-label={t('party.scrollNext', 'Next scvm')}
        onClick={() => page(1)}
        disabled={!canRight}
      >
        <ChevronRightIcon />
      </StripArrow>
    </StripRoot>
  );
}
