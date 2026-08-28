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

  return (
    <div className="p-4 border-t bg-white">
      {children}
      {replyTo && currentUserId && participantName && (
        <div className="mb-3 flex items-start gap-3 rounded-xl bg-[#1A6B3C]/5 px-3 py-2.5">
          <ReplyQuote
            variant="compose"
            label={getReplyComposeLabel(replyTo.senderId, currentUserId, participantName)}
            content={replyTo.content}
            imageUrl={replyTo.imageUrl}
          />
          <button
            onClick={onCancelReply}
            className="p-1 rounded-full text-gray-400 hover:bg-white hover:text-gray-600 transition-colors flex-shrink-0"
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
              className="h-20 w-32 object-cover rounded-xl border border-gray-100"
              muted
            />
          ) : (
            <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-xl border border-gray-100" />
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
          className="p-2.5 text-gray-400 hover:text-[#3B8C7E] hover:bg-[#3B8C7E]/5 rounded-xl transition-all"
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
                ? 'text-[#1A6B3C] bg-[#1A6B3C]/10'
                : 'text-gray-400 hover:text-[#3B8C7E] hover:bg-[#3B8C7E]/5'
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
                className="absolute bottom-full left-0 mb-2 z-50 rounded-[20px] overflow-hidden border border-black/[0.06] shadow-[0_12px_40px_rgba(0,0,0,0.16)] backdrop-blur-2xl bg-white/80"
              >
                <Picker
                  data={data}
                  onEmojiSelect={handleEmojiSelect}
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
            className="w-full bg-gray-50 border-none rounded-2xl py-2.5 px-4 text-sm font-jakarta focus:ring-2 focus:ring-[#1A6B3C]/20 focus:bg-white transition-all outline-none"
            disabled={disabled}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={disabled || (!text.trim() && !image)}
          className="bg-[#1A6B3C] text-white p-2.5 rounded-xl hover:bg-[#155a33] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}