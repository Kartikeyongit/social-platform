import express from 'express';
import cors from 'cors';
import natural from 'natural';
import nlp from 'compromise';

const app = express();
app.use(cors());
app.use(express.json());

// TF-IDF for content-based recommendations
const TfIdf = natural.TfIdf;
const tfidf = new TfIdf();

// Store for user interactions
interface UserInteraction {
  userId: string;
  postId: string;
  postContent: string;
  hashtags: string[];
  timestamp: number;
  action: 'like' | 'comment' | 'view';
}

const userInteractions: UserInteraction[] = [];

// Content-based recommendation endpoint
app.post('/api/recommend/content', (req, res) => {
  const { userId, userInteractions: interactions } = req.body;
  
  // Train TF-IDF on all posts
  const tfidf = new TfIdf();
  interactions.forEach((interaction: any) => {
    const content = `${interaction.content} ${interaction.hashtags.join(' ')}`;
    tfidf.addDocument(content);
  });
  
  // Get user's interests based on their interactions
  const userDocs = interactions
    .filter((i: any) => i.userId === userId)
    .map((i: any) => `${i.content} ${i.hashtags.join(' ')}`);
  
  if (userDocs.length === 0) {
    return res.json({ recommendations: [] });
  }
  
  // Find similar content
  const scores: { postId: string; score: number }[] = [];
  
  interactions
    .filter((i: any) => i.userId !== userId)
    .forEach((interaction: any, index: number) => {
      const docContent = `${interaction.content} ${interaction.hashtags.join(' ')}`;
      const similarity = calculateSimilarity(userDocs.join(' '), docContent);
      scores.push({ postId: interaction.postId, score: similarity });
    });
  
  // Sort by similarity score
  scores.sort((a, b) => b.score - a.score);
  
  res.json({
    recommendations: scores.slice(0, 10).map(s => ({ postId: s.postId, score: s.score }))
  });
});

// Collaborative filtering endpoint
app.post('/api/recommend/collaborative', (req, res) => {
  const { userId, allInteractions } = req.body;
  
  // Find similar users
  const userSimilarities = new Map<string, number>();
  const currentUserInteractions = allInteractions.filter((i: any) => i.userId === userId);
  const currentUserPostIds = new Set(currentUserInteractions.map((i: any) => i.postId));
  
  allInteractions.forEach((interaction: any) => {
    if (interaction.userId !== userId) {
      const similarity = calculateUserSimilarity(
        currentUserInteractions,
        allInteractions.filter((i: any) => i.userId === interaction.userId)
      );
      userSimilarities.set(interaction.userId, similarity);
    }
  });
  
  // Get posts from similar users
  const recommendedPosts = new Map<string, number>();
  
  userSimilarities.forEach((similarity, otherUserId) => {
    allInteractions
      .filter((i: any) => i.userId === otherUserId && !currentUserPostIds.has(i.postId))
      .forEach((i: any) => {
        const currentScore = recommendedPosts.get(i.postId) || 0;
        recommendedPosts.set(i.postId, currentScore + similarity);
      });
  });
  
  const recommendations = Array.from(recommendedPosts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([postId, score]) => ({ postId, score }));
  
  res.json({ recommendations });
});

// Trending topics detection
app.post('/api/trending/detect', (req, res) => {
  const { posts } = req.body;
  
  // Extract keywords and hashtags
  const keywordCounts = new Map<string, number>();
  const now = Date.now();
  const timeWindow = 24 * 60 * 60 * 1000; // 24 hours
  
  posts
    .filter((post: any) => now - new Date(post.createdAt).getTime() < timeWindow)
    .forEach((post: any) => {
      // Extract keywords using NLP
      const doc = nlp(post.content);
      const keywords = doc.nouns().out('array');
      
      keywords.forEach((keyword: string) => {
        keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
      });
      
      // Count hashtags
      post.hashtags.forEach((tag: string) => {
        const tagKey = `#${tag}`;
        keywordCounts.set(tagKey, (keywordCounts.get(tagKey) || 0) + 1);
      });
    });
  
  const trending = Array.from(keywordCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([keyword, count]) => ({ keyword, count }));
  
  res.json({ trending });
});

// Helper functions
function calculateSimilarity(text1: string, text2: string): number {
  const tfidf = new TfIdf();
  tfidf.addDocument(text1);
  tfidf.addDocument(text2);
  
  // Cosine similarity using TF-IDF
  const terms = new Set<string>();
  text1.toLowerCase().split(/\W+/).forEach(t => terms.add(t));
  text2.toLowerCase().split(/\W+/).forEach(t => terms.add(t));
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  terms.forEach(term => {
    const tfidf1 = getTfidfValue(text1, term);
    const tfidf2 = getTfidfValue(text2, term);
    dotProduct += tfidf1 * tfidf2;
    norm1 += tfidf1 * tfidf1;
    norm2 += tfidf2 * tfidf2;
  });
  
  if (norm1 === 0 || norm2 === 0) return 0;
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

function getTfidfValue(text: string, term: string): number {
  const words = text.toLowerCase().split(/\W+/);
  const tf = words.filter(w => w === term).length / words.length;
  return tf;
}

function calculateUserSimilarity(user1Interactions: any[], user2Interactions: any[]): number {
  const user1Posts = new Set(user1Interactions.map((i: any) => i.postId));
  const user2Posts = new Set(user2Interactions.map((i: any) => i.postId));
  
  const intersection = new Set([...user1Posts].filter(x => user2Posts.has(x)));
  const union = new Set([...user1Posts, ...user2Posts]);
  
  return intersection.size / union.size;
}

const PORT = process.env.RECOMMENDER_PORT || 5000;
app.listen(PORT, () => {
  console.log(`🧠 ML Recommender Service running on port ${PORT}`);
});