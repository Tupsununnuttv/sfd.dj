import { brandPaths } from '@/lib/brandIcons';

export const socialLabels: Record<string, string> = {
    discord: 'Discord', instagram: 'Instagram', youtube: 'YouTube', x: 'X', tiktok: 'TikTok', twitch: 'Twitch', facebook: 'Facebook',
};

export default function SocialIcon({ name, size = 16 }: { name: string; size?: number }) {
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
            <path d={brandPaths[name]} />
        </svg>
    );
}
