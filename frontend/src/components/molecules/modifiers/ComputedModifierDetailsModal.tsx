import { type ComputedModifier } from '@/hooks/models';
import { morkBorgColors } from '@/theme/morkBorgTheme';
import ModifierStatChip from '@components/atoms/ModifierStatChip';
import SignedModifierValue from '@components/atoms/SignedModifierValue';
import { MorkBorgModal } from '@components/index';
import { allIncludeOptions } from '@components/modifiers/config';
import { Box, Button, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface ComputedModifierDetailsModalProps {
  open: boolean;
  modifier: ComputedModifier | null;
  onClose: () => void;
}

export default function ComputedModifierDetailsModal({
  open,
  modifier,
  onClose,
}: ComputedModifierDetailsModalProps) {
  const { t } = useTranslation();

  const originName = modifier?.originName ?? t('modifiers.computed.unknownOrigin');
  const excluded = new Set(modifier?.exclude ?? []);
  const appliesToOptions = allIncludeOptions.filter(
    (option) => !excluded.has(option.value),
  );
  const appliesToText =
    appliesToOptions.length === allIncludeOptions.length
      ? t('modifiers.scopes.all')
      : appliesToOptions.length === 0
        ? t('modifiers.computed.none')
        : appliesToOptions.map((option) => t(option.labelKey)).join(', ');
  const value = modifier?.value ?? 0;
  const statistic = modifier?.statistic ?? 'agility';
  const statisticLabel = t(`attributes.${statistic}`, statistic).toUpperCase();
  const effectText = modifier?.source ?? '';

  return (
    <MorkBorgModal
      open={open}
      onClose={onClose}
      maxWidth="xs"
      title={t('modifiers.computed.modal.title')}
      actions={<Button onClick={onClose}>{t('common.close')}</Button>}
    >
      <Typography
        sx={{
          color: '#999',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {t('modifiers.computed.modal.source')}
      </Typography>
      <Typography sx={{ color: morkBorgColors.white }}>
        {t('modifiers.computed.from', { name: originName })}
      </Typography>

      <Typography
        sx={{
          color: '#999',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {t('modifiers.computed.modal.effect')}
      </Typography>
      <Typography sx={{ color: morkBorgColors.white }}>{effectText}</Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
        <ModifierStatChip label={statisticLabel} />
        <SignedModifierValue value={value} />
      </Box>

      <Typography
        sx={{
          color: '#999',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          mt: 0.5,
        }}
      >
        {t('modifiers.computed.appliesTo')}
      </Typography>
      <Typography sx={{ color: morkBorgColors.white }}>{appliesToText}</Typography>
    </MorkBorgModal>
  );
}
