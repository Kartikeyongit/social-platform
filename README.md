# Social Platform - Portfolio Project

> A full-stack social media platform demonstrating modern web development practices, scalable architecture patterns, and machine learning integration.

## 🎯 Architecture Overview

```
┌────────────────────────────────────────────────────────────┐
│ Client Layer                                               │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│ │ Web      │  │ iOS      │  │ Android  │  │ PWA      │     │
│ │ Next.js  │  │ (Future) │  │ (Future) │  │ (Future) │     │
│ └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘     │
└──────┼─────────────┼─────────────┼─────────────┼───────────┘
       │             │             │             │
       └─────────────┴─────────────┴─────────────┘
                     │
          ┌──────────▼──────────┐
          │ GraphQL Gateway     │
          │ (Apollo Server)     │
          └──────────┬──────────┘
                     │
       ┌─────────────┼─────────────┐
       │             │             │
    ┌──▼──────┐  ┌───▼────┐  ┌────▼──────┐
    │ Auth    │  │ Feed   │  │ Real-time │
    │ Service │  │ Service│  │ (WS)      │
    └──┬──────┘  └───┬────┘  └────┬──────┘
       │             │            │
       └─────────────┼────────────┘
                     │
          ┌──────────▼──────────┐
          │ Data Layer          │
          │ ┌────┐  ┌────────┐  │
          │ │ PG │  │ Redis  │  │
          │ └────┘  └────────┘  │
          └─────────────────────┘
```

## 🚀 Key Features Implemented

### 1. News Feed Algorithm
- **Fanout-on-write** for active users (push to Redis)
- **Fanout-on-read** for inactive users (pull from DB)
- Engagement-based scoring with time decay
- Real-time updates via GraphQL Subscriptions

### 2. Machine Learning Recommendations
- Content-based filtering using TF-IDF vectorization
- User similarity matrix for collaborative filtering
- Trending hashtag detection with velocity scoring

### 3. Real-time Features
- WebSocket connections for live updates
- Typing indicators in DMs
- Live notification delivery
- Connection pool management

### 4. Performance Optimizations
- DataLoader for N+1 query prevention
- Redis caching with invalidation strategies
- Cursor-based pagination
- CDN-ready image processing pipeline
- Database indexing strategy

## 🛠 Tech Stack & Why

| Technology | Purpose | Why This Over Alternatives |
|------------|---------|---------------------------|
| **Next.js 14** | Frontend | SSR for SEO, ISR for feed pages, App Router for nested layouts |
| **Apollo GraphQL** | API Layer | Type-safe contracts, real-time subscriptions, client-side caching |
| **PostgreSQL** | Primary DB | ACID compliance, full-text search, JSON support for flexible schemas |
| **Redis** | Caching & Real-time | Sub-millisecond latency, sorted sets for feed ranking, pub/sub |
| **Prisma** | ORM | Type safety, migrations, relation queries made simple |
| **DataLoader** | N+1 Prevention | Batching & caching at the GraphQL layer |
| **Tailwind CSS** | Styling | Utility-first, rapid prototyping, tiny production bundles |

## 📊 How This Would Scale to 1M Users

### Current (Portfolio Scale)
- Single PostgreSQL with read replicas
- Single Redis instance
- Monolithic GraphQL server

### Production Scale (1M+ Users)
```typescript
// Database Sharding
const shardKey = hash(userId) % numberOfShards;
// User data distributed across 16+ shards

// Feed Service Separation
// Dedicated microservice with its own Redis cluster
// Kafka for async feed fanout to handle celebrity users

// ML Pipeline
// Separate Python service using TensorFlow
// Feature store for real-time features
// A/B testing framework for algorithm iterations

// CDN Strategy
// Multi-region edge caching
// Image optimization at upload time
// Signed URLs for private content
```

## 🧪 Running Locally

### One Command to Rule Them All
```bash
docker-compose up -d
```

### Setup Database
```bash
cd packages/api
pnpm db:migrate
pnpm db:seed  # Creates sample data
```

### Start Development
```bash
pnpm dev  # Starts both API and Web
```

## 📝 Technical Decisions & Trade-offs

### Why GraphQL over REST?

**✅ Pros:**
- Only request what you need (mobile optimization)
- Real-time subscriptions built-in
- Strong typing with code generation
- Single endpoint for all data needs

**❌ Cons:**
- More complex caching
- Potential for deep queries
- File upload requires separate handling

### Why PostgreSQL over MongoDB?

**✅ Chose PostgreSQL because:**
- Social data is highly relational
- ACID guarantees for likes/follows
- Full-text search capabilities
- Better tooling ecosystem

## 🔒 Security Considerations

- JWT with refresh token rotation
- Rate limiting on auth endpoints
- Input validation with Zod
- SQL injection prevention via Prisma
- XSS protection with React
- CORS configuration
- Environment variable management

## 📈 Performance Benchmarks (Local)

| Operation | Performance |
|-----------|-------------|
| Feed generation (cached) | <50ms |
| Post creation with fanout | <100ms |
| Real-time message delivery | <10ms |
| Image optimization | <200ms |

## 🎓 What I Learned

- Distributed system design patterns
- Real-time data synchronization challenges
- ML integration in JavaScript ecosystem
- Performance optimization techniques
- Trade-offs between consistency and availability

## 📄 License

MIT - Feel free to use this for learning!