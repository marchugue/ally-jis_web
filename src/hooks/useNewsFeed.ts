// src/hooks/useNewsfeed.ts
//
// All newsfeed data logic lives here: initial load (profile, allies,
// first feed page), pagination, optimistic like toggling, and post
// creation. NewsfeedPage.tsx just renders what this hook gives it.

import { useCallback, useEffect, useRef, useState } from 'react';
import { CURRENT_USER } from '@/data/mockData';
import { apiClient, isApiConfigured } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { profileService, profileMapper } from '@/lib/services/profileService';
import type { Student } from '@/types/ally';
import type { FeedPost, PostAudience } from '@/types/feed';

const PAGE_SIZE = 10;

export function useNewsfeed() {
  const { user, loading: authLoading } = useAuth();
  const useBackend = Boolean(isApiConfigured && user);

  const [profile, setProfile] = useState<Student | null>(null);
  const [allies, setAllies] = useState<Student[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [banner, setBanner] = useState<string | null>(null);

  const currentUser = profile ?? CURRENT_USER;
  const cursorRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;

    const loadInitial = async () => {
      if (authLoading) return;
      if (!useBackend || !user) {
        setProfile(CURRENT_USER);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setBanner(null);

      try {
        const [current, interactions, feedPage] = await Promise.all([
          profileService.getProfile(user.id),
          apiClient.listMyInteractions(),
          apiClient.listFeed({ limit: PAGE_SIZE }),
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
  }, [useBackend, user?.id]);

  const loadMore = useCallback(async () => {
    if (!useBackend || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = await apiClient.listFeed({ limit: PAGE_SIZE, before: cursorRef.current });
      setPosts((prev) => [...prev, ...nextPage]);
      setHasMore(nextPage.length === PAGE_SIZE);
      if (nextPage.length > 0) {
        cursorRef.current = nextPage[nextPage.length - 1].created_at;
      }
    } catch (err: any) {
      setBanner(err.message);
    } finally {
      setIsLoadingMore(false);
    }
  }, [useBackend, isLoadingMore, hasMore]);

  const createPost = useCallback(
    async ({ content, audience, files }: { content: string; audience: PostAudience; files: File[] }) => {
      let mediaUrls: string[] = [];
      if (files.length > 0) {
        const uploadResult = await apiClient.uploadPostMedia(files);
        mediaUrls = uploadResult.urls;
      }

      const created = await apiClient.createPost({ content, audience, mediaUrls });
      setPosts((prev) => [created, ...prev]);
    },
    []
  );

  const toggleLike = useCallback(async (post: FeedPost) => {
    const wasLiked = post.liked_by_me;
    // optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, liked_by_me: !wasLiked, likes_count: p.likes_count + (wasLiked ? -1 : 1) } : p
      )
    );

    try {
      const result = wasLiked ? await apiClient.unlikePost(post.id) : await apiClient.likePost(post.id);
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, liked_by_me: result.liked, likes_count: result.likesCount } : p))
      );
    } catch (err: any) {
      // revert on failure
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, liked_by_me: wasLiked, likes_count: post.likes_count } : p))
      );
      setBanner(err.message);
    }
  }, []);

  const bumpCommentCount = useCallback((postId: string, delta: number) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments_count: p.comments_count + delta } : p)));
  }, []);

  return {
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
  };
}