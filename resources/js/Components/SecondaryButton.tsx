import { ButtonHTMLAttributes } from 'react';

export default function SecondaryButton({
    type = 'button',
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            type={type}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-white/10 bg-white/10 px-5 py-2.5 text-sm font-semibold text-neutral-100 transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-neutral-950 ${disabled ? 'cursor-not-allowed opacity-40' : ''} ${className}`}
            disabled={disabled}
        >
            {children}
        </button>
    );
}
