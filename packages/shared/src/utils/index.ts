import * as crypto from 'crypto';

export function generateId(): string {
  return crypto.randomUUID();
}

export function extractHashtags(content: string): string[] {
  const hashtagRegex = /#(\w+)/g;
  const matches = content.match(hashtagRegex);
  return matches ? [...new Set(matches.map(m => m.slice(1)))] : [];
}

export function extractMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const matches = content.match(mentionRegex);
  return matches ? [...new Set(matches.map(m => m.slice(1)))] : [];
}

export function calculatePostScore(post: {
  likeCount: number;
  commentCount: number;
  createdAt: Date;
}): number {
  const age = (Date.now() - new Date(post.createdAt).getTime()) / 1000;
  const recencyScore = 1 / Math.log(age + 2);
  const engagementScore = (post.likeCount * 2 + post.commentCount * 3) / 100;
  return recencyScore + engagementScore;
}
