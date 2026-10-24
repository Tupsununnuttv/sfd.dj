interface PollOptions {
    interval: number | (() => number);
    immediate?: boolean;
    background?: boolean;
    timeout?: number;
}

/** One request at a time, scheduled after completion, with backoff and lifecycle cleanup. */
export function poll(task: (signal: AbortSignal) => Promise<void>, options: PollOptions) {
    let timer = 0;
    let controller: AbortController | null = null;
    let stopped = false;
    let again = false;
    let failures = 0;
    const available = () => navigator.onLine !== false && (options.background || !document.hidden);
    const interval = () => typeof options.interval === 'function' ? options.interval() : options.interval;
    const schedule = (delay: number) => {
        window.clearTimeout(timer);
        if (!stopped && available()) timer = window.setTimeout(run, delay);
    };
    const run = async () => {
        if (stopped || !available()) return;
        if (controller) { again = true; return; }
        const request = new AbortController();
        controller = request;
        const timeout = window.setTimeout(() => request.abort(), options.timeout ?? 10000);
        try {
            await task(request.signal);
            failures = request.signal.aborted ? failures + 1 : 0;
        } catch { failures++; }
        finally {
            window.clearTimeout(timeout);
            controller = null;
            const delay = again ? 0 : Math.min(60000, interval() * 2 ** Math.min(failures, 4));
            again = false;
            schedule(delay);
        }
    };
    const refresh = () => {
        if (stopped) return;
        if (!available()) { window.clearTimeout(timer); return; }
        if (controller) again = true;
        else schedule(0);
    };
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('online', refresh);
    window.addEventListener('offline', refresh);
    schedule(options.immediate === false ? interval() : 0);
    return {
        refresh,
        stop() {
            stopped = true;
            window.clearTimeout(timer);
            controller?.abort();
            document.removeEventListener('visibilitychange', refresh);
            window.removeEventListener('online', refresh);
            window.removeEventListener('offline', refresh);
        },
    };
}
