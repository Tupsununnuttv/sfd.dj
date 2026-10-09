import { InertiaLinkProps, Link } from '@inertiajs/react';

export default function NavLink({
    active = false,
    className = '',
    children,
    ...props
}: InertiaLinkProps & { active: boolean }) {
    return (
        <Link
            {...props}
            className={
                'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none ' +
                (active
                    ? 'border-violet-500 text-neutral-100 focus:border-violet-500'
                    : 'border-transparent text-neutral-400 hover:border-neutral-600 hover:text-white focus:border-neutral-600 focus:text-white') +
                className
            }
        >
            {children}
        </Link>
    );
}
