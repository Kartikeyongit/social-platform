import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, gql } from '@apollo/client';
import { toast } from 'react-hot-toast';
import { Icons } from '@/components/icons';
import { ErrorState } from '@/components/ui/ErrorState';
import Link from 'next/link';

const GET_FOLLOW_DATA = gql`
  query GetFollowData($username: String!) {
    followers(username: $username) {
      id
      username
      displayName
      avatarUrl
      bio
    }
    following(username: $username) {
      id
      username
      displayName
      avatarUrl
      bio
    }
  }
`;

const UNFOLLOW_USER = gql`
  mutation UnfollowUser($userId: ID!) {
    unfollowUser(userId: $userId) { id }
  }
`;

const REMOVE_FOLLOWER = gql`
  mutation RemoveFollower($followerId: ID!) {
    removeFollower(followerId: $followerId) { id }
  }
`;

export default function FollowersPage() {
  const router = useRouter();
  const { username, tab } = router.query;
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers');

  useEffect(() => {
    setActiveTab(tab === 'following' ? 'following' : 'followers');
  }, [tab]);

  const switchTab = (next: 'followers' | 'following') => {
    setActiveTab(next);
    router.replace(`/profile/${username}/followers${next === 'following' ? '?tab=following' : ''}`, undefined, { shallow: true });
  };

  const { data, loading, error, refetch } = useQuery(GET_FOLLOW_DATA, {
    variables: { username },
    skip: !username,
  });

  const [unfollowUser] = useMutation(UNFOLLOW_USER, {
    onCompleted: () => { toast.success('Unfollowed'); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const [removeFollower] = useMutation(REMOVE_FOLLOWER, {
    onCompleted: () => { toast.success('Follower removed'); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const followers = data?.followers || [];
  const following = data?.following || [];
  const currentList = activeTab === 'followers' ? followers : following;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={() => router.back()} aria-label="Go back" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-dark-50">
          <Icons.Back className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">@{username}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Connections</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-dark-100" role="tablist" aria-label="Connections">
        {(['followers', 'following'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={activeTab === t}
            onClick={() => switchTab(t)}
            className={`flex-1 py-3 text-center font-medium text-sm transition-all border-b-2 ${
              activeTab === t
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t === 'followers' ? 'Followers' : 'Following'}
          </button>
        ))}
      </div>

      {/* List */}
      {error && !loading && (
        <ErrorState
          title="Couldn't load connections"
          message={error.message}
          onRetry={() => refetch()}
        />
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-dark-50 rounded-2xl p-4 animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-dark-100"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-dark-100 rounded-full w-24"></div>
                  <div className="h-3 bg-slate-200 dark:bg-dark-100 rounded-full w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : currentList.length === 0 ? (
        <div className="bg-white dark:bg-dark-50 rounded-2xl border border-slate-200/60 dark:border-dark-100 p-12 text-center">
          <Icons.Profile className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {activeTab === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {currentList.map((person: any) => (
            <div
              key={person.id}
              className="bg-white dark:bg-dark-50 rounded-2xl border border-slate-200/60 dark:border-dark-100 p-4 flex items-center justify-between hover:shadow-md transition-all"
            >
              <Link href={`/profile/${person.username}`} className="flex items-center space-x-3 flex-1 min-w-0">
                {person.avatarUrl ? (
                  <img src={person.avatarUrl} alt={`${person.displayName}'s avatar`} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                    {person.displayName.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white truncate">{person.displayName}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">@{person.username}</p>
                  {person.bio && <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1 truncate">{person.bio}</p>}
                </div>
              </Link>
              <button
                onClick={() => {
                  if (activeTab === 'followers') {
                    removeFollower({ variables: { followerId: person.id } });
                  } else {
                    unfollowUser({ variables: { userId: person.id } });
                  }
                }}
                className="btn-secondary-premium text-xs ml-3 flex-shrink-0"
              >
                {activeTab === 'followers' ? 'Remove' : 'Unfollow'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}