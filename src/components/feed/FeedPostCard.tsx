// src/components/feed/FeedPostCard.tsx

import { useState } from 'react';
import { ThumbsUp, MessageCircle, Globe2, Users, MoreHorizontal, Trash2 } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import type { FeedPost } from '@/types/feed';
import type { Student } from '@/types/ally';

interface FeedPostCardProps {
  post: FeedPost;
  currentUser: Student;
  onToggleLike: (post: FeedPost) => void;
  onCommentClick: (post: FeedPost) => void;
  onDelete?: (postId: string) => void;
}

function MediaGrid({ media }: { media: FeedPost['media'] }) {
  if (!media || media.length === 0) return null;

  const sorted = [...media].sort((a, b) => a.position - b.position);

  if (sorted.length === 1) {
    return (
      <div className="mt-3 lg:rounded-2xl overflow-hidden border-y lg:border border-gray-100 -mx-4 lg:mx-0">
        <img src={sorted[0].url} alt="" className="w-full object-cover max-h-[420px]" />
      </div>
    );
  }

  if (sorted.length === 2) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-1 lg:rounded-2xl overflow-hidden -mx-4 lg:mx-0">
        {sorted.map((m) => (
          <img key={m.id} src={m.url} alt="" className="w-full object-cover aspect-square" />
        ))}
      </div>
    );
  }

  if (sorted.length === 3) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-1 lg:rounded-2xl overflow-hidden -mx-4 lg:mx-0">
        <img src={sorted[0].url} alt="" className="w-full object-cover row-span-2 aspect-square" />
        <img src={sorted[1].url} alt="" className="w-full object-cover aspect-square" />
        <img src={sorted[2].url} alt="" className="w-full object-cover aspect-square" />
      </div>
    );
  }

  // 4 images
  return (
    <div className="mt-3 grid grid-cols-2 gap-1 lg:rounded-2xl overflow-hidden -mx-4 lg:mx-0">
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
}: FeedPostCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const author = post.author;
  const displayName = author?.full_name || author?.username || 'Ally member';
  const isOwn = post.author_id === currentUser.id;

  const timeAgo = (() => {
    try {
      return formatDistanceToNowStrict(new Date(post.created_at), { addSuffix: true });
    } catch {
      return '';
    }
  })();

  return (
    <article className="bg-white border-b border-[#1A6B3C]/6 lg:rounded-2xl lg:border lg:shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <AvatarDisplay
            src={author?.avatar_url}
            name={displayName}
            className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
          />
          <div className="min-w-0">
            <p className="font-jakarta font-bold text-sm text-gray-900 truncate">{displayName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-jakarta text-[11px] text-gray-400">{timeAgo}</span>
              <span className="text-gray-200">·</span>
              {post.audience === 'public' ? (
                <Globe2 size={11} className="text-gray-400" />
              ) : (
                <Users size={11} className="text-gray-400" />
              )}
            </div>
          </div>
        </div>

        {isOwn && onDelete && (
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowMenu((v) => !v)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <MoreHorizontal size={16} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-100 z-10 overflow-hidden">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(post.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-red-500 hover:bg-red-50 font-jakarta text-sm transition-colors"
                >
                  <Trash2 size={14} />
                  Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <p className="mt-3 font-jakarta text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
        {post.content}
      </p>

      {/* Media */}
      <MediaGrid media={post.media} />

      {/* Divider */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1">
        {/* Like */}
        <button
          onClick={() => onToggleLike(post)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-jakarta text-sm font-semibold transition-colors flex-1 justify-center ${
            post.liked_by_me
              ? 'bg-[#1A6B3C]/8 text-[#1A6B3C]'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
          }`}
        >
          <ThumbsUp size={16} strokeWidth={post.liked_by_me ? 2.5 : 2} />
          <span>
            {post.likes_count > 0 ? post.likes_count : ''} {post.liked_by_me ? 'Liked' : 'Like'}
          </span>
        </button>

        {/* Comment */}
        <button
          onClick={() => onCommentClick(post)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-jakarta text-sm font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors flex-1 justify-center"
        >
          <MessageCircle size={16} />
          <span>
            {post.comments_count > 0 ? post.comments_count : ''} Comment{post.comments_count !== 1 ? 's' : ''}
          </span>
        </button>
      </div>
    </article>
  );
}