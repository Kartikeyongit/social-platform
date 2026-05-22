// Core domain types
export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  id: string;
  content: string;
  mediaUrls: string[];
  hashtags: string[];
  authorId: string;
  author?: User;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  author?: User;
  createdAt: Date;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  sender?: User;
  receiver?: User;
  read: boolean;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  actorId: string;
  entityId: string;
  read: boolean;
  createdAt: Date;
}

export enum NotificationType {
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  FOLLOW = 'FOLLOW',
  MENTION = 'MENTION',
  MESSAGE = 'MESSAGE'
}

export interface Hashtag {
  name: string;
  postCount: number;
}

// GraphQL specific types
export interface PageInfo {
  hasNextPage: boolean;
  endCursor?: string;
}

export interface Connection<T> {
  edges: Array<{
    node: T;
    cursor: string;
  }>;
  pageInfo: PageInfo;
}

export interface AuthPayload {
  token: string;
  user: User;
}