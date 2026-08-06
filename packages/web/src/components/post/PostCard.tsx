import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMutation, gql } from '@apollo/client';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { Icons } from '@/components/icons';
import { Hashtag } from '@/components/ui/Hashtag';
import { Avatar } from '@/components/ui/Avatar';
import { MediaGrid } from '@/components/ui/MediaGrid';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/utils/cn';

const LIKE_POST = gql`
  mutation LikePost($postId: ID!) { likePost(postId: $postId) { id likeCount isLiked } }
`;

const UNLIKE_POST = gql`
  mutation UnlikePost($postId: ID!) { unlikePost(postId: $postId) { id likeCount isLiked } }
`;

const DELETE_POST = gql`
  mutation DeletePost($id: ID!) { deletePost(id: $id) }
`;

const HeartBurst = () => (
  <div className="pointer-events-none absolute inset-0">
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
        animate={{ x: Math.cos(i * 60 * Math.PI / 180) * 18, y: Math.sin(i * 60 * Math.PI / 180) * 18, opacity: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full"
        style={{ background: ['#ef4444', '#f97316', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'][i] }}
      />
    ))}
  </div>
);

interface PostCardProps {
  post: {
    id: string;
    content: string;
    mediaUrls: string[];
    hashtags: string[];
    likeCount: number;
    commentCount: number;
    isLiked: boolean;
    createdAt: string;
    author: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl?: string;
    };
  };
  variant?: 'list' | 'card';
  onCommentClick?: () => void;
  onDeleted?: () => void;
  children?: React.ReactNode;
}

export const PostCard: React.FC<PostCardProps> = ({ post, variant = 'list', onCommentClick, onDeleted, children }) => {
  const router = useRouter();
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [burst, setBurst] = useState(false);
  const [likePending, setLikePending] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [likePost] = useMutation(LIKE_POST);
  const [unlikePost] = useMutation(UNLIKE_POST);
  const [deletePost, { loading: deletePending }] = useMutation(DELETE_POST);

  const isAuthor = user?.id === post.author.id;
  const profileHref = `/profile/${post.author.username}`;
  const postHref = `/post/${post.id}`;

  useEffect(() => () => {
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
  }, []);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      confirmTimer.current = setTimeout(() => setConfirmingDelete(false), 3000);
      return;
    }
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    try {
      await deletePost({ variables: { id: post.id } });
      toast.success('Post deleted');
      onDeleted?.();
    } catch {
      toast.error('Failed to delete post');
    } finally {
      setConfirmingDelete(false);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (likePending) return;
    const next = !liked;
    setLiked(next);
    setLikeCount(c => (next ? c + 1 : Math.max(0, c - 1)));
    if (next) {
      setBurst(true);
      setTimeout(() => setBurst(false), 650);
    }
    setLikePending(true);
    try {
      const { data } = await (next ? likePost : unlikePost)({ variables: { postId: post.id } });
      const res = data?.likePost || data?.unlikePost;
      if (res) { setLiked(res.isLiked); setLikeCount(res.likeCount); }
    } catch {
      setLiked(!next);
      setLikeCount(c => (next ? Math.max(0, c - 1) : c + 1));
      toast.error('Failed to update like');
    } finally {
      setLikePending(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}${postHref}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCommentClick) onCommentClick();
    else router.push(postHref);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative',
        variant === 'list'
          ? 'border-b border-line px-1 py-5 [&:last-child]:border-b-0'
          : 'rounded-3xl border border-line bg-surface p-5 shadow-soft',
      )}
    >
      <Link
        href={postHref}
        aria-label={`View post by ${post.author.displayName}`}
        className="absolute inset-0 z-10 rounded-[inherit] focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
      />

      <div className="relative z-20 flex gap-3">
        <Avatar
          name={post.author.displayName}
          username={post.author.username}
          src={post.author.avatarUrl}
          size="md"
          href={profileHref}
          className="mt-0.5 flex-shrink-0"
        />

        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <Link
              href={profileHref}
              onClick={(e) => e.stopPropagation()}
              className="group flex min-w-0 items-baseline gap-x-1.5"
            >
              <span className="truncate text-sm font-semibold text-ink group-hover:underline">
                {post.author.displayName}
              </span>
              <span className="truncate text-xs text-muted">
                @{post.author.username} · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </span>
            </Link>

            {isAuthor && (
              <button
                onClick={handleDelete}
                disabled={deletePending}
                aria-label={confirmingDelete ? 'Confirm delete post' : 'Delete post'}
                className={cn(
                  'flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold transition-colors',
                  confirmingDelete
                    ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                    : 'text-muted/60 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20',
                )}
              >
                {deletePending ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                ) : confirmingDelete ? (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete?</span>
                  </>
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            )}
          </div>

          {/* Content */}
          <p className="mt-1 text-[15px] leading-relaxed text-ink">{post.content}</p>

          {post.mediaUrls?.length > 0 && (
            <div className="mt-3">
              <MediaGrid mediaUrls={post.mediaUrls} alt={`Image posted by ${post.author.displayName}`} />
            </div>
          )}

          {post.hashtags?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {post.hashtags.map(tag => (
                <Hashtag key={tag} name={tag} />
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex max-w-md items-center gap-6">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleLike}
              aria-pressed={liked}
              aria-label={liked ? 'Unlike post' : 'Like post'}
              className={cn(
                'group relative flex items-center gap-1.5 rounded-full py-1.5 transition-colors',
                liked ? 'text-red-500' : 'text-muted hover:text-red-500',
              )}
            >
              {burst && <HeartBurst />}
              <Icons.Like
                className={cn('relative z-10 h-5 w-5 transition-transform group-hover:scale-110', liked && 'fill-current text-red-500')}
              />
              <span className="relative z-10 text-sm font-medium tabular-nums">{likeCount}</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleComment}
              aria-label={onCommentClick ? 'Toggle comments' : 'View comments'}
              className="group flex items-center gap-1.5 rounded-full py-1.5 text-muted transition-colors hover:text-brand-500"
            >
              <Icons.Comment className="h-5 w-5 transition-transform group-hover:scale-110" />
              <span className="text-sm font-medium tabular-nums">{post.commentCount}</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleShare}
              aria-label="Copy post link"
              className="group ml-auto flex items-center gap-1.5 rounded-full py-1.5 text-muted transition-colors hover:text-green-500"
            >
              <Icons.Share className="h-5 w-5 transition-transform group-hover:scale-110" />
            </motion.button>
          </div>

          {children && <div className="relative z-20 mt-4">{children}</div>}
        </div>
      </div>
    </motion.div>
  );
};