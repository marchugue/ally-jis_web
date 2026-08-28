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
    base: 'bg-blue-50 text-blue-700 border border-blue-200',
    shared: 'bg-blue-100 text-blue-800 border border-blue-300 font-semibold',
    selected: 'bg-blue-600 text-white border border-blue-600',
  },
  orange: {
    base: 'bg-orange-50 text-orange-700 border border-orange-200',
    shared: 'bg-orange-100 text-orange-800 border border-orange-300 font-semibold',
    selected: 'bg-orange-500 text-white border border-orange-500',
  },
  green: {
    base: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    shared: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold',
    selected: 'bg-emerald-600 text-white border border-emerald-600',
  },
  purple: {
    base: 'bg-purple-50 text-purple-700 border border-purple-200',
    shared: 'bg-purple-100 text-purple-800 border border-purple-300 font-semibold',
    selected: 'bg-purple-600 text-white border border-purple-600',
  },
  pink: {
    base: 'bg-pink-50 text-pink-700 border border-pink-200',
    shared: 'bg-pink-100 text-pink-800 border border-pink-300 font-semibold',
    selected: 'bg-pink-600 text-white border border-pink-600',
  },
  amber: {
    base: 'bg-amber-50 text-amber-700 border border-amber-200',
    shared: 'bg-amber-100 text-amber-800 border border-amber-300 font-semibold',
    selected: 'bg-amber-600 text-white border border-amber-600',
  },
  indigo: {
    base: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    shared: 'bg-indigo-100 text-indigo-800 border border-indigo-300 font-semibold',
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
        isSelected && 'ring-2 ring-offset-1',
      )}
    >
      {isShared && <span className="mr-1 text-xs">✦</span>}
      {label}
    </span>
  );
}
