import {ItemSearchHit, useItemSearch} from '@/hooks/useEquipmentSearch.ts';
import {Autocomplete, Box, TextField, Typography} from '@mui/material';
import {SyntheticEvent, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {customStyles} from '../theme/morkBorgTheme';

interface ItemAutocompleteProps {
    onSelect: (item: ItemSearchHit) => void;
    placeholder?: string;
    label?: string;
}

export default function ItemAutocomplete({
                                             onSelect,
                                             placeholder,
                                             label
                                         }: ItemAutocompleteProps) {
    const {t} = useTranslation();
    const [inputValue, setInputValue] = useState('');
    const [selectedValue, setSelectedValue] = useState<ItemSearchHit | null>(null);
    const {results, isLoading, search, clearResults} = useItemSearch({limit: 15});

    const resetAutocomplete = () => {
        setSelectedValue(null);
        setInputValue('');
        clearResults();
    };

    const handleInputChange = (_: SyntheticEvent, value: string, reason: string) => {
        if (reason === 'reset') {
            return;
        }

        if (reason === 'clear') {
            resetAutocomplete();
            return;
        }

        setInputValue(value);
        if (value.length >= 2) search(value);
        else clearResults();
    };

    const handleSelect = (_: SyntheticEvent, value: ItemSearchHit | null) => {
        if (!value) {
            resetAutocomplete();
            return;
        }

        onSelect(value);
        resetAutocomplete();
    };

    return (
        <Autocomplete
            options={results}
            loading={isLoading}
            value={selectedValue}
            inputValue={inputValue}
            onInputChange={handleInputChange}
            onChange={handleSelect}
            getOptionLabel={(o) => o.name}
            isOptionEqualToValue={(a, b) =>
                a.id === b.id && a.itemType === b.itemType
            }
            filterOptions={(x) => x}
            renderOption={(props, option) => (
                <Box component="li" {...props} key={`${option.itemType}-${option.id}`}>
                    <Typography sx={customStyles.itemAutocomplete.itemName}>
                        {option.name}&nbsp;
                    </Typography>
                    <Typography sx={customStyles.itemAutocomplete.itemType}>
                        {(option.itemType ?? 'equipment').toUpperCase()}
                    </Typography>
                </Box>
            )}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label ?? t('equipment.addItem')}
                    placeholder={placeholder}
                    size="small"
                    inputProps={{
                        ...params.inputProps,
                        "data-testid": "equipment-search-input"
                    }}
                />
            )}
        />
    );
}
