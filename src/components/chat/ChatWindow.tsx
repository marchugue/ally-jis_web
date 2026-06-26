import { useRef, useEffect } from 'react';
import { Message } from '@/types/ally';
import { cn } from '@/lib/utils';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';

interface ChatWindowProps {
  messages: Message[];
  currentUserId: string;
  participantAvatar?: string | null;
  participantName?: string | null;
}

export function ChatWindow({ messages, currentUserId, participantAvatar, participantName }: ChatWindowProps) {
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
            <div
              key={msg.id}
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
              <div
                className={cn(
                  "max-w-[75%] px-4 py-2 rounded-2xl text-sm font-jakarta",
                  isMe
                    ? "bg-[#1A6B3C] text-white rounded-br-none"
                    : "bg-gray-100 text-gray-800 rounded-bl-none"
                )}
              >
                {msg.imageUrl && (
                  <img src={msg.imageUrl} alt="" className="rounded-lg mb-2 max-w-full" />
                )}
                {msg.content && <p>{msg.content}</p>}
                <span className={cn(
                  "text-[10px] block mt-1",
                  isMe ? "text-white/60" : "text-gray-400"
                )}>
                  {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
