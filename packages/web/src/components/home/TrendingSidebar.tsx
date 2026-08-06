import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useRouter } from 'next/router';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { UserRow } from '@/components/ui/UserRow';

const HOME_TRENDING = gql`
  query HomeTrending {
    homeHashtags: trendingHashtags(limit: 4) {
      name
      postCount
    }
    suggestedUsers(limit: 10) {
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

export const TrendingSidebar: React.FC = () => {
  const router = useRouter();
  const [q, setQ] = useState('');
  const { data } = useQuery(HOME_TRENDING, { fetchPolicy: 'network-only' });

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

  const hashtags = data?.homeHashtags || [];
  const users = data?.suggestedUsers || [];

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const v = q.trim();
    if (!v) return;
    router.push(`/explore?q=${encodeURIComponent(v)}`);
  };

  return (
    <div className="flex h-full flex-col gap-5 overflow-hidden rounded-row border border-line bg-surface p-4 shadow-card">
      <form onSubmit={submitSearch} className="relative flex-shrink-0">
        <Icons.Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search"
          className="input-premium w-full pl-10"
        />
      </form>

      <div className="flex-shrink-0">
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-ink">
          <Icons.Trending className="h-4 w-4 text-brand-600 dark:text-brand-400" />
          Trending
        </h3>
        <div className="-mx-2 space-y-0.5">
          {hashtags.length === 0 && <p className="px-2 text-xs text-muted">No trending topics</p>}
          {hashtags.map((tag: any, index: number) => (
            <Link
              key={tag.name}
              href={`/explore?q=${encodeURIComponent(`#${tag.name}`)}`}
              className="group flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-surface-2"
            >
              <span
                className={`w-5 flex-shrink-0 text-center text-sm font-bold tabular-nums ${
                  index < 3 ? 'text-brand-600 dark:text-brand-400' : 'text-muted'
                }`}
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink group-hover:underline">
                  #{tag.name}
                </p>
                <p className="text-xs text-muted">{tag.postCount} posts</p>
              </div>
              <Icons.More className="h-4 w-4 flex-shrink-0 text-muted" />
            </Link>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <h3 className="mb-2 flex flex-shrink-0 items-center gap-1.5 text-sm font-bold text-ink">
          <Icons.ForYou className="h-4 w-4 text-brand-600 dark:text-brand-400" />
          Who to follow
        </h3>
        <div className="-mx-2 max-h-[258px] flex-1 space-y-0.5 overflow-y-auto scrollbar-hide">
          {users.length === 0 && <p className="px-2 text-xs text-muted">No suggestions</p>}
          {users.map((user: any) => (
            <UserRow
              key={user.id}
              user={{
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
                bio: user.bio,
                isFollowing: user.isFollowing,
              }}
              size="sm"
              showFollow
            />
          ))}
        </div>
      </div>

      <div className="flex flex-shrink-0 flex-wrap gap-x-2 gap-y-1 border-t border-line pt-3 text-[10px] text-muted">
        <span>Terms</span>
        <span>Privacy</span>
        <span>Cookies</span>
        <span>About</span>
        <span>© 2024 SocialApp</span>
      </div>
    </div>
  );
};