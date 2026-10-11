import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LockedMediaThumbnailProps {
  /** Original media URL — rendered heavily blurred as a backdrop (images only). */
  src?: string | null;
  /** Number of media items in the message (shows "N photos" when > 1). */
  count?: number;
  isVideo?: boolean;
  /** Stage at which media unlocks again (default Lv.3). */
  unlockStage?: number;
  className?: string;
}

/**
 * Shown in place of a chat photo/video when media sharing is locked again
 * because the streak ended and the match level dropped below Lv.3.
 * The real media is never viewable — no click-through, no viewer, no drag.
 */
export function LockedMediaThumbnail({
  src,
  count = 1,
  isVideo = false,
  unlockStage = 3,
  className,
}: LockedMediaThumbnailProps) {
  return (
    <div
      role="img"
      aria-label={`Locked ${count > 1 ? `${count} photos` : isVideo ? 'video' : 'photo'} — unlocks at Level ${unlockStage}`}
      title={`Media is locked. Rebuild your streak to Level ${unlockStage} to view it again.`}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        'relative w-[220px] h-[170px] rounded-xl overflow-hidden select-none cursor-not-allowed',
        'border border-white/40 dark:border-white/10 shadow-md',
        'bg-gradient-to-br from-emerald-900/70 via-slate-800 to-slate-900',
        className,
      )}
    >
      {src && !isVideo && (
        <img
          src={src}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl brightness-75 saturate-150 pointer-events-none"
        />
      )}

      {/* Frosted overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-md" />

      {/* Lock badge */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white px-4 text-center">
        <div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm ring-1 ring-white/30 flex items-center justify-center shadow-lg">
          <Lock size={20} strokeWidth={2.4} />
        </div>
        <span className="text-[12px] font-semibold font-jakarta leading-tight drop-shadow">
          {count > 1 ? `${count} photos locked` : isVideo ? 'Video locked' : 'Photo locked'}
        </span>
        <span className="text-[10.5px] font-jakarta text-white/75 leading-snug">
          Reach Lv.{unlockStage} streak again to unlock
        </span>
      </div>
    </div>
  );
}
