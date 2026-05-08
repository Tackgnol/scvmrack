import { useEffect } from 'react';
import { getRuntimeOrigin } from '@/platform/runtime';

const SITE_NAME = 'Scvm Rack';
const DEFAULT_SITE_URL = 'https://scvmrack.rpgtools.eu.org';
const DEFAULT_IMAGE_PATH = '/preview.png';

type JsonLd = Record<string, unknown> | Array<Record<string, unknown>>;

interface SeoProps {
    title: string;
    description: string;
    path?: string;
    keywords?: string[];
    type?: 'website' | 'article';
    imagePath?: string;
    noIndex?: boolean;
    jsonLd?: JsonLd;
}

const stripTrailingSlashes = (value: string): string => value.replace(/\/+$/, '');

const toAbsoluteUrl = (siteUrl: string, path: string): string => {
    if (!path) {
        return `${siteUrl}/`;
    }

    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    return path.startsWith('/') ? `${siteUrl}${path}` : `${siteUrl}/${path}`;
};

const upsertMetaTag = (
    queryAttribute: 'name' | 'property',
    queryValue: string,
    content: string
): void => {
    const selector = `meta[${queryAttribute}="${queryValue}"]`;
    let tag = document.head.querySelector<HTMLMetaElement>(selector);

    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(queryAttribute, queryValue);
        document.head.append(tag);
    }

    tag.setAttribute('content', content);
};

const removeMetaTag = (queryAttribute: 'name' | 'property', queryValue: string): void => {
    const selector = `meta[${queryAttribute}="${queryValue}"]`;
    const tag = document.head.querySelector<HTMLMetaElement>(selector);
    tag?.remove();
};

const upsertCanonical = (href: string): void => {
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.append(link);
    }
    link.setAttribute('href', href);
};

const upsertJsonLd = (serializedJsonLd: string | undefined): void => {
    const scriptId = 'seo-json-ld';
    const existing = document.getElementById(scriptId);

    if (!serializedJsonLd) {
        existing?.remove();
        return;
    }

    let scriptTag: HTMLScriptElement;
    if (existing instanceof HTMLScriptElement) {
        scriptTag = existing;
    } else {
        scriptTag = document.createElement('script');
        scriptTag.id = scriptId;
        scriptTag.type = 'application/ld+json';
        document.head.append(scriptTag);
    }

    scriptTag.textContent = serializedJsonLd;
};

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

export function Seo({
    title,
    description,
    path = '/',
    keywords,
    type = 'website',
    imagePath = DEFAULT_IMAGE_PATH,
    noIndex = false,
    jsonLd,
}: SeoProps) {
    const serializedJsonLd = jsonLd ? JSON.stringify(jsonLd) : undefined;
    const keywordsContent = keywords?.join(', ');
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

    useEffect(() => {
        const siteUrl = getSiteUrl();
        const canonicalUrl = toAbsoluteUrl(siteUrl, path);
        const ogImageUrl = toAbsoluteUrl(siteUrl, imagePath);

        document.title = fullTitle;

        upsertMetaTag('name', 'description', description);
        upsertMetaTag(
            'name',
            'robots',
            noIndex
                ? 'noindex,nofollow,max-snippet:-1,max-image-preview:large,max-video-preview:-1'
                : 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1'
        );

        if (keywordsContent) {
            upsertMetaTag('name', 'keywords', keywordsContent);
        } else {
            removeMetaTag('name', 'keywords');
        }

        upsertMetaTag('property', 'og:site_name', SITE_NAME);
        upsertMetaTag('property', 'og:type', type);
        upsertMetaTag('property', 'og:title', fullTitle);
        upsertMetaTag('property', 'og:description', description);
        upsertMetaTag('property', 'og:url', canonicalUrl);
        upsertMetaTag('property', 'og:image', ogImageUrl);
        upsertMetaTag('property', 'og:image:width', '1600');
        upsertMetaTag('property', 'og:image:height', '627');
        upsertMetaTag('property', 'og:image:alt', 'Scvm Rack Mork Borg character sheet preview');
        upsertMetaTag('property', 'og:locale', 'en_US');

        upsertMetaTag('name', 'twitter:card', 'summary_large_image');
        upsertMetaTag('name', 'twitter:title', fullTitle);
        upsertMetaTag('name', 'twitter:description', description);
        upsertMetaTag('name', 'twitter:image', ogImageUrl);
        upsertMetaTag('name', 'twitter:image:alt', 'Scvm Rack Mork Borg character sheet preview');

        upsertCanonical(canonicalUrl);
        upsertJsonLd(serializedJsonLd);
    }, [
        description,
        fullTitle,
        imagePath,
        keywordsContent,
        noIndex,
        path,
        serializedJsonLd,
        type,
    ]);

    return null;
}
