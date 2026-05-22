import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

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
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-600 via-brand-700 to-blue-800 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        <div className="relative z-10 text-center px-12">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }} className="w-24 h-24 bg-white/20 backdrop-blur rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <span className="text-5xl font-bold text-white">S</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-5xl font-bold text-white mb-4 font-display">Welcome to SocialApp</motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-xl text-white/80">Connect, share, and discover amazing content</motion.p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 dark:bg-dark-0">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow"><span className="text-3xl font-bold text-white">S</span></div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-display">Social<span className="text-brand-600">App</span></h1>
          </div>
          <div className="bg-white dark:bg-dark-50 rounded-3xl shadow-soft p-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 font-display">Sign in</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">Enter your credentials to continue</p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-premium" placeholder="john@example.com" /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Password</label><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-premium" placeholder="••••••••" /></div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="btn-primary-premium w-full py-3 text-base">
                {loading ? <span className="flex items-center space-x-2"><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span><span>Signing in...</span></span> : 'Sign in'}
              </motion.button>
            </form>
            <p className="text-center mt-6 text-slate-500 dark:text-slate-400">Don't have an account? <Link href="/register" className="text-brand-600 hover:text-brand-700 font-medium">Sign up</Link></p>
          </div>
          <div className="mt-6 p-4 bg-brand-50 dark:bg-brand-900/20 rounded-2xl border border-brand-200/50 dark:border-brand-800/50">
            <p className="text-xs font-semibold text-brand-700 dark:text-brand-400 mb-2">Demo Credentials</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Email: john@example.com</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Password: password123</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
