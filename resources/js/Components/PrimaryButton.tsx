import { ButtonHTMLAttributes } from 'react';

export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-transparent bg-linear-to-r from-fuchsia-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/20 transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-neutral-950 active:scale-[0.99] ${disabled ? 'cursor-not-allowed opacity-40' : ''} ${className}`}
            disabled={disabled}
        >
            {children}
        </button>
    );
}
