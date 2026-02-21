import {useCharacter} from "@/CharacterContext/CharacterContext.tsx";
import {CustomModifier, ComputedModifier} from "@/hooks/models";
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import CloseIcon from '@mui/icons-material/Close';
import LockIcon from '@mui/icons-material/Lock';
import SettingsIcon from '@mui/icons-material/Settings';
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
    MenuItem,
    Paper,
    Select,
    TextField,
    Tooltip,
    Typography,
    Checkbox,
} from '@mui/material';
import {type ChangeEvent, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {morkBorgColors} from '../theme/morkBorgTheme';

// Local type aliases for cleaner code
type LocalStatistic = 'agility' | 'strength' | 'presence' | 'toughness';

const statOptions: {value: LocalStatistic; label: string}[] = [
    {value: 'agility', label: 'AGI'},
    {value: 'strength', label: 'STR'},
    {value: 'presence', label: 'PRE'},
    {value: 'toughness', label: 'TOU'},
];

// Scope to INCLUDE mapping (positive UX - what does this apply TO?)
type ScopeOption = 'all' | 'combat' | 'defence' | 'melee' | 'ranged' | 'powers';

const scopeIncludeOptions: {value: ScopeOption; labelKey: string; include: string[]}[] = [
    {value: 'all', labelKey: 'modifiers.scopes.all', include: []},
    {value: 'combat', labelKey: 'modifiers.scopes.combat', include: ['melee', 'ranged', 'cast']},
    {value: 'defence', labelKey: 'modifiers.scopes.defence', include: ['defence']},
    {value: 'melee', labelKey: 'modifiers.scopes.melee', include: ['melee']},
    {value: 'ranged', labelKey: 'modifiers.scopes.ranged', include: ['ranged']},
    {value: 'powers', labelKey: 'modifiers.scopes.powers', include: ['cast']},
];

// All possible contexts for checkbox (what it can apply to)
const allIncludeOptions = [
    {value: 'melee', labelKey: 'modifiers.exclude.melee'},
    {value: 'ranged', labelKey: 'modifiers.exclude.ranged'},
    {value: 'defence', labelKey: 'modifiers.exclude.defence'},
    {value: 'cast', labelKey: 'modifiers.exclude.cast'},
    {value: 'ability', labelKey: 'modifiers.exclude.ability'},
    {value: 'test', labelKey: 'modifiers.exclude.test'},
    {value: 'heal', labelKey: 'modifiers.exclude.heal'},
    {value: 'buff', labelKey: 'modifiers.exclude.buff'},
    {value: 'item', labelKey: 'modifiers.exclude.item'},
];

function CustomModifierTag({modifier, onRemove}: {modifier: CustomModifier; onRemove: () => void}) {
    const isNegative = (modifier.value ?? 0) < 0;

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
                label={(modifier.statistic ?? 'agility').toUpperCase()}
                size="small"
                sx={{
                    bgcolor: morkBorgColors.pink,
                    color: morkBorgColors.black,
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
                {(modifier.value ?? 0) > 0 ? '+' : ''}{modifier.value ?? 0}
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

function ComputedModifierTag({modifier}: {modifier: ComputedModifier}) {
    const isNegative = (modifier.value ?? 0) < 0;

    return (
        <Tooltip title={`From ${modifier.origin_name ?? 'unknown'}`} placement="top">
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    bgcolor: morkBorgColors.darkGrey,
                    border: `1px solid ${morkBorgColors.darkGrey}`,
                    p: 1,
                    opacity: 0.8,
                }}
            >
                <LockIcon sx={{fontSize: 14, color: '#666'}}/>
                <Typography variant="body2" sx={{color: '#999'}}>
                    {modifier.origin_name}
                </Typography>
                <Chip
                    label={(modifier.statistic ?? 'agility').toUpperCase()}
                    size="small"
                    sx={{
                        bgcolor: morkBorgColors.pink,
                        color: morkBorgColors.black,
                        height: 20,
                        fontSize: '0.55rem',
                    }}
                />
                <Typography
                    sx={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: '0.9rem',
                        color: isNegative ? morkBorgColors.pink : morkBorgColors.yellow,
                    }}
                >
                    {(modifier.value ?? 0) > 0 ? '+' : ''}{modifier.value ?? 0}
                </Typography>
            </Box>
        </Tooltip>
    );
}

export default function ModifiersPanel() {
    const {character, addModifier, removeModifier} = useCharacter();
    const {t} = useTranslation();

    // Quick form state
    const [name, setName] = useState('');
    const [stat, setStat] = useState<LocalStatistic>('agility');
    const [valueStr, setValueStr] = useState<string>('');
    const [scope, setScope] = useState<ScopeOption>('all');

    // Advanced modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalName, setModalName] = useState('');
    const [modalStat, setModalStat] = useState<LocalStatistic>('agility');
    const [modalValueStr, setModalValueStr] = useState<string>('');
    const [modalComment, setModalComment] = useState('');
    const [modalScope, setModalScope] = useState<ScopeOption>('all');
    const [modalIncludes, setModalIncludes] = useState<string[]>([]);

    // Derived values
    const value = valueStr === '' ? 0 : Number(valueStr);
    const modalValue = modalValueStr === '' ? 0 : Number(modalValueStr);

    const customModifiers = character?.modifiers ?? [];
    const computedModifiers = character?.computed_modifiers ?? [];

    // Transform include array to exclude array (inverse logic)
    const includesToExclude = (includes: string[]): string[] => {
        const allContexts = ['melee', 'ranged', 'defence', 'cast', 'ability', 'test', 'heal', 'buff', 'item'];
        return allContexts.filter(c => !includes.includes(c));
    };

    const handleQuickAdd = () => {
        if (!name.trim()) return;

        const scopeConfig = scopeIncludeOptions.find(s => s.value === scope);
        const exclude = includesToExclude(scopeConfig?.include ?? []);
        const newModifier = {
            id: crypto.randomUUID(),
            name: name.trim(),
            value,
            source: 'Player',
            statistic: stat as CustomModifier["statistic"],
            exclude,
        } as CustomModifier;

        addModifier(newModifier);

        // Reset form
        setName('');
        setValueStr('');
        setStat('agility');
        setScope('all');
    };

    const handleQuickKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter') handleQuickAdd();
    };

    const handleOpenModal = () => {
        // Pre-fill from quick form if there's data
        setModalName(name.trim() || '');
        setModalStat(stat);
        setModalValueStr(valueStr);
        setModalComment('');
        const scopeConfig = scopeIncludeOptions.find(s => s.value === scope);
        setModalScope(scope);
        setModalIncludes(scopeConfig?.include ?? []);
        setModalOpen(true);
    };

    const handleModalScopeChange = (newScope: ScopeOption) => {
        setModalScope(newScope);
        const scopeConfig = scopeIncludeOptions.find(s => s.value === newScope);
        setModalIncludes(scopeConfig?.include ?? []);
    };

    const handleAdvancedAdd = () => {
        if (!modalName.trim()) return;

        const exclude = includesToExclude(modalIncludes);
        const newModifier = {
            id: crypto.randomUUID(),
            name: modalName.trim(),
            value: modalValue,
            source: 'Player',
            statistic: modalStat as CustomModifier["statistic"],
            exclude,
            comment: modalComment.trim() || undefined,
        } as CustomModifier;

        addModifier(newModifier);
        setModalOpen(false);
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
                    content: '"⚡ ' + t('modifiers.title').toUpperCase() + '"',
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
            {/* Computed Modifiers (Auto - from equipment) */}
            {computedModifiers.length > 0 && (
                <Box sx={{mb: 2}}>
                    <Typography sx={{color: '#666', fontSize: '0.7rem', mb: 1, textTransform: 'uppercase', letterSpacing: '0.1em'}}>
                        {t('modifiers.fromEquipment')}
                    </Typography>
                    <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1}}>
                        {computedModifiers.map((mod, idx) => (
                            <ComputedModifierTag key={`${mod.origin_key ?? idx}-${idx}`} modifier={mod}/>
                        ))}
                    </Box>
                </Box>
            )}

            {/* Custom Modifiers */}
            <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, minHeight: 40}}>
                {customModifiers.length === 0 ? (
                    <Typography sx={{color: '#666', fontStyle: 'italic', fontSize: '0.85rem'}}>
                        {t('modifiers.noModifiers')}
                    </Typography>
                ) : (
                    customModifiers.map((mod) => (
                        <CustomModifierTag
                            key={mod.id}
                            modifier={mod}
                            onRemove={() => removeModifier(mod.id ?? '')}
                        />
                    ))
                )}
            </Box>

            {/* Quick Form */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {xs: '1fr', sm: '1fr auto auto auto'},
                    gap: 1,
                    alignItems: 'center',
                }}
            >
                <TextField
                    placeholder={t('modifiers.namePlaceholder')}
                    value={name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                    onKeyPress={handleQuickKeyPress}
                    size="small"
                    sx={{gridColumn: {xs: '1 / -1', sm: 'auto'}}}
                />

                <Select
                    value={stat}
                    onChange={(e) => setStat(e.target.value as LocalStatistic)}
                    size="small"
                    sx={{
                        bgcolor: morkBorgColors.grey,
                        color: morkBorgColors.yellow,
                        minWidth: 90,
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
                    type="number"
                    placeholder="+1"
                    value={valueStr}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setValueStr(e.target.value)}
                    onKeyPress={handleQuickKeyPress}
                    size="small"
                    sx={{width: {xs: '100%', sm: 70}}}
                />

                <Select
                    value={scope}
                    onChange={(e) => setScope(e.target.value as ScopeOption)}
                    size="small"
                    sx={{
                        bgcolor: morkBorgColors.grey,
                        color: morkBorgColors.yellow,
                        minWidth: 100,
                        '& .MuiSelect-select': {
                            fontFamily: "'Antonio', sans-serif",
                            fontSize: '0.65rem',
                            textTransform: 'uppercase',
                        },
                    }}
                >
                    {scopeIncludeOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                            {t(opt.labelKey)}
                        </MenuItem>
                    ))}
                </Select>

                <Button
                    variant="contained"
                    onClick={handleQuickAdd}
                    sx={{gridColumn: {xs: '1 / -1', sm: 'auto'}}}
                >
                    {t('modifiers.addModifier')}
                </Button>

                <Tooltip title={t('modifiers.advancedTooltip')} placement="top">
                    <IconButton
                        onClick={handleOpenModal}
                        size="small"
                        sx={{
                            color: morkBorgColors.yellow,
                            '&:hover': {
                                color: morkBorgColors.pink,
                            },
                        }}
                    >
                        <SettingsIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Advanced Modal */}
            <Dialog
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: morkBorgColors.grey,
                        border: `2px solid ${morkBorgColors.yellow}`,
                    }
                }}
            >
                <DialogTitle sx={{
                    fontFamily: "'Antonio', sans-serif",
                    color: morkBorgColors.pink,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    borderBottom: `1px solid ${morkBorgColors.darkGrey}`,
                }}>
                    {t('modifiers.modal.title')}
                </DialogTitle>
                <DialogContent sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Name */}
                    <TextField
                        label={t('modifiers.name')}
                        value={modalName}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setModalName(e.target.value)}
                        fullWidth
                        autoFocus
                        InputLabelProps={{ sx: { color: morkBorgColors.pink } }}
                        InputProps={{ sx: { color: morkBorgColors.white } }}
                    />

                    {/* Statistic */}
                    <Select
                        value={modalStat}
                        onChange={(e) => setModalStat(e.target.value as LocalStatistic)}
                        fullWidth
                        displayEmpty
                        sx={{
                            bgcolor: morkBorgColors.darkGrey,
                            color: morkBorgColors.yellow,
                            '& .MuiSelect-select': {
                                fontFamily: "'Antonio', sans-serif",
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

                    {/* Value */}
                    <TextField
                        label={t('modifiers.value')}
                        type="number"
                        value={modalValueStr}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setModalValueStr(e.target.value)}
                        fullWidth
                        placeholder="+1"
                        InputLabelProps={{ sx: { color: morkBorgColors.pink } }}
                        InputProps={{ sx: { color: morkBorgColors.white } }}
                    />

                    {/* Scope (what it applies TO) */}
                    <Select
                        value={modalScope}
                        onChange={(e) => handleModalScopeChange(e.target.value as ScopeOption)}
                        fullWidth
                        displayEmpty
                        sx={{
                            bgcolor: morkBorgColors.darkGrey,
                            color: morkBorgColors.yellow,
                            '& .MuiSelect-select': {
                                fontFamily: "'Antonio', sans-serif",
                                textTransform: 'uppercase',
                            },
                        }}
                    >
                        {scopeIncludeOptions.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                                {t(opt.labelKey)}
                            </MenuItem>
                        ))}
                    </Select>

                    {/* Include Checkboxes */}
                    <Box>
                        <Typography sx={{color: morkBorgColors.pink, fontSize: '0.75rem', mb: 1}}>
                            {t('modifiers.exclude.title')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#999', mb: 1.5, fontSize: '0.7rem' }}>
                            {t('modifiers.exclude.description')}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {allIncludeOptions.map((opt) => (
                                <FormControlLabel
                                    key={opt.value}
                                    control={
                                        <Checkbox
                                            checked={modalIncludes.includes(opt.value)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setModalIncludes([...modalIncludes, opt.value]);
                                                } else {
                                                    setModalIncludes(modalIncludes.filter(x => x !== opt.value));
                                                }
                                            }}
                                            sx={{
                                                color: morkBorgColors.yellow,
                                                '&.Mui-checked': {
                                                    color: morkBorgColors.yellow,
                                                },
                                            }}
                                        />
                                    }
                                    label={t(opt.labelKey)}
                                    sx={{
                                        color: morkBorgColors.white,
                                        '& .MuiFormControlLabel-label': { fontSize: '0.8rem' },
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>

                    {/* Comment */}
                    <TextField
                        label={t('modifiers.comment')}
                        value={modalComment}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setModalComment(e.target.value)}
                        fullWidth
                        multiline
                        rows={2}
                        InputLabelProps={{ sx: { color: morkBorgColors.pink } }}
                        InputProps={{ sx: { color: morkBorgColors.white } }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 1 }}>
                    <Button
                        onClick={() => setModalOpen(false)}
                        sx={{ color: morkBorgColors.white }}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleAdvancedAdd}
                        disabled={!modalName.trim()}
                    >
                        {t('modifiers.addModifier')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}
