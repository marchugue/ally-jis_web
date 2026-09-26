import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Heart, Reply, UserCheck, Send, X, AlertCircle } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { PageTransition } from '@/components/PageTransition';
import FeedPostCard from '@/components/feed/FeedPostCard';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import { AnonymousAvatar } from '@/components/match/AnonymousAvatar';
import { apiClient, isApiConfigured } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { profileService } from '@/lib/services/profileService';
import { CURRENT_USER } from '@/data/mockData';
import { cn } from '@/lib/utils';
import type { FeedPost, FeedComment, FeedCommentWithReplies } from '@/types/feed';
import type { Student } from '@/types/ally';

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

function CommentItem({
  comment,
  currentUserId,
  isHighlighted,
  onReply,
  onToggleLike,
  onAuthorClick,
  isMentionAlly,
}: {
  comment: FeedComment;
  currentUserId: string;
  isHighlighted: boolean;
  onReply?: () => void;
  onToggleLike: (comment: FeedComment) => Promise<void>;
  onAuthorClick?: (authorId: string) => void;
  isMentionAlly?: (username: string) => boolean;
}) {
  const author = comment.author;
  const isOwn = comment.author_id === currentUserId;
  const isAlly = Boolean(comment.author?.is_ally || isOwn);
  const displayName = isAlly
    ? author?.full_name || (author?.username ? `@${author.username}` : 'Ally member')
    : 'Anonymous Peer';
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
    if (onAuthorClick && comment.author_id && isAlly) {
      onAuthorClick(comment.author_id);
    }
  };

  return (
    <div className="flex items-start gap-2.5 sm:gap-3 group">
      <div
        className={onAuthorClick && comment.author_id && isAlly ? 'cursor-pointer hover:opacity-85 transition-opacity flex-shrink-0' : 'flex-shrink-0'}
        onClick={handleAuthorClick}
      >
        {isAlly ? (
          <AvatarDisplay
            src={author?.avatar_url}
            name={displayName}
            className="w-8 h-8 rounded-xl object-cover ring-1 ring-black/5 dark:ring-white/10 shadow-xs"
          />
        ) : (
          <AnonymousAvatar
            avatarKey={author?.avatarKey || 'fox'}
            size={32}
            className="rounded-xl shadow-xs"
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        {/* Comment Block: Lightened background when highlighted */}
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2.5 transition-all duration-300',
            isHighlighted
              ? 'bg-emerald-50/90 dark:bg-white/[0.12] border border-emerald-300/80 dark:border-emerald-500/40 shadow-xs ring-2 ring-emerald-500/25 dark:ring-emerald-400/25'
              : 'bg-gray-50/90 dark:bg-white/[0.04] hover:bg-gray-100/70 dark:hover:bg-white/[0.06] border border-gray-100/80 dark:border-white/10'
          )}
        >
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <div
              className={cn(
                'flex items-center gap-1.5',
                onAuthorClick && comment.author_id && isAlly && 'cursor-pointer hover:underline'
              )}
              onClick={handleAuthorClick}
            >
              <p className="font-jakarta font-bold text-xs text-gray-900 dark:text-white">
                {displayName}
              </p>
              <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 font-jakarta">
                {displayHandle}
              </span>
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

            {isHighlighted && (
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold flex items-center gap-1 animate-in fade-in duration-200">
                <span>Highlighted</span>
              </span>
            )}
          </div>

          <p className="font-jakarta text-[13.5px] sm:text-sm text-gray-800 dark:text-gray-200 break-words leading-relaxed">
            {renderCommentContent(comment.content, isMentionAlly)}
          </p>
        </div>

        <div className="flex items-center gap-3 mt-1 px-1">
          <span className="font-jakarta text-[11px] text-gray-400">
            {formatTime(comment.created_at)}
          </span>
          <button
            type="button"
            onClick={handleLike}
            className={cn(
              'font-jakarta text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer',
              comment.liked_by_me
                ? 'text-red-500'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            )}
          >
            <Heart size={12} className={comment.liked_by_me ? 'fill-red-500 text-red-500' : ''} />
            <span>{comment.likes_count > 0 ? comment.likes_count : 'Like'}</span>
          </button>
          {onReply && (
            <button
              type="button"
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

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const useBackend = Boolean(isApiConfigured && user);

  // Tree navigation parameters directly from canonical URL (no router state stack)
  const targetCommentId = searchParams.get('commentId') || null;
  const parentCommentId = searchParams.get('parentId') || null;
  const notificationType = searchParams.get('type') || null;

  const [post, setPost] = useState<FeedPost | null>(null);
  const [comments, setComments] = useState<FeedCommentWithReplies[]>([]);
  const [currentUser, setCurrentUser] = useState<Student>(CURRENT_USER);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [replyTarget, setReplyTarget] = useState<{ id: string; name: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const commentRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const inputRef = useRef<HTMLInputElement>(null);
  const scrolledRef = useRef(false);
  const isReplyRequested = searchParams.get('reply') === 'true';
  const autoRepliedRef = useRef(false);

  // Load current user profile
  useEffect(() => {
    if (!user || !useBackend) {
      setCurrentUser(CURRENT_USER);
      return;
    }
    profileService.getMyProfile().then((data) => {
      setCurrentUser({
        ...CURRENT_USER,
        id: data.id,
        name: data.name,
        username: data.username,
        avatar: data.avatar || '',
      });
    }).catch(() => {
      setCurrentUser(CURRENT_USER);
    });
  }, [user, useBackend]);

  // Fetch Post and Comments
  useEffect(() => {
    if (!postId) return;
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const loadData = async () => {
      try {
        if (useBackend) {
          const [postData, commentsData] = await Promise.all([
            apiClient.getPost(postId),
            apiClient.listComments(postId).catch(() => []),
          ]);
          if (!isMounted) return;
          if (postData) {
            setPost(postData as any);
            setComments(commentsData as any);
          } else {
            setError('Post not found.');
          }
        } else {
          setError('Backend not connected.');
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to load post.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [postId, useBackend]);

  // Scroll to and highlight targeted comment or reply
  useEffect(() => {
    if (isLoading || !targetCommentId || scrolledRef.current || comments.length === 0) return;

    const timer = setTimeout(() => {
      const el = commentRefs.current.get(targetCommentId);
      if (el) {
        scrolledRef.current = true;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [isLoading, targetCommentId, comments]);

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
      if (lower === 'anonymous') return true;
      return allyUsernames.has(lower);
    },
    [allyUsernames]
  );

  const handlePostLike = useCallback(async (p: FeedPost) => {
    const nextLiked = !p.liked_by_me;
    setPost((prev) =>
      prev
        ? {
            ...prev,
            liked_by_me: nextLiked,
            likes_count: prev.likes_count + (nextLiked ? 1 : -1),
          }
        : null
    );

    if (useBackend) {
      try {
        if (nextLiked) {
          await apiClient.likePost(p.id);
        } else {
          await apiClient.unlikePost(p.id);
        }
      } catch (err) {
        console.warn('Failed to toggle post like:', err);
      }
    }
  }, [useBackend]);

  const handleToggleCommentLike = useCallback(
    async (comment: FeedComment) => {
      const nextLiked = !comment.liked_by_me;
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === comment.id) {
            return {
              ...c,
              liked_by_me: nextLiked,
              likes_count: c.likes_count + (nextLiked ? 1 : -1),
            };
          }
          return {
            ...c,
            replies: (c.replies || []).map((r) =>
              r.id === comment.id
                ? {
                    ...r,
                    liked_by_me: nextLiked,
                    likes_count: r.likes_count + (nextLiked ? 1 : -1),
                  }
                : r
            ),
          };
        })
      );

      if (useBackend) {
        try {
          if (nextLiked) {
            await apiClient.likeComment(comment.id);
          } else {
            await apiClient.unlikeComment(comment.id);
          }
        } catch (err) {
          console.warn('Failed to toggle comment like:', err);
        }
      }
    },
    [useBackend]
  );

  const handleSendComment = async () => {
    const trimmed = draft.trim();
    if (!trimmed || !postId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (useBackend) {
        const created = await apiClient.createComment(postId, {
          content: trimmed,
          parentCommentId: replyTarget?.id ?? null,
        });

        if (replyTarget) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === replyTarget.id
                ? { ...c, replies: [...(c.replies || []), created as any] }
                : c
            )
          );
        } else {
          setComments((prev) => [{ ...(created as any), replies: [] }, ...prev]);
        }

        setPost((prev) => (prev ? { ...prev, comments_count: prev.comments_count + 1 } : null));
        setDraft('');
        setReplyTarget(null);
      }
    } catch (err: any) {
      console.warn('Failed to submit comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplyClick = (targetComment: FeedComment, rootParentId?: string) => {
    const isOwn = targetComment.author_id === currentUser.id;
    const isAlly = Boolean(targetComment.author?.is_ally || isOwn);
    const handle = isAlly
      ? (targetComment.author?.username || targetComment.author?.full_name || 'ally').replace(/\s+/g, '_')
      : 'anonymous';

    const targetParentId = rootParentId || targetComment.id;
    setReplyTarget({ id: targetParentId, name: `@${handle}` });
    setDraft((prev) => {
      const tag = `@${handle} `;
      if (prev.startsWith(tag)) return prev;
      return `${tag}${prev}`;
    });
    inputRef.current?.focus();
  };

  // Auto-activate reply mode when navigated from notification with reply=true
  useEffect(() => {
    if (isLoading || comments.length === 0 || autoRepliedRef.current) return;
    if (!isReplyRequested) return;

    autoRepliedRef.current = true;
    const timer = setTimeout(() => {
      if (targetCommentId) {
        for (const c of comments) {
          if (c.id === targetCommentId) {
            handleReplyClick(c);
            return;
          }
          for (const r of c.replies || []) {
            if (r.id === targetCommentId) {
              handleReplyClick(r, c.id);
              return;
            }
          }
        }
      }
      inputRef.current?.focus();
    }, 350);

    return () => clearTimeout(timer);
  }, [isLoading, comments, targetCommentId, isReplyRequested]);

  const handleDeletePost = async (deletedPostId: string) => {
    if (!useBackend) return;
    try {
      await apiClient.deletePost(deletedPostId);
      navigate(-1);
    } catch (err) {
      console.warn('Failed to delete post:', err);
    }
  };

  return (
    <PageTransition>
      <div className="flex-1 overflow-y-auto pb-24 md:pb-12 bg-[#F7F4EF] dark:bg-[#0D131F] min-h-screen transition-colors">
        {/* Sticky Header with Back Button */}
        <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md border-b border-gray-200/80 dark:border-white/10 px-4 sm:px-6 py-3 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 2) {
                  navigate(-1);
                } else {
                  navigate('/notifications');
                }
              }}
              className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer active:scale-95"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-fraunces font-bold text-xl sm:text-2xl text-[#1A6B3C] dark:text-white tracking-tight">
              Post
            </h1>
          </div>
          {post && (
            <span className="font-jakarta text-xs text-gray-500 dark:text-gray-400">
              {post.comments_count} {post.comments_count === 1 ? 'comment' : 'comments'}
            </span>
          )}
        </div>

        {/* Content Container */}
        <div className="max-w-3xl xl:max-w-[800px] mx-auto px-0 sm:px-4 pt-0 sm:pt-6 space-y-4">
          {isLoading ? (
            <div className="bg-white dark:bg-[#181818] rounded-none sm:rounded-2xl border-y sm:border border-gray-200/80 dark:border-white/10 p-5 sm:p-6 shadow-none sm:shadow-2xs animate-pulse space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-1/5" />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-3.5 bg-gray-100 dark:bg-white/5 rounded w-full" />
                <div className="h-3.5 bg-gray-100 dark:bg-white/5 rounded w-4/5" />
              </div>
            </div>
          ) : error || !post ? (
            <div className="bg-white dark:bg-[#181818] rounded-none sm:rounded-2xl border-y sm:border border-gray-200/80 dark:border-white/10 p-12 text-center shadow-none sm:shadow-2xs space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <AlertCircle size={32} />
              </div>
              <h2 className="font-fraunces font-bold text-lg text-gray-900 dark:text-white">
                Post unavailable
              </h2>
              <p className="font-jakarta text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                {error || 'This post may have been removed or is no longer available.'}
              </p>
              <button
                type="button"
                onClick={() => navigate('/notifications')}
                className="px-5 py-2.5 rounded-xl bg-[#1A6B3C] text-white font-jakarta text-xs sm:text-sm font-bold shadow-xs hover:bg-[#155730] transition-colors cursor-pointer"
              >
                Return to Notifications
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Main Post Card */}
              <FeedPostCard
                post={post}
                currentUser={currentUser}
                onToggleLike={handlePostLike}
                onCommentClick={() => inputRef.current?.focus()}
                onDelete={handleDeletePost}
                onAuthorClick={(authorId) => navigate(`/profile/${authorId}`)}
                showBorder={true}
                className="rounded-none sm:rounded-2xl border-y sm:border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#181818] p-4 sm:p-6 shadow-none sm:shadow-2xs"
              />

              {/* Comments Section */}
              <div className="bg-white dark:bg-[#181818] rounded-none sm:rounded-2xl border-y sm:border border-gray-200/80 dark:border-white/10 p-4 sm:p-6 shadow-none sm:shadow-2xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
                  <span className="font-jakarta font-bold text-xs uppercase tracking-wider text-gray-400">
                    Comments ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
                  </span>
                </div>

                {comments.length === 0 ? (
                  <div className="text-center py-10 px-4 bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                    <MessageCircle size={28} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="font-jakarta font-semibold text-sm text-gray-600 dark:text-gray-300">
                      No comments yet
                    </p>
                    <p className="font-jakarta text-xs text-gray-400 mt-0.5">
                      Be the first to join the conversation.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => {
                      const isCommentHighlighted = targetCommentId === comment.id;

                      return (
                        <div
                          key={comment.id}
                          className="space-y-3"
                          ref={(el) => {
                            if (el) commentRefs.current.set(comment.id, el);
                            else commentRefs.current.delete(comment.id);
                          }}
                        >
                          <CommentItem
                            comment={comment}
                            currentUserId={currentUser.id}
                            isHighlighted={isCommentHighlighted}
                            onToggleLike={handleToggleCommentLike}
                            onReply={() => handleReplyClick(comment)}
                            onAuthorClick={(authorId) => navigate(`/profile/${authorId}`)}
                            isMentionAlly={isMentionAlly}
                          />

                          {/* Nested Replies */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="ml-7 sm:ml-9 border-l-2 border-[#1A6B3C]/20 dark:border-emerald-500/30 pl-3.5 sm:pl-4 space-y-3">
                              {comment.replies.map((reply) => {
                                const isReplyHighlighted = targetCommentId === reply.id;

                                return (
                                  <div
                                    key={reply.id}
                                    ref={(el) => {
                                      if (el) commentRefs.current.set(reply.id, el);
                                      else commentRefs.current.delete(reply.id);
                                    }}
                                  >
                                    <CommentItem
                                      comment={reply}
                                      currentUserId={currentUser.id}
                                      isHighlighted={isReplyHighlighted}
                                      onToggleLike={handleToggleCommentLike}
                                      onReply={() => handleReplyClick(reply, comment.id)}
                                      onAuthorClick={(authorId) => navigate(`/profile/${authorId}`)}
                                      isMentionAlly={isMentionAlly}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Comment Input Composer */}
                <div className="pt-3 border-t border-gray-100 dark:border-white/10">
                  {replyTarget && (
                    <div className="flex items-center justify-between mb-2 px-3 py-1.5 bg-[#1A6B3C]/8 dark:bg-emerald-500/20 border border-[#1A6B3C]/15 dark:border-emerald-500/30 rounded-xl text-xs font-jakarta animate-in fade-in slide-in-from-bottom-1 duration-150">
                      <span className="text-[#1A6B3C] dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                        <Reply size={13} className="stroke-[2.5]" />
                        <span>
                          Replying to <span className="font-extrabold">{replyTarget.name}</span>
                        </span>
                      </span>
                      <button
                        type="button"
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
                          handleSendComment();
                        }
                      }}
                      placeholder={
                        replyTarget
                          ? `Reply to ${replyTarget.name}…`
                          : 'Write a comment… Use @ to mention'
                      }
                      className="flex-1 bg-gray-100/80 dark:bg-white/5 focus:bg-white dark:focus:bg-white/10 rounded-2xl px-4 py-2.5 font-jakarta text-sm text-gray-900 dark:text-white outline-none border border-transparent focus:border-[#1A6B3C]/30 dark:focus:border-emerald-500/30 focus:ring-2 focus:ring-[#1A6B3C]/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                    <button
                      type="button"
                      onClick={handleSendComment}
                      disabled={!draft.trim() || isSubmitting}
                      className="w-9 h-9 rounded-xl bg-[#1A6B3C] dark:bg-emerald-600 text-white flex items-center justify-center disabled:opacity-40 disabled:bg-gray-200 dark:disabled:bg-white/10 disabled:text-gray-400 hover:bg-[#155a33] dark:hover:bg-emerald-500 active:scale-95 transition-all flex-shrink-0 shadow-xs cursor-pointer"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
