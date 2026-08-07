import React from 'react';
import { format } from 'date-fns';
import { cn } from '@/utils/cn';
import { Avatar } from '@/components/ui/Avatar';
import { Icons } from '@/components/icons';

export interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  read?: boolean;
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
    {!isMine && (
      showAvatar ? (
        <Avatar
          name={message.sender.displayName}
          username={message.sender.username}
          src={message.sender.avatarUrl}
          size="sm"
          className="flex-shrink-0"
        />
      ) : (
        <span className="w-8 flex-shrink-0" aria-hidden="true" />
      )
    )}
    <div
      className={cn(
        'max-w-[85%] rounded-2xl px-4 py-2.5 shadow-soft sm:max-w-[70%]',
        isMine
          ? 'rounded-br-md bg-brand-600 text-white'
          : 'rounded-bl-md bg-surface-2 text-ink',
      )}
    >
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
      <div
        className={cn(
          'mt-1 flex items-center justify-end gap-1 text-[11px]',
          isMine ? 'text-brand-100/90' : 'text-muted',
        )}
      >
        {isMine && (
          <span className={cn('flex items-center', message.read ? 'text-emerald-300' : 'text-brand-100/70')}>
            {message.read ? <Icons.CheckCheck className="h-3.5 w-3.5" /> : <Icons.Check className="h-3.5 w-3.5" />}
          </span>
        )}
        <span className={cn(message.read && 'font-medium text-emerald-300')}>
          {format(new Date(message.createdAt), 'h:mm a')}
        </span>
        {isMine && message.read && <span className="text-emerald-300">Seen</span>}
      </div>
    </div>
  </div>
);

export interface DayDividerProps {
  label: string;
  className?: string;
}

export const DayDivider: React.FC<DayDividerProps> = ({ label, className }) => (
  <div className={cn('my-5 flex items-center gap-3', className)}>
    <span className="h-px flex-1 bg-line" />
    <span className="rounded-full bg-surface-2 px-3 py-1 text-[11px] font-medium text-muted">
      {label}
    </span>
    <span className="h-px flex-1 bg-line" />
  </div>
);