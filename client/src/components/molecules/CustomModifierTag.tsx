import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import CloseIcon from '@mui/icons-material/Close';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { type CustomModifier } from '@/hooks/models';
import { morkBorgColors } from '@/theme/morkBorgTheme';
import ModifierStatChip from '@components/atoms/ModifierStatChip';
import SignedModifierValue from '@components/atoms/SignedModifierValue';
import { useEffect, useRef, useState } from 'react';

interface CustomModifierTagProps {
  modifier: CustomModifier;
  onRemove: () => void;
  onEdit: () => void;
  isFull: boolean;
  removeLabel: string;
  reduceMotion?: boolean;
}

export default function CustomModifierTag({
  modifier,
  onRemove,
  onEdit,
  isFull,
  removeLabel,
  reduceMotion,
}: CustomModifierTagProps) {
  const [pulse, setPulse] = useState(false);
  const previousValueRef = useRef<number | null>(null);
  const value = modifier.value ?? 0;

  useEffect(() => {
    if (reduceMotion) return;
    if (previousValueRef.current === null) {
      previousValueRef.current = value;
      return;
    }
    if (previousValueRef.current !== value) {
      setPulse(true);
      const timeoutId = window.setTimeout(() => setPulse(false), 180);
      previousValueRef.current = value;
      return () => window.clearTimeout(timeoutId);
    }
    previousValueRef.current = value;
  }, [value, reduceMotion]);

  return (
    <Box
      onClick={onEdit}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onEdit();
        }
      }}
      role="button"
      tabIndex={0}
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: isFull ? 'wrap' : 'nowrap',
        columnGap: 0.75,
        rowGap: 0.55,
        bgcolor: morkBorgColors.grey,
        border: `2px solid ${morkBorgColors.yellow}`,
        p: 1,
        minHeight: 56,
        height: '100%',
        cursor: 'pointer',
        transition: 'transform 150ms ease, box-shadow 150ms ease',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: `2px 2px 0 ${morkBorgColors.yellow}`,
        },
        '&:focus-visible': {
          outline: `2px solid ${morkBorgColors.yellow}`,
          outlineOffset: '2px',
        },
      }}
    >
      <Typography
        variant="body2"
        sx={{
          color: morkBorgColors.white,
          minWidth: 0,
          flexGrow: 1,
          flexBasis: isFull ? '100%' : 'auto',
          overflow: isFull ? 'visible' : 'hidden',
          textOverflow: isFull ? 'clip' : 'ellipsis',
          whiteSpace: isFull ? 'normal' : 'nowrap',
          lineHeight: isFull ? 1.3 : 1.2,
          pr: isFull ? 0 : 0.25,
          wordBreak: isFull ? 'break-word' : 'normal',
        }}
      >
        {modifier.name}
      </Typography>

      {modifier.comment && (
        <Tooltip title={modifier.comment} placement="top">
          <ChatBubbleIcon
            sx={{
              fontSize: 14,
              color: morkBorgColors.yellow,
              cursor: 'help',
              flexShrink: 0,
            }}
          />
        </Tooltip>
      )}

      <ModifierStatChip label={(modifier.statistic ?? 'agility').toUpperCase()} />
      <SignedModifierValue value={value} pulse={pulse} />

      <IconButton
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
        aria-label={`${removeLabel}: ${modifier.name ?? 'modifier'}`}
        data-testid="remove-modifier"
        className="remove-button"
        sx={{
          width: { xs: 40, sm: 22 },
          height: { xs: 40, sm: 22 },
          bgcolor: morkBorgColors.pink,
          color: morkBorgColors.black,
          flexShrink: 0,
          ml: isFull ? 'auto' : 0.25,
          '&:hover': {
            bgcolor: morkBorgColors.yellow,
          },
        }}
      >
        <CloseIcon sx={{ fontSize: { xs: 18, sm: 14 } }} />
      </IconButton>
    </Box>
  );
}
