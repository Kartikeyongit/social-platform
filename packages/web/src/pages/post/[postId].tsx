import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, gql } from '@apollo/client';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Icons } from '@/components/icons';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

const GET_POST = gql`
  query GetPost($postId: ID!) {
    post(id: $postId) {
      id
      content
      mediaUrls
      hashtags
      likeCount
      commentCount
      isLiked
      createdAt
      author {
        id
        username
        displayName
        avatarUrl
      }
      comments(limit: 20) {
        edges {
          node {
            id
            content
            createdAt
            author {
              id
              username
              displayName
              avatarUrl
            }
          }
        }
      }
    }
  }
`;

const CREATE_COMMENT = gql`
  mutation CreateComment($input: CreateCommentInput!) {
    createComment(input: $input) {
      id
      content
      createdAt
      author { id username displayName avatarUrl }
    }
  }
`;

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

export default function PostDetailPage() {
  const router = useRouter();
  const { postId } = router.query;
  const { user } = useAuth();
  const [commentInput, setCommentInput] = useState('');

  const { data, loading, refetch } = useQuery(GET_POST, {
    variables: { postId },
    skip: !postId,
    fetchPolicy: 'network-only',
  });

  const [createComment] = useMutation(CREATE_COMMENT, {
    onCompleted: () => { setCommentInput(''); refetch(); toast.success('Comment added!'); },
  });

  const [likePost] = useMutation(LIKE_POST, { onCompleted: () => refetch() });
  const [unlikePost] = useMutation(UNLIKE_POST, { onCompleted: () => refetch() });

  const handleLike = () => {
    if (!post) return;
    post.isLiked ? unlikePost({ variables: { postId: post.id } }) : likePost({ variables: { postId: post.id } });
  };

  const handleComment = async () => {
    if (!commentInput.trim() || !post) return;
    await createComment({ variables: { input: { postId: post.id, content: commentInput } } });
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-white dark:bg-dark-50 rounded-3xl border border-slate-200/60 dark:border-dark-100 shadow-soft p-6 animate-pulse">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-dark-100"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-slate-200 dark:bg-dark-100 rounded-full w-32"></div>
              <div className="h-3 bg-slate-200 dark:bg-dark-100 rounded-full w-20"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-dark-100 rounded-full w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  const post = data?.post;
  const comments = post?.comments?.edges?.map((e: any) => e.node) || [];

  if (!post) {
    return (
      <div className="max-w-xl mx-auto text-center py-12">
        <p className="text-slate-500 dark:text-slate-400">Post not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* Back button */}
      <button onClick={() => router.back()} className="flex items-center space-x-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
        <Icons.Back className="w-4 h-4" />
        <span className="text-sm">Back</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-dark-50 rounded-3xl border border-slate-200/60 dark:border-dark-100 shadow-soft p-6"
      >
        {/* Author */}
        <div className="flex items-center space-x-3 mb-4">
          <Link href={`/profile/${post.author.username}`}>
            {post.author.avatarUrl ? (
              <img src={post.author.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                {post.author.displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </Link>
          <div>
            <Link href={`/profile/${post.author.username}`} className="font-semibold text-slate-900 dark:text-white hover:underline">
              {post.author.displayName}
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400">@{post.author.username}</p>
          </div>
        </div>

        {/* Content */}
        <p className="text-slate-800 dark:text-slate-200 mb-4 leading-relaxed">{post.content}</p>

        {/* Media */}
        {post.mediaUrls?.length > 0 && (
          <div className="mb-4 rounded-2xl overflow-hidden">
            <img src={post.mediaUrls[0]} alt="Post" className="w-full object-cover max-h-96" />
          </div>
        )}

        {/* Hashtags */}
        {post.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.hashtags.map((tag: string) => (
              <span key={tag} className="tag-premium">
                <Icons.Hash className="w-3 h-3 mr-1" />{tag}
              </span>
            ))}
          </div>
        )}

        {/* Time */}
        <p className="text-sm text-slate-400 dark:text-slate-500 mb-4 pb-4 border-b border-slate-100 dark:border-dark-100">
          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
        </p>

        {/* Actions */}
        <div className="flex items-center space-x-6 pb-4 border-b border-slate-100 dark:border-dark-100">
          <button onClick={handleLike} className={`flex items-center space-x-2 ${post.isLiked ? 'text-red-500' : 'text-slate-500 hover:text-red-500'}`}>
            <Icons.Like className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm">{post.likeCount}</span>
          </button>
          <button className="flex items-center space-x-2 text-slate-500">
            <Icons.Comment className="w-5 h-5" />
            <span className="text-sm">{post.commentCount}</span>
          </button>
          <button className="flex items-center space-x-2 text-slate-500 ml-auto">
            <Icons.Share className="w-5 h-5" />
          </button>
        </div>

        {/* Comments */}
        <div className="mt-4 space-y-4">
          {/* Comment Input */}
          <div className="flex space-x-3">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="flex-1 flex space-x-2">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                placeholder="Post your reply"
                className="input-premium flex-1 text-sm py-2"
              />
              <button onClick={handleComment} className="btn-primary-premium px-4 text-sm">
                Reply
              </button>
            </div>
          </div>

          {/* Comments List */}
          {comments.map((comment: any) => (
            <div key={comment.id} className="flex space-x-3">
              <Link href={`/profile/${comment.author.username}`}>
                {comment.author.avatarUrl ? (
                  <img src={comment.author.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                    {comment.author.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </Link>
              <div>
                <p className="text-sm">
                  <Link href={`/profile/${comment.author.username}`} className="font-semibold text-slate-900 dark:text-white hover:underline">
                    {comment.author.displayName}
                  </Link>
                  {' '}
                  <span className="text-slate-700 dark:text-slate-300">{comment.content}</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
