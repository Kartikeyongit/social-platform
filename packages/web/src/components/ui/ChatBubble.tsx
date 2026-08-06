import React from 'react';
import { format } from 'date-fns';
import { cn } from '@/utils/cn';
import { Avatar } from '@/components/ui/Avatar';

export interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  };
}

export interface ChatBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  showAvatar?: boolean;
  className?: string;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isMine,
  showAvatar = false,
  className,
}) => (
  <div className={cn('flex items-end gap-2', isMine ? 'justify-end' : 'justify-start', className)}>
    {!isMine && showAvatar && (
      <Avatar
        name={message.sender.displayName}
        username={message.sender.username}
        src={message.sender.avatarUrl}
        size="sm"
        className="flex-shrink-0"
      />
    )}
    <div
      className={cn(
        'max-w-[75%] rounded-2xl px-4 py-2.5 shadow-soft',
        isMine
          ? 'rounded-br-md bg-brand-600 text-white'
          : 'rounded-bl-md bg-surface-2 text-ink',
      )}
    >
      <p className="text-sm leading-relaxed">{message.content}</p>
      <p
        className={cn(
          'mt-1 text-[11px]',
          isMine ? 'text-brand-100' : 'text-muted',
        )}
      >
        {format(new Date(message.createdAt), 'h:mm a')}
      </p>
    </div>
  </div>
);

export interface DayDividerProps {
  label: string;
  className?: string;
}

export const DayDivider: React.FC<DayDividerProps> = ({ label, className }) => (
  <div className={cn('my-4 flex items-center gap-3', className)}>
    <span className="h-px flex-1 bg-line" />
    <span className="rounded-full bg-surface-2 px-3 py-1 text-[11px] font-medium text-muted">
      {label}
    </span>
    <span className="h-px flex-1 bg-line" />
  </div>
);