import { useMemo } from 'react';
import { MessageReaction } from '@/types/ally';
import { cn } from '@/lib/utils';
import { getFluentEmojiUrl } from '@/lib/fluentEmoji';

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
      onMouseDown={(e) => e.stopPropagation()}
      className={cn(
        'absolute -bottom-[18px] z-10 flex items-center gap-1 select-none pointer-events-auto',
        'rounded-full h-7 px-1.5 border-2 shadow-sm',
        isMe
          ? 'right-3 flex-row-reverse bg-[#1A6B3C] dark:bg-emerald-600 border-white dark:border-[#090D16]'
          : 'left-3 flex-row bg-gray-100 dark:bg-[#1E293B] border-white dark:border-[#090D16]',
      )}
    >
      {grouped.map(([emoji, meta]) => {
        const fluentUrl = getFluentEmojiUrl(emoji);
        return (
          <button
            key={emoji}
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(emoji);
            }}
            title={meta.reactedByMe ? 'Remove reaction' : `React with ${emoji}`}
            className="inline-flex items-center gap-1 px-1 py-0.5 bg-transparent border-0 outline-none cursor-pointer transition-transform duration-150 hover:scale-120 active:scale-95"
          >
            {fluentUrl ? (
              <img
                src={fluentUrl}
                alt={emoji}
                className="w-5 h-5 pointer-events-none object-contain select-none"
                style={{ width: '20px', height: '20px' }}
                width={20}
                height={20}
                loading="eager"
                decoding="async"
                draggable={false}
              />
            ) : (
              <span className="text-sm leading-none select-none">{emoji}</span>
            )}
            {meta.count > 1 && (
              <span
                className={cn(
                  'text-[11px] font-bold leading-none select-none',
                  isMe
                    ? 'text-white'
                    : 'text-gray-800 dark:text-gray-100',
                )}
              >
                {meta.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
