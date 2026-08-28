export const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'] as const;

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
    buttonSize: 36,
    emojiSize: 22,
    gap: 4,
    paddingX: 8,
    paddingY: 10,
    maxWidth: 320,
  },

  desktop: {
    reactionsBar: {
      buttonSize: 28,
      emojiSize: 18,
      gap: 2,
      paddingX: 6,
      paddingY: 4,
      maxWidth: 280,
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
