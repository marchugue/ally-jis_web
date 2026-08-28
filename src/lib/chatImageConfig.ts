/**
 * Adjust chat image sizes here — used for message thumbnails and reply previews.
 */
export const CHAT_IMAGE_CONFIG = {
  /** Square thumbnail in message bubbles (px) */
  bubbleThumbnailSize: 200,
  /** Square thumbnail in reply quotes (px) */
  replyThumbnailSize: 44,
  /** Corner radius for thumbnails (px) */
  borderRadiusPx: 12,
} as const;

export function chatImageThumbnailStyle(sizePx: number) {
  return {
    width: sizePx,
    height: sizePx,
    borderRadius: CHAT_IMAGE_CONFIG.borderRadiusPx,
  } as const;
}
