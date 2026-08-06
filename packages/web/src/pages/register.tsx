import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/icons';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function RegisterPage() {
  const [formData, setFormData] = useState({ username: '', email: '', password: '', displayName: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const response = await fetch(`${API_URL}/graphql`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `mutation Register($username:String!,$email:String!,$password:String!,$displayName:String!){register(username:$username,email:$email,password:$password,displayName:$displayName){token user{id username displayName email}}}`, variables: formData }),
      });
      const { data, errors } = await response.json();
      if (errors) toast.error(errors[0]?.message || 'Registration failed');
      else if (data?.register) { login(data.register.token, data.register.user); toast.success('Account created!'); }
    } catch { toast.error('Failed to connect'); } finally { setLoading(false); }
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
            Join SocialApp
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white/80"
          >
            Create your account and start connecting
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
          <Card className="p-8">
            <h2 className="mb-2 font-display text-2xl font-bold tracking-tight text-ink">Create Account</h2>
            <p className="mb-8 text-muted">Fill in the details to get started</p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="username" className="mb-2 block text-sm font-medium text-ink">Username</label>
                  <input id="username" type="text" name="username" required value={formData.username} onChange={handleChange} className="input-premium" placeholder="johndoe" />
                </div>
                <div>
                  <label htmlFor="displayName" className="mb-2 block text-sm font-medium text-ink">Display Name</label>
                  <input id="displayName" type="text" name="displayName" required value={formData.displayName} onChange={handleChange} className="input-premium" placeholder="John Doe" />
                </div>
              </div>
              <div>
                <label htmlFor="register-email" className="mb-2 block text-sm font-medium text-ink">Email</label>
                <input id="register-email" type="email" name="email" required value={formData.email} onChange={handleChange} className="input-premium" placeholder="john@example.com" />
              </div>
              <div>
                <label htmlFor="register-password" className="mb-2 block text-sm font-medium text-ink">Password</label>
                <input id="register-password" type="password" name="password" required value={formData.password} onChange={handleChange} className="input-premium" placeholder="••••••••" minLength={8} />
                <p className="mt-1.5 text-xs text-muted">Must be at least 8 characters</p>
              </div>
              <Button type="submit" loading={loading} size="lg" className="w-full">
                {loading ? 'Creating...' : 'Create Account'}
              </Button>
            </form>
            <p className="mt-6 text-center text-muted">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                Sign in
              </Link>
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}