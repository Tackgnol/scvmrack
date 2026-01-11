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
    const {results, isLoading, search, clearResults} = useItemSearch({limit: 15});

    const handleInputChange = (_: SyntheticEvent, value: string) => {
        setInputValue(value);
        if (value.length >= 2) search(value);
        else clearResults();
    };

    const handleSelect = (_: SyntheticEvent, value: ItemSearchHit | null) => {
        if (!value) return;
        onSelect(value);
        setInputValue('');
        clearResults();
    };

    return (
        <Autocomplete
            options={results}
            loading={isLoading}
            inputValue={inputValue}
            onInputChange={handleInputChange}
            onChange={handleSelect}
            getOptionLabel={(o) => o.name}
            isOptionEqualToValue={(a, b) =>
                a.id === b.id && a.item_type === b.item_type
            }
            filterOptions={(x) => x}
            renderOption={(props, option) => (
                <Box component="li" {...props} key={`${option.item_type}-${option.id}`}>
                    <Typography sx={customStyles.itemAutocomplete.itemName}>
                        {option.name}&nbsp;
                    </Typography>
                    <Typography sx={customStyles.itemAutocomplete.itemType}>
                        {option.item_type.toUpperCase()}
                    </Typography>
                </Box>
            )}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label ?? t('equipment.addItem')}
                    placeholder={placeholder}
                    size="small"
                />
            )}
        />
    );
}
