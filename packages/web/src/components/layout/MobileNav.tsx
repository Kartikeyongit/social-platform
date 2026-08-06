import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Icons } from '@/components/icons';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { spring } from '@/utils/motion';
import { NAV_GROUPS } from './nav';
import { useUnreadCount } from '@/hooks/useUnreadCount';

const bottomItems = [
  { id: 'home', label: 'Home', href: '/home', icon: Icons.Home },
  { id: 'explore', label: 'Explore', href: '/explore', icon: Icons.Explore },
  { id: 'create', label: 'Post', href: '/home', icon: Icons.CreatePost, isCreate: true },
  { id: 'notifications', label: 'Alerts', href: '/notifications', icon: Icons.Notifications, badge: true },
  { id: 'recommendations', label: 'For You', href: '/recommendations', icon: Icons.ForYou },
];

export const MobileNav: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const unreadCount = useUnreadCount();

  const focusComposer = () => {
    router.push('/home');
    setTimeout(() => {
      const textarea = document.querySelector('textarea');
      if (textarea) textarea.focus();
    }, 100);
  };

  return (
    <>
      {/* Top Bar */}
      <div className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-line bg-surface/80 px-4 backdrop-blur-xl lg:hidden">
        <IconButton label="Menu" onClick={() => setIsOpen(true)}>
          <Icons.More className="h-6 w-6" />
        </IconButton>

        <Link href="/home" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 shadow-glow">
            <span className="text-sm font-bold text-white">S</span>
          </div>
          <h1 className="font-display text-lg font-extrabold tracking-tight text-ink">
            Social<span className="text-gradient">App</span>
          </h1>
        </Link>

        <IconButton label="Toggle dark mode" onClick={toggleTheme}>
          {theme === 'dark' ? <Icons.LightMode className="h-5 w-5" /> : <Icons.DarkMode className="h-5 w-5" />}
        </IconButton>
      </div>

      {/* Slide-in Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={spring}
              className="fixed bottom-0 left-0 top-0 z-50 w-80 overflow-y-auto border-r border-line bg-surface shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between px-6 pb-4 pt-7">
                <Link href="/home" onClick={() => setIsOpen(false)} className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 shadow-glow">
                    <span className="text-xl font-bold text-white">S</span>
                  </div>
                  <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
                    Social<span className="text-gradient">App</span>
                  </h1>
                </Link>
                <IconButton label="Close menu" onClick={() => setIsOpen(false)}>
                  <Icons.Back className="h-5 w-5" />
                </IconButton>
              </div>

              <div className="px-6 pb-3">
                <Link
                  href={user ? `/profile/${user.username}` : '/profile'}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3"
                >
                  <Avatar
                    name={user?.displayName}
                    username={user?.username}
                    src={user?.avatarUrl}
                    size="md"
                    online
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {user?.displayName || 'User'}
                    </p>
                    <p className="truncate text-xs text-muted">@{user?.username || 'username'}</p>
                  </div>
                </Link>
              </div>

              <nav className="space-y-4 px-6 pb-6">
                {NAV_GROUPS.map((group) => (
                  <div key={group.label}>
                    <p className="pb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted">
                      {group.label}
                    </p>
                    <div className="space-y-0.5">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = router.pathname === item.href;
                        return (
                          <Link
                            key={item.id}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                              'flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors duration-200',
                              isActive
                                ? 'bg-brand-50/60 font-semibold text-ink dark:bg-brand-900/20'
                                : 'font-medium text-muted hover:bg-surface-2 hover:text-ink',
                            )}
                          >
                            <Icon
                              className={cn(
                                'h-5 w-5',
                                isActive ? 'text-brand-600 dark:text-brand-400' : '',
                              )}
                              strokeWidth={isActive ? 2.5 : 2}
                            />
                            <span className="flex-1">{item.label}</span>
                            {item.notifications && unreadCount > 0 && <Badge count={unreadCount} />}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="space-y-1 border-t border-line pt-4">
                  <button
                    onClick={toggleTheme}
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                  >
                    {theme === 'dark' ? <Icons.LightMode className="h-5 w-5" /> : <Icons.DarkMode className="h-5 w-5" />}
                    {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Icons.Logout className="h-5 w-5" />
                    Logout
                  </button>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-around px-2">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = router.pathname === item.href;

            if (item.isCreate) {
              return (
                <button
                  key="create"
                  onClick={focusComposer}
                  aria-label="Create post"
                  className="relative -mt-7"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-glow transition-all duration-200 hover:shadow-glow-lg active:scale-90">
                    <Icon className="h-6 w-6" />
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 rounded-2xl px-3 py-2',
                  isActive ? 'text-brand-600 dark:text-brand-400' : 'text-muted',
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="mobile-tab"
                    transition={spring}
                    className="absolute inset-0 rounded-2xl bg-brand-50 dark:bg-brand-900/25"
                  />
                )}
                <Icon className="relative z-10 h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
                <span className="relative z-10 text-[10px] font-medium">{item.label}</span>
                {item.badge && unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 z-20">
                    <Badge count={unreadCount} />
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="h-16 lg:hidden" />
      <div className="h-20 pb-[env(safe-area-inset-bottom)] lg:hidden" />
    </>
  );
};