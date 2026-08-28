import { getMatchBadgeColor } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface MatchBadgeProps {
  percentage: number;
  sharedCount: number;
  animate?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function MatchBadge({ percentage, sharedCount, animate = false, size = 'md' }: MatchBadgeProps) {
  const [displayPercentage, setDisplayPercentage] = useState(animate ? 0 : percentage);
  const color = getMatchBadgeColor(percentage, sharedCount);

  useEffect(() => {
    if (!animate) return;
    let start = 0;
    const step = Math.ceil(percentage / 30);
    const timer = setInterval(() => {
      start += step;
      if (start >= percentage) {
        setDisplayPercentage(percentage);
        clearInterval(timer);
      } else {
        setDisplayPercentage(start);
      }
    }, 40);
    return () => clearInterval(timer);
  }, [percentage, animate]);

  const colorClasses = {
    green: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    orange: 'bg-orange-100 text-orange-800 border-orange-300',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    gray: 'bg-gray-100 text-gray-600 border-gray-300',
  };

  const dotColors = {
    green: 'bg-emerald-500',
    orange: 'bg-orange-500',
    yellow: 'bg-yellow-500',
    gray: 'bg-gray-400',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-mono-accent font-semibold border',
        colorClasses[color as keyof typeof colorClasses],
        sizeClasses[size],
      )}
    >
      <span className={cn('w-2 h-2 rounded-full', dotColors[color as keyof typeof dotColors])} />
      {displayPercentage}% Compatible
    </span>
  );
}
