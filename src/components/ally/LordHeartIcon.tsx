import React, { useEffect, useRef } from 'react';
import { defineElement, type LordIconElement } from '@lordicon/element';
import { cn } from '@/lib/utils';

// Ensure the lord-icon custom web component is registered once
if (typeof window !== 'undefined') {
  defineElement();
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lord-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        icon?: unknown;
        trigger?: string;
        state?: string;
        target?: string;
        colors?: string;
        stroke?: 'light' | 'regular' | 'bold' | string;
        speed?: string | number;
        loading?: string;
        'current-color'?: boolean | string;
      };
    }
  }
}

export interface LordHeartIconProps {
  isLiked: boolean;
  size?: number;
  className?: string;
  outlineSrc?: string;
  solidSrc?: string;
}

export const LordHeartIcon: React.FC<LordHeartIconProps> = ({
  isLiked,
  size = 18,
  className,
  outlineSrc = '/icons/lordicon/heart-outline.json',
  solidSrc = '/icons/lordicon/heart-solid.json',
}) => {
  const solidRef = useRef<LordIconElement>(null);
  const outlineRef = useRef<LordIconElement>(null);
  const isInitialMount = useRef(true);
  const wasLikedRef = useRef(isLiked);

  // Animate ONLY on transition from unliked -> liked (user click)
  // Default / initial state is static, and there is strictly NO hover animation.
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      wasLikedRef.current = isLiked;
      return;
    }

    if (!wasLikedRef.current && isLiked) {
      // Trigger burst/reveal animation when liked
      const playAnim = async () => {
        const el = solidRef.current;
        if (!el) return;
        try {
          if (el.ready) {
            await el.play({ state: 'in-reveal' });
          } else if (el.readyPromise) {
            await el.readyPromise;
            await el.play({ state: 'in-reveal' });
          }
        } catch {
          // Ignore if component unmounted or player interrupted
        }
      };

      // Slight tick so the solid icon element is rendered and ready in DOM
      const timer = setTimeout(playAnim, 20);
      return () => clearTimeout(timer);
    } else if (!isLiked) {
      // When unliked, reset solid icon so it can cleanly play next time
      try {
        if (solidRef.current) {
          solidRef.current.seek('start');
        }
      } catch {
        // Ignore
      }
    }

    wasLikedRef.current = isLiked;
  }, [isLiked]);

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center flex-shrink-0 select-none pointer-events-none',
        className
      )}
      style={{ width: `${size}px`, height: `${size}px` }}
      aria-hidden="true"
    >
      {/* ── Outline heart: static, visible when unliked, NO hover animation ── */}
      <div
        className={cn(
          'w-full h-full flex items-center justify-center transition-opacity duration-150',
          isLiked ? 'opacity-0 absolute inset-0 pointer-events-none' : 'opacity-100 relative'
        )}
      >
        <lord-icon
          ref={outlineRef}
          src={outlineSrc}
          stroke="regular"
          current-color="true"
          loading="lazy"
          style={{ width: `${size}px`, height: `${size}px`, display: 'block' }}
        />
      </div>

      {/* ── Solid heart: visible when liked, animates on like click, static default, NO hover animation ── */}
      <div
        className={cn(
          'w-full h-full flex items-center justify-center transition-opacity duration-150',
          isLiked ? 'opacity-100 relative' : 'opacity-0 absolute inset-0 pointer-events-none'
        )}
      >
        <lord-icon
          ref={solidRef}
          src={solidSrc}
          current-color="true"
          loading="lazy"
          style={{ width: `${size}px`, height: `${size}px`, display: 'block' }}
        />
      </div>
    </div>
  );
};

export default LordHeartIcon;
