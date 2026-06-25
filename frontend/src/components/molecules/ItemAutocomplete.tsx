import {ItemSearchHit, useItemSearch} from '@/hooks/useEquipmentSearch.ts';
import {customStyles} from '@/theme/morkBorgTheme';
import {
    getTextLimitIssue,
    getTextLimitMessage,
} from '@/validation/characterUpdate';
import { useValidationAlert } from '@/hooks/useValidationAlert';
import {Autocomplete, Box, TextField, Typography} from '@mui/material';
import {type SyntheticEvent, useState} from 'react';
import {useTranslation} from 'react-i18next';

interface ItemAutocompleteProps {
    onSelect: (item: ItemSearchHit) => void | Promise<void>;
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
    const [pendingItem, setPendingItem] = useState<ItemSearchHit | null>(null);
    const {results, isLoading, search, clearResults} = useItemSearch({limit: 15});
    const searchErrorMessage = getTextLimitMessage(
        t,
        'equipmentSearch',
        inputValue
    );
    useValidationAlert(searchErrorMessage);
    const isAdding = pendingItem !== null;
    const statusText = searchErrorMessage
        ?? (pendingItem
            ? t('equipment.addingItem', {
                item: pendingItem.name,
                defaultValue: `Adding ${pendingItem.name}...`,
            })
            : ' ');
    const loadingText = pendingItem
        ? t('equipment.addingItem', {
            item: pendingItem.name,
            defaultValue: `Adding ${pendingItem.name}...`,
        })
        : t('equipment.searching', 'Searching...');

    const resetAutocomplete = () => {
        setSelectedValue(null);
        setInputValue('');
        clearResults();
    };

    const handleInputChange = (_: SyntheticEvent, value: string, reason: string) => {
        if (isAdding) {
            return;
        }

        if (reason === 'reset') {
            return;
        }

        if (reason === 'clear') {
            resetAutocomplete();
            return;
        }

        setInputValue(value);
        if (getTextLimitIssue('equipmentSearch', value)) {
            clearResults();
            return;
        }

        const normalizedValue = value.trim();
        if (normalizedValue.length >= 2) search(normalizedValue);
        else clearResults();
    };

    const handleSelect = async (_: SyntheticEvent, value: ItemSearchHit | null) => {
        if (isAdding) {
            return;
        }

        if (!value) {
            resetAutocomplete();
            return;
        }

        setSelectedValue(value);
        setInputValue(value.name);
        setPendingItem(value);
        clearResults();

        try {
            await onSelect(value);
        } finally {
            setPendingItem(null);
            resetAutocomplete();
        }
    };

    return (
        <Autocomplete
            sx={customStyles.itemAutocomplete.root}
            options={results}
            loading={isLoading || isAdding}
            loadingText={loadingText}
            noOptionsText={
                inputValue.trim().length < 2
                    ? t('equipment.typeToSearch', 'Type 2 characters to search')
                    : t('equipment.noResults')
            }
            value={selectedValue}
            inputValue={inputValue}
            onInputChange={handleInputChange}
            onChange={handleSelect}
            getOptionLabel={(o) => o.name}
            isOptionEqualToValue={(a, b) =>
                !!a && !!b && a.id === b.id && a.itemType === b.itemType
            }
            filterOptions={(x) => x}
            slotProps={{
                paper: {sx: customStyles.itemAutocomplete.paper},
                listbox: {sx: customStyles.itemAutocomplete.listbox},
                popper: {sx: customStyles.itemAutocomplete.popper},
            }}
            renderOption={(props, option) => {
                const { key, ...optionProps } = props as typeof props & {
                    key?: unknown;
                };
                return (
                    <Box
                        component="li"
                        key={`${option.itemType}-${option.id}-${String(key ?? '')}`}
                        sx={customStyles.itemAutocomplete.option}
                        {...optionProps}
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
                    error={Boolean(searchErrorMessage)}
                    helperText={statusText}
                    size="small"
                    slotProps={{
                        inputLabel: {
                            shrink: true,
                        },
                        formHelperText: {
                            sx: customStyles.itemAutocomplete.helperText,
                        },
                        htmlInput: {
                            ...params.inputProps,
                            readOnly: isAdding,
                            "aria-busy": isLoading || isAdding ? "true" : undefined,
                            "data-testid": "equipment-search-input"
                        }
                    }}
                />
            )}
        />
    );
}
