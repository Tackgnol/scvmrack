import {LOCALE_KEY, STORAGE_KEY} from "@/hooks/consts.ts";

export const getCharacterKey = (id: string, locale: 'en' | 'pl') =>
    ['get', '/characters/{id}', { params: { path: { id }, query: { locale } } }] as const;

export function getStoredCharacterId(): string | null {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

export function setStoredCharacterId(id: string | null) {
    try {
        if (id) localStorage.setItem(STORAGE_KEY, id);
        else localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
}

export function getStoredLocale(): 'en' | 'pl' {
    try {
        const stored = localStorage.getItem(LOCALE_KEY);
        return stored === 'pl' ? 'pl' : 'en';  // Default to 'en' if invalid/missing
    } catch { return 'en'; }
}

export function setStoredLocale(locale: 'en' | 'pl') {
    try {
        localStorage.setItem(LOCALE_KEY, locale);
    } catch { /* ignore */ }
}
