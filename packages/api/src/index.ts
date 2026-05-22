import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
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
      const allowedOrigins = [process.env.CORS_ORIGIN, 'http://localhost:3000'].filter(Boolean);
      if (!origin) return callback(null, true);
      if (origin.endsWith('.vercel.app') || origin === 'https://vercel.app') return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }));

  const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const serverCleanup = useServer({ 
    schema,
    context: async (ctx) => {
      const token = ctx.connectionParams?.authToken as string;
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
          return { userId: decoded.userId, prisma, redis };
        } catch (e) {}
      }
      return { prisma, redis };
    },
  }, wsServer);

  const server = new ApolloServer<Context>({
    schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer }), {
      async serverWillStart() { return { async drainServer() { await serverCleanup.dispose(); } }; },
    }],
  });

  await server.start();
  app.use(express.json());

  // Image upload endpoint - uses Cloudinary in production, local in dev
  app.post('/upload', (req, res) => {
    upload.single('image')(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      try {
        let url: string;
        
        // Check if Cloudinary is configured
        if (process.env.CLOUDINARY_CLOUD_NAME) {
          url = await uploadToCloudinary(req.file.path);
          // Clean up local file after upload
          fs.unlink(req.file.path, () => {});
        } else {
          // Fallback to local URL for development
          url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        }
        
        return res.json({ url });
      } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Upload failed' });
      }
    });
  });

  app.use('/graphql', expressMiddleware(server, {
    context: async ({ req }) => {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
          return { userId: decoded.userId, prisma, redis };
        } catch (e) {}
      }
      return { prisma, redis };
    },
  }));

  const PORT = parseInt(process.env.PORT || '4000', 10);
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server ready on port ${PORT}`);
  });
}

startServer().catch(console.error);
