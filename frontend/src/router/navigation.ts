import { appHistory } from '@/router/history';

export const LOGGED_OUT_QUERY_PARAM = 'logged-out';
export const SESSION_EXPIRED_QUERY_PARAM = 'expired';
export const CHARACTER_ID_QUERY_PARAM = 'character';
export const CLAIM_CHARACTER_QUERY_PARAM = 'claim-character';
export const OBR_EXCHANGE_TOKEN_QUERY_PARAM = 'obrExchangeToken';

const HOME_PATH = '/character';
const NEW_CHARACTER_PATH = '/character/new';
const FORGE_PATH = '/character/create';
const PRINT_PATH = '/print';
const RESERVED_CHARACTER_PATH_SEGMENTS = new Set(['new', 'create']);
const PARTY_CHARACTER_PATH_PATTERN = /^\/party\/([^/]+)\/character\/([^/]+)/;

const isCharacterPath = (pathname: string): boolean => {
    return pathname === HOME_PATH || pathname.startsWith(`${HOME_PATH}/`);
};

const buildCharacterPath = (characterId: string | null): string => {
    return characterId ? `${HOME_PATH}/${encodeURIComponent(characterId)}` : NEW_CHARACTER_PATH;
};

export const buildPartyCharacterPath = (partyId: string, characterId: string): string =>
    `/party/${encodeURIComponent(partyId)}/character/${encodeURIComponent(characterId)}`;

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

const navigateToHomeWithFlag = async (
    queryParam: string,
    preserveCurrentSearchParams = false
): Promise<void> => {
    const searchParams = preserveCurrentSearchParams
        ? getCurrentSearchParams()
        : new URLSearchParams();
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
    const queryId = getCurrentSearchParamValue(CHARACTER_ID_QUERY_PARAM);
    if (queryId) return queryId;

    const pathname = appHistory.location.pathname;
    const partyMatch = pathname.match(PARTY_CHARACTER_PATH_PATTERN);
    if (partyMatch?.[2]) {
        return decodeURIComponent(partyMatch[2]);
    }

    const match = pathname.match(/^\/character\/([^/]+)/);
    if (!match) {
        return null;
    }

    const candidate = match[1];
    return RESERVED_CHARACTER_PATH_SEGMENTS.has(candidate) ? null : candidate;
};

export const getCurrentPendingClaimCharacterId = (): string | null => {
    return getCurrentSearchParamValue(CLAIM_CHARACTER_QUERY_PARAM);
};

export const setCurrentCharacterIdParam = async (characterId: string | null): Promise<void> => {
    // The forge (`/character/create`) owns its own navigation and is not bound to
    // an existing character. Syncing the current/last character id here would
    // rewrite the URL to that character's sheet (isCharacterPath matches any
    // `/character/...`), bouncing the user off the forge — so skip it entirely.
    if (appHistory.location.pathname === FORGE_PATH) {
        return;
    }

    const partyMatch = appHistory.location.pathname.match(PARTY_CHARACTER_PATH_PATTERN);
    if (partyMatch?.[1]) {
        const searchParams = getCurrentSearchParams();
        searchParams.delete(CHARACTER_ID_QUERY_PARAM);
        await appHistory.replace(buildPath(
            characterId
                ? buildPartyCharacterPath(decodeURIComponent(partyMatch[1]), characterId)
                : HOME_PATH,
            searchParams,
            appHistory.location.hash
        ));
        return;
    }

    if (isCharacterPath(appHistory.location.pathname)) {
        const searchParams = getCurrentSearchParams();
        searchParams.delete(CHARACTER_ID_QUERY_PARAM);
        await appHistory.replace(buildPath(
            buildCharacterPath(characterId),
            searchParams,
            appHistory.location.hash
        ));
        return;
    }

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
    if (claimCharacterId) {
        const searchParams = new URLSearchParams();
        if (characterId) {
            searchParams.set(CHARACTER_ID_QUERY_PARAM, characterId);
        }
        searchParams.set(CLAIM_CHARACTER_QUERY_PARAM, claimCharacterId);
        return buildPath(HOME_PATH, searchParams, '');
    }

    if (characterId) {
        return `${HOME_PATH}/${characterId}`;
    }

    return NEW_CHARACTER_PATH;
};

export const buildPrintCallbackUrl = (characterId: string | null): string => {
    if (characterId) {
        return `${PRINT_PATH}?${CHARACTER_ID_QUERY_PARAM}=${characterId}`;
    }

    return PRINT_PATH;
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
    await navigateToHomeWithFlag(SESSION_EXPIRED_QUERY_PARAM, true);
};
