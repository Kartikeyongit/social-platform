import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useLazyQuery, useSubscription, gql } from '@apollo/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, isSameDay, isYesterday, formatDistanceToNow } from 'date-fns';
import { Icons } from '@/components/icons';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { cn } from '@/utils/cn';
import { Avatar } from '@/components/ui/Avatar';
import { Button, IconButton } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { ChatBubble, DayDivider } from '@/components/ui/ChatBubble';
import { ListSkeleton } from '@/components/ui/Skeleton';

const GET_CONVERSATIONS = gql`
  query GetConversations($limit: Int) {
    conversations(limit: $limit) {
      user { id username displayName avatarUrl }
      lastMessage { id content read createdAt sender { id username } }
      unreadCount
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

const MARK_CONVERSATION_READ = gql`
  mutation MarkConversationRead($receiverId: ID!) {
    markConversationRead(receiverId: $receiverId)
  }
`;

const NEW_MESSAGE_SUB = gql`
  subscription NewMessage {
    newMessage {
      id
      content
      read
      createdAt
      sender { id username displayName avatarUrl }
      receiver { id username displayName avatarUrl }
    }
  }
`;

const SEARCH_USERS = gql`
  query SearchUsers($query: String!, $limit: Int) {
    searchUsers(query: $query, limit: $limit) {
      id username displayName avatarUrl bio
    }
  }
`;

const GET_USER = gql`
  query GetUserByUsername($username: String!) {
    user(username: $username) {
      id username displayName avatarUrl bio
    }
  }
