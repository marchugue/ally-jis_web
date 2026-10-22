import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export type DeleteMode = 'delete_permanently' | 'hide';

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
  return (
    <AlertDialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <AlertDialogContent className="rounded-3xl max-w-md p-6 bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/10 shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-jakarta text-lg font-bold text-gray-900 dark:text-white">
            Delete conversation with {participantName}?
          </AlertDialogTitle>
          <AlertDialogDescription className="font-jakarta text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
            This will permanently delete this conversation history for you. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2 mt-6">
          <AlertDialogCancel
            onClick={onClose}
            className="rounded-xl px-4 py-2 font-jakarta font-semibold text-sm border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-5 py-2 font-jakarta font-semibold text-sm transition-colors shadow-sm"
            onClick={() => {
              onConfirmDelete('delete_permanently');
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
