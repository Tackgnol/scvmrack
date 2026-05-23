import {
  type FormEvent,
  type ReactNode,
  useId,
} from 'react';
import { useTranslation } from 'react-i18next';
import AddIcon from '@mui/icons-material/Add';
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import {
  scopeIncludeOptions,
  statOptions,
} from '@components/modifiers/config';
import { type ScopeOption } from '@components/modifiers/types';
import {
  CUSTOM_ARMOR_DICE,
  CUSTOM_DAMAGE_DICE,
  type ArmorPreset,
} from '@/inventory/customItems';
import {
  type EquipmentItem,
  type Statistic,
  type Character,
} from '@/hooks/models';
import { customStyles, morkBorgColors } from '@/theme/morkBorgTheme';
import { MorkBorgModal } from '@components/index';
import {
  FIELD_BOUNDS,
  type FieldName,
  useCustomItemForm,
} from '@/hooks/useCustomItemForm';
import KindSelector from './customItem/KindSelector';
import PanelHeading from './customItem/PanelHeading';
import CustomItemPreview from './customItem/CustomItemPreview';

interface CustomItemModalProps {
  open: boolean;
  character: Character | null | undefined;
  ammoTypes: string[];
  onClose: () => void;
  onCreate: (items: EquipmentItem[]) => void;
}

const armorPresets: ArmorPreset[] = ['light', 'medium', 'heavy'];
const modalInputStyles = customStyles.modal.input;

// Tight pair: damage die + ammo type. Other fields drop to one-up rhythm so
// nothing else competes with the primary pair.
const tightPairStyle = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) minmax(0, 1.2fr)' },
  gap: 1.25,
} as const;

// Single-up rhythm: stack secondary fields rather than packing them two-up.
// Pulls the eye down the form instead of bouncing it left-right-left.
const stackStyle = {
  display: 'grid',
  gap: 1.25,
} as const;

// Identity grid for "header" inputs (name / value): name takes more weight.
const identityGridStyle = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' },
  gap: 1.5,
} as const;

const panelStyle = {
  display: 'grid',
  gap: 1.25,
  // No surrounding border — the yellow rule + heading IS the divider.
  pl: 1.25,
  borderLeft: `1px solid ${morkBorgColors.darkGrey}`,
} as const;

// Vertical rhythm between top-level movements. Tight is too dense for the
// editorial tone; this gives each panel room to breathe.
const sectionGap = { mt: 3 } as const;

function formatRange(field: FieldName): string {
  const { min, max } = FIELD_BOUNDS[field];
  return `${min}–${max.toLocaleString()}`;
}

// Helper wrapper that pairs a TextField with a permanent range hint.
// When the value is out of range the hint flips to pink and the field
// shows its error state, but the hint is always visible — users see the
// boundary up front rather than being silently clamped.
function BoundedTextField({
  field,
  state,
  fieldErrors,
  helperText,
  inputProps,
  ...props
}: Omit<React.ComponentProps<typeof TextField>, 'error' | 'helperText'> & {
  field: FieldName;
  state: string;
  fieldErrors: Record<FieldName, boolean>;
  helperText?: ReactNode;
  inputProps?: Record<string, unknown>;
}) {
  const error = fieldErrors[field];
  const range = formatRange(field);
  const hint = helperText ? `${helperText} · ${range}` : range;

  return (
    <TextField
      {...props}
      value={state}
      type="number"
      error={error}
      helperText={hint}
      sx={modalInputStyles}
      slotProps={{
        htmlInput: {
          min: FIELD_BOUNDS[field].min,
          max: FIELD_BOUNDS[field].max,
          ...(inputProps ?? {}),
        },
      }}
    />
  );
}

