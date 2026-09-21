// src/components/ally/PostComposerTrigger.tsx

import { Plus } from 'lucide-react';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import type { Student } from '@/types/ally';

interface PostComposerTriggerProps {
  currentUser: Student;
  onClick: () => void;
}

export default function PostComposerTrigger({ currentUser, onClick }: PostComposerTriggerProps) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white dark:bg-[#181818] border-0 border-b border-[#E2DED7] dark:border-white/10 sm:border sm:border-gray-200/80 dark:sm:border-white/10 rounded-none sm:rounded-2xl p-3.5 sm:p-4 mb-0 sm:mb-4 flex items-center gap-3 hover:border-[#1A6B3C]/40 transition-colors shadow-none sm:shadow-2xs text-left cursor-pointer"
    >
      <AvatarDisplay src={currentUser.avatar} name={currentUser.name} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0" />
      <span className="flex-1 text-left font-jakarta text-xs sm:text-sm text-gray-400 dark:text-gray-400 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full px-3.5 sm:px-4 py-2 sm:py-2.5">
        What's on your mind?
      </span>
      <span className="flex-shrink-0 bg-[#1A6B3C]/10 dark:bg-emerald-500/20 text-[#1A6B3C] dark:text-emerald-400 rounded-full p-2">
        <Plus size={16} />
      </span>
    </button>
  );
}