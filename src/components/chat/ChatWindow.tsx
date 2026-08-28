import { useRef, useEffect, useState, memo, useCallback } from 'react';
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

interface ChatWindowProps {
  messages: Message[];
  currentUserId: string;
  participantAvatar?: string | null;
  participantName?: string | null;
  onRetry?: (message: Message) => void;
  onReact?: (message: Message, emoji: string) => void;
  onReply?: (message: Message) => void;
  onForward?: (message: Message) => void;
  onDelete?: (message: Message, mode?: MessageDeleteMode) => void;
}

interface MessageBubbleProps {
  msg: Message;
  isMe: boolean;
  currentUserId: string;
  showAvatar: boolean;
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
                className="w-8 h-8 rounded-lg overflow-hidden opacity-50"
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
              ? 'bg-gray-50 border-gray-200 text-gray-400 rounded-br-none'
              : 'bg-gray-50 border-gray-200 text-gray-400 rounded-bl-none',
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
    <div className="flex flex-col" style={{ maxWidth: '100%' }}>
      <div
        ref={bubbleRef}
        {...mobileLongPressHandlers}
        className={cn(
          'max-w-full rounded-2xl text-sm font-jakarta transition-opacity select-none',
          isImageOnly ? 'p-1' : 'px-4 py-2',
          isMe
            ? 'bg-[#1A6B3C] text-white rounded-br-none'
            : 'bg-gray-100 text-gray-800 rounded-bl-none',
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

  return (
    <div
      className={cn(
        'group flex items-end gap-2',
        isMe ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      {!isMe && (
        <div className="w-8 h-8 flex-shrink-0">
          {showAvatar ? (
            <AvatarDisplay
              src={participantAvatar}
              name={participantName}
              className="w-8 h-8 rounded-lg overflow-hidden"
              textClassName="text-[10px]"
            />
          ) : (
            <div className="w-8 h-8" />
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5" style={{ maxWidth: '75%' }}>
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
  onRetry,
  onReact,
  onReply,
  onForward,
  onDelete,
}: ChatWindowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleConfirmDelete = (msg: Message, mode: MessageDeleteMode) => {
    setMessageToDelete(null);
    onDelete?.(msg, mode);
  };

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 h-full min-h-0 custom-scrollbar"
    >
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
          <div className="text-4xl mb-2">💬</div>
          <p className="font-jakarta text-sm">No messages yet. Say hi!</p>
        </div>
      ) : (
        messages.map((msg, idx) => {
          const isMe = msg.senderId === currentUserId;
          const showAvatar =
            !isMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);

          return (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isMe={isMe}
              currentUserId={currentUserId}
              showAvatar={showAvatar}
              participantAvatar={participantAvatar}
              participantName={participantName}
              onRetry={onRetry}
              onReact={onReact}
              onReply={onReply}
              onForward={onForward}
              onDelete={(targetMsg) => setMessageToDelete(targetMsg)}
            />
          );
        })
      )}

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
