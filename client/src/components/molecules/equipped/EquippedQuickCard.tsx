import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, Typography } from '@mui/material';
import {
  forwardRef,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import { customStyles } from '@/theme/morkBorgTheme';
import { StyledEquipmentCard } from './EquippedBar.styled';

interface EquippedQuickCardProps {
  icon: string;
  type: string;
  name: string;
  detail?: string;
  noneName: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  dataTestId?: string;
  actionLabel?: string;
  ammoCount?: number | null;
  onAmmoUse?: () => void;
}

const EquippedQuickCard = forwardRef<HTMLDivElement, EquippedQuickCardProps>(
  function EquippedQuickCard(
    { icon, type, name, detail, noneName, onClick, dataTestId, actionLabel, ammoCount, onAmmoUse },
    ref,
  ) {
    const hasClick = Boolean(onClick);
    const resolvedActionLabel = actionLabel ?? 'Change';

    const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
      if (!onClick) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onClick(event as unknown as MouseEvent<HTMLElement>);
      }
    };

    return (
      <StyledEquipmentCard
        ref={ref}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        hasClick={hasClick}
        data-testid={dataTestId}
        role={hasClick ? 'button' : undefined}
        tabIndex={hasClick ? 0 : undefined}
        aria-haspopup={hasClick ? 'menu' : undefined}
      >
        <Typography sx={customStyles.equippedBar.icon}>{icon}</Typography>
        <Box sx={customStyles.equippedBar.contentBox}>
          <Typography
            variant="subtitle2"
            color="secondary"
            sx={customStyles.equippedBar.typeLabel}
          >
            {type}
          </Typography>
          <Typography variant="h4" noWrap sx={customStyles.equippedBar.itemName}>
            {name || noneName}
          </Typography>
          {detail && (
            <Typography variant="subtitle2" sx={customStyles.equippedBar.itemDetail}>
              {detail}
            </Typography>
          )}
        </Box>
        {ammoCount !== null && ammoCount !== undefined && (
          <Box
            component="span"
            role="button"
            tabIndex={0}
            data-testid={dataTestId ? `${dataTestId}-ammo` : undefined}
            aria-label={`Ammo: ${ammoCount}. Click to use.`}
            onClick={(e: MouseEvent<HTMLElement>) => {
              e.stopPropagation();
              onAmmoUse?.();
            }}
            onKeyDown={(e: KeyboardEvent<HTMLElement>) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onAmmoUse?.();
              }
            }}
            sx={{
              ...customStyles.equippedBar.ammoPeg,
              ...(ammoCount > 0
                ? customStyles.equippedBar.ammoPegNormal
                : customStyles.equippedBar.ammoPegEmpty),
            }}
            className="print-hidden"
          >
            {ammoCount}
          </Box>
        )}
        {hasClick && (
          <Box sx={customStyles.equippedBar.action} className="print-hidden">
            <Typography sx={customStyles.equippedBar.actionLabel}>
              {resolvedActionLabel}
            </Typography>
            <ChevronRightIcon sx={customStyles.equippedBar.actionIcon} />
          </Box>
        )}
      </StyledEquipmentCard>
    );
  },
);

export default EquippedQuickCard;
