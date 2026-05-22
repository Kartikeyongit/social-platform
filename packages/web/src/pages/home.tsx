import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useLazyQuery, gql } from '@apollo/client';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/components/icons';
import { TrendingSidebar } from '@/components/home/TrendingSidebar';
import { useRouter } from 'next/router';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const GET_FEED = gql`
  query GetFeed($limit: Int, $cursor: String) {
    feed(limit: $limit, cursor: $cursor) {
      edges {
        node {
          id content mediaUrls hashtags likeCount commentCount isLiked createdAt
          author { id username displayName avatarUrl }
        }
        cursor
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

const CREATE_POST = gql`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id content mediaUrls hashtags likeCount commentCount createdAt
      author { id username displayName avatarUrl }
    }
  }
`;

const LIKE_POST = gql` mutation LikePost($postId: ID!) { likePost(postId: $postId) { id likeCount isLiked } } `;
const UNLIKE_POST = gql` mutation UnlikePost($postId: ID!) { unlikePost(postId: $postId) { id likeCount isLiked } } `;
const CREATE_COMMENT = gql` mutation CreateComment($input: CreateCommentInput!) { createComment(input: $input) { id content createdAt author { id username displayName } } } `;
const SUGGEST_HASHTAGS = gql` query SuggestHashtags($content: String!) { suggestHashtags(content: $content) } `;

const HeartBurst = () => (
  <div className="absolute inset-0 pointer-events-none">
    {[...Array(6)].map((_, i) => (
      <motion.div key={i} initial={{ x:0,y:0,opacity:1,scale:0 }}
        animate={{ x:Math.cos(i*60*Math.PI/180)*18, y:Math.sin(i*60*Math.PI/180)*18, opacity:0, scale:1 }}
        transition={{ duration:0.5 }} className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full"
        style={{background:['#ef4444','#f97316','#f59e0b','#ec4899','#8b5cf6','#3b82f6'][i]}} />
    ))}
  </div>
);

const POSTS_PER_PAGE = 10;

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [content, setContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [commentInputs, setCommentInputs] = useState<{[k:string]:string}>({});
  const [showComments, setShowComments] = useState<{[k:string]:boolean}>({});
  const [isPosting, setIsPosting] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [burstingPosts, setBurstingPosts] = useState<Set<string>>(new Set());
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  const { data, loading, fetchMore, refetch } = useQuery(GET_FEED, {
    variables: { limit: POSTS_PER_PAGE },
    fetchPolicy: 'network-only',
    onCompleted: (newData) => {
      if (newData?.feed?.edges) {
        const newPosts = newData.feed.edges.map((e:any) => e.node);
        setAllPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          return [...prev, ...newPosts.filter((p:any) => !existingIds.has(p.id))];
        });
        setHasMore(newData.feed.pageInfo.hasNextPage);
        if (newData.feed.pageInfo.endCursor) {
          setCurrentCursor(newData.feed.pageInfo.endCursor);
        }
      }
    },
  });

  const [createPost] = useMutation(CREATE_POST, {
    onCompleted: () => { setContent(''); setMediaUrls([]); setSuggestions([]); setIsPosting(false); setAllPosts([]); setCurrentCursor(null); refetch(); toast.success('Posted!'); },
    onError: () => { setIsPosting(false); toast.error('Failed to create post'); },
  });

  const [getSuggestions] = useLazyQuery(SUGGEST_HASHTAGS, { onCompleted: (d) => setSuggestions(d.suggestHashtags || []) });
  const [likePost] = useMutation(LIKE_POST);
  const [unlikePost] = useMutation(UNLIKE_POST);
  const [createComment] = useMutation(CREATE_COMMENT);

  useEffect(() => {
    if (content.length > 3) { const t = setTimeout(() => getSuggestions({ variables: { content } }), 600); return () => clearTimeout(t); }
    else setSuggestions([]);
  }, [content]);

  const loadMore = async () => {
    if (!hasMore || !currentCursor || isLoadingMore || loading) return;
    setIsLoadingMore(true);
    try {
      const result = await fetchMore({
        variables: { limit: POSTS_PER_PAGE, cursor: currentCursor },
      });
      if (result.data?.feed?.edges) {
        const newPosts = result.data.feed.edges.map((e:any) => e.node);
        setAllPosts(prev => { const ids = new Set(prev.map(p=>p.id)); return [...prev, ...newPosts.filter((p:any)=>!ids.has(p.id))]; });
        setHasMore(result.data.feed.pageInfo.hasNextPage);
        if (result.data.feed.pageInfo.endCursor) {
          setCurrentCursor(result.data.feed.pageInfo.endCursor);
        }
      }
    } catch (e) {}
    finally { setIsLoadingMore(false); }
  };

  useEffect(() => {
    const el = loaderRef.current; if (!el) return;
    const observer = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) loadMore(); }, { rootMargin: '300px' });
    observer.observe(el); return () => observer.disconnect();
  }, [currentCursor, hasMore, loading, isLoadingMore]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setIsUploading(true); const fd = new FormData(); fd.append('image', file);
    try { const r = await fetch(`${API_URL}/upload`, { method:'POST', body:fd }); const d = await r.json(); if (d.url) setMediaUrls([...mediaUrls, d.url]); }
    catch { toast.error('Upload failed'); } finally { setIsUploading(false); }
  };

  const addHashtag = (tag: string) => { if (!content.includes(`#${tag}`)) setContent(content+` #${tag}`); setSuggestions([]); };
  const handleCreatePost = async (e: React.FormEvent) => { e.preventDefault(); if (!content.trim()||isPosting) return; setIsPosting(true); const tags = content.match(/#(\w+)/g)?.map(t=>t.slice(1))||[]; await createPost({ variables:{ input:{ content, hashtags:tags, mediaUrls } } }); };
  const handleLike = async (id:string, liked:boolean) => { liked ? await unlikePost({variables:{postId:id}}) : await likePost({variables:{postId:id}}); };
  const handleComment = async (id:string) => { const c=commentInputs[id]; if(!c?.trim()) return; await createComment({variables:{input:{postId:id, content:c}}}); setCommentInputs({...commentInputs,[id]:''}); toast.success('Comment added!'); };

  const posts = allPosts;
  const isPostLiked = (post:any) => post.isLiked || likedPosts.has(post.id);

  return (
    <div className="flex gap-6">
      <div className="flex-1 max-w-2xl space-y-6">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-display">Home</h1>
        </motion.div>

        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="bg-white dark:bg-dark-50 rounded-3xl border border-slate-200/60 dark:border-dark-100 shadow-soft p-5">
          <form onSubmit={handleCreatePost}>
            <div className="flex space-x-3">
              <Link href={`/profile/${user?.username}`}>
                {user?.avatarUrl ? <img src={user.avatarUrl} className="w-10 h-10 rounded-full object-cover flex-shrink-0" alt="" /> : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">{user?.displayName?.charAt(0)?.toUpperCase()||'U'}</div>}
              </Link>
              <div className="flex-1">
                <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="What's on your mind?" rows={2} className="w-full resize-none bg-transparent text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none min-h-[60px] text-sm" />
                {suggestions.length>0 && (<div className="mt-2 flex flex-wrap gap-1.5"><span className="text-[10px] text-slate-400">AI:</span>{suggestions.map(tag=>(<button key={tag} type="button" onClick={()=>addHashtag(tag)} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-600 border border-brand-200 hover:bg-brand-100 transition-colors"><Icons.Hash className="w-3 h-3 mr-0.5"/>{tag}<span className="ml-1 text-brand-400">+</span></button>))}</div>)}
                {mediaUrls.length>0 && (<div className="flex flex-wrap gap-2 mt-2">{mediaUrls.map((url,i)=>(<div key={i} className="relative"><img src={url} className="w-20 h-20 object-cover rounded-xl" alt="" /><button type="button" onClick={()=>setMediaUrls(mediaUrls.filter((_,idx)=>idx!==i))} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">×</button></div>))}</div>)}
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 dark:border-dark-100">
                  <label className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-dark-50 text-slate-400 hover:text-brand-600 transition-colors cursor-pointer"><Icons.CreatePost className="w-4 h-4"/><input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading}/></label>
                  <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} type="submit" disabled={!content.trim()||isPosting} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-all disabled:opacity-50">{isPosting?'...':'Post'}</motion.button>
                </div>
              </div>
            </div>
          </form>
        </motion.div>

        {loading && posts.length===0 && <div className="space-y-4">{[...Array(3)].map((_,i)=>(<div key={i} className="bg-white dark:bg-dark-50 rounded-3xl border border-slate-200/60 dark:border-dark-100 shadow-soft p-5 animate-pulse"><div className="flex items-center space-x-3 mb-3"><div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-dark-100"/><div className="space-y-2 flex-1"><div className="h-3 bg-slate-200 dark:bg-dark-100 rounded-full w-24"/><div className="h-2 bg-slate-200 dark:bg-dark-100 rounded-full w-16"/></div></div><div className="space-y-2"><div className="h-3 bg-slate-200 dark:bg-dark-100 rounded-full w-3/4"/><div className="h-3 bg-slate-200 dark:bg-dark-100 rounded-full w-1/2"/></div></div>))}</div>}

        <AnimatePresence>
          {posts.map((post:any)=>(
            <motion.div key={post.id} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="bg-white dark:bg-dark-50 rounded-3xl border border-slate-200/60 dark:border-dark-100 shadow-soft hover:shadow-lg transition-all duration-300 p-5">
              <div className="flex items-start justify-between mb-3">
                <Link href={`/profile/${post.author.username}`} className="flex items-center space-x-3 group">
                  {post.author.avatarUrl ? <img src={post.author.avatarUrl} className="w-10 h-10 rounded-full object-cover flex-shrink-0" alt="" /> : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">{post.author.displayName.charAt(0).toUpperCase()}</div>}
                  <div><h3 className="font-semibold text-sm text-slate-900 dark:text-white group-hover:underline">{post.author.displayName}</h3><p className="text-xs text-slate-500 dark:text-slate-400">@{post.author.username} · {formatDistanceToNow(new Date(post.createdAt),{addSuffix:true})}</p></div>
                </Link>
                <button onClick={()=>router.push(`/post/${post.id}`)} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-dark-50 text-slate-400 hover:text-slate-600 transition-colors"><Icons.More className="w-4 h-4"/></button>
              </div>
              <p className="text-slate-800 dark:text-slate-200 mb-3 text-sm leading-relaxed">{post.content}</p>
              {post.mediaUrls?.length>0 && <div className="mb-3 rounded-2xl overflow-hidden"><img src={post.mediaUrls[0]} className="w-full h-48 object-cover" alt=""/></div>}
              {post.hashtags?.length>0 && <div className="flex flex-wrap gap-1.5 mb-3">{post.hashtags.map((tag:string)=><span key={tag} className="tag-premium text-xs px-2 py-0.5"><Icons.Hash className="w-3 h-3 mr-0.5"/>{tag}</span>)}</div>}
              <div className="flex items-center pt-3 border-t border-slate-100 dark:border-dark-100">
                <motion.button whileTap={{scale:0.85}} onClick={()=>handleLike(post.id,isPostLiked(post))} className={`relative flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition-colors group ${isPostLiked(post)?'text-red-500':'text-slate-400 hover:text-red-400'}`}>
                  {burstingPosts.has(post.id) && <HeartBurst/>}
                  <Icons.Like className={`w-4 h-4 transition-all group-hover:scale-110 relative z-10 ${isPostLiked(post)?'fill-red-500':''}`}/>
                  <span className="text-xs font-medium relative z-10">{post.likeCount}</span>
                </motion.button>
                <motion.button whileTap={{scale:0.95}} onClick={()=>setShowComments({...showComments,[post.id]:!showComments[post.id]})} className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition-colors group ${showComments[post.id]?'text-brand-500':'text-slate-400 hover:text-brand-500'}`}>
                  <Icons.Comment className="w-4 h-4 transition-all group-hover:scale-110"/>
                  <span className="text-xs font-medium">{post.commentCount}</span>
                </motion.button>
                <motion.button whileTap={{scale:0.95}} className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition-colors group ml-auto text-slate-400 hover:text-green-500"><Icons.Share className="w-4 h-4 transition-all group-hover:scale-110"/></motion.button>
              </div>
              <AnimatePresence>
                {showComments[post.id] && (
                  <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-dark-100">
                      <div className="flex space-x-2">
                        <input type="text" value={commentInputs[post.id]||''} onChange={e=>setCommentInputs({...commentInputs,[post.id]:e.target.value})} onKeyPress={e=>e.key==='Enter'&&handleComment(post.id)} placeholder="Write a comment..." className="input-premium flex-1 text-xs py-2"/>
                        <button onClick={()=>handleComment(post.id)} className="bg-brand-600 hover:bg-brand-700 text-white px-3 py-2 rounded-xl text-xs font-medium"><Icons.Send className="w-3 h-3"/></button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>

        <div ref={loaderRef} className="py-8 flex flex-col items-center">
          {isLoadingMore && <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mb-2"/>}
          {!hasMore && posts.length > 0 && <p className="text-xs text-slate-400 dark:text-slate-500">You've reached the end</p>}
        </div>
      </div>
      <div className="hidden lg:block w-80 flex-shrink-0"><div className="sticky top-4 space-y-4"><TrendingSidebar/></div></div>
    </div>
  );
}
