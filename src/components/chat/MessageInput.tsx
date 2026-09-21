import { useState, useRef, useEffect, ReactNode } from 'react';
import { Send, Image as ImageIcon, X, Smile } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { MessageReplyPreview } from '@/types/ally';
import { ReplyQuote } from '@/components/chat/ReplyQuote';
import { getReplyComposeLabel } from '@/lib/replyLabels';

interface MessageInputProps {
  onSend: (content: string | null, images?: File[] | File | null) => void;
  disabled?: boolean;
  children?: ReactNode;
  replyTo?: MessageReplyPreview | null;
  onCancelReply?: () => void;
  currentUserId?: string;
  participantName?: string;
  canUploadImages?: boolean;
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
  canUploadImages = true,
  onTextChange,
}: MessageInputProps) {
  const [text, setText] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<{ file: File; url: string; isVideo: boolean }[]>([]);
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
    if (!text.trim() && images.length === 0) return;
    onSend(text, images.length === 1 ? images[0] : images);
    setText('');
    setImages([]);
    setImagePreviews([]);
    onTextChange?.('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const remainingSlots = 6 - images.length;
      const toAdd = files.slice(0, remainingSlots);
      const newItems = toAdd.map((file) => ({
        file,
        url: URL.createObjectURL(file),
        isVideo: file.type.startsWith('video/'),
      }));
      setImages((prev) => [...prev, ...toAdd].slice(0, 6));
      setImagePreviews((prev) => [...prev, ...newItems].slice(0, 6));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      const target = prev[index];
      if (target?.url) URL.revokeObjectURL(target.url);
      return prev.filter((_, i) => i !== index);
    });
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
    <div className="w-full bg-transparent border-none p-0">
      {children}
      {replyTo && currentUserId && participantName && (
        <div className="mb-2.5 flex items-start gap-3 rounded-2xl bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border border-[#E2DED7]/90 dark:border-white/10 px-3.5 py-2.5 shadow-sm">
          <ReplyQuote
            variant="compose"
            label={getReplyComposeLabel(replyTo.senderId, currentUserId, participantName)}
            content={replyTo.content}
            imageUrl={replyTo.imageUrl}
          />
          <button
            onClick={onCancelReply}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex-shrink-0"
            aria-label="Cancel reply"
          >
            <X size={14} />
          </button>
        </div>
      )}
      {/* Image Preview Strip (up to 6) */}
      {imagePreviews.length > 0 && (
        <div className="flex items-center gap-2 mb-2.5 overflow-x-auto py-1.5 px-1 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-md rounded-2xl border border-[#E2DED7]/80 dark:border-white/10 shadow-sm">
          {imagePreviews.map((item, idx) => (
            <div key={idx} className="relative flex-shrink-0">
              {item.isVideo ? (
                <video
                  src={item.url}
                  className="h-20 w-28 object-cover rounded-xl border border-gray-200 dark:border-white/10"
                  muted
                />
              ) : (
                <img
                  src={item.url}
                  alt={`Preview ${idx + 1}`}
                  className="h-20 w-20 object-cover rounded-xl border border-gray-200 dark:border-white/10"
                />
              )}
              <button
                type="button"
                onClick={() => handleRemoveImage(idx)}
                className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-colors"
                aria-label="Remove image"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {imagePreviews.length < 6 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-20 w-20 flex-shrink-0 rounded-xl border-2 border-dashed border-gray-300 dark:border-white/20 hover:border-[#1A6B3C] dark:hover:border-emerald-500 flex flex-col items-center justify-center text-gray-400 hover:text-[#1A6B3C] transition-colors"
            >
              <ImageIcon size={20} />
              <span className="text-[10px] font-medium mt-1">Add (max 6)</span>
            </button>
          )}
        </div>
      )}

      {/* Floating Chat Input Pill (Matches mobile native) */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Plus / Media action button */}
        <button
          type="button"
          disabled={!canUploadImages}
          onClick={() => fileInputRef.current?.click()}
          title={!canUploadImages ? 'Image sharing unlocks at Stage 3 of the Ally Roadmap' : 'Attach image or video'}
          className={`w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all flex-shrink-0 shadow-xs border ${
            !canUploadImages
              ? 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-60'
              : 'bg-white/95 dark:bg-[#0D131F]/95 border-[#E2DED7] dark:border-white/10 text-[#1A6B3C] dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-white/10 hover:border-[#1A6B3C]/50 active:scale-95'
          }`}
        >
          <ImageIcon size={19} />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*,video/mp4,video/webm,video/quicktime"
          multiple
          onChange={handleImageChange}
        />

        {/* Input capsule container containing emoji, text, and send pill */}
        <div className="flex-1 flex items-center bg-white/95 dark:bg-[#0D131F]/95 backdrop-blur-md rounded-full border border-[#E2DED7] dark:border-white/10 shadow-sm pl-2 pr-1.5 py-1 md:py-1.5 gap-1 transition-all focus-within:ring-2 focus-within:ring-[#1A6B3C]/20 dark:focus-within:ring-emerald-500/20 focus-within:border-[#1A6B3C]/40">
          <div className="relative flex-shrink-0" ref={emojiPickerRef}>
            <button
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              aria-label="Add emoji"
              aria-expanded={showEmojiPicker}
              className={`p-1.5 md:p-2 rounded-full transition-colors ${
                showEmojiPicker
                  ? 'text-[#1A6B3C] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/20'
                  : 'text-gray-400 hover:text-[#1A6B3C] dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/5'
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
                  className="absolute bottom-full left-0 mb-3 z-50 rounded-[20px] overflow-hidden border border-black/[0.06] dark:border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.16)] backdrop-blur-2xl bg-white/90 dark:bg-[#111827]/95"
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
            className="flex-1 min-w-0 bg-transparent border-none py-1.5 px-2 text-sm md:text-[15px] font-jakarta text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none"
            disabled={disabled}
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={disabled || (!text.trim() && images.length === 0)}
            aria-label="Send message"
            className="flex-shrink-0 w-12 md:w-14 h-8 md:h-9 flex items-center justify-center rounded-full bg-[#1A6B3C] dark:bg-emerald-600 text-white hover:bg-[#155a33] dark:hover:bg-emerald-700 disabled:bg-[#A7D0B8] dark:disabled:bg-white/10 disabled:text-white/70 dark:disabled:text-gray-500 disabled:cursor-not-allowed transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}