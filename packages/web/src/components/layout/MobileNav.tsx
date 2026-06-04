import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/components/icons';
import { useQuery, gql } from '@apollo/client';

const GET_UNREAD_COUNT = gql`
  query UnreadCount {
    unreadNotificationCount
  }
`;

const bottomMenuItems = [
  { icon: Icons.Home, label: 'Home', href: '/home' },
  { icon: Icons.Explore, label: 'Explore', href: '/explore' },
  { icon: Icons.CreatePost, label: 'Post', href: '/home', isCreate: true },
  { icon: Icons.Notifications, label: 'Alerts', href: '/notifications', hasBadge: true },
  { icon: Icons.ForYou, label: 'For You', href: '/recommendations' },
];

const sideMenuItems = [
  { icon: Icons.Home, label: 'Home', href: '/home' },
  { icon: Icons.Explore, label: 'Explore', href: '/explore' },
  { icon: Icons.Notifications, label: 'Notifications', href: '/notifications' },
  { icon: Icons.Messages, label: 'Messages', href: '/messages' },
  { icon: Icons.ForYou, label: 'For You', href: '/recommendations' },
];

export const MobileNav: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  
  const { data } = useQuery(GET_UNREAD_COUNT, { pollInterval: 10000 });
  const unreadCount = data?.unreadNotificationCount || 0;

  return (
    <>
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-dark-0 border-b border-slate-200/60 dark:border-dark-100 flex items-center justify-between px-5 z-50 lg:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-50 dark:hover:bg-dark-50 transition-colors"
          aria-label="Menu"
        >
          <Icons.More className="w-6 h-6 text-slate-700 dark:text-slate-300" />
        </button>

        <Link href="/home" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-blue-600 rounded-full flex items-center justify-center shadow-glow">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <h1 className="text-xl font-bold font-display text-slate-900 dark:text-white">
            Social<span className="text-brand-600">App</span>
          </h1>
        </Link>

        <Link href={user ? `/profile/${user.username}` : '/profile'}>
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-md">
              {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
        </Link>
      </div>

      {/* Slide-in Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-white dark:bg-dark-0 z-50 lg:hidden overflow-y-auto shadow-2xl border-r border-slate-200/60 dark:border-dark-100"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <Link href="/home" onClick={() => setIsOpen(false)} className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-blue-600 rounded-full flex items-center justify-center shadow-glow">
                      <span className="text-white font-bold text-xl">S</span>
                    </div>
                    <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
                      Social<span className="text-brand-600">App</span>
                    </h1>
                  </Link>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-50 dark:hover:bg-dark-50 transition-colors"
                    aria-label="Close menu"
                  >
                    <span className="text-xl text-slate-500 dark:text-slate-400">✕</span>
                  </button>
                </div>

                <nav className="space-y-0.5">
                  {sideMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = router.pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                          isActive
                            ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-50'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-brand-600 dark:text-brand-400' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                        <span className={`font-medium ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>

                <div className="mt-6 pt-6 border-t border-slate-200/60 dark:border-dark-100 space-y-2">
                  <button
                    onClick={() => { logout(); setIsOpen(false); }}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Icons.Logout className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-white dark:bg-dark-0 border-t border-slate-200/60 dark:border-dark-100 flex items-center justify-around px-2 z-40 lg:hidden">
        {bottomMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = router.pathname === item.href;

          if (item.isCreate) {
            return (
              <button
                key="create"
                onClick={() => {
                  router.push('/home');
                  setTimeout(() => {
                    const textarea = document.querySelector('textarea');
                    if (textarea) textarea.focus();
                  }, 100);
                }}
                className="relative -mt-8"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-brand-500 to-blue-600 rounded-full flex items-center justify-center shadow-glow hover:shadow-xl transition-all active:scale-90">
                  <Icon className="w-7 h-7 text-white" />
                </div>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center space-y-0.5 py-2 px-3 rounded-xl transition-colors ${
                isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {item.hasBadge && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="h-16 lg:hidden"></div>
    </>
  );
};
