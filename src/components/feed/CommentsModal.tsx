import { useEffect, useState, useRef } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
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
  onAuthorClick?: (authorId: string) => void;
}

function formatTime(value: string) {
  try {
    return formatDistanceToNowStrict(new Date(value), { addSuffix: true });
  } catch {
    return '';
  }
}

function CommentRow({
  comment,
  onReply,
  onToggleLike,
}: {
  comment: FeedComment;
  onReply?: () => void;
  onToggleLike: (comment: FeedComment) => Promise<void>;
}) {
  const author = comment.author;
  const displayName = author?.full_name || author?.username || 'Ally member';
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

  return (
    <div className="flex items-start gap-2.5">
      <AvatarDisplay src={author?.avatar_url} name={displayName} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 border border-gray-100 rounded-2xl px-3.5 py-2.5">
          <p className="font-jakarta font-bold text-xs text-gray-900">{displayName}</p>
          <p className="font-jakarta text-sm text-gray-800 break-words mt-0.5 leading-relaxed">{comment.content}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 px-1">
          <span className="font-jakarta text-[11px] text-gray-400">{formatTime(comment.created_at)}</span>
          <button
            onClick={handleLike}
            className={`font-jakarta text-[11px] font-semibold transition-colors ${
              comment.liked_by_me ? 'text-[#1A6B3C]' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Like{comment.likes_count > 0 ? ` (${comment.likes_count})` : ''}
          </button>
          {onReply && (
            <button onClick={onReply} className="font-jakarta text-[11px] font-semibold text-gray-400 hover:text-gray-600 transition-colors">
              Reply
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
  onAuthorClick,
}: CommentsModalProps) {
  const [comments, setComments] = useState<FeedCommentWithReplies[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [replyTarget, setReplyTarget] = useState<{ id: string; name: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localPost, setLocalPost] = useState<FeedPost | null>(post);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalPost(post);
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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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

  const handleReplyClick = (comment: FeedComment) => {
    const name = comment.author?.full_name || comment.author?.username || 'this comment';
    setReplyTarget({ id: comment.id, name });
    inputRef.current?.focus();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 transition-all"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] sm:max-h-[88vh] flex flex-col overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-white/90 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h2 className="font-fraunces text-lg font-bold text-gray-900">Post & Comments</h2>
            <span className="px-2 py-0.5 rounded-full bg-[#1A6B3C]/10 text-[#1A6B3C] font-jakarta font-semibold text-xs">
              {localPost.comments_count}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Container (FeedPostCard + Comments) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-gray-100">
          {/* Top Section: FeedPostCard */}
          <div className="bg-white p-2 sm:p-3">
            <FeedPostCard
              post={localPost}
              currentUser={currentUser}
              onToggleLike={handlePostLike}
              onCommentClick={handleFocusInput}
              onDelete={onDeletePost}
              onAuthorClick={onAuthorClick}
              showBorder={false}
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
                    <div className="w-8 h-8 bg-gray-200 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded-full w-1/4" />
                      <div className="h-10 bg-gray-100 rounded-xl w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-10 px-4 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <MessageCircle size={28} className="mx-auto text-gray-300 mb-2" />
                <p className="font-jakarta font-semibold text-sm text-gray-600">No comments yet</p>
                <p className="font-jakarta text-xs text-gray-400 mt-0.5">Be the first to join the conversation.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="space-y-3">
                    <CommentRow
                      comment={comment}
                      onToggleLike={toggleLikeAndSync}
                      onReply={() => handleReplyClick(comment)}
                    />
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-7 sm:ml-9 border-l-2 border-[#1A6B3C]/15 pl-3 sm:pl-4 space-y-3">
                        {comment.replies.map((reply) => (
                          <CommentRow key={reply.id} comment={reply} onToggleLike={toggleLikeAndSync} />
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
        <div className="px-4 py-3 border-t border-gray-100 bg-white sticky bottom-0 z-10 shadow-lg">
          {replyTarget && (
            <div className="flex items-center justify-between mb-2 px-3 py-1.5 bg-[#1A6B3C]/8 rounded-xl text-xs font-jakarta">
              <span className="text-[#1A6B3C] font-semibold">Replying to {replyTarget.name}</span>
              <button
                onClick={() => setReplyTarget(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-0.5"
              >
                <X size={14} />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <AvatarDisplay
              src={currentUser.avatar}
              name={currentUser.name}
              className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
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
              placeholder={replyTarget ? `Reply to ${replyTarget.name}…` : 'Write a comment…'}
              className="flex-1 bg-gray-100/80 focus:bg-white rounded-2xl px-4 py-2.5 font-jakarta text-sm text-gray-900 outline-none border border-transparent focus:border-[#1A6B3C]/30 focus:ring-2 focus:ring-[#1A6B3C]/20 transition-all placeholder:text-gray-400"
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim() || isSubmitting}
              className="w-9 h-9 rounded-xl bg-[#1A6B3C] text-white flex items-center justify-center disabled:opacity-40 disabled:bg-gray-200 disabled:text-gray-400 hover:bg-[#155a33] active:scale-95 transition-all flex-shrink-0 shadow-xs"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}