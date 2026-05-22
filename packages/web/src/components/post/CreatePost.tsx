import React, { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Image, Hash, Send } from 'lucide-react';

const CREATE_POST = gql`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id
      content
      hashtags
      author {
        id
        username
        displayName
      }
      createdAt
    }
  }
`;

export const CreatePost: React.FC = () => {
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useAuth();
  const [createPost, { loading }] = useMutation(CREATE_POST, {
    refetchQueries: ['GetFeed'],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      await createPost({
        variables: {
          input: {
            content,
            hashtags: hashtags
              .split(' ')
              .filter(tag => tag.startsWith('#'))
              .map(tag => tag.slice(1)),
          },
        },
      });
      
      setContent('');
      setHashtags('');
      setIsExpanded(false);
      toast.success('Post created!');
    } catch (error) {
      toast.error('Failed to create post');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
          <span className="text-primary-600 font-medium">
            {user?.displayName?.charAt(0) || 'U'}
          </span>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1">
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (e.target.value) setIsExpanded(true);
            }}
            onFocus={() => setIsExpanded(true)}
            placeholder="What's on your mind?"
            className="w-full resize-none border-0 focus:ring-0 text-gray-900 placeholder-gray-500 bg-transparent"
            rows={isExpanded ? 3 : 1}
          />
          
          {isExpanded && (
            <>
              <input
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="Add hashtags (e.g., #tech #coding)"
                className="w-full mt-2 text-sm text-gray-600 border-0 focus:ring-0 bg-transparent"
              />
              
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <div className="flex space-x-2">
                  <button type="button" className="p-2 text-gray-500 hover:text-primary-600 transition-colors">
                    <Image className="w-5 h-5" />
                  </button>
                  <button type="button" className="p-2 text-gray-500 hover:text-primary-600 transition-colors">
                    <Hash className="w-5 h-5" />
                  </button>
                </div>
                
                <button
                  type="submit"
                  disabled={!content.trim() || loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Posting...' : 'Post'}</span>
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};