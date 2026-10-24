import SocialIcon from '@/Components/SocialIcon';
import { DISCORD_INVITE } from '@/lib/community';
import { ExternalLink } from 'lucide-react';

export default function DiscordInvite({ className = '' }: { className?: string }) {
    return <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center justify-center gap-2 rounded-lg border border-[#5865F2]/40 bg-[#5865F2]/15 px-4 py-2.5 text-sm font-semibold text-indigo-100 transition hover:bg-[#5865F2]/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 ${className}`}>
        <SocialIcon name="discord" size={19} /> Join our Discord <ExternalLink size={14} className="shrink-0 opacity-60" />
    </a>;
}
