import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import { Student } from '@/types/ally';
import { Conversation } from '@/types/ally';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConversationHeaderProps {
  currentUser: Student;
  activeConversation?: Conversation | null;
  variant?: 'sidebar' | 'empty';
}

export function ConversationHeader({ currentUser, activeConversation, variant = 'sidebar' }: ConversationHeaderProps) {
  const isEmptyState = variant === 'empty';

  return (
    <div className={cn(
      "flex flex-col items-center text-center px-4 py-5 border-b border-gray-100 bg-gradient-to-b from-[#1A6B3C]/[0.03] to-transparent",
      isEmptyState && "py-8 border-none bg-transparent"
    )}>
      {/* Avatars row */}
      <div className="flex items-center gap-2 mb-3">
        {/* Current user */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="relative">
            <AvatarDisplay
              src={currentUser.avatar}
              name={currentUser.name}
              className={cn(
                "rounded-2xl object-cover ring-2 ring-white shadow-sm",
                isEmptyState ? "w-16 h-16" : "w-12 h-12"
              )}
            />
          </div>
          <div className={cn("max-w-[80px]", isEmptyState && "max-w-[96px]")}>
            <p className="font-jakarta font-bold text-gray-900 truncate text-xs leading-tight">
              {currentUser.name.split(' ')[0]}
            </p>
            <p className="font-jakarta text-[10px] text-gray-400 truncate leading-tight mt-0.5">
              {currentUser.course ?? 'Student'}
            </p>
          </div>
        </div>

        {/* Connector */}
        <div className="flex flex-col items-center gap-1 px-1">
          <div className="flex items-center gap-0.5">
            <div className="w-1 h-1 rounded-full bg-[#1A6B3C]/20" />
            <div className="w-3 h-px bg-[#1A6B3C]/20" />
            <MessageCircle
              size={isEmptyState ? 18 : 14}
              className="text-[#1A6B3C]/30"
            />
            <div className="w-3 h-px bg-[#1A6B3C]/20" />
            <div className="w-1 h-1 rounded-full bg-[#1A6B3C]/20" />
          </div>
        </div>

        {/* Other user or placeholder */}
        <div className="flex flex-col items-center gap-1.5">
          {activeConversation ? (
            <>
              <AvatarDisplay
                src={activeConversation.participantAvatar}
                name={activeConversation.participantName}
                className={cn(
                  "rounded-2xl object-cover ring-2 ring-white shadow-sm",
                  isEmptyState ? "w-16 h-16" : "w-12 h-12"
                )}
              />
              <div className={cn("max-w-[80px]", isEmptyState && "max-w-[96px]")}>
                <p className="font-jakarta font-bold text-gray-900 truncate text-xs leading-tight">
                  {activeConversation.participantName.split(' ')[0]}
                </p>
                <p className="font-jakarta text-[10px] text-gray-400 truncate leading-tight mt-0.5">
                  {/* If your Conversation type has course, use it here */}
                  Ally
                </p>
              </div>
            </>
          ) : (
            <>
              <div className={cn(
                "rounded-2xl bg-[#1A6B3C]/5 border-2 border-dashed border-[#1A6B3C]/15 flex items-center justify-center",
                isEmptyState ? "w-16 h-16" : "w-12 h-12"
              )}>
                <span className="text-[#1A6B3C]/20 font-bold text-lg">?</span>
              </div>
              <div className={cn("max-w-[80px]", isEmptyState && "max-w-[96px]")}>
                <p className="font-jakarta font-bold text-gray-400 truncate text-xs leading-tight">
                  Select ally
                </p>
                <p className="font-jakarta text-[10px] text-gray-300 truncate leading-tight mt-0.5">
                  —
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {isEmptyState && (
        <p className="font-jakarta text-xs text-gray-400 max-w-[180px] leading-relaxed mt-1">
          Pick a conversation or find new allies in the <span className="text-[#1A6B3C] font-semibold">Discover</span> tab.
        </p>
      )}
    </div>
  );
}