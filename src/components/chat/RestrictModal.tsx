import { useState } from 'react';
import { X, ShieldAlert, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/api/client';

interface RestrictModalProps {
  participantName: string;
  participantId: string;
  onClose: () => void;
  onRestrictSuccess: () => void;
}

type SubmitState = 'idle' | 'loading' | 'error';

export function RestrictModal({
  participantName,
  participantId,
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
        className="absolute inset-0 bg-black/40 animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Modal card */}
      <div className="relative bg-white dark:bg-[#111827] border border-transparent dark:border-white/10 rounded-3xl shadow-xl w-full max-w-md flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-white/10 flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center flex-shrink-0">
            <ShieldAlert size={18} className="text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-jakarta font-bold text-gray-900 dark:text-white text-sm">
              Restrict {participantName}
            </h3>
            <p className="font-jakarta text-xs text-gray-400 dark:text-gray-500">
              Limit visibility & hide presence
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40 rounded-2xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-jakarta font-semibold text-sm text-amber-900 dark:text-amber-200 mb-1">
                  Are you sure you want to restrict {participantName}?
                </p>
                <p className="font-jakarta text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  Restricting will symmetrically hide online and active presence between both of you, and take you to your restricted accounts list.
                </p>
              </div>
            </div>
          </div>

          <ul className="space-y-2 mb-2 px-1">
            <li className="font-jakarta text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
              Neither of you will see each other's online indicator or active status.
            </li>
            <li className="font-jakarta text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
              They won't be notified that you restricted them.
            </li>
            <li className="font-jakarta text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
              You can unrestrict them anytime from your restricted accounts page.
            </li>
          </ul>

          {submitState === 'error' && (
            <div className="mt-3 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40 rounded-xl p-3">
              <p className="font-jakarta text-xs text-red-600 dark:text-red-300">
                Something went wrong while restricting. Please try again.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 dark:border-white/10 flex gap-3 bg-gray-50/50 dark:bg-white/5 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={submitState === 'loading'}
            className="flex-1 font-jakarta font-medium text-xs text-gray-600 dark:text-gray-300 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleRestrict}
            disabled={submitState === 'loading'}
            className={cn(
              'flex-1 font-jakarta font-semibold text-xs py-2.5 px-4 rounded-xl text-white transition-colors flex items-center justify-center gap-1.5',
              submitState === 'loading'
                ? 'bg-amber-300 cursor-not-allowed'
                : 'bg-amber-600 hover:bg-amber-700',
            )}
          >
            {submitState === 'loading' ? 'Restricting…' : 'Restrict User'}
          </button>
        </div>
      </div>
    </div>
  );
}
