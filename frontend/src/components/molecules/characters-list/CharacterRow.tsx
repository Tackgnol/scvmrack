import { type CharacterListItem } from '@/hooks/models.ts';
import { AnimatedNumber } from '@components/index';
import { morkBorgColors } from '@/theme/morkBorgTheme';
import { Box, Button, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const rowStyles = {
  row: (isActive: boolean) => ({
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 2fr) minmax(0, 1.4fr) 120px 180px 170px' },
    gap: { xs: 1.25, sm: 2 },
    px: 2,
    py: 1.5,
    borderBottom: `1px solid ${morkBorgColors.grey}`,
    backgroundColor: isActive ? '#1a1a1a' : '#111',
    '&:last-child': {
      borderBottom: 0,
    },
  }),
  cell: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    gap: 0.5,
  },
  mobileLabel: {
    display: { xs: 'block', sm: 'none' },
    fontSize: '0.62rem',
    color: morkBorgColors.pink,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    fontFamily: '"Bebas Neue", sans-serif',
  },
  characterName: {
    fontFamily: '"MedievalSharp", serif',
    color: morkBorgColors.yellow,
    fontSize: { xs: '1.35rem', sm: '1.15rem' },
    lineHeight: 1.1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  text: {
    color: morkBorgColors.white,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  hpText: {
    color: morkBorgColors.white,
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '1rem',
    letterSpacing: '0.04em',
  },
  dateText: {
    color: morkBorgColors.white,
    opacity: 0.75,
    fontSize: '0.85rem',
  },
  actions: {
    display: 'flex',
    justifyContent: { xs: 'stretch', sm: 'flex-end' },
    alignItems: 'center',
    flexDirection: { xs: 'row', sm: 'row' },
    gap: 1,
    minWidth: 0,
  },
  openButton: {
    flex: { xs: 1, sm: '0 0 auto' },
    minWidth: 78,
    bgcolor: morkBorgColors.yellow,
    color: morkBorgColors.black,
    borderRadius: 0,
    '&:hover': {
      bgcolor: morkBorgColors.white,
    },
  },
  deleteButton: {
    flex: { xs: 1, sm: '0 0 auto' },
    minWidth: 78,
    borderColor: morkBorgColors.pink,
    color: morkBorgColors.pink,
    borderRadius: 0,
    '&:hover': {
      borderColor: morkBorgColors.yellow,
      color: morkBorgColors.yellow,
      backgroundColor: 'rgba(255, 233, 0, 0.08)',
    },
  },
};

type CharacterRowProps = {
  character: CharacterListItem;
  isActive: boolean;
  isDeleting: boolean;
  cacheKeyBase: string;
  onOpen: (id?: string) => void;
  onDelete: (character: CharacterListItem) => void;
};

export function CharacterRow({
  character,
  isActive,
  isDeleting,
  cacheKeyBase,
  onOpen,
  onDelete,
}: CharacterRowProps) {
  const { t } = useTranslation();
  const id = character.id || null;
  const name = (character.name || '').trim() || t('characters.unnamed', 'Unnamed Scvm');
  const className =
    (character.className || '').trim() || t('characters.unknownClass', 'Unknown');

  return (
    <Box
      sx={rowStyles.row(isActive)}
      data-testid={id ? `character-row-${id}` : undefined}
    >
      <Box sx={rowStyles.cell}>
        <Typography sx={rowStyles.mobileLabel}>
          {t('characters.columns.name', 'Name')}
        </Typography>
        <Typography sx={rowStyles.characterName}>{name}</Typography>
      </Box>

      <Box sx={rowStyles.cell}>
        <Typography sx={rowStyles.mobileLabel}>
          {t('characters.columns.class', 'Class')}
        </Typography>
        <Typography sx={rowStyles.text}>{className}</Typography>
      </Box>

      <Box sx={rowStyles.cell}>
        <Typography sx={rowStyles.mobileLabel}>
          {t('characters.columns.hp', 'HP')}
        </Typography>
        <Typography sx={rowStyles.hpText}>
          <AnimatedNumber
            value={character.currentHp ?? 0}
            cacheKey={`${cacheKeyBase}:list:current-hp`}
            durationMs={300}
          />
          {'/'}
          <AnimatedNumber
            value={character.maxHp ?? 0}
            cacheKey={`${cacheKeyBase}:list:max-hp`}
            durationMs={300}
          />
        </Typography>
      </Box>

      <Box sx={rowStyles.cell}>
        <Typography sx={rowStyles.mobileLabel}>
          {t('characters.columns.updated', 'Updated')}
        </Typography>
        <Typography sx={rowStyles.dateText}>{formatDate(character.updatedAt)}</Typography>
      </Box>

      <Box sx={rowStyles.actions}>
        <Button
          size="small"
          variant="contained"
          sx={rowStyles.openButton}
          data-testid={id ? `open-character-${id}` : undefined}
          onClick={() => onOpen(character.id)}
          disabled={!character.id || isDeleting}
        >
          {t('characters.open', 'Open')}
        </Button>
        <Button
          size="small"
          variant="outlined"
          sx={rowStyles.deleteButton}
          data-testid={id ? `delete-character-${id}` : undefined}
          onClick={() => onDelete(character)}
          disabled={!character.id || isDeleting}
        >
          {isDeleting
            ? t('characters.deleting', 'Deleting...')
            : t('characters.delete', 'Delete')}
        </Button>
      </Box>
    </Box>
  );
}
