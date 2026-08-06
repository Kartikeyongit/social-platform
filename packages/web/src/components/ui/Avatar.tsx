import React from 'react';
import Link from 'next/link';
import { cn } from '@/utils/cn';

const GRADIENTS = [
  'from-brand-500 to-violet-600',
  'from-indigo-500 to-purple-600',
  'from-violet-500 to-fuchsia-600',
  'from-brand-400 to-indigo-600',
  'from-purple-500 to-brand-600',
  'from-fuchsia-500 to-violet-600',
  'from-indigo-400 to-violet-600',
  'from-brand-600 to-purple-700',
];

const SIZES = {
  xs: 'h-7 w-7 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-16 w-16 text-2xl',
  xl: 'h-24 w-24 text-4xl',
};

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

export type AvatarSize = keyof typeof SIZES;

export interface AvatarProps {
  name?: string;
  username?: string;
  src?: string | null;
  size?: AvatarSize;
  online?: boolean;
  href?: string;
  alt?: string;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name = 'U',
  username,
  src,
  size = 'md',
  online,
  href,
  alt,
  className,
}) => {
  const seed = username || name;
  const gradient = GRADIENTS[hashString(seed) % GRADIENTS.length];

  const avatar = (
    <span
      className={cn(
        'relative inline-flex flex-shrink-0 select-none overflow-hidden rounded-full',
        SIZES[size],
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt ?? name} className="h-full w-full object-cover" />
      ) : (
        <span
          className={cn(
            'flex h-full w-full items-center justify-center bg-gradient-to-br font-bold text-white',
            gradient,
          )}
        >
          {name.charAt(0).toUpperCase()}
        </span>
      )}
      {online && (
        <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-surface bg-green-500" />
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex rounded-full" aria-label={alt ?? name}>
        {avatar}
      </Link>
    );
  }

  return avatar;
};