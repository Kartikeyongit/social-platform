// Simple AI-like suggestions based on content analysis
const commonHashtags = [
  'tech', 'coding', 'javascript', 'react', 'nextjs', 'webdev',
  'design', 'ui', 'ux', 'startup', 'business', 'marketing',
  'fitness', 'health', 'food', 'travel', 'photography', 'art',
  'music', 'gaming', 'science', 'ai', 'ml', 'data',
  'love', 'life', 'motivation', 'success', 'mindset'
];

export function suggestHashtags(content: string): string[] {
  const words = content.toLowerCase().split(/\W+/);
  const suggestions: string[] = [];
  
  commonHashtags.forEach(tag => {
    if (words.some(word => word.includes(tag) || tag.includes(word))) {
      suggestions.push(tag);
    }
  });
  
  return [...new Set(suggestions)].slice(0, 5);
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