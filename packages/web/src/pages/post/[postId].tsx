import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, gql } from '@apollo/client';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { Icons } from '@/components/icons';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { PostCard } from '@/components/post/PostCard';
import { ErrorState } from '@/components/ui/ErrorState';
import { PostSkeleton } from '@/components/ui/Skeleton';

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

export default function PostDetailPage() {
  const router = useRouter();
  const { postId } = router.query;
  const { user } = useAuth();
  const [commentInput, setCommentInput] = useState('');

  const { data, loading, error, refetch } = useQuery(GET_POST, {
    variables: { postId },
    skip: !postId,
    fetchPolicy: 'network-only',
  });

  const [createComment] = useMutation(CREATE_COMMENT, {
    onCompleted: () => { setCommentInput(''); refetch(); toast.success('Comment added!'); },
  });

  const handleComment = async () => {
    if (!commentInput.trim() || !post) return;
    await createComment({ variables: { input: { postId: post.id, content: commentInput } } });
  };

  if (error && !loading) {
    return (
      <div className="max-w-xl mx-auto">
        <ErrorState
          title="Couldn't load this post"
          message={error.message}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto">
        <PostSkeleton />
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

      <PostCard post={post} onDeleted={() => router.push('/home')}>
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
          {comments.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">No comments yet — be the first!</p>
          ) : (
            comments.map((comment: any) => (
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
            ))
          )}
        </div>
      </PostCard>
    </div>
  );
}
