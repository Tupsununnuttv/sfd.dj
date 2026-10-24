import { createContext, createElement, useContext, useSyncExternalStore } from 'react';
import type { ElementType, Key, ReactNode } from 'react';
import { jsx as reactJsx, jsxs as reactJsxs, Fragment } from 'react/jsx-runtime';
import { getRegionalSnapshot, subscribeLanguage, translate } from '@/lib/regional';
export { Fragment };
export type { JSX } from 'react/jsx-runtime';

const Original = createContext(false);
export function OriginalText({ children }: { children: ReactNode }) {
    return createElement(Original.Provider, { value: true }, children);
}
const sensitive = new Set(['svg', 'code', 'pre', 'script', 'style']);
const native = new Set(['title', 'meta', 'link', 'script', 'style', 'base', 'html', 'head', 'body']);
const translatedAttributes = ['title', 'placeholder', 'aria-label', 'aria-description', 'alt'];
type HostProps = { __sfdTag: string; [key: string]: unknown };
const renderers = new Map<string, (props: HostProps) => ReactNode>();
const originalSubscribe = () => () => {};
const originalSnapshot = () => 'en:0';

function LocalizedText({ value }: { value: string }) {
    const original = useContext(Original);
    useSyncExternalStore(original ? originalSubscribe : subscribeLanguage, original ? originalSnapshot : getRegionalSnapshot, originalSnapshot);
    return original ? value : translate(value);
}
function componentChildren(value: unknown, key = 'text'): unknown {
    if (typeof value === 'string') return createElement(LocalizedText, { value, key });
    if (Array.isArray(value)) return value.map((item, index) => componentChildren(item, `${key}-${index}`));
    return value;
}

function textNodes(value: unknown): unknown {
    if (typeof value === 'string') return translate(value);
    if (Array.isArray(value)) return value.map(textNodes);
    return value;
}

function LocalizedHost({ __sfdTag: tag, ...original }: HostProps) {
    const inherited = useContext(Original);
    const skip = inherited || original.translate === 'no' || original['data-no-translate'] === true || sensitive.has(tag) || (tag === 'option' && !!original.lang);
    useSyncExternalStore(skip ? originalSubscribe : subscribeLanguage, skip ? originalSnapshot : getRegionalSnapshot, originalSnapshot);
    const props = { ...original };
    if (!skip) {
        props.children = textNodes(props.children);
        for (const key of translatedAttributes) if (typeof props[key] === 'string') props[key] = translate(props[key] as string);
        if (tag === 'input' && ['submit', 'button', 'reset'].includes(String(props.type)) && typeof props.value === 'string') props.value = translate(props.value);
    }
    const element = createElement(tag, props);
    return skip && !inherited ? createElement(Original.Provider, { value: true }, element) : element;
}

function localized(factory: typeof reactJsx, type: ElementType, props: Record<string, unknown> | null, key?: Key) {
    if (typeof type !== 'string') {
        if (props && !(type as { originalText?: boolean }).originalText) props = { ...props, children: componentChildren(props.children) };
        return factory(type, props, key);
    }
    if (native.has(type)) return factory(type, props, key);
    let Renderer = renderers.get(type);
    if (!Renderer) {
        Renderer = (incoming: HostProps) => createElement(LocalizedHost, incoming);
        renderers.set(type, Renderer);
    }
    return factory(Renderer, { ...(props ?? {}), __sfdTag: type }, key);
}
export const jsx: typeof reactJsx = (type, props, key) => localized(reactJsx, type, props as Record<string, unknown> | null, key);
export const jsxs: typeof reactJsxs = (type, props, key) => localized(reactJsxs, type, props as Record<string, unknown> | null, key);
