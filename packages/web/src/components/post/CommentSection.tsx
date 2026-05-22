import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Send } from 'lucide-react';

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
      }
    }
  }
`;

interface CommentSectionProps {
  postId: string;
  onCommentAdded: () => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ postId, onCommentAdded }) => {
  const [content, setContent] = useState('');
  const [showComments, setShowComments] = useState(false);
  
  const { data, loading, refetch } = useQuery(GET_COMMENTS, {
    variables: { postId, limit: 10 },
    skip: !showComments,
  });
  
  const [createComment, { loading: commentLoading }] = useMutation(CREATE_COMMENT, {
    onCompleted: () => {
      setContent('');
      refetch();
      onCommentAdded();
      toast.success('Comment added!');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    await createComment({
      variables: {
        input: {
          postId,
          content,
        },
      },
    });
  };

  const comments = data?.post?.comments?.edges?.map((edge: any) => edge.node) || [];

  return (
    <div className="mt-4">
      {!showComments ? (
        <button
          onClick={() => setShowComments(true)}
          className="text-blue-600 hover:text-blue-700 text-sm"
        >
          View comments
        </button>
      ) : (
        <div className="space-y-4">
          {/* Comment Form */}
          <form onSubmit={handleSubmit} className="flex items-start space-x-2">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 resize-none border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
            <button
              type="submit"
              disabled={!content.trim() || commentLoading}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Comments List */}
          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment: any) => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-sm">{comment.author.displayName}</span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{comment.content}</p>
                </div>
              ))}
              
              {data?.post?.comments?.pageInfo?.hasNextPage && (
                <button className="text-blue-600 text-sm hover:text-blue-700">
                  Load more comments
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};