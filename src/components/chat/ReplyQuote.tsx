import { cn } from '@/lib/utils';
import { CHAT_IMAGE_CONFIG, chatImageThumbnailStyle } from '@/lib/chatImageConfig';

interface ReplyQuoteProps {
  label: string;
  content?: string | null;
  imageUrl?: string | null;
  variant?: 'compose' | 'bubble-me' | 'bubble-them';
}

export function ReplyQuote({
  label,
  content,
  imageUrl,
  variant = 'compose',
}: ReplyQuoteProps) {
  const previewText = content?.trim() || (imageUrl ? null : 'Message');

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 min-w-0',
        variant === 'compose' && 'flex-1',
        variant.startsWith('bubble') && 'mb-2 rounded-xl px-2.5 py-2',
        variant === 'bubble-me' && 'bg-white/10',
        variant === 'bubble-them' && 'bg-black/[0.04]',
      )}
    >
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'font-jakarta text-xs font-semibold truncate',
            variant === 'compose' && 'text-[#1A6B3C]',
            variant === 'bubble-me' && 'text-white',
            variant === 'bubble-them' && 'text-[#1A6B3C]',
          )}
        >
          {label}
        </p>
        {previewText && (
          <p
            className={cn(
              'font-jakarta text-xs truncate mt-0.5',
              variant === 'compose' && 'text-gray-500',
              variant === 'bubble-me' && 'text-white/75',
              variant === 'bubble-them' && 'text-gray-500',
            )}
          >
            {previewText}
          </p>
        )}
      </div>
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className="object-cover flex-shrink-0"
          style={chatImageThumbnailStyle(CHAT_IMAGE_CONFIG.replyThumbnailSize)}
        />
      )}
    </div>
  );
}
