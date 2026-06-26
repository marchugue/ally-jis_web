import { useState, useRef, ReactNode } from 'react';
import { Send, Image as ImageIcon, X } from 'lucide-react';

interface MessageInputProps {
  onSend: (content: string | null, image?: File | null) => void;
  disabled?: boolean;
  children?: ReactNode;
}

export function MessageInput({ onSend, disabled, children }: MessageInputProps) {
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!text.trim() && !image) return;
    onSend(text, image);
    setText('');
    setImage(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-4 border-t bg-white">
      {children}
      {imagePreview && (
        <div className="relative inline-block mb-3">
          <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-xl border border-gray-100" />
          <button
            onClick={() => { setImage(null); setImagePreview(null); }}
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
          accept="image/*"
          onChange={handleImageChange}
        />
        <div className="flex-1 relative">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Write a message..."
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
