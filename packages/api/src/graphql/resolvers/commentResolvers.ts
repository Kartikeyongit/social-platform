import { PrismaClient } from '@prisma/client';
import { GraphQLError } from 'graphql';

interface Context {
  prisma: PrismaClient;
  userId?: string;
}

export const commentResolvers = {
  Mutation: {
    createComment: async (_: any, { input }: any, { userId, prisma }: Context) => {
      if (!userId) throw new GraphQLError('Not authenticated');
      
      const post = await prisma.post.findUnique({ where: { id: input.postId } });
      if (!post) throw new GraphQLError('Post not found');
      
      const comment = await prisma.comment.create({
        data: {
          content: input.content,
          postId: input.postId,
          authorId: userId,
        },
        include: { author: true },
      });
      
      // Update comment count
      await prisma.post.update({
        where: { id: input.postId },
        data: { commentCount: { increment: 1 } },
      });
      
      // Create notification
      if (post.authorId !== userId) {
        await prisma.notification.create({
          data: {
            userId: post.authorId,
            type: 'COMMENT',
            actorId: userId,
            entityId: input.postId,
          },
        });
      }
      
      return comment;
    },
  },
  
  Post: {
    comments: async (parent: any, { limit = 10, cursor }: any, { prisma }: Context) => {
      const comments = await prisma.comment.findMany({
        where: {
          postId: parent.id,
          ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        include: { author: true },
      });
      
      const hasNextPage = comments.length > limit;
      const edges = comments.slice(0, limit).map(comment => ({
        node: comment,
        cursor: comment.createdAt.toISOString(),
      }));
      
      return {
        edges,
        pageInfo: { hasNextPage, endCursor: edges[edges.length - 1]?.cursor || null },
      };
    },
  },
};