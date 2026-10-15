import { useState } from 'react';
import { avatarColorFor } from '@/lib/matchOptions';
import { getCrittersAvatarDataUri, getCrittersHttpUrl } from '@/lib/dicebearCritters';
import { cn } from '@/lib/utils';

interface AnonymousAvatarProps {
  avatarKey: string | null | undefined;
  size?: number;
  className?: string;
  photoUrl?: string | null;
  photoBlur?: 'heavy' | 'medium' | 'none';
  borderless?: boolean;
}

export function AnonymousAvatar({
  avatarKey,
  size = 48,
  className = '',
  photoUrl,
  photoBlur = 'none',
  borderless = false,
}: AnonymousAvatarProps) {
  const [loadError, setLoadError] = useState(false);
  const bg = avatarColorFor(avatarKey);
  const hasCustomSizeClass = /(^|\s)(w-|h-|size-)/.test(className);
  const dimensionStyle = hasCustomSizeClass ? undefined : { width: size, height: size };

  if (photoUrl) {
    const blurClass = photoBlur === 'heavy' ? 'blur-xl' : photoBlur === 'medium' ? 'blur-md' : '';
    return (
      <div
        className={cn('overflow-hidden rounded-full shrink-0', className)}
        style={{ ...dimensionStyle, border: borderless ? 'none' : `2px solid ${bg}` }}
      >
        <img src={photoUrl} alt="" className={`w-full h-full object-cover ${blurClass}`} />
      </div>
    );
  }

  const avatarSrc = loadError
    ? getCrittersHttpUrl(avatarKey, bg)
    : getCrittersAvatarDataUri(avatarKey, bg, size);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-full shrink-0 select-none flex items-center justify-center bg-black/5 dark:bg-white/5 transition-transform',
        className
      )}
      style={{
        ...dimensionStyle,
        border: borderless ? 'none' : `2px solid ${bg}`,
      }}
    >
      <img
        src={avatarSrc}
        alt={avatarKey || 'Anonymous Ally'}
        onError={() => setLoadError(true)}
        className="w-full h-full object-cover pointer-events-none select-none"
        draggable={false}
      />
    </div>
  );
}

