import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './en.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        // English-lock: the app ships English-only for now. `lng` overrides the
        // detector (it stays wired below as dead code) so a returning visitor
        // with a stale `i18nextLng=pl` still renders English. The pl bundle and
        // language-switch machinery are intentionally kept for a future re-enable.
        lng: 'en',
        fallbackLng: 'en',
        resources: { en: { translation: en } },
        interpolation: {
            escapeValue: false, // React already escapes
        },
        detection: {
            order: ['localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage'],
        },
    });

// Dynamic loaders for secondary languages (en is bundled as the fallback)
const loaders: Record<string, () => Promise<any>> = {
    pl: () => import('./pl.json'),
};

const loadedLanguages = new Set<string>(['en']);

/**
 * Dynamically loads a language resource bundle if not already loaded.
 */
export const loadLanguage = async (lng: string) => {
    const baseLng = lng.split('-')[0];
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
        document.documentElement.lang = lng.split('-')[0];
    }
};

// Initial load for the detected language
const initialLng = i18n.resolvedLanguage || i18n.language || 'en';
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
