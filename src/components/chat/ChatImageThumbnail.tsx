import { cn } from '@/lib/utils';
import { CHAT_IMAGE_CONFIG, chatImageThumbnailStyle } from '@/lib/chatImageConfig';

interface ChatImageThumbnailProps {
  src: string;
  alt?: string;
  sizePx?: number;
  onClick?: () => void;
  className?: string;
}

export function ChatImageThumbnail({
  src,
  alt = '',
  sizePx = CHAT_IMAGE_CONFIG.bubbleThumbnailSize,
  onClick,
  className,
}: ChatImageThumbnailProps) {
  const style = chatImageThumbnailStyle(sizePx);
  const image = (
    <img
      src={src}
      alt={alt}
      className="object-cover flex-shrink-0"
      style={style}
      draggable={false}
    />
  );

  if (!onClick) {
    return <div className={cn('inline-block', className)}>{image}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-block overflow-hidden transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
        className,
      )}
      style={{ borderRadius: style.borderRadius }}
      aria-label="View image"
    >
      {image}
    </button>
  );
}
