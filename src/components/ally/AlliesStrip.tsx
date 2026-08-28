// src/components/ally/AlliesStrip.tsx

import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import { usePresence } from '@/context/PresenceContext';
import type { Student } from '@/types/ally';

interface AlliesStripProps {
  allies: Student[];
  onSelectAlly: (allyId: string) => void;
}

export default function AlliesStrip({ allies, onSelectAlly }: AlliesStripProps) {
  const { isOnline } = usePresence();

  if (allies.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="font-fraunces text-xl font-bold text-[#1A6B3C] mb-4">Your Allies</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x">
        {allies.map((ally) => (
          <div
            key={ally.id}
            onClick={() => onSelectAlly(ally.id)}
            className="flex-shrink-0 bg-white rounded-2xl p-4 w-32 text-center border border-[#1A6B3C]/6 card-shadow hover:card-shadow-hover transition-all snap-start cursor-pointer"
          >
            <div className="relative inline-block mb-2">
              <AvatarDisplay src={ally.avatar} name={ally.name} className="w-14 h-14 rounded-2xl mx-auto object-cover shadow-sm" />
              {isOnline(ally.id) && (
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
              )}
            </div>
            <p className="font-jakarta font-bold text-gray-900 text-xs truncate w-full">{ally.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}