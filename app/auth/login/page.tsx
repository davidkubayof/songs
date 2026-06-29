import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col gap-6 px-4 pt-safe">
      <header className="pt-8">
        <h1 className="text-2xl font-semibold">Sign In</h1>
        <p className="mt-1 text-sm text-zinc-400">Welcome back to Songs</p>
      </header>
      <OAuthButtons />
      <LoginForm />
    </div>
  );
}
