import DataLoader from 'dataloader';
import type { PrismaClient } from '@prisma/client';

// Per-request DataLoaders. Created fresh for every request in the context
// factory so batches never leak between requests.
export function createLoaders(prisma: PrismaClient) {
  return {
    followerCountLoader: new DataLoader<string, number>(async (userIds) => {
      const rows = await prisma.follow.groupBy({
        by: ['followingId'],
        where: { followingId: { in: [...userIds] } },
        _count: { _all: true },
      });
      const counts = new Map(rows.map((r) => [r.followingId, r._count._all]));
      return userIds.map((id) => counts.get(id) ?? 0);
    }),

    followingCountLoader: new DataLoader<string, number>(async (userIds) => {
      const rows = await prisma.follow.groupBy({
        by: ['followerId'],
        where: { followerId: { in: [...userIds] } },
        _count: { _all: true },
      });
      const counts = new Map(rows.map((r) => [r.followerId, r._count._all]));
      return userIds.map((id) => counts.get(id) ?? 0);
    }),

    postCountLoader: new DataLoader<string, number>(async (userIds) => {
      const rows = await prisma.post.groupBy({
        by: ['authorId'],
        where: { authorId: { in: [...userIds] } },
        _count: { _all: true },
      });
      const counts = new Map(rows.map((r) => [r.authorId, r._count._all]));
      return userIds.map((id) => counts.get(id) ?? 0);
    }),

    // Key format: `${followerId}:${followingId}`
    isFollowingLoader: new DataLoader<string, boolean>(async (keys) => {
      const pairs = keys.map((key) => {
        const [followerId, followingId] = key.split(':');
        return { followerId, followingId };
      });
      const rows = await prisma.follow.findMany({
        where: {
          OR: pairs.map((p) => ({ followerId: p.followerId, followingId: p.followingId })),
        },
        select: { followerId: true, followingId: true },
      });
      const found = new Set(rows.map((r) => `${r.followerId}:${r.followingId}`));
      return keys.map((key) => found.has(key));
    }),

    // Key format: `${postId}:${userId}`
    isLikedLoader: new DataLoader<string, boolean>(async (keys) => {
      const pairs = keys.map((key) => {
        const [postId, userId] = key.split(':');
        return { postId, userId };
      });
      const rows = await prisma.like.findMany({
        where: {
          OR: pairs.map((p) => ({ postId: p.postId, userId: p.userId })),
        },
        select: { postId: true, userId: true },
      });
      const found = new Set(rows.map((r) => `${r.postId}:${r.userId}`));
      return keys.map((key) => found.has(key));
    }),

    userByIdLoader: new DataLoader<string, any>(async (ids) => {
      const rows = await prisma.user.findMany({ where: { id: { in: [...ids] } } });
      const byId = new Map(rows.map((u) => [u.id, u]));
      return ids.map((id) => byId.get(id) ?? null);
    }),
  };
}

export type Loaders = ReturnType<typeof createLoaders>;
