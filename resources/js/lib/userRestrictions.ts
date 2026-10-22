import { browserChannel } from '@/lib/browserChannel';
import { refreshCounts } from '@/lib/counts';
import { invalidateProfile } from '@/lib/profileCache';
import { sendJson } from '@/lib/post';
import { PageProps } from '@/types';
import { usePage } from '@inertiajs/react';
import { echo } from '@laravel/echo-react';
import { useEffect, useMemo, useSyncExternalStore } from 'react';

export interface UserRestrictionState { blocked: number[]; ignored: number[] }
const EMPTY: UserRestrictionState = { blocked: [], ignored: [] };
let snapshot = { userId: 0, state: EMPTY };
let source: UserRestrictionState | undefined;
let listeners = new Set<() => void>();
let users = 0;
let channel: ReturnType<typeof browserChannel<{ user_id: number; state: UserRestrictionState }>> | null = null;
let disconnect: (() => void) | null = null;
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const getSnapshot = () => snapshot;

function receive(userId: number, state: UserRestrictionState) {
    if (!state || !Array.isArray(state.blocked) || !Array.isArray(state.ignored) || ![...state.blocked, ...state.ignored].every(Number.isSafeInteger)) return;
    if (snapshot.userId === userId && JSON.stringify(snapshot.state) === JSON.stringify(state)) return;
    snapshot = { userId, state };
    listeners.forEach((listener) => listener());
    refreshCounts();
}

function publish(userId: number, state: UserRestrictionState) {
    receive(userId, state);
    channel?.postMessage({ user_id: userId, state });
}

/** The viewer's private filters, shared by room chat, Whispers, profiles and overlays. */
export function useUserRestrictions() {
    const { auth, userRestrictions = EMPTY } = usePage<PageProps>().props;
    const userId = auth.guest ? 0 : auth.user.id;
    const current = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    useEffect(() => {
        if (snapshot.userId !== userId || source !== userRestrictions) {
            source = userRestrictions;
            receive(userId, userRestrictions);
        }
    }, [userId, userRestrictions]);
    useEffect(() => {
        if (!userId) return;
        users++;
        if (users === 1) {
            channel = browserChannel(`user-restrictions-${userId}`, (event) => {
                if (event?.user_id === userId) receive(userId, event.state);
            });
            const privateChannel = echo<'reverb'>().private(`App.Models.User.${userId}`);
            const changed = (event: { user_id: number; state: UserRestrictionState }) => {
                if (event.user_id === userId) publish(userId, event.state);
            };
            privateChannel.listen('.user-restrictions-changed', changed);
            disconnect = () => { privateChannel.stopListening('.user-restrictions-changed', changed); channel?.close(); channel = null; };
        }
        return () => { if (--users === 0) { disconnect?.(); disconnect = null; } };
    }, [userId]);
    const state = current.userId === userId ? current.state : userRestrictions;
    const hiddenAuthors = useMemo(() => new Set([...state.blocked, ...state.ignored]), [state]);
    return { ...state, hiddenAuthors, state };
}

export async function setUserRestriction(viewer: number, target: number, change: Partial<{ blocked: boolean; ignored: boolean }>) {
    const result = await sendJson<{ state: UserRestrictionState }>('PUT', route('api.user-restrictions.update', target), change);
    if (snapshot.userId !== viewer) return;
    publish(viewer, result.state);
    invalidateProfile(target);
}
