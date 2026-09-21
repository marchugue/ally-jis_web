// src/pages/ProfilePage.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Pencil, Building2, GraduationCap,
  Shield, Users, ImageIcon,
  UserPlus, RefreshCw,
  Sparkles, MessageSquare,
  Newspaper, Layers, Heart, MessageCircle,
} from 'lucide-react';
import { CURRENT_USER } from '@/data/mockData';
import { Student } from '@/types/ally';
import type { FeedPost } from '@/types/feed';
import { cn } from '@/lib/utils';
import { apiClient, isApiConfigured } from '@/api/client';
import type { ProfileRelationshipSummary } from '@/api/client';
import { profileService } from '@/lib/services/profileService';
import { interactionService } from '@/lib/services/interactionService';
import { useAuth } from '@/context/AuthContext';
import { notify } from '@/components/ui/sonner';
import { generateMatches } from '@/data/mockData';
import FeedPostCard from '@/components/feed/FeedPostCard';
import PostComposerModal from '@/components/feed/PostComposerModal';
import CommentsModal from '@/components/feed/CommentsModal';
import type { FeedComment, FeedCommentWithReplies } from '@/types/feed';
import { RelationshipButtons } from '@/components/profile/RelationshipButtons';
import { RelationshipListModal } from '@/components/profile/RelationshipListModal';
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import { AnonymousAvatar } from '@/components/match/AnonymousAvatar';

const PAGE_SIZE = 10;

