import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { customStyles, morkBorgColors } from '@/theme/morkBorgTheme';
import { useModifiersPanel } from '@/hooks/useModifiersPanel';
import ModifierShiftBadge from '@components/atoms/ModifierShiftBadge';
import ComputedModifiersGrid from '@components/molecules/modifiers/ComputedModifiersGrid';
import CustomModifiersGrid from '@components/molecules/modifiers/CustomModifiersGrid';
import ModifiersQuickForm from '@components/molecules/modifiers/ModifiersQuickForm';
import ModifierAdvancedModal from '@components/molecules/modifiers/ModifierAdvancedModal';
import ComputedModifierDetailsModal from '@components/molecules/modifiers/ComputedModifierDetailsModal';

const modifiersTitleStyle = {
  ...customStyles.abilities.title,
  transform: 'rotate(0.5deg)',
};

export default function ModifiersPanel() {
  const { t } = useTranslation();
  const { state, actions } = useModifiersPanel();

  return (
    <Box
      sx={{
        mb: 2,
        bgcolor: morkBorgColors.black,
        border: `3px solid ${morkBorgColors.black}`,
        boxShadow: `6px 6px 0 ${morkBorgColors.pink}`,
        p: { xs: 1.5, sm: 2.5 },
        pt: { xs: 3, sm: 3.5 },
        position: 'relative',
      }}
    >
      <Typography
        variant="h3"
        sx={{
          ...modifiersTitleStyle,
          position: 'absolute',
          top: { xs: -14, sm: -16 },
          left: { xs: 12, sm: 16 },
          zIndex: 1,
        }}
      >
        {t('modifiers.title')}
      </Typography>

      <Box sx={{ position: 'relative' }}>
        {state.modifierShiftLabel && (
          <ModifierShiftBadge
            label={state.modifierShiftLabel}
            reduceMotion={state.prefersReducedMotion}
          />
        )}

        <ComputedModifiersGrid
          modifiers={state.computedModifiers}
          reduceMotion={state.prefersReducedMotion}
          onOpenModifier={actions.openComputedModifierModal}
        />

        <CustomModifiersGrid
          modifiers={state.customModifiers}
          removingModifierIds={state.removingModifierIds}
          reduceMotion={state.prefersReducedMotion}
          onEditModifier={actions.openEditModifierModal}
          onRemoveModifier={actions.removeCustomModifier}
        />

        <ModifiersQuickForm
          name={state.quickForm.name}
          stat={state.quickForm.stat}
          valueStr={state.quickForm.valueStr}
          scope={state.quickForm.scope}
          onNameChange={actions.setName}
          onStatChange={actions.setStat}
          onValueChange={actions.setValueStr}
          onScopeChange={actions.setScope}
          onSubmit={actions.handleQuickAdd}
          onOpenAdvanced={actions.openAdvancedModal}
        />

        <ModifierAdvancedModal
          open={state.advancedModal.open}
          isEditing={state.advancedModal.isEditing}
          canSave={state.advancedModal.canSave}
          name={state.advancedModal.name}
          stat={state.advancedModal.stat}
          valueStr={state.advancedModal.valueStr}
          scope={state.advancedModal.scope}
          includes={state.advancedModal.includes}
          comment={state.advancedModal.comment}
          onClose={actions.closeAdvancedModal}
          onSave={actions.saveAdvancedModifier}
          onNameChange={actions.setModalName}
          onStatChange={actions.setModalStat}
          onValueChange={actions.setModalValueStr}
          onScopeChange={actions.handleModalScopeChange}
          onToggleInclude={actions.toggleModalInclude}
          onCommentChange={actions.setModalComment}
        />

        <ComputedModifierDetailsModal
          open={state.computedModal.open}
          modifier={state.computedModal.selectedModifier}
          onClose={actions.closeComputedModifierModal}
        />
      </Box>
    </Box>
  );
}
