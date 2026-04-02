import { Typography } from '@mui/material';
import { customStyles } from '@/theme/morkBorgTheme';
import { AnimatedNumber } from '@components/index';

interface ItemQuantityBadgeProps {
  quantity: number;
  cacheKey: string;
  symbol?: string;
}

export default function ItemQuantityBadge({
  quantity,
  symbol = 'x',
}: ItemQuantityBadgeProps) {
  if (quantity <= 1) return null;

  return (
    <Typography component="div" sx={customStyles.quantityBadge}>
      {quantity}
      {symbol}
    </Typography>
  );
}
