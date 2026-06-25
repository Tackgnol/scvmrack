import { Box, ButtonBase, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { rollToModifier } from '@/inventory/customItems';
import type { AbilityStat, ClasslessStatOption } from '@/api/draft';
import { DraftSection, type SectionProps } from './DraftSection';
import { morkBorgColors } from '@/theme/morkBorgTheme';
import { fonts } from '@/theme/createStyles';

const STATS: readonly AbilityStat[] = ['strength', 'agility', 'presence', 'toughness'];
const MAX_CLASSLESS_CHOICES = 2;

const statTiles = {
  strength: {
    bg: morkBorgColors.yellow,
    fg: morkBorgColors.black,
    label: morkBorgColors.black,
    raw: morkBorgColors.black,
    // Pink is the screen's accent budget — spent on the HP badge + selected
    // classless rows + the CTA. Passive stat tiles use yellow so pink stays loud.
    shadow: morkBorgColors.yellow,
    codeBg: morkBorgColors.black,
    codeFg: morkBorgColors.yellow,
  },
  agility: {
    bg: morkBorgColors.pink,
    fg: morkBorgColors.black,
    label: morkBorgColors.black,
    raw: morkBorgColors.black,
    shadow: morkBorgColors.yellow,
    codeBg: morkBorgColors.black,
    codeFg: morkBorgColors.pink,
  },
  presence: {
    bg: morkBorgColors.white,
    fg: morkBorgColors.black,
    label: morkBorgColors.black,
    raw: morkBorgColors.black,
    shadow: morkBorgColors.yellow,
    codeBg: morkBorgColors.black,
    codeFg: morkBorgColors.white,
  },
  toughness: {
    bg: morkBorgColors.black,
    fg: morkBorgColors.yellow,
    label: morkBorgColors.white,
    raw: morkBorgColors.white,
    shadow: morkBorgColors.yellow,
    codeBg: morkBorgColors.yellow,
    codeFg: morkBorgColors.black,
  },
} as const;

const statCodes = {
  strength: 'STR',
  agility: 'AGI',
  presence: 'PRE',
  toughness: 'TOU',
} as const;

// Deterministic "scatter" so the dice cluster looks hand-tossed and punky but
// never re-randomises across renders. Indexed by die position within the stat.
// Alternating x fans them left/right so centred numerals never collide even
// while the dice overlap vertically — readable pile, not a flat stack.
const DICE_SCATTER = [
  { rotate: -13, x: -7 },
  { rotate: 10, x: 8 },
  { rotate: -7, x: -9 },
  { rotate: 13, x: 6 },
  { rotate: -10, x: -5 },
  { rotate: 8, x: 9 },
] as const;

function ScatterDie({ value, index, selected }: { value: number; index: number; selected: boolean }) {
  const scatter = DICE_SCATTER[index % DICE_SCATTER.length];
  return (
    <Box
      component="span"
      sx={{
        display: 'grid',
        placeItems: 'center',
        width: { xs: 28, sm: 30 },
        height: { xs: 28, sm: 30 },
        mt: index === 0 ? 0 : -0.75,
        // Real-die look: bone face + black pips on the dark row (max legibility),
        // inverting to black + yellow on the selected yellow row.
        bgcolor: selected ? morkBorgColors.black : morkBorgColors.white,
        color: selected ? morkBorgColors.yellow : morkBorgColors.black,
        border: `2px solid ${morkBorgColors.black}`,
        // Hard offset shadow = the brand's stamped depth; pink marks the active row.
        boxShadow: `3px 3px 0 ${selected ? morkBorgColors.pink : morkBorgColors.yellow}`,
        fontFamily: fonts.display,
        fontSize: { xs: '1.05rem', sm: '1.15rem' },
        lineHeight: 1,
        transform: `rotate(${scatter.rotate}deg) translateX(${scatter.x}px)`,
      }}
    >
      {value}
    </Box>
  );
}

function toModifierLabel(value: number): string {
  const mod = rollToModifier(value);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function baseStatTransform(stat: AbilityStat): string {
  return stat === 'agility' || stat === 'toughness' ? 'rotate(0.4deg)' : 'rotate(-0.35deg)';
}

function StatsHpBadge({ hp, label }: { hp: number; label: string }) {
  return (
    <Typography
      component="span"
      data-testid="draft-stats-hp"
      sx={{
        display: 'inline-flex',
        alignItems: 'baseline',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        bgcolor: morkBorgColors.blood,
        color: morkBorgColors.yellow,
        border: `3px solid ${morkBorgColors.black}`,
        boxShadow: `5px 5px 0 ${morkBorgColors.pink}`,
        fontFamily: fonts.display,
        fontSize: { xs: '1.65rem', sm: '1.95rem' },
        lineHeight: 1,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        minWidth: { xs: 88, sm: 104 },
        px: { xs: 1.15, sm: 1.35 },
        py: { xs: 0.55, sm: 0.62 },
        mt: { xs: 0.05, sm: -0.1 },
        transform: 'skew(-9deg) rotate(-1.1deg)',
        transformOrigin: 'center',
      }}
    >
      <Box component="span" sx={{ display: 'inline-block', transform: 'skew(9deg)' }}>
        {label}: {hp}
      </Box>
    </Typography>
  );
}

type StandardStatTileProps = {
  stat: AbilityStat;
  value: number;
  label: string;
  code: string;
};

function StandardStatTile({ stat, value, label, code }: StandardStatTileProps) {
  const tile = statTiles[stat];

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'block',
        width: '100%',
        textAlign: 'center',
        bgcolor: tile.bg,
        color: tile.fg,
        border: `3px solid ${morkBorgColors.black}`,
        boxShadow: `4px 4px 0 ${tile.shadow}`,
        minHeight: 100,
        px: 1.1,
        py: 1.15,
        transform: baseStatTransform(stat),
      }}
    >
      <Box
        component="span"
        sx={{
          position: 'absolute',
          top: -10,
          left: 8,
          bgcolor: tile.codeBg,
          color: tile.codeFg,
          border: `2px solid ${morkBorgColors.black}`,
          fontFamily: fonts.label,
          fontSize: '0.66rem',
          letterSpacing: '0.12em',
          lineHeight: 1,
          px: 0.65,
          py: 0.45,
        }}
      >
        {code}
      </Box>
      <Typography
        component="span"
        sx={{
          display: 'block',
          color: tile.label,
          fontFamily: fonts.label,
          fontSize: '0.74rem',
          letterSpacing: '0.12em',
          lineHeight: 1,
          textTransform: 'uppercase',
          mt: 1,
        }}
      >
        {label}
      </Typography>
      <Typography
        component="span"
        sx={{
          display: 'block',
          color: tile.fg,
          fontFamily: fonts.display,
          fontSize: { xs: '2.35rem', sm: '2.75rem' },
          lineHeight: 0.9,
          mt: 0.9,
        }}
      >
        {toModifierLabel(value)}
        <Typography
          component="span"
          sx={{
            color: tile.raw,
            fontFamily: fonts.label,
            fontSize: '0.82rem',
            letterSpacing: '0.04em',
            ml: 0.5,
          }}
        >
          ({value})
        </Typography>
      </Typography>
    </Box>
  );
}

