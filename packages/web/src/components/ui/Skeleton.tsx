import React from 'react';
import { cn } from '@/utils/cn';

export interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div
    className={cn(
      'relative overflow-hidden rounded-full bg-surface-2',
      className,
    )}
  >
    <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-white/10" />
  </div>
);

const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children,
}) => (
  <div
    className={cn(
      'space-y-4 rounded-3xl border border-line bg-surface p-5 shadow-soft',
      className,
    )}
  >
    {children}
  </div>
);

export const PostSkeleton: React.FC = () => (
  <div className="border-b border-line px-1 py-5 [&:last-child]:border-b-0">
    <div className="flex gap-3">
      <Skeleton className="h-10 w-10 flex-shrink-0" />
      <div className="flex-1 space-y-3">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-6 pt-1">
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-5 w-14" />
        </div>
      </div>
    </div>
  </div>
);

export const ProfileSkeleton: React.FC = () => (
  <Card>
    <div className="flex items-center space-x-4">
      <Skeleton className="h-20 w-20" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>
    </div>
    <div className="flex space-x-4">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-20" />
    </div>
  </Card>
);

export const ListSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center space-x-3 rounded-2xl border border-line bg-surface p-4">
        <Skeleton className="h-10 w-10" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>
    ))}
  </div>
);