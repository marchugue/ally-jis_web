import { useState } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface LogoutConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  description?: string;
}

export function LogoutConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Sign out of your account?',
  description = "Are you sure you want to log out? You'll need to sign back in with your credentials to access your messages, feed, and student matches.",
}: LogoutConfirmModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !loading && !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md w-full p-6 sm:p-7 rounded-3xl border border-gray-200/80 dark:border-white/10 shadow-2xl bg-white dark:bg-[#181818] transition-colors">
        <div className="flex flex-col items-center text-center space-y-4">
          
          {/* Warning Icon Badge */}
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/80 dark:border-red-900/50 flex items-center justify-center shadow-xs">
            <LogOut size={24} className="translate-x-0.5" />
          </div>

          {/* Header Texts */}
          <DialogHeader className="space-y-1.5 text-center">
            <DialogTitle className="font-fraunces text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {title}
            </DialogTitle>
            <DialogDescription className="font-jakarta text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
              {description}
            </DialogDescription>
          </DialogHeader>

          {/* Action Buttons */}
          <div className="w-full flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-white/10 font-jakarta text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
            >
              Stay Logged In
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 text-white font-jakarta text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Signing out…</span>
                </>
              ) : (
                <>
                  <LogOut size={16} />
                  <span>Yes, Sign Out</span>
                </>
              )}
            </button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