function ClasslessStatRow({
  stat,
  option,
  selected,
  locked,
  busy,
  fallbackValue,
  onToggle,
}: {
  stat: AbilityStat;
  option: ClasslessStatOption | undefined;
  selected: boolean;
  locked: boolean;
  busy: boolean;
  fallbackValue: number;
  onToggle: (stat: AbilityStat) => void;
}) {
  const { t } = useTranslation();
  const tile = statTiles[stat];
  const statLabel = t(`stats.${stat}`, stat);
  const statCode = t(`stats.abbr.${stat}`, statCodes[stat]);
  const currentTotal = option ? (selected ? option.maxTotal : option.minTotal) : fallbackValue;
  const maxTotal = option?.maxTotal ?? currentTotal;
  const minTotal = option?.minTotal ?? currentTotal;
  const disabled = busy || locked;
  const statusLabel = selected
    ? t('create.classlessStatsBoosted', 'Boosted')
    : locked
      ? t('create.classlessStatsLocked', 'Locked')
      : t('create.classlessStatsBoostTo', 'Tap for {{value}}', { value: toModifierLabel(maxTotal) });

  return (
    <ButtonBase
      data-testid={`draft-stat-choice-${stat}`}
      data-selected={selected ? 'true' : 'false'}
      aria-pressed={selected}
      aria-label={t(
        'create.classlessStatChoiceLabel',
        '{{stat}} dice {{dice}}, LOW {{min}}, MAX {{max}}',
        {
          stat: statLabel,
          dice: option?.dice.join(', ') ?? currentTotal,
          min: minTotal,
          max: maxTotal,
        },
      )}
      disabled={disabled}
      onClick={() => onToggle(stat)}
      sx={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: { xs: 'auto minmax(0, 1fr) auto', sm: 'auto minmax(0, 1fr) 126px' },
        alignItems: 'center',
        gap: { xs: 0.85, sm: 1.15 },
        textAlign: 'left',
        bgcolor: selected ? morkBorgColors.yellow : morkBorgColors.black,
        color: selected ? morkBorgColors.black : morkBorgColors.white,
        border: `3px solid ${selected ? morkBorgColors.black : tile.shadow}`,
        boxShadow: selected ? `6px 6px 0 ${morkBorgColors.pink}` : `4px 4px 0 ${morkBorgColors.yellow}`,
        minHeight: { xs: 104, sm: 96 },
        px: { xs: 0.85, sm: 1 },
        py: { xs: 0.85, sm: 0.9 },
        opacity: locked ? 0.58 : 1,
        transform: selected ? 'translate(-1px, -1px) rotate(-0.25deg)' : baseStatTransform(stat),
        transition:
          'transform 160ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 160ms cubic-bezier(0.22, 1, 0.36, 1), background-color 160ms cubic-bezier(0.22, 1, 0.36, 1), opacity 160ms cubic-bezier(0.22, 1, 0.36, 1)',
        '&:hover': {
          transform: disabled ? undefined : 'translate(-3px, -3px) rotate(-0.45deg)',
          boxShadow: disabled
            ? undefined
            : selected
              ? `8px 8px 0 ${morkBorgColors.pink}`
              : `6px 6px 0 ${morkBorgColors.pink}`,
        },
        '&.Mui-focusVisible': {
          outline: `3px solid ${morkBorgColors.yellow}`,
          outlineOffset: '2px',
        },
        '&.Mui-disabled': {
          color: selected ? morkBorgColors.black : morkBorgColors.white,
        },
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
        },
      }}
    >
      {option && option.dice.length > 0 ? (
        <Box
          data-testid={`draft-stat-dice-${stat}`}
          sx={{
            alignSelf: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: { xs: 58, sm: 64 },
            py: 0.75,
          }}
        >
          {option.dice.map((die, index) => (
            <ScatterDie key={`${stat}-${index}-${die}`} value={die} index={index} selected={selected} />
          ))}
        </Box>
      ) : (
        <Box
          component="span"
          sx={{
            alignSelf: 'stretch',
            minWidth: { xs: 40, sm: 44 },
            display: 'grid',
            placeItems: 'center',
            bgcolor: selected ? morkBorgColors.black : tile.bg,
            color: selected ? morkBorgColors.yellow : tile.fg,
            border: `2px solid ${selected ? morkBorgColors.black : tile.shadow}`,
            fontFamily: fonts.label,
            fontSize: { xs: '0.7rem', sm: '0.76rem' },
            letterSpacing: '0.13em',
            lineHeight: 1,
          }}
        >
          {statCode}
        </Box>
      )}

      <Box sx={{ minWidth: 0 }}>
        <Typography
          component="span"
          sx={{
            display: 'block',
            fontFamily: fonts.display,
            fontSize: { xs: '1.45rem', sm: '1.7rem' },
            letterSpacing: '0.04em',
            lineHeight: 1,
            textTransform: 'uppercase',
            color: selected ? morkBorgColors.black : morkBorgColors.white,
          }}
        >
          {statLabel}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: { xs: 0.45, sm: 0.65 },
            mt: 0.65,
            color: selected ? morkBorgColors.black : morkBorgColors.yellow,
          }}
        >
          <Typography
            component="span"
            data-testid={`draft-stat-min-${stat}`}
            sx={{
              fontFamily: fonts.label,
              fontSize: '0.74rem',
              letterSpacing: '0.12em',
              lineHeight: 1,
              textTransform: 'uppercase',
            }}
          >
            {t('create.classlessStatsLow', 'LOW {{value}}', { value: minTotal })}
          </Typography>
          <Typography
            component="span"
            sx={{
              color: selected ? morkBorgColors.black : morkBorgColors.white,
              fontFamily: fonts.label,
              fontSize: '0.74rem',
              opacity: selected ? 0.78 : 0.65,
              lineHeight: 1,
            }}
          >
            /
          </Typography>
          <Typography
            component="span"
            data-testid={`draft-stat-max-${stat}`}
            sx={{
              fontFamily: fonts.label,
              fontSize: '0.74rem',
              letterSpacing: '0.12em',
              lineHeight: 1,
              textTransform: 'uppercase',
            }}
          >
            {selected
              ? t('create.classlessStatsMaxChosen', 'MAX {{value}} picked', { value: maxTotal })
              : t('create.classlessStatsPickMax', 'Pick MAX {{value}}', { value: maxTotal })}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          justifySelf: 'end',
          textAlign: 'right',
          minWidth: { xs: 76, sm: 108 },
        }}
      >
        <Typography
          component="span"
          sx={{
            display: 'block',
            color: selected ? morkBorgColors.black : morkBorgColors.yellow,
            fontFamily: fonts.display,
            fontSize: { xs: '2.7rem', sm: '3.15rem' },
            lineHeight: 0.82,
          }}
        >
          {toModifierLabel(currentTotal)}
        </Typography>
        <Typography
          component="span"
          sx={{
            display: 'block',
            color: selected ? morkBorgColors.black : morkBorgColors.white,
            fontFamily: fonts.label,
            fontSize: '0.74rem',
            letterSpacing: '0.12em',
            lineHeight: 1,
            mt: 0.4,
            opacity: selected ? 0.8 : 0.75,
            textTransform: 'uppercase',
          }}
        >
          {t('create.classlessStatsScore', 'Score {{value}}', { value: currentTotal })}
        </Typography>
        <Box
          component="span"
          sx={{
            display: { xs: 'none', sm: 'inline-flex' },
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: selected ? morkBorgColors.black : locked ? morkBorgColors.darkGrey : morkBorgColors.yellow,
            color: selected ? morkBorgColors.yellow : locked ? morkBorgColors.white : morkBorgColors.black,
            border: `2px solid ${selected ? morkBorgColors.black : morkBorgColors.yellow}`,
            fontFamily: fonts.label,
            fontSize: '0.72rem',
            letterSpacing: '0.12em',
            lineHeight: 1,
            textTransform: 'uppercase',
            px: 0.8,
            py: 0.55,
            mt: 0.75,
            whiteSpace: 'nowrap',
          }}
        >
          {statusLabel}
        </Box>
      </Box>
    </ButtonBase>
  );
}

