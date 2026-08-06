import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
] as const;

type EnvVar = (typeof requiredEnvVars)[number];

const missing: EnvVar[] = [];

for (const name of requiredEnvVars) {
  if (!process.env[name]) missing.push(name);
}

if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  console.error('Create a .env file in packages/api (see .env.example) before starting the server.');
  process.exit(1);
}

export const config = {
  databaseUrl: process.env.DATABASE_URL as string,
  jwtSecret: process.env.JWT_SECRET as string,
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
    apiKey: process.env.CLOUDINARY_API_KEY as string,
    apiSecret: process.env.CLOUDINARY_API_SECRET as string,
  },
  corsOrigins: (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  oauth: {
    googleClientId: process.env.OAUTH_GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.OAUTH_GOOGLE_CLIENT_SECRET || '',
    githubClientId: process.env.OAUTH_GITHUB_CLIENT_ID || '',
    githubClientSecret: process.env.OAUTH_GITHUB_CLIENT_SECRET || '',
    webRedirect: (process.env.OAUTH_WEB_REDIRECT || 'http://localhost:3000').replace(/\/+$/, ''),
  },
};
