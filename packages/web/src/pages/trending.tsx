import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { motion } from 'framer-motion';
import { Icons } from '@/components/icons';
import { Flame } from 'lucide-react';

const TRENDING_DATA = gql`
  query TrendingData {
    trendingHashtags(limit: 20) {
      name
      postCount
    }
  }
`;

export default function TrendingPage() {
  const { data, loading } = useQuery(TRENDING_DATA);
  const hashtags = data?.trendingHashtags || [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center space-x-3">
          <Icons.Trending className="w-8 h-8 text-brand-600 dark:text-brand-400" />
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white font-display">Trending</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 mt-1">See what's popular right now</p>
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-dark-50 rounded-3xl border border-slate-200/60 dark:border-dark-100 shadow-soft p-4 animate-pulse">
              <div className="h-5 bg-slate-200 dark:bg-dark-100 rounded-full w-32 mb-2"></div>
              <div className="h-4 bg-slate-200 dark:bg-dark-100 rounded-full w-24"></div>
            </div>
          ))}
        </div>
      ) : hashtags.length === 0 ? (
        <div className="bg-white dark:bg-dark-50 rounded-3xl border border-slate-200/60 dark:border-dark-100 shadow-soft p-12 text-center">
          <Icons.Trending className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Nothing trending right now</p>
        </div>
      ) : (
        <div className="space-y-3">
          {hashtags.map((hashtag: any, index: number) => (
            <div key={hashtag.name} className="bg-white dark:bg-dark-50 rounded-3xl border border-slate-200/60 dark:border-dark-100 shadow-soft p-4 flex items-center justify-between hover-card">
              <div className="flex items-center space-x-4">
                <span className="text-2xl font-bold text-slate-300 dark:text-slate-600 w-8">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <div className="flex items-center space-x-2">
                    <Icons.Hash className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    <p className="font-semibold text-lg text-slate-900 dark:text-white">{hashtag.name}</p>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 ml-7">{hashtag.postCount.toLocaleString()} posts</p>
                </div>
              </div>
              {index < 3 && <Flame className="w-5 h-5 text-orange-500" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