function DraftClasslessStatsSection({
  preview,
  draft,
  classlessStatOptions,
  rollingSection,
  busy,
  onReroll,
  onDropLowestAbilitiesChange,
}: SectionProps) {
  const { t } = useTranslation();
  const selectedAbilities = draft?.dropLowestAbilities ?? [];
  const selectedCount = selectedAbilities.length;
  const optionsByAbility = new Map((classlessStatOptions ?? []).map((option) => [option.ability, option]));

  const toggleClasslessChoice = (stat: AbilityStat) => {
    if (busy) return;
    const isSelected = selectedAbilities.includes(stat);
    if (isSelected) {
      onDropLowestAbilitiesChange(selectedAbilities.filter((ability) => ability !== stat));
      return;
    }
    if (selectedCount < MAX_CLASSLESS_CHOICES) {
      onDropLowestAbilitiesChange([...selectedAbilities, stat]);
    }
  };

  return (
    <DraftSection
      title={t('create.sections.stats', 'Stats & HP')}
      rolling={rollingSection === 'stats'}
      disabled={busy}
      onReroll={() => onReroll('stats')}
      rerollLabel={t('create.rerollStats', 'Re-roll stats')}
      testId="draft-stats"
      die="d6"
      headerAccessory={<StatsHpBadge hp={preview.maxHp ?? 0} label={t('create.hp', 'HP')} />}
    >
      <Box
        data-testid="draft-classless-stat-choice"
        sx={{
          display: 'grid',
          gap: { xs: 1, sm: 1.1 },
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'minmax(0, 1fr) auto', sm: 'minmax(0, 1fr) auto' },
            alignItems: 'center',
            gap: 1,
            bgcolor: morkBorgColors.yellow,
            color: morkBorgColors.black,
            border: `3px solid ${morkBorgColors.black}`,
            boxShadow: `5px 5px 0 ${morkBorgColors.pink}`,
            px: { xs: 1, sm: 1.25 },
            py: { xs: 0.95, sm: 1.1 },
            transform: 'rotate(-0.35deg)',
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              component="span"
              sx={{
                display: 'block',
                fontFamily: fonts.display,
                fontSize: { xs: '1.45rem', sm: '1.7rem' },
                letterSpacing: '0.04em',
                lineHeight: 1,
                textTransform: 'uppercase',
              }}
            >
              {t('create.classlessStatsTitle', 'Pick 2 boosted stats')}
            </Typography>
            <Typography
              sx={{
                color: morkBorgColors.black,
                fontFamily: fonts.body,
                fontSize: { xs: '0.92rem', sm: '0.98rem' },
                lineHeight: 1.25,
                mt: 0.35,
                maxWidth: '58ch',
              }}
            >
              {t(
                'create.classlessStatsHint',
                'Tap a row to keep its MAX roll. The rest lock to LOW.',
              )}
            </Typography>
          </Box>
          <Typography
            component="span"
            data-testid="draft-classless-stat-count"
            aria-live="polite"
            sx={{
              justifySelf: 'end',
              alignSelf: 'center',
              bgcolor: selectedCount === MAX_CLASSLESS_CHOICES ? morkBorgColors.black : morkBorgColors.pink,
              color: selectedCount === MAX_CLASSLESS_CHOICES ? morkBorgColors.yellow : morkBorgColors.black,
              border: `3px solid ${morkBorgColors.black}`,
              boxShadow: `3px 3px 0 ${selectedCount === MAX_CLASSLESS_CHOICES ? morkBorgColors.pink : morkBorgColors.black}`,
              fontFamily: fonts.label,
              fontSize: { xs: '0.72rem', sm: '0.78rem' },
              letterSpacing: '0.12em',
              lineHeight: 1,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              px: { xs: 0.8, sm: 1 },
              py: { xs: 0.75, sm: 0.85 },
            }}
          >
            {t('create.classlessStatsCount', '{{count}}/2 chosen', { count: selectedCount })}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            // 2-up on the full-width desktop card; single column in the mobile wizard.
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
            gap: { xs: 0.85, sm: 1.1 },
          }}
        >
          {STATS.map((stat) => {
            const option = optionsByAbility.get(stat);
            const selected = selectedAbilities.includes(stat);
            const locked = selectedCount >= MAX_CLASSLESS_CHOICES && !selected;

            return (
              <ClasslessStatRow
                key={stat}
                stat={stat}
                option={option}
                selected={selected}
                locked={locked}
                busy={busy}
                fallbackValue={preview[stat] ?? 10}
                onToggle={toggleClasslessChoice}
              />
            );
          })}
        </Box>
      </Box>
    </DraftSection>
  );
}

