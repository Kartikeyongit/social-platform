import env from './helpers/env.cjs';

const API = env.API_URL;
let failures = 0;
function check(name, ok, extra = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' | ' + extra : ''}`);
  if (!ok) failures++;
}

async function gql(query, variables) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  if (body.errors) throw new Error(body.errors.map(e => e.message).join('; '));
  return body.data;
}

async function main() {
  // 1. trendingHashtags (public, cached)
  const th1 = await gql(`query { trendingHashtags(limit: 10) { name postCount } }`);
  check('trendingHashtags returns list', Array.isArray(th1.trendingHashtags) && th1.trendingHashtags.length > 0,
    `${th1.trendingHashtags.length} tags`);

  // 2. searchUsers — real search with results (contributing user matches seed data canonical names)
  const su = await gql(`query ($q:String!){ searchUsers(query: $q, limit: 10) { username displayName } }`, { q: 'jane' });
  check('searchUsers finds jane_smith', su.searchUsers.some((u) => u.username === 'jane_smith'),
    JSON.stringify(su.searchUsers.map((u) => u.username)));

  // 3. searchHashtags
  const sh = await gql(`query ($q:String!){ searchHashtags(query: $q, limit: 10) { name postCount } }`, { q: 'tech' });
  check('searchHashtags works', Array.isArray(sh.searchHashtags), JSON.stringify(sh.searchHashtags));

  // 4. exploreFeed pagination via cursor (10 then next page)
  const e1 = await gql(`query ($limit:Int){ exploreFeed(limit: $limit) { edges { node { id } } pageInfo { hasNextPage endCursor } } }`, { limit: 10 });
  const first = e1.exploreFeed.edges.length;
  let secondSize = 0;
  if (e1.exploreFeed.pageInfo.endCursor) {
    const e2 = await gql(`query ($limit:Int,$cursor:String){ exploreFeed(limit: $limit, cursor: $cursor) { edges { node { id } } pageInfo { hasNextPage endCursor } } }`,
      { limit: 10, cursor: e1.exploreFeed.pageInfo.endCursor });
    secondSize = e2.exploreFeed.edges.length;
  }
  check('exploreFeed page1=10', first === 10, `page1=${first}`);
  check('exploreFeed cursor pagination advances', secondSize > 0, `page2=${secondSize}`);

  console.log(failures === 0 ? '\nALL SMOKE CHECKS PASSED' : `\n${failures} SMOKE CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(e => { console.error('TEST ERROR:', e.message); process.exit(1); });
