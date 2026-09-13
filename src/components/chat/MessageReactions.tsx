import { useMemo } from 'react';
import { MessageReaction } from '@/types/ally';
import { cn } from '@/lib/utils';

interface MessageReactionsProps {
  reactions: MessageReaction[];
  currentUserId: string;
  isMe: boolean;
  onToggle: (emoji: string) => void;
}

export function MessageReactions({ reactions, currentUserId, isMe, onToggle }: MessageReactionsProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, { count: number; reactedByMe: boolean }>();
    for (const reaction of reactions) {
      const existing = map.get(reaction.emoji) ?? { count: 0, reactedByMe: false };
      map.set(reaction.emoji, {
        count: existing.count + 1,
        reactedByMe: existing.reactedByMe || reaction.userId === currentUserId,
      });
    }
    return Array.from(map.entries());
  }, [reactions, currentUserId]);

  if (grouped.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-1 mt-1', isMe ? 'justify-end' : 'justify-start')}>
      {grouped.map(([emoji, meta]) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onToggle(emoji)}
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-jakarta border transition-colors',
            meta.reactedByMe
              ? 'bg-[#1A6B3C]/10 dark:bg-emerald-500/20 border-[#1A6B3C]/30 dark:border-emerald-500/40 text-[#1A6B3C] dark:text-emerald-300'
              : 'bg-white dark:bg-[#1E293B] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10',
          )}
        >
          <span className="text-sm leading-none">{emoji}</span>
          {meta.count > 1 && <span>{meta.count}</span>}
        </button>
      ))}
    </div>
  );
}
