import { Alert, Box, CircularProgress, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCharacterDraft } from '@/hooks/useCharacterDraft';
import { useExistingGuestScvm } from '@/hooks/useExistingGuestScvm';
import { ClassGate } from '@/components/organisms/character-create/ClassGate';
import { CreateSheetDesktop } from '@/components/organisms/character-create/CreateSheetDesktop';
import { CreateSheetMobile } from '@/components/organisms/character-create/CreateSheetMobile';
import { CreateSummaryBar } from '@/components/organisms/character-create/CreateSummaryBar';
import { ForgeReplaceModal } from '@/components/molecules/character-create/ForgeReplaceModal';
import { useCharacter } from '@/CharacterContext/CharacterContext';
import type { CharacterResponse } from '@/hooks/models';
import { createPageStyles as styles } from '@/theme/createStyles';

type ForgeFlowProps = {
  // Called once with the freshly created character. The caller owns what happens
  // next (go to the sheet, or bind to a party and navigate) — this component is
  // deliberately navigation-agnostic so it can back both flows.
  onCreated: (character: CharacterResponse) => void;
};

// The whole forge state machine (class gate → roll/re-roll → confirm) as a
// presentational unit. Extracted from CharacterCreatePage so the party
// "forge and join" route can reuse it with a different completion behaviour.
export function ForgeFlow({ onCreated }: ForgeFlowProps) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isGuest } = useCharacter();
  const locale = (i18n.language ?? 'en').split('-')[0];

  const {
    phase,
    draft,
    preview,
    classlessStatOptions,
    rollingSection,
    isChoosingStats,
    isStarting,
    isConfirming,
    error,
    start,
    reroll,
    setName,
    setDropLowestAbilities,
    confirm,
    restart,
  } = useCharacterDraft(locale, { onCreated });

  // Guests keep a single scvm: forging replaces the one they already own (the
  // backend prunes it on create). Surface that — a passive notice while drafting
  // and a confirm gate at the destructive click. Authenticated accounts keep
  // their roster, so `existingScvm` stays null and neither appears.
  const existingScvm = useExistingGuestScvm(isGuest);
  const [replaceOpen, setReplaceOpen] = useState(false);

  const handleConfirm = () => {
    if (existingScvm) {
      setReplaceOpen(true);
      return;
    }
    void confirm();
  };

  const handleReplaceConfirm = async () => {
    await confirm(true);
    setReplaceOpen(false);
  };

  const busy = rollingSection !== null || isStarting || isChoosingStats;
  const selectedDropLowestCount = draft?.classless ? (draft.dropLowestAbilities?.length ?? 0) : 2;
  const classlessStatsReady = !draft?.classless || selectedDropLowestCount === 2;
  const classlessStatusMessage = draft?.classless && !classlessStatsReady
    ? t('create.classlessStatsRequired', 'Pick {{count}}/2 MAX stats', { count: selectedDropLowestCount })
    : null;

  return (
    <Box sx={styles.page}>
      {error && <Alert severity="error" sx={styles.alert}>{error}</Alert>}

      {existingScvm && (
        <Box sx={styles.replaceNotice} role="note" data-testid="create-replace-notice">
          <Box component="span" sx={styles.replaceNoticeIcon} aria-hidden="true">
            ⚠
          </Box>
          <Typography sx={styles.replaceNoticeText}>
            {t(
              'create.replaceNotice',
              'Forging replaces your only scvm, "{{name}}".',
              { name: existingScvm.name || t('character.unnamedWretch', 'Unnamed wretch') }
            )}
          </Typography>
        </Box>
      )}

      {phase === 'class-gate' && !isStarting && (
        <ClassGate onPick={(choice) => void start(choice)} busy={isStarting} />
      )}

      {isStarting && (
        <Box sx={styles.loadingPanel}>
          <CircularProgress color="inherit" />
        </Box>
      )}

      {phase === 'sheet' && preview && (
        <>
          <Box component="section" sx={styles.sheetHeader}>
            <Typography component="span" sx={styles.sheetKicker}>
              {t('create.sheetKicker', 'Draft in progress')}
            </Typography>
            <Typography component="h1" sx={styles.sheetTitle}>
              {preview.name || t('create.namePlaceholder', 'Name the wretch')}
            </Typography>
            <Typography sx={styles.sheetMeta}>
              {preview.className ?? t('create.classlessLabel', 'Classless')} | {t('create.sheetHint', 'Re-roll any section, then bind the wretch to your rack.')}
            </Typography>
          </Box>
          {isMobile ? (
            <CreateSheetMobile
              preview={preview}
              draft={draft}
              classlessStatOptions={classlessStatOptions}
              rollingSection={rollingSection}
              busy={busy}
              onReroll={(section) => void reroll(section)}
              onNameChange={setName}
              onDropLowestAbilitiesChange={(abilities) => void setDropLowestAbilities(abilities)}
            />
          ) : (
            <CreateSheetDesktop
              preview={preview}
              draft={draft}
              classlessStatOptions={classlessStatOptions}
              rollingSection={rollingSection}
              busy={busy}
              onReroll={(section) => void reroll(section)}
              onNameChange={setName}
              onDropLowestAbilitiesChange={(abilities) => void setDropLowestAbilities(abilities)}
            />
          )}
          <CreateSummaryBar
            className={preview.className ?? null}
            onConfirm={handleConfirm}
            onRestart={restart}
            confirming={isConfirming}
            busy={busy}
            confirmDisabled={!classlessStatsReady}
            statusMessage={classlessStatusMessage}
          />
        </>
      )}

      <ForgeReplaceModal
        open={replaceOpen}
        scvmName={existingScvm?.name || t('character.unnamedWretch', 'Unnamed wretch')}
        replacing={isConfirming}
        onCancel={() => setReplaceOpen(false)}
        onConfirm={() => void handleReplaceConfirm()}
      />
    </Box>
  );
}
