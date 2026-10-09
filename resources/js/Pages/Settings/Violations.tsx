import { Card, EmptyState } from '@/Components/ui';
import SettingsLayout from '@/Layouts/SettingsLayout';
import { ago } from '@/lib/time';
import { Head, Link } from '@inertiajs/react';
import { ShieldAlert } from 'lucide-react';

export default function Violations({ violations }: { violations: { id: number; reason: string; created_at: string }[] }) {
    return (
        <SettingsLayout title="Violations" subtitle="Warnings that SFD.DJ staff have given you. Following the community rules keeps this list empty.">
            <Head title="Violations" />

            {violations.length === 0 ? (
                <EmptyState icon="✅" title="Your account is in good standing" text="No warnings. Thank you for keeping the rooms friendly." action={<Link href={route('site.legal', 'rules')} className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20">Read the community rules</Link>} />
            ) : (
                <>
                    <Card className="divide-y divide-white/5">
                        {violations.map((v) => (
                            <div key={v.id} className="flex items-start gap-3 p-4">
                                <ShieldAlert size={20} className="mt-0.5 shrink-0 text-amber-400" />
                                <div>
                                    <p className="text-sm font-semibold">{v.reason}</p>
                                    <p className="text-xs text-neutral-500">{new Date(v.created_at).toLocaleDateString()} · {ago(v.created_at)}</p>
                                </div>
                            </div>
                        ))}
                    </Card>
                    <p className="text-sm text-neutral-500">Think a warning was a mistake? <Link href={route('site.contact')} className="text-violet-400 hover:underline">Tell us</Link>.</p>
                </>
            )}
        </SettingsLayout>
    );
}
