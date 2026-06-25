import { useCharacter } from '@/CharacterContext/CharacterContext';
import { useErrorFeedback } from '@/components/molecules/feedback/ErrorFeedbackProvider';
import {
    CharacterLoadErrorModals,
    type CharacterLoadIssue,
} from '@/components/molecules/character/CharacterLoadErrorModals';
import { DeathStampOverlay } from '@/components/molecules/character/DeathStampOverlay';
import { KillConfirmModal } from '@/components/molecules/character/KillConfirmModal';
import { CharacterSheetSkeleton } from '@/components/molecules/character/CharacterSheetSkeleton';
import { CharacterSheet } from '@/components/organisms/CharacterSheet';
import { PartySheetPill } from '@/components/organisms/party/PartySheetPill';
import { ForgeBanner } from '@/components/molecules/character-create/ForgeBanner';
import { useMinimumVisible } from '@/hooks/useMinimumVisible';
import { useScvmDeathFlow } from '@/hooks/useScvmDeathFlow';
import { appHistory } from '@/router/history';
import { buildPartyCharacterPath } from '@/router/navigation';
import { Seo } from '@/seo/Seo';
import {
    isApiForbidden,
    isApiNotFound,
    isUnexpectedApiError,
} from '@/utils/errorUtils';
import { useMediaQuery } from '@mui/material';
import { useEffect, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';

const homeKeywords = [
    'Mork Borg',
    'Mörk Borg',
    'Mork Borg character sheet',
    'Mörk Borg character sheet',
    'Mork Borg character sheet interactive',
    'Mörk Borg character sheet interactive',
    'Mork Borg character creator',
    'Mork Borg generator',
    'Mork Borg online sheet',
    'MORK BORG',
    'MÖRK BORG',
    'Scvm Rack',
];

const homeStructuredData = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'WebSite',
            name: 'Scvm Rack',
            inLanguage: ['en'],
            description: 'Free interactive Mork Borg character sheet and generator.',
            keywords: homeKeywords.join(', '),
        },
        {
            '@type': 'WebApplication',
            name: 'Scvm Rack',
            applicationCategory: 'GameApplication',
            operatingSystem: 'Any',
            isAccessibleForFree: true,
            genre: 'Tabletop RPG',
            description:
                'Interactive Mork Borg character sheet and random character generator.',
            about: {
                '@type': 'Thing',
                name: 'Mork Borg',
            },
            offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
            },
        },
    ],
};

const subscribeToHistory = (onStoreChange: () => void): (() => void) =>
    appHistory.subscribe(() => onStoreChange());

// Snapshot primitive strings, not the mutable location object: useSyncExternalStore
// needs a stable snapshot, and stable strings keep the effects below reactive.
const getPathnameSnapshot = () => appHistory.location?.pathname ?? '/';

export function CharacterPage() {
    const {
        generateNew,
        killAndReplace,
        isAuthenticated,
        error,
        character,
        characterId,
        isLoading,
        isSessionExpired,
        justCreatedId,
        acknowledgeCreated,
        isReadOnly,
    } = useCharacter();

    const { t } = useTranslation();
    const {
        showUnexpectedError,
        canReportUnexpectedError = true,
    } = useErrorFeedback();
    const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
    const pathname = useSyncExternalStore(
        subscribeToHistory,
        getPathnameSnapshot,
        getPathnameSnapshot
    );

    const {
        killConfirmOpen,
        setKillConfirmOpen,
        killConfirmDontAskAgain,
        setKillConfirmDontAskAgain,
        stampDate,
        handleNew,
        handleKillRequest,
        handleKillConfirm,
        onStampAnimationEnd,
    } = useScvmDeathFlow({
        generateNew,
        killAndReplace,
        isAuthenticated,
        prefersReducedMotion,
    });

    const hasLoadError =
        !isSessionExpired && !!error && !character && !!characterId && !isLoading;
    const isNotFound = hasLoadError && isApiNotFound(error);
    const isAccessDenied = hasLoadError && isApiForbidden(error);
    const isUnexpectedLoadError = hasLoadError && isUnexpectedApiError(error);
    const shouldReportUnexpectedLoadError =
        isUnexpectedLoadError && canReportUnexpectedError;
    const hasKnownLoadIssue =
        hasLoadError &&
        !isNotFound &&
        !isAccessDenied &&
        (!isUnexpectedLoadError || !canReportUnexpectedError);

    const loadIssue: CharacterLoadIssue | null = isNotFound
        ? 'not-found'
        : isAccessDenied
            ? 'access-denied'
            : hasKnownLoadIssue
                ? 'load-error'
                : null;

    // First-run / loading: no character yet and no terminal load error. This is
    // true while the storage notice is still unacknowledged (generation is gated)
    // and while a character is being created or fetched. The timegate keeps the
    // skeleton on screen briefly so a fast/cached load doesn't flash it.
    const isBootstrapping = !character && !loadIssue && !isSessionExpired;
    const showSkeleton = useMinimumVisible(isBootstrapping, 600);

    useEffect(() => {
        if (!shouldReportUnexpectedLoadError) return;

        showUnexpectedError(error, {
            source: 'character_page',
            operation: 'load_character',
            characterId,
        });
    }, [characterId, error, shouldReportUnexpectedLoadError, showUnexpectedError]);

    useEffect(() => {
        if (!character?.id || !character.partyId) {
            return;
        }
        if (!/^\/character\/[^/]+$/.test(pathname)) {
            return;
        }

        void appHistory.replace(buildPartyCharacterPath(character.partyId, character.id));
    }, [character?.id, character?.partyId, pathname]);

    const characterName = character?.name || t('character.unnamedWretch');
    // The create intent lives in CharacterContext, set when the draft confirm is
    // adopted. Acknowledge only the character we actually landed on.
    const showForgeBanner = !!justCreatedId && justCreatedId === characterId && !!character;

    return (
        <>
            <CharacterLoadErrorModals
                issue={loadIssue}
                error={error}
                onGenerateNew={handleNew}
            />

            <Seo
                title="Mork Borg Character Sheet Interactive"
                description="Scvm Rack is a free interactive Mork Borg character sheet and generator. Create, edit, and save your Mörk Borg characters online."
                path="/"
                keywords={homeKeywords}
                jsonLd={homeStructuredData}
            />

            {stampDate && (
                <DeathStampOverlay
                    stampDate={stampDate}
                    prefersReducedMotion={prefersReducedMotion}
                    onAnimationEnd={onStampAnimationEnd}
                />
            )}

            {showSkeleton ? (
                <CharacterSheetSkeleton />
            ) : (
                <>
                    {character?.partyId && character?.id && (
                        <PartySheetPill
                            partyId={character.partyId}
                            characterId={character.id}
                        />
                    )}
                    <CharacterSheet
                        stamping={stampDate !== null}
                        onGenerateNew={handleNew}
                        onKillScvm={handleKillRequest}
                        readOnly={isReadOnly}
                    />
                </>
            )}

            {showForgeBanner && (
                <ForgeBanner name={characterName} onClose={acknowledgeCreated} />
            )}

            <KillConfirmModal
                open={killConfirmOpen}
                characterName={characterName}
                dontAskAgain={killConfirmDontAskAgain}
                onDontAskAgainChange={setKillConfirmDontAskAgain}
                onCancel={() => setKillConfirmOpen(false)}
                onConfirm={handleKillConfirm}
            />
        </>
    );
}
