import React from 'react';
import { Compass, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingStatusBadgeProps {
  stage?: number;
  onClick: () => void;
  className?: string;
}

export const FloatingStatusBadge: React.FC<FloatingStatusBadgeProps> = ({
  stage: _stage,
  onClick,
  className,
}) => {
  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        'group absolute top-3 right-3 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full',
        'bg-white text-gray-900 border-2 border-gray-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]',
        'dark:bg-[#181818] dark:text-white dark:border-white/20 dark:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.8)]',
        'hover:-translate-y-0.5 hover:border-[#1A6B3C] dark:hover:border-emerald-400',
        'active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]',
        'transition-all cursor-pointer animate-bounce select-none font-jakarta font-black text-xs uppercase tracking-wider',
        className
      )}
      title="View Ally Roadmap & Progression"
      aria-label="Open Ally Roadmap"
    >
      <Compass size={14} className="stroke-[2.5] text-[#1A6B3C] dark:text-emerald-400 group-hover:rotate-45 transition-transform" />
      <span className="font-mono">ROADMAP</span>
      <Sparkles size={12} className="stroke-[2.5] text-[#1A6B3C] dark:text-emerald-400" />
    </button>
  );
};
