import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
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

  // WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const serverCleanup = useServer({ 
    schema,
    context: async (ctx) => {
      const token = ctx.connectionParams?.authToken as string;
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
          return { userId: decoded.userId, prisma, redis };
        } catch (e) {
          throw new Error('Invalid token');
        }
      }
      return { prisma, redis };
    },
  }, wsServer);

  // Apollo Server
  const server = new ApolloServer<Context>({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await server.start();

  // Middleware
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  }));
  app.use(express.json());
  
  // Serve uploaded files
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  // Image upload endpoint
  app.post('/upload', (req, res) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({ error: err.message || 'Upload failed' });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }
      const url = `http://localhost:4000/uploads/${req.file.filename}`;
      console.log('File uploaded:', url);
      return res.json({ url });
    });
  });

  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => {
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
            return { userId: decoded.userId, prisma, redis };
          } catch (e) {
            // Invalid token
          }
        }
        return { prisma, redis };
      },
    })
  );

  const PORT = process.env.PORT || 4000;
  
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    console.log(`📡 WebSocket ready at ws://localhost:${PORT}/graphql`);
    console.log(`📸 Image upload ready at http://localhost:${PORT}/upload`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
});
