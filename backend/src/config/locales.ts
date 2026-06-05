export const SUPPORTED_LOCALES = ['en', 'pl'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'en';

export function isSupportedLocale(locale: unknown): locale is SupportedLocale {
  return typeof locale === 'string' && SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}

export function resolveLocale(locale: unknown): SupportedLocale {
  return isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
}

