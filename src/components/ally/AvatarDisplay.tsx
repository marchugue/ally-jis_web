import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

type AvatarDisplayProps = {
  src?: string | null;
  name?: string | null;
  alt?: string;
  className?: string;
  textClassName?: string;
};

export const isEmojiAvatar = (value?: string | null) => {
  if (!value) return false;
  if (value.startsWith('http')) return false;
  if (value.startsWith('data:')) return false;
  if (value.startsWith('/')) return false;
  return true;
};

export function AvatarDisplay({ src, name, alt, className, textClassName }: AvatarDisplayProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  if (src && !imgError && isEmojiAvatar(src)) {
    return (
      <div className={cn('flex items-center justify-center bg-[#1A6B3C]/10 text-[#1A6B3C] flex-shrink-0 overflow-hidden select-none', className)}>
        <span className={cn('text-lg leading-none', textClassName)}>{src}</span>
      </div>
    );
  }

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={alt ?? name ?? 'User avatar'}
        onError={() => setImgError(true)}
        className={cn('object-cover flex-shrink-0', className)}
      />
    );
  }

  const fallback = name?.trim().slice(0, 1).toUpperCase() || '👤';

  return (
    <div className={cn('flex items-center justify-center bg-[#1A6B3C]/10 text-[#1A6B3C] font-bold flex-shrink-0 overflow-hidden', className)}>
      <span className={cn('text-sm leading-none select-none', textClassName)}>{fallback}</span>
    </div>
  );
}
