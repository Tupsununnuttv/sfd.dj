import { soundcloudApiUrl, soundcloudEmbedUrl, WIDGET_OPTIONS } from '@/lib/soundcloud';

declare global {
    interface Window {
        SC?: any;
    }
}

/** YouTube's state numbers. The room speaks them, so this player does too. */
export const UNSTARTED = -1;
export const ENDED = 0;
export const PLAYING = 1;
export const PAUSED = 2;
export const BUFFERING = 3;

/** If a track has not started this long after it was loaded, the browser is keeping the sound back until a click: say "paused", as a YouTube player does. */
const BLOCKED_AFTER_MS = 6000;
/** Further than this from where the room is (seconds), and the track jumps there. */
const DRIFT_SECONDS = 3;

let widgetApi: Promise<any> | null = null;
const loadWidgetApi = (): Promise<any> => (widgetApi ??= new Promise((resolve, reject) => {
    if (window.SC?.Widget) return resolve(window.SC);
    const script = document.createElement('script');
    script.src = 'https://w.soundcloud.com/player/api.js';
    script.onload = () => (window.SC?.Widget ? resolve(window.SC) : reject(new Error('The SoundCloud player did not start.')));
    script.onerror = () => reject(new Error('The SoundCloud player could not be loaded.'));
    document.head.appendChild(script);
})).catch((error) => {
    widgetApi = null; // the next track tries again
    throw error;
});

/**
 * SoundCloud's own player for the room, behind the same few calls the room makes on YouTube's (`load`, `play`, `stop`, `mute`, `setVolume`,
 * `seekTo`, the position, the length, the state). It lives in `mount` and one widget plays every track: a new one is loaded into it.
 * `target()` is where the room is in the song, in seconds: a track that starts late (somebody joined halfway, or a click let the sound in) goes there.
 */
export default class SoundCloudPlayer {
    state = UNSTARTED;
    private widget: any = null;
    private frame: HTMLIFrameElement | null = null;
    private starting = false; // the widget script is loading, the frame is not made yet
    private wanted = ''; // the newest track asked for
    private position = 0; // seconds, as of the last progress report
    private positionAt = 0; // and when that was (ms)
    private duration = 0;
    private volume = 100;
    private muted = false;
    private permalink: string | null = null;
    private blocked = 0; // timer: see BLOCKED_AFTER_MS
    private lastSeek = 0;
    private loads = 0; // counts the loads: a late answer about an older track is dropped
    private askedAt = 0; // when the widget was last asked for the length (ms)
    private dead = false;

    constructor(private mount: HTMLElement, private onState: (state: number) => void, private target: () => number) {}

    load(id: string) {
        this.wanted = id;
        this.loads++;
        this.position = 0;
        this.positionAt = Date.now();
        this.duration = 0;
        this.askedAt = 0;
        this.permalink = null;
        this.state = BUFFERING;
        this.armBlocked();

        if (this.widget) {
            const load = this.loads;
            this.widget.load(soundcloudApiUrl(id), { ...WIDGET_OPTIONS, auto_play: true, callback: () => this.loaded(load) });
        } else if (!this.starting) {
            this.boot();
        }
        // else: the widget is still starting up, and it makes its frame for the newest track
    }

    /** The widget script first, then the frame: the frame has to hear about the script, not the other way round. */
    private boot() {
        this.starting = true;
        loadWidgetApi().then((SC) => {
            if (this.dead) return;
            const frame = document.createElement('iframe');
            frame.allow = 'autoplay'; // without it a browser never lets a frame from another site start the sound
            frame.title = 'SoundCloud';
            frame.style.cssText = 'width:100%;height:100%;border:0';
            frame.src = soundcloudEmbedUrl(this.wanted, true);
            this.mount.appendChild(frame);
            this.frame = frame;

            const widget = (this.widget = SC.Widget(frame));
            const E = SC.Widget.Events;
            widget.bind(E.READY, () => this.loaded(this.loads));
            widget.bind(E.PLAY, (e: any) => this.mine(e) && this.played(e));
            widget.bind(E.PAUSE, (e: any) => this.mine(e) && this.state === PLAYING && this.set(PAUSED));
            widget.bind(E.FINISH, (e: any) => this.mine(e) && this.set(ENDED));
            widget.bind(E.PLAY_PROGRESS, (e: any) => {
                if (this.state !== PLAYING) return; // the track before keeps reporting for a moment after a new one is loaded
                this.position = (e?.currentPosition ?? 0) / 1000;
                this.positionAt = Date.now();
                if (!this.duration) this.askDuration();
            });
        }).catch(() => {
            this.starting = false;
            this.set(PAUSED);
        });
    }

