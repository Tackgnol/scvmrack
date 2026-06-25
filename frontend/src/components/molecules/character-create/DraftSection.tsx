import type { ReactNode } from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { sectionStyles } from '@/theme/createStyles';
import type { CharacterResponse } from '@/hooks/models';
import type {
  AbilityStat,
  CharacterDraft,
  ClasslessStatOption,
  DraftSection as DraftSectionName,
} from '@/api/draft';
import d4Icon from '@/assets/D4.svg';
import d6Icon from '@/assets/D6.svg';
import d8Icon from '@/assets/D8.svg';
import d10Icon from '@/assets/D10.svg';
import d12Icon from '@/assets/D12.svg';
import d20Icon from '@/assets/D20.svg';
import d100Icon from '@/assets/D100.svg';

export type DieKind = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

const diceIcons: Record<DieKind, string> = {
  d4: d4Icon,
  d6: d6Icon,
  d8: d8Icon,
  d10: d10Icon,
  d12: d12Icon,
  d20: d20Icon,
  d100: d100Icon,
};

export type SectionProps = {
  preview: CharacterResponse;
  draft: CharacterDraft | null;
  classlessStatOptions: ClasslessStatOption[] | null;
  rollingSection: DraftSectionName | null;
  busy: boolean;
  onReroll: (section: DraftSectionName) => void;
  onNameChange: (name: string) => void;
  onDropLowestAbilitiesChange: (abilities: AbilityStat[]) => void;
};

export type DraftSectionProps = {
  title: string;
  rolling: boolean;
  buttonRolling?: boolean;
  onReroll: () => void;
  rerollLabel: string;
  disabled?: boolean;
  headerAccessory?: ReactNode;
  extraActions?: ReactNode;
  children: ReactNode;
  testId: string;
  die?: DieKind;
};

function RollButtonContent({ die }: { die: DieKind }) {
  const { t } = useTranslation();
  return (
    <>
      <Box
        component="img"
        src={diceIcons[die]}
        alt=""
        aria-hidden="true"
        className="draft-die-icon"
      />
      <Box component="span" className="draft-roll-label">
        {t('create.roll', 'Roll')}
      </Box>
    </>
  );
}

type DraftRollButtonProps = {
  testId: string;
  label: string;
  die: DieKind;
  disabled?: boolean;
  rolling?: boolean;
  onClick: () => void;
};

export function DraftRollButton({
  testId,
  label,
  die,
  disabled = false,
  rolling = false,
  onClick,
}: DraftRollButtonProps) {
  return (
    <Tooltip title={label}>
      <span>
        <IconButton
          data-testid={testId}
          data-rolling={rolling ? 'true' : undefined}
          aria-label={label}
          onClick={onClick}
          disabled={disabled || rolling}
          size="small"
          sx={sectionStyles.rerollButton(rolling)}
        >
          <RollButtonContent die={die} />
        </IconButton>
      </span>
    </Tooltip>
  );
}

export function DraftSection({
  title,
  rolling,
  buttonRolling,
  onReroll,
  rerollLabel,
  disabled = false,
  headerAccessory,
  extraActions,
  children,
  testId,
  die = 'd20',
}: DraftSectionProps) {
  const isButtonRolling = buttonRolling ?? rolling;
  return (
    <Box sx={sectionStyles.root} data-testid={testId}>
      <Box sx={sectionStyles.header}>
        <Typography component="h2" sx={sectionStyles.title}>{title}</Typography>
        <Box sx={sectionStyles.headerAccessory}>{headerAccessory}</Box>
        <Box sx={sectionStyles.actionRow}>
          {extraActions}
          <DraftRollButton
            testId={`${testId}-reroll`}
            label={rerollLabel}
            onClick={onReroll}
            disabled={disabled}
            rolling={isButtonRolling}
            die={die}
          />
        </Box>
      </Box>
      <Box sx={sectionStyles.content} aria-busy={rolling}>
        {children}
      </Box>
    </Box>
  );
}
