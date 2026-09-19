import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOBILE_MESSAGE_ACTION_CONFIG, QUICK_REACTIONS } from '@/lib/chatActionConfig';
import { getFluentEmojiUrl } from '@/lib/fluentEmoji';

interface QuickReactionsBarProps {
  onReact: (emoji: string) => void;
  onOpenPicker: () => void;
  variant?: 'mobile' | 'desktop';
  className?: string;
}

export function QuickReactionsBar({
  onReact,
  onOpenPicker,
  variant = 'mobile',
  className,
}: QuickReactionsBarProps) {
  const config =
    variant === 'desktop'
      ? MOBILE_MESSAGE_ACTION_CONFIG.desktop.reactionsBar
      : MOBILE_MESSAGE_ACTION_CONFIG.reactionsBar;

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      className={cn(
        'flex items-center flex-nowrap overflow-visible',
        'bg-white/95 dark:bg-[#111827]/95 backdrop-blur-2xl rounded-full border border-black/[0.06] dark:border-white/10',
        'shadow-[0_8px_24px_rgba(0,0,0,0.14)]',
        className,
      )}
      style={{
        gap: config.gap,
        paddingLeft: config.paddingX,
        paddingRight: config.paddingX,
        paddingTop: config.paddingY,
        paddingBottom: config.paddingY,
        maxWidth: config.maxWidth,
      }}
    >
      {QUICK_REACTIONS.map((emoji) => {
        const fluentUrl = getFluentEmojiUrl(emoji, { animated: true });
        return (
          <button
            key={emoji}
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onReact(emoji);
            }}
            className="flex items-center justify-center rounded-full flex-shrink-0 hover:bg-black/5 dark:hover:bg-white/10 hover:scale-125 active:scale-95 transition-transform duration-150 cursor-pointer"
            style={{ width: config.buttonSize, height: config.buttonSize }}
            aria-label={`React with ${emoji}`}
          >
            {fluentUrl ? (
              <img
                src={fluentUrl}
                alt={emoji}
                className="pointer-events-none object-contain drop-shadow-xs select-none"
                style={{ width: config.emojiSize, height: config.emojiSize }}
                width={config.emojiSize}
                height={config.emojiSize}
                loading="eager"
                decoding="async"
                draggable={false}
              />
            ) : (
              <span style={{ fontSize: config.emojiSize }}>{emoji}</span>
            )}
          </button>
        );
      })}
      <button
        type="button"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onOpenPicker();
        }}
        aria-label="More emojis"
        className="flex items-center justify-center rounded-full flex-shrink-0 text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
        style={{ width: config.buttonSize, height: config.buttonSize }}
      >
        <Plus size={variant === 'desktop' ? 14 : 18} />
      </button>
    </div>
  );
}
