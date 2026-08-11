// Hashtag suggestions based on hashtags previously used in the database
import type { PrismaClient } from '@prisma/client';

interface ScoredTag {
  name: string;
  score: number;
}

function extractWords(content: string): string[] {
  return content
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2);
}

export async function suggestHashtagsFromDb(
  prisma: PrismaClient,
  content: string,
  limit = 5,
): Promise<string[]> {
  const words = extractWords(content);
  if (words.length === 0) return [];

  const existingTags = content.match(/#(\w+)/g)?.map((t) => t.slice(1).toLowerCase()) || [];

  const candidates = await prisma.hashtag.findMany({
    where: {
      OR: [
        { name: { contains: words[0], mode: 'insensitive' as const } },
        ...words.slice(1).map((word) => ({ name: { contains: word, mode: 'insensitive' as const } })),
      ],
    },
    orderBy: { postCount: 'desc' },
    take: 50,
  });

  const scored: ScoredTag[] = [];
  for (const tag of candidates) {
    const name = tag.name.toLowerCase();
    let best = 0;
    for (const word of words) {
      let matchScore = 0;
      if (name === word) matchScore = 3;
      else if (name.includes(word) || word.includes(name)) matchScore = 1;
      if (matchScore > best) best = matchScore;
    }
    if (best > 0 && !existingTags.includes(name)) {
      scored.push({ name: tag.name, score: best * 100 + Math.log10(tag.postCount + 1) });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.name);
}

export function analyzeSentiment(content: string): 'positive' | 'negative' | 'neutral' {
  const positiveWords = ['great', 'awesome', 'love', 'amazing', 'wonderful', 'excellent', 'happy', 'good'];
  const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'worst', 'sad', 'angry', 'poor'];
  
  const words = content.toLowerCase().split(/\W+/);
  let score = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) score++;
    if (negativeWords.includes(word)) score--;
  });
  
  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}
