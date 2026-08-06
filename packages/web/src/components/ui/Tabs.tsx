import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { spring } from '@/utils/motion';

export interface TabItem {
  id: string;
  label: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  variant?: 'pill' | 'underline';
  layoutId?: string;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeId,
  onChange,
  variant = 'pill',
  layoutId = 'tabs-active',
  className,
}) => {
  if (variant === 'underline') {
    return (
      <div
        role="tablist"
        className={cn('flex border-b border-line', className)}
      >
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(item.id)}
              className={cn(
                'relative flex-1 py-3 text-sm font-medium transition-colors duration-200',
                isActive ? 'text-brand-600 dark:text-brand-400' : 'text-muted hover:text-ink',
              )}
            >
              {item.label}
              {isActive && (
                <motion.span
                  layoutId={layoutId}
                  transition={spring}
                  className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-600"
                />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      className={cn('inline-flex items-center gap-1 rounded-full bg-surface-2 p-1', className)}
    >
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.id)}
            className={cn(
              'relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200',
              isActive ? 'text-ink' : 'text-muted hover:text-ink',
            )}
          >
            {isActive && (
              <motion.span
                layoutId={layoutId}
                transition={spring}
                className="absolute inset-0 rounded-full border border-line bg-surface shadow-sm"
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};