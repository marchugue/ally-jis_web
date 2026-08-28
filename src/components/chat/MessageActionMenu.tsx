import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { MoreHorizontal, Reply, Forward, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MOBILE_MESSAGE_ACTION_CONFIG, computeAnchoredPopupPosition } from '@/lib/chatActionConfig';
import { QuickReactionsBar } from '@/components/chat/QuickReactionsBar';
import { EmojiPickerOverlay } from '@/components/chat/EmojiPickerOverlay';

interface MessageActionMenuProps {
  open: boolean;
  anchorRect?: DOMRect | null;
  onClose: () => void;
  onReact: (emoji: string) => void;
  onReply?: () => void;
  onForward?: () => void;
  onDelete?: () => void;
}

export function MobileReactionPopup({
  open,
  anchorRect = null,
  onClose,
  onReact,
  onReply,
  onForward,
  onDelete,
}: MessageActionMenuProps) {
  const [showFullPicker, setShowFullPicker] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({ opacity: 0 });

  useLayoutEffect(() => {
    if (!open || !anchorRect || !containerRef.current) return;

    const el = containerRef.current;
    const { width, height } = el.getBoundingClientRect();
    const { top, left } = computeAnchoredPopupPosition(anchorRect, width, height);

    setPopupStyle({
      position: 'fixed',
      top,
      left,
      opacity: 1,
      zIndex: MOBILE_MESSAGE_ACTION_CONFIG.zIndex.popup,
    });
  }, [open, anchorRect]);

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

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 md:hidden"
        style={{
          zIndex: MOBILE_MESSAGE_ACTION_CONFIG.zIndex.overlay,
          backgroundColor: `rgba(0, 0, 0, ${MOBILE_MESSAGE_ACTION_CONFIG.overlayOpacity})`,
        }}
        onClick={onClose}
      />

      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.94, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 8 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        style={popupStyle}
        className="flex flex-col gap-2 md:hidden w-[min(100vw-24px,320px)]"
        onClick={(e) => e.stopPropagation()}
      >
        <QuickReactionsBar
          variant="mobile"
          onReact={onReact}
          onOpenPicker={() => setShowFullPicker(true)}
        />

        <div className="flex flex-col bg-white/95 backdrop-blur-2xl rounded-2xl border border-black/[0.06] shadow-[0_12px_32px_rgba(0,0,0,0.18)] overflow-hidden w-full">
          <ActionRow icon={<Reply size={16} />} label="Reply" onClick={onReply} />
          <ActionRow icon={<Forward size={16} />} label="Forward" onClick={onForward} />
          <ActionRow icon={<Trash2 size={16} />} label="Delete" onClick={onDelete} destructive />
        </div>
      </motion.div>

      <AnimatePresence>
        {showFullPicker && (
          <EmojiPickerOverlay
            open
            onClose={() => setShowFullPicker(false)}
            onSelect={onReact}
            className="fixed inset-0 md:hidden flex items-center justify-center bg-black/30 p-4"
          />
        )}
      </AnimatePresence>
    </>
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
        'flex items-center gap-3 px-4 py-2.5 text-sm font-jakarta text-left transition-colors hover:bg-black/[0.04]',
        destructive ? 'text-red-500' : 'text-gray-700',
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
          className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
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
                'absolute bottom-full mb-2 flex flex-col bg-white rounded-xl border border-black/[0.06] shadow-[0_8px_24px_rgba(0,0,0,0.14)] overflow-hidden min-w-[160px] z-50',
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
