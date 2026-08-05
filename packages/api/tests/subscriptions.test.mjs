import { createClient } from 'graphql-ws';
import { WebSocket } from 'ws';
import env from './helpers/env.cjs';

const API = env.API_URL;
const WS = env.WS_URL;
const ts = Date.now();
const A = `suba_${ts}`;
const B = `subb_${ts}`;
const C = `subc_${ts}`;

let failures = 0;
function check(name, ok, extra = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' | ' + extra : ''}`);
  if (!ok) failures++;
}

async function gql(query, variables, token) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  if (body.errors) throw new Error(body.errors.map((e) => e.message).join('; '));
  return body.data;
}

async function register(username) {
  const { register } = await gql(
    `mutation R($username:String!,$email:String!,$password:String!,$displayName:String!){
       register(username:$username,email:$email,password:$password,displayName:$displayName){token}
     }`,
    { username, email: `${username}@test.com`, password: 'password123', displayName: username }
  );
  return register.token;
}

function wsClient(token) {
  return createClient({
    url: WS,
    webSocketImpl: WebSocket,
    connectionParams: token ? { authToken: token } : {},
    lazy: true,
  });
}

// returns an async generator for the given query
function subscribe(client, query) {
  return client.iterate({ query });
}

async function expectNext(iterator, ms = 5000) {
  const p = iterator.next();
  const timeout = new Promise((r) => setTimeout(() => r({ value: null, done: false }), ms));
  const res = await Promise.race([p, timeout]);
  return res.value;
}

async function main() {
  const tokenA = await register(A);
  const tokenB = await register(B);
  const tokenC = await register(C);

  // B creates a post so A can like it
  const { createPost } = await gql(
    `mutation P($content:String!, $hashtags:[String!]){createPost(input:{content:$content,hashtags:$hashtags}){id content}}`,
    { content: `subscription test post ${ts}`, hashtags: ['realtime'] },
    tokenB
  );
  check('B created post', !!createPost.id);

  const clientB = wsClient(tokenB);

  const msgIter = subscribe(clientB, `subscription { newMessage { id content sender { id username } receiver { id username } } }`);
  const notifIter = subscribe(clientB, `subscription { newNotification { id type entityId actor { id username } } }`);

  // 1. real-time message delivery (A sends to B)
  const bUser = (await gql(`query Me{me{id}}`, undefined, tokenB)).me;
  await gql(
    `mutation M($input:SendMessageInput!){sendMessage(input:$input){id}}`,
    { input: { receiverId: bUser.id, content: 'hi-1' } },
    tokenA
  );
  const m1 = await expectNext(msgIter);
  check('B receives newMessage via WS', m1?.data?.newMessage?.content === 'hi-1',
    m1 ? m1.data.newMessage.content : 'no payload');

  // 2. LIKE notification
  const postId = createPost.id;
  await gql(`mutation L($postId:ID!){likePost(postId:$postId){id}}`, { postId }, tokenA);
  const n1 = await expectNext(notifIter);
  check('B receives LIKE notification via WS', n1?.data?.newNotification?.type === 'LIKE',
    n1 ? n1.data.newNotification.type : 'no payload');

  // 3. FOLLOW notification
  await gql(`mutation F($userId:ID!){followUser(userId:$userId){id}}`, { userId: bUser.id }, tokenA);
  const n2 = await expectNext(notifIter);
  check('B receives FOLLOW notification via WS', n2?.data?.newNotification?.type === 'FOLLOW',
    n2 ? n2.data.newNotification.type : 'no payload');

  // 4. topic isolation: C must NOT receive A->B messages
  const clientC = wsClient(tokenC);

  const cIter = subscribe(clientC, `subscription { newMessage { id content } }`);
  await gql(
    `mutation M($input:SendMessageInput!){sendMessage(input:$input){id}}`,
    { input: { receiverId: bUser.id, content: 'hi-2' } },
    tokenA
  );
  const m2 = await expectNext(msgIter);
  check('B receives second message via WS', m2?.data?.newMessage?.content === 'hi-2',
    m2 ? m2.data.newMessage.content : 'no payload');
  const cGot = await expectNext(cIter, 1500);
  check('C does NOT receive A->B message (topic isolation)', cGot === null,
    cGot ? `unexpected: ${JSON.stringify(cGot.data)}` : 'silent');

  // 5. unauthenticated subscribe rejected
  const anon = wsClient(null);

  let anonError = null;
  await new Promise((resolve) => {
    anon.subscribe(
      { query: `subscription { newMessage { id } }` },
      {
        next: (payload) => { if (payload?.errors?.length) anonError = payload.errors[0].message; resolve(); },
        error: (e) => { anonError = String(e); resolve(); },
        complete: resolve,
      }
    );
  });
  check('unauthenticated subscribe rejected', !!anonError, anonError ? String(anonError) : 'no error');

  // cleanup: close clients
  await clientB.dispose();
  await clientC.dispose();
  await anon.dispose();

  console.log(failures === 0 ? '\nALL WS CHECKS PASSED' : `\n${failures} WS CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => { console.error('TEST ERROR:', e.message); process.exit(1); });
