import { useState, useRef, useEffect, ReactNode } from 'react';
import { Send, Image as ImageIcon, X, Smile } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { MessageReplyPreview } from '@/types/ally';
import { ReplyQuote } from '@/components/chat/ReplyQuote';
import { getReplyComposeLabel } from '@/lib/replyLabels';

interface MessageInputProps {
  onSend: (content: string | null, image?: File | null) => void;
  disabled?: boolean;
  children?: ReactNode;
  replyTo?: MessageReplyPreview | null;
  onCancelReply?: () => void;
  currentUserId?: string;
  participantName?: string;
  /** Fires on every keystroke with the current draft text. Used by the
   * anonymous match chat to drive a typing indicator — unused (and
   * safe to omit) for regular chat. */
  onTextChange?: (text: string) => void;
}

interface EmojiMartSelection {
  id: string;
  name: string;
  native: string;
  unified: string;
  shortcodes: string;
}

export function MessageInput({
  onSend,
  disabled,
  children,
  replyTo,
  onCancelReply,
  currentUserId,
  participantName,
  onTextChange,
}: MessageInputProps) {
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isVideoFile, setIsVideoFile] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Close the picker on outside click or Escape, same pattern as other
  // dismissible panels in the app.
  useEffect(() => {
    if (!showEmojiPicker) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowEmojiPicker(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showEmojiPicker]);

  useEffect(() => {
    if (replyTo) {
      textInputRef.current?.focus();
    }
  }, [replyTo]);

  const handleSend = () => {
    if (!text.trim() && !image) return;
    onSend(text, image);
    setText('');
    setImage(null);
    setImagePreview(null);
    setIsVideoFile(false);
    onTextChange?.('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const isVideo = file.type.startsWith('video/');
      setIsVideoFile(isVideo);
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    }
  };

  const handleEmojiSelect = (emoji: EmojiMartSelection) => {
    const input = textInputRef.current;
    if (input) {
      const start = input.selectionStart ?? text.length;
      const end = input.selectionEnd ?? text.length;
      const next = text.slice(0, start) + emoji.native + text.slice(end);
      setText(next);
      // Restore focus + caret right after the inserted emoji on next tick,
      // once React has applied the new value.
      requestAnimationFrame(() => {
        input.focus();
        const caret = start + emoji.native.length;
        input.setSelectionRange(caret, caret);
      });
    } else {
      setText((prev) => prev + emoji.native);
    }
    setShowEmojiPicker(false);
  };

  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  return (
    <div className="p-4 border-t border-gray-100 dark:border-white/10 bg-white dark:bg-[#0D131F]">
      {children}
      {replyTo && currentUserId && participantName && (
        <div className="mb-3 flex items-start gap-3 rounded-xl bg-[#1A6B3C]/5 dark:bg-white/5 border border-transparent dark:border-white/10 px-3 py-2.5">
          <ReplyQuote
            variant="compose"
            label={getReplyComposeLabel(replyTo.senderId, currentUserId, participantName)}
            content={replyTo.content}
            imageUrl={replyTo.imageUrl}
          />
          <button
            onClick={onCancelReply}
            className="p-1 rounded-full text-gray-400 hover:bg-white dark:hover:bg-white/10 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex-shrink-0"
            aria-label="Cancel reply"
          >
            <X size={14} />
          </button>
        </div>
      )}
      {imagePreview && (
        <div className="relative inline-block mb-3">
          {isVideoFile ? (
            <video
              src={imagePreview}
              className="h-20 w-32 object-cover rounded-xl border border-gray-100 dark:border-white/10"
              muted
            />
          ) : (
            <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-xl border border-gray-100 dark:border-white/10" />
          )}
          <button
            onClick={() => { setImage(null); setImagePreview(null); setIsVideoFile(false); }}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 text-gray-400 hover:text-[#3B8C7E] dark:hover:text-emerald-400 hover:bg-[#3B8C7E]/5 dark:hover:bg-white/5 rounded-xl transition-all"
        >
          <ImageIcon size={20} />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*,video/mp4,video/webm,video/quicktime"
          onChange={handleImageChange}
        />

        <div className="relative" ref={emojiPickerRef}>
          <button
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            aria-label="Add emoji"
            aria-expanded={showEmojiPicker}
            className={`p-2.5 rounded-xl transition-all ${
              showEmojiPicker
                ? 'text-[#1A6B3C] dark:text-emerald-400 bg-[#1A6B3C]/10 dark:bg-emerald-500/20'
                : 'text-gray-400 hover:text-[#3B8C7E] dark:hover:text-emerald-400 hover:bg-[#3B8C7E]/5 dark:hover:bg-white/5'
            }`}
          >
            <Smile size={20} />
          </button>

          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute bottom-full left-0 mb-2 z-50 rounded-[20px] overflow-hidden border border-black/[0.06] dark:border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.16)] backdrop-blur-2xl bg-white/80 dark:bg-[#111827]/95"
              >
                <Picker
                  data={data}
                  onEmojiSelect={handleEmojiSelect}
                  theme={isDarkMode ? 'dark' : 'light'}
                  previewPosition="none"
                  skinTonePosition="search"
                  maxFrequentRows={2}
                  perLine={8}
                  emojiButtonRadius="10px"
                  emojiButtonSize={34}
                  emojiSize={20}
                  style={
                    {
                      '--rgb-background': isDarkMode ? '17, 24, 39' : '255, 255, 255',
                      '--rgb-input': isDarkMode ? '31, 41, 55' : '243, 244, 246',
                      '--rgb-color': isDarkMode ? '243, 244, 246' : '55, 65, 81',
                      '--rgb-accent': '26, 107, 60',
                      '--color-border': isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                      '--color-border-over': isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
                      '--font-family':
                        '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Plus Jakarta Sans", sans-serif',
                      '--font-size': '14px',
                      '--border-radius': '20px',
                      '--category-icon-size': '18px',
                    } as React.CSSProperties
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 relative">
          <input
            type="text"
            ref={textInputRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              onTextChange?.(e.target.value);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={replyTo ? 'Write a reply…' : 'Write a message...'}
            className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl py-2.5 px-4 text-sm font-jakarta text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-[#1A6B3C]/20 dark:focus:ring-emerald-500/20 focus:bg-white dark:focus:bg-white/10 transition-all outline-none"
            disabled={disabled}
          />
        </div>
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || (!text.trim() && !image)}
          aria-label="Send message"
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-[#1A6B3C] dark:bg-emerald-600 text-white hover:bg-[#155a33] dark:hover:bg-emerald-700 disabled:bg-[#E2DED7] dark:disabled:bg-white/10 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}