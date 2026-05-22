import React from 'react';
import { useMutation, gql } from '@apollo/client';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';

const LIKE_POST = gql`
  mutation LikePost($postId: ID!) {
    likePost(postId: $postId) {
      id
      likeCount
      isLiked
    }
  }
`;

const UNLIKE_POST = gql`
  mutation UnlikePost($postId: ID!) {
    unlikePost(postId: $postId) {
      id
      likeCount
      isLiked
    }
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
  const [likePost] = useMutation(LIKE_POST);
  const [unlikePost] = useMutation(UNLIKE_POST);

  const handleLike = async () => {
    try {
      if (post.isLiked) {
        await unlikePost({ variables: { postId: post.id } });
      } else {
        await likePost({ variables: { postId: post.id } });
        toast.success('Post liked!');
      }
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      {/* Author Info */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
          <span className="text-primary-600 font-medium">
            {post.author.displayName.charAt(0)}
          </span>
        </div>
        <div>
          <p className="font-medium text-gray-900">{post.author.displayName}</p>
          <p className="text-sm text-gray-500">
            @{post.author.username} · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Content */}
      <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.content}</p>

      {/* Hashtags */}
      {post.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.hashtags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-sm hover:bg-primary-100 cursor-pointer transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <button
          onClick={handleLike}
          className={`flex items-center space-x-2 transition-colors ${
            post.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
          }`}
        >
          <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
          <span className="text-sm">{post.likeCount}</span>
        </button>

        <button className="flex items-center space-x-2 text-gray-500 hover:text-primary-600 transition-colors">
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm">{post.commentCount}</span>
        </button>

        <button className="flex items-center space-x-2 text-gray-500 hover:text-green-600 transition-colors">
          <Share2 className="w-5 h-5" />
        </button>

        <button className="flex items-center space-x-2 text-gray-500 hover:text-yellow-600 transition-colors">
          <Bookmark className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};