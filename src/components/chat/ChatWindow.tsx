import { useRef, useEffect, useLayoutEffect, useState, memo, useCallback, useMemo, Fragment } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Message } from '@/types/ally';
import { cn } from '@/lib/utils';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import { useLongPress } from '@/hooks/uselongpress';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileReactionPopup, DesktopHoverActions } from '@/components/chat/MessageActionMenu';
import { ReplyQuote } from '@/components/chat/ReplyQuote';
import { ChatImageThumbnail } from '@/components/chat/ChatImageThumbnail';
import { MessageImageViewer } from '@/components/chat/MessageImageViewer';
import { MessageReactions } from '@/components/chat/MessageReactions';
import { DeleteMessageModal, MessageDeleteMode } from '@/components/chat/DeleteMessageModal';
import { ReportModal } from '@/components/chat/ReportModal';
import { toast } from 'sonner';
import { getReplyBubbleLabel } from '@/lib/replyLabels';
import { ConversationWelcomeHeader } from './ConversationWelcomeHeader';
import { ChatSkeleton } from './ChatSkeleton';
import { dedupeMessages } from '@/hooks/useRealtimeMessages';

interface ChatWindowProps {
  messages: Message[];
  currentUserId: string;
  participantAvatar?: string | null;
  participantName?: string | null;
  participantCourse?: string | null;
  participantDepartment?: string | null;
  sharedInterests?: string[];
  partnerAvatar?: string | null;
  isAnonymous?: boolean;
  isLoading?: boolean;
  conversationId?: string | null;
  onRetry?: (message: Message) => void;
  onReact?: (message: Message, emoji: string) => void;
  onReply?: (message: Message) => void;
  onForward?: (message: Message) => void;
  onDelete?: (message: Message, mode?: MessageDeleteMode) => void;
  hasMore?: boolean;
  isLoadingOlder?: boolean;
  onLoadOlder?: () => void;
  streakNotice?: React.ReactNode;
  streakEndedAt?: Date | string | null;
}

export type MessageGroupPosition = 'single' | 'first' | 'middle' | 'last';

const EMOJI_ONLY_REGEX = /^[\s\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D\u{1F3FB}-\u{1F3FF}]+$/u;
function isOnlyEmoji(text?: string | null): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (!trimmed || /[a-zA-Z0-9]/.test(trimmed)) return false;
  return EMOJI_ONLY_REGEX.test(trimmed);
}

const GROUPING_MAX_GAP_MS = 5 * 60 * 1000;

function isConsecutiveWith(current: Message, adjacent: Message | null): boolean {
  if (!adjacent) return false;
  if (current.senderId !== adjacent.senderId) return false;
  if (current.isDeleted || adjacent.isDeleted) return false;
  if (current.status === 'failed' || adjacent.status === 'failed') return false;

  const timeA = new Date(current.createdAt || current.timestamp).getTime();
  const timeB = new Date(adjacent.createdAt || adjacent.timestamp).getTime();
  if (isNaN(timeA) || isNaN(timeB)) return true;
  return Math.abs(timeA - timeB) <= GROUPING_MAX_GAP_MS;
}

function getBubbleBorderRadii(isMe: boolean, groupPosition: MessageGroupPosition = 'single'): React.CSSProperties {
  const R_LARGE = '18px';
  const R_SMALL = '4px';

  if (isMe) {
    switch (groupPosition) {
      case 'first':
        return {
          borderTopLeftRadius: R_LARGE,
          borderTopRightRadius: R_LARGE,
          borderBottomRightRadius: R_SMALL,
          borderBottomLeftRadius: R_LARGE,
        };
      case 'middle':
        return {
          borderTopLeftRadius: R_LARGE,
          borderTopRightRadius: R_SMALL,
          borderBottomRightRadius: R_SMALL,
          borderBottomLeftRadius: R_LARGE,
        };
      case 'last':
        return {
          borderTopLeftRadius: R_LARGE,
          borderTopRightRadius: R_SMALL,
          borderBottomRightRadius: R_LARGE,
          borderBottomLeftRadius: R_LARGE,
        };
      case 'single':
      default:
        return {
          borderTopLeftRadius: R_LARGE,
          borderTopRightRadius: R_LARGE,
          borderBottomRightRadius: R_LARGE,
          borderBottomLeftRadius: R_LARGE,
        };
    }
  } else {
    switch (groupPosition) {
      case 'first':
        return {
          borderTopLeftRadius: R_LARGE,
          borderTopRightRadius: R_LARGE,
          borderBottomRightRadius: R_LARGE,
          borderBottomLeftRadius: R_SMALL,
        };
      case 'middle':
        return {
          borderTopLeftRadius: R_SMALL,
          borderTopRightRadius: R_LARGE,
          borderBottomRightRadius: R_LARGE,
          borderBottomLeftRadius: R_SMALL,
        };
      case 'last':
        return {
          borderTopLeftRadius: R_SMALL,
          borderTopRightRadius: R_LARGE,
          borderBottomRightRadius: R_LARGE,
          borderBottomLeftRadius: R_LARGE,
        };
      case 'single':
      default:
        return {
          borderTopLeftRadius: R_LARGE,
          borderTopRightRadius: R_LARGE,
          borderBottomRightRadius: R_LARGE,
          borderBottomLeftRadius: R_LARGE,
        };
    }
  }
}

