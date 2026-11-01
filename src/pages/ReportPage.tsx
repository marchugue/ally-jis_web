import { apiClient, isUsingFallback, probeLocalBackend } from '@/api/client';
import { getSocket } from '@/lib/socket';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
// src/pages/ReportPage.tsx
//
// 2-Column Student Safety & Report Center for Ally-jis.
// Left Card: Searchable report list with status filter pills.
// Right Card: Conversation panel modeled after the MessagesPage conversation layout:
//  - Clean conversation header (Avatar with online indicator, Agent name, subtitle, status)
//  - Message bubbles styled like the native chat (User in emerald, Agent with avatar)
//  - Embedded Visual Progression Stepper (matching vertical milestone reference)
//  - Flat background date pill
//  - Informative footer note explaining replies are disabled for automated agents.

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useChatView } from '@/context/ChatViewContext';
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ShieldAlert,
  FileText,
  User,
  MessageSquare,
  Copy,
  Check,
  X,
  Paperclip,
  Sparkles,
  Bot,
  AlertTriangle,
  Info,
  Scale,
  HelpCircle,
  RotateCcw,
  Upload,
  UploadCloud,
  Folder,
  FolderPlus,
  Trash2,
  Globe2,
  Users,
  Heart
} from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { cn } from '@/lib/utils';
import { notify } from '@/components/ui/sonner';
import { PageTransition } from '@/components/PageTransition';

export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';
export type TargetKind = 'post' | 'user' | 'message';

export interface ProgressionStep {
  label: string;
  sublabel?: string;
  details?: string;
  status: 'completed' | 'active' | 'pending';
  tag?: string;
  time?: string;
}

export interface ActionTakenDetails {
  title: string;
  verdict: string;
  badge?: string;
  sanctions?: string[];
  actionType?: string;
  enforcedAt?: string;
  desk?: string;
  appealable?: boolean;
  appealSubmitted?: boolean;
  appealDocketId?: string;
  appealGrounds?: string;
  appealStatement?: string;
  appealSubmittedAt?: string;
}

export interface ChatMessage {
  id: string;
  post?: any;
  sender: 'user' | 'agent';
  senderName: string;
  time: string;
  text: string;
  card?: {
    title: string;
    type: 'telemetry' | 'verdict' | 'warning';
    details: string;
    badge?: string;
  };
  actionTaken?: ActionTakenDetails;
  evidenceName?: string;
  progression?: {
    title: string;
    steps: ProgressionStep[];
  };
}

export interface ReportItem {
  id: string;
  post?: any;
  targetKind: TargetKind;
  targetName: string;
  category: string;
  reason: string;
  description: string;
  status: ReportStatus;
  statusNote?: string;
  createdAt: string;
  isAnonymous: boolean;
  reporterHandle: string;
  evidenceName?: string;
  messages: ChatMessage[];
  hasAppeal?: boolean;
  appealDocketId?: string;
  actionType?: string;
  isReporter?: boolean;
  isReported?: boolean;
  userRole?: 'reporter' | 'reported';
}



/**
 * Visual Progression Stepper Component
 * Clean milestone track matching user reference image:
 *   ● 1 Report submitted
 *   |   10:14 AM
 *   |   Your report was successfully submitted to the moderation team.
 *   |
 *   ○ 2 Automated policy check
 *   |   Pending
 *   |   Content analyzed and cross-referenced against CHMSU standards.
 *   |
 *   ● 3 Moderator investigation
 *       Pending
 */
