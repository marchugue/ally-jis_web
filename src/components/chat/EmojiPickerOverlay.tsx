import { motion } from 'framer-motion';
import { MOBILE_MESSAGE_ACTION_CONFIG } from '@/lib/chatActionConfig';
import { FluentEmojiPicker } from '@/components/chat/FluentEmojiPicker';

interface EmojiPickerOverlayProps {
  open: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  className?: string;
}

export function EmojiPickerOverlay({ open, onClose, onSelect, className }: EmojiPickerOverlayProps) {
  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={className ?? 'fixed inset-0 z-[70] flex items-center justify-center bg-black/30 p-4'}
      style={{ zIndex: MOBILE_MESSAGE_ACTION_CONFIG.zIndex.emojiPicker }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <FluentEmojiPicker
          autoFocus
          onSelect={(emoji) => {
            onSelect(emoji);
            onClose();
          }}
        />
      </div>
    </motion.div>
  );
}
