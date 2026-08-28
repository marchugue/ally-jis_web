import { motion } from 'framer-motion';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { MOBILE_MESSAGE_ACTION_CONFIG } from '@/lib/chatActionConfig';

interface EmojiMartSelection {
  native: string;
}

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
      <div
        className="rounded-[20px] overflow-hidden border border-black/[0.06] shadow-[0_12px_40px_rgba(0,0,0,0.2)] backdrop-blur-2xl bg-white/95 max-w-[min(100vw-2rem,360px)]"
        onClick={(e) => e.stopPropagation()}
      >
        <Picker
          data={data}
          onEmojiSelect={(emoji: EmojiMartSelection) => {
            onSelect(emoji.native);
            onClose();
          }}
          theme="light"
          previewPosition="none"
          skinTonePosition="search"
          maxFrequentRows={2}
          perLine={8}
          emojiButtonRadius="10px"
          emojiButtonSize={34}
          emojiSize={20}
          style={
            {
              '--rgb-background': '255, 255, 255',
              '--rgb-input': '243, 244, 246',
              '--rgb-color': '55, 65, 81',
              '--rgb-accent': '26, 107, 60',
              '--color-border': 'rgba(0, 0, 0, 0.04)',
              '--color-border-over': 'rgba(0, 0, 0, 0.06)',
              '--font-family':
                '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Plus Jakarta Sans", sans-serif',
              '--font-size': '14px',
              '--border-radius': '20px',
              '--category-icon-size': '18px',
            } as React.CSSProperties
          }
        />
      </div>
    </motion.div>
  );
}
