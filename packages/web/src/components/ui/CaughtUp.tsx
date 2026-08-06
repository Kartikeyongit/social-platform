import React from 'react';

export const CaughtUp: React.FC<{ className?: string }> = ({ className }) => (
  <p
    className={
      className ??
      'flex items-center justify-center gap-1.5 py-8 text-xs font-medium text-muted'
    }
  >
    <span>You're all caught up</span>
    <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-500 align-middle" />
  </p>
);