import { appHistory } from '@/router/history';

export const LOGGED_OUT_QUERY_PARAM = 'logged-out';
export const SESSION_EXPIRED_QUERY_PARAM = 'expired';
export const CHARACTER_ID_QUERY_PARAM = 'character';
export const CLAIM_CHARACTER_QUERY_PARAM = 'claim-character';

const HOME_PATH = '/';
const PRINT_PATH = '/print';

const normalizeHash = (hash: string): string => {
    if (!hash) {
        return '';
    }

    return hash.startsWith('#') ? hash : `#${hash}`;
};

const buildPath = (pathname: string, searchParams: URLSearchParams, hash: string): string => {
    const search = searchParams.toString();
    const searchSegment = search ? `?${search}` : '';
    return `${pathname}${searchSegment}${normalizeHash(hash)}`;
};

const getCurrentSearchParams = (): URLSearchParams => {
    return new URLSearchParams(appHistory.location.search);
};

const replaceCurrentWithSearchParams = async (
    update: (searchParams: URLSearchParams) => void
): Promise<void> => {
    const searchParams = getCurrentSearchParams();
    update(searchParams);

    const nextPath = buildPath(
        appHistory.location.pathname,
        searchParams,
        appHistory.location.hash
    );

    await appHistory.replace(nextPath);
};

const navigateToHomeWithFlag = async (queryParam: string): Promise<void> => {
    const searchParams = new URLSearchParams();
    searchParams.set(queryParam, 'true');
    await appHistory.replace(buildPath(HOME_PATH, searchParams, ''));
};

export const hasCurrentSearchParam = (queryParam: string): boolean => {
    return getCurrentSearchParams().has(queryParam);
};

export const getCurrentSearchParamValue = (queryParam: string): string | null => {
    const value = getCurrentSearchParams().get(queryParam);
    if (!value) {
        return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
};

export const getCurrentCharacterIdParam = (): string | null => {
    return getCurrentSearchParamValue(CHARACTER_ID_QUERY_PARAM);
};

export const getCurrentPendingClaimCharacterId = (): string | null => {
    return getCurrentSearchParamValue(CLAIM_CHARACTER_QUERY_PARAM);
};

export const setCurrentCharacterIdParam = async (characterId: string | null): Promise<void> => {
    await replaceCurrentWithSearchParams((searchParams) => {
        if (characterId) {
            searchParams.set(CHARACTER_ID_QUERY_PARAM, characterId);
        } else {
            searchParams.delete(CHARACTER_ID_QUERY_PARAM);
        }
    });
};

export const setCurrentPendingClaimCharacterId = async (characterId: string | null): Promise<void> => {
    await replaceCurrentWithSearchParams((searchParams) => {
        if (characterId) {
            searchParams.set(CLAIM_CHARACTER_QUERY_PARAM, characterId);
        } else {
            searchParams.delete(CLAIM_CHARACTER_QUERY_PARAM);
        }
    });
};

export const buildHomeCallbackUrl = (
    characterId: string | null,
    claimCharacterId: string | null = null
): string => {
    const searchParams = new URLSearchParams();
    if (characterId) {
        searchParams.set(CHARACTER_ID_QUERY_PARAM, characterId);
    }
    if (claimCharacterId) {
        searchParams.set(CLAIM_CHARACTER_QUERY_PARAM, claimCharacterId);
    }

    return buildPath(HOME_PATH, searchParams, '');
};

export const buildPrintCallbackUrl = (characterId: string | null): string => {
    const searchParams = new URLSearchParams();
    if (characterId) {
        searchParams.set(CHARACTER_ID_QUERY_PARAM, characterId);
    }

    return buildPath(PRINT_PATH, searchParams, '');
};

export const clearCurrentSearchParam = async (queryParam: string): Promise<void> => {
    await replaceCurrentWithSearchParams((searchParams) => {
        searchParams.delete(queryParam);
    });
};

export const navigateToLoggedOut = async (): Promise<void> => {
    await navigateToHomeWithFlag(LOGGED_OUT_QUERY_PARAM);
};

export const navigateToSessionExpired = async (): Promise<void> => {
    await navigateToHomeWithFlag(SESSION_EXPIRED_QUERY_PARAM);
};
