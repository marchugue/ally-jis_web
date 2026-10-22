import { useState } from 'react';
import { X, EyeOff, CircleDot, RotateCcw } from 'lucide-react';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import { apiClient } from '@/api/client';

interface RestrictModalProps {
  participantName: string;
  participantId: string;
  participantAvatar?: string;
  onClose: () => void;
  onRestrictSuccess: () => void;
}

type SubmitState = 'idle' | 'loading' | 'error';

export function RestrictModal({
  participantName,
  participantId,
  participantAvatar,
  onClose,
  onRestrictSuccess,
}: RestrictModalProps) {
  const [submitState, setSubmitState] = useState<SubmitState>('idle');

  const handleRestrict = async () => {
    setSubmitState('loading');
    try {
      await apiClient.restrictUser({ restrictedUserId: participantId });
      onRestrictSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to restrict user:', err);
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
          See less of {participantName} without blocking them
        </h3>

        {/* Informational bullet items */}
        <div className="space-y-5 px-1 mb-7">
          <div className="flex items-start gap-4">
            <EyeOff size={20} className="text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-jakarta font-bold text-sm text-gray-900 dark:text-white">
                Move the chat out of sight
              </h4>
              <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                Removes the conversation from your inbox, so you won't get message notifications.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <CircleDot size={20} className="text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-jakarta font-bold text-sm text-gray-900 dark:text-white">
                Hide your activity
              </h4>
              <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                They won't see when you've read messages or your Active Status.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <RotateCcw size={20} className="text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-jakarta font-bold text-sm text-gray-900 dark:text-white">
                Unrestrict at any time
              </h4>
              <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                They won't be notified that you restricted them. Unrestrict from privacy settings.
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
            className="px-4 py-2.5 rounded-xl font-bold font-jakarta text-sm text-[#4F46E5] dark:text-indigo-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRestrict}
            disabled={submitState === 'loading'}
            className="px-5 py-2.5 rounded-xl font-bold font-jakarta text-sm bg-[#5850EC] hover:bg-[#4F46E5] text-white shadow-sm transition-colors flex items-center gap-2"
          >
            {submitState === 'loading' ? 'Restricting…' : `Restrict ${participantName}`}
          </button>
        </div>
      </div>
    </div>
  );
}
