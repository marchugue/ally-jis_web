import React from 'react';
import { cn } from '@/lib/utils';

export function ConversationPaneSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-[#090D16] animate-pulse', className)}>
      {/* Top Chat Header Skeleton */}
      <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#0D131F] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10 shrink-0" />
          <div className="space-y-1.5">
            <div className="h-4 w-32 rounded-md bg-gray-200 dark:bg-white/10" />
            <div className="h-3 w-20 rounded-md bg-gray-100 dark:bg-white/5" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5" />
        </div>
      </div>

      {/* Messages Body Skeleton */}
      <div className="flex-1 p-4 space-y-4 overflow-hidden flex flex-col justify-end min-h-0">
        {/* Welcome Avatar & Info in center */}
        <div className="flex flex-col items-center justify-center py-6 space-y-2.5 my-auto">
          <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-white/10" />
          <div className="w-36 h-4.5 rounded-md bg-gray-200 dark:bg-white/10" />
          <div className="w-24 h-3 rounded-md bg-gray-100 dark:bg-white/5" />
        </div>

        {/* Incoming Bubble 1 */}
        <div className="flex items-end gap-2.5 max-w-[75%]">
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 shrink-0" />
          <div className="h-10 w-48 rounded-2xl rounded-bl-sm bg-gray-200/90 dark:bg-white/10" />
        </div>

        {/* Outgoing Bubble 1 */}
        <div className="flex justify-end">
          <div className="h-9 w-44 rounded-2xl rounded-br-sm bg-[#1A6B3C]/15 dark:bg-emerald-500/20" />
        </div>

        {/* Incoming Bubble 2 */}
        <div className="flex items-end gap-2.5 max-w-[75%]">
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 shrink-0" />
          <div className="h-14 w-60 rounded-2xl rounded-bl-sm bg-gray-200/90 dark:bg-white/10" />
        </div>

        {/* Outgoing Bubble 2 */}
        <div className="flex justify-end">
          <div className="h-10 w-36 rounded-2xl rounded-br-sm bg-[#1A6B3C]/15 dark:bg-emerald-500/20" />
        </div>
      </div>

      {/* Bottom Message Input Bar Skeleton */}
      <div className="p-3 sm:p-4 border-t border-gray-100 dark:border-white/10 bg-white dark:bg-[#0D131F] flex items-center gap-2 flex-shrink-0">
        <div className="h-11 rounded-2xl bg-gray-100 dark:bg-white/5 flex-1 border border-gray-200/60 dark:border-white/5" />
        <div className="w-11 h-11 rounded-2xl bg-[#1A6B3C]/15 dark:bg-emerald-500/20 shrink-0" />
      </div>
    </div>
  );
}
