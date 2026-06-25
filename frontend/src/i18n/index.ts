import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './en.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        // Language is detector-driven (localStorage → navigator → htmlTag) with the
        // chosen locale cached in localStorage; English is the fallback when a key
        // (or the whole pl bundle, loaded lazily) is missing. The header
        // LanguageToggle drives changes via i18n.changeLanguage.
        fallbackLng: 'en',
        resources: { en: { translation: en } },
        interpolation: {
            escapeValue: false, // React already escapes
        },
        react: {
            bindI18nStore: 'added',
        },
        detection: {
            order: ['localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage'],
        },
    });

// Dynamic loaders for secondary languages (en is bundled as the fallback)
const loaders: Record<string, () => Promise<{ default: Record<string, unknown> }>> = {
    pl: () => import('./pl.json') as Promise<{ default: Record<string, unknown> }>,
};

const loadedLanguages = new Set<string>(['en']);

const baseLanguage = (lng: string) => lng.split('-')[0];

/**
 * Dynamically loads a language resource bundle if not already loaded.
 */
export const loadLanguage = async (lng: string) => {
    const baseLng = baseLanguage(lng);
    if (loaders[baseLng] && !loadedLanguages.has(baseLng)) {
        try {
            const data = await loaders[baseLng]();
            i18n.addResourceBundle(baseLng, 'translation', data.default, true, true);
            loadedLanguages.add(baseLng);
        } catch (error) {
            console.error('Failed to load language', { language: baseLng, error });
        }
    }
};

// Keep <html lang> in sync so screen readers pronounce content correctly and
// crawlers see the right language (a11y + SEO).
const syncHtmlLang = (lng: string) => {
    if (typeof document !== 'undefined') {
        document.documentElement.lang = baseLanguage(lng);
    }
};

// Initial load for the detected language. Use i18n.language (what the detector
// actually picked) rather than resolvedLanguage — before the bundle loads,
// resolvedLanguage reports the en fallback, which would load 'en' and leave a
// pl-detected visitor stuck on English while the toggle shows PL.
const initialLng = i18n.language || i18n.resolvedLanguage || 'en';
loadLanguage(initialLng);
syncHtmlLang(initialLng);

// Automatically load new languages and update <html lang> when they change
i18n.on('languageChanged', (lng) => {
    loadLanguage(lng);
    syncHtmlLang(lng);
});

export default i18n;

// Re-export types
export type { TranslationKeys, TranslationKey } from './i18n.types';
