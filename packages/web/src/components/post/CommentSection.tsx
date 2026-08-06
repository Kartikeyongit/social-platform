import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { toast } from 'react-hot-toast';
import { Icons } from '@/components/icons';
import { CommentRow } from '@/components/ui/CommentRow';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

const GET_COMMENTS = gql`
  query GetComments($postId: ID!, $limit: Int) {
    post(id: $postId) {
      id
      comments(limit: $limit) {
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
        pageInfo {
          hasNextPage
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
      author {
        id
        username
        displayName
        avatarUrl
      }
    }
  }
`;

interface CommentSectionProps {
  postId: string;
  open: boolean;
  onCommentAdded: () => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ postId, open, onCommentAdded }) => {
  const [content, setContent] = useState('');
  const [limit, setLimit] = useState(10);

  const { data, loading, refetch } = useQuery(GET_COMMENTS, {
    variables: { postId, limit },
    skip: !open,
  });

  const [createComment, { loading: commentLoading }] = useMutation(CREATE_COMMENT, {
    onCompleted: () => {
      setContent('');
      refetch();
      onCommentAdded();
      toast.success('Comment added!');
    },
  });

  if (!open) return null;

  const comments = data?.post?.comments?.edges?.map((edge: any) => edge.node) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await createComment({
      variables: {
        input: { postId, content },
      },
    });
  };

  return (
    <div className="space-y-4 border-t border-line pt-4">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment..."
          className="input-premium flex-1 py-2 text-xs"
        />
        <Button
          type="submit"
          size="sm"
          loading={commentLoading}
          disabled={!content.trim()}
          aria-label="Post comment"
          icon={<Icons.Send className="h-3.5 w-3.5" />}
        />
      </form>

      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted">No comments yet — be the first!</p>
      ) : (
        <>
          <div className="space-y-4">
            {comments.map((comment: any) => (
              <CommentRow key={comment.id} comment={comment} />
            ))}
          </div>
          {data?.post?.comments?.pageInfo?.hasNextPage && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setLimit((l) => l + 10)}
            >
              Load more comments
            </Button>
          )}
        </>
      )}
    </div>
  );
};