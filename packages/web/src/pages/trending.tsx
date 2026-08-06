import React from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { motion } from 'framer-motion';
import { Icons } from '@/components/icons';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import Link from 'next/link';

const TRENDING = gql`
  query Trending($limit: Int) {
    trendingHashtags(limit: $limit) {
      name
      postCount
    }
    suggestedUsers(limit: $limit) {
      id
      username
      displayName
      bio
      avatarUrl
      isFollowing
    }
  }
`;

const FOLLOW_USER = gql`
  mutation FollowUser($userId: ID!) { followUser(userId: $userId) { id isFollowing } }
`;

const UNFOLLOW_USER = gql`
  mutation UnfollowUser($userId: ID!) { unfollowUser(userId: $userId) { id isFollowing } }
`;

const USER_FOLLOW_FRAGMENT = gql`
  fragment UserFollow on User { id isFollowing }
`;

export default function TrendingPage() {
  const { data, loading, error, refetch } = useQuery(TRENDING, {
    variables: { limit: 30 },
    fetchPolicy: 'network-only',
  });

  const applyFollow = (cache: any, { data: d }: any) => {
    const u = d?.followUser || d?.unfollowUser;
    if (!u) return;
    cache.writeFragment({
      id: `User:${u.id}`,
      fragment: USER_FOLLOW_FRAGMENT,
      data: { id: u.id, isFollowing: u.isFollowing },
    });
  };

  const [followUser] = useMutation(FOLLOW_USER, { update: applyFollow });
  const [unfollowUser] = useMutation(UNFOLLOW_USER, { update: applyFollow });

  const hashtags = data?.trendingHashtags || [];
  const users = data?.suggestedUsers || [];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center shadow-glow">
            <Icons.Trending className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white font-display">Trending</h1>
        </div>
      </motion.div>

      {error && !loading && (
        <ErrorState
          title="Couldn't load trending topics"
          message={error.message}
          onRetry={() => refetch()}
        />
      )}

      {loading && (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-dark-50 rounded-3xl border border-slate-200/60 dark:border-dark-100 shadow-soft p-4 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-dark-100 rounded-full w-32 mb-2" />
              <div className="h-3 bg-slate-200 dark:bg-dark-100 rounded-full w-20" />
            </div>
          ))}
        </div>
      )}

      {!loading && !error && hashtags.length === 0 && (
        <EmptyState
          icon={<Icons.Trending className="w-8 h-8" />}
          title="No trending topics"
          description="Hashtags will appear here as posts are created"
        />
      )}

      {hashtags.length > 0 && (
        <div className="bg-white dark:bg-dark-50 rounded-3xl border border-slate-200/60 dark:border-dark-100 shadow-soft p-4">
          <div className="space-y-1">
            {hashtags.map((tag: any, index: number) => (
              <Link
                key={tag.name}
                href={`/explore?q=${encodeURIComponent(`#${tag.name}`)}`}
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-dark-50 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <span className={`w-8 text-center text-sm font-bold ${index < 3 ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`}>
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:underline">
                      <Icons.Hash className="w-3.5 h-3.5 inline-block mr-0.5" />{tag.name}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{tag.postCount} posts</p>
                  </div>
                </div>
                <Icons.More className="w-4 h-4 text-slate-400" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center space-x-2 pt-2">
        <Icons.ForYou className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        <span>Who to follow</span>
      </h2>

      {users.length > 0 && (
        <div className="bg-white dark:bg-dark-50 rounded-3xl border border-slate-200/60 dark:border-dark-100 shadow-soft p-3">
          <div className="space-y-0.5">
            {users.map((user: any) => (
              <div key={user.id} className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-dark-50 transition-colors">
                <Link href={`/profile/${user.username}`} className="flex items-center space-x-3 flex-1 min-w-0">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-slate-900 dark:text-white truncate">{user.displayName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">@{user.username}</p>
                  </div>
                </Link>
                <button
                  onClick={() => user.isFollowing
                    ? unfollowUser({ variables: { userId: user.id } })
                    : followUser({ variables: { userId: user.id } })}
                  className={`ml-2 flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                    user.isFollowing
                      ? 'bg-slate-100 dark:bg-dark-100 text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500'
                      : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100'
                  }`}
                >
                  {user.isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}