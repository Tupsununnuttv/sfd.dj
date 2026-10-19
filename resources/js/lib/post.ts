/** Send JSON to a Laravel route; throws the server's message (e.g. validation error) on failure. */
export async function send(method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', url: string, data?: object, options: { keepalive?: boolean } = {}): Promise<void> {
    const xsrf = decodeURIComponent(
        document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
    );

    const res = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-XSRF-TOKEN': xsrf,
        },
        body: data ? JSON.stringify(data) : undefined,
        keepalive: options.keepalive,
    });

    if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        const first = json.errors && (Object.values(json.errors)[0] as string[])[0];
        throw new Error(first ?? json.message ?? 'Request failed');
    }
}

export const post = (url: string, data?: object) => send('POST', url, data);

/** GET JSON from a Laravel route; throws the server's message on failure. */
export async function getJson<T>(url: string, options: { signal?: AbortSignal } = {}): Promise<T> {
    const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: options.signal });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) throw new Error(json.message ?? 'Request failed');

    return json as T;
}

/** Send JSON and read the JSON that comes back (the playlist API). */
export async function sendJson<T>(method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', url: string, data?: object): Promise<T> {
    const xsrf = decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '');

    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-XSRF-TOKEN': xsrf },
        body: data ? JSON.stringify(data) : undefined,
    });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
        const first = json.errors && (Object.values(json.errors)[0] as string[])[0];
        throw new Error(first ?? json.message ?? 'Request failed');
    }

    return json as T;
}

/** Upload a file (multipart) and read the JSON that comes back. */
export async function uploadJson<T>(url: string, form: FormData): Promise<T> {
    const xsrf = decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '');

    const res = await fetch(url, { method: 'POST', headers: { Accept: 'application/json', 'X-XSRF-TOKEN': xsrf }, body: form });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
        const first = json.errors && (Object.values(json.errors)[0] as string[])[0];
        throw new Error(first ?? json.message ?? 'Upload failed');
    }

    return json as T;
}

/** Upload a file (multipart). */
export async function upload(url: string, form: FormData): Promise<void> {
    const xsrf = decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '');

    const res = await fetch(url, { method: 'POST', headers: { Accept: 'application/json', 'X-XSRF-TOKEN': xsrf }, body: form });

    if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        const first = json.errors && (Object.values(json.errors)[0] as string[])[0];
        throw new Error(first ?? json.message ?? 'Upload failed');
    }
}
