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
      className="w-full bg-white dark:bg-[#181818] border-0 border-b sm:border border-gray-200/80 dark:border-white/10 rounded-none sm:rounded-2xl p-4 mb-0 sm:mb-4 flex items-center gap-3 hover:border-[#1A6B3C]/40 transition-colors shadow-none sm:shadow-2xs text-left cursor-pointer"
    >
      <AvatarDisplay src={currentUser.avatar} name={currentUser.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
      <span className="flex-1 text-left font-jakarta text-sm text-gray-400 dark:text-gray-400 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full px-4 py-2.5">
        What's on your mind?
      </span>
      <span className="flex-shrink-0 bg-[#1A6B3C]/10 dark:bg-emerald-500/20 text-[#1A6B3C] dark:text-emerald-400 rounded-full p-2">
        <Plus size={16} />
      </span>
    </button>
  );
}