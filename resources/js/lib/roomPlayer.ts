import { isSoundCloud } from '@/lib/soundcloud';
import SoundCloudPlayer from '@/lib/soundcloudPlayer';
import { discordResourceUrl } from '@/lib/discordSdk';
import { discordProxy } from '@/lib/discordActivity';

declare global {
    interface Window {
        YT?: any;
        onYouTubeIframeAPIReady?: () => void;
    }
}

export interface RoomPlayerEvents {
    onReady: () => void; // YouTube's player is there
    onAutoplayBlocked: () => void;
    onStateChange: (e: { data: number }) => void; // YouTube's numbers: 0 ended, 1 playing, 2 paused, 3 buffering
    onError?: (problem: RoomPlayerProblem) => void;
}

export interface RoomPlayerProblem {
    provider: 'youtube' | 'soundcloud';
    kind: 'load' | 'timeout' | 'track';
    code?: number;
}

const READY_TIMEOUT_MS = 15000;

/**
 * The player of a room. A song is on YouTube or on SoundCloud (`youtube_id` starts with "sc:", see soundcloud.ts), and the room does not care which:
 * it makes the same calls it always made on YouTube's player, and this passes them to whichever one has the song. The other one is kept quiet and hidden.
 * `target()` is where the room is in the song now, in seconds.
 */
export default class RoomPlayer {
    private youtube: any = null;
    private soundcloud: SoundCloudPlayer | null = null;
    private active: 'youtube' | 'soundcloud' = 'youtube';
    private youtubeBox = document.createElement('div');
    private soundcloudBox = document.createElement('div');
    private volume = 100;
    private muted = false;
    private dead = false;
    private wantedSong: { songId: string; startSeconds: number } | null = null;
    private youtubeTimer = 0;
    private youtubeScript: HTMLScriptElement | null = null;
    private youtubeInit: (() => void) | null = null;
    private problems: Partial<Record<'youtube' | 'soundcloud', RoomPlayerProblem>> = {};

    private failed(problem: RoomPlayerProblem) {
        if (this.dead) return;
        this.problems[problem.provider] = problem;
        if (problem.provider === this.active) this.events.onError?.(problem);
    }

    constructor(host: HTMLElement, private events: RoomPlayerEvents, private target: () => number) {
        const fill = 'position:absolute;inset:0';
        this.youtubeBox.style.cssText = fill;
        this.soundcloudBox.style.cssText = `${fill};display:none`;
        host.append(this.youtubeBox, this.soundcloudBox);

        const mount = document.createElement('div');
        this.youtubeBox.appendChild(mount);

        const init = () => {
            if (this.dead) return;
            const playerVars = { autoplay: 1, controls: 1, fs: 1, disablekb: 0, rel: 0, playsinline: 1, origin: window.location.origin };
            let playerMount: HTMLElement = mount;
            if (discordProxy) {
                // YouTube uses `host` both to construct the frame URL and to
                // validate postMessage origins. A mapped path is not an origin:
                // preserve it in an existing iframe, with an origin-only host.
                const frame = document.createElement('iframe');
                const initialVideo = this.wantedSong && !isSoundCloud(this.wantedSong.songId) ? this.wantedSong.songId : '';
                // Start only through the latest wanted song after API readiness,
                // so an early pause/provider switch can cancel playback safely.
                const query = new URLSearchParams(Object.entries({ ...playerVars, autoplay: 0, enablejsapi: 1 }).map(([key, value]) => [key, String(value)]));
                frame.src = discordResourceUrl(`https://www.youtube.com/embed/${encodeURIComponent(initialVideo)}?${query}`);
                frame.title = 'YouTube';
                frame.allowFullscreen = true;
                frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
                frame.referrerPolicy = 'strict-origin-when-cross-origin';
                frame.style.cssText = 'width:100%;height:100%;border:0';
                mount.replaceWith(frame);
                playerMount = frame;
            }
            this.youtube = new window.YT.Player(playerMount, {
                ...(discordProxy ? { host: window.location.origin } : {}),
                width: '100%',
                height: '100%',
                playerVars,
                events: {
                    onReady: () => {
                        if (this.dead) return;
                        window.clearTimeout(this.youtubeTimer);
                        delete this.problems.youtube;
                        const frame = this.youtube?.getIframe?.() as HTMLIFrameElement | undefined;
                        if (frame) { frame.allowFullscreen = true; frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; }
                        if (discordProxy && (!this.wantedSong || this.active !== 'youtube')) {
                            // Pause/provider switch can precede the API methods.
                            // Keep the late frame stopped once the API is ready.
                            this.youtube?.stopVideo?.();
                        } else {
                            this.applyYouTubeAudio();
                            if (discordProxy && this.wantedSong) {
                                this.youtube?.loadVideoById?.({ videoId: this.wantedSong.songId, startSeconds: this.target() });
                            }
                        }
                        events.onReady();
                    },
                    onAutoplayBlocked: () => { if (!this.dead && this.active === 'youtube') events.onAutoplayBlocked(); },
                    onError: (e: { data: number }) => this.failed({ provider: 'youtube', kind: 'track', code: e.data }),
                    onStateChange: (e: { data: number }) => {
                        if (this.dead || this.active !== 'youtube') return;
                        if (e.data === 1) delete this.problems.youtube;
                        // Loading/buffering a different video can restore the provider's audio defaults.
                        this.applyYouTubeAudio();
                        events.onStateChange(e);
                    },
                },
            });
        };

        this.youtubeInit = init;
        this.youtubeTimer = window.setTimeout(() => this.failed({ provider: 'youtube', kind: 'timeout' }), READY_TIMEOUT_MS);

        if (window.YT?.Player) {
            init();
        } else {
            window.onYouTubeIframeAPIReady = init;
            const script = document.createElement('script');
            script.src = discordResourceUrl('https://www.youtube.com/iframe_api');
            script.onerror = () => {
                window.clearTimeout(this.youtubeTimer);
                this.failed({ provider: 'youtube', kind: 'load' });
            };
            this.youtubeScript = script;
            document.head.appendChild(script);
        }
        // SoundCloud must not wait for YouTube's independent iframe to initialize.
        if (discordProxy) queueMicrotask(() => { if (!this.dead) events.onReady(); });
    }

