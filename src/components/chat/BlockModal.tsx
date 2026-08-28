import { useState } from 'react';
import { X, ShieldOff, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/api/client';

interface BlockModalProps {
  participantName: string;
  participantId: string;
  onClose: () => void;
  onBlockSuccess: () => void;
}

type SubmitState = 'idle' | 'loading' | 'error';

export function BlockModal({
  participantName,
  participantId,
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
        className="absolute inset-0 bg-black/40 animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Modal card */}
      <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-md flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <ShieldOff size={18} className="text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-jakarta font-bold text-gray-900 text-sm">
              Block {participantName}
            </h3>
            <p className="font-jakarta text-xs text-gray-400">
              Confirm user restriction
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="bg-red-50/70 border border-red-100 rounded-2xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-jakarta font-semibold text-sm text-red-900 mb-1">
                  Are you sure you want to block {participantName}?
                </p>
                <p className="font-jakarta text-xs text-red-600 leading-relaxed">
                  Blocking will immediately stop {participantName} from sending you messages or finding your profile on Ally-jis.
                </p>
              </div>
            </div>
          </div>

          <ul className="space-y-2 mb-2 px-1">
            <li className="font-jakarta text-xs text-gray-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
              They will not be notified that you blocked them.
            </li>
            <li className="font-jakarta text-xs text-gray-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
              You can unblock them anytime from conversation settings.
            </li>
          </ul>

          {submitState === 'error' && (
            <div className="mt-3 bg-red-50 border border-red-100 rounded-xl p-3">
              <p className="font-jakarta text-xs text-red-600">
                Something went wrong while blocking. Please try again.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 flex gap-3 bg-gray-50/50 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={submitState === 'loading'}
            className="flex-1 font-jakarta font-medium text-xs text-gray-600 py-2.5 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleBlock}
            disabled={submitState === 'loading'}
            className={cn(
              'flex-1 font-jakarta font-semibold text-xs py-2.5 px-4 rounded-xl text-white transition-colors flex items-center justify-center gap-1.5',
              submitState === 'loading'
                ? 'bg-red-300 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600',
            )}
          >
            {submitState === 'loading' ? 'Blocking…' : 'Block User'}
          </button>
        </div>
      </div>
    </div>
  );
}
