import type { Preferences } from '@/types';
import { overrides } from './locales/overrides.ts';
import { languages, type Language } from './languages.ts';
import { expandedOverrides } from './locales/expandedOverrides.ts';

export type { Language } from './languages.ts';
let language: Language = 'en';
let hour12 = false;
let pending: Preferences['regional'] | null = null;
let account: number | null | undefined;
let revision = 0;
type Catalog = Record<string, string>;
const emptyCatalog: Catalog = {};
const catalogs: Partial<Record<Language, Catalog>> = { en: emptyCatalog };
const loading: Partial<Record<Language, Promise<void>>> = {};
const loaders = {
    et: () => import('./locales/et.ts'), ru: () => import('./locales/ru.ts'),
    'pt-BR': () => import('./locales/pt-BR.ts'), es: () => import('./locales/es.ts'),
    de: () => import('./locales/de.ts'), fr: () => import('./locales/fr.ts'),
    fi: () => import('./locales/fi.ts'), uk: () => import('./locales/uk.ts'),
    lv: () => import('./locales/lv.ts'), lt: () => import('./locales/lt.ts'), pl: () => import('./locales/pl.ts'),
};
const listeners = new Set<() => void>();
export const getLanguage = () => language;
export const getRegionalSnapshot = () => `${language}:${revision}`;
export const subscribeLanguage = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const notifyLanguage = () => { revision++; listeners.forEach((listener) => listener()); };
/** English needs no dictionary; other languages load only when selected. */
export function loadRegionalLanguage(selected: Language): Promise<void> {
    if (catalogs[selected]) return Promise.resolve();
    if (loading[selected]) return loading[selected];
    if (selected === 'en') return Promise.resolve();
    const request = loaders[selected]();
    return loading[selected] = request.then(module => {
        catalogs[selected] = module.default;
        delete templates[selected];
        if (language === selected) notifyLanguage();
    }).catch(error => { delete loading[selected]; throw error; });
}
export function setRegionalAccount(id: number | null) { if (account !== id) { account = id; pending = null; } }

export function previewRegional(regional: NonNullable<Preferences['regional']>) {
    pending = regional;
    language = regional.language ?? language;
    hour12 = regional.time_format === '12';
    document.documentElement.lang = language;
    if (!catalogs[language]) void loadRegionalLanguage(language).catch(() => {});
    notifyLanguage();
}
export function cancelRegionalPreview(preferences?: Preferences | null) { pending = null; applyRegional(preferences); }

/** Updated from account preferences on every Inertia visit, including embedded settings. */
export function applyRegional(preferences?: Preferences | null) {
    const before = language;
    if (pending && preferences?.regional?.language === pending.language && preferences?.regional?.time_format === pending.time_format) pending = null;
    const regional = pending ?? preferences?.regional;
    language = regional?.language ?? 'en';
    hour12 = regional?.time_format === '12';
    document.documentElement.lang = language;
    if (!catalogs[language]) void loadRegionalLanguage(language).catch(() => {});
    if (before !== language) queueMicrotask(notifyLanguage);
}

export function formatTime(value: string | Date, options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }) {
    return new Date(value).toLocaleTimeString(languages[language].locale, { ...options, hour12 });
}

export function formatDateTime(value: string | Date, options?: Intl.DateTimeFormatOptions) {
    return new Date(value).toLocaleString(languages[language].locale, { ...options, hour12 });
}

export function formatDate(value: string | Date, options?: Intl.DateTimeFormatOptions) {
    return new Date(value).toLocaleDateString(languages[language].locale, options);
}

