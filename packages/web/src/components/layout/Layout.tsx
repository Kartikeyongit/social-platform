import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { AnimatePresence, motion } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const isAuthPage = ['/login', '/register'].includes(router.pathname);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

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
      </>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-dark-0">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-white dark:focus:bg-dark-50 focus:px-4 focus:py-2 focus:rounded-xl focus:text-sm focus:font-medium focus:text-slate-900 dark:focus:text-white focus:shadow-soft"
      >
        Skip to main content
      </a>

      <div className="hidden lg:block fixed left-0 top-0 h-full z-30 w-72">
        <Sidebar onOpenNotifications={() => setNotificationsOpen(true)} />
      </div>

      <div className="lg:hidden fixed top-0 left-0 right-0 z-30">
        <MobileNav />
      </div>

      <main id="main-content" className="flex-1 lg:ml-72 overflow-y-auto scrollbar-hide pt-16 lg:pt-3 pb-20 lg:pb-3">
        <div className="p-4 lg:pr-6 lg:pl-2 lg:py-0 lg:pt-0">
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

      <NotificationsPanel
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </div>
  );
}
