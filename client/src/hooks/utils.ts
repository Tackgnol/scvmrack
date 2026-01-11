import {PathsCharactersIdGetParametersQueryLocale} from "@/api/schema.ts";

export const getCharacterKey = (id: string, locale: string| undefined) =>
    ['get', '/characters/{id}', { params: { path: { id }, query: { locale } } }] as const;

export const getApiLocale = <T>(i18nLocale?: string) => {
    const trimmed =  i18nLocale?.substring(0, 2)

    switch (trimmed) {
        case 'pl':
            return PathsCharactersIdGetParametersQueryLocale.pl as T;
        case 'en':
        default:
            return PathsCharactersIdGetParametersQueryLocale.en as T
    }
}
