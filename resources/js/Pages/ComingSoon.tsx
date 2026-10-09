import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';

export default function ComingSoon({ title }: { title: string }) {
    return (
        <AppLayout title={title}>
            <Head title={title} />
            <p className="text-neutral-500">{title} is coming soon.</p>
        </AppLayout>
    );
}