const translations: Record<string, [string, string]> = {
    ...overrides,
    'Settings': ['Seaded', 'Настройки'],
    'Your profile, your privacy and how SFD-DJ.EU works for you.': ['Sinu profiil, privaatsus ja SFD-DJ.EU eelistused.', 'Ваш профиль, конфиденциальность и настройки SFD-DJ.EU.'],
    'You': ['Sina', 'Вы'], 'Profile': ['Profiil', 'Профиль'],
    'Connections': ['Ühendused', 'Подключения'], 'Privacy': ['Privaatsus', 'Конфиденциальность'],
    'Account & security': ['Konto ja turvalisus', 'Аккаунт и безопасность'],
    'Account status': ['Konto olek', 'Статус аккаунта'], 'Violations': ['Rikkumised', 'Нарушения'],
    'Preferences': ['Eelistused', 'Предпочтения'], 'Appearance': ['Välimus', 'Оформление'],
    'Audio': ['Heli', 'Звук'], 'Notifications': ['Teavitused', 'Уведомления'],
    'Regional': ['Piirkondlikud seaded', 'Региональные настройки'],
    'Language & Time': ['Keel ja kellaaeg', 'Язык и время'],
    'More': ['Veel', 'Дополнительно'], 'Developer tools': ['Arendaja tööriistad', 'Инструменты разработчика'],
    'Developers': ['Arendajad', 'Разработчики'],
    'Language': ['Keel', 'Язык'], 'Time Format': ['Kellaajavorming', 'Формат времени'],
    'Choose your language and how times are displayed.': ['Vali keel ja kellaaja kuvamise vorming.', 'Выберите язык и формат отображения времени.'],
    'Language applies to these settings and date formatting. Other pages currently use English.': ['Keelevalik muudab neid seadeid ja kuupäevade vormingut. Ülejäänud lehed on praegu inglise keeles.', 'Язык применяется к этим настройкам и формату дат. Остальные страницы пока на английском.'],
    '12-hour (1:00 PM)': ['12 tundi (1:00 PM)', '12 часов (1:00 PM)'],
    '24-hour (13:00)': ['24 tundi (13:00)', '24 часа (13:00)'],
    'Preview': ['Eelvaade', 'Предпросмотр'], 'Save changes': ['Salvesta muudatused', 'Сохранить изменения'],
    'Saving…': ['Salvestan…', 'Сохранение…'], 'Changes saved.': ['Muudatused salvestatud.', 'Изменения сохранены.'],
    'Saved to your account and used on your other devices.': ['Salvestatakse sinu kontole ja kasutatakse ka teistes seadmetes.', 'Сохраняется в аккаунте и применяется на других устройствах.'],
};

export function translate(text: string, selected: Language = language): string {
    if (selected === 'en' || !text.trim()) return text;
    const core = text.trim().replace(/\s+/g, ' ');
    const catalog = catalogs[selected] ?? emptyCatalog;
    const reviewed = reviewedCatalogs[selected];
    const manual = Object.hasOwn(reviewed, core) ? reviewed[core] : undefined;
    let result = manual ?? (Object.hasOwn(catalog, core) ? catalog[core] : undefined);
    if (!result) {
        const patterns = templates[selected] ??= compileTemplates({ ...catalog, ...reviewed });
        for (const template of patterns) {
            if (template.prefix && !core.startsWith(template.prefix)) continue;
            if (template.anchor && !core.includes(template.anchor)) continue;
            const match = core.match(template.pattern);
            if (match) { result = template.value.replace(/\{(\d+)\}/g, (_, number: string) => match[template.order.indexOf(+number) + 1] ?? ''); break; }
        }
    }
    if (!result) return text;
    return (text.match(/^\s*/)?.[0] ?? '') + result + (text.match(/\s*$/)?.[0] ?? '');
}

function compileTemplates(catalog: Record<string, string>) {
    return Object.entries(catalog).filter(([key]) => /\{\d+\}/.test(key) && key.replace(/\{\d+\}/g, '').replace(/[^A-Za-z]/g, '').length >= 3).map(([key, value]) => {
        const order: number[] = [];
        const escaped = key.split(/(\{\d+\})/).map((part) => {
            if (/^\{\d+\}$/.test(part)) { order.push(+part.slice(1, -1)); return '(.*?)'; }
            return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }).join('');
        return { pattern: new RegExp(`^${escaped}$`), order, value, prefix: key.split('{')[0], anchor: key.split(/\{\d+\}/).sort((a, b) => b.length - a.length)[0] };
    }).sort((a, b) => b.anchor.length - a.anchor.length);
}
const reviewedCatalogs: Record<Exclude<Language, 'en'>, Catalog> = {
    ...expandedOverrides,
    et: Object.fromEntries(Object.entries(translations).map(([key, value]) => [key, value[0]])),
    ru: Object.fromEntries(Object.entries(translations).map(([key, value]) => [key, value[1]])),
};
const templates: Partial<Record<Language, ReturnType<typeof compileTemplates>>> = {};
