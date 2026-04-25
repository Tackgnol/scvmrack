import {ItemSearchHit, useItemSearch} from '@/hooks/useEquipmentSearch.ts';
import {customStyles} from '@/theme/morkBorgTheme';
import {Autocomplete, Box, TextField, Typography} from '@mui/material';
import {SyntheticEvent, useState} from 'react';
import {useTranslation} from 'react-i18next';

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
        console.log('Selected item:', value);
        if (!value) {
            resetAutocomplete();
            return;
        }
        console.log('Calling onSelect with:', value);
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
                !!a && !!b && a.id === b.id && a.itemType === b.itemType
            }
            filterOptions={(x) => x}
            renderOption={(props, option) => {
                const { key: _ignoredKey, ...rest } = props;
                return (
                    <Box
                        component="li"
                        key={`${option.itemType}-${option.id}`}
                        {...rest}
                    >
                        <Typography sx={customStyles.itemAutocomplete.itemName}>
                            {option.name}&nbsp;
                        </Typography>
                        <Typography sx={customStyles.itemAutocomplete.itemType}>
                            {(option.itemType ?? 'equipment').toUpperCase()}
                        </Typography>
                    </Box>
                );
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label ?? t('equipment.addItem')}
                    placeholder={placeholder}
                    size="small"
                    slotProps={{
                        htmlInput: {
                            ...params.inputProps,
                            "data-testid": "equipment-search-input"
                        }
                    }}
                />
            )}
        />
    );
}
