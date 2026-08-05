import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useMutation, gql } from '@apollo/client';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Icons } from '@/components/icons';

const LIKE_POST = gql`
  mutation LikePost($postId: ID!) {
    likePost(postId: $postId) { id likeCount isLiked }
  }
`;

const UNLIKE_POST = gql`
  mutation UnlikePost($postId: ID!) {
    unlikePost(postId: $postId) { id likeCount isLiked }
  }
`;

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
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const router = useRouter();
  const [liked, setLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [likePost] = useMutation(LIKE_POST);
  const [unlikePost] = useMutation(UNLIKE_POST);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (liked) {
        const { data } = await unlikePost({ variables: { postId: post.id } });
        if (data?.unlikePost) { setLiked(data.unlikePost.isLiked); setLikeCount(data.unlikePost.likeCount); }
      } else {
        const { data } = await likePost({ variables: { postId: post.id } });
        if (data?.likePost) { setLiked(data.likePost.isLiked); setLikeCount(data.likePost.likeCount); }
      }
    } catch {
      toast.error('Failed to update like');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => router.push(`/post/${post.id}`)}
      className="bg-white dark:bg-dark-50 rounded-3xl border border-slate-200/60 dark:border-dark-100 shadow-soft hover:shadow-lg transition-all duration-300 p-5 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <Link href={`/profile/${post.author.username}`} onClick={e => e.stopPropagation()} className="flex items-center space-x-3 group">
          {post.author.avatarUrl ? (
            <img src={post.author.avatarUrl} className="w-10 h-10 rounded-full object-cover flex-shrink-0" alt="" />
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
      </div>
      <p className="text-slate-800 dark:text-slate-200 mb-3 text-sm leading-relaxed">{post.content}</p>
      {post.mediaUrls?.length > 0 && (
        <div className="mb-3 rounded-2xl overflow-hidden">
          <img src={post.mediaUrls[0]} className="w-full h-48 object-cover" alt="" />
        </div>
      )}
      {post.hashtags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {post.hashtags.map(tag => (
            <span key={tag} onClick={e => e.stopPropagation()} className="tag-premium text-xs px-2 py-0.5">
              <Icons.Hash className="w-3 h-3 mr-0.5" />{tag}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center pt-3 border-t border-slate-100 dark:border-dark-100">
        <motion.button whileTap={{ scale: 0.85 }} onClick={handleLike}
          className={`relative flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition-colors group ${liked ? 'text-red-500' : 'text-slate-400 hover:text-red-400'}`}>
          <Icons.Like className={`w-4 h-4 transition-all group-hover:scale-110 ${liked ? 'fill-red-500' : ''}`} />
          <span className="text-xs font-medium">{likeCount}</span>
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={e => { e.stopPropagation(); router.push(`/post/${post.id}`); }}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition-colors group text-slate-400 hover:text-brand-500">
          <Icons.Comment className="w-4 h-4 transition-all group-hover:scale-110" />
          <span className="text-xs font-medium">{post.commentCount}</span>
        </motion.button>
      </div>
    </motion.div>
  );
};
