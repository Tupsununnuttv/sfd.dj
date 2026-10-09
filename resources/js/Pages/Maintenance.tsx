import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head } from '@inertiajs/react';

export default function Maintenance() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
            <Head title="Maintenance" />
            <ApplicationLogo className="text-5xl" detail="full" />
            <h1 className="text-2xl font-bold">We'll be right back</h1>
            <p className="max-w-md text-neutral-400">SFD.DJ is down for maintenance. Please check again in a few minutes.</p>
        </div>
    );
}
