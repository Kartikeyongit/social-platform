import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { motion } from 'framer-motion';
import { Icons } from '@/components/icons';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { PostCard } from '@/components/post/PostCard';
import { UserRow } from '@/components/ui/UserRow';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { PostSkeleton, ListSkeleton } from '@/components/ui/Skeleton';
import { staggerContainer, listItem } from '@/utils/motion';

const GET_RECOMMENDATIONS = gql`
  query GetRecommendations($limit: Int) {
    recommendedPosts(limit: $limit) {
      id
      content
      hashtags
      likeCount
      commentCount
      createdAt
      author {
        id
        username
        displayName
        avatarUrl
      }
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

export default function RecommendationsPage() {
  const { data, loading, error, refetch } = useQuery(GET_RECOMMENDATIONS, {
    variables: { limit: 10 },
  });

  const posts = data?.recommendedPosts || [];
  const users = data?.suggestedUsers || [];

  return (
    <div className="w-full max-w-5xl space-y-6">
      <PageHeader
        title="Recommendations"
        subtitle="Hand-picked posts and people for you"
        icon={<Icons.ForYou className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recommended Posts */}
        <div className="space-y-3 lg:col-span-2">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
            <Icons.Trending className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            Recommended posts
          </h2>

          {error && !loading && (
            <ErrorState
              title="Couldn't load recommendations"
              message={error.message}
              onRetry={() => refetch()}
            />
          )}

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <PostSkeleton key={i} />)}
            </div>
          ) : posts.length === 0 ? (
            <EmptyState
              icon={<Icons.ForYou className="h-8 w-8" />}
              title="No recommendations yet"
              description="Interact with more posts to get recommendations"
            />
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
              {posts.map((post: any) => (
                <motion.div key={post.id} variants={listItem}>
                  <PostCard
                    variant="card"
                    post={{ ...post, mediaUrls: post.mediaUrls || [], isLiked: false }}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Suggested Users */}
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
            <Icons.Profile className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            Suggested users
          </h2>

          {loading ? (
            <Card className="p-2">
              <ListSkeleton rows={5} />
            </Card>
          ) : (
            <Card className="p-2">
              {users.length === 0 ? (
                <EmptyState
                  icon={<Icons.Profile className="h-8 w-8" />}
                  title="No suggestions"
                  description="Follow more people to get better suggestions"
                />
              ) : (
                <div className="space-y-0.5">
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
                      showFollow
                    />
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}