import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, ChevronLeft, Flag, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCommunityStandards, ReportViolation } from '@/data/CommunityStandards';
import { apiClient } from '@/api/client';
import type { FeedPost } from '@/types/feed';
import { notify } from '@/components/ui/sonner';

interface ReportPostModalProps {
  post: FeedPost;
  onClose: () => void;
  onReported?: () => void;
}

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

export default function ReportPostModal({ post, onClose, onReported }: ReportPostModalProps) {
  const categories = getCommunityStandards('post');

  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);
  const [selectedViolation, setSelectedViolation] = useState<ReportViolation | null>(null);
  const [details, setDetails] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const authorName = post.author?.full_name || post.author?.username || 'Ally member';

  const toggleCategory = (categoryId: string) => {
    setOpenCategoryId((prev) => (prev === categoryId ? null : categoryId));
  };

  const detailsMissing = !!selectedViolation?.requiresDetails && details.trim().length < 3;

  const handleSubmit = async () => {
    if (!selectedViolation || !post.author_id || detailsMissing) return;
    setSubmitState('loading');
    setErrorMessage('');

    try {
      await apiClient.reportUser({
        reportedUserId: post.author_id,
        violationId: selectedViolation.id,
        postId: post.id,
        notes: details.trim() || undefined,
      });

      setSubmitState('success');
      notify.success('Report submitted', 'Our moderation team will review this post promptly.');
      onReported?.();
    } catch (err: any) {
      console.error('Failed to submit post report:', err);
      setSubmitState('error');
      setErrorMessage(err?.message || 'Failed to submit report. Please try again.');
    }
  };

  if (typeof document === 'undefined') return null;

  const title = `Report post from ${authorName}`;
  const postPreview = post.content
    ? post.content
    : post.media && post.media.length > 0
    ? `[Post with ${post.media.length} image(s)]`
    : 'Shared Post';

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Modal card */}
      <div className="relative bg-white dark:bg-[#111827] border border-transparent dark:border-white/10 rounded-3xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {submitState === 'success' ? (
          <div className="p-8 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mb-4">
              <CheckCircle2 size={26} className="text-emerald-500" />
            </div>
            <h3 className="font-jakarta font-bold text-gray-900 dark:text-white mb-1">
              Report submitted
            </h3>
            <p className="font-jakarta text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
              Thanks for letting us know. Our team will review this post from {authorName} according to our Community Guidelines.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-[#1A6B3C] hover:bg-[#15592F] text-white font-jakarta font-semibold text-sm py-3 rounded-xl transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-5 border-b border-gray-100 dark:border-white/10 flex items-center gap-3 flex-shrink-0">
              {selectedViolation ? (
                <button
                  type="button"
                  onClick={() => setSelectedViolation(null)}
                  className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  aria-label="Back to categories"
                >
                  <ChevronLeft size={18} />
                </button>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center flex-shrink-0">
                  <Flag size={16} className="text-red-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-jakarta font-bold text-gray-900 dark:text-white text-sm truncate">
                  {title}
                </h3>
                <p className="font-jakarta text-xs text-gray-400 dark:text-gray-500">
                  {selectedViolation ? 'Confirm your report reason' : "What's going on?"}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex-shrink-0"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Reported post preview */}
            {postPreview && (
              <div className="px-5 pt-3 pb-2 bg-gray-50/70 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5 flex-shrink-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-1">
                  Reported Post
                </p>
                <p className="text-xs text-gray-700 dark:text-white/80 line-clamp-3 italic break-words">
                  "{postPreview}"
                </p>
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4">
              {selectedViolation ? (
                <div>
                  <div className="bg-[#1A6B3C]/5 dark:bg-emerald-500/10 border border-[#1A6B3C]/15 dark:border-emerald-500/20 rounded-2xl p-4 mb-4">
                    <p className="font-jakarta font-semibold text-sm text-gray-900 dark:text-white">
                      {selectedViolation.label}
                    </p>
                    <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                      {selectedViolation.description}
                    </p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-white/70 mb-1.5">
                      {selectedViolation.requiresDetails
                        ? 'Tell us what happened (required)'
                        : 'Additional details for moderators (optional)'}
                    </label>
                    <textarea
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      rows={3}
                      maxLength={1000}
                      placeholder="Provide any context that will help us evaluate this report..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#1A6B3C] dark:focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  {/* Inline error */}
                  {submitState === 'error' && (
                    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40 rounded-xl px-3 py-2.5 mb-3">
                      <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                      <p className="font-jakarta text-xs text-red-600 dark:text-red-300">
                        {errorMessage || 'Something went wrong. Please try again.'}
                      </p>
                    </div>
                  )}

                  <p className="font-jakarta text-xs text-gray-400 dark:text-gray-500 leading-relaxed px-1">
                    Our team will review this report. {authorName} won't be notified that you submitted it.
                  </p>
                </div>
              ) : (
                <div className="border border-gray-100 dark:border-white/10 rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-white/10">
                  {categories.map((category) => {
                    const isOpen = openCategoryId === category.id;
                    return (
                      <div key={category.id}>
                        <button
                          type="button"
                          onClick={() => toggleCategory(category.id)}
                          className="w-full flex items-center gap-2 px-4 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-jakarta font-semibold text-sm text-gray-900 dark:text-white">
                              {category.label}
                            </p>
                            <p className="font-jakarta text-[11px] text-gray-400 dark:text-gray-500 leading-snug mt-0.5">
                              {category.description}
                            </p>
                          </div>
                          <ChevronDown
                            size={15}
                            className={cn(
                              'text-gray-300 dark:text-gray-600 flex-shrink-0 transition-transform',
                              isOpen && 'rotate-180',
                            )}
                          />
                        </button>

                        {isOpen && (
                          <div className="bg-gray-50/60 dark:bg-white/5 px-3 pb-2">
                            {category.violations.map((violation) => (
                              <button
                                key={violation.id}
                                type="button"
                                onClick={() => setSelectedViolation(violation)}
                                className="w-full text-left px-3 py-2.5 rounded-xl mb-1 hover:bg-white dark:hover:bg-white/10 transition-colors"
                              >
                                <p className="font-jakarta text-sm text-gray-800 dark:text-gray-200 font-medium">
                                  {violation.label}
                                </p>
                                <p className="font-jakarta text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 leading-snug">
                                  {violation.description}
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {selectedViolation && (
              <div className="p-4 border-t border-gray-100 dark:border-white/10 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitState === 'loading' || detailsMissing}
                  className={cn(
                    'w-full font-jakarta font-semibold text-sm py-3 rounded-xl transition-colors',
                    submitState === 'loading' || detailsMissing
                      ? 'bg-red-300 text-white cursor-not-allowed'
                      : 'bg-red-500 hover:bg-red-600 text-white',
                  )}
                >
                  {submitState === 'loading' ? 'Submitting…' : submitState === 'error' ? 'Retry' : 'Submit Report'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
