import type { PrismaClient } from '@prisma/client';

// Username uniqueness is enforced case-insensitively across every allocation
// path (register, OAuth auto-generation, username change). Two handles that
// differ only by casing are treated as the same username.

export async function isUsernameAvailable(
  prisma: PrismaClient,
  username: string,
  excludeUserId?: string,
): Promise<boolean> {
  const existing = await prisma.user.findFirst({
    where: {
      username: { equals: username.trim(), mode: 'insensitive' },
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: { id: true },
  });
  return !existing;
}

// Generates a unique username by appending a numeric suffix until available.
export async function uniqueUsername(
  prisma: PrismaClient,
  base: string,
): Promise<string> {
  let candidate = base;
  let suffix = 0;
  while (!(await isUsernameAvailable(prisma, candidate))) {
    suffix += 1;
    candidate = `${base}${suffix}`;
  }
  return candidate;
}