import { useEffect, useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Forward, Reply, ChevronLeft, ChevronRight } from 'lucide-react';
import { Message } from '@/types/ally';
import { cn } from '@/lib/utils';

interface MessageImageViewerProps {
  message: Message;
  initialIndex?: number;
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
  initialIndex = 0,
  onClose,
  onReply,
  onForward,
}: MessageImageViewerProps) {
  const images = useMemo<string[]>(() => {
    const raw = message.imageUrl || (message as any).image_url;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(Boolean);
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed.filter(Boolean);
        } catch {}
      }
      return [trimmed];
    }
    return [];
  }, [message.imageUrl, (message as any).image_url]);

  const [currentIndex, setCurrentIndex] = useState(() => {
    return Math.max(0, Math.min(images.length > 0 ? images.length - 1 : 0, initialIndex));
  });

  const thumbnailContainerRef = useRef<HTMLDivElement>(null);
  const currentImage = images[currentIndex] || message.imageUrl;
  const timestamp = message.createdAt || message.timestamp;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      }
      if (event.key === 'ArrowRight') {
        setCurrentIndex((prev) => Math.min(images.length - 1, prev + 1));
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, images.length]);

  // Auto-scroll the thumbnail strip to center the active thumbnail
  useEffect(() => {
    if (thumbnailContainerRef.current) {
      const activeEl = thumbnailContainerRef.current.children[currentIndex] as HTMLElement | undefined;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [currentIndex]);

  if (!currentImage) return null;

  const canAct =
    !message.id.startsWith('temp-') &&
    message.status !== 'sending' &&
    message.status !== 'failed';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex flex-col bg-black/90 backdrop-blur-md select-none"
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

        <div className="flex flex-col items-center">
          <p className="font-jakarta text-xs sm:text-sm text-white/70 text-center truncate">
            {formatMessageDateTime(timestamp)}
          </p>
          {images.length > 1 && (
            <span className="text-[11px] text-white/60 font-semibold mt-0.5">
              {currentIndex + 1} / {images.length}
            </span>
          )}
        </div>

        <div className="w-[72px] sm:w-[88px]" aria-hidden />
      </div>

      {/* Main Image with Prev/Next buttons & horizontal drag/swipe */}
      <div
        className="relative flex-1 min-h-0 flex items-center justify-center px-4 sm:px-12 pb-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Previous Button (UI Arrow Symbol) */}
        {images.length > 1 && (
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            className={cn(
              'absolute left-4 sm:left-8 z-20 w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all shadow-xl backdrop-blur-sm',
              currentIndex === 0
                ? 'opacity-30 cursor-not-allowed hover:bg-black/60'
                : 'hover:scale-105 active:scale-95 cursor-pointer'
            )}
            aria-label="Previous image"
          >
            <ChevronLeft size={28} />
          </button>
        )}

        {/* Scrollable / Draggable Image */}
        <motion.div
          key={currentImage}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.18 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.x > 50 && currentIndex > 0) {
              setCurrentIndex((prev) => prev - 1);
            } else if (info.offset.x < -50 && currentIndex < images.length - 1) {
              setCurrentIndex((prev) => prev + 1);
            }
          }}
          className="max-w-full max-h-full w-auto h-auto flex items-center justify-center cursor-grab active:cursor-grabbing"
        >
          <img
            src={currentImage}
            alt=""
            className="max-w-full max-h-[72vh] w-auto h-auto object-contain rounded-2xl select-none shadow-2xl pointer-events-none"
            draggable={false}
          />
        </motion.div>

        {/* Next Button (UI Arrow Symbol) */}
        {images.length > 1 && (
          <button
            type="button"
            disabled={currentIndex === images.length - 1}
            onClick={() => setCurrentIndex((prev) => Math.min(images.length - 1, prev + 1))}
            className={cn(
              'absolute right-4 sm:right-8 z-20 w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all shadow-xl backdrop-blur-sm',
              currentIndex === images.length - 1
                ? 'opacity-30 cursor-not-allowed hover:bg-black/60'
                : 'hover:scale-105 active:scale-95 cursor-pointer'
            )}
            aria-label="Next image"
          >
            <ChevronRight size={28} />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Carousel Strip */}
      {images.length > 1 && (
        <div
          ref={thumbnailContainerRef}
          className="flex items-center justify-center gap-2.5 px-6 py-2 overflow-x-auto flex-shrink-0 max-w-full scrollbar-none"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                'w-14 h-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer shadow-md',
                idx === currentIndex
                  ? 'border-[#1A6B3C] dark:border-emerald-400 ring-2 ring-[#1A6B3C]/50 scale-105 opacity-100'
                  : 'border-transparent opacity-50 hover:opacity-85'
              )}
            >
              <img src={img} alt="" className="w-full h-full object-cover pointer-events-none" />
            </button>
          ))}
        </div>
      )}

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
