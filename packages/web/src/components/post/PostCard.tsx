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
import { useAuth } from '@/contexts/AuthContext';

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
  <div className="absolute inset-0 pointer-events-none">
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
        animate={{ x: Math.cos(i * 60 * Math.PI / 180) * 18, y: Math.sin(i * 60 * Math.PI / 180) * 18, opacity: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full"
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
  onCommentClick?: () => void;
  onDeleted?: () => void;
  children?: React.ReactNode;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onCommentClick, onDeleted, children }) => {
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
    const url = `${window.location.origin}/post/${post.id}`;
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
    else router.push(`/post/${post.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-white dark:bg-dark-50 rounded-3xl border border-slate-200/60 dark:border-dark-100 shadow-soft hover:shadow-lg transition-all duration-300 p-5"
    >
      <Link
        href={`/post/${post.id}`}
        aria-label={`View post by ${post.author.displayName}`}
        className="absolute inset-0 z-10 rounded-3xl focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
      />

      <div className="relative z-20 mb-3 flex items-start justify-between">
        <Link href={`/profile/${post.author.username}`} onClick={e => e.stopPropagation()} className="flex items-center space-x-3 group">
          {post.author.avatarUrl ? (
            <img src={post.author.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
              {post.author.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white group-hover:underline">{post.author.displayName}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">@{post.author.username} · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</p>
          </div>
        </Link>
        {isAuthor && (
          <button
            onClick={handleDelete}
            disabled={deletePending}
            aria-label={confirmingDelete ? 'Confirm delete post' : 'Delete post'}
            className={`ml-3 flex-shrink-0 flex items-center space-x-1 rounded-full px-2 py-1 text-xs font-semibold transition-colors ${
              confirmingDelete
                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                : 'text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
            }`}
          >
            {deletePending ? (
              <span className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
            ) : confirmingDelete ? (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete?</span>
              </>
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      <p className="text-slate-800 dark:text-slate-200 mb-3 text-sm leading-relaxed">{post.content}</p>

      {post.mediaUrls?.length > 0 && (
        <div className="mb-3 rounded-2xl overflow-hidden">
          <img src={post.mediaUrls[0]} alt={`Image posted by ${post.author.displayName}`} className="w-full h-48 object-cover" />
        </div>
      )}

      {post.hashtags?.length > 0 && (
        <div className="relative z-20 flex flex-wrap gap-1.5 mb-3">
          {post.hashtags.map(tag => (
            <Hashtag key={tag} name={tag} />
          ))}
        </div>
      )}

      <div className="relative z-20 flex items-center pt-3 border-t border-slate-100 dark:border-dark-100">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={handleLike}
          aria-pressed={liked}
          aria-label={liked ? 'Unlike post' : 'Like post'}
          className={`relative flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition-colors group ${liked ? 'text-red-500' : 'text-slate-400 hover:text-red-400'}`}
        >
          {burst && <HeartBurst />}
          <Icons.Like className={`w-4 h-4 transition-all group-hover:scale-110 relative z-10 ${liked ? 'fill-red-500' : ''}`} />
          <span className="text-xs font-medium relative z-10">{likeCount}</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleComment}
          aria-label={onCommentClick ? 'Toggle comments' : 'View comments'}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition-colors group text-slate-400 hover:text-brand-500"
        >
          <Icons.Comment className="w-4 h-4 transition-all group-hover:scale-110" />
          <span className="text-xs font-medium">{post.commentCount}</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleShare}
          aria-label="Copy post link"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition-colors group ml-auto text-slate-400 hover:text-green-500"
        >
          <Icons.Share className="w-4 h-4 transition-all group-hover:scale-110" />
        </motion.button>
      </div>

      {children && <div className="relative z-20">{children}</div>}
    </motion.div>
  );
};