export const typeDefs = `#graphql
  scalar DateTime

  type User {
    id: ID!
    username: String!
    email: String!
    displayName: String!
    avatarUrl: String
    bio: String
    followerCount: Int!
    followingCount: Int!
    postCount: Int!
    isFollowing: Boolean!
    createdAt: DateTime!
  }

  type Post {
    id: ID!
    content: String!
    mediaUrls: [String!]!
    hashtags: [String!]!
    author: User!
    likeCount: Int!
    commentCount: Int!
    isLiked: Boolean!
    createdAt: DateTime!
    comments(limit: Int, cursor: String): CommentConnection!
  }

  type Comment {
    id: ID!
    content: String!
    author: User!
    postId: ID!
    createdAt: DateTime!
  }

  type CommentConnection {
    edges: [CommentEdge!]!
    pageInfo: PageInfo!
  }

  type CommentEdge {
    node: Comment!
    cursor: String!
  }

  type PostConnection {
    edges: [PostEdge!]!
    pageInfo: PageInfo!
  }

  type PostEdge {
    node: Post!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    endCursor: String
  }

  type Message {
    id: ID!
    content: String!
    sender: User!
    receiver: User!
    read: Boolean!
    createdAt: DateTime!
  }

  type MessageConnection {
    edges: [MessageEdge!]!
    pageInfo: PageInfo!
  }

  type MessageEdge {
    node: Message!
    cursor: String!
  }

  type Notification {
    id: ID!
    type: String!
    actor: User!
    entityId: ID!
    read: Boolean!
    createdAt: DateTime!
  }

  type Hashtag {
    name: String!
    postCount: Int!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input CreatePostInput {
    content: String!
    hashtags: [String!]
    mediaUrls: [String!]
  }

  input CreateCommentInput {
    postId: ID!
    content: String!
  }

  input SendMessageInput {
    receiverId: ID!
    content: String!
  }

  input UpdateProfileInput {
    displayName: String
    bio: String
    avatarUrl: String
  }

  type Query {
    me: User
    user(username: String!): User
    post(id: ID!): Post
    
    # Feed
    feed(limit: Int, cursor: String): PostConnection!
    exploreFeed(limit: Int, cursor: String): PostConnection!
    
    # Posts
    userPosts(username: String!, limit: Int, cursor: String): PostConnection!
    
    # Messages
    conversations(limit: Int, cursor: String): [User!]!
    messages(receiverId: ID!, limit: Int, cursor: String): MessageConnection!
    
    # Notifications
    notifications(limit: Int, cursor: String): [Notification!]!
    unreadNotificationCount: Int!
    
    # Search & Trends
    searchHashtags(query: String!, limit: Int): [Hashtag!]!
    trendingHashtags(limit: Int): [Hashtag!]!
    searchUsers(query: String!, limit: Int): [User!]!
    
    # Recommendations (ML)
    recommendedPosts(limit: Int): [Post!]!
    suggestedUsers(limit: Int): [User!]!
    suggestHashtags(content: String!): [String!]!

    # Following & Followers
    followers(username: String!): [User!]!
    following(username: String!): [User!]!
  }

  type Mutation {
    # Auth
    register(username: String!, email: String!, password: String!, displayName: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    
    # Profile
    updateProfile(input: UpdateProfileInput!): User!
    
    # Posts
    createPost(input: CreatePostInput!): Post!
    deletePost(id: ID!): Boolean!
    
    # Interactions
    likePost(postId: ID!): Post!
    unlikePost(postId: ID!): Post!
    createComment(input: CreateCommentInput!): Comment!
    
    # Social
    followUser(userId: ID!): User!
    unfollowUser(userId: ID!): User!
    removeFollower(followerId: ID!): User!
    
    # Messages
    sendMessage(input: SendMessageInput!): Message!
    markMessageRead(messageId: ID!): Boolean!
    
    # Notifications
    markNotificationRead(notificationId: ID!): Boolean!
    markAllNotificationsRead: Boolean!
  }

  type Subscription {
    newMessage: Message!
    newNotification: Notification!
  }
`;
