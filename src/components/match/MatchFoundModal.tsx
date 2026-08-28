// src/components/match/MatchFoundModal.tsx

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, X } from 'lucide-react';
import { AnonymousAvatar } from './AnonymousAvatar';
import type { MatchIdentityView } from '@/api/client';

interface MatchFoundModalProps {
  acceptDeadline: number | null;
  identity: MatchIdentityView | null;
  myAccepted: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

function useCountdown(deadline: number | null): number {
  const [remaining, setRemaining] = useState(() => (deadline ? Math.max(0, deadline - Date.now()) : 0));

  useEffect(() => {
    if (!deadline) return;
    const tick = () => setRemaining(Math.max(0, deadline - Date.now()));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [deadline]);

  return remaining;
}

export function MatchFoundModal({
  acceptDeadline,
  identity,
  myAccepted,
  onAccept,
  onDecline,
}: MatchFoundModalProps) {
  const remainingMs = useCountdown(acceptDeadline);
  const seconds = Math.ceil(remainingMs / 1000);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 text-center font-jakarta"
      >
        <AnonymousAvatar avatarKey={identity?.partnerAvatar} size={72} className="mx-auto mb-4" />

        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          {identity?.partnerAlias ?? 'A match'} is ready to chat
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Both of you stay anonymous — talk for a few days to start unlocking things about each other.
        </p>

        {myAccepted ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <Clock className="animate-pulse text-[#1A6B3C]" size={22} />
            <p className="text-sm text-gray-500">Waiting for them to accept…</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mb-4">
              <Clock size={13} />
              {seconds > 0 ? `${seconds}s to respond` : 'Expiring…'}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onDecline}
                className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 font-medium py-3 rounded-2xl hover:bg-gray-50 transition-colors"
              >
                <X size={17} />
                Skip
              </button>
              <button
                onClick={onAccept}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#1A6B3C] text-white font-semibold py-3 rounded-2xl hover:bg-[#155a33] transition-colors shadow-md active:scale-95"
              >
                <Check size={17} />
                Chat
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
