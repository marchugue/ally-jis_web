import { useState } from 'react';
import { X, ChevronDown, ChevronLeft, Flag, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COMMUNITY_STANDARDS, ReportViolation } from '@/data/CommunityStandards';
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
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);
  const [selectedViolation, setSelectedViolation] = useState<ReportViolation | null>(null);
  const [details, setDetails] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const authorName = post.author?.full_name || post.author?.username || 'Ally member';
  const authorHandle = post.author?.username ? `@${post.author.username}` : '';

  const toggleCategory = (categoryId: string) => {
    setOpenCategoryId((prev) => (prev === categoryId ? null : categoryId));
  };

  const handleSubmit = async () => {
    if (!selectedViolation || !post.author_id) return;
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal card */}
      <div className="relative bg-white dark:bg-[#161D19] border border-gray-100 dark:border-white/10 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {submitState === 'success' ? (
          <div className="p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="font-fraunces text-xl font-bold text-gray-900 dark:text-white mb-2">
              Report Submitted
            </h3>
            <p className="font-jakarta text-sm text-gray-500 dark:text-white/60 mb-6 leading-relaxed">
              Thank you for helping keep the Ally community safe. We take all reports seriously and will investigate this post according to our Community Guidelines.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-[#1A6B3C] dark:bg-emerald-600 text-white font-jakarta font-semibold text-sm hover:opacity-95 transition-opacity"
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
                  <Flag size={16} className="text-red-500 dark:text-red-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-jakarta font-bold text-gray-900 dark:text-white text-sm">
                  Report Post
                </h3>
                <p className="font-jakarta text-xs text-gray-400 dark:text-gray-500 truncate">
                  Posted by {authorName} {authorHandle}
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

            {/* Post Snippet Preview */}
            <div className="px-5 pt-3 pb-2 bg-gray-50/70 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-1">
                Reported Content
              </p>
              <p className="text-xs text-gray-700 dark:text-white/80 line-clamp-2 italic">
                "{post.content ? post.content : (post.media && post.media.length > 0 ? `[Post with ${post.media.length} image(s)]` : 'Shared Post')}"
              </p>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              {submitState === 'error' && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/30 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  <span>{errorMessage || 'Failed to submit report. Please try again.'}</span>
                </div>
              )}

              {selectedViolation ? (
                <div className="space-y-4">
                  <div className="bg-[#1A6B3C]/5 dark:bg-emerald-500/10 border border-[#1A6B3C]/15 dark:border-emerald-500/20 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A6B3C] dark:text-emerald-400">
                        Selected Reason
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedViolation(null)}
                        className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-white/80 underline"
                      >
                        Change
                      </button>
                    </div>
                    <p className="font-jakarta font-bold text-sm text-gray-900 dark:text-white mt-1">
                      {selectedViolation.label}
                    </p>
                    <p className="font-jakarta text-xs text-gray-500 dark:text-white/60 mt-0.5">
                      {selectedViolation.description}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-white/70 mb-1.5">
                      Additional details for moderators (optional)
                    </label>
                    <textarea
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      rows={3}
                      placeholder="Provide any context that will help us evaluate this report..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#1A6B3C] dark:focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedViolation(null)}
                      disabled={submitState === 'loading'}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-600 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitState === 'loading'}
                      className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {submitState === 'loading' ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          Submitting…
                        </>
                      ) : (
                        'Submit Report'
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 dark:text-white/60 mb-2">
                    Why are you reporting this post? Select the category that best matches the issue.
                  </p>
                  {COMMUNITY_STANDARDS.map((category) => {
                    const isOpen = openCategoryId === category.id;
                    return (
                      <div
                        key={category.id}
                        className="rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden bg-white dark:bg-white/[0.02]"
                      >
                        <button
                          type="button"
                          onClick={() => toggleCategory(category.id)}
                          className="w-full flex items-center justify-between p-3.5 text-left hover:bg-gray-50/80 dark:hover:bg-white/[0.03] transition-colors"
                        >
                          <div>
                            <p className="font-jakarta font-semibold text-xs text-gray-900 dark:text-white">
                              {category.label}
                            </p>
                            <p className="font-jakarta text-[11px] text-gray-400 dark:text-white/40">
                              {category.description}
                            </p>
                          </div>
                          <ChevronDown
                            size={16}
                            className={cn(
                              'text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2',
                              isOpen && 'rotate-180 text-gray-700 dark:text-white'
                            )}
                          />
                        </button>

                        {isOpen && (
                          <div className="p-2 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.01] space-y-1">
                            {category.violations.map((violation) => (
                              <button
                                key={violation.id}
                                type="button"
                                onClick={() => setSelectedViolation(violation)}
                                className="w-full text-left p-2.5 rounded-xl hover:bg-white dark:hover:bg-white/10 hover:shadow-xs border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all"
                              >
                                <p className="font-jakarta font-medium text-xs text-gray-900 dark:text-white">
                                  {violation.label}
                                </p>
                                <p className="font-jakarta text-[11px] text-gray-400 dark:text-white/40">
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
          </>
        )}
      </div>
    </div>
  );
}
