import { type CharacterListItem } from '@/hooks/models.ts';
import { morkBorgColors } from '@/theme/morkBorgTheme';
import { Box, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { CharacterRow } from './CharacterRow';

const tableStyles = {
  shell: {
    border: `2px solid ${morkBorgColors.black}`,
    backgroundColor: '#0f0f0f',
  },
  tableHeader: {
    display: { xs: 'none', sm: 'grid' },
    gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.4fr) 120px 180px 170px',
    gap: 2,
    px: 2,
    py: 1.25,
    borderBottom: `2px solid ${morkBorgColors.grey}`,
    backgroundColor: morkBorgColors.black,
  },
  tableHeaderCell: {
    fontFamily: '"Bebas Neue", sans-serif',
    color: morkBorgColors.yellow,
    letterSpacing: '0.08em',
    fontSize: '1rem',
    textTransform: 'uppercase' as const,
  },
};

type CharacterTableProps = {
  characters: CharacterListItem[];
  activeId?: string | null;
  deletingId: string | null;
  onOpen: (id?: string) => void;
  onDelete: (character: CharacterListItem) => void;
};

export function CharacterTable({
  characters,
  activeId,
  deletingId,
  onOpen,
  onDelete,
}: CharacterTableProps) {
  const { t } = useTranslation();

  return (
    <Box sx={tableStyles.shell}>
      <Box sx={tableStyles.tableHeader}>
        <Typography sx={tableStyles.tableHeaderCell}>{t('characters.columns.name', 'Name')}</Typography>
        <Typography sx={tableStyles.tableHeaderCell}>{t('characters.columns.class', 'Class')}</Typography>
        <Typography sx={tableStyles.tableHeaderCell}>{t('characters.columns.hp', 'HP')}</Typography>
        <Typography sx={tableStyles.tableHeaderCell}>{t('characters.columns.updated', 'Updated')}</Typography>
        <Typography sx={tableStyles.tableHeaderCell}>{t('characters.columns.actions', 'Actions')}</Typography>
      </Box>

      <Stack spacing={0}>
        {characters.map((character, index) => {
          const id = character.id || null;
          const cacheKeyBase = character.id ?? `${character.name ?? 'character'}-${index}`;
          return (
            <CharacterRow
              key={cacheKeyBase}
              character={character}
              isActive={id !== null && id === activeId}
              isDeleting={deletingId !== null && id === deletingId}
              cacheKeyBase={cacheKeyBase}
              onOpen={onOpen}
              onDelete={onDelete}
            />
          );
        })}
      </Stack>
    </Box>
  );
}