    /** Play a song from `startSeconds` (YouTube starts there itself; SoundCloud goes to the room's place when its sound starts). */
    load(songId: string, startSeconds: number) {
        this.wantedSong = { songId, startSeconds };
        if (isSoundCloud(songId)) {
            this.youtube?.stopVideo?.();
            this.show('soundcloud');
            this.soundcloudPlayer().load(songId);
        } else {
            this.soundcloud?.stop();
            this.show('youtube');
            this.applyYouTubeAudio();
            this.youtube?.loadVideoById?.({ videoId: songId, startSeconds });
            this.applyYouTubeAudio();
        }
    }

    private show(which: 'youtube' | 'soundcloud') {
        this.active = which;
        this.youtubeBox.style.display = which === 'youtube' ? '' : 'none';
        this.soundcloudBox.style.display = which === 'soundcloud' ? '' : 'none';
        if (this.problems[which]) this.events.onError?.(this.problems[which]);
    }

    private soundcloudPlayer(): SoundCloudPlayer {
        if (!this.soundcloud) {
            this.soundcloud = new SoundCloudPlayer(this.soundcloudBox, (state) => {
                if (state === 1) delete this.problems.soundcloud;
                if (this.active === 'soundcloud') this.events.onStateChange({ data: state });
            }, this.target, (kind) => this.failed({ provider: 'soundcloud', kind }), () => {
                if (!this.dead && this.active === 'soundcloud') this.events.onAutoplayBlocked();
            });
            this.soundcloud.setVolume(this.volume);
            this.muted && this.soundcloud.mute();
        }

        return this.soundcloud;
    }

    playVideo() {
        this.applyYouTubeAudio();
        this.active === 'soundcloud' ? this.soundcloud?.play() : this.youtube?.playVideo?.();
    }

    stopVideo() {
        this.wantedSong = null; // a late API-ready event must not restart playback after Pause
        this.youtube?.stopVideo?.();
        this.soundcloud?.stop();
    }

    mute() {
        this.muted = true;
        this.applyYouTubeAudio();
        this.soundcloud?.mute();
    }

    unMute() {
        this.muted = false;
        this.applyYouTubeAudio();
        this.soundcloud?.unMute();
    }

    isMuted() {
        return this.muted || this.volume === 0 || (this.active === 'soundcloud' ? (this.soundcloud?.isMuted() ?? false) : this.youtube?.isMuted?.());
    }

    setVolume(volume: number) {
        this.volume = volume;
        this.applyYouTubeAudio();
        this.soundcloud?.setVolume(volume);
    }

    private applyYouTubeAudio() {
        // Zero is an intentional mute, including after an autoplay recovery calls unMute().
        const quiet = this.muted || this.volume === 0;
        if (quiet) this.youtube?.mute?.();
        this.youtube?.setVolume?.(this.volume);
        if (!quiet) this.youtube?.unMute?.();
    }

    getPlayerState(): number | undefined {
        return this.active === 'soundcloud' ? this.soundcloud?.state : this.youtube?.getPlayerState?.();
    }

    getCurrentTime(): number | undefined {
        return this.active === 'soundcloud' ? this.soundcloud?.currentTime() : this.youtube?.getCurrentTime?.();
    }

    getDuration(): number | undefined {
        return this.active === 'soundcloud' ? this.soundcloud?.getDuration() : this.youtube?.getDuration?.();
    }

    seekTo(seconds: number, allowSeekAhead = true) {
        this.active === 'soundcloud' ? this.soundcloud?.seekTo(seconds) : this.youtube?.seekTo?.(seconds, allowSeekAhead);
    }

    /** Where this song can be opened on SoundCloud, at this second (null for a YouTube song, or before SoundCloud has said). */
    openUrl(seconds: number): string | null {
        return this.active === 'soundcloud' ? (this.soundcloud?.openUrl(seconds) ?? null) : null;
    }

    destroy() {
        this.dead = true;
        window.clearTimeout(this.youtubeTimer);
        this.youtubeScript?.remove();
        if (window.onYouTubeIframeAPIReady === this.youtubeInit) window.onYouTubeIframeAPIReady = undefined;
        this.youtube?.destroy?.();
        this.soundcloud?.destroy();
        this.youtubeBox.remove();
        this.soundcloudBox.remove();
    }
}
