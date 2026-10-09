/**
 * Accounts remembered on THIS device, only if the person ticks "Save this account on this device".
 * Nothing here ever goes to the server. The list is encrypted (AES-GCM) before it is written to localStorage,
 * and the key is a non-extractable CryptoKey kept in IndexedDB, so the stored text is useless on its own.
 * ponytail: code running on this site (or someone using this browser profile) can still read it; fine for a personal computer, not a shared one.
 */
export interface SavedAccount {
    username: string;
    name: string;
    email: string;
    password: string;
}

const STORE = 'sfd.accounts';

export const canSaveAccounts = typeof crypto !== 'undefined' && !!crypto.subtle && typeof indexedDB !== 'undefined';

const idb = <T,>(run: (store: IDBObjectStore) => IDBRequest<T>, mode: IDBTransactionMode): Promise<T> =>
    new Promise((resolve, reject) => {
        const open = indexedDB.open('sfd-keys', 1);
        open.onupgradeneeded = () => open.result.createObjectStore('keys');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
            const req = run(open.result.transaction('keys', mode).objectStore('keys'));
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        };
    });

async function key(): Promise<CryptoKey> {
    const existing = await idb<CryptoKey | undefined>((s) => s.get('main'), 'readonly');
    if (existing) return existing;

    const fresh = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    await idb((s) => s.put(fresh, 'main'), 'readwrite');

    return fresh;
}

const toB64 = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b)));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function loadAccounts(): Promise<SavedAccount[]> {
    try {
        const raw = localStorage.getItem(STORE);
        if (!raw || !canSaveAccounts) return [];

        const [iv, data] = raw.split('.');
        const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(iv) }, await key(), fromB64(data));

        return JSON.parse(new TextDecoder().decode(plain));
    } catch {
        return []; // missing, damaged or from another browser profile
    }
}

async function write(list: SavedAccount[]): Promise<void> {
    if (list.length === 0) return localStorage.removeItem(STORE);

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await key(), new TextEncoder().encode(JSON.stringify(list)));
    localStorage.setItem(STORE, `${toB64(iv)}.${toB64(data)}`);
}

/** Add an account, or replace the saved one with the same email. */
export async function saveAccount(account: SavedAccount): Promise<void> {
    if (!canSaveAccounts) return;
    const rest = (await loadAccounts()).filter((a) => a.email.toLowerCase() !== account.email.toLowerCase());
    await write([account, ...rest].slice(0, 5));
}

export async function forgetAccount(email: string): Promise<void> {
    await write((await loadAccounts()).filter((a) => a.email !== email));
}
