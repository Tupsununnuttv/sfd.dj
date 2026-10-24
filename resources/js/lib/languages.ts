export const languages = {
    en: { label: 'English', locale: 'en-GB' },
    et: { label: 'Eesti', locale: 'et-EE' },
    ru: { label: 'Русский', locale: 'ru-RU' },
    'pt-BR': { label: 'Português (Brasil)', locale: 'pt-BR' },
    es: { label: 'Español', locale: 'es-ES' },
    de: { label: 'Deutsch', locale: 'de-DE' },
    fr: { label: 'Français', locale: 'fr-FR' },
    fi: { label: 'Suomi', locale: 'fi-FI' },
    uk: { label: 'Українська', locale: 'uk-UA' },
    lv: { label: 'Latviešu', locale: 'lv-LV' },
    lt: { label: 'Lietuvių', locale: 'lt-LT' },
    pl: { label: 'Polski', locale: 'pl-PL' },
} as const;
export type Language = keyof typeof languages;
export const isLanguage = (value: unknown): value is Language => typeof value === 'string' && Object.hasOwn(languages, value);
