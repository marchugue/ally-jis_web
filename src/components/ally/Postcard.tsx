import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNowStrict } from 'date-fns';
import { ThumbsUp, MessageCircle, Maximize2, Globe2, Users } from 'lucide-react';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import type { FeedPost } from '@/types/feed';

interface PostCardProps {
  post: FeedPost;
  onToggleLike: (post: FeedPost) => void;
  onOpenComments: (post: FeedPost) => void;
  onExpand: (post: FeedPost) => void;
}

function formatPostTime(value: string) {
  try {
    return formatDistanceToNowStrict(new Date(value), { addSuffix: true });
  } catch {
    return '';
  }
}

// Lays out up to 4 images the way the wireframe shows it:
// 1 image -> full width
// 2 images -> two even columns
// 3 images -> one tall left + two stacked right
// 4 images -> 2x2 grid
function MediaGrid({ media }: { media: FeedPost['media'] }) {
  if (media.length === 0) return null;
  const ordered = [...media].sort((a, b) => a.position - b.position);

  if (ordered.length === 1) {
    return (
      <div className="border-t border-gray-100">
        <img src={ordered[0].url} alt="" className="w-full max-h-[480px] object-cover" />
      </div>
    );
  }

  if (ordered.length === 2) {
    return (
      <div className="grid grid-cols-2 border-t border-gray-100">
        {ordered.map((m) => (
          <img key={m.id} src={m.url} alt="" className="w-full h-64 object-cover" />
        ))}
      </div>
    );
  }

  if (ordered.length === 3) {
    return (
      <div className="grid grid-cols-2 gap-0.5 border-t border-gray-100">
        <img src={ordered[0].url} alt="" className="w-full h-64 object-cover col-span-1 row-span-2" />
        <img src={ordered[1].url} alt="" className="w-full h-32 object-cover" />
        <img src={ordered[2].url} alt="" className="w-full h-32 object-cover" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-0.5 border-t border-gray-100">
      {ordered.slice(0, 4).map((m) => (
        <img key={m.id} src={m.url} alt="" className="w-full h-40 object-cover" />
      ))}
    </div>
  );
}

export default function PostCard({ post, onToggleLike, onOpenComments, onExpand }: PostCardProps) {
  const [isLiking, setIsLiking] = useState(false);
  const author = post.author;
  const displayName = author?.full_name || author?.username || 'Ally member';

  const handleLikeClick = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      await onToggleLike(post);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#1A6B3C]/6 card-shadow hover:card-shadow-hover transition-shadow overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <Link to={`/profile/${post.author_id}`} className="flex-shrink-0">
          <AvatarDisplay
            src={author?.avatar_url}
            name={displayName}
            className="w-11 h-11 rounded-xl object-cover"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/profile/${post.author_id}`} className="font-jakarta font-bold text-gray-900 text-sm hover:underline">
            {displayName}
          </Link>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="font-jakarta text-xs text-gray-400">{formatPostTime(post.created_at)}</span>
            <span className="text-gray-300">·</span>
            {post.audience === 'public' ? (
              <Globe2 size={11} className="text-gray-400" />
            ) : (
              <Users size={11} className="text-gray-400" />
            )}
          </div>
        </div>
        <button
          onClick={() => onExpand(post)}
          className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0"
          aria-label="Expand post"
        >
          <Maximize2 size={16} />
        </button>
      </div>

      {/* Body text */}
      {post.content && (
        <p className="font-jakarta text-sm text-gray-800 px-4 pb-3 whitespace-pre-wrap break-words">
          {post.content}
        </p>
      )}

      {/* Media grid */}
      <MediaGrid media={post.media} />

      {/* Counts */}
      {(post.likes_count > 0 || post.comments_count > 0) && (
        <div className="flex items-center justify-between px-4 pt-3 font-jakarta text-xs text-gray-400">
          <span>{post.likes_count > 0 ? `${post.likes_count} like${post.likes_count === 1 ? '' : 's'}` : ''}</span>
          <span>{post.comments_count > 0 ? `${post.comments_count} comment${post.comments_count === 1 ? '' : 's'}` : ''}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center border-t border-gray-100 mt-3">
        <button
          onClick={handleLikeClick}
          disabled={isLiking}
          className={`flex-1 flex items-center justify-center gap-2 py-3 font-jakarta text-sm font-semibold transition-colors ${
            post.liked_by_me ? 'text-[#1A6B3C]' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ThumbsUp size={16} fill={post.liked_by_me ? 'currentColor' : 'none'} />
          Like
        </button>
        <div className="w-px h-6 bg-gray-100" />
        <button
          onClick={() => onOpenComments(post)}
          className="flex-1 flex items-center justify-center gap-2 py-3 font-jakarta text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
        >
          <MessageCircle size={16} />
          Comment
        </button>
      </div>
    </div>
  );
}