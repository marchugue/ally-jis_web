import { useRef, useEffect, useLayoutEffect, useState, memo, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Clock, AlertCircle } from 'lucide-react';
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
}

export type MessageGroupPosition = 'single' | 'first' | 'middle' | 'last';

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

interface MessageBubbleProps {
  msg: Message;
  isMe: boolean;
  currentUserId: string;
  showAvatar: boolean;
  groupPosition?: MessageGroupPosition;
  participantAvatar?: string | null;
  participantName?: string | null;
  onRetry?: (message: Message) => void;
  onReact?: (message: Message, emoji: string) => void;
  onReply?: (message: Message) => void;
  onForward?: (message: Message) => void;
  onDelete?: (message: Message) => void;
}

const MessageBubble = memo(function MessageBubble({
  msg,
  isMe,
  currentUserId,
  showAvatar,
  groupPosition = 'single',
  participantAvatar,
  participantName,
  onRetry,
  onReact,
  onReply,
  onForward,
  onDelete,
}: MessageBubbleProps) {
  // ─── ALL hooks must be at the top — no early returns before this point ───
  const isSending = msg.status === 'sending';
  const isFailed = msg.status === 'failed';
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [viewingImage, setViewingImage] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const isVideoUrl = Boolean(msg.imageUrl && /\.(mp4|webm|mov|quicktime)([?#]|$)/i.test(msg.imageUrl));
  const isImageOnly = Boolean(msg.imageUrl && !msg.content?.trim());
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
  // ─────────────────────────────────────────────────────────────────────────

  // Hidden for current user — render nothing, but only AFTER hooks.
  if (msg.deletedForMe) {
    return null;
  }

  // Deleted for everyone — render tombstone placeholder.
  if (msg.isDeleted) {
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
          {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      )}

      <div
        ref={bubbleRef}
        {...mobileLongPressHandlers}
        onClick={() => setShowTime((prev) => !prev)}
        style={getBubbleBorderRadii(isMe, groupPosition)}
        className={cn(
          'max-w-full text-sm font-jakarta transition-opacity select-none cursor-pointer',
          isImageOnly ? 'p-1' : 'px-4 py-2',
          isMe
            ? 'bg-[#1A6B3C] dark:bg-emerald-600 text-white'
            : 'bg-gray-100 dark:bg-[#1E293B] text-gray-800 dark:text-gray-100',
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
        {msg.imageUrl && (
          isVideoUrl ? (
            <div className={cn('rounded-xl overflow-hidden', !isImageOnly && 'mb-2')}>
              <video
                src={msg.imageUrl}
                controls
                playsInline
                className="max-w-[260px] max-h-[200px] rounded-xl object-cover"
              />
            </div>
          ) : (
            <ChatImageThumbnail
              src={msg.imageUrl}
              onClick={() => {
                if (longPress.didLongPress()) return;
                setViewingImage(true);
              }}
              className={cn(!isImageOnly && 'mb-2')}
            />
          )
        )}
        {msg.content && <p className={cn(isImageOnly ? 'hidden' : undefined)}>{msg.content}</p>}

        {/* On phone/click: expands to show the time at the bottom of the message; on sending: shows sending status */}
        {(showTime || isSending) && (
          <span
            className={cn(
              'text-[10px] flex items-center gap-1 mt-1',
              isMe ? 'text-white/60' : 'text-gray-400',
              isImageOnly && 'px-2 pb-1',
            )}
          >
            {isSending && <Clock size={10} className="animate-pulse" />}
            {isSending
              ? 'Sending…'
              : new Date(msg.createdAt || msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
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
      onQuickReact={(emoji) => onReact?.(msg, emoji)}
      onReply={() => onReply?.(msg)}
      onForward={() => onForward?.(msg)}
      onDelete={() => onDelete?.(msg)}
    />
  );

  const itemMarginClass = useMemo(() => {
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
  }, [groupPosition]);

  const showSenderName = (groupPosition === 'first' || groupPosition === 'single') && !msg.isDeleted;
  const senderDisplayName = isMe ? 'Me' : (participantName || 'User');

  return (
    <div
      className={cn(
        'group flex items-end gap-2',
        itemMarginClass,
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
            anchorRect={anchorRect}
            onClose={closePopup}
            onReact={handleReact}
            onReply={() => {
              onReply?.(msg);
              closePopup();
            }}
            onForward={() => {
              onForward?.(msg);
              closePopup();
            }}
            onDelete={() => {
              onDelete?.(msg);
              closePopup();
            }}
          />
        )}
        {viewingImage && msg.imageUrl && (
          <MessageImageViewer
            message={msg}
            onClose={() => setViewingImage(false)}
            onReply={onReply}
            onForward={onForward}
          />
        )}
      </AnimatePresence>
    </div>
  );
});

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
}: ChatWindowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);

  const prevConvIdRef = useRef<string | null | undefined>(conversationId);
  const prevMsgCountRef = useRef<number>(0);

  // Defensive deduplication to guarantee unique React keys and eliminate duplicate bubbles
  const uniqueMessages = useMemo(() => {
    return dedupeMessages(messages);
  }, [messages]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    } else if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, []);

  // When switching conversation or when messages first finish loading, instantly jump to bottom
  useLayoutEffect(() => {
    if (isLoading) return;

    const convChanged = prevConvIdRef.current !== conversationId;
    prevConvIdRef.current = conversationId;

    if (convChanged || prevMsgCountRef.current === 0) {
      // Instant snap to bottom so the user immediately sees the latest messages
      scrollToBottom('auto');
      requestAnimationFrame(() => scrollToBottom('auto'));
    } else if (uniqueMessages.length > prevMsgCountRef.current) {
      // New message sent or received -> smooth scroll to bottom
      scrollToBottom('smooth');
    }

    prevMsgCountRef.current = uniqueMessages.length;
  }, [conversationId, isLoading, uniqueMessages.length, scrollToBottom]);

  const handleConfirmDelete = (msg: Message, mode: MessageDeleteMode) => {
    setMessageToDelete(null);
    onDelete?.(msg, mode);
  };

  if (isLoading) {
    return <ChatSkeleton />;
  }

  return (
    <div
      ref={scrollContainerRef}
      className={cn(
        'flex-1 overflow-y-auto p-4 h-full min-h-0 custom-scrollbar flex flex-col',
        uniqueMessages.length === 0 && 'justify-center'
      )}
    >
      {/* Centered conversation welcome header at the top */}
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

      {uniqueMessages.map((msg, idx) => {
        const isMe = msg.senderId === currentUserId;
        const prev = idx > 0 ? uniqueMessages[idx - 1] : null;
        const next = idx < uniqueMessages.length - 1 ? uniqueMessages[idx + 1] : null;

        const hasPrev = isConsecutiveWith(msg, prev);
        const hasNext = isConsecutiveWith(msg, next);

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
          <MessageBubble
            key={msg.id}
            msg={msg}
            isMe={isMe}
            currentUserId={currentUserId}
            showAvatar={showAvatar}
            groupPosition={groupPosition}
            participantAvatar={participantAvatar}
            participantName={participantName}
            onRetry={onRetry}
            onReact={onReact}
            onReply={onReply}
            onForward={onForward}
            onDelete={(targetMsg) => setMessageToDelete(targetMsg)}
          />
        );
      })}

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
    </div>
  );
}
