import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useLazyQuery, gql } from '@apollo/client';
import { motion } from 'framer-motion';
import { Icons } from '@/components/icons';
import { PostCard } from '@/components/post/PostCard';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { PostSkeleton, ListSkeleton } from '@/components/ui/Skeleton';
import { CaughtUp } from '@/components/ui/CaughtUp';
import { UserRow } from '@/components/ui/UserRow';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { fadeUp } from '@/utils/motion';
import Link from 'next/link';

const EXPLORE_FEED = gql`
  query ExploreFeed($limit: Int, $cursor: String) {
    exploreFeed(limit: $limit, cursor: $cursor) {
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

const SEARCH = gql`
  query Search($query: String!, $limit: Int) {
    users: searchUsers(query: $query, limit: $limit) {
      id username displayName bio avatarUrl isFollowing
    }
    hashtags: searchHashtags(query: $query, limit: $limit) {
      name postCount
    }
  }
`;

const POSTS_BY_HASHTAG = gql`
  query PostsByHashtag($hashtag: String!, $limit: Int, $cursor: String) {
    postsByHashtag(hashtag: $hashtag, limit: $limit, cursor: $cursor) {
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

export default function ExplorePage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [debounced, setDebounced] = useState('');
  const [results, setResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [tagPosts, setTagPosts] = useState<any[]>([]);
  const [tagCursor, setTagCursor] = useState<string | null>(null);
  const [tagHasMore, setTagHasMore] = useState(true);
  const [isLoadingTagMore, setIsLoadingTagMore] = useState(false);
  const [tagLoading, setTagLoading] = useState(false);
  const [tagError, setTagError] = useState<any>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  const searchTerm = debounced.replace(/^#/, '').trim();
  const hasHashtagMode = debounced.startsWith('#') && searchTerm.length > 0;

  useEffect(() => {
    const q = typeof router.query.q === 'string' ? router.query.q : '';
    if (q) { setSearchInput(q); setDebounced(q); }
  }, [router.query.q]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const [getSearch, { loading: searchLoading }] = useLazyQuery(SEARCH, {
    onCompleted: (d) => setResults(d),
  });

  const [getTagPosts] = useLazyQuery(POSTS_BY_HASHTAG, {
    onCompleted: (d) => {
      setTagLoading(false);
      setTagError(null);
      const edges = d?.postsByHashtag?.edges || [];
      setTagPosts(prev => {
        const ids = new Set(prev.map(p => p.id));
        return [...prev, ...edges.map((e: any) => e.node).filter((p: any) => !ids.has(p.id))];
      });
      setTagHasMore(!!d?.postsByHashtag?.pageInfo?.hasNextPage);
      if (d?.postsByHashtag?.pageInfo?.endCursor) setTagCursor(d.postsByHashtag.pageInfo.endCursor);
    },
    onError: (e) => { setTagLoading(false); setTagError(e); },
  });

  useEffect(() => {
    if (debounced) {
      setIsSearching(true);
      getSearch({ variables: { query: searchTerm, limit: 20 } });
    } else {
      setIsSearching(false);
      setResults(null);
    }
  }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setTagPosts([]);
    setTagCursor(null);
    setTagHasMore(true);
    setTagError(null);
    if (hasHashtagMode) {
      setTagLoading(true);
      getTagPosts({ variables: { hashtag: searchTerm, limit: POSTS_PER_PAGE } });
    } else {
      setTagLoading(false);
    }
  }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data, loading, error, fetchMore, refetch } = useQuery(EXPLORE_FEED, {
    variables: { limit: POSTS_PER_PAGE },
    fetchPolicy: 'network-only',
    onCompleted: (d) => {
      if (d?.exploreFeed?.edges) {
        setPosts(prev => {
          const ids = new Set(prev.map(p => p.id));
          return [...prev, ...d.exploreFeed.edges.map((e: any) => e.node).filter((p: any) => !ids.has(p.id))];
        });
        setHasMore(d.exploreFeed.pageInfo.hasNextPage);
        if (d.exploreFeed.pageInfo.endCursor) setCurrentCursor(d.exploreFeed.pageInfo.endCursor);
      }
    },
  });

  const loadMore = async () => {
    if (hasHashtagMode) {
      if (!tagHasMore || !tagCursor || isLoadingTagMore || tagLoading) return;
      setIsLoadingTagMore(true);
      try {
        await getTagPosts({ variables: { hashtag: searchTerm, limit: POSTS_PER_PAGE, cursor: tagCursor } });
      } catch (e) { /* ignore */ }
      finally { setIsLoadingTagMore(false); }
      return;
    }
    if (!hasMore || !currentCursor || isLoadingMore || loading) return;
    setIsLoadingMore(true);
    try {
      const result = await fetchMore({ variables: { limit: POSTS_PER_PAGE, cursor: currentCursor } });
      const feed = result.data?.exploreFeed;
      if (feed?.edges) {
        setPosts(prev => {
          const ids = new Set(prev.map(p => p.id));
          return [...prev, ...feed.edges.map((e: any) => e.node).filter((p: any) => !ids.has(p.id))];
        });
        setHasMore(feed.pageInfo.hasNextPage);
        if (feed.pageInfo.endCursor) setCurrentCursor(feed.pageInfo.endCursor);
      }
    } catch (e) { /* ignore */ }
    finally { setIsLoadingMore(false); }
  };

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMore();
    }, { rootMargin: '300px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [currentCursor, hasMore, loading, isLoadingMore, tagCursor, tagHasMore, isLoadingTagMore, tagLoading, hasHashtagMode, searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const users = results?.users || [];
  const hashtags = results?.hashtags || [];

  return (
    <div className="w-full max-w-2xl space-y-5">
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <PageHeader title="Explore" subtitle="Search people, hashtags and posts" />
        <div className="relative">
          <Icons.Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search people and hashtags..."
            className="input-premium rounded-full py-3 pl-11"
          />
        </div>
      </motion.div>

      {isSearching ? (
        <div className="space-y-5">
          {hasHashtagMode && (
            <div className="space-y-1">
              <h2 className="flex items-center gap-2 pt-1 font-display text-lg font-bold text-ink">
                <Icons.Hash className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                <span>
                  Posts tagged <span className="text-brand-600 dark:text-brand-400">#{searchTerm}</span>
                </span>
              </h2>

              {tagError && !tagLoading && (
                <ErrorState
                  title="Couldn't load posts for this hashtag"
                  message={tagError.message}
                  onRetry={() => {
                    setTagLoading(true);
                    getTagPosts({ variables: { hashtag: searchTerm, limit: POSTS_PER_PAGE } });
                  }}
                />
              )}

              {tagLoading && tagPosts.length === 0 && (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => <PostSkeleton key={i} />)}
                </div>
              )}

              {tagPosts.length > 0 && (
                <div className="[&>*:last-child]:border-b-0">
                  {tagPosts.map((post: any) => (
                    <PostCard key={post.id} post={post} onDeleted={() => setTagPosts(prev => prev.filter(p => p.id !== post.id))} />
                  ))}
                </div>
              )}

              {!tagLoading && !tagError && tagPosts.length === 0 && (
                <EmptyState
                  icon={<Icons.Hash className="h-8 w-8" />}
                  title={`No posts with #${searchTerm}`}
                  description="Be the first to post with this hashtag"
                />
              )}

              <div ref={loaderRef} className="flex flex-col items-center py-8">
                {isLoadingTagMore && <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />}
                {!tagHasMore && tagPosts.length > 0 && <CaughtUp className="py-0" />}
              </div>
            </div>
          )}

          {searchLoading && results === null && (
            <Card className="p-4">
              <ListSkeleton rows={4} />
            </Card>
          )}

          {!searchLoading && results !== null && users.length === 0 && hashtags.length === 0 && !hasHashtagMode && (
            <EmptyState
              icon={<Icons.Search className="h-8 w-8" />}
              title="No results"
              description={`Nothing found for "@${debounced}"`}
            />
          )}

          {users.length > 0 && (
            <Card className="p-0">
              <h2 className="flex items-center gap-2 px-4 pb-1 pt-4 text-base font-bold text-ink">
                <Icons.Profile className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                <span>People</span>
              </h2>
              <div className="px-2 pb-2">
                {users.map((user: any) => (
                  <UserRow key={user.id} user={user} showFollow />
                ))}
              </div>
            </Card>
          )}

          {hashtags.length > 0 && (
            <Card className="p-5">
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-ink">
                <Icons.Hash className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                <span>Hashtags</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {hashtags.map((tag: any) => (
                  <Link key={tag.name} href={`/explore?q=${encodeURIComponent(`#${tag.name}`)}`} className="group">
                    <span className="tag-premium">
                      <Icons.Hash className="h-3 w-3" />{tag.name}
                      <span className="ml-1.5 text-brand-400">{tag.postCount} posts</span>
                    </span>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>
      ) : (
        <div>
          <h2 className="flex items-center gap-2 pt-1 font-display text-lg font-bold text-ink">
            <Icons.Trending className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            <span>Popular</span>
          </h2>

          {error && !loading && (
            <ErrorState
              title="Couldn't load popular posts"
              message={error.message}
              onRetry={() => refetch()}
            />
          )}

          {loading && posts.length === 0 && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <PostSkeleton key={i} />)}
            </div>
          )}

          {posts.length > 0 && (
            <div className="[&>*:last-child]:border-b-0">
              {posts.map((post: any) => <PostCard key={post.id} post={post} onDeleted={() => setPosts(prev => prev.filter(p => p.id !== post.id))} />)}
            </div>
          )}

          {!loading && !error && posts.length === 0 && (
            <EmptyState
              icon={<Icons.Trending className="h-8 w-8" />}
              title="No popular posts yet"
              description="Be the first to create something great"
            />
          )}

          <div ref={loaderRef} className="flex flex-col items-center py-8">
            {isLoadingMore && <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />}
            {!hasMore && posts.length > 0 && <CaughtUp className="py-0" />}
          </div>
        </div>
      )}
    </div>
  );
}