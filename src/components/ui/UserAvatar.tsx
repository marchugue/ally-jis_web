// src/components/ui/UserAvatar.tsx
//
// Unified avatar component that handles:
//  - HTTP/HTTPS image URLs   → <img> with object-cover
//  - Data URLs               → <img> with object-cover
//  - Emoji strings           → centered text (backward compat with old profiles)
//  - null / empty string     → default person icon fallback

import { useState } from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  /** The avatar value — an R2/HTTP URL, data URL, emoji string, or null/undefined */
  avatar: string | null | undefined;
  /** Size in pixels. Controls both width/height. Defaults to 40. */
  size?: number;
  /** Extra Tailwind / className overrides */
  className?: string;
  /** Alt text for the <img> element */
  alt?: string;
}

function isImageUrl(value: string): boolean {
  return (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('data:image') ||
    value.startsWith('blob:')
  );
}

export function UserAvatar({ avatar, size = 40, className, alt = 'User avatar' }: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const sizeStyle = { width: size, height: size, minWidth: size, minHeight: size };
  const baseClass = cn('rounded-full overflow-hidden flex items-center justify-center flex-shrink-0', className);

  if (avatar && isImageUrl(avatar) && !imgError) {
    return (
      <div className={baseClass} style={sizeStyle}>
        <img
          src={avatar}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  if (avatar && !isImageUrl(avatar) && avatar.trim().length > 0 && !imgError) {
    // Emoji or short text avatar
    const fontSize = Math.round(size * 0.55);
    return (
      <div
        className={cn(baseClass, 'bg-[#1A6B3C]/8')}
        style={{ ...sizeStyle, fontSize }}
      >
        <span style={{ lineHeight: 1 }}>{avatar}</span>
      </div>
    );
  }

  // Fallback icon
  const iconSize = Math.round(size * 0.45);
  return (
    <div className={cn(baseClass, 'bg-[#1A6B3C]/8')} style={sizeStyle}>
      <User size={iconSize} className="text-[#1A6B3C]/50" />
    </div>
  );
}

export default UserAvatar;