function ProfileSkeleton({ isOwnProfile = true }: { isOwnProfile?: boolean }) {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar w-full bg-[#F7F4EF] dark:bg-[#121212] transition-colors duration-200">
      <div className="max-w-7xl xl:max-w-[1440px] mx-auto px-0 sm:px-6 lg:px-8 py-0 sm:py-6 w-full">
        {/* Header Card Skeleton */}
        <div className="rounded-none sm:rounded-2xl border-0 border-b sm:border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#181818] overflow-hidden mb-0 sm:mb-6 shadow-none sm:shadow-2xs animate-pulse">
          <div className="h-44 sm:h-56 lg:h-64 bg-gradient-to-r from-[#0A331C]/60 via-[#1A6B3C]/50 to-[#185E35]/60 relative flex-shrink-0">
            <div className="absolute bottom-0 left-6 sm:left-8 translate-y-1/2">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gray-200 dark:bg-white/10 border-4 border-white dark:border-[#181818] ring-1 ring-gray-200/80 dark:ring-white/15" />
            </div>
          </div>
          <div className="pt-16 sm:pt-18 pb-5 px-6 sm:px-8 border-b border-gray-200/80 dark:border-white/10 flex items-center justify-between gap-4 flex-wrap">
            <div className="space-y-2">
              <div className="h-7 w-48 bg-gray-200 dark:bg-white/10 rounded-md" />
              <div className="h-4 w-32 bg-gray-100 dark:bg-white/5 rounded-md" />
            </div>
            <div className="h-10 w-32 bg-gray-100 dark:bg-white/10 rounded-xl" />
          </div>
          <div className="px-6 sm:px-8 py-3.5 flex items-center gap-6">
            <div className="h-4 w-20 bg-gray-100 dark:bg-white/5 rounded-md" />
            <div className="h-4 w-20 bg-gray-100 dark:bg-white/5 rounded-md" />
            <div className="h-4 w-20 bg-gray-100 dark:bg-white/5 rounded-md" />
          </div>
        </div>

        {/* 2-Column Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 sm:gap-6 items-start">
          {/* Left Column Skeleton */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-0 sm:space-y-4 divide-y divide-gray-200/80 dark:divide-white/10 sm:divide-y-0">
            <div className="rounded-none sm:rounded-2xl border-0 border-b sm:border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#181818] p-4 flex items-center gap-8 shadow-none sm:shadow-2xs animate-pulse">
              <div className="h-4 w-16 bg-gray-200 dark:bg-white/10 rounded-md" />
              <div className="h-4 w-16 bg-gray-200 dark:bg-white/10 rounded-md" />
            </div>

            {isOwnProfile && (
              <div className="rounded-none sm:rounded-2xl border-0 border-b sm:border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#181818] p-4 flex items-center gap-3 shadow-none sm:shadow-2xs animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10 flex-shrink-0" />
                <div className="h-10 bg-gray-100 dark:bg-white/5 rounded-full flex-1" />
              </div>
            )}

            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-none sm:rounded-2xl border-0 border-b sm:border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#181818] p-5 sm:p-6 space-y-4 shadow-none sm:shadow-2xs animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-white/10 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-gray-200 dark:bg-white/10 rounded-md w-1/3" />
                    <div className="h-2.5 bg-gray-100 dark:bg-white/5 rounded-md w-1/4" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-md w-full" />
                  <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-md w-4/5" />
                  <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-md w-2/3" />
                </div>
              </div>
            ))}
          </div>

          {/* Right Column Skeleton */}
          <div className="hidden lg:block lg:col-span-5 xl:col-span-4 space-y-4">
            <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#181818] p-5 sm:p-6 space-y-3 shadow-2xs animate-pulse">
              <div className="h-4 w-20 bg-gray-200 dark:bg-white/10 rounded-md" />
              <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-md w-full" />
              <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-md w-3/4" />
            </div>
            <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#181818] p-5 sm:p-6 space-y-3 shadow-2xs animate-pulse">
              <div className="h-4 w-28 bg-gray-200 dark:bg-white/10 rounded-md" />
              <div className="h-4 w-44 bg-gray-100 dark:bg-white/5 rounded-md" />
              <div className="h-4 w-36 bg-gray-100 dark:bg-white/5 rounded-md" />
            </div>
            <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#181818] p-5 sm:p-6 space-y-3 shadow-2xs animate-pulse">
              <div className="h-4 w-24 bg-gray-200 dark:bg-white/10 rounded-md" />
              <div className="flex flex-wrap gap-2">
                <div className="h-7 w-20 bg-gray-100 dark:bg-white/5 rounded-lg" />
                <div className="h-7 w-24 bg-gray-100 dark:bg-white/5 rounded-lg" />
                <div className="h-7 w-16 bg-gray-100 dark:bg-white/5 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userId: routeUserId } = useParams<{ userId?: string }>();

  const viewedUserId = routeUserId || user?.id || null;
  const isOwnProfile = !routeUserId || routeUserId === user?.id;

  // Mobile active tab view: 'posts' or 'about'
  const [mobileTab, setMobileTab] = useState<'posts' | 'about'>('posts');

  // Stream active sub-tab: 'feed' or 'media'
  const [streamTab, setStreamTab] = useState<'feed' | 'media'>('feed');

  // Unified Edit Profile modal
  const [editModalOpen, setEditModalOpen] = useState(false);

  // ── viewing someone else's profile ──────────────────────────────────────
  const [relationship, setRelationship] = useState<ProfileRelationshipSummary | null>(null);
  const [relationshipLoading, setRelationshipLoading] = useState(false);
  const [listModal, setListModal] = useState<'followers' | 'following' | 'allies' | null>(null);

  // ── profile ──────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<Student | null>(null);

  // ── own posts ─────────────────────────────────────────────────────────────
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const mediaPosts = useMemo(() => {
    return posts.filter((p) => p.media && p.media.length > 0);
  }, [posts]);

  const [postsLoading, setPostsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [activePost, setActivePost] = useState<FeedPost | null>(null);
  const cursorRef = useRef<string | undefined>(undefined);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // ── suggested people ──────────────────────────────────────────────────────
  const [suggested, setSuggested] = useState<Student[]>([]);
  const [connections, setConnections] = useState<Record<string, 'none' | 'pending' | 'accepted'>>({});

  const useBackend = Boolean(isApiConfigured && user);

  // ── load profile + suggested ──────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    if (!useBackend || !user) {
      setProfile(CURRENT_USER);
      setSuggested(generateMatches(CURRENT_USER, []).slice(0, 4).map((m) => m.student));
      return () => { isMounted = false; };
    }

    if (!isOwnProfile && viewedUserId) {
      profileService.getProfile(viewedUserId)
        .then((other) => { if (isMounted) setProfile(other); })
        .catch((err: any) => { if (isMounted) notify.error('Failed to load profile', err.message); });
      return () => { isMounted = false; };
    }

    const load = async () => {
      try {
        const [current, others, interactions] = await Promise.all([
          profileService.getMyProfile(),
          profileService.getAllProfiles(user.id),
          interactionService.listMyInteractions(),
        ]);
        if (!isMounted) return;
        setProfile(current);
        const connMap: Record<string, 'none' | 'pending' | 'accepted'> = {};
        (interactions ?? []).forEach((r) => { connMap[r.target_user_id] = r.status as any; });
        setConnections(connMap);
        const notConnected = others.filter((s) => connMap[s.id] !== 'accepted').slice(0, 4);
        setSuggested(notConnected);
      } catch (err: any) {
        if (isMounted) notify.error('Failed to load profile', err.message);
      }
    };

    load();
    return () => { isMounted = false; };
  }, [useBackend, user?.id, isOwnProfile, viewedUserId]);

  // ── load relationship summary (only when viewing someone else) ───────────
  useEffect(() => {
    if (!useBackend || isOwnProfile || !viewedUserId) {
      setRelationship(null);
      return;
    }
    let isMounted = true;
    setRelationshipLoading(true);
    apiClient.getProfileRelationship(viewedUserId)
      .then((summary) => { if (isMounted) setRelationship(summary); })
      .catch((err: any) => { if (isMounted) notify.error('Failed to load relationship', err.message); })
      .finally(() => { if (isMounted) setRelationshipLoading(false); });
    return () => { isMounted = false; };
  }, [useBackend, isOwnProfile, viewedUserId]);

  // ── load posts (own, or the viewed profile's) ─────────────────────────────
  useEffect(() => {
    if (!viewedUserId) return;
    let isMounted = true;

    const loadPosts = async () => {
      setPostsLoading(true);
      try {
        const page = await apiClient.listPostsByAuthor(viewedUserId, { limit: PAGE_SIZE });
        if (!isMounted) return;
        setPosts(page);
        setHasMore(page.length === PAGE_SIZE);
        cursorRef.current = page.length > 0 ? page[page.length - 1].created_at : undefined;
      } catch (err: any) {
        if (isMounted) notify.error('Failed to load posts', err.message);
      } finally {
        if (isMounted) setPostsLoading(false);
      }
    };

    if (useBackend) loadPosts();
    else setPostsLoading(false);

    return () => { isMounted = false; };
  }, [useBackend, viewedUserId]);

  // ── infinite scroll ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);

  const loadMore = useCallback(async () => {
    if (!useBackend || !viewedUserId || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const next = await apiClient.listPostsByAuthor(viewedUserId, { limit: PAGE_SIZE, before: cursorRef.current });
      setPosts((prev) => [...prev, ...next]);
      setHasMore(next.length === PAGE_SIZE);
      if (next.length > 0) cursorRef.current = next[next.length - 1].created_at;
    } catch (err: any) {
      notify.error('Failed to load more posts', err.message);
    } finally {
      setIsLoadingMore(false);
    }
  }, [useBackend, viewedUserId, isLoadingMore, hasMore]);

  // ── post actions ──────────────────────────────────────────────────────────
  const createPost = useCallback(
    async ({ content, audience, files }: { content: string; audience: any; files: File[] }) => {
      let mediaUrls: string[] = [];
      if (files.length > 0) {
        const up = await apiClient.uploadPostMedia(files);
        mediaUrls = up.urls;
      }
      const created = await apiClient.createPost({ content, audience, mediaUrls });
      setPosts((prev) => [created, ...prev]);
    }, []
  );

  const toggleLike = useCallback(async (post: FeedPost) => {
    const wasLiked = post.liked_by_me;
    setPosts((prev) => prev.map((p) =>
      p.id === post.id ? { ...p, liked_by_me: !wasLiked, likes_count: p.likes_count + (wasLiked ? -1 : 1) } : p
    ));
    try {
      const result = wasLiked
        ? await apiClient.unlikePost(post.id)
        : await apiClient.likePost(post.id);
      setPosts((prev) => prev.map((p) =>
        p.id === post.id ? { ...p, liked_by_me: result.liked, likes_count: result.likesCount } : p
      ));
    } catch (err: any) {
      setPosts((prev) => prev.map((p) =>
        p.id === post.id ? { ...p, liked_by_me: wasLiked, likes_count: post.likes_count } : p
      ));
      notify.error('Action failed', err.message);
    }
  }, []);

  const bumpCommentCount = useCallback((postId: string, delta: number) => {
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, comments_count: p.comments_count + delta } : p));
  }, []);

  const handleDelete = useCallback(async (postId: string) => {
    if (!useBackend) return;
    try {
      await apiClient.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err: any) {
      notify.error('Delete failed', err.message);
    }
  }, [useBackend]);

  const loadComments = useCallback(async (postId: string): Promise<FeedCommentWithReplies[]> => {
    if (!useBackend) return [];
    return (await apiClient.listComments(postId)) as FeedCommentWithReplies[];
  }, [useBackend]);

  const submitComment = useCallback(async (postId: string, content: string, parentCommentId?: string | null): Promise<FeedComment> => {
    const row = await apiClient.createComment(postId, { content, parentCommentId });
    bumpCommentCount(postId, 1);
    return row as FeedComment;
  }, [bumpCommentCount]);

  const toggleCommentLike = useCallback(async (comment: FeedComment) => {
    if (!useBackend || !activePost) return;
    comment.liked_by_me
      ? await apiClient.unlikeComment(comment.id)
      : await apiClient.likeComment(comment.id);
  }, [useBackend, activePost]);

  // ── early return for loading ──────────────────────────────────────────────
  if (!profile) return <ProfileSkeleton isOwnProfile={isOwnProfile} />;

  const isConfirmedAlly = isOwnProfile || relationship?.allyStatus === 'allies';
  const currentUser = profile ?? CURRENT_USER;

  // ── Right Side Blended Information Panel Content ─────────────────────────
  const rightSideInfoContent = (
    <div className="space-y-0 sm:space-y-4 divide-y divide-gray-200/80 dark:divide-white/10 sm:divide-y-0">
      {/* Bio / About Card */}
      <div className="rounded-none sm:rounded-2xl border-0 border-b sm:border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#181818] p-5 sm:p-6 shadow-none sm:shadow-2xs">
        <h3 className="font-jakarta font-bold text-xs uppercase tracking-wider text-[#1A6B3C] dark:text-emerald-400 mb-3 flex items-center gap-1.5">
          <MessageSquare size={13} className="text-[#1A6B3C] dark:text-emerald-400" /> About
        </h3>
        {isConfirmedAlly ? (
          profile.bio ? (
            <p className="font-jakarta text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-line">
              {profile.bio}
            </p>
          ) : (
            <p className="font-jakarta text-sm text-gray-400 dark:text-gray-500 italic">
              {isOwnProfile ? 'No bio yet. Click "Edit profile" to introduce yourself.' : 'No bio provided.'}
            </p>
          )
        ) : (
          <p className="font-jakarta text-sm text-gray-500 dark:text-gray-400 italic">
            Identity and bio will be revealed once you complete the matching roadmap and become Campus Allies.
          </p>
        )}
      </div>

      {/* Academic Details Card */}
      <div className="rounded-none sm:rounded-2xl border-0 border-b sm:border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#181818] p-5 sm:p-6 shadow-none sm:shadow-2xs">
        <h3 className="font-jakarta font-bold text-xs uppercase tracking-wider text-[#1A6B3C] dark:text-emerald-400 mb-4 flex items-center gap-1.5">
          <GraduationCap size={14} className="text-[#1A6B3C] dark:text-emerald-400" /> Academic Journey
        </h3>
        <div className="space-y-3 font-jakarta text-sm">
          <div className="flex items-start gap-3 p-2.5 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-[#1A6B3C] dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <GraduationCap size={15} />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{profile.course || 'Not specified'}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{profile.yearLevel || 'Student'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-2.5 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-[#1A6B3C] dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Building2 size={15} />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {(profile.department || 'CHMSU College').replace('College of ', '')}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Campus Department</p>
            </div>
          </div>
        </div>
      </div>

      {/* Interests Card */}
      <div className="rounded-none sm:rounded-2xl border-0 border-b sm:border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#181818] p-5 sm:p-6 shadow-none sm:shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-jakarta font-bold text-xs uppercase tracking-wider text-[#1A6B3C] dark:text-emerald-400 flex items-center gap-1.5">
            <Sparkles size={13} className="text-[#1A6B3C] dark:text-emerald-400" /> Campus Interests
          </h3>
          <span className="text-xs font-jakarta font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/10 border border-gray-200/60 dark:border-white/10 px-2.5 py-0.5 rounded-full">
            {profile.interests?.length || 0}
          </span>
        </div>

        {(profile.interests?.length ?? 0) > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {profile.interests.map((interest) => (
              <span
                key={interest}
                className="px-3 py-1 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 font-jakarta text-xs font-medium border border-gray-200/80 dark:border-white/10"
              >
                {interest}
              </span>
            ))}
          </div>
        ) : (
          <p className="font-jakarta text-xs text-gray-400 dark:text-gray-500 italic">No interests selected yet.</p>
        )}
      </div>

      {/* Organizations Card */}
      <div className="rounded-none sm:rounded-2xl border-0 border-b sm:border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#181818] p-5 sm:p-6 shadow-none sm:shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-jakarta font-bold text-xs uppercase tracking-wider text-[#1A6B3C] dark:text-emerald-400 flex items-center gap-1.5">
            <Users size={13} className="text-[#1A6B3C] dark:text-emerald-400" /> Campus Organizations
          </h3>
          <span className="text-xs font-jakarta font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/10 border border-gray-200/60 dark:border-white/10 px-2.5 py-0.5 rounded-full">
            {profile.organizations?.length || 0}
          </span>
        </div>

        {(profile.organizations?.length ?? 0) > 0 ? (
          <div className="space-y-2">
            {profile.organizations.map((org) => (
              <div key={org} className="flex items-center gap-2.5 p-2 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
                <div className="w-6 h-6 rounded-md bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-[#1A6B3C] dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <Users size={12} />
                </div>
                <span className="font-jakarta text-xs font-medium text-gray-800 dark:text-gray-200">{org}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-jakarta text-xs text-gray-400 dark:text-gray-500 italic">No organizations listed.</p>
        )}
      </div>

      {/* People you may know (own profile only) */}
      {isOwnProfile && suggested.length > 0 && (
        <div className="rounded-none sm:rounded-2xl border-0 border-b sm:border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#181818] p-5 sm:p-6 shadow-none sm:shadow-2xs">
          <h3 className="font-fraunces text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <UserPlus size={16} className="text-[#1A6B3C] dark:text-emerald-400" /> People You May Know
          </h3>
          <div className="space-y-3.5">
            {suggested.map((person) => {
              const status = connections[person.id] || 'none';
              return (
                <div key={person.id} className="flex items-start gap-3 p-2.5 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/40 dark:bg-white/5">
                  <button
                    type="button"
                    onClick={() => navigate(`/profile/${person.id}`)}
                    className="hover:opacity-80 transition-opacity flex-shrink-0"
                    aria-label={`View ${person.name || person.username}'s profile`}
                  >
                    <AvatarDisplay
                      src={person.avatar}
                      name={person.name || person.username}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200/60 dark:border-white/10"
                      textClassName="text-lg"
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => navigate(`/profile/${person.id}`)}
                        className="font-jakarta text-sm font-semibold text-gray-900 dark:text-white truncate hover:underline hover:text-[#1A6B3C] dark:hover:text-emerald-400 text-left"
                      >
                        {person.username ? `@${person.username}` : person.name}
                      </button>
                      {person.isVerified && <Shield size={10} className="text-[#1A6B3C] dark:text-emerald-400 flex-shrink-0" />}
                    </div>
                    <p className="font-jakarta text-xs text-gray-400 dark:text-gray-500 truncate">{person.course}</p>
                    <p className="font-jakarta text-xs text-gray-400 dark:text-gray-500">{person.yearLevel}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar w-full bg-[#F7F4EF] dark:bg-[#121212] transition-colors duration-200 pb-24 md:pb-12">
      <div className="max-w-7xl xl:max-w-[1440px] mx-auto px-0 sm:px-6 lg:px-8 py-0 sm:py-6 w-full">

        {/* ══════════════════════════════════════════════════════════
            ROCK-STILL PROFILE HEADER CARD (Cover, Avatar, Identity, Stats)
        ══════════════════════════════════════════════════════════ */}
        <div className="rounded-none sm:rounded-2xl border-0 border-b sm:border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#181818] overflow-hidden mb-0 sm:mb-6 shadow-none sm:shadow-2xs">
          {/* Cover Banner */}
          <div className="relative flex-shrink-0">
            <div className="h-44 sm:h-56 lg:h-64 bg-gradient-to-r from-[#1A6B3C] via-[#247946] to-[#3B8C7E] overflow-hidden relative">
              <div
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}
              />
            </div>

            {/* Avatar overhanging cover */}
            <div className="absolute bottom-0 left-6 sm:left-8 translate-y-1/2 z-10">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white dark:bg-[#181818] border-4 border-white dark:border-[#181818] ring-1 ring-gray-200/80 dark:ring-white/15 overflow-hidden flex items-center justify-center">
                {isConfirmedAlly ? (
                  <AvatarDisplay
                    src={profile.avatar}
                    name={profile.username || profile.name}
                    className="w-full h-full object-cover rounded-full"
                    textClassName="text-4xl sm:text-5xl"
                  />
                ) : (
                  <AnonymousAvatar
                    avatarKey={(profile as any).avatarKey || 'fox'}
                    size={96}
                    className="w-full h-full rounded-full"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Identity Bar */}
          <div className="pt-16 sm:pt-18 pb-5 px-6 sm:px-8 border-b border-gray-200/80 dark:border-white/10 flex items-start justify-between gap-4 flex-wrap bg-white dark:bg-[#181818] flex-shrink-0">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-fraunces text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {isConfirmedAlly ? (profile.name || (profile.username ? `@${profile.username}` : 'Student')) : 'Anonymous Peer'}
                </h1>
                {isConfirmedAlly && profile.isVerified && (
                  <span className="inline-flex items-center gap-1 bg-[#1A6B3C]/10 dark:bg-emerald-500/15 text-[#1A6B3C] dark:text-emerald-400 border border-[#1A6B3C]/20 dark:border-emerald-500/30 px-2.5 py-0.5 rounded-md">
                    <Shield size={11} />
                    <span className="font-jakarta text-xs font-semibold">CHMSU VERIFIED</span>
                  </span>
                )}
              </div>
              <p className="font-jakarta text-sm text-gray-400 dark:text-gray-500 font-medium mt-0.5">
                {isConfirmedAlly ? (profile.username ? `@${profile.username}` : '') : '@anonymous'}
              </p>
            </div>

            {/* Profile Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0 mt-1">
              {!isOwnProfile ? (
                relationshipLoading ? (
                  <div className="h-9 w-40 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
                ) : relationship && viewedUserId ? (
                  <RelationshipButtons
                    targetUserId={viewedUserId}
                    targetName={isConfirmedAlly ? (profile.username ? `@${profile.username}` : profile.name ?? 'this student') : 'Anonymous Peer'}
                    allyStatus={relationship.allyStatus}
                    isFollowing={relationship.isFollowing}
                    isFollowedBy={relationship.isFollowedBy}
                    onAllyStatusChange={(status) => setRelationship((r) => r ? { ...r, allyStatus: status } : r)}
                    onFollowChange={(following) => setRelationship((r) => r ? {
                      ...r,
                      isFollowing: following,
                      followersCount: r.followersCount + (following ? 1 : -1),
                    } : r)}
                    onConversationReady={(conversationId) => navigate('/messages', { state: { conversationId } })}
                  />
                ) : null
              ) : (
                <button
                  type="button"
                  onClick={() => setEditModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:border-[#1A6B3C]/40 hover:text-[#1A6B3C] dark:hover:text-emerald-400 hover:bg-[#1A6B3C]/5 font-jakarta text-sm font-semibold transition-colors cursor-pointer"
                >
                  <Pencil size={13} /> Edit profile
                </button>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          {(isOwnProfile ? true : isConfirmedAlly) && (
            <div className="px-6 sm:px-8 py-3.5 flex items-center gap-6 flex-wrap bg-white dark:bg-[#181818] flex-shrink-0">
              <button
                type="button"
                onClick={() => viewedUserId && setListModal('followers')}
                className="font-jakarta text-sm hover:text-[#1A6B3C] dark:hover:text-emerald-400 transition-colors cursor-pointer"
              >
                <span className="font-bold text-gray-900 dark:text-white">{relationship?.followersCount ?? 0}</span>{' '}
                <span className="text-gray-500 dark:text-gray-400 font-medium">Followers</span>
              </button>
              <button
                type="button"
                onClick={() => viewedUserId && setListModal('following')}
                className="font-jakarta text-sm hover:text-[#1A6B3C] dark:hover:text-emerald-400 transition-colors cursor-pointer"
              >
                <span className="font-bold text-gray-900 dark:text-white">{relationship?.followingCount ?? 0}</span>{' '}
                <span className="text-gray-500 dark:text-gray-400 font-medium">Following</span>
              </button>
              <button
                type="button"
                onClick={() => viewedUserId && setListModal('allies')}
                className="font-jakarta text-sm hover:text-[#1A6B3C] dark:hover:text-emerald-400 transition-colors cursor-pointer"
              >
                <span className="font-bold text-gray-900 dark:text-white">{relationship?.alliesCount ?? 0}</span>{' '}
                <span className="text-gray-500 dark:text-gray-400 font-medium">Allies</span>
              </button>

              {!isOwnProfile && relationship && (relationship.mutualAlliesCount > 0 || relationship.mutualFollowersCount > 0) && (
                <span className="font-jakarta text-xs text-gray-400 dark:text-gray-500 ml-auto">
                  {relationship.mutualAlliesCount > 0 && `${relationship.mutualAlliesCount} Mutual Allies`}
                  {relationship.mutualAlliesCount > 0 && relationship.mutualFollowersCount > 0 && ' · '}
                  {relationship.mutualFollowersCount > 0 && `${relationship.mutualFollowersCount} Mutual Followers`}
                </span>
              )}
            </div>
          )}

          {/* ── Mobile Tab Segment Switcher (visible only < lg, anchored right here inside header) ── */}
          <div className="lg:hidden flex border-t border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#181818]">
            <button
              type="button"
              onClick={() => setMobileTab('posts')}
              className={cn(
                'flex-1 py-3 font-jakarta text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-colors cursor-pointer',
                mobileTab === 'posts'
                  ? 'text-[#1A6B3C] dark:text-emerald-400 border-[#1A6B3C] dark:border-emerald-400 bg-[#1A6B3C]/5 dark:bg-emerald-500/5'
                  : 'text-gray-400 dark:text-gray-500 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              Timeline & Posts
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('about')}
              className={cn(
                'flex-1 py-3 font-jakarta text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-colors cursor-pointer',
                mobileTab === 'about'
                  ? 'text-[#1A6B3C] dark:text-emerald-400 border-[#1A6B3C] dark:border-emerald-400 bg-[#1A6B3C]/5 dark:bg-emerald-500/5'
                  : 'text-gray-400 dark:text-gray-500 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              About & Info
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            BALANCED 2-COLUMN GRID (STABLE ALIGNMENT ON DESKTOP & MOBILE)
        ══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 sm:gap-6 items-start">

          {/* ── LEFT / MAIN STREAM COLUMN: Posts & Media ── */}
          <div className={cn(
            'lg:col-span-7 xl:col-span-8 space-y-0 sm:space-y-4 min-w-0',
            mobileTab !== 'posts' && 'hidden lg:block'
          )}>
            {!isConfirmedAlly ? (
              <div className="rounded-none sm:rounded-2xl border-0 border-b sm:border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#181818] p-12 text-center shadow-none sm:shadow-2xs">
                <Shield size={36} className="mx-auto text-[#1A6B3C] dark:text-emerald-400 mb-3 opacity-60" />
                <h4 className="font-fraunces text-lg font-bold text-gray-900 dark:text-white">Profile is Protected</h4>
                <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  Posts and media are only visible to confirmed Campus Allies. Complete the matching roadmap to reveal profiles and posts.
                </p>
              </div>
            ) : (
              <>
                {/* Feed & Media Sub-Tabs */}
                <div className="rounded-none sm:rounded-2xl border-0 border-b sm:border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#181818] px-4 sm:px-6 flex items-center gap-8 shadow-none sm:shadow-2xs">
              <button
                type="button"
                onClick={() => setStreamTab('feed')}
                className={cn(
                  'py-3.5 font-jakarta text-sm font-semibold flex items-center gap-2 border-b-2 transition-all -mb-px cursor-pointer',
                  streamTab === 'feed'
                    ? 'border-[#1A6B3C] dark:border-emerald-500 text-[#1A6B3C] dark:text-emerald-400'
                    : 'border-transparent text-gray-400 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                )}
              >
                <Newspaper size={16} />
                <span>Feed</span>
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-semibold transition-colors',
                  streamTab === 'feed' ? 'bg-[#1A6B3C]/10 dark:bg-emerald-500/15 text-[#1A6B3C] dark:text-emerald-400' : 'bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-400'
                )}>
                  {posts.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStreamTab('media')}
                className={cn(
                  'py-3.5 font-jakarta text-sm font-semibold flex items-center gap-2 border-b-2 transition-all -mb-px cursor-pointer',
                  streamTab === 'media'
                    ? 'border-[#1A6B3C] dark:border-emerald-500 text-[#1A6B3C] dark:text-emerald-400'
                    : 'border-transparent text-gray-400 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                )}
              >
                <ImageIcon size={16} />
                <span>Media</span>
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-semibold transition-colors',
                  streamTab === 'media' ? 'bg-[#1A6B3C]/10 dark:bg-emerald-500/15 text-[#1A6B3C] dark:text-emerald-400' : 'bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-400'
                )}>
                  {mediaPosts.length}
                </span>
              </button>
            </div>

            {/* ── Feed Stream View ── */}
            {streamTab === 'feed' && (
              <div className="divide-y divide-gray-200/80 dark:divide-white/10 sm:divide-y-0 sm:space-y-3">
                {/* Post Composer Trigger (own profile only) */}
                {isOwnProfile && (
                  <div
                    onClick={() => setComposerOpen(true)}
                    className="rounded-none sm:rounded-2xl border-0 border-b sm:border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#181818] p-4 flex items-center gap-3 cursor-pointer hover:border-[#1A6B3C]/40 transition-colors shadow-none sm:shadow-2xs"
                  >
                    <AvatarDisplay
                      src={profile.avatar}
                      name={profile.name || profile.username}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      textClassName="text-lg"
                    />
                    <div className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 font-jakarta text-sm text-gray-400 dark:text-gray-400">
                      What's on your mind?
                    </div>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-[#1A6B3C] dark:text-emerald-400 font-jakarta text-xs font-semibold hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <ImageIcon size={14} className="text-[#1A6B3C] dark:text-emerald-400" /> <span className="hidden sm:inline">Photo</span>
                    </button>
                  </div>
                )}

                {/* Feed Posts */}
                {postsLoading ? (
                  <div className="divide-y divide-gray-200/80 dark:divide-white/10 sm:divide-y-0 sm:space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="rounded-none sm:rounded-2xl border-0 border-b sm:border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#181818] p-5 sm:p-6 space-y-3 shadow-none sm:shadow-2xs animate-pulse">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 dark:bg-white/10 rounded-xl" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3.5 bg-gray-200 dark:bg-white/10 rounded-md w-1/3" />
                            <div className="h-2.5 bg-gray-100 dark:bg-white/5 rounded-md w-1/4" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-md w-full" />
                          <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-md w-3/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : posts.length === 0 ? (
                  <div className="rounded-none sm:rounded-2xl border-0 border-b sm:border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#181818] px-6 py-16 text-center shadow-none sm:shadow-2xs">
                    <div className="w-12 h-12 bg-[#1A6B3C]/10 dark:bg-emerald-500/15 border border-[#1A6B3C]/20 dark:border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <RefreshCw size={22} className="text-[#1A6B3C] dark:text-emerald-400" />
                    </div>
                    <p className="font-fraunces text-base font-semibold text-gray-800 dark:text-white mb-1">No posts yet</p>
                    <p className="font-jakarta text-sm text-gray-400 dark:text-gray-500 max-w-sm mx-auto">
                      {isOwnProfile ? 'Share your thoughts, questions, or updates with classmates.' : 'This student has not shared any posts yet.'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200/80 dark:divide-white/10 sm:divide-y-0 sm:space-y-3">
                    {posts.map((post) => (
                      <FeedPostCard
                        key={post.id}
                        post={post}
                        currentUser={currentUser}
                        onToggleLike={toggleLike}
                        onCommentClick={setActivePost}
                        onDelete={handleDelete}
                        showBorder={false}
                        className="rounded-none sm:rounded-2xl border-0 border-b sm:border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#181818] p-4 sm:p-6 transition-colors shadow-none sm:shadow-2xs"
                      />
                    ))}

                    <div ref={sentinelRef} className="h-6" />

                    {isLoadingMore && (
                      <div className="flex justify-center py-5">
                        <div className="w-6 h-6 border-2 border-[#1A6B3C]/20 border-t-[#1A6B3C] dark:border-emerald-500/20 dark:border-t-emerald-400 rounded-full animate-spin" />
                      </div>
                    )}

                    {!hasMore && posts.length > 0 && (
                      <p className="font-jakarta text-xs text-gray-400 dark:text-gray-500 text-center py-6">
                        You've reached the end of this stream
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Media Grid View ── */}
            {streamTab === 'media' && (
              <div className="rounded-none sm:rounded-2xl border-0 border-b sm:border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#181818] p-4 sm:p-5 shadow-none sm:shadow-2xs">
                {postsLoading ? (
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="aspect-square rounded-xl bg-gray-100 dark:bg-white/10 border border-gray-200/60 dark:border-white/5" />
                    ))}
                  </div>
                ) : mediaPosts.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <div className="w-12 h-12 bg-[#1A6B3C]/10 dark:bg-emerald-500/15 border border-[#1A6B3C]/20 dark:border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <ImageIcon size={22} className="text-[#1A6B3C] dark:text-emerald-400" />
                    </div>
                    <p className="font-fraunces text-base font-semibold text-gray-800 dark:text-white mb-1">No media yet</p>
                    <p className="font-jakarta text-sm text-gray-400 dark:text-gray-500 max-w-sm mx-auto">
                      {isOwnProfile
                        ? 'Photos and images attached to your posts will be collected here.'
                        : 'This student has not shared any media photos yet.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {mediaPosts.map((post) => {
                      const cover = post.media[0];
                      const hasMultiple = post.media.length > 1;
                      return (
                        <div
                          key={post.id}
                          onClick={() => setActivePost(post)}
                          className="aspect-square relative bg-gray-100 dark:bg-white/5 rounded-xl overflow-hidden cursor-pointer group border border-gray-200/60 dark:border-white/10"
                        >
                          <img
                            src={cover.url}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            loading="lazy"
                          />
                          {hasMultiple && (
                            <div className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-md backdrop-blur-xs">
                              <Layers size={12} />
                            </div>
                          )}
                          {/* Hover overlay with likes and comment counts */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-jakarta text-xs font-semibold">
                            <span className="flex items-center gap-1">
                              <Heart size={14} className="fill-white" /> {post.likes_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle size={14} className="fill-white" /> {post.comments_count}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            </>
            )}
          </div>

          {/* ── RIGHT COLUMN: Information Sidebar ── */}
          <div className={cn(
            'lg:col-span-5 xl:col-span-4 min-w-0',
            mobileTab !== 'about' && 'hidden lg:block'
          )}>
            {rightSideInfoContent}
          </div>

        </div>

      </div>

      {/* ── Unified Edit Profile Modal ── */}
      {profile && (
        <EditProfileModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          profile={profile}
          onProfileUpdated={(updated) => setProfile(updated)}
          useBackend={useBackend}
          userId={user?.id}
        />
      )}

      {/* ── Feed Modals ── */}
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
        onTogglePostLike={toggleLike}
        onDeletePost={handleDelete}
      />

      {viewedUserId && listModal && (
        <RelationshipListModal
          open={!!listModal}
          onOpenChange={(open) => setListModal(open ? listModal : null)}
          userId={viewedUserId}
          kind={listModal}
          title={listModal}
        />
      )}
    </div>
  );
}