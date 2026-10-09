import { Eye, EyeOff } from 'lucide-react';
import {
    forwardRef,
    InputHTMLAttributes,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';

export default forwardRef(function TextInput(
    {
        type = 'text',
        className = '',
        isFocused = false,
        ...props
    }: InputHTMLAttributes<HTMLInputElement> & { isFocused?: boolean },
    ref,
) {
    const localRef = useRef<HTMLInputElement>(null);
    const [shown, setShown] = useState(false);
    const isPassword = type === 'password';

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    const input = (
        <input
            {...props}
            type={isPassword && shown ? 'text' : type}
            className={
                'rounded-lg border-white/10 bg-white/5 text-neutral-100 placeholder-neutral-500 shadow-sm focus:border-violet-500 focus:ring-violet-500 ' +
                className +
                (isPassword ? ' pr-10' : '')
            }
            ref={localRef}
        />
    );

    if (!isPassword) return input;

    // password fields get a show/hide eye
    return (
        <div className="relative">
            {input}
            <button
                type="button"
                onClick={() => setShown(!shown)}
                title={shown ? 'Hide password' : 'Show password'}
                aria-label={shown ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            >
                {shown ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </div>
    );
});
