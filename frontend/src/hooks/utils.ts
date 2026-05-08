import {PathsApiCharactersIdGetParametersQueryLocale} from "@/api/schema.ts";

export const getCharacterKey = (id: string, locale: string| undefined) =>
    ['get', '/api/characters/{id}', { params: { path: { id }, query: { locale } } }] as const;

export const getApiLocale = <T>(i18nLocale?: string) => {
    const trimmed =  i18nLocale?.substring(0, 2)

    switch (trimmed) {
        case 'pl':
            return PathsApiCharactersIdGetParametersQueryLocale.pl as T;
        case 'en':
        default:
            return PathsApiCharactersIdGetParametersQueryLocale.en as T
    }
}
