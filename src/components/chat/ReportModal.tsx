import { useState } from 'react';
import { X, ChevronDown, ChevronLeft, Flag, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COMMUNITY_STANDARDS, ReportViolation } from '@/data/CommunityStandards';

interface ReportModalProps {
  participantName: string;
  participantId: string;
  onClose: () => void;
}

export function ReportModal({ participantName, participantId, onClose }: ReportModalProps) {
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);
  const [selectedViolation, setSelectedViolation] = useState<ReportViolation | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const toggleCategory = (categoryId: string) => {
    setOpenCategoryId((prev) => (prev === categoryId ? null : categoryId));
  };

  const handleSubmit = () => {
    if (!selectedViolation) return;
    // TODO: wire to real report submission (API call)
    console.log('Report submitted (placeholder):', {
      reportedUser: participantId,
      violationId: selectedViolation.id,
    });
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Modal card */}
      <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {submitted ? (
          <ReportConfirmation participantName={participantName} onClose={onClose} />
        ) : (
          <>
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
              {selectedViolation ? (
                <button
                  onClick={() => setSelectedViolation(null)}
                  className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                  aria-label="Back to categories"
                >
                  <ChevronLeft size={18} />
                </button>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                  <Flag size={16} className="text-red-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-jakarta font-bold text-gray-900 text-sm">
                  Report {participantName}
                </h3>
                <p className="font-jakarta text-xs text-gray-400">
                  {selectedViolation ? 'Confirm your report reason' : 'What\u2019s going on?'}
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
            <div className="flex-1 overflow-y-auto p-4">
              {selectedViolation ? (
                <div>
                  <div className="bg-[#1A6B3C]/5 border border-[#1A6B3C]/15 rounded-2xl p-4 mb-4">
                    <p className="font-jakarta font-semibold text-sm text-gray-900">
                      {selectedViolation.label}
                    </p>
                    <p className="font-jakarta text-xs text-gray-500 mt-1 leading-relaxed">
                      {selectedViolation.description}
                    </p>
                  </div>
                  <p className="font-jakarta text-xs text-gray-400 leading-relaxed px-1">
                    Our team will review this report. {participantName} won't be notified
                    that you submitted it.
                  </p>
                </div>
              ) : (
                <CategoryAccordion
                  openCategoryId={openCategoryId}
                  onToggleCategory={toggleCategory}
                  onSelectViolation={setSelectedViolation}
                />
              )}
            </div>

            {/* Footer */}
            {selectedViolation && (
              <div className="p-4 border-t border-gray-100 flex-shrink-0">
                <button
                  onClick={handleSubmit}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-jakarta font-semibold text-sm py-3 rounded-xl transition-colors"
                >
                  Submit Report
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Grouped report reasons: each category expands to reveal its specific
// violations, directly under that category (proximity grouping) rather
// than a single flat list of every violation across all categories.
function CategoryAccordion({
  openCategoryId,
  onToggleCategory,
  onSelectViolation,
}: {
  openCategoryId: string | null;
  onToggleCategory: (categoryId: string) => void;
  onSelectViolation: (violation: ReportViolation) => void;
}) {
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100">
      {COMMUNITY_STANDARDS.map((category) => {
        const isOpen = openCategoryId === category.id;
        return (
          <div key={category.id}>
            <button
              onClick={() => onToggleCategory(category.id)}
              className="w-full flex items-center gap-2 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-jakarta font-semibold text-sm text-gray-900">
                  {category.label}
                </p>
                <p className="font-jakarta text-[11px] text-gray-400 leading-snug mt-0.5">
                  {category.description}
                </p>
              </div>
              <ChevronDown
                size={15}
                className={cn("text-gray-300 flex-shrink-0 transition-transform", isOpen && "rotate-180")}
              />
            </button>

            {/* Violations nested directly under their parent category —
                visually grouped, only ever one category open at a time. */}
            {isOpen && (
              <div className="bg-gray-50/60 px-3 pb-2">
                {category.violations.map((violation) => (
                  <button
                    key={violation.id}
                    onClick={() => onSelectViolation(violation)}
                    className="w-full text-left px-3 py-2.5 rounded-xl mb-1 hover:bg-white transition-colors"
                  >
                    <p className="font-jakarta text-sm text-gray-800 font-medium">
                      {violation.label}
                    </p>
                    <p className="font-jakarta text-[11px] text-gray-400 mt-0.5 leading-snug">
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
  );
}

function ReportConfirmation({ participantName, onClose }: { participantName: string; onClose: () => void }) {
  return (
    <div className="p-8 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
        <CheckCircle2 size={26} className="text-emerald-500" />
      </div>
      <h3 className="font-jakarta font-bold text-gray-900 mb-1">Report submitted</h3>
      <p className="font-jakarta text-sm text-gray-500 leading-relaxed mb-6">
        Thanks for letting us know. Our team will review your report about {participantName}.
      </p>
      <button
        onClick={onClose}
        className="w-full bg-[#1A6B3C] hover:bg-[#15592F] text-white font-jakarta font-semibold text-sm py-3 rounded-xl transition-colors"
      >
        Done
      </button>
    </div>
  );
}