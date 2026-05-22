import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Icons } from '@/components/icons';
import { useQuery, gql } from '@apollo/client';

const GET_UNREAD_COUNT = gql`
  query UnreadCount {
    unreadNotificationCount
  }
`;

const menuItems = [
  { icon: Icons.Home, label: 'Home', href: '/home' },
  { icon: Icons.Explore, label: 'Explore', href: '/explore' },
  { icon: Icons.Notifications, label: 'Notifications', href: '/notifications' },
  { icon: Icons.Messages, label: 'Messages', href: '/messages' },
  { icon: Icons.ForYou, label: 'For You', href: '/recommendations' },
];

export const Sidebar: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const { data } = useQuery(GET_UNREAD_COUNT, { pollInterval: 10000 });
  const unreadCount = data?.unreadNotificationCount || 0;

  return (
    <aside className="w-72 h-full bg-white dark:bg-dark-0 border-r border-slate-200/60 dark:border-dark-100 flex flex-col">
      {/* Logo */}
      <div className="p-6 pb-4 flex-shrink-0">
        <Link href="/home" className="inline-block">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-blue-600 rounded-full flex items-center justify-center shadow-glow">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
              Social<span className="text-brand-600">App</span>
            </h1>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = router.pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-50 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon 
                className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-brand-600 dark:text-brand-400' : ''
                }`} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`font-medium ${isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
              
              {item.label === 'Notifications' && unreadCount > 0 && (
                <span className="ml-auto min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          );
        })}

        <div className="px-3 pt-4">
          <button
            onClick={() => {
              router.push('/home');
              setTimeout(() => {
                const textarea = document.querySelector('textarea');
                if (textarea) textarea.focus();
              }, 100);
            }}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-semibold transition-all duration-200 hover:shadow-glow active:scale-95 shadow-md"
          >
            <Icons.CreatePost className="w-5 h-5" />
            <span>Create Post</span>
          </button>
        </div>
      </nav>

      {/* Bottom */}
      <div className="flex-shrink-0 p-3 border-t border-slate-200/60 dark:border-dark-100 space-y-1">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-2xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-50 transition-all duration-200"
        >
          {theme === 'dark' ? <Icons.LightMode className="w-5 h-5" /> : <Icons.DarkMode className="w-5 h-5" />}
          <span className="text-sm font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <Link
          href={user ? `/profile/${user.username}` : '/profile'}
          className="flex items-center space-x-3 p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-dark-50 transition-all duration-200"
        >
          <div className="relative flex-shrink-0">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-md">
                {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-dark-0"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {user?.displayName || 'User'}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              @{user?.username || 'username'}
            </p>
          </div>
        </Link>

        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
        >
          <Icons.Logout className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};
