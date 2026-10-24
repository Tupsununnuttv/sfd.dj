import type { Cosmetics } from '@/lib/cosmetics';
import { perk, subscriptionVars, useSubscriptionStyle } from '@/lib/subscriptionStyle';
import type { ReactNode } from 'react';

export default function SubscriberName({ cosmetics, children }: { cosmetics?: Cosmetics | null; children: ReactNode }) {
    const style = useSubscriptionStyle(cosmetics);
    return <span translate="no" className="sub-name" data-animated={style?.animated_name || undefined} data-glow={style?.name_glow || undefined} data-gradient={perk(style, 'gradient') || undefined} style={subscriptionVars(style)}>{children}</span>;
}