function getItemMarginClass(groupPosition: MessageGroupPosition = 'single'): string {
  switch (groupPosition) {
    case 'first':
      return 'mt-2 mb-0.5';
    case 'middle':
      return 'my-0.5';
    case 'last':
      return 'mt-0.5 mb-2';
    case 'single':
    default:
      return 'my-1.5';
  }
}

interface MessageBubbleProps {
  msg: Message;
  isMe: boolean;
  currentUserId: string;
  showAvatar?: boolean;
  groupPosition?: MessageGroupPosition;
  participantAvatar?: string | null;
  participantName?: string | null;
  isActiveTime?: boolean;
  onToggleTime?: () => void;
  onRetry?: (message: Message) => void;
  onReact?: (message: Message, emoji: string) => void;
  onReply?: (message: Message) => void;
  onForward?: (message: Message) => void;
  onDelete?: (message: Message, mode?: MessageDeleteMode) => void;
  onReport?: (message: Message) => void;
}

function formatMessageTime(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';

  const now = new Date();

  // If year has passed (different year) -> display month and year, e.g. "Sep 2025"
  if (d.getFullYear() !== now.getFullYear()) {
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  // Check if same calendar day
  const isSameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isSameDay) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Days have passed (within current year) -> display date and month, e.g. "19 Sep"
  const day = d.getDate();
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  return `${day} ${month}`;
}

