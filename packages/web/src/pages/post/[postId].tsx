import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, gql } from '@apollo/client';
import { toast } from 'react-hot-toast';
import { Icons } from '@/components/icons';
import { useAuth } from '@/contexts/AuthContext';
import { PostCard } from '@/components/post/PostCard';
import { ErrorState } from '@/components/ui/ErrorState';
import { PostSkeleton } from '@/components/ui/Skeleton';
import { CommentRow } from '@/components/ui/CommentRow';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';

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
      <div className="mx-auto w-full max-w-xl">
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
      <div className="mx-auto w-full max-w-xl">
        <PostSkeleton />
      </div>
    );
  }

  const post = data?.post;
  const comments = post?.comments?.edges?.map((e: any) => e.node) || [];

  if (!post) {
    return (
      <div className="mx-auto w-full max-w-xl space-y-4">
        <PageHeader title="Post" back onBack={() => router.back()} />
        <p className="py-12 text-center text-sm text-muted">Post not found</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <PageHeader title="Post" back onBack={() => (window.history.length > 1 ? router.back() : router.push('/home'))} />

      <PostCard post={post} variant="card" onDeleted={() => router.push('/home')}>
        <div className="mt-4 space-y-5 border-t border-line pt-4">
          <div className="flex items-center gap-3">
            <Avatar
              name={user?.displayName}
              username={user?.username}
              src={user?.avatarUrl}
              size="sm"
              className="flex-shrink-0"
            />
            <div className="flex flex-1 gap-2">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                placeholder="Post your reply"
                className="input-premium flex-1 py-2 text-sm"
              />
              <Button onClick={handleComment} disabled={!commentInput.trim()} className="flex-shrink-0">
                Reply
              </Button>
            </div>
          </div>

          {comments.length === 0 ? (
            <p className="text-sm text-muted">No comments yet — be the first!</p>
          ) : (
            <div className="space-y-5">
              {comments.map((comment: any) => (
                <CommentRow key={comment.id} comment={comment} />
              ))}
            </div>
          )}
        </div>
      </PostCard>
    </div>
  );
}