import React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/ui/Avatar';

export interface CommentRowComment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  };
}

export interface CommentRowProps {
  comment: CommentRowComment;
}

export const CommentRow: React.FC<CommentRowProps> = ({ comment }) => {
  const profileHref = `/profile/${comment.author.username}`;

  return (
    <div className="flex items-start gap-3">
      <Avatar
        name={comment.author.displayName}
        username={comment.author.username}
        src={comment.author.avatarUrl}
        size="sm"
        href={profileHref}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-1.5">
          <Link href={profileHref} className="text-sm font-semibold text-ink hover:underline">
            {comment.author.displayName}
          </Link>
          <span className="text-xs text-muted">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </p>
        <p className="mt-0.5 text-sm leading-relaxed text-ink">{comment.content}</p>
      </div>
    </div>
  );
};