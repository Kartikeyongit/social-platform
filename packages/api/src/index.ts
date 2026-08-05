import express from 'express';
import cors from 'cors';
import http from 'http';
import rateLimit from 'express-rate-limit';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import type { PrismaClient } from '@prisma/client';
import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';
import { upload, hasValidImageSignature } from './utils/upload';
import { uploadBuffer } from './utils/cloudinary';
import { getUserIdFromAuthHeader, verifyToken } from './utils/auth';
import { config } from './utils/config';
import { prisma } from './utils/db';
import { createLoaders, Loaders } from './utils/loaders';

interface Context {
  prisma: PrismaClient;
  userId?: string;
  loaders: Loaders;
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // Trust proxy headers so rate limiting uses the real client IP behind Render/Vercel
  app.set('trust proxy', 1);

  const allowedOrigins = new Set([
    ...config.corsOrigins,
    'http://localhost:3000',
    'http://localhost:4000',
  ]);

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      if (origin.endsWith('.vercel.app') || origin === 'https://vercel.app') return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  }));

  const uploadLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });
  const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false });

  const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const serverCleanup = useServer({ schema, context: async (ctx) => {
    const loaders = createLoaders(prisma);
    const token = ctx.connectionParams?.authToken as string | undefined;
    if (token) {
      const userId = verifyToken(token);
      if (userId) return { userId, prisma, loaders };
    }
    return { prisma, loaders };
  }}, wsServer);

  const server = new ApolloServer<Context>({
    schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer }), {
      async serverWillStart() { return { async drainServer() { await serverCleanup.dispose(); } }; },
    }],
  });

  await server.start();
  app.use(express.json());

  // Upload endpoint - authenticated, rate-limited, memory storage + Cloudinary
  app.post('/upload', uploadLimiter, (req, res) => {
    const userId = getUserIdFromAuthHeader(req.headers.authorization);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    upload.single('image')(req, res, async (err) => {
      if (err) {
        console.error('Multer error:', err.message);
        return res.status(400).json({ error: 'Invalid file upload' });
      }
      if (!req.file) {
        console.error('No file received');
        return res.status(400).json({ error: 'No file uploaded' });
      }

      if (!hasValidImageSignature(req.file.buffer)) {
        return res.status(400).json({ error: 'File contents do not match an allowed image type' });
      }

      try {
        const url = await uploadBuffer(req.file.buffer, req.file.mimetype);
        return res.json({ url });
      } catch (error) {
        console.error('Cloudinary error:', (error as Error).message);
        return res.status(500).json({ error: 'Upload failed' });
      }
    });
  });

  app.use('/graphql', apiLimiter, expressMiddleware(server, {
    context: async ({ req }) => {
      const userId = getUserIdFromAuthHeader(req.headers.authorization);
      return { userId: userId || undefined, prisma, loaders: createLoaders(prisma) };
    },
  }));

  const PORT = parseInt(process.env.PORT || '4000', 10);
  httpServer.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server on port ${PORT}`));
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
