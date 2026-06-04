import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Icons } from '@/components/icons';
import Link from 'next/link';

const GET_FOLLOWING = gql`
  query GetFollowing($username: String!) {
    following(username: $username) {
      id
      username
      displayName
      avatarUrl
    }
  }
`;

const GET_MESSAGES = gql`
  query GetMessages($receiverId: ID!, $limit: Int) {
    messages(receiverId: $receiverId, limit: $limit) {
      edges {
        node {
          id
          content
          read
          createdAt
          sender { id username displayName avatarUrl }
          receiver { id username displayName avatarUrl }
        }
      }
    }
  }
`;

const SEND_MESSAGE = gql`
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      id
      content
      createdAt
      sender { id username displayName avatarUrl }
      receiver { id username displayName avatarUrl }
    }
  }
`;

export default function MessagesPage() {
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messageInput, setMessageInput] = useState('');
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: followingData, loading: followingLoading } = useQuery(GET_FOLLOWING, {
    variables: { username: user?.username || '' },
    skip: !user?.username,
  });

  const { data: messagesData, loading: messagesLoading, refetch } = useQuery(GET_MESSAGES, {
    variables: { receiverId: selectedUser?.id, limit: 100 },
    skip: !selectedUser,
    fetchPolicy: 'network-only',
    pollInterval: 2000, // Poll every 2 seconds
  });

  const [sendMessage, { loading: sendingMessage }] = useMutation(SEND_MESSAGE);

  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedUser || sendingMessage) return;
    
    try {
      await sendMessage({
        variables: {
          input: {
            receiverId: selectedUser.id,
            content: messageInput.trim(),
          },
        },
      });
      setMessageInput('');
      setLastRefresh(Date.now());
      // Force immediate refetch
      setTimeout(() => refetch(), 300);
    } catch (error) {
      console.error('Send failed:', error);
    }
  }, [messageInput, selectedUser, sendingMessage, sendMessage, refetch]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messagesData, lastRefresh]);

  const following = followingData?.following || [];
  const messages = messagesData?.messages?.edges?.map((e: any) => e.node) || [];

  return (
    <div className="">
      <div className="bg-white dark:bg-dark-50 rounded-3xl border border-slate-200/60 dark:border-dark-100 shadow-soft flex h-[644px] overflow-hidden">
        {/* Following List */}
        <div className="w-80 border-r border-slate-200 dark:border-dark-100 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-slate-200 dark:border-dark-100">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Following</p>
          </div>
          <div className="overflow-y-auto flex-1 scrollbar-hide">
            {followingLoading ? (
              <div className="p-2 space-y-1">{[...Array(4)].map((_,i)=><div key={i} className="p-3 animate-pulse"><div className="flex items-center space-x-3"><div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-dark-100"/><div className="space-y-2 flex-1"><div className="h-4 bg-slate-200 dark:bg-dark-100 rounded-full w-24"/><div className="h-3 bg-slate-200 dark:bg-dark-100 rounded-full w-16"/></div></div></div>)}</div>
            ) : following.length === 0 ? (
              <div className="p-6 text-center">
                <Icons.Profile className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3"/>
                <p className="text-sm text-slate-500 dark:text-slate-400">Not following anyone yet</p>
                <Link href="/explore" className="text-sm text-brand-600 hover:text-brand-700 mt-1 inline-block">Discover people</Link>
              </div>
            ) : (
              <div className="space-y-0.5 p-2">
                {following.map((person: any) => (
                  <div key={person.id} onClick={() => setSelectedUser(person)}
                    className={`p-3 rounded-2xl cursor-pointer transition-colors ${selectedUser?.id === person.id ? 'bg-brand-50 dark:bg-brand-900/20' : 'hover:bg-slate-50 dark:hover:bg-dark-50'}`}>
                    <div className="flex items-center space-x-3">
                      {person.avatarUrl ? <img src={person.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0"/> :
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-md flex-shrink-0">{person.displayName.charAt(0).toUpperCase()}</div>}
                      <div className="flex-1 min-w-0"><p className="font-medium text-sm text-slate-900 dark:text-white truncate">{person.displayName}</p><p className="text-xs text-slate-500 dark:text-slate-400 truncate">@{person.username}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedUser ? (
            <>
              <div className="p-4 border-b border-slate-200 dark:border-dark-100 flex-shrink-0">
                <Link href={`/profile/${selectedUser.username}`} className="flex items-center space-x-3">
                  {selectedUser.avatarUrl ? <img src={selectedUser.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover"/> :
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-md">{selectedUser.displayName.charAt(0).toUpperCase()}</div>}
                  <div><p className="font-semibold text-slate-900 dark:text-white">{selectedUser.displayName}</p><p className="text-sm text-slate-500 dark:text-slate-400">@{selectedUser.username}</p></div>
                </Link>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"/></div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full"><div className="text-center"><Icons.Messages className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3"/><p className="text-slate-500 dark:text-slate-400 text-sm">No messages yet</p><p className="text-xs text-slate-400 mt-1">Say hello!</p></div></div>
                ) : (
                  messages.map((msg: any) => {
                    const isMine = msg.sender.id === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMine ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-dark-100 text-slate-900 dark:text-white'}`}>
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${isMine ? 'text-blue-200' : 'text-slate-400'}`}>{formatDistanceToNow(new Date(msg.createdAt),{addSuffix:true})}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef}/>
              </div>
              <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-dark-100 flex-shrink-0">
                <div className="flex space-x-2">
                  <input type="text" value={messageInput} onChange={e=>setMessageInput(e.target.value)} placeholder="Type a message..." className="input-premium flex-1"/>
                  <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} type="submit" disabled={!messageInput.trim()||sendingMessage} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-2xl font-medium transition-all disabled:opacity-50">
                    {sendingMessage ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/> : <Icons.Send className="w-5 h-5"/>}
                  </motion.button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center"><div className="text-center"><Icons.Messages className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4"/><p className="text-slate-500 dark:text-slate-400 text-lg">Select a conversation</p><p className="text-sm text-slate-400 mt-1">Choose someone you follow to start chatting</p></div></div>
          )}
        </div>
      </div>
    </div>
  );
}
