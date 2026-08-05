import { PrismaClient } from '@prisma/client';

// Single shared PrismaClient - resolvers and the server bootstrap use the same pool
export const prisma = new PrismaClient();
