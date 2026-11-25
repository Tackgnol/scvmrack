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
const GM_PATH_PREFIX = '/gm/';
const RESERVED_CHARACTER_PATH_SEGMENTS = new Set(['new', 'create']);
const PARTY_CHARACTER_PATH_PATTERN = /^\/party\/([^/]+)\/character\/([^/]+)/;

const isCharacterPath = (pathname: string): boolean => {
    return pathname === HOME_PATH || pathname.startsWith(`${HOME_PATH}/`);
};

export const buildCharacterPath = (characterId: string | null): string => {
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
    update: (searchParams: URLSearchParams) => void,
    ignoreBlocker = false,
): Promise<void> => {
    const searchParams = getCurrentSearchParams();
    update(searchParams);

    await replacePath(
        buildPath(appHistory.location.pathname, searchParams, appHistory.location.hash),
        ignoreBlocker
    );
};

const replacePath = async (path: string, ignoreBlocker: boolean): Promise<void> => {
    if (ignoreBlocker) {
        await appHistory.replace(path, undefined, { ignoreBlocker: true });
    } else {
        await appHistory.replace(path);
    }
};

const navigateToHomeWithFlag = async (
    pathname: string,
    queryParam: string,
    preserveCurrentSearchParams = false,
    ignoreBlocker = false
): Promise<void> => {
    const searchParams = preserveCurrentSearchParams
        ? getCurrentSearchParams()
        : new URLSearchParams();
    searchParams.set(queryParam, 'true');
    const nextPath = buildPath(pathname, searchParams, '');
    if (ignoreBlocker) {
        await appHistory.replace(nextPath, undefined, { ignoreBlocker: true });
    } else {
        await appHistory.replace(nextPath);
    }
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
    if (queryId) {
        return queryId;
    }

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

export const setCurrentCharacterIdParam = async (
    characterId: string | null,
    { ignoreBlocker = false }: { ignoreBlocker?: boolean } = {},
): Promise<void> => {
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
        await replacePath(buildPath(
            characterId
                ? buildPartyCharacterPath(decodeURIComponent(partyMatch[1]), characterId)
                : NEW_CHARACTER_PATH,
            searchParams,
            appHistory.location.hash
        ), ignoreBlocker);
        return;
    }

    if (isCharacterPath(appHistory.location.pathname)) {
        const searchParams = getCurrentSearchParams();
        searchParams.delete(CHARACTER_ID_QUERY_PARAM);
        await replacePath(buildPath(
            buildCharacterPath(characterId),
            searchParams,
            appHistory.location.hash
        ), ignoreBlocker);
        return;
    }

    await replaceCurrentWithSearchParams((searchParams) => {
        if (characterId) {
            searchParams.set(CHARACTER_ID_QUERY_PARAM, characterId);
        } else {
            searchParams.delete(CHARACTER_ID_QUERY_PARAM);
        }
    }, ignoreBlocker);
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
        return buildPath(NEW_CHARACTER_PATH, searchParams, '');
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
    }, queryParam === SESSION_EXPIRED_QUERY_PARAM);
};

export const navigateToLoggedOut = async (): Promise<void> => {
    // The public landing page: the sheet route would wait forever for a character the
    // logged-out flag stops it from creating.
    // Sign-out already happened and queued edits cannot be saved without a session: the
    // sheet's save blocker must not hold the user on a page that has just turned into a 404.
    await navigateToHomeWithFlag('/', LOGGED_OUT_QUERY_PARAM, false, true);
};

/** Where signing in again should return: the GM page the visitor was working on (no expired flag), otherwise the default. */
export const buildSessionReturnPath = (): string | undefined => {
    if (!appHistory.location.pathname.startsWith(GM_PATH_PREFIX)) {
        return undefined;
    }
    const searchParams = getCurrentSearchParams();
    searchParams.delete(SESSION_EXPIRED_QUERY_PARAM);
    return buildPath(appHistory.location.pathname, searchParams, appHistory.location.hash);
};

export const navigateToSessionExpired = async (): Promise<void> => {
    const searchParams = getCurrentSearchParams();
    searchParams.set(SESSION_EXPIRED_QUERY_PARAM, 'true');
    // Expiry is a recovery signal, not user navigation. A pending save must
    // survive it rather than block the signal by trying to save again.
    // The Owlbear panel and the GM pages (account-only, often holding unsaved work such as a class draft) stay where
    // they are: the session-expired modal opens over them, and signing in returns to the same page.
    const inObr = appHistory.location.pathname === '/obr.html';
    const stay = inObr || appHistory.location.pathname.startsWith(GM_PATH_PREFIX);
    await appHistory.replace(buildPath(
        stay ? appHistory.location.pathname : NEW_CHARACTER_PATH,
        searchParams,
        stay ? appHistory.location.hash : '',
    ), undefined, { ignoreBlocker: true });
};
