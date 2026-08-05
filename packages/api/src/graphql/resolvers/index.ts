import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import bcrypt from 'bcryptjs';
import { GraphQLError } from 'graphql';
import {
  RegisterSchema,
  LoginSchema,
  UpdateProfileSchema,
  CreatePostSchema,
  CreateCommentSchema,
  SendMessageSchema,
} from '@social/shared';
import { suggestHashtags } from '../../utils/aiSuggestions';
import { signToken } from '../../utils/auth';
import { config } from '../../utils/config';

const prisma = new PrismaClient();
const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 2,
  retryStrategy: (times) => Math.min(times * 200, 2000),
});
redis.on('error', (err) => console.error('Redis error:', err.message));

// Cache failures must never break core features - degrade to direct DB access
const safeRedis = {
  get: async (key: string): Promise<string | null> => {
    try { return await redis.get(key); } catch { return null; }
  },
  setex: async (key: string, seconds: number, value: string): Promise<void> => {
    try { await redis.setex(key, seconds, value); } catch { /* noop */ }
  },
  del: async (key: string): Promise<void> => {
    try { await redis.del(key); } catch { /* noop */ }
  },
};

interface Context {
  prisma: PrismaClient;
  redis: Redis;
  userId?: string;
}

function validate<T>(schema: { safeParse: (data: unknown) => { success: boolean; error?: { issues: { path: (string | number)[]; message: string }[] } } }, data: T): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error?.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new GraphQLError(`Invalid input: ${details}`, { extensions: { code: 'BAD_USER_INPUT' } });
  }
  return data;
}

function clampLimit(limit: any, def = 20, max = 50): number {
  const n = Number(limit);
  if (!Number.isFinite(n) || n <= 0) return def;
  return Math.min(Math.floor(n), max);
}

interface Cursor {
  createdAt: Date;
  id?: string;
}

function encodeCursor(createdAt: Date, id: string): string {
  return `${createdAt.toISOString()}_${id}`;
}

function decodeCursor(cursor?: string | null): Cursor | null {
  if (!cursor) return null;
  const sep = cursor.indexOf('_');
  const dateStr = sep === -1 ? cursor : cursor.slice(0, sep);
  const createdAt = new Date(dateStr);
  if (isNaN(createdAt.getTime())) return null;
  return { createdAt, id: sep === -1 ? undefined : cursor.slice(sep + 1) };
}

