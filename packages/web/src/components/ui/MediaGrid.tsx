import React from 'react';
import { cn } from '@/utils/cn';

export interface MediaGridProps {
  mediaUrls: string[];
  alt?: string;
  className?: string;
}

const imgClass = 'h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]';

export const MediaGrid: React.FC<MediaGridProps> = ({ mediaUrls, alt = '', className }) => {
  const urls = mediaUrls?.slice(0, 4) || [];

  if (urls.length === 0) return null;

  if (urls.length === 1) {
    return (
      <div
        className={cn(
          'group relative w-full overflow-hidden rounded-2xl bg-surface-2',
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={urls[0]}
          alt={alt}
          className="aspect-[16/10] w-full object-cover"
        />
      </div>
    );
  }

  if (urls.length === 2) {
    return (
      <div className={cn('grid grid-cols-2 gap-1.5', className)}>
        {urls.map((url, i) => (
          <div key={i} className="group relative aspect-square overflow-hidden rounded-xl bg-surface-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={i === 0 ? alt : ''} className={imgClass} />
          </div>
        ))}
      </div>
    );
  }

  if (urls.length === 3) {
    return (
      <div className={cn('grid grid-cols-2 grid-rows-2 gap-1.5', className)}>
        <div className="group relative row-span-2 min-h-0 overflow-hidden rounded-xl bg-surface-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urls[0]} alt={alt} className={imgClass} />
        </div>
        {urls.slice(1).map((url, i) => (
          <div key={i + 1} className="group relative aspect-square overflow-hidden rounded-xl bg-surface-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={alt} className={imgClass} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-2 gap-1.5', className)}>
      {urls.map((url, i) => (
        <div key={i} className="group relative aspect-square overflow-hidden rounded-xl bg-surface-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={i === 0 ? alt : ''} className={imgClass} />
        </div>
      ))}
    </div>
  );
};