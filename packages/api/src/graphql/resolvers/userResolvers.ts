import { PrismaClient } from '@prisma/client';
import { GraphQLError } from 'graphql';

export const userResolvers = {
  Mutation: {
    updateProfile: async (_: any, { input }: any, { userId, prisma }: { userId: string; prisma: PrismaClient }) => {
      if (!userId) throw new GraphQLError('Not authenticated');
      
      return prisma.user.update({
        where: { id: userId },
        data: {
          displayName: input.displayName,
          bio: input.bio,
          avatarUrl: input.avatarUrl,
        },
      });
    },
  },
};