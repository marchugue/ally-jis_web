// src/components/feed/FeedPostCard.tsx

import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Globe2, Users, MoreHorizontal, Trash2, Flag, Link2 } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { cn } from '@/lib/utils';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import { AnonymousAvatar } from '@/components/match/AnonymousAvatar';
import { apiClient } from '@/api/client';
import { notify } from '@/components/ui/sonner';
import ReportPostModal from './ReportPostModal';
import type { FeedPost } from '@/types/feed';
import type { Student } from '@/types/ally';

interface FeedPostCardProps {
  post: FeedPost;
  currentUser: Student;
  onToggleLike: (post: FeedPost) => void;
  onCommentClick: (post: FeedPost) => void;
  onDelete?: (postId: string) => void;
  /** Optional — when provided, the author name/avatar becomes clickable
   * and navigates to their profile. Omitted (e.g. on ProfilePage, which
   * only ever shows one author's posts) it's just not clickable. */
  onAuthorClick?: (authorId: string) => void;
  onToggleFollow?: (authorId: string, isFollowing: boolean) => void;
  showBorder?: boolean;
  className?: string;
}

function MediaGrid({ media, onMediaClick }: { media: FeedPost['media']; onMediaClick?: () => void }) {
  if (!media || media.length === 0) return null;

  const sorted = [...media].sort((a, b) => a.position - b.position);

  if (sorted.length === 1) {
    return (
      <div
        onClick={onMediaClick}
        className={cn(
          "mt-3 rounded-xl overflow-hidden border border-gray-100/80 dark:border-white/10 w-full bg-black/5 flex items-center justify-center",
          onMediaClick && "cursor-pointer hover:opacity-95 transition-opacity"
        )}
      >
        <img src={sorted[0].url} alt="" className="w-full h-auto max-h-[550px] object-cover" />
      </div>
    );
  }

  if (sorted.length === 2) {
    return (
      <div
        onClick={onMediaClick}
        className={cn(
          "mt-3 grid grid-cols-2 gap-1 rounded-xl overflow-hidden w-full border border-gray-100/80 dark:border-white/10",
          onMediaClick && "cursor-pointer hover:opacity-95 transition-opacity"
        )}
      >
        {sorted.map((m) => (
          <img key={m.id} src={m.url} alt="" className="w-full object-cover aspect-square" />
        ))}
      </div>
    );
  }

  if (sorted.length === 3) {
    return (
      <div
        onClick={onMediaClick}
        className={cn(
          "mt-3 grid grid-cols-2 gap-1 rounded-xl overflow-hidden w-full border border-gray-100/80 dark:border-white/10",
          onMediaClick && "cursor-pointer hover:opacity-95 transition-opacity"
        )}
      >
        <img src={sorted[0].url} alt="" className="w-full object-cover row-span-2 h-full aspect-square" />
        <img src={sorted[1].url} alt="" className="w-full object-cover aspect-square" />
        <img src={sorted[2].url} alt="" className="w-full object-cover aspect-square" />
      </div>
    );
  }

  // 4 images
  return (
    <div
      onClick={onMediaClick}
      className={cn(
        "mt-3 grid grid-cols-2 gap-1 rounded-xl overflow-hidden w-full border border-gray-100/80 dark:border-white/10",
        onMediaClick && "cursor-pointer hover:opacity-95 transition-opacity"
      )}
    >
      {sorted.slice(0, 4).map((m) => (
        <img key={m.id} src={m.url} alt="" className="w-full object-cover aspect-square" />
      ))}
    </div>
  );
}

