import { isSoundCloud } from '@/lib/soundcloud';
import SoundCloudPlayer from '@/lib/soundcloudPlayer';

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
}

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

    constructor(host: HTMLElement, private events: RoomPlayerEvents, private target: () => number) {
        const fill = 'position:absolute;inset:0';
        this.youtubeBox.style.cssText = fill;
        this.soundcloudBox.style.cssText = `${fill};display:none`;
        host.append(this.youtubeBox, this.soundcloudBox);

        const mount = document.createElement('div');
        this.youtubeBox.appendChild(mount);

        const init = () => {
            if (this.dead) return;
            this.youtube = new window.YT.Player(mount, {
                width: '100%',
                height: '100%',
                playerVars: { autoplay: 1, controls: 1, fs: 1, disablekb: 0, rel: 0, playsinline: 1, origin: window.location.origin },
                events: {
                    onReady: () => {
                        if (this.dead) return;
                        const frame = this.youtube?.getIframe?.() as HTMLIFrameElement | undefined;
                        if (frame) { frame.allowFullscreen = true; frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; }
                        this.applyYouTubeAudio();
                        events.onReady();
                    },
                    onAutoplayBlocked: () => events.onAutoplayBlocked(),
                    onStateChange: (e: { data: number }) => {
                        if (this.dead || this.active !== 'youtube') return;
                        // Loading/buffering a different video can restore the provider's audio defaults.
                        this.applyYouTubeAudio();
                        events.onStateChange(e);
                    },
                },
            });
        };

        if (window.YT?.Player) {
            init();
        } else {
            window.onYouTubeIframeAPIReady = init;
            const script = document.createElement('script');
            script.src = 'https://www.youtube.com/iframe_api';
            document.head.appendChild(script);
        }
    }

    /** Play a song from `startSeconds` (YouTube starts there itself; SoundCloud goes to the room's place when its sound starts). */
    load(songId: string, startSeconds: number) {
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
    }

    private soundcloudPlayer(): SoundCloudPlayer {
        if (!this.soundcloud) {
            this.soundcloud = new SoundCloudPlayer(this.soundcloudBox, (state) => this.active === 'soundcloud' && this.events.onStateChange({ data: state }), this.target);
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
        return this.active === 'soundcloud' ? (this.soundcloud?.isMuted() ?? false) : this.youtube?.isMuted?.();
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
        this.youtube?.destroy?.();
        this.soundcloud?.destroy();
        this.youtubeBox.remove();
        this.soundcloudBox.remove();
    }
}
