export const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'] as const;

const EMOJI_ONLY_REGEX = /^[\s\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D\u{1F3FB}-\u{1F3FF}]+$/u;
export function isOnlyEmoji(text?: string | null): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (!trimmed || /[a-zA-Z0-9]/.test(trimmed)) return false;
  return EMOJI_ONLY_REGEX.test(trimmed);
}

/**
 * Mobile long-press popup + shared reaction bar settings.
 */
export const MOBILE_MESSAGE_ACTION_CONFIG = {
  zIndex: {
    overlay: 50,
    popup: 60,
    emojiPicker: 70,
  },

  overlayOpacity: 0.25,

  /** Position popup above the pressed message bubble */
  anchor: {
    gapAbove: 10,
    gapBelow: 10,
    viewportPadding: 12,
    horizontalAlign: 'center' as 'center' | 'start' | 'end',
  },

  /** Quick-reaction pill row */
  reactionsBar: {
    buttonSize: 44,
    emojiSize: 32,
    gap: 4,
    paddingX: 10,
    paddingY: 8,
    maxWidth: 360,
  },

  desktop: {
    reactionsBar: {
      buttonSize: 38,
      emojiSize: 28,
      gap: 3,
      paddingX: 8,
      paddingY: 6,
      maxWidth: 340,
    },
  },
} as const;

export function computeAnchoredPopupPosition(
  anchorRect: DOMRect,
  popupWidth: number,
  popupHeight: number,
): { top: number; left: number } {
  const { gapAbove, gapBelow, viewportPadding, horizontalAlign } =
    MOBILE_MESSAGE_ACTION_CONFIG.anchor;

  let top = anchorRect.top - popupHeight - gapAbove;
  if (top < viewportPadding) {
    top = anchorRect.bottom + gapBelow;
  }

  let left: number;
  if (horizontalAlign === 'center') {
    left = anchorRect.left + anchorRect.width / 2 - popupWidth / 2;
  } else if (horizontalAlign === 'start') {
    left = anchorRect.left;
  } else {
    left = anchorRect.right - popupWidth;
  }

  left = Math.min(
    Math.max(left, viewportPadding),
    window.innerWidth - popupWidth - viewportPadding,
  );

  return { top, left };
}
