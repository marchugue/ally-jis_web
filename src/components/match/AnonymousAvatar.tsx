// src/components/match/AnonymousAvatar.tsx

import { AVATAR_EMOJI, DEFAULT_AVATAR_EMOJI, avatarColorFor } from '@/lib/matchOptions';

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

  if (photoUrl) {
    const blurClass = photoBlur === 'heavy' ? 'blur-xl' : photoBlur === 'medium' ? 'blur-md' : '';
    return (
      <div
        className={`overflow-hidden rounded-full shrink-0 ${className}`}
        style={{ width: size, height: size, border: `2px solid ${bg}` }}
      >
        <img src={photoUrl} alt="" className={`w-full h-full object-cover ${blurClass}`} />
      </div>
    );
  }

  const emoji = (avatarKey && AVATAR_EMOJI[avatarKey]) || DEFAULT_AVATAR_EMOJI;
  return (
    <div
      className={`flex items-center justify-center rounded-full shrink-0 ${className}`}
      style={{ width: size, height: size, backgroundColor: `${bg}1A`, border: `2px solid ${bg}` }}
    >
      <span style={{ fontSize: size * 0.5, lineHeight: 1 }}>{emoji}</span>
    </div>
  );
}