// Rows that come "before" the cursor in a (createdAt desc, id desc) ordering
function beforeCursorFilter(cursor: Cursor, composite = true): any {
  if (composite && cursor.id) {
    return {
      OR: [
        { createdAt: { lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, id: { lt: cursor.id } },
      ],
    };
  }
  return { createdAt: { lt: cursor.createdAt } };
}

// Rows that come "after" the cursor in a (createdAt asc, id asc) ordering
function afterCursorFilter(cursor: Cursor, composite = true): any {
  if (composite && cursor.id) {
    return {
      OR: [
        { createdAt: { gt: cursor.createdAt } },
        { createdAt: cursor.createdAt, id: { gt: cursor.id } },
      ],
    };
  }
  return { createdAt: { gt: cursor.createdAt } };
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
    
    feed: async (_: any, { limit, cursor }: any, { userId }: Context) => {
      if (!userId) throw new GraphQLError('Not authenticated');
      const take = clampLimit(limit);
      const cursorData = decodeCursor(cursor);
      
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
          ...(cursorData ? beforeCursorFilter(cursorData) : {}),
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: take + 1, // Take one extra
        include: { author: true },
      });
      
      const hasNextPage = posts.length > take;
      const resultPosts = posts.slice(0, take);
      
      const edges = resultPosts.map(post => ({
        node: post,
        cursor: encodeCursor(post.createdAt, post.id),
      }));
      
      return {
        edges,
        pageInfo: {
          hasNextPage,
          endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
        },
      };
    },
    
    exploreFeed: async (_: any, { limit, cursor }: any) => {
      const take = clampLimit(limit);
      const cursorData = decodeCursor(cursor);
      const posts = await prisma.post.findMany({
        ...(cursorData ? { where: beforeCursorFilter(cursorData, false) } : {}),
        orderBy: [{ likeCount: 'desc' }, { createdAt: 'desc' }],
        take: take + 1,
        include: { author: true },
      });
      
      const hasNextPage = posts.length > take;
      const resultPosts = posts.slice(0, take);
      const edges = resultPosts.map(post => ({ node: post, cursor: encodeCursor(post.createdAt, post.id) }));
      return { edges, pageInfo: { hasNextPage, endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null } };
    },
    
    userPosts: async (_: any, { username, limit, cursor }: any) => {
      const take = clampLimit(limit);
      const user = await prisma.user.findUnique({ where: { username } });
      if (!user) throw new GraphQLError('User not found');
      
      const cursorData = decodeCursor(cursor);
      const posts = await prisma.post.findMany({
        where: { authorId: user.id, ...(cursorData ? beforeCursorFilter(cursorData) : {}) },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: take + 1,
        include: { author: true },
      });
      
      const hasNextPage = posts.length > take;
      const resultPosts = posts.slice(0, take);
      const edges = resultPosts.map(post => ({ node: post, cursor: encodeCursor(post.createdAt, post.id) }));
      return { edges, pageInfo: { hasNextPage, endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null } };
    },
    
    trendingHashtags: async (_: any, { limit = 10 }: any) => {
      const take = clampLimit(limit, 10, 30);
      const cached = await safeRedis.get('trending:hashtags');
      if (cached) return JSON.parse(cached);
      
      const hashtags = await prisma.hashtag.findMany({ orderBy: { postCount: 'desc' }, take });
      await safeRedis.setex('trending:hashtags', 300, JSON.stringify(hashtags));
      return hashtags;
    },
    
    searchUsers: async (_: any, { query, limit = 10 }: any) => {
      if (!query || !query.trim()) throw new GraphQLError('Search query is required');
      return prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: query.trim(), mode: 'insensitive' } },
            { displayName: { contains: query.trim(), mode: 'insensitive' } },
          ],
        },
        take: clampLimit(limit, 10, 20),
      });
    },
    
    searchHashtags: async (_: any, { query, limit = 10 }: any) => {
      if (!query || !query.trim()) throw new GraphQLError('Search query is required');
      return prisma.hashtag.findMany({
        where: { name: { contains: query.trim(), mode: 'insensitive' } },
        orderBy: { postCount: 'desc' },
        take: clampLimit(limit, 10, 20),
      });
    },
    
    suggestHashtags: async (_: any, { content }: { content: string }) => {
      return suggestHashtags(content);
    },
    
    conversations: async (_: any, { limit, cursor }: any, { userId }: Context) => {
      if (!userId) throw new GraphQLError('Not authenticated');
      const take = clampLimit(limit);
      const cursorDate = decodeCursor(cursor)?.createdAt;

      // Latest message per partner (sent and received sides)
      const [sent, received] = await Promise.all([
        prisma.message.findMany({
          where: { senderId: userId },
          distinct: ['receiverId'],
          orderBy: [{ receiverId: 'asc' }, { createdAt: 'desc' }],
          select: { receiverId: true, createdAt: true },
        }),
        prisma.message.findMany({
          where: { receiverId: userId },
          distinct: ['senderId'],
          orderBy: [{ senderId: 'asc' }, { createdAt: 'desc' }],
          select: { senderId: true, createdAt: true },
        }),
      ]);

      const latestByPartner = new Map<string, Date>();
      for (const m of sent) latestByPartner.set(m.receiverId, m.createdAt);
      for (const m of received) {
        const existing = latestByPartner.get(m.senderId);
        if (!existing || m.createdAt > existing) latestByPartner.set(m.senderId, m.createdAt);
      }

      let partners = [...latestByPartner.entries()].sort((a, b) => b[1].getTime() - a[1].getTime());
      if (cursorDate) partners = partners.filter(([, d]) => d.getTime() < cursorDate.getTime());
      partners = partners.slice(0, take);

      if (partners.length === 0) return [];
      const users = await prisma.user.findMany({ where: { id: { in: partners.map(([id]) => id) } } });
      const order = new Map(partners.map(([id], i) => [id, i]));
      return users.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    },
    
    messages: async (_: any, { receiverId, limit, cursor }: any, { userId }: Context) => {
      if (!userId) throw new GraphQLError('Not authenticated');
      const take = clampLimit(limit);
      const cursorData = decodeCursor(cursor);
      const messages = await prisma.message.findMany({
        where: {
          OR: [{ senderId: userId, receiverId }, { senderId: receiverId, receiverId: userId }],
          ...(cursorData ? afterCursorFilter(cursorData) : {}),
        },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        take: take + 1,
        include: { sender: true, receiver: true },
      });
      const hasNextPage = messages.length > take;
      const resultMessages = messages.slice(0, take);
      const edges = resultMessages.map(msg => ({ node: msg, cursor: encodeCursor(msg.createdAt, msg.id) }));
      return { edges, pageInfo: { hasNextPage, endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null } };
    },
    
    notifications: async (_: any, { limit, cursor }: any, { userId }: Context) => {
      if (!userId) throw new GraphQLError('Not authenticated');
      const take = clampLimit(limit);
      const cursorData = decodeCursor(cursor);
      return prisma.notification.findMany({
        where: { userId, ...(cursorData ? beforeCursorFilter(cursorData) : {}) },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take,
      });
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
        take: clampLimit(limit, 10, 30),
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
        take: clampLimit(limit, 10, 30),
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
      const input = validate(RegisterSchema, args);
      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email: input.email }, { username: input.username }] },
      });
      if (existingUser) throw new GraphQLError('Email or username already exists');
      const passwordHash = await bcrypt.hash(input.password, 10);
      let user;
      try {
        user = await prisma.user.create({
          data: { username: input.username, email: input.email, passwordHash, displayName: input.displayName },
        });
      } catch (error: any) {
        // Race: another request created the user first
        if (error?.code === 'P2002') throw new GraphQLError('Email or username already exists');
        throw error;
      }
      const token = signToken(user.id);
      return { token, user: { ...user, __self: true } };
    },
    
    login: async (_: any, { email, password }: any) => {
      const input = validate(LoginSchema, { email, password });
      const user = await prisma.user.findUnique({ where: { email: input.email } });
      if (!user) throw new GraphQLError('Invalid credentials');
      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) throw new GraphQLError('Invalid credentials');
      const token = signToken(user.id);
      return { token, user: { ...user, __self: true } };
    },
    
    updateProfile: async (_: any, { input }: any, { userId }: Context) => {
      if (!userId) throw new GraphQLError('Not authenticated');
      const data = validate(UpdateProfileSchema, input);
      return prisma.user.update({
        where: { id: userId },
        data: {
          ...(data.displayName && data.displayName.trim() ? { displayName: data.displayName } : {}),
          ...(data.bio !== undefined ? { bio: data.bio } : {}),
          ...(data.avatarUrl ? { avatarUrl: data.avatarUrl } : {}),
        },
      });
    },
    
    createPost: async (_: any, { input }: any, { userId }: Context) => {
      if (!userId) throw new GraphQLError('Not authenticated');
      const data = validate(CreatePostSchema, input);
      const post = await prisma.$transaction(async (tx) => {
        const created = await tx.post.create({
          data: { content: data.content, hashtags: data.hashtags, mediaUrls: data.mediaUrls, authorId: userId },
          include: { author: true },
        });
        if (created.hashtags.length > 0) {
          for (const tag of created.hashtags) {
            await tx.hashtag.upsert({
              where: { name: tag },
              create: { name: tag, postCount: 1 },
              update: { postCount: { increment: 1 } },
            });
          }
        }
        return created;
      });
      if (post.hashtags.length > 0) {
        await safeRedis.del('trending:hashtags');
      }
      return post;
    },
    
    likePost: async (_: any, { postId }: any, { userId }: Context) => {
      if (!userId) throw new GraphQLError('Not authenticated');
      const existingLike = await prisma.like.findUnique({ where: { postId_userId: { postId, userId } } });
      if (existingLike) {
        return prisma.post.findUnique({ where: { id: postId }, include: { author: true } });
      }
      try {
        return await prisma.$transaction(async (tx) => {
          const like = await tx.like.create({ data: { postId, userId } });
          const post = await tx.post.update({
            where: { id: postId },
            data: { likeCount: { increment: 1 } },
            include: { author: true },
          });
          if (post.authorId !== userId) {
            await tx.notification.create({
              data: { userId: post.authorId, type: 'LIKE', actorId: userId, entityId: postId },
            });
          }
          return post;
        });
      } catch (error: any) {
        // Race: another request created the like first - treat as idempotent
        if (error?.code === 'P2002') {
          return prisma.post.findUnique({ where: { id: postId }, include: { author: true } });
        }
        throw error;
      }
    },
    
    unlikePost: async (_: any, { postId }: any, { userId }: Context) => {
      if (!userId) throw new GraphQLError('Not authenticated');
      const post = await prisma.post.findUnique({ where: { id: postId } });
      if (!post) throw new GraphQLError('Post not found');
      const like = await prisma.like.findUnique({ where: { postId_userId: { postId, userId } } });
      if (like) {
        await prisma.$transaction(async (tx) => {
          await tx.like.delete({ where: { id: like.id } });
          await tx.post.update({ where: { id: postId }, data: { likeCount: { decrement: 1 } } });
          await tx.notification.deleteMany({
            where: { userId: post.authorId, type: 'LIKE', actorId: userId, entityId: postId },
          });
        });
      }
      return prisma.post.findUnique({ where: { id: postId }, include: { author: true } });
    },
    
    createComment: async (_: any, { input }: any, { userId }: Context) => {
      if (!userId) throw new GraphQLError('Not authenticated');
      const data = validate(CreateCommentSchema, input);
      const post = await prisma.post.findUnique({ where: { id: data.postId } });
      if (!post) throw new GraphQLError('Post not found');
      return prisma.$transaction(async (tx) => {
        const comment = await tx.comment.create({
          data: { content: data.content, postId: data.postId, authorId: userId },
          include: { author: true },
        });
        await tx.post.update({ where: { id: data.postId }, data: { commentCount: { increment: 1 } } });
        if (post.authorId !== userId) {
          await tx.notification.create({
            data: { userId: post.authorId, type: 'COMMENT', actorId: userId, entityId: data.postId },
          });
        }
        return comment;
      });
    },
    
    followUser: async (_: any, { userId: targetUserId }: any, { userId }: Context) => {
      if (!userId) throw new GraphQLError('Not authenticated');
      if (userId === targetUserId) throw new GraphQLError('Cannot follow yourself');
      const target = await prisma.user.findUnique({ where: { id: targetUserId } });
      if (!target) throw new GraphQLError('User not found');
      const existing = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: userId, followingId: targetUserId } },
      });
      if (!existing) {
        try {
          await prisma.$transaction(async (tx) => {
            await tx.follow.create({ data: { followerId: userId, followingId: targetUserId } });
            await tx.notification.deleteMany({
              where: { userId: targetUserId, type: 'FOLLOW', actorId: userId },
            });
            await tx.notification.create({
              data: { userId: targetUserId, type: 'FOLLOW', actorId: userId, entityId: userId },
            });
          });
        } catch (error: any) {
          // Race: follow already created by another request - idempotent
          if (error?.code !== 'P2002') throw error;
        }
      }
      return target;
    },
    
    unfollowUser: async (_: any, { userId: targetUserId }: any, { userId }: Context) => {
      if (!userId) throw new GraphQLError('Not authenticated');
      await prisma.follow.deleteMany({ where: { followerId: userId, followingId: targetUserId } });
      return prisma.user.findUnique({ where: { id: targetUserId } });
    },

    removeFollower: async (_: any, { followerId }: any, { userId }: Context) => {
      if (!userId) throw new GraphQLError('Not authenticated');
      await prisma.follow.deleteMany({ where: { followerId, followingId: userId } });
      return prisma.user.findUnique({ where: { id: followerId } });
    },
    
    sendMessage: async (_: any, { input }: any, { userId }: Context) => {
      if (!userId) throw new GraphQLError('Not authenticated');
      const data = validate(SendMessageSchema, input);
      if (data.receiverId === userId) throw new GraphQLError('Cannot message yourself');
      const receiver = await prisma.user.findUnique({ where: { id: data.receiverId } });
      if (!receiver) throw new GraphQLError('Receiver not found');
      return prisma.message.create({
        data: { content: data.content, senderId: userId, receiverId: data.receiverId },
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
      await prisma.$transaction(async (tx) => {
        await tx.post.delete({ where: { id } });
        if (post.hashtags.length > 0) {
          for (const tag of post.hashtags) {
            await tx.hashtag.updateMany({
              where: { name: tag, postCount: { gt: 0 } },
              data: { postCount: { decrement: 1 } },
            });
          }
        }
      });
      if (post.hashtags.length > 0) {
        await safeRedis.del('trending:hashtags');
      }
      return true;
    },
  },
  
  User: {
    email: (parent: any, _: any, { userId }: Context) => {
      if (parent.__self) return parent.email;
      if (!userId || parent.id !== userId) return null;
      return parent.email;
    },
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
    comments: async (parent: any, { limit, cursor }: any) => {
      const take = clampLimit(limit, 10, 30);
      const cursorData = decodeCursor(cursor);
      const comments = await prisma.comment.findMany({
        where: { postId: parent.id, ...(cursorData ? beforeCursorFilter(cursorData) : {}) },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: take + 1,
        include: { author: true },
      });
      const hasNextPage = comments.length > take;
      const resultComments = comments.slice(0, take);
      const edges = resultComments.map(c => ({ node: c, cursor: encodeCursor(c.createdAt, c.id) }));
      return { edges, pageInfo: { hasNextPage, endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null } };
    },
  },
  
  Notification: {
    actor: async (parent: any) => prisma.user.findUnique({ where: { id: parent.actorId } }),
  },
};
