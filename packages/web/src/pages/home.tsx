import React, { useState, useEffect, useRef } from 'react';
import { useQuery, gql } from '@apollo/client';
import { TrendingSidebar } from '@/components/home/TrendingSidebar';
import { CreatePost } from '@/components/post/CreatePost';
import { PostCard } from '@/components/post/PostCard';
import { CommentSection } from '@/components/post/CommentSection';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { PostSkeleton } from '@/components/ui/Skeleton';
import { CaughtUp } from '@/components/ui/CaughtUp';
import { Icons } from '@/components/icons';

const GET_FEED = gql`
  query GetFeed($limit: Int, $cursor: String) {
    feed(limit: $limit, cursor: $cursor) {
      edges {
        node {
          id content mediaUrls hashtags likeCount commentCount isLiked createdAt
          author { id username displayName avatarUrl }
        }
        cursor
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

const POSTS_PER_PAGE = 10;

export default function HomePage() {
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const loaderRef = useRef<HTMLDivElement>(null);

  const { loading, error, fetchMore, refetch } = useQuery(GET_FEED, {
    variables: { limit: POSTS_PER_PAGE },
    fetchPolicy: 'network-only',
    onCompleted: (newData) => {
      if (newData?.feed?.edges) {
        const newPosts = newData.feed.edges.map((e: any) => e.node);
        setAllPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          return [...prev, ...newPosts.filter((p: any) => !existingIds.has(p.id))];
        });
        setHasMore(newData.feed.pageInfo.hasNextPage);
        if (newData.feed.pageInfo.endCursor) {
          setCurrentCursor(newData.feed.pageInfo.endCursor);
        }
      }
    },
  });

  const loadMore = async () => {
    if (!hasMore || !currentCursor || isLoadingMore || loading) return;
    setIsLoadingMore(true);
    try {
      const result = await fetchMore({
        variables: { limit: POSTS_PER_PAGE, cursor: currentCursor },
      });
      if (result.data?.feed?.edges) {
        const newPosts = result.data.feed.edges.map((e: any) => e.node);
        setAllPosts(prev => {
          const ids = new Set(prev.map(p => p.id));
          return [...prev, ...newPosts.filter((p: any) => !ids.has(p.id))];
        });
        setHasMore(result.data.feed.pageInfo.hasNextPage);
        if (result.data.feed.pageInfo.endCursor) {
          setCurrentCursor(result.data.feed.pageInfo.endCursor);
        }
      }
    } catch (e) {
      // ignore
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: '300px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [currentCursor, hasMore, loading, isLoadingMore]);

  const toggleComments = (postId: string) => {
    setOpenComments(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const bumpCommentCount = (postId: string) => {
    setAllPosts(prev => prev.map(p => (
      p.id === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p
    )));
  };

  const handlePosted = () => {
    setAllPosts([]);
    setCurrentCursor(null);
    refetch();
  };

  return (
    <div className="relative">
      <div className="mx-auto w-full max-w-2xl space-y-2">
        <CreatePost onPosted={handlePosted} />

        {loading && allPosts.length === 0 && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <PostSkeleton key={i} />)}
          </div>
        )}

        {error && !loading && (
          <ErrorState
            title="Couldn't load your feed"
            message={error.message}
            onRetry={() => refetch()}
          />
        )}

        {!loading && !error && allPosts.length === 0 && (
          <EmptyState
            icon={<Icons.Home className="w-8 h-8" />}
            title="Your feed is quiet"
            description="Follow more people or post something to get started."
            action={{ label: 'Explore', href: '/explore' }}
          />
        )}

        {allPosts.length > 0 && (
          <div className="[&>*:last-child]:border-b-0">
            {allPosts.map((post: any) => (
              <PostCard
                key={post.id}
                post={post}
                onCommentClick={() => toggleComments(post.id)}
                onDeleted={() => setAllPosts(prev => prev.filter(p => p.id !== post.id))}
              >
                <CommentSection
                  postId={post.id}
                  open={openComments.has(post.id)}
                  onCommentAdded={() => bumpCommentCount(post.id)}
                />
              </PostCard>
            ))}
          </div>
        )}

        <div ref={loaderRef} className="flex flex-col items-center py-8">
          {isLoadingMore && <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />}
          {!hasMore && allPosts.length > 0 && <CaughtUp className="py-0" />}
        </div>
      </div>
      <div className="absolute right-0 top-0 hidden w-80 min-[1400px]:block">
        <div className="sticky top-0 space-y-4"><TrendingSidebar /></div>
      </div>
    </div>
  );
}