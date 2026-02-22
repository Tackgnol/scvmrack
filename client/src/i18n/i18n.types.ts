import en from './en.json';

// Source of truth for translation structure
export type TranslationKeys = typeof en;

type JoinPath<Prefix extends string, Key extends string> = Prefix extends ''
  ? Key
  : `${Prefix}.${Key}`;

type LeafPaths<T, Prefix extends string = ''> = T extends Record<string, unknown>
  ? {
      [K in Extract<keyof T, string>]: T[K] extends Record<string, unknown>
        ? LeafPaths<T[K], JoinPath<Prefix, K>>
        : JoinPath<Prefix, K>;
    }[Extract<keyof T, string>]
  : never;

// Flattened dot-notation keys for t() function
export type TranslationKey = LeafPaths<TranslationKeys>;

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: TranslationKeys;
    };
  }
}
