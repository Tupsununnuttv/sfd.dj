export type DesktopSupport = 'supported' | 'unsupported' | 'unknown';

interface Agent {
    userAgent: string;
    userAgentData?: {
        platform: string;
        getHighEntropyValues?: (hints: string[]) => Promise<{ platformVersion?: string }>;
    };
}

/** Windows 10 and 11 share the legacy UA; UA-CH platformVersion 13+ identifies Windows 11. */
export async function windows11DownloadSupport(agent: Agent, timeoutMs = 3000): Promise<DesktopSupport> {
    const hints = agent.userAgentData;
    if (hints?.platform && hints.platform !== 'Windows') return 'unsupported';
    if (!hints && !/Windows/i.test(agent.userAgent)) return agent.userAgent ? 'unsupported' : 'unknown';
    if (!hints?.getHighEntropyValues || hints.platform !== 'Windows') return 'unknown';
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        const values = await Promise.race([
            hints.getHighEntropyValues(['platformVersion']),
            new Promise<undefined>(resolve => { timer = setTimeout(() => resolve(undefined), timeoutMs); }),
        ]);
        const version = values?.platformVersion;
        if (!version || !/^\d+(?:\.\d+){0,2}$/.test(version)) return 'unknown';
        return Number(version.split('.')[0]) >= 13 ? 'supported' : 'unsupported';
    } catch { return 'unknown'; }
    finally { if (timer !== undefined) clearTimeout(timer); }
}