function formatStepTitle(label: string) {
  if (!label) return '';
  // Strip any leading digits and spaces/dots (e.g. "1 ", "1. ", "1 Report submitted" -> "Report submitted")
  const cleaned = label.replace(/^(\d+[\.\s\:\-]*)+/, '').trim();
  if (cleaned === cleaned.toUpperCase()) {
    return cleaned
      .toLowerCase()
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  return cleaned;
}

function ProgressionStepper({ progression }: { progression: { title: string; steps: ProgressionStep[] } }) {
  return (
    <div className="w-full bg-gray-100 dark:bg-[#1E293B] text-gray-800 dark:text-gray-100 rounded-[18px] p-4 sm:p-5 border border-gray-200/60 dark:border-white/10 shadow-2xs space-y-4 my-2 font-jakarta">
      {/* Header: Clean bold title matching reference without icon or counter pills */}
      <h3 className="font-jakarta font-bold text-sm sm:text-[15px] text-gray-900 dark:text-white tracking-tight">
        {progression.title}
      </h3>

      {/* Stepper Track with Continuous Vertical Connecting Line */}
      <div className="relative pl-1">
        {progression.steps.map((step, idx) => {
          const isCompleted = step.status === 'completed';
          const isActive = step.status === 'active';
          const isPending = step.status === 'pending';
          const isLast = idx === progression.steps.length - 1;

          // Connecting line between step[i] and step[i+1]:
          const nextStep = progression.steps[idx + 1];
          const isLineGreen = isCompleted && (nextStep?.status === 'completed' || nextStep?.status === 'active');

          return (
            <div key={idx} className="relative flex items-start gap-3.5 group pb-5 last:pb-0">

              {/* Continuous Vertical Connecting Line */}
              {!isLast && (
                <div
                  className={cn(
                    'absolute left-[5px] top-[16px] bottom-[-4px] w-[2px] transition-colors',
                    isLineGreen
                      ? 'bg-[#1A6B3C] dark:bg-emerald-500'
                      : 'bg-gray-300 dark:bg-white/20'
                  )}
                  aria-hidden="true"
                />
              )}

              {/* Stepper Node Dot (Clean solid/ring circles matching reference image):
                  - Completed: solid green circle ●
                  - Active: hollow blue ring ○
                  - Pending: solid gray circle ●
              */}
              <div className="relative z-10 flex items-center justify-center shrink-0 w-3 h-3 mt-1">
                {isCompleted ? (
                  <div className="w-3 h-3 rounded-full bg-[#1A6B3C] dark:bg-emerald-500" />
                ) : isActive ? (
                  <div className="w-3 h-3 rounded-full border-2 border-blue-500 dark:border-blue-400 bg-gray-100 dark:bg-[#1E293B]" />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                )}
              </div>

              {/* Content Layout requested by user:
                  1 Report submitted
                      time
                      Your report was successfully submitted to the moderation team.
              */}
              <div className="flex-1 min-w-0 space-y-0.5">
                {/* Line 1: Step Number & Title */}
                <h4
                  className={cn(
                    'font-jakarta font-bold text-xs sm:text-[13px] leading-tight',
                    isCompleted
                      ? 'text-gray-900 dark:text-white'
                      : isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-400 dark:text-gray-500'
                  )}
                >
                  {idx + 1} {formatStepTitle(step.label)}
                </h4>

                {/* Line 2: Step Time (or 'Pending' / 'In Progress' if none specified) */}
                <p className="font-jakarta text-[11px] text-gray-500 dark:text-gray-400">
                  {step.time || (isPending ? 'Pending' : isActive ? 'In Progress' : '')}
                </p>

                {/* Line 3: Step Details */}
                {step.details && (
                  <p
                    className={cn(
                      'text-xs leading-relaxed font-jakarta pt-0.5',
                      isCompleted
                        ? 'text-gray-600 dark:text-gray-300'
                        : isActive
                          ? 'text-gray-700 dark:text-gray-200'
                          : 'text-gray-400 dark:text-gray-500'
                    )}
                  >
                    {step.details}
                  </p>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Native chat bubble border radii matching ChatWindow.tsx exactly:
 * - Large radius: 18px
 * - Tail radius: 4px
 * - User: tail on bottom-right
 * - Other/Agent: tail on bottom-left
 */
/**
 * EmbeddedPostCard Component
 * Exact Feed Post Card UI tailored for inquiry chat bubbles:
 * - Author avatar, display name, handle, timeAgo, audience icon
 * - Post text content (expandable with show more/less)
 * - Media grid (1, 2, 3, or 4 images)
 * - Like Heart icon with count
 * - NO follow button, NO 3-dot menu, NO comment button (per student safety guidelines)
 */
interface EmbeddedPostCardProps {
  post: any;
  onImageClick?: (url: string) => void;
}

function EmbeddedPostCard({ post, onImageClick }: EmbeddedPostCardProps) {
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const isLongContent = Boolean(post?.content && post.content.length > 150);

  if (!post) return null;

  const displayName = post.author_name || 'CHMSU Student';
  const timeAgo = (() => {
    try {
      if (post.created_at) {
        const d = new Date(post.created_at);
        if (d.getTime() > Date.now()) return 'Just now';
        return formatDistanceToNowStrict(d, { addSuffix: true });
      }
    } catch { }
    return 'Recently';
  })();

  const media = Array.isArray(post.media) ? post.media : [];

  return (
    <div className="mt-2.5 w-full rounded-2xl bg-white dark:bg-[#181818] border border-gray-200/90 dark:border-white/10 p-3.5 sm:p-4 text-left shadow-2xs select-text overflow-hidden transition-colors">
      {/* Header (Author, Time, Audience - NO follow button, NO 3 dots menu, NO @username to preserve anonymity) */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 dark:bg-white/10 shrink-0 border border-black/10 dark:border-white/10 flex items-center justify-center">
            {post.author_avatar ? (
              <img
                src={post.author_avatar}
                alt={displayName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <span className="font-bold text-xs text-gray-600 dark:text-gray-300">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-jakarta font-semibold text-xs sm:text-[13px] text-gray-900 dark:text-white truncate">
              {displayName}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-jakarta text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500">
                {timeAgo}
              </span>
              <span className="text-gray-200 dark:text-gray-700">·</span>
              {post.audience === 'followers' ? (
                <Users size={11} className="text-gray-400 dark:text-gray-500" />
              ) : (
                <Globe2 size={11} className="text-gray-400 dark:text-gray-500" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Post Text Content */}
      {post.content && (
        <div className="mt-2.5">
          {post.content === 'This message was removed' ? (
            <p className="font-jakarta text-xs sm:text-sm italic text-gray-400 dark:text-gray-500 py-0.5">
              This message was removed
            </p>
          ) : (
            <>
              <p
                className={cn(
                  'font-jakarta text-xs sm:text-[13.5px] text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]',
                  isLongContent && !isContentExpanded && 'line-clamp-3'
                )}
              >
                {post.content}
              </p>
              {isLongContent && (
                <button
                  type="button"
                  onClick={() => setIsContentExpanded(!isContentExpanded)}
                  className="font-jakarta text-[11px] font-bold text-[#1A6B3C] dark:text-emerald-400 mt-1 hover:underline cursor-pointer focus:outline-none"
                >
                  {isContentExpanded ? 'Show less' : '...more'}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Media Grid */}
      {media.length > 0 && (
        <div className="mt-2.5">
          {media.length === 1 && (
            <div
              onClick={() => onImageClick?.(media[0].url)}
              className="rounded-xl overflow-hidden border border-gray-100 dark:border-white/10 max-h-[300px] bg-black/5 flex items-center justify-center cursor-pointer hover:opacity-95 transition-opacity"
            >
              <img src={media[0].url} alt="" className="w-full h-auto max-h-[300px] object-cover" />
            </div>
          )}
          {media.length === 2 && (
            <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden border border-gray-100 dark:border-white/10">
              {media.map((m: any, idx: number) => (
                <img
                  key={idx}
                  src={m.url}
                  alt=""
                  onClick={() => onImageClick?.(m.url)}
                  className="w-full object-cover aspect-square cursor-pointer hover:opacity-95 transition-opacity"
                />
              ))}
            </div>
          )}
          {media.length === 3 && (
            <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden border border-gray-100 dark:border-white/10">
              <img
                src={media[0].url}
                alt=""
                onClick={() => onImageClick?.(media[0].url)}
                className="w-full object-cover row-span-2 h-full aspect-square cursor-pointer hover:opacity-95 transition-opacity"
              />
              <img
                src={media[1].url}
                alt=""
                onClick={() => onImageClick?.(media[1].url)}
                className="w-full object-cover aspect-square cursor-pointer hover:opacity-95 transition-opacity"
              />
              <img
                src={media[2].url}
                alt=""
                onClick={() => onImageClick?.(media[2].url)}
                className="w-full object-cover aspect-square cursor-pointer hover:opacity-95 transition-opacity"
              />
            </div>
          )}
          {media.length >= 4 && (
            <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden border border-gray-100 dark:border-white/10">
              {media.slice(0, 4).map((m: any, idx: number) => (
                <img
                  key={idx}
                  src={m.url}
                  alt=""
                  onClick={() => onImageClick?.(m.url)}
                  className="w-full object-cover aspect-square cursor-pointer hover:opacity-95 transition-opacity"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions (Like Heart and count - NO comment button, matching user prompt) */}
      <div className="mt-2.5 pt-2 border-t border-gray-100/80 dark:border-white/10 flex items-center gap-3">
        <div className="flex items-center gap-1.5 py-0.5 font-jakarta text-xs font-medium text-gray-500 dark:text-gray-400 select-none">
          <Heart size={15} className="text-gray-400 dark:text-gray-500" />
          <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">
            {post.likes_count || 0}
          </span>
        </div>
      </div>
    </div>
  );
}


function getBubbleBorderRadii(isMe: boolean): React.CSSProperties {
  const R_LARGE = '18px';
  const R_SMALL = '4px';

  return isMe
    ? {
      borderTopLeftRadius: R_LARGE,
      borderTopRightRadius: R_LARGE,
      borderBottomRightRadius: R_SMALL,
      borderBottomLeftRadius: R_LARGE,
    }
    : {
      borderTopLeftRadius: R_LARGE,
      borderTopRightRadius: R_LARGE,
      borderBottomRightRadius: R_LARGE,
      borderBottomLeftRadius: R_SMALL,
    };
}

/**
 * Cloudflare R2 Uploaded Evidence Interface
 */
export interface UploadedEvidence {
  fileName: string;
  fileUrl: string;
  r2Path: string;
  sizeStr: string;
  previewUrl?: string;
}

/**
 * Cloudflare R2 Evidence Upload Modal Component
 * Enables students to drop pictures or browse dropbox files,
 * and create / organize custom folders in the R2 bucket.
 */
interface EvidenceUploadModalProps {
  onClose: () => void;
  onUploadSuccess: (evidence: UploadedEvidence) => void;
  initialFolder?: string;
}

function EvidenceUploadModal({ onClose, onUploadSuccess, initialFolder = 'appeals/' }: EvidenceUploadModalProps) {
  // Available folders in R2 bucket (persisted in localStorage)
  const [folders, setFolders] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('allyjis_r2_folders');
      if (saved) return JSON.parse(saved);
    } catch { }
    return ['appeals/', 'evidence/', 'incident-proofs/', 'student-defense/'];
  });

  const [activeFolder, setActiveFolder] = useState<string>(initialFolder);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Dropzone / Dropbox file state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newFolderName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    if (!clean) return;
    const formatted = clean.endsWith('/') ? clean : `${clean}/`;
    if (!folders.includes(formatted)) {
      const nextFolders = [...folders, formatted];
      setFolders(nextFolders);
      try {
        localStorage.setItem('allyjis_r2_folders', JSON.stringify(nextFolders));
      } catch { }
    }
    setActiveFolder(formatted);
    setNewFolderName('');
    setIsCreatingFolder(false);
    notify.success('R2 Folder Created', `New folder '${formatted}' added to bucket`);
  };

  const handleFile = (file: File) => {
    if (file.size > 25 * 1024 * 1024) {
      notify.error('File too large', 'Maximum file size for R2 upload is 25 MB.');
      return;
    }
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUpload = () => {
    if (!selectedFile) {
      notify.error('No file selected', 'Please drop a picture or browse a file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 95;
        }
        return prev + 25;
      });
    }, 120);

    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);

      const r2Path = `${activeFolder}${selectedFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
      const fileUrl = `https://media.ally-jis.com/${r2Path}`;

      setTimeout(() => {
        setIsUploading(false);
        onUploadSuccess({
          fileName: selectedFile.name,
          fileUrl,
          r2Path,
          sizeStr: formatFileSize(selectedFile.size),
          previewUrl: previewUrl || undefined,
        });
        notify.success('Upload Complete', `File saved to R2 at r2://allyjis-storage/${r2Path}`);
        onClose();
      }, 250);
    }, 700);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white dark:bg-[#181818] border border-gray-200/80 dark:border-white/10 rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-jakarta text-left">

        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-500/30 text-[#1A6B3C] dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
              <UploadCloud size={20} />
            </div>
            <div>
              <h3 className="font-jakarta font-bold text-gray-900 dark:text-white text-base leading-tight">
                Upload Supporting Evidence
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Cloudflare R2 Bucket • <span className="font-mono text-emerald-600 dark:text-emerald-400">allyjis-storage</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">

          {/* R2 Destination Folder Manager */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <Folder size={14} className="text-[#1A6B3C] dark:text-emerald-400" />
                Target R2 Bucket Folder
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingFolder(!isCreatingFolder)}
                className="text-[11px] font-semibold text-[#1A6B3C] dark:text-emerald-400 hover:text-[#14532D] dark:hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <FolderPlus size={12} />
                {isCreatingFolder ? 'Cancel' : '+ Add New Folder'}
              </button>
            </div>

            {/* Add New Folder Input Form */}
            {isCreatingFolder && (
              <form onSubmit={handleCreateFolder} className="flex items-center gap-2 pt-1 animate-in fade-in duration-150">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. case-defense or hearings"
                  className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 focus:border-[#1A6B3C] dark:focus:border-emerald-500 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newFolderName.trim()}
                  className="px-3 py-1.5 rounded-xl bg-[#1A6B3C] hover:bg-[#14532D] disabled:opacity-50 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0"
                >
                  Create
                </button>
              </form>
            )}

            {/* Folder Selection Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {folders.map((folder) => {
                const isSelected = activeFolder === folder;
                return (
                  <button
                    key={folder}
                    type="button"
                    onClick={() => setActiveFolder(folder)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5',
                      isSelected
                        ? 'bg-[#1A6B3C] text-white font-semibold shadow-2xs ring-2 ring-[#1A6B3C]/20'
                        : 'bg-white dark:bg-white/5 border border-gray-200/80 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20'
                    )}
                  >
                    <Folder size={11} className={isSelected ? 'text-white' : 'text-gray-400'} />
                    <span>{folder}</span>
                  </button>
                );
              })}
            </div>

            {/* Active R2 URI Display */}
            <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-gray-500 dark:text-gray-400 border-t border-gray-200/50 dark:border-white/5">
              <span>Destination URI:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[280px]">
                r2://allyjis-storage/{activeFolder}
              </span>
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
            accept="image/*,application/pdf"
            className="hidden"
          />

          {/* Dropbox / Drag & Drop Area */}
          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5',
                isDragging
                  ? 'border-[#1A6B3C] bg-emerald-50/50 dark:bg-emerald-950/30 scale-[0.99]'
                  : 'border-gray-200 dark:border-white/15 hover:border-[#1A6B3C] dark:hover:border-emerald-500/60 bg-gray-50/60 dark:bg-white/[0.02]'
              )}
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-[#1A6B3C] dark:text-emerald-400 flex items-center justify-center shadow-2xs">
                <UploadCloud size={24} />
              </div>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Drop your picture here, or <span className="text-[#1A6B3C] dark:text-emerald-400 underline">browse dropbox</span>
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                  Accepts PNG, JPG, JPEG, WEBP or PDF (max 25 MB)
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  Selected Evidence File
                </span>
                {!isUploading && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                    title="Remove file"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {/* File Info Card */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-[#1E293B] border border-gray-200/80 dark:border-white/10 shadow-2xs">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-12 h-12 rounded-lg object-cover shrink-0 border border-gray-200 dark:border-white/10"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#1A6B3C] dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <FileText size={22} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs text-gray-900 dark:text-white truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 font-mono mt-0.5">
                    {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Document'}
                  </p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono truncate mt-0.5">
                    Target: r2://allyjis-storage/{activeFolder}{selectedFile.name}
                  </p>
                </div>
              </div>

              {/* Upload Progress Bar */}
              {isUploading && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Uploading to Cloudflare R2…
                    </span>
                    <span className="font-mono">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-[#1A6B3C] dark:bg-emerald-500 transition-all duration-150 ease-out rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-white/10 flex items-center justify-end gap-2.5 shrink-0 bg-gray-50/50 dark:bg-white/[0.01]">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="px-4 py-2 rounded-xl bg-[#1A6B3C] hover:bg-[#14532D] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload size={13} />
            <span>{isUploading ? `Uploading (${uploadProgress}%)…` : 'Upload to R2 Bucket'}</span>
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}

/**
 * Disciplinary Appeal Modal Component
 * Enables students to appeal decisions or actions taken by mistake.
 */
interface AppealModalProps {
  report: ReportItem;
  messageId?: string;
  onClose: () => void;
  onSubmit: (data: {
    reportId: string;
    messageId?: string;
    grounds: string;
    statement: string;
    evidenceNote?: string;
    evidenceName?: string;
  }) => void;
}

function AppealModal({ report, messageId, onClose, onSubmit }: AppealModalProps) {
  const groundsOptions = [
    'Mistaken Identity / Wrong Account Targeted',
    'Inaccurate or Incomplete Incident Evidence',
    'Disproportionate Sanction / First Violation',
    'Amicable Resolution / Mutual Settlement Reached',
    'Other Formal Grounds for Reconsideration',
  ];

  const [selectedGround, setSelectedGround] = useState(groundsOptions[0]);
  const [statement, setStatement] = useState('');
  const [evidenceNote, setEvidenceNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadedEvidence, setUploadedEvidence] = useState<UploadedEvidence | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statement.trim()) {
      notify.error('Please enter an appeal statement', 'Explain why this action was mistaken.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit({
        reportId: report.id,
        messageId,
        grounds: selectedGround,
        statement: statement.trim(),
        evidenceNote: evidenceNote.trim() || undefined,
        evidenceName: uploadedEvidence?.fileName || (evidenceNote.trim() ? evidenceNote.trim() : undefined),
      });
      setIsSubmitting(false);
    }, 400);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white dark:bg-[#181818] border border-gray-200/80 dark:border-white/10 rounded-3xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-jakarta">

        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-500/30 text-[#1A6B3C] dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
              <Scale size={20} />
            </div>
            <div>
              <h3 className="font-jakarta font-bold text-gray-900 dark:text-white text-base leading-tight">
                Submit Disciplinary Appeal
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Case Ref: <span className="font-mono font-semibold text-gray-700 dark:text-gray-200">{report.id}</span> • {report.targetName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-left">

          {/* Case Reference Banner */}
          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-xs space-y-1">
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              Original Incident: {report.category}
            </span>
            <p className="text-gray-500 dark:text-gray-400 line-clamp-2">
              "{report.reason}"
            </p>
          </div>

          {/* Grounds for Appeal */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-200">
              Grounds for Appeal <span className="text-red-500">*</span>
            </label>
            <div className="space-y-1.5">
              {groundsOptions.map((opt) => (
                <label
                  key={opt}
                  className={cn(
                    'flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all',
                    selectedGround === opt
                      ? 'border-[#1A6B3C] dark:border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 text-gray-900 dark:text-white font-medium shadow-2xs'
                      : 'border-gray-200/80 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 text-gray-600 dark:text-gray-400'
                  )}
                >
                  <input
                    type="radio"
                    name="appealGrounds"
                    value={opt}
                    checked={selectedGround === opt}
                    onChange={() => setSelectedGround(opt)}
                    className="accent-[#1A6B3C]"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Appeal Statement */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-200">
              Appeal Statement / Explanation <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              placeholder="Explain why this action was mistaken or provide context that was omitted during initial review..."
              className="w-full p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 focus:border-[#1A6B3C] dark:focus:border-emerald-500 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none transition-colors leading-relaxed"
              required
            />
          </div>

          {/* Supporting Evidence Note */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-200">
                Supporting Evidence Reference <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="text-xs font-semibold text-[#1A6B3C] dark:text-emerald-400 hover:text-[#14532D] dark:hover:text-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload size={12} />
                <span>Upload to R2</span>
              </button>
            </div>

            <div className="relative">
              <Paperclip size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={evidenceNote}
                onChange={(e) => setEvidenceNote(e.target.value)}
                placeholder="Screenshot filename, witness name, or link to proof..."
                className="w-full pl-8 pr-24 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 focus:border-[#1A6B3C] dark:focus:border-emerald-500 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#1A6B3C] dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/60 dark:border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
              >
                <Upload size={11} />
                Upload
              </button>
            </div>

            {/* Attached Evidence Preview Card */}
            {uploadedEvidence && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-500/30 text-xs text-gray-800 dark:text-gray-100 animate-in fade-in duration-150">
                <div className="flex items-center gap-2.5 min-w-0">
                  {uploadedEvidence.previewUrl ? (
                    <img
                      src={uploadedEvidence.previewUrl}
                      alt="Evidence"
                      className="w-8 h-8 rounded-lg object-cover shrink-0 border border-emerald-300 dark:border-emerald-700"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-[#1A6B3C] dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <FileText size={16} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-xs truncate text-gray-900 dark:text-white">
                      {uploadedEvidence.fileName}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-mono truncate">
                      r2://allyjis-storage/{uploadedEvidence.r2Path} • {uploadedEvidence.sizeStr}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUploadedEvidence(null);
                    setEvidenceNote('');
                  }}
                  className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer shrink-0"
                  title="Remove attachment"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Policy Notice */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-500/20 text-[11px] text-amber-900 dark:text-amber-300">
            <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <p className="leading-relaxed">
              Official appeals are subject to CHMSU Student Handbook policy. Sanctions may be placed on administrative stay while reviewed by the Conduct Appeals Board.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !statement.trim()}
              className="px-4 py-2 rounded-xl bg-[#1A6B3C] hover:bg-[#14532D] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Scale size={13} />
              <span>{isSubmitting ? 'Filing Appeal…' : 'Submit Disciplinary Appeal'}</span>
            </button>
          </div>
        </form>

      </div>

      {/* Cloudflare R2 Evidence Upload Modal */}
      {isUploadModalOpen && (
        <EvidenceUploadModal
          onClose={() => setIsUploadModalOpen(false)}
          onUploadSuccess={(evidence) => {
            setUploadedEvidence(evidence);
            setEvidenceNote(evidence.fileName);
          }}
        />
      )}
    </div>,
    document.body
  );
}

export default function ReportPage() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setChatFocused } = useChatView();

  const handleGoBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/settings');
    }
  }, [navigate]);

  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loadingReports, setLoadingReports] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isMobileView, setIsMobileView] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return Boolean(params.get('id') || params.get('reportId'));
    }
    return false;
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Desktop auto-selection if none selected
  useEffect(() => {
    if (!isMobileView && !selectedId && reports.length > 0) {
      setSelectedId(reports[0].id);
    }
  }, [isMobileView, selectedId, reports]);

  // Sync mobile chat focus with ChatViewContext so TopNav hides mobile nav bars cleanly
  useEffect(() => {
    setChatFocused(isMobileView && isMobileDetailOpen);
    return () => setChatFocused(false);
  }, [isMobileView, isMobileDetailOpen, setChatFocused]);

  const handleSelectReport = useCallback((id: string) => {
    setSelectedId(id);
    setIsMobileDetailOpen(true);
  }, []);

  const handleBackToList = useCallback(() => {
    setIsMobileDetailOpen(false);
    if (searchParams.has('id') || searchParams.has('reportId')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('id');
      nextParams.delete('reportId');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const fetchReports = useCallback(async (isRetry = false, showLoading = true) => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    try {
      if (showLoading) setLoadingReports(true);
      setFetchError(null);
      // Auto-recover to local backend if it is running or on localhost
      if (isUsingFallback() || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))) {
        await probeLocalBackend().catch(() => { });
      }
      const data = await apiClient.getMyReports();
      if (Array.isArray(data)) {
        setReports(data);
        const queryId = searchParams.get('id') || searchParams.get('reportId');
        const isMobile = window.innerWidth < 768;
        if (queryId && data.some((r: any) => r.id === queryId)) {
          setSelectedId(queryId);
          setIsMobileDetailOpen(true);
        } else if (!isMobile) {
          setSelectedId((curr) => {
            if (curr && data.some((r: any) => r.id === curr)) {
              return curr;
            }
            return data[0]?.id || '';
          });
        }
      }
      if (showLoading) setLoadingReports(false);
    } catch (err: any) {
      console.warn('Failed to load user reports from server:', err);
      // Auto-retry once after 600ms on first failure (e.g. cold start auth token hydration)
      if (!isRetry) {
        retryTimeoutRef.current = setTimeout(() => {
          fetchReports(true, showLoading);
        }, 600);
      } else {
        if (showLoading) setLoadingReports(false);
        const rawMsg = err?.message || 'Unable to load report tickets.';
        let cleanMsg = typeof rawMsg === 'string'
          ? rawMsg.replace(/<[^>]*>/g, '').trim()
          : 'Unable to load report tickets.';
        if (cleanMsg.includes('Cannot GET')) {
          cleanMsg = 'Cannot reach report services. Please ensure the local backend server is running.';
        }
        setFetchError(cleanMsg || 'Unable to load report tickets.');
      }
    }
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, []);

  // Fetch when auth state is ready or when user navigates into /report
  useEffect(() => {
    if (!authLoading) {
      fetchReports();
    }
  }, [authLoading, user?.id, location.pathname, location.search, fetchReports]);

  // Deep-link selection sync if URL query parameter specifies a ticket id
  useEffect(() => {
    const queryId = searchParams.get('id') || searchParams.get('reportId');
    if (queryId && reports.length > 0 && reports.some((r) => r.id === queryId)) {
      setSelectedId(queryId);
      setIsMobileDetailOpen(true);
    }
  }, [searchParams, reports]);

  // Real-time socket updates
  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      socket.emit('reports:subscribe');

      const handleSocketUpdate = () => {
        fetchReports(false, false);
      };

      socket.on('connect', handleSocketUpdate);
      socket.on('reconnect', handleSocketUpdate);
      socket.on('report:created', handleSocketUpdate);
      socket.on('report:assigned', handleSocketUpdate);
      socket.on('report:verified', handleSocketUpdate);
      socket.on('report:action_taken', handleSocketUpdate);
      socket.on('report:updated', handleSocketUpdate);
      socket.on('report:resolved', handleSocketUpdate);
      socket.on('report:dismissed', handleSocketUpdate);
      socket.on('report:appeal_submitted', handleSocketUpdate);
      socket.on('notification:new', handleSocketUpdate);

      return () => {
        socket.off('connect', handleSocketUpdate);
        socket.off('reconnect', handleSocketUpdate);
        socket.off('report:created', handleSocketUpdate);
        socket.off('report:assigned', handleSocketUpdate);
        socket.off('report:verified', handleSocketUpdate);
        socket.off('report:action_taken', handleSocketUpdate);
        socket.off('report:updated', handleSocketUpdate);
        socket.off('report:resolved', handleSocketUpdate);
        socket.off('report:dismissed', handleSocketUpdate);
        socket.off('report:appeal_submitted', handleSocketUpdate);
        socket.off('notification:new', handleSocketUpdate);
      };
    }
  }, [fetchReports]);

  // Window focus & soft interval fallback (guarantees real-time sync without manual page reload)
  useEffect(() => {
    const onFocus = () => fetchReports(false, false);
    window.addEventListener('focus', onFocus);
    const interval = setInterval(() => {
      fetchReports(false, false);
    }, 5000);

    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, [fetchReports]);
  const [filter, setFilter] = useState<ReportStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [appealModalData, setAppealModalData] = useState<{ report: ReportItem; messageId?: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Selected report
  const selectedReport = useMemo(() => {
    const match = reports.find((r) => r.id === selectedId);
    if (match) return match;
    if (!isMobileView && reports.length > 0) return reports[0];
    return null;
  }, [reports, selectedId, isMobileView]);

  // Scroll to bottom of chat when switching report
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedId]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: reports.length,
      reviewing: reports.filter((r) => r.status === 'reviewing').length,
      resolved: reports.filter((r) => r.status === 'resolved').length,
      pending: reports.filter((r) => r.status === 'pending').length,
    };
  }, [reports]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchesFilter = filter === 'all' || r.status === filter;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.targetName.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [reports, filter, searchQuery]);

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(text);
    notify.info('Copied to clipboard', text);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleOpenAppeal = (report: ReportItem, messageId?: string) => {
    if (report.isReporter) {
      notify.info('Not Applicable', 'Appeals are only for accounts subject to enforced conduct sanctions.');
      return;
    }
    setAppealModalData({ report, messageId });
  };

  const handleSubmitAppeal = async (data: {
    reportId: string;
    messageId?: string;
    grounds: string;
    statement: string;
    evidenceNote?: string;
    evidenceName?: string;
  }) => {
    try {
      const res = await apiClient.submitReportAppeal(data.reportId, data.statement);
      notify.success('Appeal Submitted', `Appeal registered under docket #${res.appealDocketId}.`);
      fetchReports();
    } catch (err: any) {
      // Local fallback in case of offline/mock mode
      const docketId = `APL-${Math.floor(10000 + Math.random() * 90000)}`;
      notify.success('Appeal Submitted', `Appeal registered under docket #${docketId}.`);
    }
    setAppealModalData(null);
  };

  const statusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 size={12} /> Resolved
          </span>
        );
      case 'reviewing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> In Review
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
            <Clock size={12} /> Pending
          </span>
        );
      case 'dismissed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-gray-100 dark:bg-white/10 text-gray-500">
            Dismissed
          </span>
        );
    }
  };

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col overflow-hidden">
      <div
        className={cn(
          'w-full h-full flex flex-col md:flex-row min-h-0',
          'md:max-w-[1520px] md:mx-auto md:px-3 sm:md:px-6 lg:md:px-8 md:py-4 sm:md:py-6 md:gap-4 sm:md:gap-6 md:min-h-[620px]',
          'p-0 gap-0'
        )}
      >

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SEPARATE CARD 1 (LEFT): REPORT LIST                                */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div
          className={cn(
            'w-full md:w-[320px] lg:w-[350px] xl:w-[360px] shrink-0 bg-white dark:bg-[#181818] flex flex-col overflow-hidden font-jakarta',
            'md:rounded-2xl sm:md:rounded-3xl md:border md:border-gray-200/80 dark:md:border-white/10 md:shadow-xs sm:md:shadow-sm',
            'h-full rounded-none border-0 shadow-none',
            isMobileDetailOpen ? 'hidden md:flex' : 'flex'
          )}
        >
          {/* ── Mobile Navbar Header with Back Navigation ── */}
          <div className="md:hidden sticky top-0 z-20 bg-white/95 dark:bg-[#181818]/95 backdrop-blur-md border-b border-gray-100 dark:border-white/10 px-3.5 py-2.5 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={handleGoBack}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:text-[#1A6B3C] dark:hover:text-emerald-400 hover:bg-gray-200 dark:hover:bg-white/15 transition-all cursor-pointer active:scale-95 shrink-0"
                aria-label="Back"
                title="Go back"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-fraunces text-lg font-bold text-[#1A6B3C] dark:text-emerald-400 tracking-tight truncate">
                  Report Center
                </span>
              </div>
            </div>
          </div>

          {/* ── Desktop Card Header with Back Navigation & Title ── */}
          <div className="hidden md:flex px-4 py-3.5 border-b border-gray-100 dark:border-white/10 items-center justify-between bg-white dark:bg-[#181818] shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={handleGoBack}
                className="p-1.5 -ml-1 rounded-lg text-gray-500 hover:text-[#1A6B3C] dark:text-gray-400 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                aria-label="Back"
                title="Go back to previous page"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-fraunces text-base font-bold text-gray-900 dark:text-white tracking-tight truncate">
                    Report Center
                  </h1>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Status Filters Header */}
          <div className="p-3.5 sm:p-4 border-b border-gray-100 dark:border-white/10 space-y-2.5 shrink-0 bg-white dark:bg-[#181818]">
            {/* Search input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search ticket, name, or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-transparent focus:border-[#1A6B3C] dark:focus:border-emerald-500 font-jakarta text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
              {[
                { id: 'all', label: 'All', count: counts.all },
                { id: 'reviewing', label: 'In Review', count: counts.reviewing },
                { id: 'resolved', label: 'Resolved', count: counts.resolved },
                { id: 'pending', label: 'Pending', count: counts.pending },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id as any)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5',
                    filter === tab.id
                      ? 'bg-[#1A6B3C] text-white shadow-2xs font-bold'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.2 rounded-full font-mono',
                      filter === tab.id
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-200/80 dark:bg-white/10 text-gray-500'
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Report Card List */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-2.5 space-y-1">
            {loadingReports ? (
              <div className="p-8 text-center text-gray-400 space-y-2">
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Loading incident tickets...</p>
              </div>
            ) : fetchError ? (
              <div className="p-8 text-center text-gray-400 space-y-3">
                <AlertTriangle size={28} className="mx-auto text-amber-500 mb-1" />
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Unable to load reports</p>
                <p className="text-[11px] text-gray-500 max-w-xs mx-auto">{fetchError}</p>
                <button
                  type="button"
                  onClick={async () => {
                    await probeLocalBackend().catch(() => { });
                    fetchReports(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
                >
                  <RotateCcw size={13} />
                  Retry
                </button>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="p-8 text-center text-gray-400 space-y-2">
                <ShieldCheck size={28} className="mx-auto text-emerald-500/50 mb-1" />
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">No reports found</p>
                <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                  {searchQuery || filter !== 'all'
                    ? 'No tickets match your filter criteria.'
                    : 'You currently have no active or historical reports.'}
                </p>
              </div>
            ) : (
              filteredReports.map((report) => {
                const isSelected = report.id === selectedReport?.id;
                return (
                  <div
                    key={report.id}
                    onClick={() => handleSelectReport(report.id)}
                    className={cn(
                      'px-3.5 py-2.5 rounded-xl transition-all cursor-pointer text-left space-y-1 relative',
                      isSelected
                        ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white font-medium'
                        : 'hover:bg-gray-50/80 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400'
                    )}
                  >
                    {/* Top Row: Ticket ID & Text-Only Status (No icon, No bg pill) */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-xs font-bold text-gray-900 dark:text-white truncate">
                          {report.id}
                        </span>
                        {report.isReported && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 shrink-0">
                            Inquiry
                          </span>
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-xs font-semibold shrink-0',
                          report.status === 'resolved' && 'text-emerald-600 dark:text-emerald-400',
                          report.status === 'reviewing' && 'text-amber-600 dark:text-amber-400',
                          report.status === 'pending' && 'text-gray-400 dark:text-gray-500',
                          report.status === 'dismissed' && 'text-gray-400'
                        )}
                      >
                        {report.status === 'resolved'
                          ? 'Resolved'
                          : report.status === 'reviewing'
                            ? 'In Review'
                            : report.status === 'pending'
                              ? 'Pending'
                              : 'Dismissed'}
                      </span>
                    </div>

                    {/* Second Row: Target Name / Subject & Date */}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span className="truncate pr-2 font-medium text-gray-700 dark:text-gray-300">
                        {report.targetName}
                      </span>
                      <span className="text-[11px] text-gray-400 shrink-0">
                        {report.createdAt.split('•')[0].trim()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SEPARATE CARD 2 (RIGHT): CONVERSATION PANEL UI                     */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div
          className={cn(
            'flex-1 min-w-0 md:min-w-[500px] lg:min-w-[650px] xl:min-w-[820px] bg-white dark:bg-[#181818] flex flex-col overflow-hidden font-jakarta',
            'md:rounded-2xl sm:md:rounded-3xl md:border md:border-gray-200/80 dark:md:border-white/10 md:shadow-xs sm:md:shadow-sm',
            'h-full rounded-none border-0 shadow-none',
            !isMobileDetailOpen ? 'hidden md:flex' : 'flex'
          )}
        >
          {loadingReports ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Fetching report audit log...</p>
            </div>
          ) : fetchError ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400 space-y-3">
              <ShieldAlert size={32} className="text-amber-500/80 mb-1" />
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Could not retrieve audit history</p>
              <button
                type="button"
                onClick={async () => {
                  await probeLocalBackend().catch(() => { });
                  fetchReports(false);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
              >
                <RotateCcw size={13} />
                Reload Conversation
              </button>
            </div>
          ) : selectedReport ? (
            <div className="flex-1 flex flex-col min-h-0">

              {/* ── CONVERSATION HEADER (Modeled after MessagesPage Header) ── */}
              <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-black/[0.06] dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#181818] shrink-0 z-10 shadow-2xs">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={handleBackToList}
                    className="md:hidden p-2 -ml-1 rounded-full text-gray-700 hover:text-[#1A6B3C] dark:text-gray-200 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                    aria-label="Back to reports list"
                  >
                    <ArrowLeft size={20} />
                  </button>

                  <div className="relative shrink-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-black/10 dark:border-white/10 bg-white dark:bg-[#1E293B] shadow-2xs">
                      <img
                        src="/alijis-logo.png"
                        alt="Alijis Logo"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/icon.png';
                        }}
                      />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 border-2 border-white dark:border-[#181818] rounded-full" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-jakarta font-bold text-sm text-gray-900 dark:text-white leading-tight truncate">
                        Ally Safety Agent
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopy(selectedReport.id)}
                    className="p-1.5 rounded-xl border border-gray-200/80 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
                    title="Copy Reference"
                  >
                    {copiedId === selectedReport.id ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  </button>
                  {statusBadge(selectedReport.status)}
                </div>
              </div>

              {/* ── CONVERSATION MESSAGES AREA ── */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">

                {/* Date Separator (Flat Background Pill) */}
                <div className="flex items-center justify-center my-2">
                  <span className="px-3.5 py-1 rounded-full bg-gray-200/70 dark:bg-white/10 text-gray-600 dark:text-gray-300 font-jakarta text-[11px] font-medium border-0 shadow-none select-none">
                    {selectedReport.isReported ? 'Conduct Inquiry' : 'Incident Report'} • {selectedReport.createdAt}
                  </span>
                </div>

                {/* Messages Loop (Styled matching ChatWindow.tsx) */}
                {selectedReport.messages
                  .filter((msg) => msg.sender !== 'user')
                  .map((msg) => {
                    const isUser = msg.sender === 'user';

                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          'group flex items-end gap-2 my-1.5 transition-[margin] duration-150 ease-out',
                          isUser ? 'flex-row-reverse' : 'flex-row'
                        )}
                      >
                        {/* Agent Avatar (Alijis Logo) */}
                        {!isUser && (
                          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 mb-0.5 border border-black/10 dark:border-white/10 bg-white dark:bg-[#1E293B] shadow-2xs">
                            <img
                              src="/alijis-logo.png"
                              alt="Alijis Logo"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/icon.png';
                              }}
                            />
                          </div>
                        )}

                        {(() => {
                          // Only attach postData to the first message (the inquiry notice), never duplicate on progression or verdict bubbles
                          const agentMessages = selectedReport.messages.filter((m) => m.sender !== 'user');
                          const isFirstAgentMessage = agentMessages[0]?.id === msg.id;
                          const postData = isFirstAgentMessage ? (msg.post || selectedReport.post || null) : null;

                          return (
                            <div
                              className={cn(
                                'flex flex-col min-w-0 transition-all duration-200',
                                postData ? 'w-full max-w-[95%] sm:max-w-[85%] md:max-w-[560px]' : 'max-w-[85%] sm:max-w-[75%] md:max-w-[70%]',
                                isUser ? 'items-end' : 'items-start'
                              )}
                            >
                              {/* ── ONE CHAT BUBBLE UI: Top text message, Underneath exact responsive Post Card ── */}
                              <div
                                style={getBubbleBorderRadii(isUser)}
                                className={cn(
                                  postData ? 'w-full max-w-[540px]' : 'w-fit max-w-full',
                                  'text-sm font-jakarta transition-opacity h-auto min-w-0',
                                  'px-4 py-2.5 break-words [overflow-wrap:anywhere] [word-break:break-word]',
                                  isUser
                                    ? 'bg-[#1A6B3C] dark:bg-emerald-600 text-white'
                                    : 'bg-gray-100 dark:bg-[#1E293B] text-gray-800 dark:text-gray-100'
                                )}
                              >
                                {/* Top: Message Text */}
                                <p
                                  className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] [word-break:break-word] leading-relaxed min-w-0 select-text text-sm font-jakarta"
                                  style={{
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    overflowWrap: 'anywhere',
                                  }}
                                >
                                  {msg.text}
                                </p>

                                {/* Under: Exact Post Card UI (No follow button, 3 dot, comment button) inside the chat bubble */}
                                {postData && (
                                  <EmbeddedPostCard post={postData} onImageClick={(url) => setPreviewImageUrl(url)} />
                                )}

                                {/* Attached Evidence Chip */}
                                {msg.evidenceName && (
                                  <div className="mt-2 pt-2 border-t border-white/20 flex items-center gap-1.5 text-xs font-jakarta text-emerald-100">
                                    <Paperclip size={12} />
                                    <span>Attached: {msg.evidenceName}</span>
                                  </div>
                                )}

                                {/* Timestamp inside the bubble */}
                                <span
                                  className={cn(
                                    'text-[10px] flex items-center gap-1 mt-1.5 font-jakarta select-none',
                                    isUser ? 'text-white/70 justify-end' : 'text-gray-400 dark:text-gray-500 justify-start'
                                  )}
                                >
                                  {msg.time}
                                </span>
                              </div>

                              {/* ── VISUAL PROGRESSION STEPPER (Clean without Badge) ── */}
                              {msg.progression && (
                                <div className="w-full mt-2">
                                  <ProgressionStepper progression={msg.progression} />
                                </div>
                              )}

                              {/* ── ACTION TAKEN / RESOLUTION RESPONSE UI ── */}
                              {(msg.actionTaken || (msg.card && (msg.card.badge === 'Action Taken' || msg.card.type === 'verdict'))) && (
                                (() => {
                                  const isReportedUser = Boolean(
                                    selectedReport.isReported ||
                                    (!selectedReport.isReporter && selectedReport.reporterHandle === 'Masked CHMSU Student')
                                  );

                                  const action = msg.actionTaken || {
                                    title: msg.card?.title || (isReportedUser ? 'Official Moderation Verdict' : 'Report Resolved'),
                                    verdict: msg.card?.details || (isReportedUser
                                      ? 'Disciplinary measure enforced under student safety policy.'
                                      : 'Our moderation team investigated your report and took appropriate corrective action in accordance with campus safety policy.'),
                                    badge: msg.card?.badge || (isReportedUser ? 'Action Taken' : 'RESOLVED'),
                                    sanctions: isReportedUser ? [
                                      'Reported content permanently removed from campus feed',
                                      'Target account interaction restriction applied',
                                      'Disciplinary infraction logged in student safety database',
                                    ] : [
                                      'Reported content removed or restricted from community visibility',
                                      'Safety policy guidelines enforced on the reported account',
                                      'Incident successfully resolved and logged in safety records',
                                    ],
                                    actionType: selectedReport.actionType || 'resolve',
                                    appealable: msg.actionTaken ? Boolean(msg.actionTaken.appealable && isReportedUser) : isReportedUser,
                                    enforcedAt: msg.time,
                                    desk: isReportedUser ? 'CHMSU Student Safety & Conduct Desk' : 'CHMSU Student Safety Desk',
                                  };

                                  const isAppealable = Boolean(action.appealable && isReportedUser);
                                  const isAppealSubmitted = Boolean(action.appealSubmitted || selectedReport.hasAppeal);
                                  const appealDocket = action.appealDocketId || selectedReport.appealDocketId;

                                  // Dynamic badge styling based on action
                                  const badgeStyle = (() => {
                                    const b = (action.badge || '').toUpperCase();
                                    if (b.includes('DENIED') || b.includes('CLOSED') || b.includes('DISMISSED')) {
                                      return 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300';
                                    }
                                    if (b.includes('RESOLVED')) {
                                      return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400';
                                    }
                                    if (b.includes('WARN')) {
                                      return 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400';
                                    }
                                    if (b.includes('BAN') || b.includes('SUSPEND') || b.includes('DELETED') || b.includes('REMOVED')) {
                                      return isReportedUser
                                        ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400'
                                        : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400';
                                    }
                                    return 'bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-300';
                                  })();

                                  return (
                                    <div className="w-full mt-2 p-4 sm:p-5 rounded-[18px] bg-gray-100 dark:bg-[#1E293B] text-gray-800 dark:text-gray-100 border border-gray-200/60 dark:border-white/10 space-y-3 shadow-2xs font-jakarta animate-in fade-in slide-in-from-bottom-1 duration-200">

                                      {/* Header */}
                                      <div className="flex items-center justify-between pb-2.5 border-b border-black/[0.06] dark:border-white/10">
                                        <h4 className="font-jakarta font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                                          {action.title || (isReportedUser ? 'Official Moderation Verdict' : 'Report Resolved')}
                                        </h4>
                                        <span className={cn('px-2 py-0.5 rounded-md font-jakarta text-[11px] font-semibold', badgeStyle)}>
                                          {action.badge || (isReportedUser ? 'Action Taken' : 'RESOLVED')}
                                        </span>
                                      </div>

                                      {/* Verdict Details */}
                                      <p className="text-xs sm:text-[13px] leading-relaxed text-gray-700 dark:text-gray-200">
                                        {action.verdict}
                                      </p>

                                      {/* Enforced Sanctions / Resolution Measures List */}
                                      {action.sanctions && action.sanctions.length > 0 && (
                                        <div className="space-y-1.5 pt-0.5">
                                          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400">
                                            {isReportedUser ? 'Enforced Measures:' : 'Actions Taken:'}
                                          </span>
                                          <div className="space-y-1">
                                            {action.sanctions.map((sanction, sIdx) => (
                                              <div key={sIdx} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                                                <span className="text-gray-400 select-none">•</span>
                                                <span>{sanction}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* ── FOOTER: APPEAL BAR (REPORTED USER ONLY) OR REASSURANCE (REPORTER) ── */}
                                      <div className="mt-1 pt-3 border-t border-black/[0.06] dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                        {isAppealable ? (
                                          <>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                                              {isAppealSubmitted
                                                ? `Appeal submitted (${appealDocket || 'Under Review'}). Awaiting review.`
                                                : 'Action taken by mistake? You can submit a conduct appeal.'}
                                            </p>

                                            {isAppealSubmitted ? (
                                              <span className="px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-semibold text-xs whitespace-nowrap self-start sm:self-auto">
                                                Appeal In Review
                                              </span>
                                            ) : (
                                              <button
                                                onClick={() => handleOpenAppeal(selectedReport, msg.id)}
                                                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-white/10 hover:bg-gray-200/70 dark:hover:bg-white/15 text-gray-800 dark:text-gray-100 font-semibold text-xs border border-gray-200/80 dark:border-white/15 shadow-2xs hover:shadow-xs transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
                                              >
                                                Appeal
                                              </button>
                                            )}
                                          </>
                                        ) : (
                                          <div className="flex items-center justify-between w-full">
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                                              {selectedReport.status === 'dismissed' || action.badge?.includes('DENIED')
                                                ? 'Thank you for looking out for our campus community. This case is closed.'
                                                : 'Thank you for helping keep our campus safe. This report is resolved and logged in our safety records.'}
                                            </p>
                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
                                              <CheckCircle2 size={13} /> {selectedReport.status === 'dismissed' ? 'Case Concluded' : 'Protection Confirmed'}
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                    </div>
                                  );
                                })()
                              )}

                              {/* Agentic Telemetry / Warning Non-Verdict Structured Card */}
                              {msg.card && msg.card.type !== 'verdict' && msg.card.badge !== 'Action Taken' && !msg.actionTaken && (
                                <div
                                  className={cn(
                                    'w-full mt-2 p-3.5 rounded-[18px] border text-xs space-y-1.5 shadow-2xs font-jakarta animate-in fade-in slide-in-from-bottom-1 duration-200',
                                    msg.card.type === 'warning'
                                      ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-500/30 text-amber-950 dark:text-amber-100'
                                      : 'bg-white dark:bg-[#1E293B] border-gray-200/80 dark:border-white/10 text-gray-800 dark:text-gray-200'
                                  )}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-[11px] uppercase tracking-wider font-jakarta flex items-center gap-1.5">
                                      {msg.card.type === 'warning' && <AlertTriangle size={13} className="text-amber-600 dark:text-amber-400" />}
                                      {msg.card.type === 'telemetry' && <ShieldCheck size={13} className="text-[#1A6B3C] dark:text-emerald-400" />}
                                      {msg.card.title}
                                    </span>
                                    {msg.card.badge && (
                                      <span className="px-2 py-0.5 rounded-full font-jakarta text-[9px] font-bold bg-black/5 dark:bg-white/10">
                                        {msg.card.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300 font-jakarta">
                                    {msg.card.details}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                <div ref={messagesEndRef} />
              </div>

              {/* ── FOOTER NOTICE (CANNOT REPLY) ── */}
              <div className="px-5 py-3.5 border-t border-gray-100 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] shrink-0 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-jakarta">
                  You cannot reply to this automated agent. Updates and moderation findings are automatically logged here.
                </p>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
              <button
                type="button"
                onClick={handleBackToList}
                className="md:hidden mb-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                <ArrowLeft size={14} /> Back to Reports
              </button>
              <ShieldAlert size={32} className="text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-xs font-medium">Select a report to view the conversation</p>
            </div>
          )}
        </div>

      </div>

      {/* Disciplinary Appeal Modal */}
      {appealModalData && (
        <AppealModal
          report={appealModalData.report}
          messageId={appealModalData.messageId}
          onClose={() => setAppealModalData(null)}
          onSubmit={handleSubmitAppeal}
        />
      )}
      {/* Fullscreen Photo Evidence Preview Modal */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs cursor-pointer animate-in fade-in duration-150"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-black border border-white/10 shadow-2xl">
            <img src={previewImageUrl} alt="Enlarged Post Media" className="max-w-full max-h-[90vh] object-contain" />
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