export function DraftStatsSection({
  preview,
  draft,
  classlessStatOptions,
  rollingSection,
  busy,
  onReroll,
  onNameChange,
  onDropLowestAbilitiesChange,
}: SectionProps) {
  const { t } = useTranslation();
  const isClasslessChoice = draft?.classless === true && (classlessStatOptions?.length ?? 0) > 0;

  if (isClasslessChoice) {
    return (
      <DraftClasslessStatsSection
        preview={preview}
        draft={draft}
        classlessStatOptions={classlessStatOptions}
        rollingSection={rollingSection}
        busy={busy}
        onReroll={onReroll}
        onNameChange={onNameChange}
        onDropLowestAbilitiesChange={onDropLowestAbilitiesChange}
      />
    );
  }

  return (
    <DraftSection
      title={t('create.sections.stats', 'Stats & HP')}
      rolling={rollingSection === 'stats'}
      disabled={busy}
      onReroll={() => onReroll('stats')}
      rerollLabel={t('create.rerollStats', 'Re-roll stats')}
      testId="draft-stats"
      die="d6"
      headerAccessory={<StatsHpBadge hp={preview.maxHp ?? 0} label={t('create.hp', 'HP')} />}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' },
          gap: { xs: 1, sm: 1.1 },
          textAlign: 'center',
        }}
      >
        {STATS.map((stat) => {
          const value = preview[stat] ?? 10;
          const statLabel = t(`stats.${stat}`, stat);
          const statCode = t(`stats.abbr.${stat}`, statCodes[stat]);

          return (
            <StandardStatTile
              key={stat}
              stat={stat}
              value={value}
              label={statLabel}
              code={statCode}
            />
          );
        })}
      </Box>
    </DraftSection>
  );
}
