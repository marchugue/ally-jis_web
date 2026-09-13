import React from 'react';
import { cn } from '@/lib/utils';

export const ChatSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        'flex-1 p-4 space-y-4 overflow-hidden animate-pulse min-h-0 flex flex-col justify-end',
        className
      )}
    >
      {/* Top Welcome Skeleton */}
      <div className="flex flex-col items-center justify-center py-6 space-y-2.5">
        <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-white/10" />
        <div className="w-36 h-5 rounded-md bg-gray-200 dark:bg-white/10" />
        <div className="w-28 h-3.5 rounded-md bg-gray-100 dark:bg-white/5" />
      </div>

      {/* Bubble 1: Incoming */}
      <div className="flex items-end gap-2.5 max-w-[75%]">
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex-shrink-0" />
        <div className="h-10 w-48 rounded-2xl rounded-bl-sm bg-gray-200 dark:bg-white/10" />
      </div>

      {/* Bubble 2: Outgoing */}
      <div className="flex justify-end">
        <div className="h-9 w-44 rounded-2xl rounded-br-sm bg-gray-200/80 dark:bg-emerald-500/20" />
      </div>

      {/* Bubble 3: Incoming */}
      <div className="flex items-end gap-2.5 max-w-[75%]">
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex-shrink-0" />
        <div className="h-14 w-60 rounded-2xl rounded-bl-sm bg-gray-200 dark:bg-white/10" />
      </div>

      {/* Bubble 4: Outgoing */}
      <div className="flex justify-end">
        <div className="h-10 w-36 rounded-2xl rounded-br-sm bg-gray-200/80 dark:bg-emerald-500/20" />
      </div>
    </div>
  );
};
