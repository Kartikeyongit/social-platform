import express from 'express';
import cors from 'cors';
import http from 'http';
import fs from 'fs';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';
import { upload } from './utils/upload';
import { uploadToCloudinary } from './utils/cloudinary';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface Context {
  prisma: PrismaClient;
  redis: Redis;
  userId?: string;
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (origin.endsWith('.vercel.app') || origin === 'https://vercel.app') return callback(null, true);
      if (origin === 'http://localhost:3000') return callback(null, true);
      if (origin === process.env.CORS_ORIGIN) return callback(null, true);
      callback(null, true); // Allow all for now
    },
    credentials: true,
  }));

  const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const serverCleanup = useServer({ schema, context: async (ctx) => {
    const token = ctx.connectionParams?.authToken as string;
    if (token) {
      try { const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string }; return { userId: decoded.userId, prisma, redis }; } catch (e) {}
    }
    return { prisma, redis };
  }}, wsServer);

  const server = new ApolloServer<Context>({
    schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer }), {
      async serverWillStart() { return { async drainServer() { await serverCleanup.dispose(); } }; },
    }],
  });

  await server.start();
  app.use(express.json());

  // Upload endpoint with Cloudinary
  app.post('/upload', (req, res) => {
    upload.single('image')(req, res, async (err) => {
      if (err) {
        console.error('Multer error:', err.message);
        return res.status(400).json({ error: err.message });
      }
      if (!req.file) {
        console.error('No file received');
        return res.status(400).json({ error: 'No file uploaded' });
      }

      console.log('File received:', req.file.originalname, 'Size:', req.file.size);

      try {
        // Upload to Cloudinary
        const url = await uploadToCloudinary(req.file.path);
        console.log('Cloudinary URL:', url);
        
        // Clean up temp file
        fs.unlink(req.file.path, () => {});
        
        return res.json({ url });
      } catch (error: any) {
        console.error('Cloudinary error:', error.message);
        // Clean up temp file on error too
        fs.unlink(req.file.path, () => {});
        return res.status(500).json({ error: 'Upload failed: ' + error.message });
      }
    });
  });

  app.use('/graphql', expressMiddleware(server, {
    context: async ({ req }) => {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        try { const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string }; return { userId: decoded.userId, prisma, redis }; } catch (e) {}
      }
      return { prisma, redis };
    },
  }));

  const PORT = parseInt(process.env.PORT || '4000', 10);
  httpServer.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server on port ${PORT}`));
}

startServer().catch(console.error);
