import { appHistory } from '@/router/history';

export const LOGGED_OUT_QUERY_PARAM = 'logged-out';
export const SESSION_EXPIRED_QUERY_PARAM = 'expired';

const HOME_PATH = '/';

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
