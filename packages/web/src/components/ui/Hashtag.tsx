import React from 'react';
import Link from 'next/link';
import { Icons } from '@/components/icons';

interface HashtagProps {
  name: string;
  className?: string;
}

// Note: the `#` is URL-encoded (`%23`) — a literal `#` would be parsed as a
// fragment and the `q` param would come back empty.
export const Hashtag: React.FC<HashtagProps> = ({ name, className }) => {
  const clean = name.startsWith('#') ? name.slice(1) : name;
  return (
    <Link
      href={`/explore?q=${encodeURIComponent(`#${clean}`)}`}
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center tag-premium text-xs px-2 py-0.5 ${className || ''}`}
    >
      <Icons.Hash className="w-3 h-3 mr-0.5" />
      {clean}
    </Link>
  );
};