`;

const CONVERSATIONS_LIMIT = 50;

export default function MessagesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messageInput, setMessageInput] = useState('');
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    data: convData,
    loading: convLoading,
    error: convError,
    refetch: refetchConversations,
  } = useQuery(GET_CONVERSATIONS, {
    variables: { limit: CONVERSATIONS_LIMIT },
    fetchPolicy: 'network-only',
  });

  const { data: messagesData, loading: messagesLoading, error: messagesError, refetch } = useQuery(GET_MESSAGES, {
    variables: { receiverId: selectedUser?.id, limit: 100 },
    skip: !selectedUser,
    fetchPolicy: 'network-only',
  });

  const [markConversationRead] = useMutation(MARK_CONVERSATION_READ);

  const [getSearchUsers] = useLazyQuery(SEARCH_USERS, {
    onCompleted: (d) => { setSearchLoading(false); setSearchError(null); setSearchResults(d?.searchUsers || []); },
    onError: (e) => { setSearchLoading(false); setSearchError(e); },
  });

  const [getUserByUsername] = useLazyQuery(GET_USER, {
    onCompleted: (d) => {
      if (d?.user) {
        setSelectedUser(d.user);
        setNewChatOpen(false);
        router.replace('/messages', undefined, { shallow: true });
      }
    },
  });

  // Debounced user search for the "New message" panel
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) { setSearchResults([]); setSearchLoading(false); return; }
    setSearchLoading(true);
    const t = setTimeout(() => getSearchUsers({ variables: { query: q, limit: 20 } }), 300);
    return () => clearTimeout(t);
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // Deep-link: /messages?user=<username> preselects the conversation partner
  useEffect(() => {
    const username = typeof router.query.user === 'string' ? router.query.user : '';
    if (!username || username === user?.username) return;
    getUserByUsername({ variables: { username } });
  }, [router.query.user, user?.username]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectSearchUser = (target: any) => {
    setSelectedUser(target);
    setNewChatOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  useSubscription(NEW_MESSAGE_SUB, {
    onData: ({ client, data }) => {
      const msg = data.data?.newMessage;
      if (!msg) return;
      const isOpenThread = selectedUser && (msg.sender.id === selectedUser.id || msg.receiver.id === selectedUser.id);
      if (isOpenThread) {
        client.cache.updateQuery({
          query: GET_MESSAGES,
          variables: { receiverId: selectedUser.id, limit: 100 },
        }, (existing: any) => {
          if (!existing?.messages?.edges?.some((e: any) => e.node.id === msg.id)) {
            return {
              ...existing,
              messages: {
                ...existing.messages,
                edges: [...existing.messages.edges, { __typename: 'MessageEdge', cursor: msg.id, node: msg }],
              },
            };
          }
          return existing;
        });
        markConversationRead({ variables: { receiverId: selectedUser.id } });
      }
      refetchConversations();
    },
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
      refetchConversations();
      // Force immediate refetch
      setTimeout(() => refetch(), 300);
    } catch (error) {
      toast.error('Failed to send message');
    }
  }, [messageInput, selectedUser, sendingMessage, sendMessage, refetch, refetchConversations]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messagesData, lastRefresh]);

  const openConversation = (conv: any) => {
    setSelectedUser(conv.user);
    if (conv.unreadCount > 0) {
      markConversationRead({ variables: { receiverId: conv.user.id } });
      refetchConversations();
    }
  };

  const conversations = convData?.conversations || [];
  const messages = messagesData?.messages?.edges?.map((e: any) => e.node) || [];

  const groupedMessages = useMemo(() => {
    const groups: { label: string; items: any[] }[] = [];
    for (const m of messages) {
      const d = new Date(m.createdAt);
      const label = isSameDay(d, new Date()) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'MMMM d, yyyy');
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.items.push(m);
      else groups.push({ label, items: [m] });
    }
    return groups;
  }, [messages]);

  const totalUnread = conversations.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0);

  const shouldShowList = !selectedUser;

  return (
    <div className="flex h-full mx-auto w-full max-w-6xl flex-col">
      <PageHeader
        title="Messages"
        subtitle={totalUnread > 0 ? `${totalUnread} unread conversations` : undefined}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setNewChatOpen((o) => !o)}
            className="gap-1.5"
          >
            <Icons.Send className="h-4 w-4" />
            New
          </Button>
        }
      />

      <div className="h-[calc(100dvh-12.5rem)] min-h-[26rem] overflow-hidden rounded-row border border-line bg-surface shadow-card sm:h-[min(680px,74vh)]">
        <div className="flex h-full">
          {/* Conversations List */}
          <aside
            className={cn(
              'w-full flex-col border-line sm:flex sm:w-80 sm:flex-shrink-0 sm:border-r lg:w-96',
              shouldShowList ? 'flex' : 'hidden',
            )}
          >
            <div className="flex-shrink-0 border-b border-line p-3">
              {newChatOpen && (
                <div className="mb-3">
                  <div className="relative">
                    <Icons.Search className="absolute left-3 top-1/2 w-4 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search people..."
                      className="input-premium w-full pl-9"
                    />
                  </div>
                  <div className="mt-2 max-h-72 overflow-y-auto scrollbar-hide">
                    {searchError && (
                      <p className="px-2 py-1 text-xs text-red-500">{searchError.message}</p>
                    )}
                    {searchLoading && searchQuery.trim() && (
                      <div className="p-2">{<ListSkeleton rows={3} />}</div>
                    )}
                    {!searchLoading && !searchQuery.trim() && (
                      <p className="px-2 py-1 text-xs text-muted">Type a name or username to find people</p>
                    )}
                    {!searchLoading && searchQuery.trim() && searchResults.length === 0 && (
                      <p className="px-2 py-1 text-xs text-muted">No people found</p>
                    )}
                    {searchResults
                      .filter((u: any) => u.id !== user?.id)
                      .map((u: any) => (
                        <div
                          key={u.id}
                          onClick={() => selectSearchUser(u)}
                          className="flex cursor-pointer items-center gap-3 rounded-2xl px-2.5 py-2.5 transition-colors hover:bg-surface-2"
                        >
                          <Avatar
                            name={u.displayName}
                            username={u.username}
                            src={u.avatarUrl}
                            size="sm"
                            className="flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-ink">{u.displayName}</p>
                            <p className="truncate text-xs text-muted">@{u.username}</p>
                          </div>
                          <span className="flex-shrink-0 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-surface transition-colors hover:bg-ink/80">
                            Message
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setNewChatOpen((o) => !o)}
                className="flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
              >
                <span>Conversations</span>
                <Icons.More className="h-4 w-4 text-muted" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {convLoading ? (
                <div className="m-3">
                  <ListSkeleton rows={6} />
                </div>
              ) : convError ? (
                <div className="p-3">
                  <ErrorState
                    title="Couldn't load conversations"
                    message={convError.message}
                    onRetry={() => refetchConversations()}
                  />
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-3">
                  <EmptyState
                    icon={<Icons.Messages className="h-8 w-8" />}
                    title="No conversations yet"
                    description="Send a message to someone you follow to start chatting."
                    action={{ label: 'Find people', href: '/explore' }}
                  />
                </div>
              ) : (
                <div className="space-y-0.5 p-2">
                  {conversations.map((conv: any) => {
                    const isActive = selectedUser?.id === conv.user.id;
                    const last = conv.lastMessage;
                    const preview = last?.content?.length > 40 ? `${last.content.slice(0, 40)}…` : (last?.content || '');
                    const isMine = last?.sender?.id === user?.id;
                    return (
                      <button
                        key={conv.user.id}
                        onClick={() => openConversation(conv)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-left transition-colors duration-200',
                          isActive ? 'bg-surface-2' : 'hover:bg-surface-2/60',
                        )}
                      >
                        <Avatar
                          name={conv.user.displayName}
                          username={conv.user.username}
                          src={conv.user.avatarUrl}
                          size="md"
                          className="flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-semibold text-ink">{conv.user.displayName}</span>
                            {last && (
                              <span className="flex-shrink-0 text-[11px] text-muted">
                                {formatDistanceToNow(new Date(last.createdAt), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center justify-between gap-2">
                            <span className="truncate text-xs text-muted">
                              {isMine && <span className="text-brand-500">You: </span>}
                              {preview}
                            </span>
                            {conv.unreadCount > 0 && (
                              <span className="flex h-[18px] min-w-[18px] flex-shrink-0 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                                {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          {/* Chat Area */}
          <section
            className={cn(
              'min-w-0 flex-1 flex-col',
              selectedUser ? 'flex' : 'hidden sm:flex',
            )}
          >
            {selectedUser ? (
              <>
                <div className="flex flex-shrink-0 items-center gap-3 border-b border-line p-3">
                  <IconButton
                    label="Back to conversations"
                    size="sm"
                    className="sm:hidden"
                    onClick={() => setSelectedUser(null)}
                  >
                    <Icons.Back className="h-5 w-5" />
                  </IconButton>
                  <Link href={`/profile/${selectedUser.username}`} className="flex min-w-0 items-center gap-3 rounded-full">
                    <Avatar
                      name={selectedUser.displayName}
                      username={selectedUser.username}
                      src={selectedUser.avatarUrl}
                      size="sm"
                      className="flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{selectedUser.displayName}</p>
                      <p className="truncate text-xs text-muted">@{selectedUser.username}</p>
                    </div>
                  </Link>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 sm:px-6">
                  {messagesLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
                    </div>
                  ) : messagesError ? (
                    <div className="flex h-full items-center justify-center">
                      <ErrorState
                        title="Couldn't load messages"
                        message={messagesError.message}
                        onRetry={() => refetch()}
                      />
                    </div>
                  ) : messages.length === 0 ? (
                    <EmptyState
                      icon={<Icons.Messages className="h-8 w-8" />}
                      title="No messages yet"
                      description="Say hello!"
                    />
                  ) : (
                    groupedMessages.map((group) => (
                      <div key={group.label}>
                        <DayDivider label={group.label} />
                        <div className="space-y-3">
                          {group.items.map((msg: any, i: number) => {
                            const isMine = msg.sender.id === user?.id;
                            const showAvatar =
                              !isMine &&
                              (i === 0 || group.items[i - 1].sender.id !== msg.sender.id);
                            return (
                              <ChatBubble
                                key={msg.id}
                                message={msg}
                                isMine={isMine}
                                showAvatar={showAvatar}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSend} className="flex flex-shrink-0 items-center gap-2 border-t border-line p-3">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="input-premium flex-1"
                  />
                  <Button
                    type="submit"
                    size="md"
                    disabled={!messageInput.trim() || sendingMessage}
                    className="px-3.5"
                    aria-label="Send message"
                  >
                    {sendingMessage ? (
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    ) : (
                      <Icons.Send className="h-5 w-5" />
                    )}
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-6">
                <EmptyState
                  icon={<Icons.Messages className="h-8 w-8" />}
                  title="Select a conversation"
                  description="Pick a chat from the list to start messaging"
                />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}