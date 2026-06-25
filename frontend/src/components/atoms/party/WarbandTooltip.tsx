import { partyColors } from '@/theme/partyTokens';
import {
  ClickAwayListener,
  Tooltip,
  type TooltipProps,
  useMediaQuery,
} from '@mui/material';
import {
  cloneElement,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
} from 'react';

// The card's stat/detail affordances (abilities, contributing DR, modifiers, kit)
// all use the same stamped tooltip surface: a hard-bordered box with a solid offset
// shadow, zero radius; it opens on hover, focus, click, or tap.
type WarbandTooltipProps = {
  title: TooltipProps['title'];
  tone?: 'yellow' | 'dark';
  width?: number;
  placement?: TooltipProps['placement'];
  children: ReactElement;
};

type TriggerProps = {
  'aria-expanded'?: boolean;
  onBlur?: (event: FocusEvent<HTMLElement>) => void;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  onFocus?: (event: FocusEvent<HTMLElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
  onMouseEnter?: (event: MouseEvent<HTMLElement>) => void;
  onMouseLeave?: (event: MouseEvent<HTMLElement>) => void;
};

export function WarbandTooltip({
  title,
  tone = 'yellow',
  width = 220,
  placement = 'top',
  children,
}: WarbandTooltipProps) {
  const [open, setOpen] = useState(false);
  const prefersHover = useMediaQuery('(hover: hover) and (pointer: fine)');
  const yellow = tone === 'yellow';
  const trigger = children as ReactElement<TriggerProps>;
  const triggerProps = trigger.props;
  const triggerWithHandlers = cloneElement(trigger, {
    'aria-expanded': open,
    onMouseEnter: (event: MouseEvent<HTMLElement>) => {
      triggerProps.onMouseEnter?.(event);
      if (prefersHover) {
        setOpen(true);
      }
    },
    onMouseLeave: (event: MouseEvent<HTMLElement>) => {
      triggerProps.onMouseLeave?.(event);
      if (prefersHover) {
        setOpen(false);
      }
    },
    onFocus: (event: FocusEvent<HTMLElement>) => {
      triggerProps.onFocus?.(event);
      setOpen(true);
    },
    onBlur: (event: FocusEvent<HTMLElement>) => {
      triggerProps.onBlur?.(event);
      setOpen(false);
    },
    onClick: (event: MouseEvent<HTMLElement>) => {
      triggerProps.onClick?.(event);
      setOpen(true);
    },
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      triggerProps.onKeyDown?.(event);
      if (event.defaultPrevented) {
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setOpen(true);
      } else if (event.key === 'Escape') {
        setOpen(false);
      }
    },
  } satisfies TriggerProps);

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Tooltip
        title={title}
        placement={placement}
        arrow={false}
        open={open}
        disableHoverListener
        disableFocusListener
        disableTouchListener
        slotProps={{
          tooltip: {
            sx: {
              maxWidth: width,
              p: '9px 11px',
              borderRadius: 0,
              backgroundColor: yellow ? partyColors.yellow : partyColors.black,
              color: yellow ? partyColors.black : partyColors.yellow,
              border: `2px solid ${
                yellow ? partyColors.black : partyColors.yellow
              }`,
              boxShadow: `4px 4px 0 ${
                yellow ? partyColors.black : partyColors.pink
              }`,
              textAlign: 'left',
            },
          },
          popper: { sx: { zIndex: (theme) => theme.zIndex.modal + 2 } },
        }}
      >
        {triggerWithHandlers}
      </Tooltip>
    </ClickAwayListener>
  );
}
