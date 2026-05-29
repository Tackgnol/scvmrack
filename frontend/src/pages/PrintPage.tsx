import { useCharacter } from '@/CharacterContext/CharacterContext';
import { type Character, type ComputedModifier, type CustomModifier, type EquipmentItem, type Statistic } from '@/hooks/models';
import {
    isConsumableUseItem,
    isPetItem,
    isScrollItem,
} from '@/hooks/useEquipmentSections';
import { aggregateItems } from '@/utils/aggregateItems';
import { useErrorFeedback } from '@/components/molecules/feedback/ErrorFeedbackProvider';
import { appHistory } from '@/router/history';
import { buildHomeCallbackUrl, buildPrintCallbackUrl } from '@/router/navigation';
import { Seo } from '@/seo/Seo';
import { statToModifier } from '@/utils/stats';
import {
    getUserFacingApiErrorMessage,
    isApiForbidden,
    isApiNotFound,
    isUnexpectedApiError,
} from '@/utils/errorUtils';
import { Box, Button, Stack } from '@mui/material';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const STAT_KEYS: Statistic[] = ['strength', 'agility', 'presence', 'toughness'];

function valueOrDash(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') {
        return '-';
    }
    return String(value);
}

function modifier(value: number | null | undefined): string {
    if (value === null || value === undefined) {
        return '-';
    }
    return value > 0 ? `+${value}` : String(value);
}

function itemName(item: EquipmentItem): string {
    const amount = item.amount && item.amount > 1 ? `${item.amount}x ` : '';
    return `${amount}${item.name ?? item.key ?? '-'}`;
}

function PrintSection({
    title,
    children,
    className = '',
}: {
    title: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section className={`print-native-section ${className}`.trim()}>
            <h2>{title}</h2>
            {children}
        </section>
    );
}

function LabelValue({
    label,
    value,
}: {
    label: string;
    value: string | number | null | undefined;
}) {
    return (
        <div className="print-native-label-value">
            <dt>{label}</dt>
            <dd>{valueOrDash(value)}</dd>
        </div>
    );
}

function DotTrack({
    label,
    current,
    max,
}: {
    label: string;
    current: number | null | undefined;
    max: number | null | undefined;
}) {
    const total = Math.max(0, max ?? current ?? 0);
    const count = Math.min(total, 24);
    const filledCount = Math.max(0, Math.min(current ?? 0, count));
    const hasOverflow = total > count;

    return (
        <div className="print-native-label-value print-native-dot-track">
            <dt>{label}</dt>
            <dd>
                <span
                    className="print-native-dots"
                    aria-label={`${label} tracker: ${filledCount}/${total}`}
                >
                    {Array.from({ length: count }, (_, index) => (
                        <span key={index} aria-hidden="true" />
                    ))}
                    {hasOverflow && <em>+{total - count}</em>}
                </span>
            </dd>
        </div>
    );
}

function TextField({
    label,
    value,
}: {
    label: string;
    value: string | null | undefined;
}) {
    if (!value) {
        return null;
    }

    return (
        <div className="print-native-text-field">
            <dt>{label}</dt>
            <dd>{value}</dd>
        </div>
    );
}

function EquipmentList({ items }: { items: EquipmentItem[] }) {
    if (items.length === 0) {
        return <p className="print-native-empty">-</p>;
    }

    const aggregated = aggregateItems(items);

    return (
        <ul className="print-native-list">
            {aggregated.map(({ item, quantity }, index) => {
                const displayName =
                    quantity > 1
                        ? `${quantity}x ${item.name ?? item.key ?? '-'}`
                        : itemName(item);
                return (
                    <li key={`${item.key ?? item.name ?? 'item'}-${index}`}>
                        <strong>{displayName}</strong>
                        {item.description && <span>{item.description}</span>}
                        {item.comments && <span>{item.comments}</span>}
                    </li>
                );
            })}
        </ul>
    );
}

function UsesList({ items }: { items: EquipmentItem[] }) {
    if (items.length === 0) {
        return <p className="print-native-empty">-</p>;
    }

    return (
        <ul className="print-native-list print-native-uses">
            {items.map((item, index) => (
                <li key={`${item.key ?? item.name ?? 'use'}-${index}`}>
                    <div>
                        <strong>{itemName(item)}</strong>
                        {item.description && <span>{item.description}</span>}
                    </div>
                    {(item.uses ?? []).length > 0 && (
                        <div className="print-native-pips" aria-label="uses">
                            {(item.uses ?? []).map((used, useIndex) => (
                                <span
                                    key={useIndex}
                                    className={used ? 'is-used' : undefined}
                                />
                            ))}
                        </div>
                    )}
                </li>
            ))}
        </ul>
    );
}

