import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-full flex-col gap-6 px-4 pt-safe">
      <header className="pt-8">
        <h1 className="text-2xl font-semibold">Reset Password</h1>
        <p className="mt-1 text-sm text-zinc-400">
          We will email you a secure reset link
        </p>
      </header>
      <ForgotPasswordForm />
    </div>
  );
}
