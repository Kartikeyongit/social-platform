import { PubSub } from 'graphql-subscriptions';

export const pubsub = new PubSub();

const NEW_NOTIFICATION = 'NOTIFICATION_ADDED';
const NEW_MESSAGE = 'MESSAGE_ADDED';

export function notificationTopic(userId: string): string {
  return `${NEW_NOTIFICATION}:${userId}`;
}

export function messageTopic(userId: string): string {
  return `${NEW_MESSAGE}:${userId}`;
}