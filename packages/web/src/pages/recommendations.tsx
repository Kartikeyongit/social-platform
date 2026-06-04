import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { motion } from 'framer-motion';
import { Icons } from '@/components/icons';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/router';
import Link from 'next/link';

const GET_RECOMMENDATIONS = gql`
  query GetRecommendations($limit: Int) {
    recommendedPosts(limit: $limit) {
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
    suggestedUsers(limit: $limit) {
      id
      username
      displayName
      bio
      avatarUrl
    }
  }
`;

export default function RecommendationsPage() {
  const router = useRouter();
  const { data, loading } = useQuery(GET_RECOMMENDATIONS, {
    variables: { limit: 10 },
  });

  const posts = data?.recommendedPosts || [];
  const users = data?.suggestedUsers || [];

  return (
    <div className="max-w-5xl mx-auto space-y-8 mt-3">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommended Posts */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
            <Icons.Trending className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <span>Recommended Posts</span>
          </h2>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-dark-0 rounded-2xl border border-slate-200/60 dark:border-dark-100 p-6 animate-pulse">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-dark-100"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-slate-200 dark:bg-dark-100 rounded-full w-24"></div>
                      <div className="h-3 bg-slate-200 dark:bg-dark-100 rounded-full w-16"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-dark-100 rounded-full w-3/4"></div>
                    <div className="h-4 bg-slate-200 dark:bg-dark-100 rounded-full w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white dark:bg-dark-0 rounded-2xl border border-slate-200/60 dark:border-dark-100 p-12 text-center">
              <Icons.ForYou className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No recommendations yet</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Interact with more posts to get recommendations</p>
            </div>
          ) : (
            <div className="space-y-2">
              {posts.map((post: any) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-dark-50 rounded-2xl border border-slate-200/60 dark:border-dark-100 p-6 hover:shadow-md transition-all"
                >
                  <div className="flex items-center space-x-3 mb-4">
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
                      <Link href={`/profile/${post.author.username}`} className="font-medium text-slate-900 dark:text-white hover:underline text-sm">
                        {post.author.displayName}
                      </Link>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        @{post.author.username} · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 mb-3 text-sm leading-relaxed">{post.content}</p>
                  {post.hashtags?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {post.hashtags.map((tag: string) => (
                        <span key={tag} className="tag-premium">
                          <Icons.Hash className="w-3 h-3 mr-1" />{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Suggested Users */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
            <Icons.Profile className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <span>Suggested Users</span>
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-dark-0 rounded-2xl border border-slate-200/60 dark:border-dark-100 p-4 animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-dark-100"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 dark:bg-dark-100 rounded-full w-20"></div>
                      <div className="h-3 bg-slate-200 dark:bg-dark-100 rounded-full w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user: any) => (
                <div
                  key={user.id}
                  onClick={() => router.push(`/profile/${user.username}`)}
                  className="bg-white dark:bg-dark-50 rounded-2xl border border-slate-200/60 dark:border-dark-100 p-4 cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex items-center space-x-3">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-md flex-shrink-0">
                        {user.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 dark:text-white truncate">{user.displayName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">@{user.username}</p>
                      {user.bio && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 line-clamp-1">{user.bio}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
