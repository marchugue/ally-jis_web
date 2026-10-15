import React, { useEffect, useRef } from 'react';
import { defineElement, type LordIconElement } from '@lordicon/element';
import { cn } from '@/lib/utils';

// Initialize lord-icon web component once in the browser
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

export interface LordNavIconProps {
  outlineSrc: string;
  solidSrc: string;
  isActive: boolean;
  isHovered?: boolean;
  stroke?: 'light' | 'regular' | 'bold';
  size?: number;
  activeState?: string;
  hoverState?: string;
  className?: string;
}

export const LordNavIcon: React.FC<LordNavIconProps> = ({
  outlineSrc,
  solidSrc,
  isActive,
  isHovered = false,
  stroke = 'regular',
  size = 26,
  activeState = 'in-reveal',
  hoverState = 'hover-pinch',
  className,
}) => {
  const solidRef = useRef<LordIconElement>(null);
  const outlineRef = useRef<LordIconElement>(null);
  const wasActiveRef = useRef(isActive);
  const wasHoveredRef = useRef(isHovered);

  const isSolid = isActive || isHovered;

  // Trigger click / navigation entrance animation when active becomes true
  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => {
        try {
          if (solidRef.current) {
            solidRef.current.play({ state: activeState });
          }
        } catch {
          // ignore if player is still mounting
        }
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [isActive, activeState]);

  // Trigger hover animation on the solid icon when hovered
  useEffect(() => {
    if (isHovered && !wasHoveredRef.current) {
      try {
        if (solidRef.current) {
          solidRef.current.play({ state: hoverState });
        }
      } catch {
        // ignore
      }
    } else if (!isHovered && !isActive) {
      try {
        if (outlineRef.current) {
          outlineRef.current.seek('start');
        }
      } catch {
        // ignore
      }
    }
    wasHoveredRef.current = isHovered;
  }, [isHovered, isActive, hoverState]);

  useEffect(() => {
    wasActiveRef.current = isActive;
  }, [isActive]);

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center flex-shrink-0 transition-transform duration-200 pointer-events-none select-none',
        className
      )}
      style={{ width: `${size}px`, height: `${size}px` }}
      aria-hidden="true"
    >
      {/* ── Outline icon: shown when NOT active and NOT hovered (static, slightly thick stroke) ── */}
      <div
        className={cn(
          'w-full h-full flex items-center justify-center transition-opacity duration-150',
          isSolid ? 'opacity-0 absolute inset-0 pointer-events-none' : 'opacity-100 relative'
        )}
      >
        <lord-icon
          ref={outlineRef}
          src={outlineSrc}
          stroke={stroke}
          current-color="true"
          loading="lazy"
          style={{ width: `${size}px`, height: `${size}px`, display: 'block' }}
        />
      </div>

      {/* ── Solid icon: shown when active OR hovered (supports in-reveal and hover-pinch) ── */}
      <div
        className={cn(
          'w-full h-full flex items-center justify-center transition-opacity duration-150',
          isSolid ? 'opacity-100 relative' : 'opacity-0 absolute inset-0 pointer-events-none'
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

export default LordNavIcon;
