'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user) {
      const redirects = { tenant: '/', landlord: '/landlord/dashboard', moderator: '/moderator/dashboard' };
      router.replace(redirects[user.role]);
    }
  }, [isAuthenticated, user, router]);

  if (isAuthenticated && user) {
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await login({ email, password });
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Login failed');
      return;
    }

    if (result.redirectTo) {
      router.push(result.redirectTo);
    }
  };

  return (
    <div className="surface-panel rounded-2xl p-8 animate-fade-up">
      <div className="flex flex-col items-center mb-8">
        <Image
          src="/nestfind-mark.svg"
          alt="NestFind"
          width={48}
          height={48}
          className="mb-4"
        />
        <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
        <p className="text-sm text-muted-foreground mt-1">Sign in to your NestFind account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-primary hover:underline font-medium">
          Create one
        </Link>
      </div>

      <div className="mt-6 pt-6 border-t border-border">
        <p className="text-xs text-muted-foreground text-center mb-3">Demo accounts</p>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <button
            type="button"
            onClick={() => { setEmail('tenant@demo.com'); setPassword('password123'); }}
            className="px-2 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            Tenant
          </button>
          <button
            type="button"
            onClick={() => { setEmail('landlord@demo.com'); setPassword('password123'); }}
            className="px-2 py-1.5 rounded-md bg-accent/10 text-accent-foreground hover:bg-accent/20 transition-colors"
          >
            Landlord
          </button>
          <button
            type="button"
            onClick={() => { setEmail('moderator@demo.com'); setPassword('password123'); }}
            className="px-2 py-1.5 rounded-md bg-secondary/50 text-secondary-foreground hover:bg-secondary transition-colors"
          >
            Moderator
          </button>
        </div>
      </div>
    </div>
  );
}
