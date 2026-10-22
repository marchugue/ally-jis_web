import { useState } from 'react';
import { X, Ban, EyeOff, RotateCcw } from 'lucide-react';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import { apiClient } from '@/api/client';

interface BlockModalProps {
  participantName: string;
  participantId: string;
  participantAvatar?: string;
  onClose: () => void;
  onBlockSuccess: () => void;
}

type SubmitState = 'idle' | 'loading' | 'error';

export function BlockModal({
  participantName,
  participantId,
  participantAvatar,
  onClose,
  onBlockSuccess,
}: BlockModalProps) {
  const [submitState, setSubmitState] = useState<SubmitState>('idle');

  const handleBlock = async () => {
    setSubmitState('loading');
    try {
      await apiClient.blockUser({ blockedUserId: participantId });
      onBlockSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to block user:', err);
      setSubmitState('error');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Modal card */}
      <div className="relative bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/10 rounded-[28px] shadow-2xl w-full max-w-md p-6 sm:p-7 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-gray-500 hover:text-gray-800 dark:text-gray-400 transition-colors z-10"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Centered Avatar */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-gray-100 dark:ring-white/10 shadow-sm flex items-center justify-center bg-gray-100 dark:bg-white/5">
            <AvatarDisplay
              src={participantAvatar}
              name={participantName}
              className="w-full h-full object-cover"
              textClassName="text-2xl"
            />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl sm:text-[22px] font-bold font-jakarta text-center text-gray-900 dark:text-white px-2 mb-6 leading-snug">
          Block {participantName}?
        </h3>

        {/* Informational bullet items */}
        <div className="space-y-5 px-1 mb-7">
          <div className="flex items-start gap-4">
            <Ban size={20} className="text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-jakarta font-bold text-sm text-gray-900 dark:text-white">
                They won't be able to message you
              </h4>
              <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                Messages from {participantName} will no longer reach your inbox or send notifications.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <EyeOff size={20} className="text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-jakarta font-bold text-sm text-gray-900 dark:text-white">
                Hide profile and presence
              </h4>
              <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                They won't see your Active Status or be able to view your profile updates.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <RotateCcw size={20} className="text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-jakarta font-bold text-sm text-gray-900 dark:text-white">
                Unblock at any time
              </h4>
              <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                They won't be notified that you blocked them. You can unblock from settings anytime.
              </p>
            </div>
          </div>
        </div>

        {submitState === 'error' && (
          <div className="mb-4 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40 rounded-xl p-3">
            <p className="font-jakarta text-xs text-red-600 dark:text-red-300">
              Something went wrong. Please try again.
            </p>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl font-bold font-jakarta text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleBlock}
            disabled={submitState === 'loading'}
            className="px-5 py-2.5 rounded-xl font-bold font-jakarta text-sm bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors flex items-center gap-2"
          >
            {submitState === 'loading' ? 'Blocking…' : `Block ${participantName}`}
          </button>
        </div>
      </div>
    </div>
  );
}
