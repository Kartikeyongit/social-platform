import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Icons } from '@/components/icons';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { spring } from '@/utils/motion';
import { NAV_GROUPS } from './nav';
import { useUnreadCount } from '@/hooks/useUnreadCount';

interface SidebarProps {
  onOpenNotifications?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenNotifications }) => {
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

  const renderItem = (item: (typeof NAV_GROUPS)[number]['items'][number]) => {
    const Icon = item.icon;
    const isActive = router.pathname === item.href;
    const isNotif = item.notifications && onOpenNotifications;

    const content = (
      <>
        <Icon
          className={cn(
            'h-5 w-5 flex-shrink-0 transition-colors',
            isActive
              ? 'text-brand-600 dark:text-brand-400'
              : 'text-muted group-hover:text-ink',
          )}
          strokeWidth={isActive ? 2.5 : 2}
        />
        <span
          className={cn(
            'flex-1 text-left text-sm transition-colors',
            isActive ? 'font-semibold text-ink' : 'font-medium text-muted group-hover:text-ink',
          )}
        >
          {item.label}
        </span>
        {isNotif && unreadCount > 0 && <Badge count={unreadCount} />}
        {isActive && (
          <motion.span
            layoutId="sidebar-pill"
            transition={spring}
            className="absolute -left-3 bottom-1.5 top-1.5 w-1 rounded-full bg-brand-600"
          />
        )}
      </>
    );

    const cls = cn(
      'group relative flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 transition-colors duration-200',
      isActive ? 'bg-brand-50/60 dark:bg-brand-900/20' : 'hover:bg-surface-2',
    );

    if (isNotif) {
      return (
        <button key={item.id} onClick={onOpenNotifications} className={cls}>
          {content}
        </button>
      );
    }

    return (
      <Link key={item.id} href={item.href} className={cls}>
        {content}
      </Link>
    );
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center gap-2.5 px-5 pb-2 pt-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 shadow-glow">
          <span className="text-lg font-bold text-white">S</span>
        </div>
        <h1 className="font-display text-xl font-extrabold tracking-tight text-ink">
          Social
          <span className="text-gradient">App</span>
        </h1>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-3 scrollbar-hide">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-3">
            <p className="px-4 pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-widest text-muted">
              {group.label}
            </p>
            <div className="space-y-0.5">{group.items.map(renderItem)}</div>
          </div>
        ))}

        <div className="px-3 pt-2">
          <Button className="w-full" icon={<Icons.CreatePost className="h-4 w-4" />} onClick={focusComposer}>
            Create Post
          </Button>
        </div>
      </nav>

      <div className="flex-shrink-0 border-t border-line p-3">
        <Link
          href={user ? `/profile/${user.username}` : '/profile'}
          className="flex items-center gap-2.5 rounded-2xl px-2 py-2 transition-colors hover:bg-surface-2"
        >
          <Avatar
            name={user?.displayName}
            username={user?.username}
            src={user?.avatarUrl}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">
              {user?.displayName || 'User'}
            </p>
            <p className="truncate text-xs text-muted">@{user?.username || 'username'}</p>
          </div>
        </Link>

        <div className="mt-1.5 flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="flex flex-1 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            {theme === 'dark' ? <Icons.LightMode className="h-4 w-4" /> : <Icons.DarkMode className="h-4 w-4" />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
          <button
            onClick={logout}
            className="flex flex-1 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          >
            <Icons.Logout className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};