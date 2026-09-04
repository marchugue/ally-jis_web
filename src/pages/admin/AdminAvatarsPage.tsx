import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Trash2, Loader2, Upload, AlertCircle } from 'lucide-react';
import { apiClient, isApiConfigured } from '@/api/client';
import type { PresetAvatarRow } from '@/api/types';
import { notify } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

export default function AdminAvatarsPage() {
  const [avatars, setAvatars] = useState<PresetAvatarRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [labelInput, setLabelInput] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isApiConfigured) { setLoading(false); return; }
    apiClient.adminListPresetAvatars()
      .then((res) => setAvatars(res.avatars))
      .catch((err: any) => notify.error('Failed to load avatars', err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify.error('Invalid file', 'Please upload a JPEG, PNG, WebP, or GIF image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      notify.error('File too large', 'Maximum size is 10 MB.');
      return;
    }
    setUploading(true);
    try {
      const res = await apiClient.adminUploadPresetAvatar(file, labelInput.trim() || undefined);
      setAvatars((prev) => [...prev, res.avatar]);
      setLabelInput('');
      notify.success('Avatar added', 'New preset avatar uploaded successfully.');
    } catch (err: any) {
      notify.error('Upload failed', err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this preset avatar? Users who chose it will keep it on their profile, but it will no longer appear as an option.')) return;
    setDeletingId(id);
    try {
      await apiClient.adminDeletePresetAvatar(id);
      setAvatars((prev) => prev.filter((a) => a.id !== id));
      notify.success('Deleted', 'Preset avatar removed.');
    } catch (err: any) {
      notify.error('Delete failed', err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="space-y-6 w-full pb-8 font-jakarta">
      {/* Header */}
      <div className="bg-white dark:bg-[#161D19] p-4 sm:p-5 rounded-2xl border border-gray-200/80 dark:border-white/5 shadow-xs">
        <h1 className="font-fraunces text-2xl font-bold text-gray-900 dark:text-white">Preset Avatars</h1>
        <p className="font-jakarta text-xs sm:text-sm text-gray-500 dark:text-white/40 mt-1">
          Manage the avatar image library that users can choose during onboarding and profile editing.
          Images are stored in Cloudflare R2 storage bucket.
        </p>
      </div>

      {/* R2 Notice */}
      {!isApiConfigured && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3 text-amber-800 dark:text-amber-300">
          <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="font-jakarta text-xs sm:text-sm font-medium">
            API not configured. Connect your backend to manage preset avatars.
          </p>
        </div>
      )}

      {/* Upload card */}
      <div className="bg-white dark:bg-[#161D19] rounded-2xl border border-gray-200/80 dark:border-white/5 shadow-xs p-5 sm:p-6 space-y-4">
        <h2 className="font-fraunces text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ImagePlus size={18} className="text-[#1A6B3C] dark:text-emerald-400" />
          Add New Preset Avatar
        </h2>

        {/* Label input */}
        <div>
          <label className="font-jakarta text-xs font-semibold text-gray-500 dark:text-white/50 uppercase tracking-wide block mb-1.5">
            Label <span className="font-normal text-gray-400 dark:text-white/30">(optional)</span>
          </label>
          <input
            type="text"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            placeholder="e.g. Friendly Panda, Cool Cat…"
            maxLength={60}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 focus:border-[#1A6B3C] dark:focus:border-emerald-500 bg-gray-50 dark:bg-white/5 focus:bg-white dark:focus:bg-white/10 font-jakarta text-sm text-gray-900 dark:text-white outline-none transition-all shadow-xs"
          />
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={cn(
            'relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all active:scale-[0.99]',
            dragOver
              ? 'border-[#1A6B3C] dark:border-emerald-500 bg-[#1A6B3C]/5 dark:bg-emerald-500/10'
              : 'border-gray-200 dark:border-white/10 hover:border-[#1A6B3C]/40 dark:hover:border-emerald-500/40 hover:bg-gray-50 dark:hover:bg-white/5',
            uploading && 'pointer-events-none opacity-60',
          )}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={28} className="text-[#1A6B3C] dark:text-emerald-400 animate-spin" />
              <p className="font-jakarta text-sm text-gray-500 dark:text-white/60">Uploading to Cloudflare R2…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload size={28} className="text-gray-400 dark:text-white/40" />
              <p className="font-jakarta text-sm font-semibold text-gray-800 dark:text-white/90">
                Drop an image here or click to browse
              </p>
              <p className="font-jakarta text-xs text-gray-400 dark:text-white/40">JPEG, PNG, WebP, GIF · Max 10 MB</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
          />
        </div>
      </div>

      {/* Avatar grid */}
      <div className="bg-white dark:bg-[#161D19] rounded-2xl border border-gray-200/80 dark:border-white/5 shadow-xs p-5 sm:p-6">
        <h2 className="font-fraunces text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-between">
          <span>Current Presets</span>
          <span className="font-jakarta text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/70 tabular-nums">
            {avatars.length} items
          </span>
        </h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={28} className="text-[#1A6B3C] dark:text-emerald-400 animate-spin" />
          </div>
        ) : avatars.length === 0 ? (
          <div className="py-12 text-center">
            <ImagePlus size={40} className="text-gray-300 dark:text-white/20 mx-auto mb-3" />
            <p className="font-jakarta text-sm text-gray-400 dark:text-white/40">No preset avatars yet. Upload the first one above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {avatars.map((avatar) => (
              <div key={avatar.id} className="group relative bg-gray-50 dark:bg-white/5 p-2 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-emerald-500/30 transition-all">
                <div className="aspect-square rounded-xl overflow-hidden border border-gray-200/60 dark:border-white/10 group-hover:border-[#1A6B3C]/40 dark:group-hover:border-emerald-500/40 transition-all bg-white dark:bg-[#0F1512]">
                  <img
                    src={avatar.url}
                    alt={avatar.label ?? 'Preset avatar'}
                    className="w-full h-full object-cover"
                  />
                </div>
                {avatar.label && (
                  <p className="mt-2 font-jakarta text-xs font-semibold text-gray-700 dark:text-white/80 text-center truncate px-1">
                    {avatar.label}
                  </p>
                )}
                <button
                  onClick={() => handleDelete(avatar.id)}
                  disabled={deletingId === avatar.id}
                  className={cn(
                    'absolute -top-2 -right-2 w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md transition-all active:scale-95',
                    'opacity-0 group-hover:opacity-100 hover:bg-rose-600',
                    deletingId === avatar.id && 'opacity-100 pointer-events-none',
                  )}
                  title="Delete this preset avatar"
                >
                  {deletingId === avatar.id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Trash2 size={13} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
