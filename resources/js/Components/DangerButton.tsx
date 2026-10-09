import { ButtonHTMLAttributes } from 'react';

export default function DangerButton({
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-transparent bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-neutral-950 ${disabled ? 'cursor-not-allowed opacity-40' : ''} ${className}`}
            disabled={disabled}
        >
            {children}
        </button>
    );
}
