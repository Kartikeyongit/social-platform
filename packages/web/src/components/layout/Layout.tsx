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
      <div className="flex min-h-screen items-center justify-center bg-app-bg">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
          <p className="text-sm text-muted">Loading...</p>
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
    <div className="flex h-screen flex-col bg-app-bg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ink focus:shadow-soft"
      >
        Skip to main content
      </a>

      <div className="fixed left-0 top-0 z-30 hidden h-full w-72 border-r border-line bg-surface lg:block">
        <Sidebar onOpenNotifications={() => setNotificationsOpen(true)} />
      </div>

      <div className="fixed inset-x-0 top-0 z-30 lg:hidden">
        <MobileNav />
      </div>

      <main
        id="main-content"
        className="flex-1 overflow-y-auto scrollbar-hide pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-16 lg:pb-3 lg:pt-0 lg:ml-72"
      >
        <div className="p-4 lg:pl-2 lg:pr-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={router.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
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
