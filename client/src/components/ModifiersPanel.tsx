import {Modifier, StatType} from "@/types";
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import CloseIcon from '@mui/icons-material/Close';
import {
    Box,
    Button,
    Chip,
    IconButton,
    MenuItem,
    Paper,
    Select,
    type SelectChangeEvent,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import {type ChangeEvent, type KeyboardEvent, useState} from 'react';
import {morkBorgColors, statColors} from '../theme/morkBorgTheme';

interface StatOption {
    value: StatType;
    label: string;
}

const statOptions: StatOption[] = [
    {value: 'all', label: 'All'},
    {value: 'agi', label: 'Agility'},
    {value: 'pre', label: 'Presence'},
    {value: 'str', label: 'Strength'},
    {value: 'tou', label: 'Toughness'},
    {value: 'def', label: 'Defense'},
    {value: 'hp', label: 'HP'},
    {value: 'atk', label: 'Attack'},
    {value: 'dmg', label: 'Damage'},
];

const statLabels: Record<StatType, string> = {
    all: 'ALL',
    agi: 'AGI',
    pre: 'PRE',
    str: 'STR',
    tou: 'TOU',
    def: 'DEF',
    hp: 'HP',
    atk: 'ATK',
    dmg: 'DMG',
};

interface ModifierTagProps {
    modifier: Modifier;
    onRemove: () => void;
}

function ModifierTag({modifier, onRemove}: ModifierTagProps) {
    const isNegative = modifier.value.startsWith('-');

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: morkBorgColors.grey,
                border: `2px solid ${morkBorgColors.yellow}`,
                p: 1,
            }}
        >
            <Typography variant="body2" sx={{color: morkBorgColors.white}}>
                {modifier.name}
            </Typography>

            {modifier.comment && (
                <Tooltip title={modifier.comment} placement="top">
                    <ChatBubbleIcon
                        sx={{fontSize: 14, color: morkBorgColors.yellow, cursor: 'help'}}
                    />
                </Tooltip>
            )}

            <Chip
                label={statLabels[modifier.stat]}
                size="small"
                sx={{
                    bgcolor: statColors[modifier.stat],
                    color:
                        modifier.stat === 'all' || modifier.stat === 'def'
                            ? morkBorgColors.black
                            : morkBorgColors.white,
                    height: 22,
                    fontSize: '0.6rem',
                }}
            />

            <Typography
                sx={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: '1rem',
                    color: isNegative ? morkBorgColors.pink : morkBorgColors.yellow,
                }}
            >
                {modifier.value}
            </Typography>

            <IconButton
                onClick={onRemove}
                size="small"
                sx={{
                    width: 22,
                    height: 22,
                    bgcolor: morkBorgColors.pink,
                    color: morkBorgColors.black,
                    ml: 0.5,
                    '&:hover': {
                        bgcolor: morkBorgColors.yellow,
                    },
                }}
            >
                <CloseIcon sx={{fontSize: 14}}/>
            </IconButton>
        </Box>
    );
}

export default function ModifiersPanel() {

    const [name, setName] = useState('');
    const [stat, setStat] = useState<StatType>('all');
    const [value, setValue] = useState('');
    const [comment, setComment] = useState('');

    const modifiers = []
    const addModifier = () => {}
    const removeModifier = () => {};

    const handleAdd = () => {
        if (name && value) {
            addModifier({name, stat, value, comment: comment || undefined});
            setName('');
            setValue('');
            setComment('');
            setStat('all');
        }
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter') handleAdd();
    };

    const handleStatChange = (e: SelectChangeEvent) => {
        setStat(e.target.value as StatType);
    };

    return (
        <Paper
            sx={{
                p: 2.5,
                pt: 3,
                mb: 2.5,
                position: 'relative',
                border: `3px solid ${morkBorgColors.pink}`,
                boxShadow: `6px 6px 0 ${morkBorgColors.yellow}`,
                '&::before': {
                    content: '"⚡ ACTIVE EFFECTS"',
                    position: 'absolute',
                    top: -12,
                    left: 15,
                    bgcolor: morkBorgColors.pink,
                    color: morkBorgColors.black,
                    fontFamily: "'Antonio', sans-serif",
                    fontSize: '0.6rem',
                    letterSpacing: '0.3em',
                    px: 1.25,
                    py: 0.4,
                },
            }}
        >
            {/* Modifier Tags */}
            <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, minHeight: 40}}>
                {modifiers.length === 0 ? (
                    <Typography sx={{color: '#666', fontStyle: 'italic', fontSize: '0.85rem'}}>
                        No active modifiers
                    </Typography>
                ) : (
                    modifiers.map((mod) => (
                        <ModifierTag
                            key={mod.id}
                            modifier={mod}
                            onRemove={() => removeModifier(mod.id)}
                        />
                    ))
                )}
            </Box>

            {/* Add Form */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {xs: '1fr 1fr', sm: '1fr auto auto auto'},
                    gap: 1,
                }}
            >
                <TextField
                    placeholder="Modifier name..."
                    value={name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    size="small"
                    sx={{gridColumn: {xs: '1 / -1', sm: 'auto'}}}
                />

                <Select
                    value={stat}
                    onChange={handleStatChange}
                    size="small"
                    sx={{
                        bgcolor: morkBorgColors.grey,
                        color: morkBorgColors.yellow,
                        minWidth: 100,
                        '& .MuiSelect-select': {
                            fontFamily: "'Antonio', sans-serif",
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                        },
                    }}
                >
                    {statOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                        </MenuItem>
                    ))}
                </Select>

                <TextField
                    placeholder="+1"
                    value={value}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    size="small"
                    sx={{width: {xs: '100%', sm: 60}}}
                />

                <Button
                    variant="contained"
                    onClick={handleAdd}
                    sx={{gridColumn: {xs: '1 / -1', sm: 'auto'}}}
                >
                    Add
                </Button>
            </Box>

            {/* Comment field */}
            <TextField
                placeholder="Comment (optional) — hover modifier to see"
                value={comment}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setComment(e.target.value)}
                onKeyPress={handleKeyPress}
                size="small"
                fullWidth
                sx={{mt: 1}}
                InputProps={{
                    sx: {fontStyle: 'italic'},
                }}
            />
        </Paper>
    );
}
