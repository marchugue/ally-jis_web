import React from 'react';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import { AnonymousAvatar } from '@/components/match/AnonymousAvatar';
import { cn } from '@/lib/utils';

interface ConversationWelcomeHeaderProps {
  participantName: string;
  participantAvatar?: string | null;
  participantCourse?: string | null;
  participantDepartment?: string | null;
  sharedInterests?: string[];
  partnerAvatar?: string | null;
  isAnonymous?: boolean;
  className?: string;
}

export const ConversationWelcomeHeader: React.FC<ConversationWelcomeHeaderProps> = ({
  participantName,
  participantAvatar,
  participantCourse,
  participantDepartment,
  sharedInterests = [],
  partnerAvatar,
  isAnonymous = false,
  className,
}) => {
  const courseAndProgram = [participantCourse, participantDepartment]
    .filter(Boolean)
    .join(' • ');

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-8 px-4 select-none',
        className
      )}
    >
      {isAnonymous ? (
        <>
          {partnerAvatar && (
            <AnonymousAvatar
              avatarKey={partnerAvatar}
              size={72}
              className="rounded-full mb-3 shadow-xs"
            />
          )}
          <h3 className="font-jakarta font-bold text-lg sm:text-xl text-gray-900 dark:text-white tracking-tight">
            {participantName}
          </h3>
          {sharedInterests.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 max-w-sm">
              {sharedInterests.map((interest) => (
                <span
                  key={interest}
                  className="px-2.5 py-1 text-xs font-jakarta font-semibold rounded-full bg-[#1A6B3C]/10 dark:bg-emerald-500/15 text-[#1A6B3C] dark:text-emerald-400 border border-[#1A6B3C]/20 dark:border-emerald-500/30"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <AvatarDisplay
            src={participantAvatar}
            name={participantName}
            className="w-20 h-20 rounded-full object-cover mb-3 ring-4 ring-gray-100 dark:ring-white/10 shadow-xs"
          />
          <h3 className="font-jakarta font-bold text-lg sm:text-xl text-gray-900 dark:text-white tracking-tight">
            {participantName}
          </h3>
          {courseAndProgram && (
            <p className="font-jakarta text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              {courseAndProgram}
            </p>
          )}
        </>
      )}
    </div>
  );
};
