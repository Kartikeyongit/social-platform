import React from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { UserX, Settings } from 'lucide-react';

const GET_USER = gql`
  query GetUser($username: String!) {
    user(username: $username) {
      id
      username
      displayName
      bio
      avatarUrl
      followerCount
      followingCount
      postCount
      isFollowing
      createdAt
    }
    userPosts(username: $username, limit: 20) {
      edges {
        node {
          id
          content
          hashtags
          likeCount
          commentCount
          createdAt
          author { id username displayName }
        }
      }
    }
  }
`;

const FOLLOW_USER = gql`
  mutation FollowUser($userId: ID!) {
    followUser(userId: $userId) {
      id
      isFollowing
      followerCount
    }
  }
`;

const UNFOLLOW_USER = gql`
  mutation UnfollowUser($userId: ID!) {
    unfollowUser(userId: $userId) {
      id
      isFollowing
      followerCount
    }
  }
`;

export default function ProfilePage() {
  const router = useRouter();
  const { username } = router.query;
  const { user: currentUser } = useAuth();

  const { data, loading, refetch } = useQuery(GET_USER, {
    variables: { username },
    skip: !username,
    fetchPolicy: 'network-only',
  });

  const [followUser] = useMutation(FOLLOW_USER);
  const [unfollowUser] = useMutation(UNFOLLOW_USER);

  const handleFollow = async () => {
    if (!data?.user) return;
    try {
      if (data.user.isFollowing) {
        await unfollowUser({ variables: { userId: data.user.id } });
        toast.success('Unfollowed');
      } else {
        await followUser({ variables: { userId: data.user.id } });
        toast.success('Following!');
      }
      refetch();
    } catch (error) {
      toast.error('Failed to update follow');
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white dark:bg-dark-50 rounded-3xl border border-slate-200/60 dark:border-dark-100 shadow-soft p-8 animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-dark-100"></div>
            <div className="space-y-3 flex-1">
              <div className="h-6 bg-slate-200 dark:bg-dark-100 rounded-full w-48"></div>
              <div className="h-4 bg-slate-200 dark:bg-dark-100 rounded-full w-32"></div>
              <div className="h-4 bg-slate-200 dark:bg-dark-100 rounded-full w-64"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const profileUser = data?.user;
  const posts = data?.userPosts?.edges?.map((edge: any) => edge.node) || [];

  if (!profileUser) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-dark-50 rounded-3xl border border-slate-200/60 dark:border-dark-100 shadow-soft p-12 text-center">
          <UserX className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">User not found</h2>
          <p className="text-slate-500 dark:text-slate-400">The user @{username} doesn't exist</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profileUser.id;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-dark-50 rounded-3xl border border-slate-200/60 dark:border-dark-100 shadow-soft p-8"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-5">
            {profileUser.avatarUrl ? (
              <img src={profileUser.avatarUrl} alt="" className="w-24 h-24 rounded-full object-cover shadow-md" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center text-white text-4xl font-bold shadow-glow flex-shrink-0">
                {profileUser.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display">
                {profileUser.displayName}
              </h1>
              <p className="text-slate-500 dark:text-slate-400">@{profileUser.username}</p>
              {profileUser.bio && (
                <p className="text-slate-700 dark:text-slate-300 mt-2">{profileUser.bio}</p>
              )}
              
              {/* Stats - Clickable */}
              <div className="flex space-x-5 mt-4">
                <div className="text-center">
                  <p className="font-bold text-slate-900 dark:text-white">{profileUser.postCount}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Posts</p>
                </div>
                
                <Link
                  href={`/profile/${profileUser.username}/followers`}
                  className="text-center hover:opacity-80 transition-opacity cursor-pointer no-underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="font-bold text-slate-900 dark:text-white hover:text-brand-600 transition-colors">
                    {profileUser.followerCount}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Followers</p>
                </Link>
                
                <Link
                  href={`/profile/${profileUser.username}/followers`}
                  className="text-center hover:opacity-80 transition-opacity cursor-pointer no-underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="font-bold text-slate-900 dark:text-white hover:text-brand-600 transition-colors">
                    {profileUser.followingCount}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Following</p>
                </Link>
              </div>
              
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
                <Icons.CreatePost className="w-3 h-3 inline mr-1" />
                Joined {formatDistanceToNow(new Date(profileUser.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          
          {/* Action Button */}
          <div className="flex-shrink-0">
            {isOwnProfile ? (
              <Link
                href="/settings/profile"
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-white dark:bg-dark-50 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-full font-medium text-sm hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-dark-100 transition-all shadow-sm"
              >
                <Settings className="w-4 h-4" />
                <span>Edit Profile</span>
              </Link>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleFollow}
                className={profileUser.isFollowing ? 'btn-secondary-premium' : 'btn-primary-premium'}
              >
                {profileUser.isFollowing ? 'Unfollow' : 'Follow'}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* User Posts */}
      <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">Posts</h2>
      
      {posts.length === 0 ? (
        <div className="bg-white dark:bg-dark-50 rounded-3xl border border-slate-200/60 dark:border-dark-100 shadow-soft p-12 text-center">
          <Icons.CreatePost className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No posts yet</h3>
          <p className="text-slate-500 dark:text-slate-400">When they post, it'll show up here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post: any, index: number) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-dark-50 rounded-3xl border border-slate-200/60 dark:border-dark-100 shadow-soft p-6"
            >
              <p className="text-slate-800 dark:text-slate-200 mb-3">{post.content}</p>
              {post.hashtags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.hashtags.map((tag: string) => (
                    <span key={tag} className="tag-premium">
                      <Icons.Hash className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center space-x-6 text-sm text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-dark-100">
                <span className="flex items-center space-x-1">
                  <Icons.Like className="w-4 h-4" />
                  <span>{post.likeCount}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Icons.Comment className="w-4 h-4" />
                  <span>{post.commentCount}</span>
                </span>
                <span className="text-xs">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
