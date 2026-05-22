import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { useRouter } from 'next/router';
import { Icons } from '@/components/icons';
import Link from 'next/link';

const TRENDING_SIDEBAR_DATA = gql`
  query TrendingSidebarData {
    trendingHashtags(limit: 5) {
      name
      postCount
    }
    suggestedUsers(limit: 3) {
      id
      username
      displayName
      bio
      avatarUrl
    }
  }
`;

export const TrendingSidebar: React.FC = () => {
  const router = useRouter();
  const { data } = useQuery(TRENDING_SIDEBAR_DATA);

  const hashtags = data?.trendingHashtags || [];
  const users = data?.suggestedUsers || [];

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="bg-white dark:bg-dark-50 rounded-2xl border border-slate-200/60 dark:border-dark-100 p-3">
        <div className="relative">
          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-dark-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Trending Hashtags */}
      <div className="bg-white dark:bg-dark-50 rounded-2xl border border-slate-200/60 dark:border-dark-100 p-4">
        <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-sm">Trending</h3>
        <div className="space-y-3">
          {hashtags.length === 0 && (
            <p className="text-xs text-slate-400 dark:text-slate-500">No trending topics</p>
          )}
          {hashtags.map((tag: any, index: number) => (
            <div key={tag.name} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-dark-50 rounded-lg p-2 -mx-1 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400">{index + 1} · Trending</p>
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">#{tag.name}</p>
                  <p className="text-[10px] text-slate-400">{tag.postCount} posts</p>
                </div>
                <Icons.More className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Who to follow */}
      <div className="bg-white dark:bg-dark-50 rounded-2xl border border-slate-200/60 dark:border-dark-100 p-4">
        <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-sm">Who to follow</h3>
        <div className="space-y-3">
          {users.length === 0 && (
            <p className="text-xs text-slate-400 dark:text-slate-500">No suggestions</p>
          )}
          {users.map((user: any) => (
            <div key={user.id} className="flex items-center justify-between">
              <Link href={`/profile/${user.username}`} className="flex items-center space-x-2 flex-1 min-w-0">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-sm text-slate-900 dark:text-white truncate">{user.displayName}</p>
                  <p className="text-[10px] text-slate-400 truncate">@{user.username}</p>
                </div>
              </Link>
              <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full px-3 py-1 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors">
                Follow
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Links */}
      <div className="px-2">
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-slate-400">
          <span>Terms</span>
          <span>Privacy</span>
          <span>Cookies</span>
          <span>About</span>
          <span>© 2024 SocialApp</span>
        </div>
      </div>
    </div>
  );
}
