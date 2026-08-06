import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { LoginSchema } from '@social/shared';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { TextField, PasswordField } from '@/components/auth/Field';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/icons';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const FEATURES = [
  {
    icon: <Icons.Zap className="h-4 w-4" />,
    title: 'Real-time feed',
    description: 'Posts, likes and comments appear instantly',
  },
  {
    icon: <Icons.Globe className="h-4 w-4" />,
    title: 'Trending topics',
    description: 'Discover what the community is talking about',
  },
  {
    icon: <Icons.ShieldCheck className="h-4 w-4" />,
    title: 'Private messaging',
    description: '1:1 conversations with read receipts',
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsed = LoginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Please check your details');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `mutation Login($email: String!, $password: String!) { login(email: $email, password: $password) { token user { id username displayName email avatarUrl } } }`,
          variables: { email, password },
        }),
      });
      const { data, errors } = await response.json();
      if (errors) {
        const message = errors[0]?.message || 'Login failed';
        setError(message);
        toast.error(message);
      } else if (data?.login) {
        login(data.login.token, data.login.user);
        toast.success('Welcome back!');
      }
    } catch (error: any) {
      toast.error('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue to SocialApp"
      heroTitle="Welcome back to SocialApp"
      heroSubtitle="Jump back into the conversation — your feed, messages and community are waiting."
      features={FEATURES}
      footer={
        <div className="rounded-2xl border border-brand-500/25 bg-brand-50 p-4 dark:bg-brand-900/15">
          <p className="mb-2 text-xs font-semibold text-brand-700 dark:text-brand-400">Demo credentials</p>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs text-ink/70">john@example.com / password123</p>
            <button
              type="button"
              onClick={() => {
                setEmail('john@example.com');
                setPassword('password123');
                setError('');
              }}
              className="rounded-full border border-brand-500/30 px-2.5 py-1 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-500/10 dark:text-brand-400"
            >
              Fill
            </button>
          </div>
        </div>
      }
    >
      <SocialAuthButtons />

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            <Icons.Alert className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <TextField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          required
          icon={<Icons.Mail className="h-4 w-4" />}
          placeholder="john@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordField
          id="password"
          label="Password"
          autoComplete="current-password"
          required
          icon={<Icons.Lock className="h-4 w-4" />}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" loading={loading} size="lg" className="w-full">
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-muted">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}