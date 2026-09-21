import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { AlertCircle, RefreshCw, Plus, Home, Users } from 'lucide-react';
import { PageTransition } from '@/components/PageTransition';
import FeedPostCard from '@/components/feed/FeedPostCard';
import PostComposerTrigger from '@/components/ally/PostComposerTrigger';
import PostComposerModal from '@/components/feed/PostComposerModal';
import CommentsModal from '@/components/feed/CommentsModal';
import { useNewsfeed, FeedFilterTab } from '@/hooks/useNewsFeed';
import { apiClient, isApiConfigured } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import type { FeedPost, FeedComment, FeedCommentWithReplies } from '@/types/feed';

export default function NewsfeedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const {
    currentUser,
    allies,
    posts,
    activeFilter,
    setActiveFilter,
    isLoading,
    isLoadingMore,
    hasMore,
    banner,
    setBanner,
    loadMore,
    createPost,
    toggleLike,
    toggleFollow,
    bumpCommentCount,
  } = useNewsfeed();

  const { user } = useAuth();
  const useBackend = Boolean(isApiConfigured && user);

  const [composerOpen, setComposerOpen] = useState(false);
  const [activePost, setActivePost] = useState<FeedPost | null>(null);
  const [pendingReplyCommentId, setPendingReplyCommentId] = useState<string | null>(null);
  const handledDeepLinkRef = useRef<string | null>(null);

  // Deep-link direct post scroll & auto open comments
  useEffect(() => {
    const targetPostId = (location.state as any)?.targetPostId || searchParams.get('postId');
    const shouldOpenComments = (location.state as any)?.openComments || searchParams.get('openComments') === 'true';
    const replyToCommentId: string | null = (location.state as any)?.replyToCommentId ?? null;

    if (!targetPostId || handledDeepLinkRef.current === targetPostId) return;

    let timer: any;

    const locateAndOpen = async () => {
      let targetPost = posts.find((p) => p.id === targetPostId);

      if (!targetPost && useBackend) {
        try {
          const fetched = await apiClient.getPost(targetPostId);
          if (fetched) {
            targetPost = fetched as any;
          }
        } catch (err) {
          console.warn('[Newsfeed] Failed to fetch deep link post:', err);
        }
      }

      if (targetPost) {
        handledDeepLinkRef.current = targetPostId;
        timer = setTimeout(() => {
          const el = document.getElementById(`post-${targetPostId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-2', 'ring-[#1A6B3C]', 'dark:ring-emerald-400', 'transition-all');
            setTimeout(() => {
              el.classList.remove('ring-2', 'ring-[#1A6B3C]', 'dark:ring-emerald-400');
            }, 2500);
          }
          if (shouldOpenComments) {
            setPendingReplyCommentId(replyToCommentId);
            setActivePost(targetPost!);
          }
        }, 350);
      }
    };

    if (!isLoading) {
      void locateAndOpen();
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [location.state, searchParams, posts, isLoading, useBackend]);

  // Infinite scroll sentinel with prefetch margin
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { rootMargin: '300px', threshold: 0.05 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMore, hasMore, isLoadingMore]);

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
        {/* ── Mobile Sticky Header Bar: Ally-jis Label on Left & Filter Pills on Right ── */}
        <div className="md:hidden sticky top-0 z-20 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md border-b border-[#E2DED7] dark:border-white/10 px-4 py-2.5 flex items-center justify-between shadow-2xs">
          <span className="font-fraunces text-[22px] font-bold text-[#1A6B3C] dark:text-white tracking-tight">
            Ally<span className="text-[#E8A838]">-jis</span>
          </span>

          <div className="flex items-center gap-1.5">
            {(
              [
                { key: 'popular', label: 'All Feed' },
                { key: 'allies', label: 'Allies' },
                { key: 'following', label: 'Following' },
              ] as const
            ).map((tab) => {
              const isSelected = activeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveFilter(tab.key)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-jakarta font-semibold transition-all whitespace-nowrap cursor-pointer",
                    isSelected
                      ? "bg-[#1A6B3C] text-white shadow-xs"
                      : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200/80 dark:hover:bg-white/15"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contained column matching profile page stream width */}
        <div className="max-w-4xl xl:max-w-[900px] mx-auto px-0 sm:px-4 lg:px-6 pt-0 sm:pt-5 pb-12">

          {/* Error banner */}
          {banner && (
            <div className="mb-3 mx-3 sm:mx-0 flex items-center gap-2 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-xl sm:rounded-2xl px-4 py-3">
              <AlertCircle size={15} className="flex-shrink-0" />
              <p className="font-jakarta text-sm flex-1">{banner}</p>
              <button
                onClick={() => setBanner(null)}
                className="font-jakarta text-xs font-semibold text-red-400 dark:text-red-300 hover:text-red-600 dark:hover:text-red-200 transition-colors cursor-pointer"
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

          {/* Desktop Feed Filter Tabs */}
          <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-3 mb-4 mx-3 sm:mx-0 scrollbar-none">
            {(
              [
                { key: 'popular', label: 'All Feed' },
                { key: 'allies', label: 'Allies' },
                { key: 'following', label: 'Following' },
              ] as const
            ).map((tab) => {
              const isSelected = activeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveFilter(tab.key)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-jakarta font-semibold transition-all whitespace-nowrap cursor-pointer",
                    isSelected
                      ? "bg-[#1A6B3C] text-white shadow-xs"
                      : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Feed */}
          {isLoading ? (
            <div className="divide-y divide-[#E2DED7] dark:divide-white/10 sm:divide-y-0 sm:space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-[#181818] border-0 border-b border-[#E2DED7] dark:border-white/10 sm:border sm:border-gray-200/80 dark:sm:border-white/10 rounded-none sm:rounded-2xl p-4 sm:p-6 shadow-none sm:shadow-2xs animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-white/10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-gray-200 dark:bg-white/10 rounded-md w-1/3" />
                      <div className="h-2.5 bg-gray-200 dark:bg-white/10 rounded-md w-1/5" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-md w-full" />
                    <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-md w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-none sm:rounded-2xl border-0 border-b border-[#E2DED7] dark:border-white/10 sm:border sm:border-gray-200/80 dark:sm:border-white/10 bg-white dark:bg-[#181818] px-6 py-16 flex flex-col items-center justify-center text-center shadow-none sm:shadow-2xs">
              <div className="w-16 h-16 bg-[#1A6B3C]/10 dark:bg-emerald-500/15 border border-[#1A6B3C]/20 dark:border-emerald-500/30 rounded-2xl flex items-center justify-center mb-4">
                {activeFilter === 'allies' ? (
                  <Users size={28} className="text-[#1A6B3C] dark:text-emerald-400" />
                ) : (
                  <Home size={28} className="text-[#1A6B3C] dark:text-emerald-400" />
                )}
              </div>
              <p className="font-fraunces text-lg font-bold text-gray-900 dark:text-white mb-1.5 tracking-tight">
                {activeFilter === 'allies'
                  ? 'No posts from allies yet'
                  : activeFilter === 'following'
                  ? 'No posts from following yet'
                  : 'Your feed is empty'}
              </p>
              <p className="font-jakarta text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6 leading-relaxed">
                {activeFilter === 'allies'
                  ? 'Connect with classmates to see their posts in your Allies feed.'
                  : activeFilter === 'following'
                  ? 'Follow other students to see their latest posts in your feed.'
                  : 'Follow classmates and connect with allies to see their posts here.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (activeFilter === 'allies' || activeFilter === 'following') {
                    navigate('/discover');
                  } else {
                    setComposerOpen(true);
                  }
                }}
                className="px-5 py-2.5 rounded-full bg-[#1A6B3C] hover:bg-[#155730] text-white font-jakarta text-xs sm:text-sm font-semibold transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
              >
                {activeFilter === 'allies' || activeFilter === 'following' ? 'Find Allies' : 'Create a post'}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#E2DED7] dark:divide-white/10 sm:divide-y-0 sm:space-y-3">
              {posts.map((post) => (
                <FeedPostCard
                  key={post.id}
                  post={post}
                  currentUser={currentUser}
                  onToggleLike={toggleLike}
                  onCommentClick={setActivePost}
                  onDelete={handleDelete}
                  onAuthorClick={(authorId) => navigate(`/profile/${authorId}`)}
                  onToggleFollow={toggleFollow}
                  className="rounded-none sm:rounded-2xl border-0 border-b border-[#E2DED7] dark:border-white/10 sm:border sm:border-gray-200/80 dark:sm:border-white/10 bg-white dark:bg-[#181818] p-4 sm:p-6 shadow-none sm:shadow-2xs transition-colors"
                />
              ))}

              {/* Infinite scroll sentinel (only rendered if there are more posts to load) */}
              {hasMore && <div ref={sentinelRef} className="h-4" />}

              {isLoadingMore && (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-[#1A6B3C]/20 dark:border-emerald-500/20 border-t-[#1A6B3C] dark:border-t-emerald-400 rounded-full animate-spin" />
                </div>
              )}

              {!hasMore && posts.length > 0 && (
                <p className="font-jakarta text-xs text-gray-400 dark:text-gray-500 text-center py-4">
                  You've seen all posts
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Mobile Floating Action Button (FAB) ── */}
        <button
          type="button"
          onClick={() => setComposerOpen(true)}
          aria-label="Create a post"
          className="md:hidden fixed bottom-20 right-4 w-14 h-14 rounded-2xl bg-[#1A6B3C] text-white flex items-center justify-center shadow-lg shadow-[#1A6B3C]/35 hover:bg-[#155730] active:scale-95 transition-all z-40 cursor-pointer"
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
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
        onClose={() => {
          setActivePost(null);
          setPendingReplyCommentId(null);
        }}
        loadComments={loadComments}
        onSubmitComment={submitComment}
        onToggleCommentLike={toggleCommentLike}
        onTogglePostLike={toggleLike}
        onDeletePost={handleDelete}
        initialReplyCommentId={pendingReplyCommentId}
        onAuthorClick={(authorId) => {
          setActivePost(null);
          navigate(`/profile/${authorId}`);
        }}
        onToggleFollow={toggleFollow}
      />
    </PageTransition>
  );
}