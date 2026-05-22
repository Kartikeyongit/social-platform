import React from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const isAuthPage = ['/login', '/register'].includes(router.pathname);
  const { theme } = useTheme();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-0">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-3 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin"></div>
          <p className="text-slate-400 dark:text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !isAuthPage) {
    router.push('/login');
    return null;
  }

  if (!isAuthenticated && isAuthPage) {
    return (
      <>
        <AnimatePresence mode="wait">
          <motion.div
            key={router.pathname}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              borderRadius: '12px',
              padding: '10px 14px',
              fontSize: '13px',
              background: theme === 'dark' ? '#1e293b' : '#fff',
              color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
            },
          }}
        />
      </>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-dark-0">
      <div className="hidden lg:block fixed left-0 top-0 h-full z-30">
        <Sidebar />
      </div>

      <div className="lg:hidden fixed top-0 left-0 right-0 z-30">
        <MobileNav />
      </div>

      <main className="flex-1 lg:ml-72 overflow-y-auto scrollbar-hide pt-16 lg:pt-0 pb-20 lg:pb-0">
        <div className="p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={router.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '13px',
            background: theme === 'dark' ? '#1e293b' : '#fff',
            color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
          },
        }}
      />
    </div>
  );
};
