import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useMutation, useLazyQuery, gql } from '@apollo/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/components/icons';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

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

  const typedHashtags = content.match(/#(\w+)/g)?.map((t) => t.slice(1).toLowerCase()) || [];
  const visibleSuggestions = suggestions.filter(
    (tag) => !typedHashtags.includes(tag.toLowerCase()),
  );

  useEffect(() => {
    if (content.length > 3) {
      const t = setTimeout(() => getSuggestions({ variables: { content } }), 600);
      return () => clearTimeout(t);
    }
    setSuggestions([]);
  }, [content]); // eslint-disable-line react-hooks/exhaustive-deps

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
      className="rounded-3xl border border-line bg-surface p-5 shadow-soft"
    >
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          <Link href={`/profile/${user?.username}`} className="flex-shrink-0">
            <Avatar name={user?.displayName} username={user?.username} src={user?.avatarUrl} size="md" />
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
              className="w-full resize-none bg-transparent text-[15px] text-ink placeholder:text-muted focus:outline-none min-h-[44px]"
            />

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  {visibleSuggestions.length > 0 && (
                    <div className="mb-2 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-muted">Suggestion:</span>
                      {visibleSuggestions.map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => addHashtag(tag)}
                          className="tag-premium"
                        >
                          <Icons.Hash className="h-3 w-3" />
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}

                  {mediaUrls.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {mediaUrls.map((url, i) => (
                        <div key={i} className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="" className="h-20 w-20 rounded-xl object-cover" />
                          <button
                            type="button"
                            onClick={() => setMediaUrls(mediaUrls.filter((_, idx) => idx !== i))}
                            aria-label="Remove image"
                            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow-sm"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
                    <div className="flex items-center gap-2">
                      <label
                        className="flex cursor-pointer items-center gap-1.5 rounded-full p-2 text-muted transition-colors hover:bg-surface-2 hover:text-brand-600"
                        aria-label="Attach image"
                      >
                        <Icons.CreatePost className="h-4 w-4" />
                        {isUploading && <span className="text-[10px] font-medium">Uploading…</span>}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={isUploading}
                        />
                      </label>
                      {content.length > 0 && (
                        <span className={cn('text-[11px] font-medium tabular-nums', remaining < 0 ? 'text-red-500' : 'text-muted')}>
                          {remaining}
                        </span>
                      )}
                    </div>
                    <Button
                      type="submit"
                      size="sm"
                      loading={isPosting}
                      disabled={!content.trim() || remaining < 0}
                    >
                      Post
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </form>
    </motion.div>
  );
};