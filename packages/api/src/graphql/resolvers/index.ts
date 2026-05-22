import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import { suggestHashtags } from '../../utils/aiSuggestions';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface Context {
  prisma: PrismaClient;
  redis: Redis;
  userId?: string;
}

export const resolvers = {
  Query: {
    me: async (_: any, __: any, { userId }: Context) => {
      if (!userId) throw new GraphQLError('Not authenticated');
      return prisma.user.findUnique({ where: { id: userId } });
    },
    
    user: async (_: any, { username }: { username: string }) => {
      return prisma.user.findUnique({ where: { username } });
    },
    
    post: async (_: any, { id }: { id: string }) => {
      const post = await prisma.post.findUnique({
        where: { id },
        include: { author: true },
      });
      if (!post) throw new GraphQLError('Post not found');
      return post;
    },
    
    feed: async (_: any, { limit = 10, cursor }: any, { userId }: Context) => {
      if (!userId) throw new GraphQLError('Not authenticated');
      
      // Get all following + self
      const following = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      const followingIds = following.map(f => f.followingId);
      followingIds.push(userId);
      
      // Fetch posts - get one extra to know if there are more
      const posts = await prisma.post.findMany({
        where: {
          authorId: { in: followingIds },
          ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1, // Take one extra
        include: { author: true },
      });
      
      const hasNextPage = posts.length > limit;
      const resultPosts = posts.slice(0, limit);
      
      const edges = resultPosts.map(post => ({
        node: post,
        cursor: post.createdAt.toISOString(),
      }));
      
      return {
        edges,
        pageInfo: {
          hasNextPage,
          endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
        },
      };
    },
    
    exploreFeed: async (_: any, { limit = 20, cursor }: any) => {
      const posts = await prisma.post.findMany({
        ...(cursor ? { where: { createdAt: { lt: new Date(cursor) } } } : {}),
        orderBy: [{ likeCount: 'desc' }, { createdAt: 'desc' }],
        take: limit + 1,
        include: { author: true },
      });
      
      const hasNextPage = posts.length > limit;
      const resultPosts = posts.slice(0, limit);
      const edges = resultPosts.map(post => ({ node: post, cursor: post.createdAt.toISOString() }));
      return { edges, pageInfo: { hasNextPage, endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null } };
    },
    
    userPosts: async (_: any, { username, limit = 20, cursor }: any) => {
      const user = await prisma.user.findUnique({ where: { username } });
      if (!user) throw new GraphQLError('User not found');
      
      const posts = await prisma.post.findMany({
        where: { authorId: user.id, ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}) },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        include: { author: true },
      });
      
      const hasNextPage = posts.length > limit;
      const resultPosts = posts.slice(0, limit);
      const edges = resultPosts.map(post => ({ node: post, cursor: post.createdAt.toISOString() }));
      return { edges, pageInfo: { hasNextPage, endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null } };
    },
    
    trendingHashtags: async (_: any, { limit = 10 }: any) => {
      const cached = await redis.get('trending:hashtags');
      if (cached) return JSON.parse(cached);
      
      const hashtags = await prisma.hashtag.findMany({ orderBy: { postCount: 'desc' }, take: limit });
      await redis.setex('trending:hashtags', 300, JSON.stringify(hashtags));
      return hashtags;
    },
    
    searchUsers: async (_: any, { query, limit = 10 }: any) => {
      return prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { displayName: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
      });
    },
    
    searchHashtags: async (_: any, { query, limit = 10 }: any) => {
      return prisma.hashtag.findMany({
        where: { name: { contains: query, mode: 'insensitive' } },
        orderBy: { postCount: 'desc' },
        take: limit,
      });
    },
    
    suggestHashtags: async (_: any, { content }: { content: string }) => {
      return suggestHashtags(content);
    },
    
    conversations: async (_: any, __: any, { userId }: Context) => {
      if (!userId) throw new GraphQLError('Not authenticated');
      const messages = await prisma.message.findMany({
        where: { OR: [{ senderId: userId }, { receiverId: userId }] },
        orderBy: { createdAt: 'desc' },
        select: { senderId: true, receiverId: true },
        take: 100,
      });
      const partnerIds = new Set<string>();
      messages.forEach(m => {
        if (m.senderId !== userId) partnerIds.add(m.senderId);
        if (m.receiverId !== userId) partnerIds.add(m.receiverId);
      });
      return prisma.user.findMany({ where: { id: { in: [...partnerIds] } } });
    },
    
    messages: async (_: any, { receiverId, limit = 50 }: any, { userId }: Context) => {
      if (!userId) throw new GraphQLError('Not authenticated');
      const messages = await prisma.message.findMany({
        where: { OR: [{ senderId: userId, receiverId }, { senderId: receiverId, receiverId: userId }] },
        orderBy: { createdAt: 'asc' },
        take: limit + 1,
        include: { sender: true, receiver: true },
      });
      const hasNextPage = messages.length > limit;
      const resultMessages = messages.slice(0, limit);
      const edges = resultMessages.map(msg => ({ node: msg, cursor: msg.createdAt.toISOString() }));
      return { edges, pageInfo: { hasNextPage, endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null } };
    },
    
    notifications: async (_: any, { limit = 20 }: any, { userId }: Context) => {
      if (!userId) throw new GraphQLError('Not authenticated');
      return prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: limit });
    },
    
    unreadNotificationCount: async (_: any, __: any, { userId }: Context) => {
      if (!userId) return 0;
      return prisma.notification.count({ where: { userId, read: false } });
    },
    
    recommendedPosts: async (_: any, { limit = 10 }: any, { userId }: Context) => {
      if (!userId) throw new GraphQLError('Not authenticated');
      return prisma.post.findMany({
        where: { authorId: { not: userId } },
        orderBy: { likeCount: 'desc' },
        take: limit,
        include: { author: true },
      });
    },
    
    suggestedUsers: async (_: any, { limit = 10 }: any, { userId }: Context) => {
      if (!userId) throw new GraphQLError('Not authenticated');
      const following = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      const followingIds = following.map(f => f.followingId);
      return prisma.user.findMany({
        where: { id: { notIn: [...followingIds, userId] } },
        take: limit,
      });
    },

    followers: async (_: any, { username }: { username: string }) => {
      const user = await prisma.user.findUnique({ where: { username } });
      if (!user) throw new GraphQLError('User not found');
      const followers = await prisma.follow.findMany({
        where: { followingId: user.id },
        include: { follower: true },
      });
      return followers.map(f => f.follower);
    },

    following: async (_: any, { username }: { username: string }) => {
      const user = await prisma.user.findUnique({ where: { username } });
      if (!user) throw new GraphQLError('User not found');
      const following = await prisma.follow.findMany({
        where: { followerId: user.id },
        include: { following: true },
      });
      return following.map(f => f.following);
    },
  },
  
  Mutation: {
    register: async (_: any, args: any) => {
      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email: args.email }, { username: args.username }] },
      });
      if (existingUser) throw new GraphQLError('Email or username already exists');
      const passwordHash = await bcrypt.hash(args.password, 10);
      const user = await prisma.user.create({
        data: { username: args.username, email: args.email, passwordHash, displayName: args.displayName },
      });
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
      return { token, user };
    },
    
    login: async (_: any, { email, password }: any) => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new GraphQLError('Invalid credentials');
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) throw new GraphQLError('Invalid credentials');
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
      return { token, user };
    },
    
    updateProfile: async (_: any, { input }: any, { userId }: Context) => {
      if (!userId) throw new GraphQLError('Not authenticated');
      return prisma.user.update({
        where: { id: userId },
        data: {
          ...(input.displayName && { displayName: input.displayName }),
          ...(input.bio !== undefined && { bio: input.bio }),
          ...(input.avatarUrl && { avatarUrl: input.avatarUrl }),
        },
      });
    },
    
    createPost: async (_: any, { input }: any, { userId }: Context) => {
      if (!userId) throw new GraphQLError('Not authenticated');
      const post = await prisma.post.create({
        data: { content: input.content, hashtags: input.hashtags || [], mediaUrls: input.mediaUrls || [], authorId: userId },
        include: { author: true },
      });
      if (post.hashtags.length > 0) {
        for (const tag of post.hashtags) {
          await prisma.hashtag.upsert({
            where: { name: tag },
            create: { name: tag, postCount: 1 },
            update: { postCount: { increment: 1 } },
          });
        }
        await redis.del('trending:hashtags');
      }
      return post;
    },
    
    likePost: async (_: any, { postId }: any, { userId }: Context) => {
      if (!userId) throw new GraphQLError('Not authenticated');
      const existingLike = await prisma.like.findUnique({ where: { postId_userId: { postId, userId } } });
      if (!existingLike) {
        await prisma.like.create({ data: { postId, userId } });
        const post = await prisma.post.update({
          where: { id: postId },
          data: { likeCount: { increment: 1 } },
          include: { author: true },
        });
        if (post.authorId !== userId) {
          await prisma.notification.create({
            data: { userId: post.authorId, type: 'LIKE', actorId: userId, entityId: postId },
          });
        }
        return post;
      }
      return prisma.post.findUnique({ where: { id: postId }, include: { author: true } });
    },
    
    unlikePost: async (_: any, { postId }: any, { userId }: Context) => {
      if (!userId) throw new GraphQLError('Not authenticated');
      const like = await prisma.like.findUnique({ where: { postId_userId: { postId, userId } } });
      if (like) {
        await prisma.like.delete({ where: { id: like.id } });
        await prisma.post.update({ where: { id: postId }, data: { likeCount: { decrement: 1 } } });
      }
      return prisma.post.findUnique({ where: { id: postId }, include: { author: true } });
    },
    
    createComment: async (_: any, { input }: any, { userId }: Context) => {
      if (!userId) throw new GraphQLError('Not authenticated');
      const post = await prisma.post.findUnique({ where: { id: input.postId } });
      if (!post) throw new GraphQLError('Post not found');
      const comment = await prisma.comment.create({
        data: { content: input.content, postId: input.postId, authorId: userId },
        include: { author: true },
      });
      await prisma.post.update({ where: { id: input.postId }, data: { commentCount: { increment: 1 } } });
      if (post.authorId !== userId) {
        await prisma.notification.create({
          data: { userId: post.authorId, type: 'COMMENT', actorId: userId, entityId: input.postId },
        });
      }
      return comment;
    },
    
    followUser: async (_: any, { userId: targetUserId }: any, { userId }: Context) => {
      if (!userId) throw new GraphQLError('Not authenticated');
      if (userId === targetUserId) throw new GraphQLError('Cannot follow yourself');
      const existing = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: userId, followingId: targetUserId } },
      });
      if (!existing) {
        await prisma.follow.create({ data: { followerId: userId, followingId: targetUserId } });
        // CREATE NOTIFICATION
        await prisma.notification.create({
          data: { userId: targetUserId, type: 'FOLLOW', actorId: userId, entityId: userId },
        });
      }
      return prisma.user.findUnique({ where: { id: targetUserId } });
    },
    
    unfollowUser: async (_: any, { userId: targetUserId }: any, { userId }: Context) => {
      if (!userId) throw new GraphQLError('Not authenticated');
      await prisma.follow.deleteMany({ where: { followerId: userId, followingId: targetUserId } });
      return prisma.user.findUnique({ where: { id: targetUserId } });
    },
    
    sendMessage: async (_: any, { input }: any, { userId }: Context) => {
      if (!userId) throw new GraphQLError('Not authenticated');
      return prisma.message.create({
        data: { content: input.content, senderId: userId, receiverId: input.receiverId },
        include: { sender: true, receiver: true },
      });
    },
    
    markNotificationRead: async (_: any, { notificationId }: any, { userId }: Context) => {
      if (!userId) throw new GraphQLError('Not authenticated');
      await prisma.notification.updateMany({ where: { id: notificationId, userId }, data: { read: true } });
      return true;
    },
    
    markAllNotificationsRead: async (_: any, __: any, { userId }: Context) => {
      if (!userId) throw new GraphQLError('Not authenticated');
      await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
      return true;
    },
    
    markMessageRead: async (_: any, { messageId }: any, { userId }: Context) => {
      if (!userId) throw new GraphQLError('Not authenticated');
      await prisma.message.updateMany({ where: { id: messageId, receiverId: userId }, data: { read: true } });
      return true;
    },
    
    deletePost: async (_: any, { id }: any, { userId }: Context) => {
      if (!userId) throw new GraphQLError('Not authenticated');
      const post = await prisma.post.findUnique({ where: { id } });
      if (!post || post.authorId !== userId) throw new GraphQLError('Not authorized');
      await prisma.post.delete({ where: { id } });
      return true;
    },
  },
  
  User: {
    followerCount: async (parent: any) => prisma.follow.count({ where: { followingId: parent.id } }),
    followingCount: async (parent: any) => prisma.follow.count({ where: { followerId: parent.id } }),
    postCount: async (parent: any) => prisma.post.count({ where: { authorId: parent.id } }),
    isFollowing: async (parent: any, _: any, { userId }: Context) => {
      if (!userId || userId === parent.id) return false;
      const follow = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: userId, followingId: parent.id } },
      });
      return !!follow;
    },
  },
  
  Post: {
    isLiked: async (parent: any, _: any, { userId }: Context) => {
      if (!userId) return false;
      const like = await prisma.like.findUnique({
        where: { postId_userId: { postId: parent.id, userId } },
      });
      return !!like;
    },
    comments: async (parent: any, { limit = 10, cursor }: any) => {
      const comments = await prisma.comment.findMany({
        where: { postId: parent.id, ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}) },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        include: { author: true },
      });
      const hasNextPage = comments.length > limit;
      const resultComments = comments.slice(0, limit);
      const edges = resultComments.map(c => ({ node: c, cursor: c.createdAt.toISOString() }));
      return { edges, pageInfo: { hasNextPage, endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null } };
    },
  },
  
  Notification: {
    actor: async (parent: any) => prisma.user.findUnique({ where: { id: parent.actorId } }),
  },
};
