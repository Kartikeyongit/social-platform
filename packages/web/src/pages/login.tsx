import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/icons';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      if (errors) toast.error(errors[0]?.message || 'Login failed');
      else if (data?.login) { login(data.login.token, data.login.user); toast.success('Welcome back!'); }
    } catch (error: any) {
      toast.error('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-app-bg">
      <div className="relative hidden w-1/2 items-center justify-center overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-violet-800 lg:flex">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_center,white_2px,transparent_2px)] [background-size:48px_48px]" />
        <div className="relative z-10 px-12 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -12 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[1.75rem] bg-white/15 shadow-2xl backdrop-blur-md"
          >
            <Icons.ForYou className="h-12 w-12 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 font-display text-5xl font-bold tracking-tight text-white"
          >
            Welcome to SocialApp
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white/80"
          >
            Connect, share, and discover amazing content
          </motion.p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 shadow-glow">
              <Icons.ForYou className="h-8 w-8 text-white" />
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
              Social<span className="text-brand-600">App</span>
            </h1>
          </div>

          <Card className="p-8">
            <h2 className="mb-2 font-display text-2xl font-bold tracking-tight text-ink">Sign in</h2>
            <p className="mb-8 text-muted">Enter your credentials to continue</p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-ink">Email</label>
                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-premium" placeholder="john@example.com" />
              </div>
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-ink">Password</label>
                <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-premium" placeholder="••••••••" />
              </div>
              <Button type="submit" loading={loading} size="lg" className="w-full">
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
            <p className="mt-6 text-center text-muted">
              Don't have an account?{' '}
              <Link href="/register" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                Sign up
              </Link>
            </p>
          </Card>

          <div className="mt-6 rounded-2xl border border-brand-500/25 bg-brand-50 p-4 dark:bg-brand-900/15">
            <p className="mb-2 text-xs font-semibold text-brand-700 dark:text-brand-400">Demo Credentials</p>
            <p className="mb-2 text-xs text-ink/70">Email: john@example.com / Password: password123</p>
            <button
              type="button"
              onClick={() => { setEmail('john@example.com'); setPassword('password123'); }}
              className="text-xs font-medium text-brand-600 underline-offset-2 hover:underline dark:text-brand-400"
            >
              Fill credentials
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}