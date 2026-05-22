import { z } from 'zod';

export const CreatePostSchema = z.object({
  content: z.string().min(1).max(500),
  hashtags: z.array(z.string().max(30)).max(10).default([]),
  mediaUrls: z.array(z.string().url()).max(4).default([]),
});

export const CreateCommentSchema = z.object({
  postId: z.string().uuid(),
  content: z.string().min(1).max(300),
});

export const SendMessageSchema = z.object({
  receiverId: z.string().uuid(),
  content: z.string().min(1).max(1000),
});

export const RegisterSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  displayName: z.string().min(2).max(50),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type CreatePostInput = z.infer<typeof CreatePostSchema>;
export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;