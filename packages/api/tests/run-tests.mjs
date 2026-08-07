// Boots the compiled API server, runs the integration suites against it,
// then removes all test data. Usage:  pnpm --filter @social/api test
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(here, '..');
const distEntry = path.join(apiRoot, 'dist', 'index.js');
const PORT = process.env.PORT || '4000';
const API_URL = `http://localhost:${PORT}/graphql`;

const TEST_USER_PREFIXES = ['inua_', 'inub_', 'inuc_', 'suba_', 'subb_', 'subc_', 'perfu_'];
const TEST_ONLY_HASHTAGS = ['integritytest', 'deltag'];

const SUITES = [
  ['integrity', ['integrity.test.mjs']],
  ['subscriptions', ['subscriptions.test.mjs']],
  ['smoke', ['smoke.test.mjs']],
];

function portFree(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once('error', () => resolve(false));
    srv.listen(port, () => srv.close(() => resolve(true)));
  });
}

async function waitForServer(url, timeoutMs = 30000) {
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
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('server did not become ready');
}

function runSuite(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, { cwd: here, stdio: 'inherit' });
    child.on('close', (code) => resolve(code ?? 1));
    child.on('error', (err) => { console.error(err); resolve(1); });
  });
}

// Deletes test users directly (cascades posts/comments/likes/follows/
// notifications/messages) and fixes hashtag counts that direct deletes bypass.
async function cleanup() {
  const require = createRequire(import.meta.url);
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.findMany({
      where: { OR: TEST_USER_PREFIXES.map((p) => ({ username: { startsWith: p } })) },
      select: { id: true },
    });
    if (users.length === 0) {
      console.log('Cleanup: no test users found');
      return;
    }
    const ids = users.map((u) => u.id);

    const posts = await prisma.post.findMany({ where: { authorId: { in: ids } }, select: { hashtags: true } });
    for (const post of posts) {
      for (const tag of post.hashtags) {
        await prisma.hashtag.update({ where: { name: tag }, data: { postCount: { decrement: 1 } } }).catch(() => {});
      }
    }

    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    await prisma.hashtag.deleteMany({ where: { name: { in: TEST_ONLY_HASHTAGS }, postCount: 0 } });
    console.log(`Cleanup: removed ${ids.length} test users`);
  } catch (err) {
    console.error('Cleanup error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

if (!existsSync(distEntry)) {
  console.error('dist/index.js not found — run: pnpm --filter @social/api build');
  process.exit(1);
}

if (!(await portFree(Number(PORT)))) {
  console.error(`Port ${PORT} is already in use — stop any dev server and retry.`);
  process.exit(1);
}

console.log(`Starting API server on :${PORT} ...`);
const server = spawn(process.execPath, [distEntry], {
  cwd: apiRoot,
  stdio: ['ignore', 'inherit', 'inherit'],
  env: { ...process.env, PORT, API_RATE_LIMIT_MAX: '5000' },
});

let failedSuites = 0;
try {
  await waitForServer(API_URL);
  console.log('API server ready\n');

  for (const [name, args] of SUITES) {
    console.log(`=== ${name} suite ===`);
    const code = await runSuite(args);
    if (code === 0) {
      console.log(`--- ${name}: PASSED\n`);
    } else {
      failedSuites++;
      console.error(`--- ${name}: FAILED (exit ${code})\n`);
    }
  }
} catch (err) {
  failedSuites++;
  console.error('Harness error:', err.message);
} finally {
  server.kill();
  await cleanup();
}

if (failedSuites > 0) {
  console.error(`${failedSuites} suite(s) failed`);
  process.exit(1);
}
console.log('ALL SUITES PASSED');
