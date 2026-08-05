import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useMutation, useLazyQuery, gql } from '@apollo/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Icons } from '@/components/icons';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const MAX_POST_LENGTH = 500;

const CREATE_POST = gql`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id
      content
      mediaUrls
      hashtags
      likeCount
      commentCount
      createdAt
      author { id username displayName avatarUrl }
    }
  }
`;

const SUGGEST_HASHTAGS = gql`
  query SuggestHashtags($content: String!) { suggestHashtags(content: $content) }
`;

interface CreatePostProps {
  onPosted?: () => void;
}

export const CreatePost: React.FC<CreatePostProps> = ({ onPosted }) => {
  const { user, token } = useAuth();
  const [content, setContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const [createPost, { loading: isPosting }] = useMutation(CREATE_POST, {
    refetchQueries: ['GetFeed'],
    onCompleted: () => {
      setContent('');
      setMediaUrls([]);
      setSuggestions([]);
      setIsExpanded(false);
      toast.success('Posted!');
      onPosted?.();
    },
    onError: () => toast.error('Failed to create post'),
  });

  const [getSuggestions] = useLazyQuery(SUGGEST_HASHTAGS, {
    onCompleted: (d) => setSuggestions(d.suggestHashtags || []),
  });

  useEffect(() => {
    if (content.length > 3) {
      const t = setTimeout(() => getSuggestions({ variables: { content } }), 600);
      return () => clearTimeout(t);
    }
    setSuggestions([]);
  }, [content]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const r = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const d = await r.json();
      if (d.url) setMediaUrls((prev) => [...prev, d.url]);
      else toast.error('Upload failed');
    } catch {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const addHashtag = (tag: string) => {
    if (!content.includes(`#${tag}`)) setContent((c) => `${c} #${tag}`);
    setSuggestions([]);
  };

  const remaining = MAX_POST_LENGTH - content.length;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isPosting) return;
    const tags = content.match(/#(\w+)/g)?.map((t) => t.slice(1)) || [];
    await createPost({
      variables: { input: { content, hashtags: tags, mediaUrls } },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-dark-50 rounded-3xl border border-slate-200/60 dark:border-dark-100 shadow-soft p-5"
    >
      <form onSubmit={handleSubmit}>
        <div className="flex space-x-3">
          <Link href={`/profile/${user?.username}`} className="flex-shrink-0">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
          </Link>
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (e.target.value) setIsExpanded(true);
              }}
              onFocus={() => setIsExpanded(true)}
              placeholder="What's on your mind?"
              rows={isExpanded ? 3 : 1}
              maxLength={MAX_POST_LENGTH}
              className="w-full resize-none bg-transparent text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none min-h-[60px] text-sm"
            />

            {isExpanded && (
              <>
                {suggestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">AI:</span>
                    {suggestions.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => addHashtag(tag)}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-600 border border-brand-200 hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-400 dark:border-brand-800/50 transition-colors"
                      >
                        <Icons.Hash className="w-3 h-3 mr-0.5" />
                        {tag}
                        <span className="ml-1 text-brand-400">+</span>
                      </button>
                    ))}
                  </div>
                )}

                {mediaUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {mediaUrls.map((url, i) => (
                      <div key={i} className="relative">
                        <img src={url} alt="" className="w-20 h-20 object-cover rounded-xl" />
                        <button
                          type="button"
                          onClick={() => setMediaUrls(mediaUrls.filter((_, idx) => idx !== i))}
                          aria-label="Remove image"
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 dark:border-dark-100">
                  <div className="flex items-center space-x-3">
                    <label className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-dark-50 text-slate-400 hover:text-brand-600 transition-colors cursor-pointer" aria-label="Attach image">
                      <Icons.CreatePost className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                      />
                    </label>
                    {content.length > 0 && (
                      <span className={`text-[11px] font-medium ${remaining < 0 ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'}`}>
                        {remaining}
                      </span>
                    )}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={!content.trim() || isPosting || remaining < 0}
                    className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-all disabled:opacity-50"
                  >
                    {isPosting ? 'Posting…' : 'Post'}
                  </motion.button>
                </div>
              </>
            )}
          </div>
        </div>
      </form>
    </motion.div>
  );
};