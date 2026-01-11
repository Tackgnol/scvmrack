import {useCharacter} from "@/CharacterContext/CharacterContext.tsx";
import {Box, CircularProgress, Collapse, Paper, TextField, Typography} from '@mui/material';
import {useState} from 'react';
import {morkBorgColors} from '../theme/morkBorgTheme';

export const CharacterDescriptors = () => {
    const {character, isLoading, updateField, updateAbilities} = useCharacter();
    const [newAbility, setNewAbility] = useState<{ name: string; description: string } | null>(null);

    if (isLoading) {
        return (
            <Box sx={{display: 'flex', justifyContent: 'center', p: 4}}>
                <CircularProgress sx={{color: morkBorgColors.yellow}}/>
            </Box>
        );
    }

    if (!character) {
        return (
            <Paper sx={{p: 2.5, mb: 2.5, textAlign: 'center'}}>
                <Typography color="secondary">No character loaded</Typography>
            </Paper>
        );
    }

    const handleSaveNewAbility = () => {
        if (newAbility && (newAbility.name || newAbility.description)) {
            const newAbilities = [
                ...(character.abilities || []),
                newAbility
            ];
            updateAbilities(newAbilities);
            setNewAbility(null);
        }
    };

    const handleCancelNewAbility = () => {
        setNewAbility(null);
    };

    return (
        <>
            {/* Class Abilities */}
            <Paper sx={{p: 2.5, mb: 2.5, position: 'relative'}}>
                <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1}}>
                    <Typography variant="subtitle2" color="secondary">
                        Class Abilities
                    </Typography>
                    <Box sx={{display: 'flex', gap: 1}}>
                        <Collapse in={!newAbility} orientation="horizontal">
                            <Box
                                component="button"
                                onClick={() => setNewAbility({name: '', description: ''})}
                                sx={{
                                    bgcolor: morkBorgColors.pink,
                                    color: morkBorgColors.black,
                                    border: `2px solid ${morkBorgColors.black}`,
                                    borderRadius: 1,
                                    width: 32,
                                    height: 32,
                                    cursor: 'pointer',
                                    fontFamily: "'Permanent Marker', cursive",
                                    fontSize: '1.2rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        bgcolor: morkBorgColors.yellow,
                                        transform: 'translate(-2px, -2px)',
                                        boxShadow: `3px 3px 0 ${morkBorgColors.black}`,
                                    },
                                    '&:active': {
                                        transform: 'translate(0, 0)',
                                        boxShadow: 'none',
                                    },
                                }}
                            >
                                +
                            </Box>
                        </Collapse>
                        <Collapse in={!!newAbility} orientation="horizontal">
                            <Box sx={{display: 'flex', gap: 1}}>
                                <Box
                                    component="button"
                                    onClick={handleSaveNewAbility}
                                    sx={{
                                        bgcolor: morkBorgColors.yellow,
                                        color: morkBorgColors.black,
                                        border: `2px solid ${morkBorgColors.black}`,
                                        borderRadius: 1,
                                        width: 32,
                                        height: 32,
                                        cursor: 'pointer',
                                        fontSize: '1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            transform: 'translate(-2px, -2px)',
                                            boxShadow: `3px 3px 0 ${morkBorgColors.black}`,
                                        },
                                        '&:active': {
                                            transform: 'translate(0, 0)',
                                            boxShadow: 'none',
                                        },
                                    }}
                                >
                                    ✓
                                </Box>
                                <Box
                                    component="button"
                                    onClick={handleCancelNewAbility}
                                    sx={{
                                        bgcolor: morkBorgColors.grey,
                                        color: morkBorgColors.white,
                                        border: `2px solid ${morkBorgColors.black}`,
                                        borderRadius: 1,
                                        width: 32,
                                        height: 32,
                                        cursor: 'pointer',
                                        fontSize: '1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            transform: 'translate(-2px, -2px)',
                                            boxShadow: `3px 3px 0 ${morkBorgColors.black}`,
                                        },
                                        '&:active': {
                                            transform: 'translate(0, 0)',
                                            boxShadow: 'none',
                                        },
                                    }}
                                >
                                    ✕
                                </Box>
                            </Box>
                        </Collapse>
                    </Box>
                </Box>
                <Box
                    sx={{
                        p: 1.5,
                        border: `2px solid ${morkBorgColors.pink}`,
                        borderRadius: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                    }}
                >
                    {/* New Ability Form */}
                    <Collapse in={!!newAbility}>
                        <Box sx={{pb: 2, mb: 2, borderBottom: `2px solid ${morkBorgColors.yellow}`}}>
                            <TextField
                                fullWidth
                                label="Ability Name"
                                value={newAbility?.name || ''}
                                onChange={(e) => setNewAbility({...newAbility!, name: e.target.value})}
                                variant="standard"
                                autoFocus
                                sx={{
                                    mb: 1,
                                    '& .MuiInput-root': {
                                        color: morkBorgColors.yellow,
                                        '&:before': {borderBottomColor: '#504c4c'},
                                        '&:hover:not(.Mui-disabled):before': {borderBottomColor: morkBorgColors.yellow},
                                        '&:after': {borderBottomColor: morkBorgColors.yellow},
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: '#f5f5f5',
                                        '&.Mui-focused': {color: morkBorgColors.yellow},
                                    },
                                }}
                            />
                            <TextField
                                fullWidth
                                multiline
                                label="Description"
                                value={newAbility?.description || ''}
                                onChange={(e) => setNewAbility({...newAbility!, description: e.target.value})}
                                variant="standard"
                                sx={{
                                    '& .MuiInput-root': {
                                        color: '#f5f5f5',
                                        '&:before': {borderBottomColor: '#504c4c'},
                                        '&:hover:not(.Mui-disabled):before': {borderBottomColor: morkBorgColors.yellow},
                                        '&:after': {borderBottomColor: morkBorgColors.yellow},
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: '#f5f5f5',
                                        '&.Mui-focused': {color: morkBorgColors.yellow},
                                    },
                                }}
                            />
                        </Box>
                    </Collapse>

                    {/* Existing Abilities */}
                    {character.abilities && character.abilities.length > 0 ? (
                        character.abilities.map((ability, index) => (
                            <Box key={index}>
                                <TextField
                                    fullWidth
                                    label="Ability Name"
                                    value={ability.name}
                                    onChange={(e) => {
                                        const newAbilities = [...character.abilities!];
                                        newAbilities[index] = {...ability, name: e.target.value};
                                        updateAbilities( newAbilities);
                                    }}
                                    variant="standard"
                                    sx={{
                                        mb: 1,
                                        '& .MuiInput-root': {
                                            color: morkBorgColors.yellow,
                                            '&:before': {borderBottomColor: '#504c4c'},
                                            '&:hover:not(.Mui-disabled):before': {borderBottomColor: morkBorgColors.yellow},
                                            '&:after': {borderBottomColor: morkBorgColors.yellow},
                                        },
                                        '& .MuiInputLabel-root': {
                                            color: '#f5f5f5',
                                            '&.Mui-focused': {color: morkBorgColors.yellow},
                                        },
                                    }}
                                />
                                <TextField
                                    fullWidth
                                    multiline
                                    label="Description"
                                    value={ability.description}
                                    onChange={(e) => {
                                        const newAbilities = [...character.abilities!];
                                        newAbilities[index] = {...ability, description: e.target.value};
                                        updateAbilities( newAbilities);
                                    }}
                                    variant="standard"
                                    sx={{
                                        '& .MuiInput-root': {
                                            color: '#f5f5f5',
                                            '&:before': {borderBottomColor: '#504c4c'},
                                            '&:hover:not(.Mui-disabled):before': {borderBottomColor: morkBorgColors.yellow},
                                            '&:after': {borderBottomColor: morkBorgColors.yellow},
                                        },
                                        '& .MuiInputLabel-root': {
                                            color: '#f5f5f5',
                                            '&.Mui-focused': {color: morkBorgColors.yellow},
                                        },
                                    }}
                                />
                                {index < character.abilities!.length - 1 && (
                                    <Box sx={{borderBottom: `1px solid ${morkBorgColors.grey}`, mt: 2}}/>
                                )}
                            </Box>
                        ))
                    ) : !newAbility ? (
                        <Typography variant="body2" sx={{color: morkBorgColors.white, opacity: 0.5}}>
                            No special abilities
                        </Typography>
                    ) : null}
                </Box>
            </Paper>

            {/* Traits & Afflictions */}
            <Paper sx={{p: 2.5, mb: 2.5}}>
                <Typography variant="subtitle2" color="secondary" sx={{mb: 1}}>
                    Traits & Afflictions
                </Typography>
                <Box
                    sx={{
                        p: 1.5,
                        border: `2px solid ${morkBorgColors.grey}`,
                        borderRadius: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                    }}
                >
                    <TextField
                        fullWidth
                        label="Trait 1"
                        value={character.trait1 || ''}
                        onChange={(e) => updateField('trait1', e.target.value)}
                        variant="standard"
                        sx={{
                            '& .MuiInput-root': {
                                color: '#f5f5f5',
                                '&:before': {borderBottomColor: '#504c4c'},
                                '&:hover:not(.Mui-disabled):before': {borderBottomColor: morkBorgColors.yellow},
                                '&:after': {borderBottomColor: morkBorgColors.yellow},
                            },
                            '& .MuiInputLabel-root': {
                                color: '#f5f5f5',
                                '&.Mui-focused': {color: morkBorgColors.yellow},
                            },
                        }}
                    />

                    <TextField
                        fullWidth
                        label="Trait 2"
                        value={character.trait2 || ''}
                        onChange={(e) => updateField('trait2', e.target.value)}
                        variant="standard"
                        sx={{
                            '& .MuiInput-root': {
                                color: '#f5f5f5',
                                '&:before': {borderBottomColor: '#504c4c'},
                                '&:hover:not(.Mui-disabled):before': {borderBottomColor: morkBorgColors.yellow},
                                '&:after': {borderBottomColor: morkBorgColors.yellow},
                            },
                            '& .MuiInputLabel-root': {
                                color: '#f5f5f5',
                                '&.Mui-focused': {color: morkBorgColors.yellow},
                            },
                        }}
                    />

                    <TextField
                        fullWidth
                        label="Habit"
                        value={character.habit || ''}
                        onChange={(e) => updateField('habit', e.target.value)}
                        variant="standard"
                        sx={{
                            '& .MuiInput-root': {
                                color: '#f5f5f5',
                                '&:before': {borderBottomColor: '#504c4c'},
                                '&:hover:not(.Mui-disabled):before': {borderBottomColor: morkBorgColors.yellow},
                                '&:after': {borderBottomColor: morkBorgColors.yellow},
                            },
                            '& .MuiInputLabel-root': {
                                color: '#f5f5f5',
                                '&.Mui-focused': {color: morkBorgColors.yellow},
                            },
                        }}
                    />

                    <TextField
                        fullWidth
                        label="Body Description"
                        value={character.body_description || ''}
                        onChange={(e) => updateField('body_description', e.target.value)}
                        variant="standard"
                        sx={{
                            '& .MuiInput-root': {
                                color: '#f5f5f5',
                                '&:before': {borderBottomColor: '#504c4c'},
                                '&:hover:not(.Mui-disabled):before': {borderBottomColor: morkBorgColors.yellow},
                                '&:after': {borderBottomColor: morkBorgColors.yellow},
                            },
                            '& .MuiInputLabel-root': {
                                color: '#f5f5f5',
                                '&.Mui-focused': {color: morkBorgColors.yellow},
                            },
                        }}
                    />
                </Box>
            </Paper>

            {/* Origin */}
            <Paper sx={{p: 2.5, mb: 2.5}}>
                <Typography variant="subtitle2" color="secondary" sx={{mb: 1}}>
                    Origin
                </Typography>
                <Box
                    sx={{
                        p: 1.5,
                        border: `2px solid ${morkBorgColors.pink}`,
                        borderRadius: 1,
                    }}
                >
                    <TextField
                        fullWidth
                        multiline
                        value={character.origin || ''}
                        onChange={(e) => updateField('origin', e.target.value)}
                        placeholder="Where did this wretch come from?"
                        variant="standard"
                        sx={{
                            '& .MuiInput-root': {
                                color: morkBorgColors.yellow,
                                '&:before': {borderBottomColor: '#504c4c'},
                                '&:hover:not(.Mui-disabled):before': {borderBottomColor: morkBorgColors.yellow},
                                '&:after': {borderBottomColor: morkBorgColors.yellow},
                            },
                            '& .MuiInputLabel-root': {
                                color: '#f5f5f5',
                                '&.Mui-focused': {color: morkBorgColors.yellow},
                            },
                        }}
                    />
                </Box>
            </Paper>
        </>
    );
}
