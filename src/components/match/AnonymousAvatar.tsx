// src/components/match/AnonymousAvatar.tsx

import { AVATAR_EMOJI, DEFAULT_AVATAR_EMOJI, avatarColorFor } from '@/lib/matchOptions';
import { cn } from '@/lib/utils';

interface AnonymousAvatarProps {
  avatarKey: string | null | undefined;
  size?: number;
  className?: string;
  /** Real profile photo — only ever passed once the reveal endpoint has
   * actually cleared it for the current stage (Stage 2+). Rendered blurred
   * until `photoBlur` is 'none' at Stage 4 — this is a client-side CSS
   * blur for the progressive-reveal effect the feature is built around,
   * not a security boundary; the actual gating (whether the URL is sent
   * at all) happens server-side per stage. */
  photoUrl?: string | null;
  photoBlur?: 'heavy' | 'medium' | 'none';
}

export function AnonymousAvatar({ avatarKey, size = 48, className = '', photoUrl, photoBlur = 'none' }: AnonymousAvatarProps) {
  const bg = avatarColorFor(avatarKey);
  const hasCustomSizeClass = /(^|\s)(w-|h-|size-)/.test(className);
  const dimensionStyle = hasCustomSizeClass ? undefined : { width: size, height: size };

  if (photoUrl) {
    const blurClass = photoBlur === 'heavy' ? 'blur-xl' : photoBlur === 'medium' ? 'blur-md' : '';
    return (
      <div
        className={cn('overflow-hidden rounded-full shrink-0', className)}
        style={{ ...dimensionStyle, border: `2px solid ${bg}` }}
      >
        <img src={photoUrl} alt="" className={`w-full h-full object-cover ${blurClass}`} />
      </div>
    );
  }

  const normalizedKey = avatarKey?.toLowerCase().trim();
  const emoji = (normalizedKey && AVATAR_EMOJI[normalizedKey]) || DEFAULT_AVATAR_EMOJI;
  return (
    <div
      className={cn('flex items-center justify-center rounded-full shrink-0 select-none', className)}
      style={{ ...dimensionStyle, backgroundColor: `${bg}1A`, border: `2px solid ${bg}` }}
    >
      <span
        className="leading-none select-none"
        style={{ fontSize: (size || 48) * 0.5, lineHeight: 1 }}
      >
        {emoji}
      </span>
    </div>
  );
}
