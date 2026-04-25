import { useCharacter } from '@/CharacterContext/CharacterContext.tsx';
import { ItemSearchHit } from '@/hooks/useEquipmentSearch';
import ItemAutocomplete from '@components/molecules/ItemAutocomplete';
import { Box, Button, Divider, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { customStyles } from '@theme/morkBorgTheme.ts';
import MorkBorgModal from '../molecules/modal/MorkBorgModal';

interface GearSlotProps {
  label: string;
  name?: string;
  detail?: string;
  onClick: () => void;
}

// 1. Gear Slot is strictly display only (No TextFields)
function GearSlot({ label, name, detail, onClick }: GearSlotProps) {
  const isEmpty = !name;
  return (
    <Box onClick={onClick} sx={customStyles.gearSlot.base}>
      <Typography variant="subtitle2" sx={customStyles.gearSlot.label}>
        {label}
      </Typography>

      <Typography
        variant="h6"
        sx={
          isEmpty
            ? customStyles.gearSlot.nameEmpty
            : customStyles.gearSlot.nameFilled
        }
      >
        {isEmpty ? 'Empty Slot' : name}
      </Typography>

      {/* 2. Only show detail if it exists */}
      {!isEmpty && detail && (
        <Typography variant="body2" sx={customStyles.gearSlot.detail}>
          {detail}
        </Typography>
      )}
    </Box>
  );
}

export function EquipmentSection() {
  const { character, updateWeaponField, updateArmorField } = useCharacter();
  const { t } = useTranslation();

  const specialItems: string[] = [];

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<{
    type: 'weapon' | 'armor' | 'other';
    index?: number;
    title: string;
    name: string;
    description: string;
    comments: string; // 7. Free text field 'comments'
  }>({ type: 'weapon', title: '', name: '', description: '', comments: '' });

  const weapon0 = character?.equippedWeapons?.[0];
  const weapon1 = character?.equippedWeapons?.[1];
  const armor = character?.equippedArmor;

  const handleSlotClick = (
    type: 'weapon' | 'armor' | 'other',
    item: { name?: string; description?: string; comments?: string },
    title: string,
    index?: number
  ) => {
    setEditingSlot({
      type,
      index,
      title,
      name: item.name || '',
      description: item.description || '',
      comments: item.comments || '', // Load existing comments if available
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (
      editingSlot.type === 'weapon' &&
      typeof editingSlot.index === 'number'
    ) {
      updateWeaponField(editingSlot.index, 'name', editingSlot.name);
      updateWeaponField(
        editingSlot.index,
        'description',
        editingSlot.description
      );
      // Ideally: updateWeaponField(editingSlot.index, 'comments', editingSlot.comments);
    } else if (editingSlot.type === 'armor') {
      updateArmorField('name', editingSlot.name);
      updateArmorField('description', editingSlot.description);
    }
    setModalOpen(false);
  };

  // 3. Add Item Logic
  const handleAutocompleteSelect = (item: ItemSearchHit) => {
    // Find first empty weapon slot
    console.log(item);
    const w0Empty = !character?.equippedWeapons?.[0]?.name;
    const w1Empty = !character?.equippedWeapons?.[1]?.name;

    let targetIndex = 0;
    if (!w0Empty && w1Empty) targetIndex = 1;
    // If both full, default to 0 (overwrite)

    updateWeaponField(targetIndex, 'name', item.name);
    updateWeaponField(targetIndex, 'description', item.description || '');
  };

  return (
    <Box sx={customStyles.equipmentSection.container}>
      <Typography
        variant="h3"
        color="secondary"
        sx={customStyles.equipmentSection.sectionTitle}
      >
        {t('equipment.equippedGear')}
      </Typography>

      <Box sx={customStyles.equipmentSection.gearGrid}>
        <GearSlot
          label={t('equipment.weapon').toUpperCase()}
          name={weapon0?.name}
          detail={weapon0?.description}
          onClick={() =>
            handleSlotClick('weapon', weapon0 || {}, t('equipment.weapon'), 0)
          }
        />
        <GearSlot
          label={t('equipment.offHand')}
          name={weapon1?.name}
          detail={weapon1?.description}
          onClick={() =>
            handleSlotClick('weapon', weapon1 || {}, t('equipment.offHand'), 1)
          }
        />
        <GearSlot
          label={t('equipment.armorLabel').toUpperCase()}
          name={armor?.name}
          detail={armor?.description}
          onClick={() =>
            handleSlotClick('armor', armor || {}, t('equipment.armorLabel'))
          }
        />

        {/* 4. Second Section (Other) only appears if items exist */}
        {specialItems.length > 0 && (
          <GearSlot
            label={t('equipment.other')}
            name=""
            detail=""
            onClick={() => handleSlotClick('other', {}, t('equipment.other'))}
          />
        )}
      </Box>

      {/* 5. Autocomplete Header and Space */}
      <Box sx={customStyles.equipmentSection.addItemsSection}>
        <Divider sx={customStyles.equipmentSection.addItemsDivider} />
        <Typography
          variant="h5"
          sx={customStyles.equipmentSection.addItemsTitle}
        >
          {t('equipment.addItems') || 'Add New Items'}
        </Typography>

        <ItemAutocomplete
          onSelect={handleAutocompleteSelect}
          placeholder="Search equipment database..."
        />
      </Box>

      {/* Modal */}
      <MorkBorgModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="xs"
        title={`Edit ${editingSlot.title}`}
        actions={
          <>
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} variant="contained">
              Save
            </Button>
          </>
        }
      >
        <TextField
          autoFocus
          label="Name"
          value={editingSlot.name}
          onChange={(e) =>
            setEditingSlot((prev) => ({ ...prev, name: e.target.value }))
          }
          variant="outlined"
          fullWidth
          sx={customStyles.equipmentModalInput}
        />
        <TextField
          label="Description / Damage"
          value={editingSlot.description}
          onChange={(e) =>
            setEditingSlot((prev) => ({ ...prev, description: e.target.value }))
          }
          variant="outlined"
          fullWidth
          multiline
          rows={2}
          sx={customStyles.equipmentModalInput}
        />

        {/* 7. Requested Comments Field */}
        <TextField
          label="Comments / Notes"
          value={editingSlot.comments}
          onChange={(e) =>
            setEditingSlot((prev) => ({ ...prev, comments: e.target.value }))
          }
          variant="outlined"
          fullWidth
          multiline
          rows={3}
          placeholder="Add your custom notes here..."
          sx={customStyles.equipmentModalInput}
        />
      </MorkBorgModal>
    </Box>
  );
}
