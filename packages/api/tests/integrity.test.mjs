import env from './helpers/env.cjs';

const API = env.API_URL;

let failures = 0;
function check(name, cond, extra = '') {
  if (cond) console.log(`  PASS ${name}`);
  else { failures++; console.log(`  FAIL ${name} ${extra}`); }
}

async function gql(query, variables, token) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  if (body.errors) throw new Error(`${query.split('\n')[0].trim()} -> ${JSON.stringify(body.errors.map(e => e.message))}`);
  return body.data;
}

const ts = Date.now();
const uA = `inua_${ts}`;
const uB = `inub_${ts}`;

async function main() {
  const { register: ra } = await gql(
    `mutation R($username:String!,$email:String!,$password:String!,$displayName:String!){register(username:$username,email:$email,password:$password,displayName:$displayName){token user{id username email}}}`,
    { username: uA, email: `${uA}@test.com`, password: 'password123', displayName: 'Integ A' });
  const { register: rb } = await gql(
    `mutation R($username:String!,$email:String!,$password:String!,$displayName:String!){register(username:$username,email:$email,password:$password,displayName:$displayName){token user{id username email}}}`,
    { username: uB, email: `${uB}@test.com`, password: 'password123', displayName: 'Integ B' });
  check('register', !!ra.token && !!rb.token);
  check('email visible to self', ra.user.email === `${uA}@test.com`);

  const tokenA = ra.token, tokenB = rb.token;
  const userAId = ra.user.id;
  const userBId = rb.user.id;

  // Public queries must not leak email
  const su = await gql(`query Q($q:String!){searchUsers(query:$q){username email}}`, { q: uB }, tokenA);
  check('email hidden in search for others', su.searchUsers[0].email === null, JSON.stringify(su.searchUsers[0]));

  // Follow A -> B twice: second should be idempotent, only ONE notification
  await gql(`mutation F($userId:ID!){followUser(userId:$userId){id}}`, { userId: userBId }, tokenA);
  await gql(`mutation F($userId:ID!){followUser(userId:$userId){id}}`, { userId: userBId }, tokenA);
  const notifB = await gql(`query N{notifications(limit:10){type actor{id}}}`, {}, tokenB);
  const followNotifs = notifB.notifications.filter(n => n.type === 'FOLLOW');
  check('follow dedupe: single notification', followNotifs.length === 1, `count=${followNotifs.length}`);

  // Create post with hashtag, then like twice (idempotent), then unlike -> notification removed
  const { createPost: post } = await gql(
    `mutation C($input:CreatePostInput!){createPost(input:$input){id hashtags likeCount author{id}}}`,
    { input: { content: `Integ test post ${ts} #integritytest`, hashtags: ['integritytest'], mediaUrls: [] } }, tokenA);
  check('createPost', !!post.id);

  let ht = await gql(`query T($q:String!){searchHashtags(query:$q){name postCount}}`, { q: 'integritytest' }, tokenA);
  check('hashtag postCount 1', ht.searchHashtags[0].postCount === 1, JSON.stringify(ht.searchHashtags));

  const like1 = await gql(`mutation L($postId:ID!){likePost(postId:$postId){id likeCount}}`, { postId: post.id }, tokenB);
  const like2 = await gql(`mutation L($postId:ID!){likePost(postId:$postId){id likeCount}}`, { postId: post.id }, tokenB);
  check('double-like idempotent, count=1', like1.likePost.likeCount === 1 && like2.likePost.likeCount === 1, JSON.stringify(like2.likePost));

  const likeNotif = await gql(`query N{notifications(limit:10){type actor{id}}}`, {}, tokenA);
  check('LIKE notification created', likeNotif.notifications.some(n => n.type === 'LIKE'));

  const unlike = await gql(`mutation U($postId:ID!){unlikePost(postId:$postId){likeCount}}`, { postId: post.id }, tokenB);
  check('unlike count=0', unlike.unlikePost.likeCount === 0);
  const noLikeNotif = await gql(`query N{notifications(limit:10){type}}`, {}, tokenA);
  check('unlike removes LIKE notification', !noLikeNotif.notifications.some(n => n.type === 'LIKE'));

  // Comment increments count + notification
  const { createComment } = await gql(
    `mutation C($input:CreateCommentInput!){createComment(input:$input){id}}`,
    { input: { postId: post.id, content: 'Nice post!' } }, tokenB);
  check('createComment', !!createComment.id);
  const postAfter = await gql(`query P($id:ID!){post(id:$id){commentCount}}`, { id: post.id }, tokenA);
  check('commentCount=1', postAfter.post.commentCount === 1);

  // Feed pagination with composite cursors (3 posts of A, feed limit 2)
  await gql(`mutation C($input:CreatePostInput!){createPost(input:$input){id}}`, { input: { content: `feed post 2 ${ts}`, hashtags: [], mediaUrls: [] } }, tokenA);
  await gql(`mutation C($input:CreatePostInput!){createPost(input:$input){id}}`, { input: { content: `feed post 3 ${ts}`, hashtags: [], mediaUrls: [] } }, tokenA);
  const f1 = await gql(`query F($limit:Int){feed(limit:$limit){edges{node{content}cursor}pageInfo{hasNextPage endCursor}}}`, { limit: 2 }, tokenA);
  const f2 = await gql(`query F($limit:Int,$cursor:String){feed(limit:$limit,cursor:$cursor){edges{node{content}}pageInfo{hasNextPage}}}`, { limit: 2, cursor: f1.feed.pageInfo.endCursor }, tokenA);
  const p1c = f1.feed.edges.map(e => e.node.content);
  const p2c = f2.feed.edges.map(e => e.node.content);
  const overlap = p1c.filter(c => p2c.includes(c));
  check('feed page1 has 2, hasNext', f1.feed.edges.length === 2 && f1.feed.pageInfo.hasNextPage);
  check('feed pagination no overlap', overlap.length === 0, `p1=${JSON.stringify(p1c)} p2=${JSON.stringify(p2c)}`);
  check('feed composite cursor format', f1.feed.edges[0].cursor.includes('_'));

  // Limit clamping: limit 100000 -> at most 50
  const clamp = await gql(`query F($limit:Int){feed(limit:$limit){edges{node{id}}}}`, { limit: 100000 }, tokenA);
  check('limit clamped to 50', clamp.feed.edges.length <= 50, `got ${clamp.feed.edges.length}`);

  // Messages pagination: 55 messages A->B, fetch 25/25/5 ascending, no overlap
  for (let i = 0; i < 55; i++) {
    await gql(`mutation S($input:SendMessageInput!){sendMessage(input:$input){id}}`, { input: { receiverId: userBId, content: `msg ${i}` } }, tokenA);
  }
  const m1 = await gql(`query M($receiverId:ID!,$limit:Int){messages(receiverId:$receiverId,limit:$limit){edges{node{content}}pageInfo{hasNextPage endCursor}}}`, { receiverId: userBId, limit: 25 }, tokenA);
  const m2 = await gql(`query M($receiverId:ID!,$limit:Int,$cursor:String){messages(receiverId:$receiverId,limit:$limit,cursor:$cursor){edges{node{content}}pageInfo{hasNextPage endCursor}}}`, { receiverId: userBId, limit: 25, cursor: m1.messages.pageInfo.endCursor }, tokenA);
  const m3 = await gql(`query M($receiverId:ID!,$limit:Int,$cursor:String){messages(receiverId:$receiverId,limit:$limit,cursor:$cursor){edges{node{content}}pageInfo{hasNextPage}}}`, { receiverId: userBId, limit: 25, cursor: m2.messages.pageInfo.endCursor }, tokenA);
  const m1c = m1.messages.edges.map(e => parseInt(e.node.content.split(' ')[1]));
  const m2c = m2.messages.edges.map(e => parseInt(e.node.content.split(' ')[1]));
  const m3c = m3.messages.edges.map(e => parseInt(e.node.content.split(' ')[1]));
  const all = [...m1c, ...m2c, ...m3c];
  const isAsc = all.every((v, i) => i === 0 || all[i - 1] < v);
  const noDup = new Set(all).size === all.length;
  check('messages: page1=25 ascending 0..24', m1c.length === 25 && m1c[0] === 0 && m1c[24] === 24);
  check('messages: page2=25 ascending 25..49', m2c.length === 25 && m2c[0] === 25 && m2c[24] === 49, JSON.stringify(m2c));
  check('messages: page3=5 (50..54)', m3c.length === 5 && m3c[0] === 50 && m3c[4] === 54, JSON.stringify(m3c));
  check('messages: strictly ascending no dupes', isAsc && noDup);

  // Conversations: A has exactly 1 partner (B), ordered, with preview + unread count
  const conv = await gql(`query C{conversations(limit:10){user{username} unreadCount lastMessage{content}}}`, {}, tokenA);
  check('conversations: 1 partner', conv.conversations.length === 1 && conv.conversations[0].user.username === uB, JSON.stringify(conv.conversations));
  check('conversations: preview is latest msg', conv.conversations[0].lastMessage.content === 'msg 54', JSON.stringify(conv.conversations[0].lastMessage));
  check('conversations: unreadCount 0 (A sent them)', conv.conversations[0].unreadCount === 0, JSON.stringify(conv.conversations[0].unreadCount));

  // markConversationRead clears unread for the receiver side
  await gql(`mutation MCR($receiverId:ID!){markConversationRead(receiverId:$receiverId)}`, { receiverId: userBId }, tokenB);
  const convB = await gql(`query C{conversations(limit:10){user{username} unreadCount}}`, {}, tokenB);
  check('conversations: B sees 1 partner, 55 unread', convB.conversations.length === 1 && convB.conversations[0].user.username === uA && convB.conversations[0].unreadCount === 55, JSON.stringify(convB.conversations));
  await gql(`mutation MCR($receiverId:ID!){markConversationRead(receiverId:$receiverId)}`, { receiverId: userAId }, tokenB);
  const convB2 = await gql(`query C{conversations(limit:10){unreadCount}}`, {}, tokenB);
  check('conversations: markConversationRead clears unread', convB2.conversations[0].unreadCount === 0, JSON.stringify(convB2.conversations));

  // Notifications pagination (A has ~1 notification; use limit+hasNext=false sanity + composite)
  const n1 = await gql(`query N($limit:Int){notifications(limit:$limit){id}}`, { limit: 5 }, tokenB);
  check('notifications query works', Array.isArray(n1.notifications));

  // deletePost decrements hashtag count
  await gql(`mutation D($id:ID!){deletePost(id:$id)}`, { id: post.id }, tokenA);
  ht = await gql(`query T($q:String!){searchHashtags(query:$q){name postCount}}`, { q: 'integritytest' }, tokenA);
  check('hashtag postCount 0 after delete', ht.searchHashtags[0].postCount === 0, JSON.stringify(ht.searchHashtags));

  // deletePost authz: B cannot delete A's remaining posts
  const otherPost = await gql(`query F($limit:Int){feed(limit:$limit){edges{node{id content}}}}`, { limit: 10 }, tokenA);
  const target = otherPost.feed.edges.find(e => e.node.content.startsWith('feed post'));
  let denied = false;
  try { await gql(`mutation D($id:ID!){deletePost(id:$id)}`, { id: target.node.id }, tokenB); } catch { denied = true; }
  check('deletePost authz enforced', denied);

  // Validation: empty search rejected
  let searchErr = false;
  try { await gql(`query Q($q:String!){searchUsers(query:$q){username}}`, { q: '' }, tokenA); } catch { searchErr = true; }
  check('empty search rejected', searchErr);

  // --- Account management: username availability + rename ---
  const uC = `inuc_${ts}`;
  const { register: rc } = await gql(
    `mutation R($username:String!,$email:String!,$password:String!,$displayName:String!){register(username:$username,email:$email,password:$password,displayName:$displayName){token user{id username email hasPassword}}}`,
    { username: uC, email: `${uC}@test.com`, password: 'password123', displayName: 'Integ C' });
  const tokenC = rc.token;
  const userCId = rc.user.id;
  check('register returns hasPassword=true', rc.user.hasPassword === true, JSON.stringify(rc.user));

  const availFree = await gql(`query A($u:String!){usernameAvailable(username:$u)}`, { u: `fresh_${ts}` }, tokenC);
  const availTaken = await gql(`query A($u:String!){usernameAvailable(username:$u)}`, { u: uA }, tokenC);
  const availTakenCase = await gql(`query A($u:String!){usernameAvailable(username:$u)}`, { u: uA.toUpperCase() }, tokenC);
  check('usernameAvailable: free handle true', availFree.usernameAvailable === true);
  check('usernameAvailable: taken handle false', availTaken.usernameAvailable === false);
  check('usernameAvailable: case-variant taken false', availTakenCase.usernameAvailable === false);

  const newHandle = `inuc2_${ts}`;
  const { updateProfile: renamed } = await gql(
    `mutation U($input:UpdateProfileInput!){updateProfile(input:$input){id username}}`,
    { input: { username: newHandle } }, tokenC);
  check('username rename succeeds', renamed.username === newHandle, JSON.stringify(renamed));
  const oldResolves = await gql(`query Q($u:String!){user(username:$u){id}}`, { u: uC }, tokenC);
  const newResolves = await gql(`query Q($u:String!){user(username:$u){id}}`, { u: newHandle }, tokenC);
  check('old handle no longer resolves', oldResolves.user === null, JSON.stringify(oldResolves));
  check('new handle resolves', newResolves.user?.id === userCId);

  let takenErr = false;
  try { await gql(`mutation U($input:UpdateProfileInput!){updateProfile(input:$input){username}}`, { input: { username: uA } }, tokenC); } catch { takenErr = true; }
  check('rename to taken handle rejected', takenErr);
  let takenCaseErr = false;
  try { await gql(`mutation U($input:UpdateProfileInput!){updateProfile(input:$input){username}}`, { input: { username: uA.toUpperCase() } }, tokenC); } catch { takenCaseErr = true; }
  check('rename to case-variant taken handle rejected', takenCaseErr);
  let badFormatErr = false;
  try { await gql(`mutation U($input:UpdateProfileInput!){updateProfile(input:$input){username}}`, { input: { username: 'bad handle!' } }, tokenC); } catch { badFormatErr = true; }
  check('rename to invalid format rejected', badFormatErr);

  // --- Account management: change password ---
  let wrongCurrent = false;
  try { await gql(`mutation CP($c:String!,$n:String!){changePassword(currentPassword:$c,newPassword:$n)}`, { c: 'wrongpassword', n: 'newpassword456' }, tokenC); } catch { wrongCurrent = true; }
  check('changePassword rejects wrong current password', wrongCurrent);
  const changedPw = await gql(`mutation CP($c:String!,$n:String!){changePassword(currentPassword:$c,newPassword:$n)}`, { c: 'password123', n: 'newpassword456' }, tokenC);
  check('changePassword succeeds with correct current', changedPw.changePassword === true);
  const relogin = await gql(
    `mutation L($email:String!,$password:String!){login(email:$email,password:$password){token user{id}}}`,
    { email: `${uC}@test.com`, password: 'newpassword456' }, tokenC);
  check('login works with new password', !!relogin.login?.token);

  // --- Account management: delete account ---
  const delPost = await gql(
    `mutation C($input:CreatePostInput!){createPost(input:$input){id hashtags}}`,
    { input: { content: `delete me ${ts} #deltag`, hashtags: ['deltag'], mediaUrls: [] } }, tokenC);
  check('delete-account pre-post created', !!delPost.createPost.id);
  let delNoPw = false;
  try { await gql(`mutation D($p:String){deleteAccount(password:$p)}`, { p: null }, tokenC); } catch { delNoPw = true; }
  check('deleteAccount requires password', delNoPw);
  let delWrongPw = false;
  try { await gql(`mutation D($p:String){deleteAccount(password:$p)}`, { p: 'wrongpassword' }, tokenC); } catch { delWrongPw = true; }
  check('deleteAccount rejects wrong password', delWrongPw);
  const deleted = await gql(`mutation D($p:String){deleteAccount(password:$p)}`, { p: 'newpassword456' }, tokenC);
  check('deleteAccount succeeds', deleted.deleteAccount === true);
  const gone = await gql(`query Q($u:String!){user(username:$u){id}}`, { u: newHandle }, tokenA);
  check('deleted user no longer resolves', gone.user === null, JSON.stringify(gone));
  const delTag = await gql(`query T($q:String!){searchHashtags(query:$q){name postCount}}`, { q: 'deltag' }, tokenA);
  check('hashtag count decremented after account delete', delTag.searchHashtags.length === 0 || delTag.searchHashtags[0].postCount === 0, JSON.stringify(delTag.searchHashtags));

  console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(e => { console.error('TEST ERROR:', e.message); process.exit(1); });
