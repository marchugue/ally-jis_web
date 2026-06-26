import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { PageTransition } from '@/components/PageTransition';
import FeedPostCard from '@/components/feed/FeedPostCard';
import AlliesRow from '@/components/feed/AlliesRow';
import PostComposerTrigger from '@/components/ally/PostComposerTrigger';
import PostComposerModal from '@/components/feed/PostComposerModal';
import CommentsModal from '@/components/feed/CommentsModal';
import { useNewsfeed } from '@/hooks/useNewsFeed';
import { apiClient, isApiConfigured } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import type { FeedPost, FeedComment, FeedCommentWithReplies } from '@/types/feed';

export default function NewsfeedPage() {
  const {
    currentUser,
    allies,
    posts,
    isLoading,
    isLoadingMore,
    hasMore,
    banner,
    setBanner,
    loadMore,
    createPost,
    toggleLike,
    bumpCommentCount,
  } = useNewsfeed();

  const { user } = useAuth();
  const useBackend = Boolean(isApiConfigured && user);

  const [composerOpen, setComposerOpen] = useState(false);
  const [activePost, setActivePost] = useState<FeedPost | null>(null);

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  const handleDelete = useCallback(
    async (postId: string) => {
      if (!useBackend) return;
      try {
        await apiClient.deletePost(postId);
        window.location.reload();
      } catch (err: any) {
        setBanner(err.message);
      }
    },
    [useBackend, setBanner]
  );

  const loadComments = useCallback(
    async (postId: string): Promise<FeedCommentWithReplies[]> => {
      if (!useBackend) return [];
      const rows = await apiClient.listComments(postId);
      return rows as FeedCommentWithReplies[];
    },
    [useBackend]
  );

  const submitComment = useCallback(
    async (postId: string, content: string, parentCommentId?: string | null): Promise<FeedComment> => {
      const row = await apiClient.createComment(postId, {
        content,
        parentCommentId,
      });
      bumpCommentCount(postId, 1);
      return row as FeedComment;
    },
    [bumpCommentCount]
  );

  const toggleCommentLike = useCallback(async (comment: FeedComment) => {
    if (!useBackend || !activePost) return;
    if (comment.liked_by_me) {
      await apiClient.unlikeComment(comment.id);
    } else {
      await apiClient.likeComment(comment.id);
    }
  }, [useBackend, activePost]);

  return (
    <PageTransition>
      <div className="flex-1 overflow-y-auto pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto px-4 pt-5">

          {/* Error banner */}
          {banner && (
            <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 rounded-2xl px-4 py-3">
              <AlertCircle size={15} className="flex-shrink-0" />
              <p className="font-jakarta text-sm flex-1">{banner}</p>
              <button
                onClick={() => setBanner(null)}
                className="font-jakarta text-xs font-semibold text-red-400 hover:text-red-600 transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Post composer trigger */}
          <PostComposerTrigger
            currentUser={currentUser}
            onClick={() => setComposerOpen(true)}
          />

          {/* Allies strip */}
          <AlliesRow allies={allies} />

          {/* Feed */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-[#1A6B3C]/6 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded-full w-1/3" />
                      <div className="h-2.5 bg-gray-100 rounded-full w-1/4" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-3 bg-gray-100 rounded-full w-full" />
                    <div className="h-3 bg-gray-100 rounded-full w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-[#1A6B3C]/8 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <RefreshCw size={28} className="text-[#1A6B3C]/40" />
              </div>
              <p className="font-fraunces text-lg font-semibold text-gray-700 mb-1">Nothing here yet</p>
              <p className="font-jakarta text-sm text-gray-400">
                Be the first to post, or connect with more allies to see their updates.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <FeedPostCard
                  key={post.id}
                  post={post}
                  currentUser={currentUser}
                  onToggleLike={toggleLike}
                  onCommentClick={setActivePost}
                  onDelete={handleDelete}
                />
              ))}

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="h-4" />

              {isLoadingMore && (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-[#1A6B3C]/20 border-t-[#1A6B3C] rounded-full animate-spin" />
                </div>
              )}

              {!hasMore && posts.length > 0 && (
                <p className="font-jakarta text-xs text-gray-400 text-center py-4">
                  You've seen all posts
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <PostComposerModal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        currentUser={currentUser}
        onSubmit={createPost}
      />

      <CommentsModal
        post={activePost}
        currentUser={currentUser}
        onClose={() => setActivePost(null)}
        loadComments={loadComments}
        onSubmitComment={submitComment}
        onToggleCommentLike={toggleCommentLike}
      />
    </PageTransition>
  );
}