function ModifierList({
    computed,
    custom,
}: {
    computed: ComputedModifier[];
    custom: CustomModifier[];
}) {
    const rows = [
        ...computed.map((item) => ({
            name: item.originName ?? item.source ?? item.originKey ?? 'Modifier',
            value: item.value,
            statistic: item.statistic,
            note: item.exclude?.length ? `Excludes: ${item.exclude.join(', ')}` : undefined,
        })),
        ...custom.map((item) => ({
            name: item.name ?? item.source ?? 'Modifier',
            value: item.value,
            statistic: item.statistic,
            note: item.comment,
        })),
    ];

    if (rows.length === 0) {
        return null;
    }

    return (
        <PrintSection title="Modifiers">
            <table className="print-native-table">
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Stat</th>
                    <th>Value</th>
                    <th>Note</th>
                </tr>
                </thead>
                <tbody>
                {rows.map((row, index) => (
                    <tr key={`${row.name}-${index}`}>
                        <td>{row.name}</td>
                        <td>{row.statistic ?? '-'}</td>
                        <td>{modifier(row.value)}</td>
                        <td>{row.note ?? '-'}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </PrintSection>
    );
}

function AbilityScore({
    label,
    value,
}: {
    label: string;
    value: number | null | undefined;
}) {
    const score = value ?? 10;
    return (
        <div className="print-native-ability-score">
            <dt>{label}</dt>
            <dd>
                <strong>{score}</strong>
                <span>MOD {modifier(statToModifier(score))}</span>
            </dd>
        </div>
    );
}

function PrintSheet({ character }: { character: Character }) {
    const { t } = useTranslation();
    const equipment = character.equipment ?? [];
    const storage = character.storage ?? [];
    const scrolls = equipment.filter(isScrollItem);
    const pets = equipment.filter(isPetItem);
    const consumables = equipment.filter(isConsumableUseItem);
    const onHand = equipment.filter(
        (item) =>
            !isScrollItem(item) &&
            !isPetItem(item) &&
            !isConsumableUseItem(item),
    );
    const hasModifiers =
        (character.computedModifiers ?? []).length > 0 ||
        (character.modifiers ?? []).length > 0;

    return (
        <article className="print-native-sheet">
            <header className="print-native-header">
                <div>
                    <p className="print-native-brand-line">
                        <span>SCVMRACK</span>
                        <span>visit us at scvmrack.rpgtools.co</span>
                    </p>
                    <h1>{valueOrDash(character.name)}</h1>
                </div>
                <div>
                    <p>{t('app.subtitle')}</p>
                    <strong>{valueOrDash(character.className)}</strong>
                </div>
            </header>

            <dl className="print-native-summary">
                <DotTrack label={t('stats.hitPoints')} current={character.currentHp} max={character.maxHp} />
                <DotTrack label={t('stats.omens')} current={character.omens} max={character.maxOmens} />
                <LabelValue label={t('stats.silver')} value={character.silver} />
                <DotTrack label={t('stats.encumbrance')} current={character.encumbrance} max={character.maxEncumbrance} />
                <LabelValue label={t('stats.toDodge')} value={character.drToDodge} />
                <LabelValue label={t('stats.toHitMelee')} value={character.drToMelee} />
                <LabelValue label={t('stats.toHitRanged')} value={character.drToRanged} />
                <LabelValue label={t('equipment.armorLabel')} value={character.equippedArmor?.name ?? t('equipment.unarmored')} />
            </dl>

            <main className="print-native-grid">
                <div>
                    <PrintSection title={t('character.abilities', 'Abilities')}>
                        <dl className="print-native-stats">
                            {STAT_KEYS.map((stat) => (
                                <AbilityScore
                                    key={stat}
                                    label={t(`attributes.${stat}`)}
                                    value={character[stat]}
                                />
                            ))}
                        </dl>
                    </PrintSection>

                    <PrintSection title={t('character.classAbilities', 'Class Abilities')}>
                        <ol className="print-native-list print-native-numbered">
                            {(character.abilities ?? []).map((ability, index) => (
                                <li key={`${ability.key ?? ability.name ?? 'ability'}-${index}`}>
                                    <strong>{ability.name ?? '-'}</strong>
                                    {ability.description && <span>{ability.description}</span>}
                                    {ability.comment && <span>{ability.comment}</span>}
                                </li>
                            ))}
                        </ol>
                    </PrintSection>

                    <PrintSection title={t('traits.title')}>
                        <dl className="print-native-fields">
                            <TextField label={t('traits.trait1')} value={character.trait1} />
                            <TextField label={t('traits.trait2')} value={character.trait2} />
                            <TextField label={t('traits.habit')} value={character.habit} />
                            <TextField label={t('traits.bodyDescription')} value={character.bodyDescription} />
                            <TextField label={t('character.origin')} value={character.origin} />
                        </dl>
                    </PrintSection>

                    {hasModifiers && (
                        <ModifierList
                            computed={character.computedModifiers ?? []}
                            custom={character.modifiers ?? []}
                        />
                    )}
                </div>

                <div>
                    <PrintSection title={t('equipment.onHand')}>
                        <EquipmentList items={onHand} />
                    </PrintSection>

                    {storage.length > 0 && (
                        <PrintSection title={t('equipment.storedItems')}>
                            <EquipmentList items={storage} />
                        </PrintSection>
                    )}

                    {scrolls.length > 0 && (
                        <PrintSection title={t('powers.title')}>
                            <UsesList items={scrolls} />
                        </PrintSection>
                    )}

                    {pets.length > 0 && (
                        <PrintSection title={t('pets.title')}>
                            <EquipmentList items={pets} />
                        </PrintSection>
                    )}

                    {consumables.length > 0 && (
                        <PrintSection title={t('consumables.title')}>
                            <UsesList items={consumables} />
                        </PrintSection>
                    )}
                </div>
            </main>

            <PrintSection title={t('notes.title')} className="print-native-notes">
                <p>{character.notes || ''}</p>
            </PrintSection>
        </article>
    );
}

export function PrintPage() {
    const { character, characterId, lastCharacterId, isLoading, error } = useCharacter();
    const { t } = useTranslation();
    const { showUnexpectedError } = useErrorFeedback();

    const effectiveId = characterId || lastCharacterId;

    useEffect(() => {
        if (!characterId && lastCharacterId) {
            void appHistory.replace(buildPrintCallbackUrl(lastCharacterId));
        }
    }, [characterId, lastCharacterId]);

    useEffect(() => {
        document.body.classList.add('print-route-active');
        return () => {
            document.body.classList.remove('print-route-active');
        };
    }, []);

    useEffect(() => {
        if (character || isLoading || !error || !isUnexpectedApiError(error)) {
            return;
        }

        showUnexpectedError(error, {
            source: 'print_page',
            operation: 'load_character_for_print',
            characterId: effectiveId,
        });
    }, [character, effectiveId, error, isLoading, showUnexpectedError]);

    const handleBack = () => {
        void appHistory.push(buildHomeCallbackUrl(effectiveId));
    };

    const handlePrint = () => {
        window.print();
    };

    const emptyMessage = (() => {
        if (isLoading) {
            return t('common.loading', 'Loading...');
        }

        if (error && isApiForbidden(error)) {
            return t(
                'characters.accessDeniedDescription',
                'This scvm belongs to another session or account. Generate a new one or open one of yours.'
            );
        }

        if (error && !isApiNotFound(error)) {
            return getUserFacingApiErrorMessage(error, t, 'Failed to load character');
        }

        return t('characters.notFound', 'Scvm not found');
    })();

    return (
        <>
            <Seo
                title="Printable Character Sheet"
                description="Printer friendly Mork Borg character sheet."
                path="/print"
                noIndex
            />
            <Box className="print-route-page">
                <Stack
                    className="print-toolbar print-hidden"
                    direction="row"
                    spacing={1}
                    justifyContent="center"
                    sx={{ mb: 2 }}
                >
                    <Button variant="outlined" onClick={handleBack}>
                        {t('nav.home')}
                    </Button>
                    <Button variant="contained" onClick={handlePrint}>
                        {t('actions.print')}
                    </Button>
                </Stack>

                <Box className="print-sheet print-a4-sheet">
                    {character ? (
                        <PrintSheet character={character} />
                    ) : (
                        <div className="print-native-empty-page">
                            {emptyMessage}
                        </div>
                    )}
                </Box>
            </Box>
        </>
    );
}
