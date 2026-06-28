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
      className="w-full bg-white border-b border-[#1A6B3C]/6 lg:rounded-2xl lg:border lg:card-shadow p-4 mb-6 flex items-center gap-3 hover:lg:card-shadow-hover transition-shadow"
    >
      <AvatarDisplay src={currentUser.avatar} name={currentUser.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
      <span className="flex-1 text-left font-jakarta text-sm text-gray-400 bg-gray-50 rounded-full px-4 py-2.5">
        Post something
      </span>
      <span className="flex-shrink-0 bg-[#1A6B3C]/10 text-[#1A6B3C] rounded-full p-2">
        <Plus size={16} />
      </span>
    </button>
  );
}