import type { ApiLocale } from "@/api";

export const getCharacterKey = (id: string, locale: string| undefined) =>
    ['get', '/api/characters/{id}', { params: { path: { id }, query: { locale } } }] as const;

/** The API locale for an i18n language tag; anything but Polish reads English. */
export const getApiLocale = (i18nLocale?: string): ApiLocale =>
    i18nLocale?.substring(0, 2) === 'pl' ? 'pl' : 'en';
