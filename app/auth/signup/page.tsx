import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { SignupForm } from '@/components/auth/SignupForm';

export default function SignupPage() {
  return (
    <div className="flex min-h-full flex-col gap-6 px-4 pt-safe">
      <header className="pt-8">
        <h1 className="text-2xl font-semibold">Create Account</h1>
        <p className="mt-1 text-sm text-zinc-400">Join Songs for free</p>
      </header>
      <OAuthButtons />
      <SignupForm />
    </div>
  );
}
