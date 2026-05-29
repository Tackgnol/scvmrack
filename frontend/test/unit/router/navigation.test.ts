import {beforeEach, describe, expect, it, vi} from 'vitest';
import {appHistory} from '@/router/history.ts';
import {
  buildHomeCallbackUrl,
  buildPrintCallbackUrl,
  CHARACTER_ID_QUERY_PARAM,
  CLAIM_CHARACTER_QUERY_PARAM,
  clearCurrentSearchParam,
  getCurrentCharacterIdParam,
  getCurrentSearchParamValue,
  hasCurrentSearchParam,
  LOGGED_OUT_QUERY_PARAM,
  navigateToLoggedOut,
  navigateToSessionExpired,
  SESSION_EXPIRED_QUERY_PARAM,
  setCurrentCharacterIdParam,
} from '@/router/navigation.ts';

vi.mock('../../../src/router/history', () => ({
    appHistory: {
        location: {
            search: '',
            pathname: '/',
            hash: '',
        },
        replace: vi.fn().mockResolvedValue(undefined),
    },
}));

describe('navigation router utils', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        appHistory.location.search = '';
        appHistory.location.pathname = '/';
        appHistory.location.hash = '';
    });

    describe('hasCurrentSearchParam', () => {
        it('should return true if param exists', () => {
            appHistory.location.search = '?test=1';
            expect(hasCurrentSearchParam('test')).toBe(true);
        });

        it('should return false if param does not exist', () => {
            appHistory.location.search = '?other=1';
            expect(hasCurrentSearchParam('test')).toBe(false);
        });
    });

    describe('getCurrentSearchParamValue', () => {
        it('should return trimmed value if exists', () => {
            appHistory.location.search = '?test=%20hello%20';
            expect(getCurrentSearchParamValue('test')).toBe('hello');
        });

        it('should return null if not exists or empty', () => {
            appHistory.location.search = '?test=';
            expect(getCurrentSearchParamValue('test')).toBeNull();
            expect(getCurrentSearchParamValue('other')).toBeNull();
        });
    });

    describe('getCurrentCharacterIdParam', () => {
        it('should return character ID from search', () => {
            appHistory.location.search = `?${CHARACTER_ID_QUERY_PARAM}=123`;
            expect(getCurrentCharacterIdParam()).toBe('123');
        });
    });

    describe('setCurrentCharacterIdParam', () => {
        it('should set character ID in search', async () => {
            await setCurrentCharacterIdParam('456');
            expect(appHistory.replace).toHaveBeenCalledWith(`/?${CHARACTER_ID_QUERY_PARAM}=456`);
        });

        it('should remove character ID if null', async () => {
            appHistory.location.search = `?${CHARACTER_ID_QUERY_PARAM}=123`;
            await setCurrentCharacterIdParam(null);
            expect(appHistory.replace).toHaveBeenCalledWith('/');
        });
    });

    describe('buildHomeCallbackUrl', () => {
        it('should build URL with provided params', () => {
            const url = buildHomeCallbackUrl('char1', 'claim1');
            expect(url).toBe(
                `/character?${CHARACTER_ID_QUERY_PARAM}=char1&${CLAIM_CHARACTER_QUERY_PARAM}=claim1`
            );
        });

        it('should build URL with only character ID', () => {
            const url = buildHomeCallbackUrl('char1');
            expect(url).toBe('/character/char1');
        });

        it('should build character home URL without params when no character is active', () => {
            const url = buildHomeCallbackUrl(null);
            expect(url).toBe('/character');
        });
    });

    describe('buildPrintCallbackUrl', () => {
        it('should build /print URL with character ID', () => {
            const url = buildPrintCallbackUrl('char1');
            expect(url).toBe(`/print?${CHARACTER_ID_QUERY_PARAM}=char1`);
        });

        it('should build /print URL without character ID when null', () => {
            const url = buildPrintCallbackUrl(null);
            expect(url).toBe('/print');
        });
    });

    describe('clearCurrentSearchParam', () => {
        it('should remove param from search', async () => {
            appHistory.location.search = '?a=1&b=2';
            await clearCurrentSearchParam('a');
            expect(appHistory.replace).toHaveBeenCalledWith('/?b=2');
        });
    });

    describe('navigateToLoggedOut', () => {
        it('should navigate to home with logged-out flag', async () => {
            await navigateToLoggedOut();
            expect(appHistory.replace).toHaveBeenCalledWith(
                `/character?${LOGGED_OUT_QUERY_PARAM}=true`
            );
        });
    });

    describe('navigateToSessionExpired', () => {
        it('should navigate to home with expired flag', async () => {
            await navigateToSessionExpired();
            expect(appHistory.replace).toHaveBeenCalledWith(
                `/character?${SESSION_EXPIRED_QUERY_PARAM}=true`
            );
        });

        it('should preserve current character when navigating to expired session flow', async () => {
            appHistory.location.search = `?${CHARACTER_ID_QUERY_PARAM}=char1`;
            await navigateToSessionExpired();
            expect(appHistory.replace).toHaveBeenCalledWith(
                `/character?${CHARACTER_ID_QUERY_PARAM}=char1&${SESSION_EXPIRED_QUERY_PARAM}=true`
            );
        });
    });
});
