import type { LucideIcon } from 'lucide-react';
import { createPortal } from 'react-dom';
import { ComponentType, ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface MenuItem {
    label: string;
    icon: LucideIcon | ComponentType<{ size?: number; className?: string }>;
    onSelect: () => void;
    danger?: boolean;
    keepOpen?: boolean; // stay open after choosing (the item changes its own label, e.g. "Copied!")
}

/** Where the menu opens. `right`: the menu's right edge is at x. `flipTo`: where its bottom edge goes when there is no room below. */
export interface MenuAnchor {
    x: number;
    y: number;
    right?: boolean;
    flipTo?: number;
}

/**
 * A small floating menu: an optional header and groups of actions. It stays inside the window, closes on Esc, on a click
 * elsewhere, on scrolling or resizing, and the arrow keys move between the items. Anything marked `data-menu-trigger` (the button
 * that opened it) is left alone, so clicking it again can close the menu.
 */
export default function ContextMenu({ anchor, header, groups, titles = [], label, onClose }: { anchor: MenuAnchor; header?: ReactNode; groups: MenuItem[][]; titles?: (string | undefined)[]; label: string; onClose: () => void }) {
    const box = useRef<HTMLDivElement>(null);
    const close = useRef(onClose);
    close.current = onClose;
    const [pos, setPos] = useState({ left: 0, top: 0 });

    useLayoutEffect(() => {
        const el = box.current;
        if (!el) return;
        const { width, height } = el.getBoundingClientRect();
        const left = Math.max(8, Math.min(anchor.right ? anchor.x - width : anchor.x, window.innerWidth - width - 8));
        const top = anchor.y + height <= window.innerHeight - 8 ? anchor.y : (anchor.flipTo ?? anchor.y) - height;
        setPos({ left, top: Math.max(8, top) });
    }, [anchor]);

    useEffect(() => {
        const before = document.activeElement as HTMLElement | null;
        const items = () => [...(box.current?.querySelectorAll<HTMLElement>('[role=menuitem]') ?? [])];
        items()[0]?.focus({ preventScroll: true });

        const outside = (e: Event) => {
            const t = e.target as HTMLElement;
            if (!box.current?.contains(t) && !t.closest?.('[data-menu-trigger]')) close.current();
        };
        const key = (e: KeyboardEvent) => {
            if (e.key === 'Escape' || e.key === 'Tab') {
                if (e.key === 'Escape') e.preventDefault();
                close.current();
                return;
            }
            const list = items();
            const at = list.indexOf(document.activeElement as HTMLElement);
            const go = (n: number) => {
                e.preventDefault();
                list[(n + list.length) % list.length]?.focus({ preventScroll: true });
            };
            if (e.key === 'ArrowDown') go(at + 1);
            else if (e.key === 'ArrowUp') go(at < 0 ? list.length - 1 : at - 1);
            else if (e.key === 'Home') go(0);
            else if (e.key === 'End') go(list.length - 1);
        };
        const shut = () => close.current();

        document.addEventListener('keydown', key);
        document.addEventListener('pointerdown', outside, true);
        window.addEventListener('wheel', outside, { passive: true });
        window.addEventListener('resize', shut);
        window.addEventListener('blur', shut);

        return () => {
            document.removeEventListener('keydown', key);
            document.removeEventListener('pointerdown', outside, true);
            window.removeEventListener('wheel', outside);
            window.removeEventListener('resize', shut);
            window.removeEventListener('blur', shut);
            if (before?.isConnected && before.matches(':focus-visible')) before.focus({ preventScroll: true }); // keyboard users land back where they were
        };
    }, []);

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
            ref={box}
            role="menu"
            aria-label={label}
            onContextMenu={(e) => e.preventDefault()}
            style={pos}
            className="fixed z-70 max-h-[calc(100vh-1rem)] w-60 animate-menu overflow-y-auto rounded-2xl border border-white/10 bg-neutral-900/95 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-md"
        >
            {header && <div className="px-2 pb-1.5 pt-1">{header}</div>}
            {groups.map((group, g) => (
                <div key={g} className={g > 0 || header ? 'mt-1 border-t border-white/10 pt-1' : ''}>
                    {titles[g] && <p className="px-2.5 pb-0.5 pt-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">{titles[g]}</p>}
                    {group.map((item) => (
                        <button
                            key={item.label}
                            role="menuitem"
                            onClick={() => {
                                item.onSelect();
                                if (!item.keepOpen) close.current();
                            }}
                            className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium outline-none transition-colors ${item.danger ? 'text-red-300 hover:bg-red-500/15 focus:bg-red-500/15' : 'text-neutral-200 hover:bg-white/10 focus:bg-white/10'}`}
                        >
                            <item.icon size={15} className={item.danger ? 'text-red-300' : 'text-neutral-400'} />
                            {item.label}
                        </button>
                    ))}
                </div>
            ))}
        </div>,
        document.body,
    );
}
