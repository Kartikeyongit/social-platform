import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useLazyQuery, useMutation, gql } from '@apollo/client';
import { motion } from 'framer-motion';
import { Icons } from '@/components/icons';
import { PostCard } from '@/components/post/PostCard';
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

const FOLLOW_USER = gql`
  mutation FollowUser($userId: ID!) { followUser(userId: $userId) { id isFollowing } }
`;

const UNFOLLOW_USER = gql`
  mutation UnfollowUser($userId: ID!) { unfollowUser(userId: $userId) { id isFollowing } }
`;

const USER_FOLLOW_FRAGMENT = gql`
  fragment UserFollow on User { id isFollowing }
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
  const loaderRef = useRef<HTMLDivElement>(null);

  const applyFollow = (cache: any, { data }: any) => {
    const u = data?.followUser || data?.unfollowUser;
    if (!u) return;
    cache.writeFragment({
      id: `User:${u.id}`,
      fragment: USER_FOLLOW_FRAGMENT,
      data: { id: u.id, isFollowing: u.isFollowing },
    });
  };

  const [followUser] = useMutation(FOLLOW_USER, { update: applyFollow });
  const [unfollowUser] = useMutation(UNFOLLOW_USER, { update: applyFollow });

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

  useEffect(() => {
    if (debounced) {
      setIsSearching(true);
      getSearch({ variables: { query: debounced, limit: 20 } });
    } else {
      setIsSearching(false);
      setResults(null);
    }
  }, [debounced]);

  const { data, loading, fetchMore } = useQuery(EXPLORE_FEED, {
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
    } catch (e) {}
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
  }, [currentCursor, hasMore, loading, isLoadingMore]);

  const users = results?.users || [];
  const hashtags = results?.hashtags || [];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white font-display">Explore</h1>
        </div>

        <div className="relative">
          <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search people and hashtags..."
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-dark-50 border border-slate-200/60 dark:border-dark-100 rounded-full shadow-soft text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>
      </motion.div>

      {isSearching ? (
        <div className="space-y-4">
          {searchLoading && results === null && (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-dark-50 rounded-3xl border border-slate-200/60 dark:border-dark-100 shadow-soft p-4 animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-dark-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 dark:bg-dark-100 rounded-full w-24" />
                      <div className="h-3 bg-slate-200 dark:bg-dark-100 rounded-full w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!searchLoading && results !== null && users.length === 0 && hashtags.length === 0 && (
            <div className="bg-white dark:bg-dark-50 rounded-3xl border border-slate-200/60 dark:border-dark-100 shadow-soft p-12 text-center">
              <Icons.Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No results</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Nothing found for "@{debounced}"</p>
            </div>
          )}

          {users.length > 0 && (
            <div className="bg-white dark:bg-dark-50 rounded-3xl border border-slate-200/60 dark:border-dark-100 shadow-soft p-3">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white px-2 pt-2 pb-1 flex items-center space-x-2">
                <Icons.Profile className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <span>People</span>
              </h2>
              <div className="space-y-0.5">
                {users.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-dark-50 transition-colors">
                    <Link href={`/profile/${user.username}`} className="flex items-center space-x-3 flex-1 min-w-0">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {user.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-slate-900 dark:text-white truncate">{user.displayName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">@{user.username}</p>
                        {user.bio && <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user.bio}</p>}
                      </div>
                    </Link>
                    <button
                      onClick={() => user.isFollowing
                        ? unfollowUser({ variables: { userId: user.id } })
                        : followUser({ variables: { userId: user.id } })}
                      className={`ml-2 flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                        user.isFollowing
                          ? 'bg-slate-100 dark:bg-dark-100 text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500'
                          : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100'
                      }`}
                    >
                      {user.isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hashtags.length > 0 && (
            <div className="bg-white dark:bg-dark-50 rounded-3xl border border-slate-200/60 dark:border-dark-100 shadow-soft p-5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center space-x-2">
                <Icons.Hash className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <span>Hashtags</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {hashtags.map((tag: any) => (
                  <Link key={tag.name} href={`/explore?q=#${tag.name}`} className="group">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-brand-50 text-brand-600 border border-brand-200 hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-400 dark:border-brand-800/50 transition-colors">
                      <Icons.Hash className="w-3 h-3 mr-0.5" />{tag.name}
                      <span className="ml-1.5 text-xs text-brand-400">{tag.postCount} posts</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center space-x-2 pt-1">
            <Icons.Trending className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <span>Popular</span>
          </h2>

          {loading && posts.length === 0 && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-dark-0 rounded-3xl border border-slate-200/60 dark:border-dark-100 shadow-soft p-5 animate-pulse">
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

          {posts.map((post: any) => <PostCard key={post.id} post={post} />)}

          {!loading && posts.length === 0 && (
            <div className="bg-white dark:bg-dark-50 rounded-3xl border border-slate-200/60 dark:border-dark-100 shadow-soft p-12 text-center">
              <Icons.Trending className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No popular posts yet</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Be the first to create something great</p>
            </div>
          )}

          <div ref={loaderRef} className="py-8 flex flex-col items-center">
            {isLoadingMore && <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mb-2" />}
            {!hasMore && posts.length > 0 && <p className="text-xs text-slate-400 dark:text-slate-500">You've reached the end</p>}
          </div>
        </div>
      )}
    </div>
  );
}