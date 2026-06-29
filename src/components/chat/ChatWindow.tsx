import { useRef, useEffect, memo } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { Message } from '@/types/ally';
import { cn } from '@/lib/utils';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';

interface ChatWindowProps {
  messages: Message[];
  currentUserId: string;
  participantAvatar?: string | null;
  participantName?: string | null;
  onRetry?: (message: Message) => void;
}

interface MessageBubbleProps {
  msg: Message;
  isMe: boolean;
  showAvatar: boolean;
  participantAvatar?: string | null;
  participantName?: string | null;
  onRetry?: (message: Message) => void;
}

// Memoized so a status change (sending -> sent) on one bubble doesn't
// force every other bubble in the thread to re-render.
const MessageBubble = memo(function MessageBubble({
  msg,
  isMe,
  showAvatar,
  participantAvatar,
  participantName,
  onRetry,
}: MessageBubbleProps) {
  const isSending = msg.status === 'sending';
  const isFailed = msg.status === 'failed';

  return (
    <div
      className={cn(
        "flex items-end gap-2",
        isMe ? "flex-row-reverse" : "flex-row"
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
      <div className="flex flex-col" style={{ maxWidth: '75%' }}>
        <div
          className={cn(
            "max-w-full px-4 py-2 rounded-2xl text-sm font-jakarta transition-opacity",
            isMe
              ? "bg-[#1A6B3C] text-white rounded-br-none"
              : "bg-gray-100 text-gray-800 rounded-bl-none",
            isSending && "opacity-60",
            isFailed && "opacity-80 ring-1 ring-red-400"
          )}
        >
          {msg.imageUrl && (
            <img src={msg.imageUrl} alt="" className="rounded-lg mb-2 max-w-full" />
          )}
          {msg.content && <p>{msg.content}</p>}
          <span className={cn(
            "text-[10px] flex items-center gap-1 mt-1",
            isMe ? "text-white/60" : "text-gray-400"
          )}>
            {isSending && <Clock size={10} className="animate-pulse" />}
            {isSending
              ? 'Sending…'
              : new Date(msg.createdAt || msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {isFailed && (
          <button
            onClick={() => onRetry?.(msg)}
            className={cn(
              "flex items-center gap-1 text-[11px] text-red-500 mt-1 hover:underline",
              isMe ? "self-end" : "self-start"
            )}
          >
            <AlertCircle size={11} />
            Failed to send · Tap to retry
          </button>
        )}
      </div>
    </div>
  );
});

export function ChatWindow({ messages, currentUserId, participantAvatar, participantName, onRetry }: ChatWindowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages.length]);

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
          const showAvatar = !isMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);

          return (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isMe={isMe}
              showAvatar={showAvatar}
              participantAvatar={participantAvatar}
              participantName={participantName}
              onRetry={onRetry}
            />
          );
        })
      )}
    </div>
  );
}