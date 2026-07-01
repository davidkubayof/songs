import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-full flex-col gap-6 px-4 pt-safe">
      <header className="pt-8">
        <h1 className="text-2xl font-semibold">Set New Password</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Choose a new password for your account
        </p>
      </header>
      <ResetPasswordForm />
    </div>
  );
}
