import { useCharacter } from '@/CharacterContext/CharacterContext';
import { useErrorFeedback } from '@/components/molecules/feedback/ErrorFeedbackProvider';
import {
    CharacterLoadErrorModals,
    type CharacterLoadIssue,
} from '@/components/molecules/character/CharacterLoadErrorModals';
import { DeathStampOverlay } from '@/components/molecules/character/DeathStampOverlay';
import { KillConfirmModal } from '@/components/molecules/character/KillConfirmModal';
import { CharacterSheet } from '@/components/organisms/CharacterSheet';
import { useScvmDeathFlow } from '@/hooks/useScvmDeathFlow';
import { Seo } from '@/seo/Seo';
import {
    isApiForbidden,
    isApiNotFound,
    isUnexpectedApiError,
} from '@/utils/errorUtils';
import { useMediaQuery } from '@mui/material';
import { useEffect } from 'react';
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
            inLanguage: ['en', 'pl'],
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
    } = useCharacter();

    const { t } = useTranslation();
    const {
        showUnexpectedError,
        canReportUnexpectedError = true,
    } = useErrorFeedback();
    const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

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

    useEffect(() => {
        if (!shouldReportUnexpectedLoadError) return;

        showUnexpectedError(error, {
            source: 'character_page',
            operation: 'load_character',
            characterId,
        });
    }, [characterId, error, shouldReportUnexpectedLoadError, showUnexpectedError]);

    const characterName = character?.name || t('character.unnamedWretch');

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

            <CharacterSheet
                stamping={stampDate !== null}
                onGenerateNew={handleNew}
                onKillScvm={handleKillRequest}
            />

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
