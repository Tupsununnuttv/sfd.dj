import { InertiaLinkProps, Link } from '@inertiajs/react';

export default function ResponsiveNavLink({
    active = false,
    className = '',
    children,
    ...props
}: InertiaLinkProps & { active?: boolean }) {
    return (
        <Link
            {...props}
            className={`flex w-full items-start border-l-4 py-2 pe-4 ps-3 ${
                active
                    ? 'border-violet-500 bg-violet-950 text-violet-400 focus:border-violet-500 focus:bg-violet-900 focus:text-violet-300'
                    : 'border-transparent text-neutral-400 hover:border-neutral-600 hover:bg-neutral-800 hover:text-white focus:border-neutral-600 focus:bg-neutral-800 focus:text-white'
            } text-base font-medium transition duration-150 ease-in-out focus:outline-none ${className}`}
        >
            {children}
        </Link>
    );
}
