import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { loginWithToken } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current || !router.isReady) return;
    handled.current = true;

    const { token, error } = router.query;

    if (error) {
      toast.error(String(error).replace(/_/g, ' '));
      router.replace('/login');
      return;
    }

    if (token) {
      loginWithToken(String(token)).catch(() => {
        toast.error('Sign-in failed');
        router.replace('/login');
      });
      return;
    }

    toast.error('Missing credentials');
    router.replace('/login');
  }, [router.isReady, router.query, loginWithToken, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-app-bg">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      <p className="text-sm text-muted">Completing sign-in...</p>
    </div>
  );
}