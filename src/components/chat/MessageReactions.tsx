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
    <div
      className={cn(
        'absolute -bottom-2.5 z-10 flex items-center gap-1 select-none pointer-events-auto',
        isMe ? 'right-3 flex-row-reverse' : 'left-3 flex-row',
      )}
    >
      {grouped.map(([emoji, meta]) => (
        <button
          key={emoji}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(emoji);
          }}
          title={meta.reactedByMe ? 'Remove reaction' : `React with ${emoji}`}
          className="inline-flex items-center gap-0.5 p-0 bg-transparent border-0 outline-none cursor-pointer transition-transform duration-150 hover:scale-125 active:scale-95 filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
        >
          <span className="text-base leading-none select-none">{emoji}</span>
          {meta.count > 1 && (
            <span
              className={cn(
                'text-[10px] font-bold leading-none select-none',
                isMe
                  ? 'text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]'
                  : 'text-gray-700 dark:text-gray-200 drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]',
              )}
            >
              {meta.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
