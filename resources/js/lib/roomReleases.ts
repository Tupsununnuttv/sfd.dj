export interface RoomFeatureRelease {
    key: string;
    title: string;
    description: string;
    enabled: boolean;
    early_days: number;
    preview_at: string | null;
    public_at: string | null;
    phase: 'paused' | 'scheduled' | 'early' | 'public';
}
export interface RoomReleaseState {
    early_access: boolean;
    early_days: number;
    features: string[];
    updates: RoomFeatureRelease[];
}
export const EMPTY_ROOM_RELEASES: RoomReleaseState = { early_access: false, early_days: 3, features: [], updates: [] };
