import React from 'react';
import { format } from 'date-fns';
import { cn } from '@/utils/cn';
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
  isFirst?: boolean;
  isLast?: boolean;
  showMeta?: boolean;
  className?: string;
}

const getBubbleCorners = (isMine: boolean, isFirst: boolean, isLast: boolean): string => {
  if (isFirst && isLast) {
    return isMine ? 'rounded-2xl rounded-br-md' : 'rounded-2xl rounded-bl-md';
  }
  return isMine
    ? isFirst
      ? 'rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-none'
      : isLast
        ? 'rounded-tl-2xl rounded-bl-2xl rounded-tr-none rounded-br-2xl'
        : 'rounded-tl-2xl rounded-bl-2xl rounded-tr-none rounded-br-none'
    : isFirst
      ? 'rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-none'
      : isLast
        ? 'rounded-tr-2xl rounded-br-2xl rounded-tl-none rounded-bl-2xl'
        : 'rounded-tr-2xl rounded-br-2xl rounded-tl-none rounded-bl-none';
};

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isMine,
  isFirst = true,
  isLast = true,
  showMeta = false,
  className,
}) => (
  <div className={cn('flex flex-col', isMine ? 'items-end' : 'items-start', className)}>
    <div
      className={cn(
        'max-w-[85%] px-4 py-2.5 shadow-soft sm:max-w-[70%]',
        getBubbleCorners(isMine, isFirst, isLast),
        isMine ? 'bg-brand-600 text-white' : 'bg-surface-2 text-ink',
      )}
    >
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
    </div>
    {showMeta && (
      <div
        className={cn(
          'mt-1 flex items-center gap-1 px-1 text-[11px] text-muted',
          isMine && 'justify-end',
        )}
      >
        {isMine && (
          <span className={cn('flex items-center', message.read ? 'text-emerald-500' : 'text-brand-500/70')}>
            {message.read ? <Icons.CheckCheck className="h-3.5 w-3.5" /> : <Icons.Check className="h-3.5 w-3.5" />}
          </span>
        )}
        <span className={cn(message.read && 'font-medium text-emerald-500')}>
          {format(new Date(message.createdAt), 'h:mm a')}
        </span>
        {isMine && message.read && <span className="text-emerald-500">Seen</span>}
      </div>
    )}
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