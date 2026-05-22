import React, { useState } from 'react';
import { useQuery, useLazyQuery, gql } from '@apollo/client';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Icons } from '@/components/icons';
import Link from 'next/link';

const TRENDING_HASHTAGS = gql`
  query TrendingHashtags($limit: Int) {
    trendingHashtags(limit: $limit) {
      name
      postCount
    }
  }
`;

const SEARCH_USERS = gql`
  query SearchUsers($query: String!, $limit: Int) {
    searchUsers(query: $query, limit: $limit) {
      id
      username
      displayName
      bio
      avatarUrl
    }
  }
`;

const EXPLORE_FEED = gql`
  query ExploreFeed($limit: Int) {
    exploreFeed(limit: $limit) {
      edges {
        node {
          id
          content
          hashtags
          likeCount
          commentCount
          createdAt
          author {
            id
            username
            displayName
            avatarUrl
          }
        }
      }
    }
  }
`;

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'trending' | 'posts'>('trending');
  const router = useRouter();

  const { data: trendingData } = useQuery(TRENDING_HASHTAGS, { variables: { limit: 10 } });
  const { data: exploreData } = useQuery(EXPLORE_FEED, { variables: { limit: 20 } });
  const [searchUsers, { data: userSearchData, loading: searchLoading }] = useLazyQuery(SEARCH_USERS);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchUsers({ variables: { query: searchQuery.trim(), limit: 10 } });
    }
  };

  const trending = trendingData?.trendingHashtags || [];
  const explorePosts = exploreData?.exploreFeed?.edges?.map((edge: any) => edge.node) || [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white font-display">Explore</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Discover new content and people</p>
      </motion.div>

      {/* Search Bar */}
      <form onSubmit={handleSearch}>
        <div className="relative">
          <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name or username..."
            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-dark-50 border-2 border-slate-200 dark:border-dark-100 rounded-2xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-brand-500 transition-all duration-200 text-slate-900 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>
      </form>

      {/* Search Loading */}
      {searchLoading && (
        <div className="flex items-center justify-center py-6">
          <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Search Results */}
      {userSearchData?.searchUsers && userSearchData.searchUsers.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white px-1">Search Results</h2>
          {userSearchData.searchUsers.map((user: any) => (
            <div
              key={user.id}
              onClick={() => router.push(`/profile/${user.username}`)}
              className="bg-white dark:bg-dark-50 rounded-2xl border border-slate-200/60 dark:border-dark-100 p-4 cursor-pointer hover:shadow-md transition-all"
            >
              <div className="flex items-center space-x-3">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-md flex-shrink-0">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{user.displayName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">@{user.username}</p>
                  {user.bio && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{user.bio}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {userSearchData?.searchUsers && userSearchData.searchUsers.length === 0 && searchQuery && (
        <div className="text-center py-8">
          <Icons.Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">No users found for "{searchQuery}"</p>
        </div>
      )}

      {/* Tabs */}
      {!searchQuery && (
        <>
          <div className="flex space-x-1 bg-slate-100 dark:bg-dark-50 p-1 rounded-2xl">
            {(['trending', 'posts'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-white dark:bg-dark-0 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tab === 'trending' ? 'Trending Hashtags' : 'Popular Posts'}
              </button>
            ))}
          </div>

          {/* Trending Tab */}
          {activeTab === 'trending' && (
            <div className="space-y-2">
              {trending.length === 0 && (
                <div className="bg-white dark:bg-dark-50 rounded-2xl border border-slate-200/60 dark:border-dark-100 p-12 text-center">
                  <Icons.Trending className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm">No trending hashtags yet</p>
                </div>
              )}
              {trending.map((hashtag: any, index: number) => (
                <div key={hashtag.name} className="bg-white dark:bg-dark-50 rounded-2xl border border-slate-200/60 dark:border-dark-100 p-4 flex items-center justify-between hover:shadow-md transition-all">
                  <div className="flex items-center space-x-4">
                    <span className="text-lg font-bold text-slate-300 dark:text-slate-600 w-6 text-right">{index + 1}</span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <Icons.Hash className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                        <p className="font-semibold text-sm text-slate-900 dark:text-white">{hashtag.name}</p>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 ml-6">{hashtag.postCount} posts</p>
                    </div>
                  </div>
                  {index < 3 && <Icons.Trending className="w-4 h-4 text-orange-500" />}
                </div>
              ))}
            </div>
          )}

          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <div className="space-y-4">
              {explorePosts.length === 0 && (
                <div className="bg-white dark:bg-dark-50 rounded-2xl border border-slate-200/60 dark:border-dark-100 p-12 text-center">
                  <Icons.Explore className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm">No posts to explore</p>
                </div>
              )}
              {explorePosts.map((post: any) => (
                <div key={post.id} className="bg-white dark:bg-dark-50 rounded-2xl border border-slate-200/60 dark:border-dark-100 p-5 hover:shadow-md transition-all">
                  <div className="flex items-center space-x-3 mb-3">
                    <Link href={`/profile/${post.author.username}`}>
                      {post.author.avatarUrl ? (
                        <img src={post.author.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-md flex-shrink-0">
                          {post.author.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </Link>
                    <div>
                      <Link href={`/profile/${post.author.username}`} className="font-semibold text-sm text-slate-900 dark:text-white hover:underline">
                        {post.author.displayName}
                      </Link>
                      <p className="text-xs text-slate-500 dark:text-slate-400">@{post.author.username}</p>
                    </div>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{post.content}</p>
                  {post.hashtags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {post.hashtags.map((tag: string) => (
                        <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300">
                          <Icons.Hash className="w-3 h-3 mr-0.5" />{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
