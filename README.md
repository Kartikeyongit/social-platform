# SocialApp - Full-Stack Social Media Platform
  
**A production-ready social media platform built with modern web technologies**
  
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![GraphQL](https://img.shields.io/badge/GraphQL-Apollo-pink?logo=graphql)](https://www.apollographql.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-red?logo=redis)](https://redis.io/)
[![Prisma](https://img.shields.io/badge/Prisma-5-teal?logo=prisma)](https://www.prisma.io/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel)](https://vercel.com)
[![Render](https://img.shields.io/badge/Render-Deployed-46e3b7?logo=render)](https://render.com)
  
[Live Demo](https://social-platform-web-flax.vercel.app) · [API](https://social-api-849x.onrender.com/graphql)

---

## 📸 Screenshots

| | |
|:---:|:---:|
| **Home Feed** | **Dark Mode** |
| Feed with posts, likes, comments, hashtags | Full dark mode support across all pages |
| **Messages** | **User Profile** |
| Real-time chat with people you follow | Profile with posts, followers, edit option |
| **Explore** | **Notifications** |
| Trending hashtags, search users, popular posts | Real-time notifications for likes, follows |

---

## 🚀 Features

### Core Social Features
- 📝 **Create Posts** with text, hashtags, and image uploads (Cloudinary CDN)
- ❤️ **Like & Unlike** posts with particle burst animations
- 💬 **Comment** on posts with real-time updates
- 👤 **User Profiles** with bio, avatar, followers/following counts
- 🔗 **Follow/Unfollow** other users
- 📊 **Infinite Scroll Feed** with cursor-based pagination
- 🔍 **Explore Page** - trending hashtags, popular posts, user search

### Real-Time Features
- 💌 **Direct Messaging** between users with 2-second polling
- 🔔 **Notification System** - likes, comments, follows
- 📱 **Responsive Design** - mobile bottom nav, slide menu, desktop sidebar

### AI & ML Features
- 🧠 **AI Hashtag Suggestions** - TF-IDF based content analysis
- 🎯 **Personalized Recommendations** - content-based filtering
- 📈 **Trending Detection** - velocity-based trending topics

### Premium UX
- 🌙 **Dark Mode** with persistent theme toggle
- ✨ **Framer Motion Animations** throughout the app
- 🎨 **Premium Glass-Morphism Design** with consistent styling
- 📱 **Mobile-First Responsive** layout
- 🔄 **Infinite Scroll** with automatic loading

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with SSR, App Router |
| **TypeScript** | Type-safe development |
| **Tailwind CSS** | Utility-first styling |
| **Apollo Client** | GraphQL state management |
| **Framer Motion** | Smooth animations |
| **Lucide React** | Professional SVG icons |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | JavaScript runtime |
| **Apollo Server** | GraphQL API server |
| **Prisma ORM** | Database ORM & migrations |
| **PostgreSQL** | Primary database (Supabase) |
| **Redis** | Caching & real-time (Upstash) |
| **GraphQL Subscriptions** | WebSocket real-time updates |
| **Cloudinary** | Image upload & CDN |

### Deployment
| Service | Purpose |
|---------|---------|
| **Vercel** | Frontend hosting |
| **Render** | Backend API hosting |
| **Supabase** | Managed PostgreSQL |
| **Upstash** | Managed Redis |
| **Cloudinary** | Image CDN |

---

## 📊 Architecture

```
┌────────────────────────────────────────────────────────────┐
│ Client Layer (Vercel)                                      │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Next.js 14 + Apollo Client + Tailwind + Framer       │   │
│ │ - SSR/ISR for performance                            │   │
│ │ - Optimistic UI updates                              │   │
│ │ - Responsive mobile/desktop layouts                  │   │
│ └──────────────────────┬───────────────────────────────┘   │
└────────────────────────┼───────────────────────────────────┘
                         │ HTTPS + WebSocket
┌────────────────────────▼──────────────────────────────────┐
│ GraphQL API (Render)                                      │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Apollo Server + Express + TypeScript                │   │
│ │ - JWT Authentication                                │   │
│ │ - Real-time Subscriptions (WebSocket)               │   │
│ │ - File Upload (Cloudinary)                          │   │
│ │ - AI Hashtag Suggestions                            │   │
│ └──────┬───────────────────────────┬──────────────────┘   │
└────────┼───────────────────────────┼──────────────────────┘
         │                           │
┌────────▼──────────┐    ┌───────────▼──────────┐
│ PostgreSQL        │    │ Redis (Upstash)      │
│ (Supabase)        │    │ - Feed Caching       │
│ - User Data       │    │ - Hashtag Trends     │
│ - Posts/Comments  │    │ - Session Store      │
│ - Follows/Likes   │    │                      │
└───────────────────┘    └──────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ Image Pipeline (Cloudinary)                                  │
│ Upload → Transform → Optimize → CDN Delivery                 │
└──────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
social-platform/
├── packages/
│   ├── web/                    # Next.js Frontend
│   │   ├── src/
│   │   │   ├── components/     # Reusable UI components
│   │   │   │   ├── home/       # TrendingSidebar
│   │   │   │   ├── icons/      # SVG icon components
│   │   │   │   ├── layout/     # Sidebar, MobileNav, Layout
│   │   │   │   └── ui/         # Skeleton, EmptyState, ErrorState
│   │   │   ├── contexts/       # AuthContext, ThemeContext
│   │   │   ├── graphql/        # Apollo Client setup
│   │   │   ├── pages/          # All routes
│   │   │   │   ├── home.tsx    # Main feed with infinite scroll
│   │   │   │   ├── explore.tsx # Search & trending
│   │   │   │   ├── messages.tsx # Real-time chat
│   │   │   │   ├── notifications.tsx
│   │   │   │   ├── post/[postId].tsx # Post detail
│   │   │   │   ├── profile/    # User profiles
│   │   │   │   ├── settings/   # Edit profile
│   │   │   │   ├── recommendations.tsx # AI recommendations
│   │   │   │   └── trending.tsx
│   │   │   ├── styles/         # CSS & design system
│   │   │   └── utils/          # Utility functions
│   │   └── tailwind.config.js
│   │
│   ├── api/                    # GraphQL Backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Database schema
│   │   │   ├── seed.ts         # 100 posts seed data
│   │   │   └── migrations/     # Database migrations
│   │   └── src/
│   │       ├── graphql/
│   │       │   ├── resolvers/  # Query/Mutation resolvers
│   │       │   └── typeDefs.ts # GraphQL schema
│   │       ├── utils/
│   │       │   ├── upload.ts   # Multer config
│   │       │   ├── cloudinary.ts # Cloudinary integration
│   │       │   └── aiSuggestions.ts # AI hashtag engine
│   │       └── index.ts        # Express + Apollo Server
│   │
│   └── shared/                 # Shared types & utilities
│       └── src/
│           ├── types/          # TypeScript interfaces
│           ├── validation/     # Zod schemas
│           └── utils/          # Shared helpers
│
├── docker-compose.yml          # Local PostgreSQL + Redis
├── .node-version               # Node.js version for Render
├── pnpm-workspace.yaml         # Monorepo config
└── README.md
```

---

## 🔧 Local Development

### Prerequisites
- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Docker Desktop (for local PostgreSQL + Redis)

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/Kartikeyongit/social-platform.git
cd social-platform

# 2. Start PostgreSQL & Redis
docker-compose up -d

# 3. Install dependencies
pnpm install

# 4. Build shared package
cd packages/shared && pnpm build && cd ../..

# 5. Setup database
cd packages/api
pnpm db:migrate
pnpm db:seed
cd ../..

# 6. Start development servers
pnpm dev
```

The app will be available at:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000/graphql

### Test Accounts

| Email | Password | Role |
|-------|----------|------|
| john@example.com | password123 | Developer |
| jane@example.com | password123 | Photographer |
| tech@example.com | password123 | Tech Reviewer |
| sarah@example.com | password123 | Frontend Engineer |
| mike@example.com | password123 | UI/UX Designer |

---

## 🌐 Deployment

### Frontend (Vercel)

1. Connect GitHub repository
2. Set root directory to `packages/web`
3. Add environment variable: `NEXT_PUBLIC_API_URL` = your Render URL

### Backend (Render)

1. Create Web Service from GitHub
2. Root directory: repository root
3. Build command:
   ```bash
   npm install -g pnpm && pnpm install --filter @social/api --filter @social/shared && cd /opt/render/project/src/packages/shared && pnpm build && cd /opt/render/project/src/packages/api && npx prisma generate && npx prisma migrate deploy && pnpm build
   ```
4. Start command: `cd /opt/render/project/src && node packages/api/dist/index.js`

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase connection string |
| `REDIS_URL` | Upstash Redis URL |
| `JWT_SECRET` | Random secret key |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `CORS_ORIGIN` | Vercel app URL |

---

## 📈 Performance

| Operation | Performance |
|-----------|-------------|
| Feed generation (cached) | < 50ms |
| Post creation | < 100ms |
| Message delivery | < 2s (polling) |
| Image upload + CDN | < 3s |
| Infinite scroll load | < 500ms |

---

## 🔒 Security

- JWT authentication with 7-day expiry
- Input validation with Zod schemas
- SQL injection prevention via Prisma ORM
- XSS protection via React
- CORS configuration for production
- Environment variable management
- File type validation for uploads

---

## 🎯 Key Technical Decisions

### Why GraphQL over REST?
- Type-safe contracts between frontend and backend
- Real-time subscriptions for notifications
- Single endpoint reduces network requests
- Built-in documentation via GraphQL playground

### Why PostgreSQL over MongoDB?
- Social data is highly relational (users, posts, follows)
- ACID guarantees for likes, comments, follows
- Full-text search capabilities
- Better tooling ecosystem (Prisma, Supabase)

### Why Prisma over raw SQL?
- Type-safe database queries
- Automatic migrations
- Relation queries made simple
- Excellent developer experience

### Why Redis?
- Sub-millisecond caching for feed generation
- Sorted sets for trending hashtags
- Session and rate limiting ready

---

## 🧪 Testing

```bash
# Run the seed to populate 100 posts
cd packages/api && npx prisma db seed

# Access GraphQL playground
open http://localhost:4000/graphql

# Test a query
query {
  feed(limit: 10) {
    edges {
      node { id content author { username } }
    }
  }
}
```

---

## 🤝 Contributing

Feel free to fork this project and submit pull requests. This is a portfolio project showcasing full-stack development skills.

---

## 📄 License

MIT License - feel free to use this for learning or as a foundation for your own projects.

---

## 🎓 What I Learned

- **Distributed System Design** - Monorepo architecture, microservices patterns
- **Real-Time Data Sync** - WebSocket subscriptions, polling strategies
- **ML Integration** - TF-IDF content analysis in JavaScript
- **Performance Optimization** - Redis caching, pagination, image CDN
- **Production Deployment** - Vercel, Render, Supabase, Cloudinary
- **UI/UX Design** - Responsive layouts, dark mode, animations
- **Database Design** - Relational schema, migrations, seeding

---

**Made with ❤️ by Kartikey Gautam**