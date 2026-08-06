import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { motion } from 'framer-motion';
import { Icons } from '@/components/icons';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { UserRow } from '@/components/ui/UserRow';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { staggerContainer, listItem } from '@/utils/motion';
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

export default function TrendingPage() {
  const { data, loading, error, refetch } = useQuery(TRENDING, {
    variables: { limit: 30 },
    fetchPolicy: 'network-only',
  });

  const hashtags = data?.trendingHashtags || [];
  const users = data?.suggestedUsers || [];

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title="Trending"
        subtitle="What's popular right now"
        icon={<Icons.Trending className="h-6 w-6" />}
      />

      {error && !loading && (
        <ErrorState
          title="Couldn't load trending topics"
          message={error.message}
          onRetry={() => refetch()}
        />
      )}

      {loading ? (
        <div className="space-y-4">
          <Card className="p-2">
            <ListSkeleton rows={6} />
          </Card>
          <Card className="p-2">
            <ListSkeleton rows={4} />
          </Card>
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
          <Card className="p-3">
            <h2 className="mb-2 flex items-center gap-2 px-1 text-base font-bold text-ink">
              <Icons.Hash className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              Trending hashtags
            </h2>
            {hashtags.length === 0 ? (
              <EmptyState
                icon={<Icons.Trending className="h-8 w-8" />}
                title="No trending topics"
                description="Hashtags will appear here as posts are created"
              />
            ) : (
              <div className="space-y-0.5">
                {hashtags.map((tag: any, index: number) => (
                  <motion.div key={tag.name} variants={listItem}>
                    <Link
                      href={`/explore?q=${encodeURIComponent(`#${tag.name}`)}`}
                      className="group flex items-center gap-3 rounded-2xl px-2.5 py-2.5 transition-colors hover:bg-surface-2"
                    >
                      <span
                        className={`w-7 flex-shrink-0 text-center text-base font-bold tabular-nums ${
                          index < 3 ? 'text-brand-600 dark:text-brand-400' : 'text-muted'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink group-hover:underline">
                          <Icons.Hash className="mr-0.5 inline-block h-3.5 w-3.5" />
                          {tag.name}
                        </p>
                        <p className="text-xs text-muted">{tag.postCount} posts</p>
                      </div>
                      <Icons.More className="h-4 w-4 flex-shrink-0 text-muted" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-3">
            <h2 className="mb-2 flex items-center gap-2 px-1 text-base font-bold text-ink">
              <Icons.ForYou className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              Who to follow
            </h2>
            {users.length === 0 ? (
              <EmptyState
                icon={<Icons.ForYou className="h-8 w-8" />}
                title="No suggestions"
                description="Follow more people to personalize suggestions"
              />
            ) : (
              <div className="space-y-0.5">
                {users.map((user: any) => (
                  <motion.div key={user.id} variants={listItem}>
                    <UserRow
                      user={{
                        id: user.id,
                        username: user.username,
                        displayName: user.displayName,
                        avatarUrl: user.avatarUrl,
                        bio: user.bio,
                        isFollowing: user.isFollowing,
                      }}
                      showFollow
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      )}
    </div>
  );
}