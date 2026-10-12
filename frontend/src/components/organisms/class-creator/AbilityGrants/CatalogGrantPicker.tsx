import type { ItemSearchHit } from '@/hooks/useEquipmentSearch.ts';
import { useItemSearch } from '@/hooks/useEquipmentSearch.ts';
import { Autocomplete, TextField, Typography } from '@mui/material';
import { useState, type SyntheticEvent } from 'react';
import { useTranslation } from 'react-i18next';

type CatalogGrantPickerProps = {
  id: string;
  label: string;
  pinnedOptions: ItemSearchHit[];
  disabledPinnedKeys: string[];
  pet: boolean;
  onSelect: (key: string) => void;
  onClear: () => void;
};

/** Searches the shared catalog while keeping this class's own matching items at the top. */
export function CatalogGrantPicker({ id, label, pinnedOptions, disabledPinnedKeys, pet, onSelect, onClear }: CatalogGrantPickerProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const { results, isLoading, search, clearResults } = useItemSearch({ limit: 15 });
  const normalized = inputValue.trim().toLocaleLowerCase();
  const pinned = pinnedOptions.filter((item) => !normalized || item.name.toLocaleLowerCase().includes(normalized));
  const catalog = results.filter((item) => (pet ? item.itemType === 'pet' : item.itemType !== 'pet'));
  const options = [...pinned, ...catalog.filter((item) => !pinned.some((own) => own.key === item.key))];
  const onInputChange = (_event: SyntheticEvent, value: string, reason: string) => {
    if (reason === 'reset') {
      return;
    }
    setInputValue(value);
    const query = value.trim();
    if (query.length >= 2) {
      search(query);
    } else {
      clearResults();
    }
  };
  const onChange = (_event: SyntheticEvent, value: ItemSearchHit | null) => {
    if (!value) {
      onClear();
      setInputValue('');
      return;
    }
    onSelect(value.key);
    setInputValue(value.name);
  };
  return (
    <Autocomplete
      id={id}
      options={options}
      filterOptions={(items) => items}
      value={null}
      inputValue={inputValue}
      openOnFocus
      loading={isLoading}
      onInputChange={onInputChange}
      onChange={onChange}
      getOptionLabel={(item) => item.name}
      getOptionDisabled={(item) => disabledPinnedKeys.includes(item.key)}
      isOptionEqualToValue={(a, b) => a.key === b.key}
      groupBy={(item) => item.id < 0 ? t('creator.items.thisClass', 'This class') : ''}
      renderGroup={(params) => <li key={params.key}>{params.group && <Typography>{params.group}</Typography>}<ul>{params.children}</ul></li>}
      renderInput={(params) => <TextField {...params} label={label} size="small" />}
    />
  );
}
