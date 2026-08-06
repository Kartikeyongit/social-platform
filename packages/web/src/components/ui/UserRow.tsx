import React from 'react';
import Link from 'next/link';
import { cn } from '@/utils/cn';
import { Avatar } from '@/components/ui/Avatar';
import { FollowButton } from '@/components/ui/FollowButton';

export interface UserRowUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  isFollowing?: boolean;
}

export interface UserRowProps {
  user: UserRowUser;
  size?: 'sm' | 'md';
  showFollow?: boolean;
  action?: React.ReactNode;
  href?: string;
  className?: string;
}

const AVATAR_SIZE = { sm: 'sm', md: 'md' } as const;

export const UserRow: React.FC<UserRowProps> = ({
  user,
  size = 'md',
  showFollow = false,
  action,
  href = `/profile/${user.username}`,
  className,
}) => {
  const followEdge = showFollow && typeof user.isFollowing === 'boolean';

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl px-2.5 py-2.5 transition-colors duration-200 hover:bg-surface-2',
        className,
      )}
    >
      <Avatar
        name={user.displayName}
        username={user.username}
        src={user.avatarUrl}
        size={AVATAR_SIZE[size]}
        href={href}
        className="flex-shrink-0"
      />
      <Link href={href} className="min-w-0 flex-1 rounded">
        <span className="block truncate text-sm font-semibold text-ink hover:underline">
          {user.displayName}
        </span>
        <span className="block truncate text-xs text-muted">@{user.username}</span>
        {user.bio && size === 'md' && (
          <span className="mt-0.5 block truncate text-xs text-muted">{user.bio}</span>
        )}
      </Link>
      <div className="flex flex-shrink-0 items-center">
        {action ?? (followEdge && <FollowButton userId={user.id} isFollowing={user.isFollowing!} />)}
      </div>
    </div>
  );
};