import { useState } from 'react';
import { X, Trash2, EyeOff, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DeleteMode = 'hide' | 'delete_permanently';

interface DeleteConversationModalProps {
  participantName: string;
  onClose: () => void;
  onConfirmDelete: (mode: DeleteMode) => void;
}

export function DeleteConversationModal({
  participantName,
  onClose,
  onConfirmDelete,
}: DeleteConversationModalProps) {
  const [selectedMode, setSelectedMode] = useState<DeleteMode>('delete_permanently');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = () => {
    setIsDeleting(true);

    // ── FUTURE BACKEND IMPLEMENTATION FLAG ─────────────────────────────────────
    // Flow: Scopes deletion to current user account only.
    // Removes/clears history for current user while participant's copy remains intact.
    // ─────────────────────────────────────────────────────────────────────────────

    onConfirmDelete(selectedMode);
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
            <Trash2 size={18} className="text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-jakarta font-bold text-gray-900 text-sm">
              Delete Options
            </h3>
            <p className="font-jakarta text-xs text-gray-400">
              Manage chat with {participantName}
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
        <div className="p-5 space-y-3">
          {/* Option 1: Hide Conversation */}
          <div
            onClick={() => setSelectedMode('hide')}
            className={cn(
              'p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5',
              selectedMode === 'hide'
                ? 'border-[#1A6B3C] bg-[#1A6B3C]/5 shadow-sm'
                : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/50',
            )}
          >
            <div className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
              selectedMode === 'hide' ? 'bg-[#1A6B3C] text-white' : 'bg-gray-100 text-gray-500',
            )}>
              <EyeOff size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-jakarta font-bold text-sm text-gray-900">
                  Hide conversation
                </h4>
                {selectedMode === 'hide' && (
                  <span className="w-5 h-5 rounded-full bg-[#1A6B3C] text-white flex items-center justify-center flex-shrink-0">
                    <Check size={12} />
                  </span>
                )}
              </div>
              <p className="font-jakarta text-xs text-gray-500 mt-1 leading-relaxed">
                Removes chat from your inbox. Reappears when a new message arrives.
              </p>
            </div>
          </div>

          {/* Option 2: Delete Permanently */}
          <div
            onClick={() => setSelectedMode('delete_permanently')}
            className={cn(
              'p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5',
              selectedMode === 'delete_permanently'
                ? 'border-red-500 bg-red-50/60 shadow-sm'
                : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/50',
            )}
          >
            <div className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
              selectedMode === 'delete_permanently' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500',
            )}>
              <Trash2 size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-jakarta font-bold text-sm text-gray-900">
                  Delete permanently
                </h4>
                {selectedMode === 'delete_permanently' && (
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center flex-shrink-0">
                    <Check size={12} />
                  </span>
                )}
              </div>
              <p className="font-jakarta text-xs text-gray-600 mt-1 leading-relaxed">
                Removes your copy of this chat. {participantName} will still keep theirs.
              </p>
            </div>
          </div>

          {/* User notice */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-start gap-2.5">
            <AlertCircle size={15} className="text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="font-jakarta text-[11px] text-gray-500 leading-snug">
              {selectedMode === 'delete_permanently'
                ? `Only removes the chat on your account.`
                : 'Hiding can be undone when a new message arrives.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 flex gap-3 bg-gray-50/50 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 font-jakarta font-medium text-xs text-gray-600 py-2.5 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className={cn(
              'flex-1 font-jakarta font-semibold text-xs py-2.5 px-4 rounded-xl text-white transition-colors flex items-center justify-center gap-1.5',
              selectedMode === 'hide'
                ? 'bg-[#1A6B3C] hover:bg-[#15592F]'
                : isDeleting
                  ? 'bg-red-300 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600',
            )}
          >
            {selectedMode === 'hide' ? (
              <>
                <EyeOff size={14} />
                {isDeleting ? 'Hiding…' : 'Hide Chat'}
              </>
            ) : (
              <>
                <Trash2 size={14} />
                {isDeleting ? 'Deleting…' : 'Delete Permanently'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
