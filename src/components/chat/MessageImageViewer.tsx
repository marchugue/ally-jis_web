import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Forward, Reply } from 'lucide-react';
import { Message } from '@/types/ally';
import { cn } from '@/lib/utils';

interface MessageImageViewerProps {
  message: Message;
  onClose: () => void;
  onReply?: (message: Message) => void;
  onForward?: (message: Message) => void;
}

function formatMessageDateTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (date.toDateString() === now.toDateString()) {
    return time;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${time}`;
  }

  const datePart = date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });

  return `${datePart}, ${time}`;
}

export function MessageImageViewer({
  message,
  onClose,
  onReply,
  onForward,
}: MessageImageViewerProps) {
  const imageUrl = message.imageUrl;
  const timestamp = message.createdAt || message.timestamp;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!imageUrl) return null;

  const canAct =
    !message.id.startsWith('temp-') &&
    message.status !== 'sending' &&
    message.status !== 'failed';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex flex-col bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 rounded-full px-3 py-2 text-white/90 hover:bg-white/10 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
          <span className="font-jakarta text-sm font-medium hidden sm:inline">Back</span>
        </button>

        <p className="font-jakarta text-xs sm:text-sm text-white/70 text-center flex-1 min-w-0 truncate">
          {formatMessageDateTime(timestamp)}
        </p>

        <div className="w-[72px] sm:w-[88px]" aria-hidden />
      </div>

      {/* Image */}
      <div
        className="flex-1 min-h-0 flex items-center justify-center px-4 sm:px-8 pb-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt=""
          className="max-w-full max-h-full w-auto h-auto object-contain rounded-2xl select-none"
          draggable={false}
        />
      </div>

      {/* Actions */}
      <div
        className="flex items-center justify-center gap-3 sm:gap-4 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          disabled={!canAct}
          onClick={() => {
            onReply?.(message);
            onClose();
          }}
          className={cn(
            'flex items-center gap-2 rounded-full px-5 py-3 font-jakarta text-sm font-semibold transition-colors',
            canAct
              ? 'bg-white/15 text-white hover:bg-white/25'
              : 'bg-white/5 text-white/40 cursor-not-allowed',
          )}
        >
          <Reply size={18} />
          Reply
        </button>
        <button
          type="button"
          disabled={!canAct}
          onClick={() => {
            onForward?.(message);
            onClose();
          }}
          className={cn(
            'flex items-center gap-2 rounded-full px-5 py-3 font-jakarta text-sm font-semibold transition-colors',
            canAct
              ? 'bg-white/15 text-white hover:bg-white/25'
              : 'bg-white/5 text-white/40 cursor-not-allowed',
          )}
        >
          <Forward size={18} />
          Forward
        </button>
      </div>
    </motion.div>
  );
}