const MessageBubble = memo(function MessageBubble({
  msg,
  isMe,
  currentUserId,
  showAvatar,
  groupPosition = 'single',
  participantAvatar,
  participantName,
  isActiveTime = false,
  onToggleTime,
  onRetry,
  onReact,
  onReply,
  onForward,
  onDelete,
  onReport,
}: MessageBubbleProps) {
  // ─── ALL hooks must be at the top — no early returns before this point ───
  const isSending = msg.status === 'sending';
  const isFailed = msg.status === 'failed';
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [viewingImage, setViewingImage] = useState(false);
  const [viewingImageIndex, setViewingImageIndex] = useState(0);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Parse images (supports single URL, JSON array string, camelCase, snake_case)
  const images = useMemo<string[]>(() => {
    const raw = msg.imageUrl || (msg as any).image_url;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(Boolean);
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed.filter(Boolean);
        } catch {}
      }
      return [trimmed];
    }
    return [];
  }, [msg.imageUrl, (msg as any).image_url]);

  const hasMedia = images.length > 0;
  const primaryMedia = images[0] || '';
  const isVideoUrl = Boolean(primaryMedia && /\.(mp4|webm|mov|quicktime)([?#]|$)/i.test(primaryMedia));
  const isImageOnly = Boolean(hasMedia && !msg.content?.trim());
  const isEmojiOnly = Boolean(!hasMedia && msg.content && isOnlyEmoji(msg.content));
  const isMobile = useIsMobile();

  const openActionMenu = useCallback(() => {
    if (bubbleRef.current) {
      setAnchorRect(bubbleRef.current.getBoundingClientRect());
    }
    setActionMenuOpen(true);
  }, []);

  const handleLongPress = useCallback(() => {
    openActionMenu();
  }, [openActionMenu]);

  const longPress = useLongPress({ onLongPress: handleLongPress });
  const closePopup = useCallback(() => setActionMenuOpen(false), []);
  const handleCopy = useCallback(async () => {
    if (!msg.content) return;
    try {
      await navigator.clipboard.writeText(msg.content);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  }, [msg.content]);

  const handleForward = useCallback(async () => {
    const shareText = msg.content || primaryMedia;
    if (typeof navigator !== 'undefined' && navigator.share && shareText) {
      try {
        await navigator.share({ text: shareText });
        return;
      } catch {
        // Fallback to internal forward modal
      }
    }
    onForward?.(msg);
  }, [msg, primaryMedia, onForward]);

  // ─────────────────────────────────────────────────────────────────────────

  // Hidden for current user — render nothing, but only AFTER all hooks.
  if (msg.deletedForMe) {
    return null;
  }

  // Deleted for everyone — render tombstone placeholder.
  const isMsgDeleted = Boolean(msg.isDeleted || (msg as any).is_deleted);
  if (isMsgDeleted) {
    return (
      <div
        className={cn(
          'flex items-end gap-2 my-1',
          isMe ? 'flex-row-reverse' : 'flex-row',
        )}
      >
        {!isMe && (
          <div className="w-8 h-8 flex-shrink-0">
            {showAvatar ? (
              <AvatarDisplay
                src={participantAvatar}
                name={participantName}
                className="w-8 h-8 rounded-full overflow-hidden opacity-50"
                textClassName="text-[10px]"
              />
            ) : (
              <div className="w-8 h-8" />
            )}
          </div>
        )}
        <div
          className={cn(
            'px-4 py-2 rounded-2xl text-xs font-jakarta italic border border-dashed select-none',
            isMe
              ? 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-400 dark:text-gray-500 rounded-br-none'
              : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-400 dark:text-gray-500 rounded-bl-none',
          )}
        >
          This message was deleted
        </div>
      </div>
    );
  }

  const mobileLongPressHandlers = isMobile
    ? {
        onTouchStart: longPress.onTouchStart,
        onTouchMove: longPress.onTouchMove,
        onTouchEnd: longPress.onTouchEnd,
        onTouchCancel: longPress.onTouchCancel,
        onContextMenu: (e: React.MouseEvent) => {
          e.preventDefault();
          openActionMenu();
        },
      }
    : {};

  const handleReact = (emoji: string) => {
    onReact?.(msg, emoji);
    closePopup();
  };

  const replyLabel =
    msg.replyTo && participantName
      ? getReplyBubbleLabel(
          currentUserId,
          msg.senderId,
          msg.replyTo.senderId,
          participantName,
        )
      : null;

  const bubbleContent = (
    <div className="flex flex-col relative" style={{ maxWidth: '100%' }}>
      {/* Desktop hover: small flat card with only the time */}
      {!isSending && !isFailed && (
        <div
          className={cn(
            'hidden md:block absolute opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-20 whitespace-nowrap',
            'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-[11px] font-medium px-2 py-0.5 rounded-md shadow-sm border border-gray-200 dark:border-gray-700',
            isMe ? 'right-0 -top-6' : 'left-0 -top-6',
          )}
        >
          {formatMessageTime(msg.createdAt || msg.timestamp)}
        </div>
      )}

      <div
        ref={bubbleRef}
        {...mobileLongPressHandlers}
        onClick={() => {
          if (!isImageOnly && !isEmojiOnly) {
            onToggleTime?.();
          }
        }}
        style={isImageOnly || isEmojiOnly ? undefined : getBubbleBorderRadii(isMe, groupPosition)}
        className={cn(
          'max-w-full text-sm font-jakarta transition-opacity select-none',
          isImageOnly || isEmojiOnly
            ? 'p-0 bg-transparent dark:bg-transparent shadow-none border-none'
            : cn(
                'px-4 py-2 cursor-pointer',
                isMe
                  ? 'bg-[#1A6B3C] dark:bg-emerald-600 text-white'
                  : 'bg-gray-100 dark:bg-[#1E293B] text-gray-800 dark:text-gray-100',
              ),
          isSending && 'opacity-60',
          isFailed && 'opacity-80 ring-1 ring-red-400',
        )}
      >
        {msg.replyTo && replyLabel && (
          <ReplyQuote
            variant={isMe ? 'bubble-me' : 'bubble-them'}
            label={replyLabel}
            content={msg.replyTo.content}
            imageUrl={msg.replyTo.imageUrl}
          />
        )}
        {/* Single Media or Stacked Cards UI */}
        {hasMedia && images.length === 1 && (
          isVideoUrl ? (
            <div className={cn('rounded-xl overflow-hidden', !isImageOnly && 'mb-2')}>
              <video
                src={primaryMedia}
                controls
                playsInline
                className="max-w-[260px] max-h-[200px] rounded-xl object-cover"
              />
            </div>
          ) : (
            <ChatImageThumbnail
              src={primaryMedia}
              onClick={() => {
                if (longPress.didLongPress()) return;
                setViewingImageIndex(0);
                setViewingImage(true);
              }}
              className={cn(!isImageOnly && 'mb-2')}
            />
          )
        )}

        {hasMedia && images.length > 1 && (
          <div
            onClick={() => {
              if (longPress.didLongPress()) return;
              setViewingImageIndex(0);
              setViewingImage(true);
            }}
            className="relative w-[216px] h-[170px] my-1 cursor-pointer select-none group flex items-center justify-center"
          >
            {/* Card 2 (Bottom card, peeking to the right) */}
            {images.length >= 3 && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (longPress.didLongPress()) return;
                  setViewingImageIndex(2);
                  setViewingImage(true);
                }}
                className="absolute w-[196px] h-[150px] rounded-xl overflow-hidden border border-white/30 shadow-md bg-gray-200 dark:bg-gray-800 transition-transform duration-200 group-hover:rotate-[7deg] group-hover:translate-x-3 cursor-pointer"
                style={{
                  transform: 'rotate(5deg) translate(8px, -4px) scale(0.94)',
                  zIndex: 1,
                }}
              >
                <img
                  src={images[2]}
                  alt=""
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
            )}

            {/* Card 1 (Middle card, peeking to the left) */}
            {images.length >= 2 && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (longPress.didLongPress()) return;
                  setViewingImageIndex(1);
                  setViewingImage(true);
                }}
                className="absolute w-[196px] h-[150px] rounded-xl overflow-hidden border border-white/40 shadow-md bg-gray-100 dark:bg-gray-700 transition-transform duration-200 group-hover:-rotate-[6deg] group-hover:-translate-x-3 cursor-pointer"
                style={{
                  transform: 'rotate(-4.5deg) translate(-8px, -2px) scale(0.97)',
                  zIndex: 2,
                }}
              >
                <img
                  src={images[1]}
                  alt=""
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
            )}

            {/* Card 0 (Top / Upper card) */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (longPress.didLongPress()) return;
                setViewingImageIndex(0);
                setViewingImage(true);
              }}
              className="relative w-[196px] h-[150px] rounded-xl overflow-hidden border border-white/50 shadow-lg bg-white dark:bg-gray-900 transition-transform duration-200 group-hover:scale-[1.02] cursor-pointer"
              style={{ zIndex: 10 }}
            >
              <img
                src={images[0]}
                alt=""
                className="w-full h-full object-cover"
                draggable={false}
              />
              {/* Badge showing photo count */}
              <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                <span>{images.length} photos</span>
              </div>
            </div>
          </div>
        )}
        {msg.content && (
          <p
            className={cn(
              isImageOnly ? 'hidden' : undefined,
              isEmojiOnly ? 'text-4xl sm:text-5xl leading-tight py-1 my-0.5' : undefined
            )}
          >
            {msg.content}
          </p>
        )}

        {/* On phone/click: expands to show the time at the bottom of the message; on sending: shows sending status */}
        {(isActiveTime || isSending) && (
          <span
            className={cn(
              'text-[10px] flex items-center gap-1 mt-1',
              isMe ? 'text-white/60' : 'text-gray-400',
              isImageOnly && 'px-2 py-0.5 rounded-md bg-black/60 text-white/90 self-end backdrop-blur-sm shadow',
            )}
          >
            {isSending && <Clock size={10} className="animate-pulse" />}
            {isSending
              ? 'Sending…'
              : formatMessageTime(msg.createdAt || msg.timestamp)}
          </span>
        )}
      </div>

      {msg.reactions && msg.reactions.length > 0 && (
        <MessageReactions
          reactions={msg.reactions}
          currentUserId={currentUserId}
          isMe={isMe}
          onToggle={(emoji) => onReact?.(msg, emoji)}
        />
      )}

      {isFailed && (
        <button
          onClick={() => onRetry?.(msg)}
          className={cn(
            'flex items-center gap-1 text-[11px] text-red-500 mt-1 hover:underline',
            isMe ? 'self-end' : 'self-start',
          )}
        >
          <AlertCircle size={11} />
          Failed to send · Tap to retry
        </button>
      )}
    </div>
  );

  const hoverActions = (
    <DesktopHoverActions
      side={isMe ? 'right' : 'left'}
      isMe={isMe}
      hasContent={Boolean(msg.content?.trim())}
      onQuickReact={(emoji) => onReact?.(msg, emoji)}
      onReply={() => onReply?.(msg)}
      onForward={handleForward}
      onCopy={handleCopy}
      onDeleteForMe={() => onDelete?.(msg, 'delete_for_me')}
      onDeleteForEveryone={() => onDelete?.(msg, 'delete_for_everyone')}
      onReport={() => onReport?.(msg)}
    />
  );

  const itemMarginClass = getItemMarginClass(groupPosition);

  const showSenderName = (groupPosition === 'first' || groupPosition === 'single') && !isMsgDeleted;
  const senderDisplayName = isMe ? 'Me' : (participantName || 'User');

  return (
    <div
      className={cn(
        'group flex items-end gap-2 transition-[margin] duration-150 ease-out',
        itemMarginClass,
        msg.reactions && msg.reactions.length > 0 && 'mb-5',
        isMe ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      {!isMe && (
        <div className="w-8 h-8 flex-shrink-0">
          {showAvatar ? (
            <AvatarDisplay
              src={participantAvatar}
              name={participantName}
              className="w-8 h-8 rounded-full overflow-hidden"
              textClassName="text-[10px]"
            />
          ) : (
            <div className="w-8 h-8" />
          )}
        </div>
      )}

      <div className="flex flex-col" style={{ maxWidth: '75%' }}>
        {showSenderName && (
          <span
            className={cn(
              'text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-1 px-1 select-none',
              isMe ? 'text-right self-end' : 'text-left self-start',
            )}
          >
            {senderDisplayName}
          </span>
        )}
        <div className="flex items-center gap-1.5">
          {isMe ? (
            <>
              {hoverActions}
              {bubbleContent}
            </>
          ) : (
            <>
              {bubbleContent}
              {hoverActions}
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {actionMenuOpen && (
          <MobileReactionPopup
            open
            msg={msg}
            isMe={isMe}
            anchorRect={anchorRect}
            onClose={closePopup}
            onReact={handleReact}
            onReply={() => {
              onReply?.(msg);
              closePopup();
            }}
            onForward={() => {
              handleForward();
              closePopup();
            }}
            onCopy={() => {
              handleCopy();
              closePopup();
            }}
            onDeleteForMe={() => {
              onDelete?.(msg, 'delete_for_me');
              closePopup();
            }}
            onDeleteForEveryone={() => {
              onDelete?.(msg, 'delete_for_everyone');
              closePopup();
            }}
            onReport={() => {
              onReport?.(msg);
              closePopup();
            }}
          />
        )}
        {viewingImage && hasMedia && (
          <MessageImageViewer
            message={msg}
            initialIndex={viewingImageIndex}
            onClose={() => setViewingImage(false)}
            onReply={onReply}
            onForward={onForward}
          />
        )}
      </AnimatePresence>
    </div>
  );
});

interface WebStreakNoticeAnchor {
  messageId: string;
  timestamp: number;
}
const webStreakNoticeAnchorMap = new Map<string, WebStreakNoticeAnchor>();

export function ChatWindow({
  messages,
  currentUserId,
  participantAvatar,
  participantName,
  participantCourse,
  participantDepartment,
  sharedInterests,
  partnerAvatar,
  isAnonymous,
  isLoading = false,
  conversationId,
  onRetry,
  onReact,
  onReply,
  onForward,
  onDelete,
  hasMore = false,
  isLoadingOlder = false,
  onLoadOlder,
  streakNotice,
  streakEndedAt,
}: ChatWindowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const prevScrollTopRef = useRef<number>(0);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [reportingMessage, setReportingMessage] = useState<Message | null>(null);
  const [activeTimeMessageId, setActiveTimeMessageId] = useState<string | null>(null);

  const prevConvIdRef = useRef<string | null | undefined>(conversationId);
  const prevMsgCountRef = useRef<number>(0);

  // Defensive deduplication to guarantee unique React keys, eliminate duplicate bubbles,
  // and exclude messages hidden for the current user (deleted for me)
  const uniqueMessages = useMemo(() => {
    return dedupeMessages(messages).filter((m) => !m.deletedForMe);
  }, [messages]);

  // Determine chronological insertion point for the streak notice based on when streak ended
  const streakNoticeIndex = useMemo(() => {
    if (!streakNotice) {
      if (conversationId && webStreakNoticeAnchorMap.has(conversationId)) {
        webStreakNoticeAnchorMap.delete(conversationId);
        try {
          sessionStorage.removeItem(`streak_anchor_${conversationId}`);
        } catch {}
      }
      return -1;
    }

    if (streakEndedAt) {
      const endedTime = new Date(streakEndedAt).getTime();
      if (!isNaN(endedTime)) {
        const idx = uniqueMessages.findIndex((m) => {
          const msgTime = new Date(m.createdAt || m.timestamp).getTime();
          return !isNaN(msgTime) && msgTime > endedTime;
        });
        return idx !== -1 ? idx : uniqueMessages.length;
      }
    }

    // Fallback if streakEndedAt is not available: anchor to specific message
    let anchor = conversationId ? webStreakNoticeAnchorMap.get(conversationId) : null;
    if (!anchor && conversationId && typeof sessionStorage !== 'undefined') {
      try {
        const raw = sessionStorage.getItem(`streak_anchor_${conversationId}`);
        if (raw) {
          anchor = JSON.parse(raw);
          if (anchor) webStreakNoticeAnchorMap.set(conversationId, anchor);
        }
      } catch {}
    }

    if (anchor) {
      if (anchor.messageId === '__START__') {
        return 0;
      }
      const anchorIdx = uniqueMessages.findIndex((m) => m.id === anchor!.messageId);
      if (anchorIdx !== -1) {
        return anchorIdx + 1;
      }
      // If message ID not found (e.g. deleted), fallback to timestamp
      if (anchor.timestamp) {
        const timeIdx = uniqueMessages.findIndex((m) => {
          const msgTime = new Date(m.createdAt || m.timestamp).getTime();
          return !isNaN(msgTime) && msgTime > anchor!.timestamp;
        });
        if (timeIdx !== -1) return timeIdx;
      }
      return 0;
    }

    // First time seeing notice in this conversation: anchor to current last message
    if (uniqueMessages.length > 0) {
      const lastMsg = uniqueMessages[uniqueMessages.length - 1];
      const newAnchor: WebStreakNoticeAnchor = {
        messageId: lastMsg.id,
        timestamp: new Date(lastMsg.createdAt || lastMsg.timestamp).getTime() || Date.now(),
      };
      if (conversationId) {
        webStreakNoticeAnchorMap.set(conversationId, newAnchor);
        try {
          sessionStorage.setItem(`streak_anchor_${conversationId}`, JSON.stringify(newAnchor));
        } catch {}
      }
      return uniqueMessages.length;
    }

    return 0;
  }, [streakNotice, streakEndedAt, uniqueMessages, conversationId]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    } else if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, []);

  // When user scrolls near top (scrollTop <= 60), trigger loading older messages
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el || !hasMore || isLoadingOlder) return;
    if (el.scrollTop <= 60) {
      prevScrollHeightRef.current = el.scrollHeight;
      prevScrollTopRef.current = el.scrollTop;
      onLoadOlder?.();
    }
  }, [hasMore, isLoadingOlder, onLoadOlder]);

  // Adjust scroll position after older messages are prepended to prevent scroll jumping
  useLayoutEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || isLoadingOlder || prevScrollHeightRef.current === 0) return;
    const heightDiff = el.scrollHeight - prevScrollHeightRef.current;
    if (heightDiff > 0) {
      el.scrollTop = prevScrollTopRef.current + heightDiff;
    }
    prevScrollHeightRef.current = 0;
    prevScrollTopRef.current = 0;
  }, [isLoadingOlder, uniqueMessages.length]);

  // When switching conversation or when messages first finish loading, instantly jump to bottom
  useLayoutEffect(() => {
    if (isLoading) return;

    const convChanged = prevConvIdRef.current !== conversationId;
    prevConvIdRef.current = conversationId;

    if (convChanged || prevMsgCountRef.current === 0) {
      // Instant snap to bottom so the user immediately sees the latest messages
      scrollToBottom('auto');
      requestAnimationFrame(() => scrollToBottom('auto'));
    } else if (uniqueMessages.length > prevMsgCountRef.current && !isLoadingOlder) {
      // New message sent or received -> smooth scroll to bottom
      scrollToBottom('smooth');
    }

    prevMsgCountRef.current = uniqueMessages.length;
  }, [conversationId, isLoading, uniqueMessages.length, isLoadingOlder, scrollToBottom]);

  const handleConfirmDelete = (msg: Message, mode: MessageDeleteMode) => {
    setMessageToDelete(null);
    onDelete?.(msg, mode);
  };

  if (isLoading && uniqueMessages.length === 0) {
    return <ChatSkeleton />;
  }

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className={cn(
        'flex-1 overflow-y-auto px-3 md:px-6 py-4 pb-6 h-full min-h-0 custom-scrollbar flex flex-col relative z-10',
        uniqueMessages.length === 0 && 'justify-center'
      )}
    >
      {/* Top spinner when fetching older messages */}
      {isLoadingOlder && (
        <div className="flex items-center justify-center py-3 text-[#1A6B3C] dark:text-emerald-400 gap-2 select-none">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-xs font-jakarta text-gray-400 dark:text-gray-500 font-medium">
            Loading older messages…
          </span>
        </div>
      )}

      {/* Centered conversation welcome header at the top (shown only at the beginning of chat) */}
      {!hasMore && (
        <ConversationWelcomeHeader
          participantName={participantName ?? 'User'}
          participantAvatar={participantAvatar}
          participantCourse={participantCourse}
          participantDepartment={participantDepartment}
          sharedInterests={sharedInterests}
          partnerAvatar={partnerAvatar}
          isAnonymous={isAnonymous}
          className={uniqueMessages.length === 0 ? 'my-auto' : 'mb-4'}
        />
      )}

      {uniqueMessages.map((msg, idx) => {
        const isMe = msg.senderId === currentUserId;
        const prev = idx > 0 ? uniqueMessages[idx - 1] : null;
        const next = idx < uniqueMessages.length - 1 ? uniqueMessages[idx + 1] : null;

        const hasPrev = idx === streakNoticeIndex ? false : isConsecutiveWith(msg, prev);
        const hasNext = (idx + 1) === streakNoticeIndex ? false : isConsecutiveWith(msg, next);

        let groupPosition: MessageGroupPosition = 'single';
        if (!hasPrev && hasNext) {
          groupPosition = 'first';
        } else if (hasPrev && hasNext) {
          groupPosition = 'middle';
        } else if (hasPrev && !hasNext) {
          groupPosition = 'last';
        }

        const showAvatar =
          !isMe && (idx === 0 || uniqueMessages[idx - 1].senderId !== msg.senderId);

        return (
          <Fragment key={msg.id}>
            {idx === streakNoticeIndex && streakNotice}
            <MessageBubble
              key={msg.id}
              msg={msg}
              isMe={isMe}
              currentUserId={currentUserId}
              showAvatar={showAvatar}
              groupPosition={groupPosition}
              participantAvatar={participantAvatar}
              participantName={participantName}
              isActiveTime={activeTimeMessageId === msg.id}
              onToggleTime={() => setActiveTimeMessageId((prev) => (prev === msg.id ? null : msg.id))}
              onRetry={onRetry}
              onReact={onReact}
              onReply={onReply}
              onForward={onForward}
              onDelete={(targetMsg, mode) => {
                if (mode) {
                  handleConfirmDelete(targetMsg, mode);
                } else {
                  setMessageToDelete(targetMsg);
                }
              }}
              onReport={(targetMsg) => setReportingMessage(targetMsg)}
            />
          </Fragment>
        );
      })}

      {streakNoticeIndex === uniqueMessages.length && streakNotice}

      {/* Sentinel for auto-scrolling straight to bottom */}
      <div ref={messagesEndRef} className="h-px w-full pointer-events-none flex-shrink-0" />

      {/* Individual Message Delete Modal */}
      {messageToDelete && (
        <DeleteMessageModal
          message={messageToDelete}
          isMe={messageToDelete.senderId === currentUserId}
          onClose={() => setMessageToDelete(null)}
          onConfirmDelete={handleConfirmDelete}
        />
      )}

      {/* Report Modal from shortcut action */}
      {reportingMessage && (
        <ReportModal
          participantName={participantName || 'User'}
          participantId={reportingMessage.senderId}
          conversationId={conversationId || undefined}
          onClose={() => setReportingMessage(null)}
        />
      )}
    </div>
  );
}
