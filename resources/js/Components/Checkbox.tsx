import { InputHTMLAttributes } from 'react';

export default function Checkbox({
    className = '',
    ...props
}: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'rounded border-white/20 bg-white/5 text-violet-500 shadow-sm focus:ring-violet-500 focus:ring-offset-neutral-950 ' +
                className
            }
        />
    );
}
