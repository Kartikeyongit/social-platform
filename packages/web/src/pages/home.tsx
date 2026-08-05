import React, { useState, useEffect, useRef } from 'react';
import { useQuery, gql } from '@apollo/client';
import { TrendingSidebar } from '@/components/home/TrendingSidebar';
import { CreatePost } from '@/components/post/CreatePost';
import { PostCard } from '@/components/post/PostCard';
import { CommentSection } from '@/components/post/CommentSection';
import { ErrorState } from '@/components/ui/ErrorState';
import Link from 'next/link';

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
    <div className="flex gap-6">
      <div className="flex-1 max-w-2xl space-y-2">
        <CreatePost onPosted={handlePosted} />

        {loading && allPosts.length === 0 && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-dark-50 rounded-3xl border border-slate-200/60 dark:border-dark-100 shadow-soft p-5 animate-pulse">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-dark-100" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 bg-slate-200 dark:bg-dark-100 rounded-full w-24" />
                    <div className="h-2 bg-slate-200 dark:bg-dark-100 rounded-full w-16" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-200 dark:bg-dark-100 rounded-full w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-dark-100 rounded-full w-1/2" />
                </div>
              </div>
            ))}
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
          <div className="bg-white dark:bg-dark-50 rounded-3xl border border-slate-200/60 dark:border-dark-100 shadow-soft p-10 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Your feed is quiet. Follow more people or post something to get started.
            </p>
            <Link href="/explore" className="btn-primary-premium inline-block mt-4 text-sm">
              Explore
            </Link>
          </div>
        )}

        {allPosts.map((post: any) => (
          <PostCard
            key={post.id}
            post={post}
            onCommentClick={() => toggleComments(post.id)}
          >
            <CommentSection
              postId={post.id}
              open={openComments.has(post.id)}
              onCommentAdded={() => bumpCommentCount(post.id)}
            />
          </PostCard>
        ))}

        <div ref={loaderRef} className="py-8 flex flex-col items-center">
          {isLoadingMore && <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mb-2" />}
          {!hasMore && allPosts.length > 0 && <p className="text-xs text-slate-400 dark:text-slate-500">You've reached the end</p>}
        </div>
      </div>
      <div className="hidden lg:block w-80 flex-shrink-0">
        <div className="sticky top-0 space-y-4"><TrendingSidebar /></div>
      </div>
    </div>
  );
}