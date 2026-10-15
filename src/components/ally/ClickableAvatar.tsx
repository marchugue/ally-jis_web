// src/components/ally/ClickableAvatar.tsx
//
// The single avatar component for anywhere a *person* is shown. It renders
// the real avatar for allies / the owner and the deterministic anonymous
// avatar for everyone else, and clicking it always opens that person's
// visitor profile page (/profile/:userId) — which itself stays anonymous
// unless the viewer is an ally.

import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import { AnonymousAvatar } from '@/components/match/AnonymousAvatar';
import { getDeterministicAnonymousAvatar } from '@/lib/matchOptions';

export interface ClickableAvatarProps {
  /** Profile owner. When missing the avatar renders but is not clickable. */
  userId?: string | null;
  /** Real avatar (emoji / url). Only used when `revealed` is true. */
  avatarUrl?: string | null;
  /** Anonymous avatar key, used when not revealed. */
  avatarKey?: string | null;
  name?: string | null;
  /** True for allies and the viewer themself. */
  revealed?: boolean;
  /** Pixel size for the anonymous variant (and fallback sizing). */
  size?: number;
  /** Classes applied to the avatar itself (size / radius). */
  className?: string;
  /** Extra classes for the clickable wrapper. */
  wrapperClassName?: string;
  /** Turn off navigation (e.g. when already inside a link). */
  disabled?: boolean;
  onNavigate?: (userId: string) => void;
}

export function ClickableAvatar({
  userId,
  avatarUrl,
  avatarKey,
  name,
  revealed = false,
  size = 40,
  className,
  wrapperClassName,
  disabled = false,
  onNavigate,
}: ClickableAvatarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const clickable = Boolean(userId) && !disabled;
  const effectiveAvatarKey = avatarKey || getDeterministicAnonymousAvatar(userId);

  const handleClick = (e: MouseEvent) => {
    if (!clickable || !userId) return;
    e.stopPropagation();
    if (onNavigate) {
      onNavigate(userId);
      return;
    }
    navigate(userId === user?.id ? '/profile' : `/profile/${userId}`, {
      state: {
        avatarKey: effectiveAvatarKey,
        avatarUrl,
        name,
      },
    });
  };

  const avatar =
    revealed && avatarUrl ? (
      <AvatarDisplay
        src={avatarUrl}
        name={name}
        className={cn('rounded-full object-cover flex-shrink-0', className)}
      />
    ) : (
      <AnonymousAvatar
        avatarKey={effectiveAvatarKey}
        size={size}
        className={cn('rounded-full flex-shrink-0', className)}
      />
    );

  if (!clickable) return <div className={cn('flex-shrink-0', wrapperClassName)}>{avatar}</div>;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`View ${name || 'profile'}`}
      className={cn(
        'flex-shrink-0 rounded-full cursor-pointer transition-all hover:opacity-85 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A6B3C]/50',
        wrapperClassName
      )}
    >
      {avatar}
    </button>
  );
}

export default ClickableAvatar;