    /** Is this event about the track we asked for? (Loading a new track makes the old one report once more, from where it was.) */
    private mine(event: any) {
        return !event?.soundId || String(event.soundId) === this.wanted.slice(3);
    }

    /** The widget has the track (the volume it had may be gone with the old one). */
    private loaded(load: number) {
        if (this.dead || load !== this.loads || !this.widget) return;
        this.applyVolume();
    }

    /** What the widget knows once the track plays: its length, and where it lives on SoundCloud. */
    private askDuration() {
        if (Date.now() - this.askedAt < 1000) return;
        this.askedAt = Date.now();
        const load = this.loads;
        this.widget?.getDuration((ms: number) => load === this.loads && ms > 0 && (this.duration = ms / 1000));
    }

    private played(event: any) {
        window.clearTimeout(this.blocked);
        this.set(PLAYING);
        this.applyVolume();
        this.askDuration();
        const load = this.loads;
        this.widget?.getCurrentSound((sound: any) => load === this.loads && (this.permalink = sound?.permalink_url ?? null));

        // somebody joined halfway, or a click has just let the sound in: go to where the room is
        const want = this.target();
        const have = (event?.currentPosition ?? this.position * 1000) / 1000;
        if (Math.abs(want - have) > DRIFT_SECONDS && Date.now() - this.lastSeek > 1500 && (!this.duration || want < this.duration)) this.seekTo(want);
    }

    private armBlocked() {
        window.clearTimeout(this.blocked);
        this.blocked = window.setTimeout(() => this.state === BUFFERING && this.set(PAUSED), BLOCKED_AFTER_MS);
    }

    private set(state: number) {
        if (this.dead || this.state === state) return;
        this.state = state;
        this.onState(state);
    }

    play() {
        if (this.state !== PLAYING) {
            this.state = BUFFERING;
            this.armBlocked();
        }
        this.widget?.play();
    }

    /** Quiet and still, without telling anybody (nobody has paused it: the room switched the music off, or YouTube has the next song). */
    stop() {
        window.clearTimeout(this.blocked);
        this.state = UNSTARTED;
        this.widget?.pause();
    }

    mute() {
        this.muted = true;
        this.applyVolume();
    }

    unMute() {
        this.muted = false;
        this.applyVolume();
    }

    isMuted() {
        return this.muted;
    }

    setVolume(volume: number) {
        this.volume = volume;
        this.applyVolume();
    }

    private applyVolume() {
        this.widget?.setVolume(this.muted ? 0 : this.volume);
    }

    seekTo(seconds: number) {
        this.lastSeek = Date.now();
        this.position = seconds;
        this.positionAt = Date.now();
        this.widget?.seekTo(seconds * 1000);
    }

    currentTime() {
        return this.state === PLAYING ? this.position + (Date.now() - this.positionAt) / 1000 : this.position;
    }

    getDuration() {
        return this.duration;
    }

    /** The track on SoundCloud, at this second (the address is only known once the widget has told it). */
    openUrl(seconds: number): string | null {
        return this.permalink ? `${this.permalink}#t=${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}` : null;
    }

    destroy() {
        this.dead = true;
        window.clearTimeout(this.blocked);
        this.frame?.remove();
        this.frame = null;
        this.widget = null;
    }
}
