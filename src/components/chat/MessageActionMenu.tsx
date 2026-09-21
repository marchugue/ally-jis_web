import { useEffect, useState, useRef } from 'react';
import { MoreHorizontal, Reply, Send, Forward, Copy, Trash2, RotateCcw, Flag, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { QUICK_REACTIONS, isOnlyEmoji } from '@/lib/chatActionConfig';
import { QuickReactionsBar } from '@/components/chat/QuickReactionsBar';
import { EmojiPickerOverlay } from '@/components/chat/EmojiPickerOverlay';
import type { Message } from '@/types/ally';

interface MobileReactionPopupProps {
  open: boolean;
  msg: Message;
  isMe: boolean;
  anchorRect?: DOMRect | null;
  onClose: () => void;
  onReact: (emoji: string) => void;
  onReply?: () => void;
  onForward?: () => void;
  onCopy?: () => void;
  onDeleteForMe?: () => void;
  onDeleteForEveryone?: () => void;
  onReport?: () => void;
}

export function MobileReactionPopup({
  open,
  msg,
  isMe,
  anchorRect = null,
  onClose,
  onReact,
  onReply,
  onForward,
  onCopy,
  onDeleteForMe,
  onDeleteForEveryone,
  onReport,
}: MobileReactionPopupProps) {
  const [showFullPicker, setShowFullPicker] = useState(false);

  useEffect(() => {
    if (!open) {
      setShowFullPicker(false);
      return;
    }

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const SCREEN_WIDTH = typeof window !== 'undefined' ? window.innerWidth : 375;
  const SCREEN_HEIGHT = typeof window !== 'undefined' ? window.innerHeight : 667;

  // Parse media for preview (single image / video, NO stacked cards)
  const rawImages = (msg as any).images || msg.imageUrl;
  let parsedImages: string[] = [];
  if (Array.isArray(rawImages)) {
    parsedImages = rawImages.filter(Boolean);
  } else if (typeof rawImages === 'string') {
    const trimmed = rawImages.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const arr = JSON.parse(trimmed);
        if (Array.isArray(arr)) {
          parsedImages = arr.filter(Boolean);
        }
      } catch {}
    }
    if (parsedImages.length === 0 && trimmed) {
      parsedImages = [trimmed];
    }
  }

  const primaryMedia = parsedImages[0] || '';
  const isVideoUrl = Boolean(primaryMedia && /\.(mp4|webm|mov|quicktime)([?#]|$)/i.test(primaryMedia));
  const isEmojiOnly = Boolean(parsedImages.length === 0 && msg.content && isOnlyEmoji(msg.content));
  const hasContent = Boolean(msg.content?.trim());

  const bubbleWidth = anchorRect && anchorRect.width > 0
    ? Math.min(anchorRect.width, SCREEN_WIDTH - 32)
    : Math.min(260, SCREEN_WIDTH * 0.75);

  const bubbleHeight = anchorRect && anchorRect.height > 0
    ? Math.min(anchorRect.height, 280)
    : (isEmojiOnly ? 50 : 60);

  const REACTIONS_HEIGHT = 56;
  const optionCount = hasContent ? 5 : 4;
  const OPTIONS_HEIGHT = optionCount * 42 + 12; // ~180px - ~222px
  const GAP = 12;
  const PADDING = 16;

  // Screen height clamp to prevent overflow on compact screens
  const availableBubbleHeight = Math.max(50, SCREEN_HEIGHT - REACTIONS_HEIGHT - OPTIONS_HEIGHT - GAP * 3 - 32);
  const effectiveBubbleHeight = Math.min(bubbleHeight, availableBubbleHeight);
  const totalPopupHeight = REACTIONS_HEIGHT + GAP + effectiveBubbleHeight + GAP + OPTIONS_HEIGHT;
  const fixedTopY = Math.max(16, Math.round((SCREEN_HEIGHT - totalPopupHeight) / 2) - 10);

  const reactionsTop = fixedTopY;
  const messageTop = fixedTopY + REACTIONS_HEIGHT + GAP;
  const optionsTop = messageTop + effectiveBubbleHeight + GAP;

  // Horizontal alignment matching mobile: right-aligned if sent by me, left-aligned if received
  const clampedMessageX = isMe
    ? SCREEN_WIDTH - bubbleWidth - PADDING
    : PADDING;

  const reactionsWidth = Math.min(QUICK_REACTIONS.length * 44 + 56, SCREEN_WIDTH - 24);
  const reactionsLeft = isMe
    ? SCREEN_WIDTH - reactionsWidth - PADDING
    : PADDING;

  const optionsWidth = 210;
  const optionsLeft = isMe
    ? SCREEN_WIDTH - optionsWidth - PADDING
    : PADDING;

  return (
    <div className="fixed inset-0 z-[60] md:hidden select-none">
      {/* ── 1. Full-screen backdrop (dismiss on tap) ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
        className="absolute inset-0 cursor-pointer"
        onClick={onClose}
      />

      {/* ── 2. Quick Reactions Bar on TOP ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 6 }}
        transition={{ duration: 0.15 }}
        style={{
          position: 'fixed',
          left: reactionsLeft,
          top: reactionsTop,
          width: reactionsWidth,
          height: REACTIONS_HEIGHT,
          zIndex: 70,
        }}
        className="bg-white dark:bg-[#181818] rounded-full flex items-center justify-between px-2.5 shadow-[0_6px_20px_rgba(0,0,0,0.25)] border border-black/5 dark:border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {QUICK_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => {
              onReact(emoji);
              onClose();
            }}
            className="text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:scale-125 active:scale-95 transition-transform cursor-pointer select-none"
          >
            {emoji}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowFullPicker(true)}
          className="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors cursor-pointer"
          aria-label="More emojis"
        >
          <Plus size={18} />
        </button>
      </motion.div>

      {/* ── 3. Anchored Message Bubble (Lifted, Middle) ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.15 }}
        style={{
          position: 'fixed',
          left: clampedMessageX,
          top: messageTop,
          width: bubbleWidth,
          maxHeight: effectiveBubbleHeight,
          zIndex: 70,
        }}
        className={cn(
          'flex flex-col justify-center select-none overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.3)]',
          isEmojiOnly
            ? 'bg-transparent shadow-none p-0'
            : cn(
                'rounded-[18px] px-3.5 py-2.5',
                isMe
                  ? 'bg-[#1A6B3C] dark:bg-emerald-600 text-white'
                  : 'bg-white dark:bg-[#202020] text-gray-900 dark:text-white border border-black/5 dark:border-white/10'
              )
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {primaryMedia && (
          isVideoUrl ? (
            <video
              src={primaryMedia}
              controls
              playsInline
              className="w-full max-h-[180px] rounded-[14px] object-cover mb-2"
            />
          ) : (
            <img
              src={primaryMedia}
              alt=""
              className="w-full max-h-[180px] rounded-[14px] object-cover mb-2"
            />
          )
        )}
        {Boolean(msg.content) && (
          <p
            className={cn(
              isEmojiOnly
                ? cn('text-4xl leading-tight py-1', isMe ? 'text-right' : 'text-left')
                : 'text-sm font-jakarta leading-snug whitespace-pre-wrap break-words'
            )}
          >
            {msg.content}
          </p>
        )}
      </motion.div>

      {/* ── 4. Options Menu (Shortcut Actions, Bottom) ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: -6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: -6 }}
        transition={{ duration: 0.15 }}
        style={{
          position: 'fixed',
          left: optionsLeft,
          top: optionsTop,
          width: optionsWidth,
          zIndex: 70,
        }}
        className="bg-white dark:bg-[#181818] rounded-[20px] py-1.5 px-3.5 shadow-[0_8px_24px_rgba(0,0,0,0.2)] border border-black/5 dark:border-white/10 flex flex-col divide-y divide-gray-100 dark:divide-white/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Reply */}
        <button
          type="button"
          onClick={() => {
            onReply?.();
            onClose();
          }}
          className="flex items-center gap-3.5 py-2.5 text-sm font-jakarta font-medium text-gray-900 dark:text-gray-100 hover:opacity-75 transition-opacity text-left cursor-pointer"
        >
          <Reply size={18} className="text-gray-700 dark:text-gray-300 flex-shrink-0" />
          <span>Reply</span>
        </button>

        {/* Forward */}
        <button
          type="button"
          onClick={() => {
            onForward?.();
            onClose();
          }}
          className="flex items-center gap-3.5 py-2.5 text-sm font-jakarta font-medium text-gray-900 dark:text-gray-100 hover:opacity-75 transition-opacity text-left cursor-pointer"
        >
          <Send size={18} className="text-gray-700 dark:text-gray-300 flex-shrink-0" />
          <span>Forward</span>
        </button>

        {/* Copy (shown if content exists) */}
        {hasContent && (
          <button
            type="button"
            onClick={() => {
              onCopy?.();
              onClose();
            }}
            className="flex items-center gap-3.5 py-2.5 text-sm font-jakarta font-medium text-gray-900 dark:text-gray-100 hover:opacity-75 transition-opacity text-left cursor-pointer"
          >
            <Copy size={18} className="text-gray-700 dark:text-gray-300 flex-shrink-0" />
            <span>Copy</span>
          </button>
        )}

        {/* Delete for me */}
        <button
          type="button"
          onClick={() => {
            onDeleteForMe?.();
            onClose();
          }}
          className="flex items-center gap-3.5 py-2.5 text-sm font-jakarta font-medium text-gray-900 dark:text-gray-100 hover:opacity-75 transition-opacity text-left cursor-pointer"
        >
          <Trash2 size={18} className="text-gray-700 dark:text-gray-300 flex-shrink-0" />
          <span>Delete for me</span>
        </button>

        {/* Delete for everyone (sender only) OR Report (partner) */}
        {isMe ? (
          <button
            type="button"
            onClick={() => {
              onDeleteForEveryone?.();
              onClose();
            }}
            className="flex items-center gap-3.5 py-2.5 text-sm font-jakarta font-medium text-red-500 hover:opacity-75 transition-opacity text-left cursor-pointer"
          >
            <RotateCcw size={18} className="text-red-500 flex-shrink-0" />
            <span>Delete for everyone</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              onReport?.();
              onClose();
            }}
            className="flex items-center gap-3.5 py-2.5 text-sm font-jakarta font-medium text-red-500 hover:opacity-75 transition-opacity text-left cursor-pointer"
          >
            <Flag size={18} className="text-red-500 flex-shrink-0" />
            <span>Report</span>
          </button>
        )}
      </motion.div>

      {/* ── 5. Full Emoji Picker Modal ── */}
      <AnimatePresence>
        {showFullPicker && (
          <EmojiPickerOverlay
            open
            onClose={() => setShowFullPicker(false)}
            onSelect={(emoji) => {
              onReact(emoji);
              setShowFullPicker(false);
              onClose();
            }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ActionRow({
  icon,
  label,
  onClick,
  destructive = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 text-sm font-jakarta text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/5 cursor-pointer',
        destructive ? 'text-red-500' : 'text-gray-700 dark:text-gray-200',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

export function DesktopHoverActions({
  side,
  onQuickReact,
  onReply,
  onForward,
  onDelete,
}: {
  side: 'left' | 'right';
  onQuickReact: (emoji: string) => void;
  onReply?: () => void;
  onForward?: () => void;
  onDelete?: () => void;
}) {
  const [showReactions, setShowReactions] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showReactions && !showMenu && !showFullPicker) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowReactions(false);
        setShowMenu(false);
        setShowFullPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showReactions, showMenu, showFullPicker]);

  const handleReact = (emoji: string) => {
    onQuickReact(emoji);
    setShowReactions(false);
    setShowFullPicker(false);
  };

  return (
    <div
      ref={wrapperRef}
      className={cn(
        'relative hidden md:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0',
        side === 'right' ? 'ml-1' : 'mr-1',
      )}
    >
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowReactions((prev) => !prev);
            setShowMenu(false);
            setShowFullPicker(false);
          }}
          aria-label="React"
          className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <span className="text-base leading-none">😊</span>
        </button>

        <AnimatePresence>
          {showReactions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 4 }}
              transition={{ duration: 0.12 }}
              className={cn(
                'absolute bottom-full mb-2 z-50',
                side === 'right' ? 'right-0' : 'left-0',
              )}
            >
              <QuickReactionsBar
                variant="desktop"
                onReact={handleReact}
                onOpenPicker={() => {
                  setShowFullPicker(true);
                  setShowReactions(false);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowMenu((prev) => !prev);
            setShowReactions(false);
            setShowFullPicker(false);
          }}
          aria-label="More actions"
          className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <MoreHorizontal size={16} />
        </button>

        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 4 }}
              transition={{ duration: 0.12 }}
              className={cn(
                'absolute bottom-full mb-2 flex flex-col bg-white dark:bg-[#111827] rounded-xl border border-black/[0.06] dark:border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.14)] overflow-hidden min-w-[160px] z-50',
                side === 'right' ? 'right-0' : 'left-0',
              )}
            >
              <ActionRow icon={<Reply size={15} />} label="Reply" onClick={onReply} />
              <ActionRow icon={<Forward size={15} />} label="Forward" onClick={onForward} />
              <ActionRow icon={<Trash2 size={15} />} label="Delete" onClick={onDelete} destructive />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showFullPicker && (
          <EmojiPickerOverlay
            open
            onClose={() => setShowFullPicker(false)}
            onSelect={handleReact}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
