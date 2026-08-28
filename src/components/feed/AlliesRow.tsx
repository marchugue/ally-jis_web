// src/components/feed/AlliesRow.tsx

import { useNavigate } from 'react-router-dom';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import type { Student } from '@/types/ally';

interface AlliesRowProps {
  allies: Student[];
}

export default function AlliesRow({ allies }: AlliesRowProps) {
  const navigate = useNavigate();

  if (allies.length === 0) return null;

  return (
    <div className="mb-5">
      <h2 className="font-jakarta font-semibold text-xs text-[#1A6B3C] uppercase tracking-widest mb-3 px-0.5">
        Your Allies
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {allies.map((ally) => (
          <button
            key={ally.id}
            onClick={() => navigate(`/profile/${ally.id}`)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
          >
            <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-transparent group-hover:ring-[#1A6B3C]/30 transition-all">
              <AvatarDisplay
                src={ally.avatar}
                name={ally.name}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-jakarta text-[10px] text-gray-500 max-w-[56px] truncate text-center">
              {ally.name.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}