import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

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
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-600 via-brand-700 to-blue-800 items-center justify-center relative overflow-hidden">
        <div className="relative z-10 text-center px-12">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }} className="w-24 h-24 bg-white/20 backdrop-blur rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl"><span className="text-5xl font-bold text-white">S</span></motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-5xl font-bold text-white mb-4 font-display">Join SocialApp</motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-xl text-white/80">Create your account and start connecting</motion.p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 dark:bg-dark-0">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md">
          <div className="bg-white dark:bg-dark-50 rounded-3xl shadow-soft p-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 font-display">Create Account</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">Fill in the details to get started</p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Username</label><input type="text" name="username" required value={formData.username} onChange={handleChange} className="input-premium" placeholder="johndoe" /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Display Name</label><input type="text" name="displayName" required value={formData.displayName} onChange={handleChange} className="input-premium" placeholder="John Doe" /></div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label><input type="email" name="email" required value={formData.email} onChange={handleChange} className="input-premium" placeholder="john@example.com" /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Password</label><input type="password" name="password" required value={formData.password} onChange={handleChange} className="input-premium" placeholder="••••••••" minLength={8} /><p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">Must be at least 8 characters</p></div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="btn-primary-premium w-full py-3 text-base">{loading ? <span className="flex items-center justify-center space-x-2"><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span><span>Creating...</span></span> : 'Create Account'}</motion.button>
            </form>
            <p className="text-center mt-6 text-slate-500 dark:text-slate-400">Already have an account? <Link href="/login" className="text-brand-600 hover:text-brand-700 font-medium">Sign in</Link></p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
