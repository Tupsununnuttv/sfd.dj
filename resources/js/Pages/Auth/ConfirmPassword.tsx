import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Field } from '@/Components/ui';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { KeyRound } from 'lucide-react';
import { FormEventHandler } from 'react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({ password: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.confirm'), { onFinish: () => reset('password') });
    };

    return (
        <GuestLayout title="Confirm your password" subtitle="This is a secure area. Please type your password to continue.">
            <Head title="Confirm Password" />

            <form onSubmit={submit} className="space-y-5">
                <Field label="Password" htmlFor="password" error={errors.password}>
                    <div className="relative">
                        <KeyRound size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                        <TextInput id="password" type="password" name="password" value={data.password} className="block w-full py-3 pl-10" isFocused onChange={(e) => setData('password', e.target.value)} />
                    </div>
                </Field>
                <PrimaryButton className="w-full py-3" disabled={processing || !data.password}>Confirm</PrimaryButton>
            </form>
        </GuestLayout>
    );
}