export default function CustomItemModal({
  open,
  character,
  ammoTypes,
  onClose,
  onCreate,
}: CustomItemModalProps) {
  const { t } = useTranslation();
  const formId = useId();
  const {
    state,
    update,
    handleKindChange,
    handleArmorPresetChange,
    canSave,
    showModifierPanel,
    showQuantity,
    buildBundle,
    previewItems,
    fieldErrors,
  } = useCustomItemForm(open, character);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    const items = buildBundle();
    if (items.length === 0) return;
    onCreate(items);
    onClose();
  };

  return (
    <MorkBorgModal
      open={open}
      onClose={onClose}
      title={t('equipment.customItem.title', 'Forge an Item')}
      maxWidth="md"
      actions={
        <>
          <Button onClick={onClose}>{t('actions.cancel')}</Button>
          <Button
            startIcon={<AddIcon />}
            type="submit"
            form={formId}
            variant="contained"
            disabled={!canSave}
          >
            {t('equipment.customItem.create', 'Forge')}
          </Button>
        </>
      }
    >
      <Box
        component="form"
        id={formId}
        onSubmit={handleSubmit}
        sx={customStyles.inventorySection.modalContent}
        // Wrapping in a form gives Enter-to-submit and lets the action
        // button live in the modal footer (outside the children tree)
        // via `form={formId}`.
      >
        <KindSelector value={state.kind} onChange={handleKindChange} />

        <Box sx={sectionGap}>
          <CustomItemPreview items={previewItems} kind={state.kind} />
        </Box>

        <Box sx={{ ...sectionGap, ...panelStyle }}>
          <PanelHeading>
            {t('equipment.customItem.identity', 'Identity')}
          </PanelHeading>
          <Box sx={identityGridStyle}>
            <TextField
              required
              label={t('equipment.itemName')}
              value={state.name}
              onChange={(event) => update('name', event.target.value)}
              sx={modalInputStyles}
            />
            <BoundedTextField
              field="value"
              state={state.value}
              fieldErrors={fieldErrors}
              label={t('equipment.customItem.value', 'Value')}
              helperText={t(
                'equipment.customItem.valueHint',
                'Silver pieces',
              )}
              onChange={(event) => update('value', event.target.value)}
            />
          </Box>
          {showQuantity && (
            <BoundedTextField
              field="quantity"
              state={state.quantity}
              fieldErrors={fieldErrors}
              label={t('equipment.quantity')}
              helperText={t(
                'equipment.customItem.quantityHint',
                'How many copies',
              )}
              onChange={(event) => update('quantity', event.target.value)}
            />
          )}
          <Box sx={stackStyle}>
            <TextField
              multiline
              rows={2}
              label={t('character.description')}
              value={state.description}
              onChange={(event) => update('description', event.target.value)}
              sx={modalInputStyles}
            />
            <TextField
              multiline
              rows={2}
              label={t('equipment.customItem.comments', 'Comments')}
              value={state.comments}
              onChange={(event) => update('comments', event.target.value)}
              sx={modalInputStyles}
            />
          </Box>
        </Box>

        {state.kind === 'weapon' && (
          <Box sx={{ ...sectionGap, ...panelStyle }}>
            <PanelHeading>{t('equipment.customItem.weapon')}</PanelHeading>
            <Box sx={tightPairStyle}>
              <TextField
                select
                label={t('equipment.customItem.damageDie', 'Damage die')}
                value={state.damageDie}
                onChange={(event) => update('damageDie', event.target.value)}
                helperText={t(
                  'equipment.customItem.damageDieHint',
                  'Rolled when this weapon hits',
                )}
                sx={modalInputStyles}
              >
                {CUSTOM_DAMAGE_DICE.map((die) => (
                  <MenuItem key={die} value={String(die)}>
                    d{die}
                  </MenuItem>
                ))}
              </TextField>
              <Autocomplete
                freeSolo
                options={ammoTypes}
                inputValue={state.ammoType}
                onInputChange={(_event, nextValue) =>
                  update('ammoType', nextValue)
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('equipment.customItem.ammoType', 'Ammo type')}
                    helperText={t(
                      'equipment.customItem.ammoTypeHint',
                      'Leave blank for melee',
                    )}
                    sx={modalInputStyles}
                  />
                )}
              />
            </Box>
            {state.ammoType.trim() && (
              <BoundedTextField
                field="ammoAmount"
                state={state.ammoAmount}
                fieldErrors={fieldErrors}
                label={t('equipment.customItem.addAmmo', 'Add ammo')}
                helperText={t(
                  'equipment.customItem.addAmmoHint',
                  'Bundled stack — merges with existing of the same type',
                )}
                onChange={(event) => update('ammoAmount', event.target.value)}
              />
            )}
          </Box>
        )}

        {state.kind === 'ammo' && (
          <Box sx={{ ...sectionGap, ...panelStyle }}>
            <PanelHeading>{t('equipment.customItem.ammo')}</PanelHeading>
            <Box sx={tightPairStyle}>
              <Autocomplete
                freeSolo
                options={ammoTypes}
                inputValue={state.ammoType}
                onInputChange={(_event, nextValue) =>
                  update('ammoType', nextValue)
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('equipment.customItem.ammoType', 'Ammo type')}
                    helperText={t(
                      'equipment.customItem.ammoTypeHint2',
                      'e.g. Arrow, Bolt',
                    )}
                    sx={modalInputStyles}
                  />
                )}
              />
              <BoundedTextField
                field="ammoAmount"
                state={state.ammoAmount}
                fieldErrors={fieldErrors}
                label={t('equipment.customItem.amount', 'Amount')}
                helperText={t(
                  'equipment.customItem.amountHint',
                  'Pieces in this stack',
                )}
                onChange={(event) => update('ammoAmount', event.target.value)}
              />
            </Box>
          </Box>
        )}

        {state.kind === 'armor' && (
          <Box sx={{ ...sectionGap, ...panelStyle }}>
            <PanelHeading>{t('equipment.customItem.armor')}</PanelHeading>
            <Box sx={tightPairStyle}>
              <TextField
                select
                label={t('equipment.customItem.armorTier', 'Armor tier')}
                value={state.armorPreset}
                onChange={(event) =>
                  handleArmorPresetChange(event.target.value as ArmorPreset)
                }
                helperText={t(
                  'equipment.customItem.armorPresetHint',
                  'Picks the default die + tier',
                )}
                sx={modalInputStyles}
              >
                {armorPresets.map((preset) => (
                  <MenuItem key={preset} value={preset}>
                    {t(
                      `equipment.customItem.armorPresets.${preset}`,
                      preset.charAt(0).toUpperCase() + preset.slice(1),
                    )}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label={t('equipment.customItem.armorDie', 'Protection die')}
                value={state.armorDie}
                onChange={(event) => update('armorDie', event.target.value)}
                helperText={t(
                  'equipment.customItem.armorDieHint',
                  'Rolled when armor absorbs damage',
                )}
                sx={modalInputStyles}
              >
                {CUSTOM_ARMOR_DICE.map((die) => (
                  <MenuItem key={die} value={String(die)}>
                    d{die}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <BoundedTextField
              field="armorTier"
              state={state.armorTier}
              fieldErrors={fieldErrors}
              label={t('equipment.customItem.maxTier', 'Max tier')}
              helperText={t(
                'equipment.customItem.maxTierHint',
                '0 destroyed · 4 pristine',
              )}
              onChange={(event) => update('armorTier', event.target.value)}
            />
          </Box>
        )}

        {state.kind === 'consumable' && (
          <Box sx={{ ...sectionGap, ...panelStyle }}>
            <PanelHeading>{t('equipment.customItem.consumable')}</PanelHeading>
            <Box sx={tightPairStyle}>
              <TextField
                select
                label={t('equipment.customItem.consumeCount', 'Use count')}
                value={state.consumeMode}
                onChange={(event) =>
                  update(
                    'consumeMode',
                    event.target.value as 'fixed' | 'fixedPlusModifier',
                  )
                }
                helperText={t(
                  'equipment.customItem.consumeCountHint',
                  'How many uses before depleted',
                )}
                sx={modalInputStyles}
              >
                <MenuItem value="fixed">
                  {t('equipment.customItem.consumeModes.fixed', 'Fixed')}
                </MenuItem>
                <MenuItem value="fixedPlusModifier">
                  {t(
                    'equipment.customItem.consumeModes.fixedPlusModifier',
                    'Fixed + stat',
                  )}
                </MenuItem>
              </TextField>
              <BoundedTextField
                field="consumeBase"
                state={state.consumeBase}
                fieldErrors={fieldErrors}
                label={t('equipment.customItem.baseUses', 'Base uses')}
                helperText={t(
                  'equipment.customItem.baseUsesHint',
                  'Pips before depletion',
                )}
                onChange={(event) => update('consumeBase', event.target.value)}
              />
            </Box>
            {state.consumeMode === 'fixedPlusModifier' && (
              <TextField
                select
                label={t('equipment.customItem.statistic', 'Statistic')}
                value={state.consumeStatistic}
                onChange={(event) =>
                  update('consumeStatistic', event.target.value as Statistic)
                }
                helperText={t(
                  'equipment.customItem.statisticHint',
                  'Bonus pips equal to this stat\'s modifier',
                )}
                sx={modalInputStyles}
              >
                {statOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {t(`attributes.${option.value}`, option.label)}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Box>
        )}

        {showModifierPanel && (
          <Box sx={{ ...sectionGap, ...panelStyle }}>
            <PanelHeading>
              {t('equipment.customItem.modifierHeading', 'Modifier')}
            </PanelHeading>
            <FormControlLabel
              control={
                <Checkbox
                  checked={state.modifierEnabled}
                  onChange={(event) =>
                    update('modifierEnabled', event.target.checked)
                  }
                />
              }
              label={
                <Box component="span">
                  <Typography component="span" sx={{ display: 'block' }}>
                    {t(
                      'equipment.customItem.appliesModifier',
                      'Grants a modifier while equipped',
                    )}
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      display: 'block',
                      color: '#6b6b6b',
                      fontSize: '0.72rem',
                    }}
                  >
                    {t(
                      'equipment.customItem.appliesModifierHint',
                      'Adds a roll modifier to a chosen stat',
                    )}
                  </Typography>
                </Box>
              }
            />
            {state.modifierEnabled && (
              <>
                <Box sx={tightPairStyle}>
                  <BoundedTextField
                    field="modifierValue"
                    state={state.modifierValue}
                    fieldErrors={fieldErrors}
                    label={t('modifiers.value')}
                    helperText={t(
                      'equipment.customItem.modifierValueHint',
                      '+ helps, − hinders',
                    )}
                    onChange={(event) =>
                      update('modifierValue', event.target.value)
                    }
                  />
                  <TextField
                    select
                    label={t('modifiers.statistic')}
                    value={state.modifierStatistic}
                    onChange={(event) =>
                      update(
                        'modifierStatistic',
                        event.target.value as Statistic,
                      )
                    }
                    sx={modalInputStyles}
                  >
                    {statOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {t(`attributes.${option.value}`, option.label)}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
                <TextField
                  select
                  label={t(
                    'equipment.customItem.modifierAppliesTo',
                    'Applies to',
                  )}
                  value={state.modifierScope}
                  onChange={(event) =>
                    update('modifierScope', event.target.value as ScopeOption)
                  }
                  helperText={t(
                    'equipment.customItem.modifierAppliesToHint',
                    'Which rolls this modifier affects',
                  )}
                  sx={modalInputStyles}
                >
                  {scopeIncludeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {t(option.labelKey, option.value)}
                    </MenuItem>
                  ))}
                </TextField>
              </>
            )}
          </Box>
        )}
      </Box>
    </MorkBorgModal>
  );
}
