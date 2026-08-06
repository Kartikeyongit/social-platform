import React from 'react';
import { useMutation, gql } from '@apollo/client';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

const FOLLOW_USER = gql`
  mutation FollowUser($userId: ID!) {
    followUser(userId: $userId) { id isFollowing }
  }
`;

const UNFOLLOW_USER = gql`
  mutation UnfollowUser($userId: ID!) {
    unfollowUser(userId: $userId) { id isFollowing }
  }
`;

const USER_FOLLOW_FRAGMENT = gql`
  fragment UserFollow on User { id isFollowing }
`;

export interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  isFollowing,
  size = 'sm',
  className,
}) => {
  const applyFollow = (cache: any, { data }: any) => {
    const u = data?.followUser || data?.unfollowUser;
    if (!u) return;
    cache.writeFragment({
      id: `User:${u.id}`,
      fragment: USER_FOLLOW_FRAGMENT,
      data: { id: u.id, isFollowing: u.isFollowing },
    });
  };

  const [followUser, { loading: followLoading }] = useMutation(FOLLOW_USER, { update: applyFollow });
  const [unfollowUser, { loading: unfollowLoading }] = useMutation(UNFOLLOW_USER, {
    update: applyFollow,
  });

  const loading = followLoading || unfollowLoading;

  return (
    <Button
      type="button"
      size={size}
      variant={isFollowing ? 'secondary' : 'primary'}
      loading={loading}
      onClick={() =>
        isFollowing
          ? unfollowUser({ variables: { userId } })
          : followUser({ variables: { userId } })
      }
      className={cn(
        'flex-shrink-0',
        isFollowing &&
          'hover:border-red-300 hover:bg-red-50 hover:text-red-500 dark:hover:border-red-900/40 dark:hover:bg-red-900/20 dark:hover:text-red-400',
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isFollowing ? 'following' : 'follow'}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.12 }}
          className="inline-flex"
        >
          {isFollowing ? 'Following' : 'Follow'}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
};