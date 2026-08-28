import { useEffect, useState } from 'react';
import { X, ThumbsUp, Send } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import type { FeedCommentWithReplies, FeedComment, FeedPost } from '@/types/feed';
import type { Student } from '@/types/ally';

interface CommentsModalProps {
  post: FeedPost | null;
  currentUser: Student;
  onClose: () => void;
  loadComments: (postId: string) => Promise<FeedCommentWithReplies[]>;
  onSubmitComment: (postId: string, content: string, parentCommentId?: string | null) => Promise<FeedComment>;
  onToggleCommentLike: (comment: FeedComment) => Promise<void>;
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
        <div className="bg-gray-50 rounded-xl px-3 py-2">
          <p className="font-jakarta font-bold text-xs text-gray-900">{displayName}</p>
          <p className="font-jakarta text-sm text-gray-800 break-words">{comment.content}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 px-1">
          <span className="font-jakarta text-[11px] text-gray-400">{formatTime(comment.created_at)}</span>
          <button
            onClick={handleLike}
            className={`font-jakarta text-[11px] font-semibold ${
              comment.liked_by_me ? 'text-[#1A6B3C]' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Like{comment.likes_count > 0 ? ` (${comment.likes_count})` : ''}
          </button>
          {onReply && (
            <button onClick={onReply} className="font-jakarta text-[11px] font-semibold text-gray-400 hover:text-gray-600">
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
}: CommentsModalProps) {
  const [comments, setComments] = useState<FeedCommentWithReplies[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [replyTarget, setReplyTarget] = useState<{ id: string; name: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  }, [post?.id]);

  if (!post) return null;

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const created = await onSubmitComment(post.id, trimmed, replyTarget?.id ?? null);

      if (replyTarget) {
        setComments((prev) =>
          prev.map((c) => (c.id === replyTarget.id ? { ...c, replies: [...c.replies, created] } : c))
        );
      } else {
        setComments((prev) => [{ ...created, replies: [] }, ...prev]);
      }

      setDraft('');
      setReplyTarget(null);
    } catch {
      // surface inline rather than failing silently
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
          replies: c.replies.map((r) =>
            r.id === comment.id
              ? { ...r, liked_by_me: !r.liked_by_me, likes_count: r.likes_count + (r.liked_by_me ? -1 : 1) }
              : r
          ),
        };
      })
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-fraunces text-lg font-bold text-gray-900">Comments</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {isLoading ? (
            <p className="font-jakarta text-sm text-gray-400 text-center py-6">Loading comments…</p>
          ) : comments.length === 0 ? (
            <p className="font-jakarta text-sm text-gray-400 text-center py-6">
              No comments yet. Be the first to say something.
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="space-y-3">
                <CommentRow
                  comment={comment}
                  onToggleLike={toggleLikeAndSync}
                  onReply={() =>
                    setReplyTarget({ id: comment.id, name: comment.author?.full_name || comment.author?.username || 'this comment' })
                  }
                />
                {comment.replies.length > 0 && (
                  <div className="ml-10 space-y-3">
                    {comment.replies.map((reply) => (
                      <CommentRow key={reply.id} comment={reply} onToggleLike={toggleLikeAndSync} />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-100">
          {replyTarget && (
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="font-jakarta text-xs text-gray-500">Replying to {replyTarget.name}</span>
              <button onClick={() => setReplyTarget(null)} className="font-jakarta text-xs text-gray-400 hover:text-gray-600">
                Cancel
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <AvatarDisplay src={currentUser.avatar} name={currentUser.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={replyTarget ? `Reply to ${replyTarget.name}…` : 'Write a comment…'}
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 font-jakarta text-sm outline-none focus:ring-2 focus:ring-[#1A6B3C]/20"
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim() || isSubmitting}
              className="text-[#1A6B3C] disabled:text-gray-300 transition-colors flex-shrink-0"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}