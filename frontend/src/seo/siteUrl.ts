import { getRuntimeOrigin } from '@/platform/runtime';

const DEFAULT_SITE_URL = 'https://scvmrack.rpgtools.co';

const stripTrailingSlashes = (value: string): string => value.replace(/\/+$/, '');

export const getSiteUrl = (): string => {
    const configuredSiteUrl = import.meta.env.VITE_SITE_URL?.trim();
    if (configuredSiteUrl) {
        return stripTrailingSlashes(configuredSiteUrl);
    }

    const runtimeOrigin = getRuntimeOrigin();
    if (runtimeOrigin) {
        return stripTrailingSlashes(runtimeOrigin);
    }

    return DEFAULT_SITE_URL;
};
