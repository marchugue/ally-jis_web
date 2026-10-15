// src/hooks/useNewsfeed.ts
//
// Newsfeed data logic with:
// 1. Client-side caching of up to 20 posts (instant initial display).
// 2. Tab reopen detection: reloads feed if there are new posts on backend,
//    otherwise serves from cache.
// 3. In-app visibility: only refreshes if reloaded, scrolled up (pull to refresh),
//    or if there are >20 new posts.
// 4. Manual / gesture pull-to-refresh (scroll up).

import { useCallback, useEffect, useRef, useState } from 'react';
import { CURRENT_USER } from '@/data/mockData';
import { apiClient, isApiConfigured } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { profileService, profileMapper } from '@/lib/services/profileService';
import { newsfeedCache } from '@/lib/services/newsfeedCache';
import type { Student } from '@/types/ally';
import type { FeedPost, PostAudience } from '@/types/feed';

const PAGE_SIZE = 30;

export type FeedFilterTab = 'popular' | 'allies' | 'following';

export function useNewsfeed() {
  const { user, loading: authLoading } = useAuth();
  const useBackend = Boolean(isApiConfigured && user);

  const [activeFilter, setActiveFilter] = useState<FeedFilterTab>('popular');

  // Attempt instant initialization from cache for the active filter
  const initialCache = newsfeedCache.get(user?.id, activeFilter);
  const [profile, setProfile] = useState<Student | null>(null);
  const [allies, setAllies] = useState<Student[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>(() => initialCache?.posts ?? []);
  const [isLoading, setIsLoading] = useState(() => !initialCache || initialCache.posts.length === 0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [banner, setBanner] = useState<string | null>(null);
  const [newPostsCount, setNewPostsCount] = useState(0);

  const currentUser = profile ?? CURRENT_USER;
  const cursorRef = useRef<string | undefined>(undefined);
  const postsRef = useRef<FeedPost[]>(posts);
  postsRef.current = posts;

  const lastCheckedAtRef = useRef<number>(Date.now());
  const isCheckingRef = useRef<boolean>(false);

  // ── Core feed fetcher (used on initial load and on full refresh) ───────────────
  const fetchFeedPage = useCallback(
    async (isBackground = false) => {
      if (!useBackend || !user) return;
      if (!isBackground) {
        setIsRefreshing(true);
      }

      try {
        const feedPage = await apiClient.listFeed({ limit: PAGE_SIZE, filter: activeFilter });
        setPosts(feedPage);
        setHasMore(feedPage.length === PAGE_SIZE);
        cursorRef.current = feedPage.length > 0 ? feedPage[feedPage.length - 1].created_at : undefined;
        // Cache up to 20 posts
        newsfeedCache.set(user.id, activeFilter, feedPage);
        setNewPostsCount(0);
      } catch (err: any) {
        if (!isBackground) {
          setBanner(err.message);
        }
      } finally {
        if (!isBackground) {
          setIsRefreshing(false);
          setIsLoading(false);
        }
      }
    },
    [useBackend, user, activeFilter]
  );

  // ── Manual / Gesture Pull-to-Refresh (Scroll up) ─────────────────────────────
  const refreshFeed = useCallback(async () => {
    await fetchFeedPage(false);
  }, [fetchFeedPage]);

  // ── Initial load & filter tab switches ────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const loadInitial = async () => {
      if (authLoading) return;
      if (!useBackend || !user) {
        setProfile(CURRENT_USER);
        setIsLoading(false);
        return;
      }

      // Check cache for this specific filter
      const cached = newsfeedCache.get(user.id, activeFilter);
      if (cached && cached.posts.length > 0) {
        setPosts(cached.posts);
        cursorRef.current = cached.latestCreatedAt ?? undefined;
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }

      setBanner(null);

      try {
        const [current, interactions, feedPage] = await Promise.all([
          profileService.getProfile(user.id),
          apiClient.listMyInteractions(),
          apiClient.listFeed({ limit: PAGE_SIZE, filter: activeFilter }),
        ]);

        if (!isMounted) return;

        setProfile(current);

        const acceptedIds = (interactions ?? [])
          .filter((r) => r.status === 'accepted')
          .map((r) => r.target_user_id);

        if (acceptedIds.length > 0) {
          const allyRows = await apiClient.getProfilesByIds(acceptedIds);
          if (isMounted) setAllies(allyRows.map(profileMapper));
        }

        setPosts(feedPage);
        setHasMore(feedPage.length === PAGE_SIZE);
        cursorRef.current = feedPage.length > 0 ? feedPage[feedPage.length - 1].created_at : undefined;
        // Save fresh feed to cache
        newsfeedCache.set(user.id, activeFilter, feedPage);
      } catch (err: any) {
        if (isMounted) setBanner(err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadInitial();
    return () => {
      isMounted = false;
    };
  }, [useBackend, user?.id, activeFilter, authLoading]);

  // ── Tab Reopen Handler: Checks backend when user reopens / switches back to tab ──
  useEffect(() => {
    if (!useBackend || !user) return;

    const handleTabReopen = async () => {
      if (document.visibilityState !== 'visible' || isCheckingRef.current) return;
      isCheckingRef.current = true;

      try {
        // Quick peek: check latest post on backend for this filter
        const peek = await apiClient.listFeed({ limit: 1, filter: activeFilter });
        if (peek.length === 0) return;

        const currentTopId = postsRef.current[0]?.id;
        const latestBackendPost = peek[0];

        if (currentTopId && latestBackendPost.id !== currentTopId) {
          // Backend has new post(s)! Reload the newsfeed and update cache
          await fetchFeedPage(false);
        } else {
          // No new posts: keep cache intact without unnecessary reload
        }
      } catch (err) {
        console.warn('[useNewsfeed] Failed to peek latest posts on tab reopen:', err);
      } finally {
        isCheckingRef.current = false;
        lastCheckedAtRef.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleTabReopen);
    window.addEventListener('focus', handleTabReopen);

    return () => {
      document.removeEventListener('visibilitychange', handleTabReopen);
      window.removeEventListener('focus', handleTabReopen);
    };
  }, [useBackend, user?.id, activeFilter, fetchFeedPage]);

  // ── In-App Background Polling: only refresh if >20 new posts ───────────────────
  useEffect(() => {
    if (!useBackend || !user) return;

    const interval = setInterval(async () => {
      // Only check if user is currently active on the page
      if (document.visibilityState !== 'visible' || isCheckingRef.current) return;
      const currentTop = postsRef.current[0];
      if (!currentTop) return;

      isCheckingRef.current = true;
      try {
        // Fetch up to 25 recent posts to count new arrivals
        const peek = await apiClient.listFeed({ limit: 25, filter: activeFilter });
        const topIdx = peek.findIndex((p) => p.id === currentTop.id);

        let count = 0;
        if (topIdx > -1) {
          count = topIdx;
        } else if (peek.length > 0) {
          // More than 25 new posts!
          count = 25;
        }

        if (count > 20) {
          // Rule: If has more than 20 new posts while in the app, refresh automatically
          await fetchFeedPage(true);
        } else {
          setNewPostsCount(count);
        }
      } catch {
        // Ignore background polling errors
      } finally {
        isCheckingRef.current = false;
      }
    }, 40000); // Check every 40s

    return () => clearInterval(interval);
  }, [useBackend, user?.id, activeFilter, fetchFeedPage]);

  // ── Infinite scroll pagination ───────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (!useBackend || isLoadingMore || !hasMore || !cursorRef.current) return;
    setIsLoadingMore(true);
    try {
      const nextPage = await apiClient.listFeed({
        limit: PAGE_SIZE,
        before: cursorRef.current,
        filter: activeFilter,
      });
      if (nextPage.length === 0) {
        setHasMore(false);
      } else {
        setPosts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newUniquePosts = nextPage.filter((p) => !existingIds.has(p.id));
          return [...prev, ...newUniquePosts];
        });
        setHasMore(nextPage.length === PAGE_SIZE);
        cursorRef.current = nextPage[nextPage.length - 1].created_at;
      }
    } catch (err: any) {
      setBanner(err.message);
    } finally {
      setIsLoadingMore(false);
    }
  }, [useBackend, isLoadingMore, hasMore, activeFilter]);

  // ── Create Post ──────────────────────────────────────────────────────────────
  const createPost = useCallback(
    async ({ content, audience, files }: { content: string; audience: PostAudience; files: File[] }) => {
      let mediaUrls: string[] = [];
      if (files.length > 0) {
        const uploadResult = await apiClient.uploadPostMedia(files);
        mediaUrls = uploadResult.urls;
      }

      const created = await apiClient.createPost({ content, audience, mediaUrls });
      setPosts((prev) => {
        const next = [created, ...prev];
        if (user?.id) {
          newsfeedCache.set(user.id, activeFilter, next);
        }
        return next;
      });
    },
    [user?.id, activeFilter]
  );

  // ── Like Toggle (Optimistic + Cache Update) ──────────────────────────────────
  const toggleLike = useCallback(
    async (post: FeedPost) => {
      const wasLiked = post.liked_by_me;
      const optimisticPost: FeedPost = {
        ...post,
        liked_by_me: !wasLiked,
        likes_count: post.likes_count + (wasLiked ? -1 : 1),
      };

      setPosts((prev) => prev.map((p) => (p.id === post.id ? optimisticPost : p)));
      if (user?.id) {
        newsfeedCache.updatePost(user.id, activeFilter, optimisticPost);
      }

      try {
        const result = wasLiked ? await apiClient.unlikePost(post.id) : await apiClient.likePost(post.id);
        const resolvedPost: FeedPost = {
          ...post,
          liked_by_me: result.liked,
          likes_count: result.likesCount,
        };
        setPosts((prev) => prev.map((p) => (p.id === post.id ? resolvedPost : p)));
        if (user?.id) {
          newsfeedCache.updatePost(user.id, activeFilter, resolvedPost);
        }
      } catch (err: any) {
        // Revert on failure
        setPosts((prev) => prev.map((p) => (p.id === post.id ? post : p)));
        if (user?.id) {
          newsfeedCache.updatePost(user.id, activeFilter, post);
        }
        setBanner(err.message);
      }
    },
    [user?.id, activeFilter]
  );

  const bumpCommentCount = useCallback(
    (postId: string, delta: number) => {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const updated = { ...p, comments_count: p.comments_count + delta };
          if (user?.id) {
            newsfeedCache.updatePost(user.id, activeFilter, updated);
          }
          return updated;
        })
      );
    },
    [user?.id, activeFilter]
  );

  const toggleFollow = useCallback((authorId: string, isFollowing: boolean) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.author_id === authorId && p.author
          ? { ...p, author: { ...p.author, is_following: isFollowing } }
          : p
      )
    );
  }, []);

  return {
    currentUser,
    allies,
    posts,
    activeFilter,
    setActiveFilter,
    isLoading,
    isLoadingMore,
    isRefreshing,
    hasMore,
    banner,
    setBanner,
    loadMore,
    refreshFeed,
    createPost,
    toggleLike,
    toggleFollow,
    bumpCommentCount,
    newPostsCount,
  };
}