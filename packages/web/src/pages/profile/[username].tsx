import React from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { UserX } from 'lucide-react';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProfileSkeleton } from '@/components/ui/Skeleton';
import { PostCard } from '@/components/post/PostCard';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { buttonClass, IconButton } from '@/components/ui/Button';
import { fadeUp } from '@/utils/motion';

const GET_USER = gql`
  query GetUser($username: String!) {
    user(username: $username) {
      id
      username
      displayName
      bio
      avatarUrl
      followerCount
      followingCount
      postCount
      isFollowing
      followsViewer
      createdAt
    }
    userPosts(username: $username, limit: 20) {
      edges {
        node {
          id
          content
          mediaUrls
          hashtags
          likeCount
          commentCount
          isLiked
          createdAt
          author { id username displayName avatarUrl }
        }
      }
    }
  }
`;

const FOLLOW_USER = gql`
  mutation FollowUser($userId: ID!) {
    followUser(userId: $userId) {
      id
      isFollowing
      followerCount
    }
  }
`;

const UNFOLLOW_USER = gql`
  mutation UnfollowUser($userId: ID!) {
    unfollowUser(userId: $userId) {
      id
      isFollowing
      followerCount
    }
  }
`;

export default function ProfilePage() {
  const router = useRouter();
  const { username } = router.query;
  const { user: currentUser } = useAuth();

  const { data, loading, error, refetch } = useQuery(GET_USER, {
    variables: { username },
    skip: !username,
    fetchPolicy: 'network-only',
  });

  const [followUser, { loading: followMutLoading }] = useMutation(FOLLOW_USER, {
    onCompleted: () => { toast.success('Following!'); refetch(); },
    onError: (err) => toast.error(err.message),
  });
  const [unfollowUser, { loading: unfollowMutLoading }] = useMutation(UNFOLLOW_USER, {
    onCompleted: () => { toast.success('Unfollowed'); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const followLoading = followMutLoading || unfollowMutLoading;

  const handleFollow = () => {
    if (!data?.user) return;
    if (data.user.isFollowing) {
      unfollowUser({ variables: { userId: data.user.id } });
    } else {
      followUser({ variables: { userId: data.user.id } });
    }
  };

  if (error && !loading) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <ErrorState
          title="Couldn't load this profile"
          message={error.message}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!username || loading || !data) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <ProfileSkeleton />
      </div>
    );
  }

  const profileUser = data?.user;
  const posts = data?.userPosts?.edges?.map((edge: any) => edge.node) || [];

  const handleBack = () => {
    if ((window.history.length ?? 0) > 1) router.back();
    else router.push('/home');
  };

  if (!profileUser) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <Card className="p-12 text-center">
          <UserX className="mx-auto mb-4 h-16 w-16 text-muted" />
          <h2 className="mb-2 text-xl font-bold text-ink">User not found</h2>
          <p className="text-muted">The user @{username} doesn&apos;t exist</p>
        </Card>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profileUser.id;
  const canViewConnections = isOwnProfile || (profileUser.isFollowing && Boolean(profileUser.followsViewer));

  const connectionStat = (count: number | undefined, label: string, href: string) => (
    canViewConnections ? (
      <Link href={href} className="group text-center" onClick={(e) => e.stopPropagation()}>
        <p className="font-bold tabular-nums text-ink group-hover:text-brand-600 dark:group-hover:text-brand-400">
          {count}
        </p>
        <p className="text-xs text-muted">{label}</p>
      </Link>
    ) : (
      <div className="text-center">
        <p className="font-bold tabular-nums text-ink/60">{count}</p>
        <p className="text-xs text-muted">{label}</p>
      </div>
    )
  );

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      {/* Mobile-only back button (desktop has the persistent sidebar) */}
      <div className="lg:hidden">
        <IconButton label="Go back" onClick={handleBack} aria-label="Go back">
          <Icons.Back className="h-5 w-5" />
        </IconButton>
      </div>

      {/* Profile Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <Card className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-col items-start gap-5 sm:flex-row sm:items-center">
              <Avatar
                name={profileUser.displayName}
                username={profileUser.username}
                src={profileUser.avatarUrl}
                size="xl"
                className="shadow-card"
              />
              <div className="min-w-0">
                <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
                  {profileUser.displayName}
                </h1>
                <p className="text-muted">@{profileUser.username}</p>
                {profileUser.bio && (
                  <p className="mt-2 text-sm leading-relaxed text-ink/80">{profileUser.bio}</p>
                )}

                  <div className="mt-4 flex gap-5">
                    <div className="text-center">
                      <p className="font-bold tabular-nums text-ink">{profileUser.postCount}</p>
                      <p className="text-xs text-muted">Posts</p>
                    </div>
                    {connectionStat(profileUser.followerCount, 'Followers', `/profile/${profileUser.username}/followers`)}
                    {connectionStat(profileUser.followingCount, 'Following', `/profile/${profileUser.username}/followers?tab=following`)}
                  </div>

                <p className="mt-3 text-xs text-muted">
                  Joined {formatDistanceToNow(new Date(profileUser.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex flex-shrink-0 items-center gap-2">
              {isOwnProfile ? (
                <Link href="/settings/profile" className={buttonClass('secondary', 'md')}>
                  <Icons.Settings className="h-4 w-4" />
                  <span>Edit Profile</span>
                </Link>
              ) : (
                <>
                  <motion.button
                    layout
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={profileUser.isFollowing ? buttonClass('secondary', 'md') : buttonClass('primary', 'md')}
                  >
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={followLoading ? 'loading' : (profileUser.isFollowing ? 'unfollow' : 'follow')}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center gap-2"
                      >
                        {followLoading ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            <span>Processing</span>
                          </>
                        ) : profileUser.isFollowing ? 'Unfollow' : 'Follow'}
                      </motion.span>
                    </AnimatePresence>
                  </motion.button>
                  <Link href={`/messages?user=${profileUser.username}`} className={buttonClass('secondary', 'md')}>
                    <Icons.Send className="h-4 w-4" />
                    <span>Message</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* User Posts */}
      <h2 className="px-1 font-display text-lg font-bold text-ink">Posts</h2>

      {posts.length === 0 ? (
        <EmptyState
          icon={<Icons.CreatePost className="h-8 w-8" />}
          title="No posts yet"
          description="When they post, it'll show up here"
        />
      ) : (
        <div className="[&>*:last-child>div]:border-b-0">
          {posts.map((post: any, index: number) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03 * index }}
            >
              <PostCard post={post} onDeleted={() => refetch()} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}