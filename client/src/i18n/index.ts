import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // React already escapes
        },
        detection: {
            order: ['localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage'],
        },
    });

// Dynamic loaders for languages
const loaders: Record<string, () => Promise<any>> = {
    en: () => import('./en.json'),
    pl: () => import('./pl.json'),
};

const loadedLanguages = new Set<string>();

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
            console.error(`Failed to load language: ${baseLng}`, error);
        }
    }
};

// Initial load for the detected language
const initialLng = i18n.resolvedLanguage || i18n.language || 'en';
loadLanguage(initialLng);

// Automatically load new languages when they are changed
i18n.on('languageChanged', (lng) => {
    loadLanguage(lng);
});

export default i18n;

// Re-export types
export type { TranslationKeys, TranslationKey } from './i18n.types';