export default function FeedPostCard({
  post,
  currentUser,
  onToggleLike,
  onCommentClick,
  onDelete,
  onAuthorClick,
  onToggleFollow,
  showBorder = true,
  className,
}: FeedPostCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const author = post.author;
  const isOwn = post.author_id === currentUser.id;
  const isAlly = Boolean(post.author?.is_ally || isOwn);
  const displayName = isAlly
    ? (author?.full_name || author?.username || 'Ally member')
    : 'Anonymous Peer';

  const [isFollowing, setIsFollowing] = useState(Boolean(author?.is_following));
  const [followBusy, setFollowBusy] = useState(false);

  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleCopyLink = () => {
    setShowMenu(false);
    const url = `${window.location.origin}/feed#post-${post.id}`;
    navigator.clipboard.writeText(url).then(() => {
      notify.success('Link copied', 'Post link copied to clipboard.');
    }).catch(() => {
      notify.error('Could not copy link');
    });
  };

  useEffect(() => {
    setIsFollowing(Boolean(author?.is_following));
  }, [author?.is_following]);

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!post.author_id || followBusy) return;
    const next = !isFollowing;
    setIsFollowing(next);
    onToggleFollow?.(post.author_id, next);
    setFollowBusy(true);
    try {
      if (next) {
        await apiClient.followUser(post.author_id);
      } else {
        await apiClient.unfollowUser(post.author_id);
      }
    } catch (err: any) {
      console.warn('Failed to toggle follow:', err);
      setIsFollowing(!next);
      onToggleFollow?.(post.author_id, !next);
    } finally {
      setFollowBusy(false);
    }
  };

  const timeAgo = (() => {
    try {
      return formatDistanceToNowStrict(new Date(post.created_at), { addSuffix: true });
    } catch {
      return '';
    }
  })();

  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const isLongContent = Boolean(post.content && post.content.length > 120);

  return (
    <article
      id={`post-${post.id}`}
      className={cn(
        'bg-white dark:bg-[#181818] p-4 sm:p-6 transition-colors',
        showBorder
          ? 'border-0 border-b border-[#E2DED7] dark:border-white/10 rounded-none sm:rounded-2xl sm:border sm:border-gray-200/80 dark:sm:border-white/10 shadow-none sm:shadow-2xs'
          : 'rounded-none sm:rounded-2xl border-0 shadow-none',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div
          className={`flex items-center gap-3 min-w-0 ${onAuthorClick && !isOwn && post.author_id ? 'cursor-pointer hover:opacity-85 transition-opacity' : ''}`}
          onClick={() => { if (onAuthorClick && !isOwn && post.author_id) onAuthorClick(post.author_id); }}
        >
          {isAlly ? (
            <AvatarDisplay
              src={author?.avatar_url}
              name={displayName}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <AnonymousAvatar
              avatarKey={author?.avatarKey || 'fox'}
              size={40}
              className="rounded-full flex-shrink-0 shadow-xs"
            />
          )}
          <div className="min-w-0">
            <p className="font-jakarta font-semibold text-sm text-gray-900 dark:text-white truncate">{displayName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-jakarta text-[11px] text-gray-400 dark:text-gray-500">
                {isAlly && author?.username ? `@${author.username} · ` : ''}{timeAgo}
              </span>
              <span className="text-gray-200 dark:text-gray-700">·</span>
              {post.audience === 'public' ? (
                <Globe2 size={11} className="text-gray-400 dark:text-gray-500" />
              ) : (
                <Users size={11} className="text-gray-400 dark:text-gray-500" />
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {!isOwn && isAlly && post.author_id && (
            <button
              type="button"
              onClick={handleToggleFollow}
              disabled={followBusy}
              className={cn(
                "px-3 py-1 rounded-full text-[11px] font-jakarta font-semibold transition-all flex items-center gap-1 disabled:opacity-60 cursor-pointer",
                isFollowing
                  ? "bg-gray-100 hover:bg-gray-200/80 dark:bg-white/10 dark:hover:bg-white/15 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10"
                  : "bg-[#1A6B3C]/10 hover:bg-[#1A6B3C]/15 text-[#1A6B3C] dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 border border-[#1A6B3C]/25 dark:border-emerald-500/30 font-bold"
              )}
            >
              {isFollowing ? "Following" : "+ Follow"}
            </button>
          )}

          {/* Postcard Settings Menu */}
          <div ref={menuRef} className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowMenu((v) => !v)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
              aria-label="Post settings"
            >
              <MoreHorizontal size={17} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-[#1A2234] rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 z-20 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 font-jakarta text-xs transition-colors text-left font-medium"
                >
                  <Link2 size={14} className="text-gray-400" />
                  Copy link to post
                </button>

                {!isOwn && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      setShowReportModal(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 font-jakarta text-xs transition-colors text-left font-semibold"
                  >
                    <Flag size={14} className="text-red-500" />
                    Report post
                  </button>
                )}

                {isOwn && onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(post.id);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 font-jakarta text-xs transition-colors text-left font-semibold"
                  >
                    <Trash2 size={14} className="text-red-500" />
                    Delete post
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <div className="mt-2.5">
          <p
            className={cn(
              "font-jakarta text-[14.5px] sm:text-[15px] text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap break-words",
              isLongContent && !isContentExpanded && "line-clamp-3"
            )}
          >
            {post.content}
          </p>
          {isLongContent && (
            <button
              type="button"
              onClick={() => setIsContentExpanded(!isContentExpanded)}
              className="font-jakarta text-xs font-bold text-[#1A6B3C] dark:text-emerald-400 mt-1 hover:underline cursor-pointer focus:outline-none"
            >
              {isContentExpanded ? 'Show less' : '...more'}
            </button>
          )}
        </div>
      )}

      {/* Media */}
      <MediaGrid media={post.media} onMediaClick={() => onCommentClick(post)} />

      {/* Actions (Left-aligned, icon-only with count matching mobile) */}
      <div className="mt-3 pt-2.5 border-t border-gray-100/80 dark:border-white/10 flex items-center gap-5 sm:gap-6">
        {/* Like (Heart) */}
        <button
          type="button"
          onClick={() => onToggleLike(post)}
          className={cn(
            "flex items-center gap-1.5 py-1 px-1 -ml-1 rounded-lg font-jakarta text-xs sm:text-[13px] font-medium transition-all active:scale-95 group cursor-pointer",
            post.liked_by_me
              ? "text-[#1A6B3C] dark:text-emerald-400"
              : "text-gray-400 dark:text-gray-500 hover:text-[#1A6B3C] dark:hover:text-emerald-400"
          )}
          aria-label={post.liked_by_me ? "Unlike post" : "Like post"}
        >
          <Heart
            size={18}
            className={cn(
              "transition-transform duration-150 group-hover:scale-110",
              post.liked_by_me
                ? "fill-[#1A6B3C] text-[#1A6B3C] dark:fill-emerald-400 dark:text-emerald-400"
                : "text-gray-400 dark:text-gray-500 group-hover:text-[#1A6B3C] dark:group-hover:text-emerald-400"
            )}
            strokeWidth={post.liked_by_me ? 2.5 : 2}
          />
          {post.likes_count > 0 && (
            <span
              className={cn(
                "font-medium text-xs sm:text-[13px]",
                post.liked_by_me
                  ? "text-[#1A6B3C] dark:text-emerald-400"
                  : "text-gray-600 dark:text-gray-400"
              )}
            >
              {post.likes_count}
            </span>
          )}
        </button>

        {/* Comment */}
        <button
          type="button"
          onClick={() => onCommentClick(post)}
          className="flex items-center gap-1.5 py-1 px-1 rounded-lg font-jakarta text-xs sm:text-[13px] font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors group active:scale-95 cursor-pointer"
          aria-label="Comment on post"
        >
          <MessageCircle
            size={18}
            className="text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-transform group-hover:scale-110"
            strokeWidth={2}
          />
          {post.comments_count > 0 && (
            <span className="font-medium text-xs sm:text-[13px] text-gray-600 dark:text-gray-400">
              {post.comments_count}
            </span>
          )}
        </button>
      </div>

      {showReportModal && (
        <ReportPostModal
          post={post}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </article>
  );
}