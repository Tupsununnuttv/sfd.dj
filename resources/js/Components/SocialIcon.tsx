import { brandPaths } from '@/lib/brandIcons';

export const socialLabels: Record<string, string> = {
    discord: 'Discord', instagram: 'Instagram', youtube: 'YouTube', x: 'X', tiktok: 'TikTok', twitch: 'Twitch', facebook: 'Facebook', reddit: 'Reddit',
};

export default function SocialIcon({ name, size = 16 }: { name: string; size?: number }) {
    if (name === 'reddit') return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><circle cx="20" cy="4" r="2"/><path d="m12 8 1-5 5 1"/><ellipse cx="12" cy="15" rx="9" ry="6"/><path d="M4 12a3 3 0 1 0-1 5m17-5a3 3 0 1 1 1 5"/><circle cx="8.5" cy="14" r="1" fill="currentColor"/><circle cx="15.5" cy="14" r="1" fill="currentColor"/><path d="M8 18q4 3 8 0"/></svg>;
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
            <path d={brandPaths[name]} />
        </svg>
    );
}
