import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { getAnonymousDisplayName, isAnonymousHandle } from '@/lib/anonymousHandle';
import { X, Send, MessageCircle, Reply, UserCheck, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import { ClickableAvatar } from '@/components/ally/ClickableAvatar';
import LordHeartIcon from '@/components/ally/LordHeartIcon';
import FeedPostCard from '@/components/feed/FeedPostCard';
import type { FeedCommentWithReplies, FeedComment, FeedPost } from '@/types/feed';
import type { Student } from '@/types/ally';

interface CommentsModalProps {
  post: FeedPost | null;
  currentUser: Student;
  onClose: () => void;
  loadComments: (postId: string) => Promise<FeedCommentWithReplies[]>;
  onSubmitComment: (postId: string, content: string, parentCommentId?: string | null) => Promise<FeedComment>;
  onToggleCommentLike: (comment: FeedComment) => Promise<void>;
  onTogglePostLike?: (post: FeedPost) => void;
  onDeletePost?: (postId: string) => void;
  onUpdatePost?: (post: FeedPost) => void;
  onAuthorClick?: (authorId: string) => void;
  onToggleFollow?: (authorId: string, isFollowing: boolean) => void;
  /** If provided, auto-selects this comment as the reply target after load (used for comment_reply deep-links). */
  initialReplyCommentId?: string | null;
  /** Index of the photo to open first (the one that was clicked in the feed). */
  initialMediaIndex?: number;
}

function formatTime(value: string) {
  try {
    return formatDistanceToNowStrict(new Date(value), { addSuffix: true });
  } catch {
    return '';
  }
}

function renderCommentContent(content: string, isMentionAlly?: (username: string) => boolean) {
  const parts = content.split(/([@#][a-zA-Z0-9_-]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@') || part.startsWith('#')) {
      const handle = part.slice(1);
      // If mention is not an ally and not anonymous, sanitize to @anonymous for security
      const isAlly = isMentionAlly ? isMentionAlly(handle) : true;
      const displayPart = isAlly ? `@${handle}` : '@anonymous';
      return (
        <span
          key={i}
          className="text-[#1A6B3C] dark:text-emerald-400 font-bold bg-[#1A6B3C]/8 dark:bg-emerald-500/15 px-1.5 py-0.5 rounded-md text-[13px] inline-block"
        >
          {displayPart}
        </span>
      );
    }
    return part;
  });
}

function CommentRow({
  comment,
  currentUserId,
  onReply,
  onToggleLike,
  onAuthorClick,
  isMentionAlly,
}: {
  comment: FeedComment;
  currentUserId: string;
  onReply?: () => void;
  onToggleLike: (comment: FeedComment) => Promise<void>;
  onAuthorClick?: (authorId: string) => void;
  isMentionAlly?: (username: string) => boolean;
}) {
  const author = comment.author;
  const isOwn = comment.author_id === currentUserId;
  const isAlly = Boolean((comment.author?.is_ally && !comment.author?.is_unrevealed_match && comment.author?.username !== 'anonymous') || isOwn);
  const displayName = isAlly ? (author?.full_name || (author?.username ? `@${author.username}` : 'Ally member')) : getAnonymousDisplayName(author);
  const displayHandle = isAlly && author?.username ? `@${author.username}` : '@anonymous';
  const [liking, setLiking] = useState(false);

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      await onToggleLike(comment);
    } finally {
      setLiking(false);
    }
  };

  const handleAuthorClick = () => {
    if (onAuthorClick && comment.author_id) {
      onAuthorClick(comment.author_id);
    }
  };

  return (
    <div className="flex items-start gap-2.5 sm:gap-3 group">
      <ClickableAvatar
        userId={comment.author_id}
        avatarUrl={author?.avatar_url}
        avatarKey={author?.avatarKey}
        name={displayName}
        revealed={Boolean(isAlly)}
        size={32}
        className="w-8 h-8 rounded-xl ring-1 ring-black/5 dark:ring-white/10 shadow-xs"
        wrapperClassName="rounded-xl"
        onNavigate={onAuthorClick}
      />
      <div className="flex-1 min-w-0">
        <div className="bg-gray-50/90 dark:bg-white/[0.04] hover:bg-gray-100/70 dark:hover:bg-white/[0.06] border border-gray-100/80 dark:border-white/10 rounded-2xl px-3.5 py-2.5 transition-colors">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <div
              className={`flex items-center gap-1.5 ${onAuthorClick && comment.author_id ? "cursor-pointer hover:underline" : ""}`}
              onClick={handleAuthorClick}
            >
              <p className="font-jakarta font-bold text-xs text-gray-900 dark:text-white">{displayName}</p>
              <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 font-jakarta">{displayHandle}</span>
            </div>
            {isOwn && (
              <span className="px-1.5 py-0.2 rounded-md bg-[#1A6B3C]/10 text-[#1A6B3C] dark:bg-emerald-500/20 dark:text-emerald-400 text-[10px] font-extrabold">
                You
              </span>
            )}
            {!isOwn && isAlly && (
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-0.5">
                <UserCheck size={10} />
                <span>Ally</span>
              </span>
            )}
          </div>
          <p className="font-jakarta text-[13.5px] sm:text-sm text-gray-800 dark:text-gray-200 break-words leading-relaxed">
            {renderCommentContent(comment.content, isMentionAlly)}
          </p>
        </div>
        <div className="flex items-center gap-3 mt-1 px-1">
          <span className="font-jakarta text-[11px] text-gray-400">{formatTime(comment.created_at)}</span>
          <button
            onClick={handleLike}
            className={`font-jakarta text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
              comment.liked_by_me ? 'text-[#1A6B3C] dark:text-emerald-400' : 'text-gray-400 hover:text-[#1A6B3C] dark:hover:text-emerald-400'
            }`}
          >
            <LordHeartIcon isLiked={comment.liked_by_me} size={13} />
            <span>{comment.likes_count > 0 ? comment.likes_count : 'Like'}</span>
          </button>
          {onReply && (
            <button
              onClick={onReply}
              className="font-jakarta text-[11px] font-semibold text-gray-400 hover:text-[#1A6B3C] dark:hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Reply size={12} />
              <span>Reply</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommentsModal({
  post,
  currentUser,
  onClose,
  loadComments,
  onSubmitComment,
  onToggleCommentLike,
  onTogglePostLike,
  onDeletePost,
  onUpdatePost,
  onAuthorClick,
  onToggleFollow,
  initialReplyCommentId,
  initialMediaIndex = 0,
}: CommentsModalProps) {
  const [comments, setComments] = useState<FeedCommentWithReplies[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [replyTarget, setReplyTarget] = useState<{ id: string; name: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localPost, setLocalPost] = useState<FeedPost | null>(post);
  const [mediaIndex, setMediaIndex] = useState(initialMediaIndex);
  const inputRef = useRef<HTMLInputElement>(null);
  const commentRowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const autoRepliedRef = useRef<string | null>(null);

  useEffect(() => {
    setLocalPost(post);
  }, [post]);

  // Reset to the clicked photo whenever a different post is opened
  useEffect(() => {
    setMediaIndex(initialMediaIndex);
  }, [post?.id, initialMediaIndex]);

  const sortedMedia = useMemo(
    () => [...(localPost?.media ?? [])].sort((a, b) => a.position - b.position),
    [localPost?.media]
  );
  const hasMedia = sortedMedia.length > 0;
  const hasRemovedMedia = sortedMedia.some((m) => m.url === '[removed]');
  const safeIndex = Math.min(Math.max(mediaIndex, 0), Math.max(sortedMedia.length - 1, 0));
  const currentMedia = hasMedia && !hasRemovedMedia ? sortedMedia[safeIndex] : null;

  const goPrev = useCallback(() => setMediaIndex((i) => Math.max(i - 1, 0)), []);
  const goNext = useCallback(
    () => setMediaIndex((i) => Math.min(i + 1, Math.max(sortedMedia.length - 1, 0))),
    [sortedMedia.length]
  );

  // Lock page scroll while the full-screen viewer is open
  useEffect(() => {
    if (!post) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [post]);

  useEffect(() => {
    if (!post) return;
    let isMounted = true;
    setIsLoading(true);
    loadComments(post.id)
      .then((data) => {
        if (isMounted) setComments(data);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [post?.id, loadComments]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      // Arrow keys switch photos, unless the user is typing a comment
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goPrev, goNext]);

  // Set of known ally usernames for mention security
  const allyUsernames = useMemo(() => {
    const set = new Set<string>();
    if (currentUser.username) set.add(currentUser.username.toLowerCase());
    for (const c of comments) {
      if (c.author?.is_ally && c.author.username) {
        set.add(c.author.username.toLowerCase());
      }
      for (const r of c.replies || []) {
        if (r.author?.is_ally && r.author.username) {
          set.add(r.author.username.toLowerCase());
        }
      }
    }
    return set;
  }, [comments, currentUser.username]);

  const isMentionAlly = useCallback(
    (username: string) => {
      const lower = username.toLowerCase();
      if (lower === 'anonymous') return true; // keep @anonymous as is
      return allyUsernames.has(lower);
    },
    [allyUsernames]
  );

  // Auto-enter reply mode when initialReplyCommentId is set (from comment_reply deep-links)
  useEffect(() => {
    if (!initialReplyCommentId || isLoading || comments.length === 0) return;
    if (autoRepliedRef.current === initialReplyCommentId) return; // already handled

    // Find the target in top-level or replies
    let target: FeedComment | undefined;
    let rootParentId: string | undefined;
    for (const c of comments) {
      if (c.id === initialReplyCommentId) {
        target = c;
        break;
      }
      const reply = (c.replies ?? []).find((r) => r.id === initialReplyCommentId);
      if (reply) {
        target = reply;
        rootParentId = c.id; // reply to root parent
        break;
      }
    }

    if (target) {
      autoRepliedRef.current = initialReplyCommentId;
      // Scroll to that comment
      const el = commentRowRefs.current.get(target.id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Brief highlight
        el.classList.add('ring-2', 'ring-[#1A6B3C]/50', 'dark:ring-emerald-400/50', 'rounded-2xl', 'transition-all');
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-[#1A6B3C]/50', 'dark:ring-emerald-400/50', 'rounded-2xl');
        }, 2000);
      }
      // Trigger reply mode
      handleReplyClick(target, rootParentId);
    }
  }, [initialReplyCommentId, isLoading, comments]);

  if (!post || !localPost) return null;

  const handleFocusInput = () => {
    inputRef.current?.focus();
  };

  const handlePostLike = (p: FeedPost) => {
    if (onTogglePostLike) {
      onTogglePostLike(p);
    }
    setLocalPost((prev) => {
      if (!prev) return null;
      const isLiked = !prev.liked_by_me;
      return {
        ...prev,
        liked_by_me: isLiked,
        likes_count: prev.likes_count + (isLiked ? 1 : -1),
      };
    });
  };

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const created = await onSubmitComment(post.id, trimmed, replyTarget?.id ?? null);

      if (replyTarget) {
        setComments((prev) =>
          prev.map((c) => (c.id === replyTarget.id ? { ...c, replies: [...(c.replies || []), created] } : c))
        );
      } else {
        setComments((prev) => [{ ...created, replies: [] }, ...prev]);
      }

      setLocalPost((prev) => (prev ? { ...prev, comments_count: prev.comments_count + 1 } : null));
      setDraft('');
      setReplyTarget(null);
    } catch {
      setDraft(trimmed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleLikeAndSync = async (comment: FeedComment) => {
    await onToggleCommentLike(comment);
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === comment.id) {
          return { ...c, liked_by_me: !c.liked_by_me, likes_count: c.likes_count + (c.liked_by_me ? -1 : 1) };
        }
        return {
          ...c,
          replies: (c.replies || []).map((r) =>
            r.id === comment.id
              ? { ...r, liked_by_me: !r.liked_by_me, likes_count: r.likes_count + (r.liked_by_me ? -1 : 1) }
              : r
          ),
        };
      })
    );
  };

  const handleToggleFollow = (authorId: string, isFollowing: boolean) => {
    setLocalPost((prev) =>
      prev && prev.author
        ? { ...prev, author: { ...prev.author, is_following: isFollowing } }
        : prev
    );
    onToggleFollow?.(authorId, isFollowing);
  };

  const handleReplyClick = (targetComment: FeedComment, rootParentId?: string) => {
    const isOwn = targetComment.author_id === currentUser.id;
    const isAlly = Boolean(targetComment.author?.is_ally || isOwn);
    // If ally, mention by real username; if not ally, mention by anonymous
    const handle = isAlly
      ? (targetComment.author?.username || targetComment.author?.full_name || 'ally').replace(/\s+/g, '_')
      : 'anonymous';

    // If rootParentId is passed, new comment stays a child of rootParentId (1 level nesting)
    const targetParentId = rootParentId || targetComment.id;
    setReplyTarget({ id: targetParentId, name: `@${handle}` });
    setDraft((prev) => {
      const tag = `@${handle} `;
      if (prev.startsWith(tag)) return prev;
      return `${tag}${prev}`;
    });
    inputRef.current?.focus();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col lg:flex-row bg-white dark:bg-[#0B1220] animate-in fade-in duration-150">
      {/* ── Right Panel: Post details, actions & comments ──────────────────── */}
      <aside className="order-2 flex flex-col flex-1 min-h-0 lg:flex-none lg:w-[400px] xl:w-[440px] lg:h-full bg-white dark:bg-[#111827] border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-white/10">
        {/* Scrollable: post header + caption + like/comment bar + comments */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          {/* Post header, caption and the Like / Comment actions (above the comments) */}
          <div className="p-2 sm:p-3 border-b border-gray-100 dark:border-white/10">
            <FeedPostCard
              post={localPost}
              currentUser={currentUser}
              onToggleLike={handlePostLike}
              onCommentClick={handleFocusInput}
              onDelete={(id) => {
                onDeletePost?.(id);
                onClose();
              }}
              onUpdate={(updated) => {
                setLocalPost(updated);
                onUpdatePost?.(updated);
              }}
              onAuthorClick={onAuthorClick}
              onToggleFollow={handleToggleFollow}
              showBorder={false}
              hideMedia={hasMedia}
            />
          </div>

          {/* Comments Section */}
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-jakarta font-bold text-xs uppercase tracking-wider text-gray-400">
                Comments ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
              </span>
            </div>

            {isLoading ? (
              <div className="py-8 space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-white/10 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 dark:bg-white/10 rounded-full w-1/4" />
                      <div className="h-10 bg-gray-100 dark:bg-white/5 rounded-2xl w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-10 px-4 bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                <MessageCircle size={28} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="font-jakarta font-semibold text-sm text-gray-600 dark:text-gray-300">No comments yet</p>
                <p className="font-jakarta text-xs text-gray-400 mt-0.5">Be the first to join the conversation.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="space-y-3"
                    ref={(el) => {
                      if (el) commentRowRefs.current.set(comment.id, el);
                      else commentRowRefs.current.delete(comment.id);
                    }}
                  >
                    <CommentRow
                      comment={comment}
                      currentUserId={currentUser.id}
                      onToggleLike={toggleLikeAndSync}
                      onReply={() => handleReplyClick(comment)}
                      onAuthorClick={onAuthorClick}
                      isMentionAlly={isMentionAlly}
                    />
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-7 sm:ml-9 border-l-2 border-[#1A6B3C]/20 dark:border-emerald-500/30 pl-3.5 sm:pl-4 space-y-3">
                        {comment.replies.map((reply) => (
                          <CommentRow
                            key={reply.id}
                            comment={reply}
                            currentUserId={currentUser.id}
                            onToggleLike={toggleLikeAndSync}
                            onReply={() => handleReplyClick(reply, comment.id)}
                            onAuthorClick={onAuthorClick}
                            isMentionAlly={isMentionAlly}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Input Footer */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-white/10 bg-white dark:bg-[#111827] sticky bottom-0 z-10 shadow-lg">
          {replyTarget && (
            <div className="flex items-center justify-between mb-2 px-3 py-1.5 bg-[#1A6B3C]/8 dark:bg-emerald-500/20 border border-[#1A6B3C]/15 dark:border-emerald-500/30 rounded-xl text-xs font-jakarta animate-in fade-in slide-in-from-bottom-1 duration-150">
              <span className="text-[#1A6B3C] dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <Reply size={13} className="stroke-[2.5]" />
                <span>Replying to <span className="font-extrabold">{replyTarget.name}</span></span>
              </span>
              <button
                onClick={() => setReplyTarget(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-0.5 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <AvatarDisplay
              src={currentUser.avatar}
              name={currentUser.name}
              className="w-8 h-8 rounded-xl object-cover flex-shrink-0"
            />
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={replyTarget ? `Reply to ${replyTarget.name}…` : 'Write a comment… Use @ to mention'}
              className="flex-1 bg-gray-100/80 dark:bg-white/5 focus:bg-white dark:focus:bg-white/10 rounded-2xl px-4 py-2.5 font-jakarta text-sm text-gray-900 dark:text-white outline-none border border-transparent focus:border-[#1A6B3C]/30 dark:focus:border-emerald-500/30 focus:ring-2 focus:ring-[#1A6B3C]/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim() || isSubmitting}
              className="w-9 h-9 rounded-xl bg-[#1A6B3C] dark:bg-emerald-600 text-white flex items-center justify-center disabled:opacity-40 disabled:bg-gray-200 dark:disabled:bg-white/10 disabled:text-gray-400 hover:bg-[#155a33] dark:hover:bg-emerald-500 active:scale-95 transition-all flex-shrink-0 shadow-xs cursor-pointer"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Left Stage: Full-size media viewer ──────────────────────────────── */}
      <section className="order-1 relative flex-shrink-0 lg:flex-1 h-[48vh] sm:h-[55vh] lg:h-full bg-black flex items-center justify-center overflow-hidden select-none">
        {/* Upper Left: Back */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Back"
          className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Slide counter */}
        {sortedMedia.length > 1 && (
          <div className="absolute top-4 sm:top-5 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white font-jakarta text-xs font-semibold">
            {safeIndex + 1} / {sortedMedia.length}
          </div>
        )}

        {hasRemovedMedia ? (
          <p className="px-6 text-center font-jakarta text-sm italic text-gray-400">
            This photo was removed for violating community standards.
          </p>
        ) : currentMedia ? (
          // Shown at its natural size, scaled down only to fit — never cropped.
          <img
            key={currentMedia.id}
            src={currentMedia.url}
            alt=""
            draggable={false}
            className="max-w-full max-h-full w-auto h-auto object-contain animate-in fade-in duration-150"
          />
        ) : (
          // Text-only post: show the caption as a slide (same as mobile)
          <div className="max-w-2xl w-full px-8 py-10 text-center overflow-y-auto max-h-full custom-scrollbar">
            <p className="font-fraunces text-2xl sm:text-3xl text-white leading-snug whitespace-pre-wrap break-words">
              {localPost.content}
            </p>
          </div>
        )}

        {/* Previous / Next */}
        {sortedMedia.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              disabled={safeIndex === 0}
              aria-label="Previous photo"
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-sm text-white flex items-center justify-center transition-all disabled:opacity-0 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={safeIndex === sortedMedia.length - 1}
              aria-label="Next photo"
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-sm text-white flex items-center justify-center transition-all disabled:opacity-0 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronRight size={24} />
            </button>

            {/* Thumbnail strip */}
            <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 p-1.5 rounded-xl bg-black/40 backdrop-blur-sm max-w-[90%] overflow-x-auto">
              {sortedMedia.map((m, i) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMediaIndex(i)}
                  aria-label={`Show photo ${i + 1}`}
                  className={`w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer ${
                    i === safeIndex ? 'border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
                  }`}
                >
                  <img src={m.url} alt="" className="w-full h-full object-cover" draggable={false} />
                </button>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}