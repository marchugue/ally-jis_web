import { useState } from 'react';
import { X, Globe2, Users } from 'lucide-react';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import { apiClient } from '@/api/client';
import { notify } from '@/components/ui/sonner';
import type { Student } from '@/types/ally';
import type { FeedPost, PostAudience } from '@/types/feed';

interface EditPostModalProps {
  open: boolean;
  onClose: () => void;
  post: FeedPost;
  currentUser: Student;
  onSave?: (updatedPost: FeedPost) => void;
}

export default function EditPostModal({ open, onClose, post, currentUser, onSave }: EditPostModalProps) {
  const [content, setContent] = useState(post.content || '');
  const [audience, setAudience] = useState<PostAudience>(post.audience || 'public');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed && (!post.media || post.media.length === 0)) {
      setError('Post content cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await apiClient.updatePost(post.id, {
        content: trimmed,
        audience,
      });

      // Merge hydrated fields in case backend returns partial or full post
      const mergedPost: FeedPost = {
        ...post,
        ...(updated as unknown as FeedPost),
        content: trimmed,
        audience,
        updated_at: (updated as any)?.updated_at || new Date().toISOString(),
      };

      notify.success('Post updated', 'Your changes have been saved.');
      onSave?.(mergedPost);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Could not update the post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasMedia = post.media && post.media.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs px-0 sm:px-4">
      <div className="w-full sm:max-w-lg bg-white dark:bg-[#111827] rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[90vh] flex flex-col border border-transparent dark:border-white/10 animate-[slideUp_0.2s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/10">
          <h2 className="font-fraunces text-lg font-bold text-gray-900 dark:text-white">Edit post</h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
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
              <p className="font-jakarta font-bold text-gray-900 dark:text-white text-sm">{currentUser.name}</p>
              <button
                type="button"
                onClick={() => setAudience(audience === 'public' ? 'connections' : 'public')}
                className="flex items-center gap-1 mt-1 font-jakarta text-[11px] font-semibold text-[#1A6B3C] dark:text-emerald-400 bg-[#1A6B3C]/8 dark:bg-emerald-500/20 px-2 py-1 rounded-lg hover:bg-[#1A6B3C]/14 transition-colors cursor-pointer"
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
            placeholder="Edit your post content..."
            rows={5}
            className="w-full mt-4 font-jakarta text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none outline-none bg-transparent"
          />

          {/* Media preview (immutable) */}
          {hasMedia && (
            <div className="mt-3">
              <p className="text-[11px] font-jakarta text-gray-400 dark:text-gray-500 mb-2">
                Attached photos (photos cannot be edited):
              </p>
              <div className={`grid gap-2 ${post.media!.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {post.media!.map((m) => (
                  <div key={m.id} className="relative rounded-xl overflow-hidden border border-gray-100 dark:border-white/10 aspect-square bg-gray-50 dark:bg-white/5">
                    <img src={m.url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="font-jakarta text-xs text-red-500 mt-3 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-gray-100 dark:border-white/10">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || (!content.trim() && !hasMedia)}
            className="bg-[#1A6B3C] dark:bg-emerald-600 text-white font-jakarta font-semibold text-xs sm:text-sm px-5 py-2 rounded-xl hover:bg-[#155a33] dark:hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-[#1A6B3C] transition-colors shadow-sm cursor-pointer"
          >
            {isSubmitting ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

