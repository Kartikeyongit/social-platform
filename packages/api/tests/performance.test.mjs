// Boots its own in-process API server (uses the patched PrismaClient so every
// DB query is counted) and asserts the feed of 10 posts stays under 12 queries.
// Run standalone:  pnpm --filter @social/api test:perf
import { createRequire } from 'node:module';
import net from 'node:net';

const require = createRequire(import.meta.url);
const PORT = parseInt(process.env.PORT || '4000', 10);
const API = `http://localhost:${PORT}/graphql`;

function portFree(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once('error', () => resolve(false));
    srv.listen(port, () => srv.close(() => resolve(true)));
  });
}

async function waitForServer(url, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ __typename }' }),
      });
      if (res.ok) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('server did not become ready');
}

if (!(await portFree(PORT))) {
  console.error(`Port ${PORT} is already in use — stop any dev server and retry.`);
  process.exit(1);
}

const prismaModule = require('@prisma/client');
const { PrismaClient } = prismaModule;

let queryCount = 0;
class LoggingPrismaClient extends PrismaClient {
  constructor(opts) {
    super({ ...opts, log: [{ emit: 'event', level: 'query' }] });
    this.$on('query', () => { queryCount++; });
  }
}
prismaModule.PrismaClient = LoggingPrismaClient;

require('../dist/index.js');

const ts = Date.now();
const user = `perfu_${ts}`;

async function gql(query, variables, token) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  if (body.errors) throw new Error(JSON.stringify({ q: query.slice(0, 60), errs: body.errors.map(e => e.message) }));
  return body.data;
}

const FEED_QUERY = `query F($limit:Int){feed(limit:$limit){
  edges{node{ id likeCount isLiked
    author{ username followerCount followingCount postCount isFollowing } } }
  pageInfo{hasNextPage}
}}`;

async function main() {
  await waitForServer(API);

  const { register } = await gql(
    `mutation R($username:String!,$email:String!,$password:String!,$displayName:String!){register(username:$username,email:$email,password:$password,displayName:$displayName){token}}`,
    { username: user, email: `${user}@test.com`, password: 'password123', displayName: 'Perf T' });
  const token = register.token;

  // Follow the seeded users so feed returns 10+ posts
  for (const username of ['jane_smith', 'tech_guru', 'sarah_codes', 'mike_designs']) {
    await gql(`query U($username:String!){user(username:$username){id}}`, { username }, token).then(async (d) => {
      await gql(`mutation F($userId:ID!){followUser(userId:$userId){id}}`, { userId: d.user.id }, token);
    });
  }

  queryCount = 0;
  const data = await gql(FEED_QUERY, { limit: 10 }, token);
  const posts = data.feed.edges.length;
  const q1 = queryCount;

  // Second identical request - loaders must be per-request (no cache bleed)
  queryCount = 0;
  await gql(FEED_QUERY, { limit: 10 }, token);
  const q2 = queryCount;

  console.log(`feed returned ${posts} posts`);
  console.log(`request 1: ${q1} DB queries`);
  console.log(`request 2: ${q2} DB queries`);

  // Without loaders this was ~52 queries (1 follows + 1 posts + 10x4 per-row). With loaders: ~7.
  return posts === 10 && q1 <= 12 && q2 <= 12;
}

main()
  .then(async (ok) => {
    console.log(ok ? 'PERF CHECK PASSED' : 'PERF CHECK FAILED');
    try {
      const prisma = new LoggingPrismaClient();
      await prisma.user.deleteMany({ where: { username: { startsWith: 'perfu_' } } });
      await prisma.$disconnect();
    } catch { /* best-effort cleanup */ }
    process.exit(ok ? 0 : 1);
  })
  .catch((e) => {
    console.error('ERR:', e.message);
    process.exit(1);
  });
