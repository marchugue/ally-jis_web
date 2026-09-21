import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { AVATAR_EMOJI } from '@/lib/matchOptions';

type AvatarDisplayProps = {
  src?: string | null;
  name?: string | null;
  alt?: string;
  className?: string;
  textClassName?: string;
};

export const isImageUrl = (value?: string | null): boolean => {
  if (!value) return false;
  const v = value.trim();
  if (v.startsWith('http://') || v.startsWith('https://')) return true;
  if (v.startsWith('data:image/')) return true;
  if (v.startsWith('blob:')) return true;
  if (v.startsWith('/')) return true;
  if (/\.(png|jpe?g|webp|gif|svg|avif)($|\?)/i.test(v)) return true;
  if (v.includes('/')) return true;
  return false;
};

export const isEmojiAvatar = (value?: string | null): boolean => {
  if (!value) return false;
  return !isImageUrl(value);
};

export function AvatarDisplay({ src, name, alt, className, textClassName }: AvatarDisplayProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const cleanSrc = src?.trim() || null;

  // Check if src is an animal key (e.g. 'fox', 'wolf', 'panda')
  const animalEmoji = cleanSrc ? AVATAR_EMOJI[cleanSrc.toLowerCase()] : null;

  if (animalEmoji) {
    return (
      <div className={cn('flex items-center justify-center bg-[#1A6B3C]/10 dark:bg-transparent text-[#1A6B3C] dark:text-white flex-shrink-0 overflow-hidden select-none', className)}>
        <span className={cn('text-lg leading-none select-none', textClassName)}>{animalEmoji}</span>
      </div>
    );
  }

  // If it's an emoji string (not a URL/path)
  if (cleanSrc && !imgError && isEmojiAvatar(cleanSrc)) {
    return (
      <div className={cn('flex items-center justify-center bg-[#1A6B3C]/10 dark:bg-transparent text-[#1A6B3C] dark:text-white flex-shrink-0 overflow-hidden select-none', className)}>
        <span className={cn('text-lg leading-none select-none', textClassName)}>{cleanSrc}</span>
      </div>
    );
  }

  // If it's an image URL/path and hasn't failed to load
  if (cleanSrc && !imgError && isImageUrl(cleanSrc)) {
    return (
      <img
        src={cleanSrc}
        alt={alt ?? name ?? 'User avatar'}
        onError={() => setImgError(true)}
        className={cn('object-cover flex-shrink-0', className)}
      />
    );
  }

  // Fallback to name initial or default user icon
  const fallback = name?.trim().slice(0, 1).toUpperCase() || '👤';

  return (
    <div className={cn('flex items-center justify-center bg-[#1A6B3C]/10 dark:bg-white/10 text-[#1A6B3C] dark:text-white font-bold flex-shrink-0 overflow-hidden', className)}>
      <span className={cn('text-sm leading-none select-none', textClassName)}>{fallback}</span>
    </div>
  );
}
