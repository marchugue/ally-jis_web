import { useRef, useState } from 'react';
import { X, Image as ImageIcon, Globe2, Users } from 'lucide-react';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import type { Student } from '@/types/ally';
import type { PostAudience } from '@/types/feed';

const MAX_IMAGES = 4;

interface PostComposerModalProps {
  open: boolean;
  onClose: () => void;
  currentUser: Student;
  onSubmit: (input: { content: string; audience: PostAudience; files: File[] }) => Promise<void>;
}

export default function PostComposerModal({ open, onClose, currentUser, onSubmit }: PostComposerModalProps) {
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState<PostAudience>('public');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;

    const combined = [...files, ...selected].slice(0, MAX_IMAGES);
    setFiles(combined);
    setPreviews(combined.map((f) => URL.createObjectURL(f)));

    if (files.length + selected.length > MAX_IMAGES) {
      setError(`You can attach up to ${MAX_IMAGES} images per post.`);
    } else {
      setError(null);
    }

    // allow re-selecting the same file again later
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setContent('');
    setAudience('public');
    setFiles([]);
    setPreviews([]);
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed && files.length === 0) {
      setError('Write something or add a photo before posting.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({ content: trimmed, audience, files });
      handleClose();
    } catch (err: any) {
      setError(err?.message ?? 'Could not create the post. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[90vh] flex flex-col animate-[slideUp_0.2s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-fraunces text-lg font-bold text-gray-900">Create post</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex items-start gap-3">
            <AvatarDisplay
              src={currentUser.avatar}
              name={currentUser.name}
              className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
            />
            <div className="flex-1">
              <p className="font-jakarta font-bold text-gray-900 text-sm">{currentUser.name}</p>
              <button
                onClick={() => setAudience(audience === 'public' ? 'connections' : 'public')}
                className="flex items-center gap-1 mt-1 font-jakarta text-[11px] font-semibold text-[#1A6B3C] bg-[#1A6B3C]/8 px-2 py-1 rounded-lg hover:bg-[#1A6B3C]/14 transition-colors"
              >
                {audience === 'public' ? <Globe2 size={12} /> : <Users size={12} />}
                {audience === 'public' ? 'Public' : 'Allies only'}
              </button>
            </div>
          </div>

          <textarea
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`What's on your mind, ${currentUser.name.split(' ')[0]}?`}
            rows={5}
            className="w-full mt-4 font-jakarta text-sm text-gray-800 placeholder:text-gray-400 resize-none outline-none"
          />

          {previews.length > 0 && (
            <div className={`grid gap-2 mt-3 ${previews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {previews.map((src, i) => (
                <div key={src} className="relative rounded-xl overflow-hidden border border-gray-100 aspect-square">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="font-jakarta text-xs text-red-500 mt-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={files.length >= MAX_IMAGES || isSubmitting}
            className="flex items-center gap-1.5 font-jakarta text-xs font-semibold text-gray-600 hover:text-[#1A6B3C] disabled:opacity-40 disabled:hover:text-gray-600 transition-colors"
          >
            <ImageIcon size={16} />
            Photo {files.length > 0 && `(${files.length}/${MAX_IMAGES})`}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (!content.trim() && files.length === 0)}
            className="bg-[#1A6B3C] text-white font-jakarta font-semibold text-sm px-5 py-2 rounded-xl hover:bg-[#155a33] disabled:opacity-40 disabled:hover:bg-[#1A6B3C] transition-colors"
          >
            {isSubmitting ? 'Posting…' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
}