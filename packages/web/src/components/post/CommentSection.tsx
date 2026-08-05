import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, gql } from '@apollo/client';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Icons } from '@/components/icons';

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
    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-100 space-y-3">
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment..."
          className="input-premium flex-1 text-xs py-2"
        />
        <button
          type="submit"
          disabled={!content.trim() || commentLoading}
          aria-label="Post comment"
          className="bg-brand-600 hover:bg-brand-700 text-white px-3 py-2 rounded-xl text-xs font-medium disabled:opacity-50 transition-colors"
        >
          <Icons.Send className="w-3 h-3" />
        </button>
      </form>

      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-dark-100 rounded w-3/4" />
          <div className="h-4 bg-slate-200 dark:bg-dark-100 rounded w-1/2" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500">No comments yet — be the first!</p>
      ) : (
        <>
          <div className="space-y-3">
            {comments.map((comment: any) => (
              <div key={comment.id} className="flex items-start space-x-2">
                <Link href={`/profile/${comment.author.username}`} className="flex-shrink-0">
                  {comment.author.avatarUrl ? (
                    <img src={comment.author.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                      {comment.author.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </Link>
                <div className="bg-slate-50 dark:bg-dark-0 rounded-2xl px-3 py-2 flex-1">
                  <div className="flex items-center space-x-2">
                    <Link href={`/profile/${comment.author.username}`} className="font-semibold text-xs text-slate-900 dark:text-white hover:underline">
                      {comment.author.displayName}
                    </Link>
                    <span className="text-[10px] text-slate-400">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
          {data?.post?.comments?.pageInfo?.hasNextPage && (
            <button
              onClick={() => setLimit((l) => l + 10)}
              className="text-brand-600 hover:text-brand-700 text-xs font-medium"
            >
              Load more comments
            </button>
          )}
        </>
      )}
    </div>
  );
};