import { INTEREST_COLOR_MAP } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface InterestTagProps {
  label: string;
  isShared?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

const colorMap = {
  blue: {
    base: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50',
    shared: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700/60 font-semibold',
    selected: 'bg-blue-600 text-white border border-blue-600',
  },
  orange: {
    base: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50',
    shared: 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200 border border-orange-300 dark:border-orange-700/60 font-semibold',
    selected: 'bg-orange-500 text-white border border-orange-500',
  },
  green: {
    base: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50',
    shared: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700/60 font-semibold',
    selected: 'bg-emerald-600 text-white border border-emerald-600',
  },
  purple: {
    base: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50',
    shared: 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-700/60 font-semibold',
    selected: 'bg-purple-600 text-white border border-purple-600',
  },
  pink: {
    base: 'bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800/50',
    shared: 'bg-pink-100 dark:bg-pink-900/50 text-pink-800 dark:text-pink-200 border border-pink-300 dark:border-pink-700/60 font-semibold',
    selected: 'bg-pink-600 text-white border border-pink-600',
  },
  amber: {
    base: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50',
    shared: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60 font-semibold',
    selected: 'bg-amber-600 text-white border border-amber-600',
  },
  indigo: {
    base: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50',
    shared: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700/60 font-semibold',
    selected: 'bg-indigo-600 text-white border border-indigo-600',
  },
};

export default function InterestTag({ label, isShared, isSelected, onClick, size = 'md' }: InterestTagProps) {
  const color = (INTEREST_COLOR_MAP[label] || 'blue') as keyof typeof colorMap;
  const colors = colorMap[color] || colorMap.blue;

  let className = colors.base;
  if (isSelected) className = colors.selected;
  else if (isShared) className = colors.shared;

  return (
    <span
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-full font-jakarta font-medium transition-all duration-150',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        className,
        onClick && 'cursor-pointer hover:opacity-80 active:scale-95',
        isSelected && 'ring-2 ring-offset-1 dark:ring-offset-gray-900',
      )}
    >
      {isShared && <span className="mr-1 text-xs">✦</span>}
      {label}
    </span>
  );
}
