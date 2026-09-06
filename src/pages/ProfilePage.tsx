// src/pages/ProfilePage.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Pencil, Check, X, Plus, Building2, GraduationCap,
  Shield, Users, ImageIcon,
  UserPlus, RefreshCw, Camera, Loader2,
  Sparkles, MessageSquare, Music, Film, Compass,
  Newspaper, Layers, Heart, MessageCircle,
} from 'lucide-react';
import { CURRENT_USER } from '@/data/mockData';
import { Student } from '@/types/ally';
import type { FeedPost } from '@/types/feed';
import { cn } from '@/lib/utils';
import { apiClient, isApiConfigured } from '@/api/client';
import type { ProfileRelationshipSummary, PresetAvatarRow } from '@/api/client';
import { profileService } from '@/lib/services/profileService';
import { interactionService } from '@/lib/services/interactionService';
import { useAuth } from '@/context/AuthContext';
import { profileSchema, ProfileFormValues } from '@/lib/validations/profile';
import { useLookupOptions } from '@/hooks/useLookupOptions';
import {
  ZODIAC_OPTIONS, PERSONALITY_TYPE_OPTIONS, AGE_RANGE_OPTIONS,
  MATCH_GENDER_PREFERENCE_OPTIONS, MUSIC_TASTE_OPTIONS, MOVIE_INTEREST_OPTIONS,
} from '@/lib/matchOptions';
import { Checkbox } from '@/components/ui/checkbox';
import { notify } from '@/components/ui/sonner';
import { generateMatches } from '@/data/mockData';
import FeedPostCard from '@/components/feed/FeedPostCard';
import PostComposerModal from '@/components/feed/PostComposerModal';
import CommentsModal from '@/components/feed/CommentsModal';
import type { FeedComment, FeedCommentWithReplies } from '@/types/feed';
import { RelationshipButtons } from '@/components/profile/RelationshipButtons';
import { RelationshipListModal } from '@/components/profile/RelationshipListModal';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';

const PAGE_SIZE = 10;

function ProfileSkeleton({ isOwnProfile = true }: { isOwnProfile?: boolean }) {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden h-full w-full bg-white">
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 h-full w-full overflow-hidden">
        {/* Left column stream skeleton */}
        <div className="flex-1 min-w-0 h-full flex flex-col overflow-y-auto custom-scrollbar bg-white">
          {/* Cover gradient */}
          <div className="h-44 sm:h-56 bg-gradient-to-r from-[#0A331C]/60 via-[#1A6B3C]/50 to-[#185E35]/60 relative flex-shrink-0 animate-pulse">
            <div className="absolute bottom-0 left-6 sm:left-8 translate-y-1/2">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gray-200 border-4 border-white shadow-md" />
            </div>
          </div>

          {/* Profile Identity Row */}
          <div className="pt-16 sm:pt-18 pb-5 px-6 sm:px-8 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap animate-pulse">
            <div className="space-y-2">
              <div className="h-7 w-48 bg-gray-200 rounded-md" />
              <div className="h-4 w-32 bg-gray-100 rounded-md" />
            </div>
            <div className="h-10 w-32 bg-gray-100 rounded-xl" />
          </div>

          {/* Stats Bar */}
          <div className="px-6 sm:px-8 py-3.5 border-b border-gray-100 flex items-center gap-6 animate-pulse">
            <div className="h-4 w-20 bg-gray-100 rounded-md" />
            <div className="h-4 w-20 bg-gray-100 rounded-md" />
            <div className="h-4 w-20 bg-gray-100 rounded-md" />
          </div>

          {/* Feed & Media Sub-Tabs Skeleton */}
          <div className="px-6 sm:px-8 py-3.5 border-b border-gray-100 flex items-center gap-8 animate-pulse">
            <div className="h-4 w-16 bg-gray-200 rounded-md" />
            <div className="h-4 w-16 bg-gray-200 rounded-md" />
          </div>

          {/* Post composer skeleton (if own profile) */}
          {isOwnProfile && (
            <div className="px-6 sm:px-8 py-4 border-b border-gray-100 flex items-center gap-3 animate-pulse">
              <div className="w-9 h-9 rounded-xl bg-gray-200 flex-shrink-0" />
              <div className="h-10 bg-gray-100 rounded-xl flex-1" />
            </div>
          )}

          {/* Post Skeletons */}
          <div className="divide-y divide-gray-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 space-y-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-gray-200 rounded-md w-1/3" />
                    <div className="h-2.5 bg-gray-100 rounded-md w-1/4" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-100 rounded-md w-full" />
                  <div className="h-3 bg-gray-100 rounded-md w-4/5" />
                  <div className="h-3 bg-gray-100 rounded-md w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column skeleton */}
        <div className="hidden lg:flex w-[480px] xl:w-[540px] 2xl:w-[600px] bg-white border-l border-gray-100 flex-col p-6 space-y-6 overflow-y-auto flex-shrink-0 animate-pulse">
          <div className="h-5 w-24 bg-gray-200 rounded-md" />
          <div className="space-y-2">
            <div className="h-3 bg-gray-100 rounded-md w-full" />
            <div className="h-3 bg-gray-100 rounded-md w-3/4" />
          </div>
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <div className="h-4 w-32 bg-gray-200 rounded-md" />
            <div className="h-4 w-48 bg-gray-100 rounded-md" />
            <div className="h-4 w-40 bg-gray-100 rounded-md" />
          </div>
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <div className="h-4 w-28 bg-gray-200 rounded-md" />
            <div className="flex flex-wrap gap-2">
              <div className="h-7 w-20 bg-gray-100 rounded-lg" />
              <div className="h-7 w-24 bg-gray-100 rounded-lg" />
              <div className="h-7 w-16 bg-gray-100 rounded-lg" />
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

  // ── viewing someone else's profile ──────────────────────────────────────
  const [relationship, setRelationship] = useState<ProfileRelationshipSummary | null>(null);
  const [relationshipLoading, setRelationshipLoading] = useState(false);
  const [listModal, setListModal] = useState<'followers' | 'following' | 'allies' | null>(null);

  // ── profile ──────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<Student | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'interests' | 'orgs'>('interests');
  const [showInterestPicker, setShowInterestPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const { organizations, departments, coursesByDept, interestsByCategory, yearLevels } = useLookupOptions();

  // ── own posts ─────────────────────────────────────────────────────────────
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const mediaPosts = useMemo(() => {
    return posts.filter(p => p.media && p.media.length > 0);
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

  // Avatar management (preset images + custom photo upload)
  const [presetAvatars, setPresetAvatars] = useState<PresetAvatarRow[]>([]);
  const [avatarTab, setAvatarTab] = useState<'presets' | 'upload'>('presets');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string | null>(null);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  const useBackend = Boolean(isApiConfigured && user);

  // Load preset avatars from backend
  useEffect(() => {
    if (!isApiConfigured) return;
    apiClient.getPresetAvatars()
      .then((res) => setPresetAvatars(res.avatars))
      .catch(() => {});
  }, []);

  const {
    register, handleSubmit, watch, setValue, reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
  });
  const formData = watch();

  // ── load profile + suggested ──────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    if (!useBackend || !user) {
      setProfile(CURRENT_USER);
      reset({
        username: CURRENT_USER.username || '',
        bio: CURRENT_USER.bio,
        department: CURRENT_USER.department,
        course: CURRENT_USER.course,
        yearLevel: CURRENT_USER.yearLevel,
        interests: CURRENT_USER.interests,
        organizations: CURRENT_USER.organizations,
        avatar: CURRENT_USER.avatar,
        zodiacSign: CURRENT_USER.zodiacSign ?? '',
        personalityType: CURRENT_USER.personalityType ?? '',
        musicTaste: CURRENT_USER.musicTaste ?? [],
        movieInterests: CURRENT_USER.movieInterests ?? [],
        ageRange: CURRENT_USER.ageRange ?? '',
        matchGenderPreference: CURRENT_USER.matchGenderPreference ?? '',
      });
      setSuggested(generateMatches(CURRENT_USER, []).slice(0, 4).map(m => m.student));
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
        reset({
          username: current.username || '',
          bio: current.bio,
          department: current.department,
          course: current.course,
          yearLevel: current.yearLevel,
          interests: current.interests,
          organizations: current.organizations,
          avatar: current.avatar,
          zodiacSign: current.zodiacSign ?? '',
          personalityType: current.personalityType ?? '',
          musicTaste: current.musicTaste ?? [],
          movieInterests: current.movieInterests ?? [],
          ageRange: current.ageRange ?? '',
          matchGenderPreference: current.matchGenderPreference ?? '',
        });
        const connMap: Record<string, 'none' | 'pending' | 'accepted'> = {};
        (interactions ?? []).forEach(r => { connMap[r.target_user_id] = r.status as any; });
        setConnections(connMap);
        const notConnected = others.filter(s => connMap[s.id] !== 'accepted').slice(0, 4);
        setSuggested(notConnected);
      } catch (err: any) {
        if (isMounted) notify.error('Failed to load profile', err.message);
      }
    };

    load();
    return () => { isMounted = false; };
  }, [useBackend, user?.id, isOwnProfile, viewedUserId, reset]);

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
      setPosts(prev => [...prev, ...next]);
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
      setPosts(prev => [created, ...prev]);
    }, []
  );

  const toggleLike = useCallback(async (post: FeedPost) => {
    const wasLiked = post.liked_by_me;
    setPosts(prev => prev.map(p =>
      p.id === post.id ? { ...p, liked_by_me: !wasLiked, likes_count: p.likes_count + (wasLiked ? -1 : 1) } : p
    ));
    try {
      const result = wasLiked
        ? await apiClient.unlikePost(post.id)
        : await apiClient.likePost(post.id);
      setPosts(prev => prev.map(p =>
        p.id === post.id ? { ...p, liked_by_me: result.liked, likes_count: result.likesCount } : p
      ));
    } catch (err: any) {
      setPosts(prev => prev.map(p =>
        p.id === post.id ? { ...p, liked_by_me: wasLiked, likes_count: post.likes_count } : p
      ));
      notify.error('Action failed', err.message);
    }
  }, []);

  const bumpCommentCount = useCallback((postId: string, delta: number) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: p.comments_count + delta } : p));
  }, []);

  const handleDelete = useCallback(async (postId: string) => {
    if (!useBackend) return;
    try {
      await apiClient.deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
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

  // ── profile edit actions ──────────────────────────────────────────────────

  const onSave = async (data: ProfileFormValues) => {
    if (!useBackend || !user) {
      setProfile({
        ...CURRENT_USER,
        ...data,
        username: data.username || null,
        joinedAt: profile?.joinedAt || CURRENT_USER.joinedAt,
        id: profile?.id || CURRENT_USER.id,
        email: profile?.email || CURRENT_USER.email,
        isVerified: profile?.isVerified || CURRENT_USER.isVerified,
      });
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    const norm = data.username.toLowerCase();
    if (norm !== profile?.username?.toLowerCase()) {
      setUsernameStatus('checking');
      try {
        const ok = await profileService.checkUsername(norm, user.id);
        if (!ok) {
          notify.error('Username taken', 'That username is already taken.');
          setUsernameStatus('taken');
          setIsSaving(false);
          return;
        }
        setUsernameStatus('available');
      } catch (e: any) {
        notify.error('Username check failed', e.message);
        setUsernameStatus('idle');
        setIsSaving(false);
        return;
      }
    }
    try {
      await profileService.updateProfile(user.id, { ...data, username: norm });
    } catch (e: any) {
      notify.error('Save failed', e.message);
      setIsSaving(false);
      return;
    }
    setProfile({ ...profile!, ...data, name: norm, username: norm });
    notify.success('Profile saved', 'Your changes have been applied.');
    setIsEditing(false);
    setIsSaving(false);
  };

  const handleCancel = () => {
    if (profile) reset({
      username: profile.username || '', bio: profile.bio, department: profile.department, course: profile.course,
      yearLevel: profile.yearLevel, interests: profile.interests, organizations: profile.organizations, avatar: profile.avatar,
      zodiacSign: profile.zodiacSign ?? '', personalityType: profile.personalityType ?? '',
      musicTaste: profile.musicTaste ?? [], movieInterests: profile.movieInterests ?? [],
      ageRange: profile.ageRange ?? '', matchGenderPreference: profile.matchGenderPreference ?? '',
    });
    setIsEditing(false);
    setShowInterestPicker(false);
  };

  const toggleInterest = (interest: string) => {
    const cur = formData.interests || [];
    setValue('interests', cur.includes(interest) ? cur.filter(i => i !== interest) : [...cur, interest], { shouldValidate: true });
  };

  const toggleOrg = (org: string) => {
    const cur = formData.organizations || [];
    setValue('organizations', cur.includes(org) ? cur.filter(o => o !== org) : [...cur, org], { shouldValidate: true });
  };

  const toggleMusicTaste = (genre: string) => {
    const cur = formData.musicTaste || [];
    setValue('musicTaste', cur.includes(genre) ? cur.filter(g => g !== genre) : [...cur, genre], { shouldValidate: true });
  };

  const toggleMovieInterest = (genre: string) => {
    const cur = formData.movieInterests || [];
    setValue('movieInterests', cur.includes(genre) ? cur.filter(g => g !== genre) : [...cur, genre], { shouldValidate: true });
  };

  const toggleConnect = async (targetId: string) => {
    if (!useBackend || !user) {
      setConnections(prev => ({ ...prev, [targetId]: prev[targetId] === 'pending' ? 'none' : 'pending' }));
      return;
    }
    if (connections[targetId] === 'pending' || connections[targetId] === 'accepted') return;
    try {
      setConnections(prev => ({ ...prev, [targetId]: 'pending' }));
      await interactionService.sendRequest(user.id, targetId);
    } catch (err: any) {
      setConnections(prev => ({ ...prev, [targetId]: 'none' }));
      notify.error('Connection failed', err.message);
    }
  };

  // ── derived ───────────────────────────────────────────────────────────────
  const displayProfile = isEditing ? formData : profile;

  if (!displayProfile) return <ProfileSkeleton isOwnProfile={isOwnProfile} />;

  const currentUser = profile ?? CURRENT_USER;

  // ── Right Side Blended Information Panel Content ─────────────────────────
  const rightSideInfoContent = (
    <div className="flex flex-col divide-y divide-gray-100">
      {/* Bio / About */}
      <div className="p-6">
        <h3 className="font-jakarta font-bold text-xs uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
          <MessageSquare size={13} className="text-[#1A6B3C]" /> About
        </h3>
        {profile?.bio ? (
          <p className="font-jakarta text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {profile.bio}
          </p>
        ) : (
          <p className="font-jakarta text-sm text-gray-400 italic">
            {isOwnProfile ? 'No bio yet. Click "Edit profile" to introduce yourself.' : 'No bio provided.'}
          </p>
        )}
      </div>

      {/* Academic Details */}
      <div className="p-6 space-y-4">
        <h3 className="font-jakarta font-bold text-xs uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
          <GraduationCap size={14} className="text-[#1A6B3C]" /> Academic Journey
        </h3>
        <div className="space-y-3 font-jakarta text-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1A6B3C]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <GraduationCap size={15} className="text-[#1A6B3C]" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{profile?.course || 'Not specified'}</p>
              <p className="text-xs text-gray-400">{profile?.yearLevel || 'Student'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1A6B3C]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Building2 size={15} className="text-[#1A6B3C]" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {(profile?.department || 'CHMSU College').replace('College of ', '')}
              </p>
              <p className="text-xs text-gray-400">Campus Department</p>
            </div>
          </div>
        </div>
      </div>

      {/* Interests */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-jakarta font-bold text-xs uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Sparkles size={13} className="text-[#1A6B3C]" /> Campus Interests
          </h3>
          <span className="text-xs font-jakarta font-semibold text-[#1A6B3C] bg-[#1A6B3C]/10 px-2 py-0.5 rounded-full">
            {profile?.interests?.length || 0}
          </span>
        </div>

        {(profile?.interests?.length ?? 0) > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {(profile?.interests || []).map(interest => (
              <span
                key={interest}
                className="px-3 py-1 rounded-lg bg-gray-50 text-gray-700 font-jakarta text-xs font-medium border border-gray-200/80"
              >
                {interest}
              </span>
            ))}
          </div>
        ) : (
          <p className="font-jakarta text-xs text-gray-400 italic">No interests selected yet.</p>
        )}

        {/* Interests picker if editing */}
        {isEditing && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex border-b border-gray-100 mb-3">
              {(['interests', 'orgs'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'flex-1 py-2 font-jakarta font-semibold text-xs uppercase tracking-wider transition-colors',
                    activeTab === tab ? 'text-[#1A6B3C] border-b-2 border-[#1A6B3C]' : 'text-gray-400 hover:text-gray-600'
                  )}
                >
                  {tab === 'interests' ? `Interests (${formData.interests?.length ?? 0})` : `Orgs (${formData.organizations?.length ?? 0})`}
                </button>
              ))}
            </div>

            {activeTab === 'interests' && (
              <div>
                {(formData.interests?.length ?? 0) < 3 && (
                  <div className="mb-3 bg-[#E8A838]/10 border border-[#E8A838]/25 rounded-xl px-3 py-2">
                    <p className="font-jakarta text-xs text-[#1A6B3C]">Add at least <strong>3 interests</strong> for matching.</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(formData.interests || []).map(interest => (
                    <div key={interest} className="relative group">
                      <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 font-jakarta text-xs font-medium border border-gray-200">
                        {interest}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs leading-none shadow-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {!showInterestPicker && (
                    <button
                      type="button"
                      onClick={() => setShowInterestPicker(true)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-[#1A6B3C]/30 text-[#1A6B3C] font-jakarta text-xs hover:border-[#1A6B3C]"
                    >
                      <Plus size={12} /> Add more
                    </button>
                  )}
                </div>

                {showInterestPicker && (
                  <div className="border border-gray-200 rounded-xl p-3 bg-gray-50/70">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-jakarta font-semibold text-xs text-[#1A6B3C]">Select from campus topics</p>
                      <button
                        type="button"
                        onClick={() => setShowInterestPicker(false)}
                        className="text-gray-400 hover:text-gray-600 text-sm font-bold"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {Object.entries(interestsByCategory).map(([category, items]) => (
                        <div key={category}>
                          <p className="font-jakarta font-semibold text-[11px] text-gray-400 uppercase tracking-wide mb-1">
                            {category}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {items.map(({ label }) => (
                              <button
                                key={label}
                                type="button"
                                onClick={() => toggleInterest(label)}
                                className={cn(
                                  'px-2 py-0.5 rounded-md font-jakarta text-xs font-medium border transition-colors',
                                  formData.interests?.includes(label)
                                    ? 'bg-[#1A6B3C] text-white border-[#1A6B3C]'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                )}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'orgs' && (
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {organizations.map(org => {
                  const selected = formData.organizations?.includes(org);
                  return (
                    <div
                      key={org}
                      onClick={() => toggleOrg(org)}
                      className={cn(
                        'flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer',
                        selected
                          ? 'bg-[#1A6B3C]/10 border-[#1A6B3C]/30 text-[#1A6B3C]'
                          : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                      )}
                    >
                      <Checkbox
                        id={`side-org-${org}`}
                        checked={selected}
                        className="rounded-md data-[state=checked]:bg-[#1A6B3C] data-[state=checked]:border-[#1A6B3C]"
                      />
                      <span className="font-jakarta text-xs font-medium truncate flex-1">{org}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Organizations */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-jakarta font-bold text-xs uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Users size={13} className="text-[#1A6B3C]" /> Campus Organizations
          </h3>
          <span className="text-xs font-jakarta font-semibold text-[#1A6B3C] bg-[#1A6B3C]/10 px-2 py-0.5 rounded-full">
            {profile?.organizations?.length || 0}
          </span>
        </div>

        {(profile?.organizations?.length ?? 0) > 0 ? (
          <div className="space-y-2">
            {(profile?.organizations || []).map(org => (
              <div key={org} className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-[#1A6B3C]/10 flex items-center justify-center flex-shrink-0">
                  <Users size={12} className="text-[#1A6B3C]" />
                </div>
                <span className="font-jakarta text-xs font-medium text-gray-800">{org}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-jakarta text-xs text-gray-400 italic">No organizations listed.</p>
        )}
      </div>

      {/* Lifestyle & Match Details (if set) */}
      {(profile?.zodiacSign || profile?.personalityType || (profile?.musicTaste && profile.musicTaste.length > 0) || (profile?.movieInterests && profile.movieInterests.length > 0)) && (
        <div className="p-6 space-y-4">
          <h3 className="font-jakarta font-bold text-xs uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Compass size={13} className="text-[#1A6B3C]" /> Discovery & Vibe
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs font-jakarta">
            {profile?.zodiacSign && (
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-400 text-[10px] uppercase font-bold block">Zodiac</span>
                <span className="font-semibold text-gray-800">{profile.zodiacSign}</span>
              </div>
            )}
            {profile?.personalityType && (
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-400 text-[10px] uppercase font-bold block">Personality</span>
                <span className="font-semibold text-gray-800">{profile.personalityType}</span>
              </div>
            )}
          </div>

          {profile?.musicTaste && profile.musicTaste.length > 0 && (
            <div>
              <p className="font-jakarta text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Music size={11} /> Music Taste
              </p>
              <div className="flex flex-wrap gap-1.5">
                {profile.musicTaste.map(g => (
                  <span key={g} className="px-2.5 py-0.5 rounded-md bg-gray-50 text-gray-700 font-jakarta text-xs border border-gray-200/80">
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile?.movieInterests && profile.movieInterests.length > 0 && (
            <div>
              <p className="font-jakarta text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Film size={11} /> Movie Genres
              </p>
              <div className="flex flex-wrap gap-1.5">
                {profile.movieInterests.map(m => (
                  <span key={m} className="px-2.5 py-0.5 rounded-md bg-gray-50 text-gray-700 font-jakarta text-xs border border-gray-200/80">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* People you may know (own profile only) */}
      {isOwnProfile && suggested.length > 0 && (
        <div className="p-6">
          <h3 className="font-fraunces text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <UserPlus size={16} className="text-[#1A6B3C]" /> People You May Know
          </h3>
          <div className="space-y-4">
            {suggested.map(person => {
              const status = connections[person.id] || 'none';
              return (
                <div key={person.id} className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/profile/${person.id}`)}
                    className="hover:opacity-80 transition-opacity flex-shrink-0"
                    aria-label={`View ${person.name || person.username}'s profile`}
                  >
                    <AvatarDisplay
                      src={person.avatar}
                      name={person.name || person.username}
                      className="w-10 h-10 rounded-xl object-cover"
                      textClassName="text-lg"
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => navigate(`/profile/${person.id}`)}
                        className="font-jakarta text-sm font-semibold text-gray-900 truncate hover:underline hover:text-[#1A6B3C] text-left"
                      >
                        {person.username ? `@${person.username}` : person.name}
                      </button>
                      {person.isVerified && <Shield size={10} className="text-[#1A6B3C] flex-shrink-0" />}
                    </div>
                    <p className="font-jakarta text-xs text-gray-400 truncate">{person.course}</p>
                    <p className="font-jakarta text-xs text-gray-400">{person.yearLevel}</p>
                    <button
                      type="button"
                      onClick={() => toggleConnect(person.id)}
                      disabled={status === 'accepted'}
                      className={cn(
                        'mt-2 flex items-center gap-1.5 px-3 py-1 rounded-lg font-jakarta text-xs font-semibold transition-all disabled:cursor-default',
                        status === 'none' && 'border border-gray-200 text-gray-700 hover:border-[#1A6B3C]/40 hover:text-[#1A6B3C] hover:bg-[#1A6B3C]/5',
                        status === 'pending' && 'bg-[#E8A838]/10 text-[#E8A838] border border-[#E8A838]/30',
                        status === 'accepted' && 'bg-[#1A6B3C]/10 text-[#1A6B3C] border border-[#1A6B3C]/20',
                      )}
                    >
                      <UserPlus size={12} />
                      {status === 'none' && 'Connect'}
                      {status === 'pending' && 'Requested'}
                      {status === 'accepted' && 'Connected'}
                    </button>
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
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden h-full w-full bg-white">
      {/* ── Mobile Tab Segment Switcher (visible only < lg) ── */}
      <div className="lg:hidden flex border-b border-gray-100 bg-white flex-shrink-0 z-10">
        <button
          type="button"
          onClick={() => setMobileTab('posts')}
          className={cn(
            'flex-1 py-3 font-jakarta text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-colors',
            mobileTab === 'posts'
              ? 'text-[#1A6B3C] border-[#1A6B3C]'
              : 'text-gray-400 border-transparent hover:text-gray-600'
          )}
        >
          Timeline & Posts
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('about')}
          className={cn(
            'flex-1 py-3 font-jakarta text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-colors',
            mobileTab === 'about'
              ? 'text-[#1A6B3C] border-[#1A6B3C]'
              : 'text-gray-400 border-transparent hover:text-gray-600'
          )}
        >
          About & Info
        </button>
      </div>

      {/* ── Edge-to-Edge 2-Column Split Workspace ── */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 h-full w-full overflow-hidden">

        {/* ══════════════════════════════════════════════════════════
            LEFT COLUMN: Banner, Identity, Composer & Posts Stream
        ══════════════════════════════════════════════════════════ */}
        <div className={cn(
          'flex-1 min-w-0 h-full flex flex-col overflow-y-auto custom-scrollbar bg-white',
          mobileTab !== 'posts' && 'hidden lg:flex'
        )}>
          {/* Cover Banner */}
          <div className="relative flex-shrink-0">
            <div className="h-44 sm:h-56 bg-gradient-to-r from-[#1A6B3C] via-[#247946] to-[#3B8C7E] overflow-hidden relative">
              <div
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}
              />
            </div>

            {/* Avatar overhanging cover */}
            <div className="absolute bottom-0 left-6 sm:left-8 translate-y-1/2 z-10">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                <AvatarDisplay
                  src={displayProfile.avatar}
                  name={displayProfile.username || profile?.name}
                  className="w-full h-full object-cover"
                  textClassName="text-4xl sm:text-5xl"
                />
              </div>
            </div>
          </div>

          {/* Identity Bar */}
          <div className="pt-16 sm:pt-18 pb-5 px-6 sm:px-8 border-b border-gray-100 flex items-start justify-between gap-4 flex-wrap bg-white flex-shrink-0">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-fraunces text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                  {profile?.name || (profile?.username ? `@${profile.username}` : 'Student')}
                </h1>
                {profile?.isVerified && (
                  <span className="inline-flex items-center gap-1 bg-[#1A6B3C]/10 text-[#1A6B3C] px-2.5 py-0.5 rounded-md">
                    <Shield size={11} />
                    <span className="font-jakarta text-xs font-semibold">CHMSU VERIFIED</span>
                  </span>
                )}
              </div>
              {profile?.username && (
                <p className="font-jakarta text-sm text-gray-400 font-medium mt-0.5">
                  @{profile.username}
                </p>
              )}
            </div>

            {/* Profile Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0 mt-1">
              {!isOwnProfile ? (
                relationshipLoading ? (
                  <div className="h-9 w-40 rounded-xl bg-gray-100 animate-pulse" />
                ) : relationship && viewedUserId ? (
                  <RelationshipButtons
                    targetUserId={viewedUserId}
                    targetName={profile?.username ? `@${profile.username}` : profile?.name ?? 'this student'}
                    allyStatus={relationship.allyStatus}
                    isFollowing={relationship.isFollowing}
                    isFollowedBy={relationship.isFollowedBy}
                    onAllyStatusChange={(status) => setRelationship(r => r ? { ...r, allyStatus: status } : r)}
                    onFollowChange={(following) => setRelationship(r => r ? {
                      ...r,
                      isFollowing: following,
                      followersCount: r.followersCount + (following ? 1 : -1),
                    } : r)}
                    onConversationReady={(conversationId) => navigate('/messages', { state: { conversationId } })}
                  />
                ) : null
              ) : isEditing ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 font-jakarta text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <X size={13} /> Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit(onSave)}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#1A6B3C] text-white font-jakarta text-sm font-semibold hover:bg-[#155a33] transition-colors shadow-xs disabled:opacity-70"
                  >
                    <Check size={13} /> {isSaving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#1A6B3C]/20 text-[#1A6B3C] font-jakarta text-sm font-semibold hover:border-[#1A6B3C]/40 hover:bg-[#1A6B3C]/5 transition-all shadow-xs"
                >
                  <Pencil size={13} /> Edit profile
                </button>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          {(isOwnProfile ? true : !!relationship) && (
            <div className="px-6 sm:px-8 py-3.5 border-b border-gray-100 flex items-center gap-6 flex-wrap bg-white flex-shrink-0">
              <button
                type="button"
                onClick={() => viewedUserId && setListModal('followers')}
                className="font-jakarta text-sm hover:text-[#1A6B3C] transition-colors"
              >
                <span className="font-bold text-gray-900">{relationship?.followersCount ?? 0}</span>{' '}
                <span className="text-gray-500 font-medium">Followers</span>
              </button>
              <button
                type="button"
                onClick={() => viewedUserId && setListModal('following')}
                className="font-jakarta text-sm hover:text-[#1A6B3C] transition-colors"
              >
                <span className="font-bold text-gray-900">{relationship?.followingCount ?? 0}</span>{' '}
                <span className="text-gray-500 font-medium">Following</span>
              </button>
              <button
                type="button"
                onClick={() => viewedUserId && setListModal('allies')}
                className="font-jakarta text-sm hover:text-[#1A6B3C] transition-colors"
              >
                <span className="font-bold text-gray-900">{relationship?.alliesCount ?? 0}</span>{' '}
                <span className="text-gray-500 font-medium">Allies</span>
              </button>

              {!isOwnProfile && relationship && (relationship.mutualAlliesCount > 0 || relationship.mutualFollowersCount > 0) && (
                <span className="font-jakarta text-xs text-gray-400 ml-auto">
                  {relationship.mutualAlliesCount > 0 && `${relationship.mutualAlliesCount} Mutual Allies`}
                  {relationship.mutualAlliesCount > 0 && relationship.mutualFollowersCount > 0 && ' · '}
                  {relationship.mutualFollowersCount > 0 && `${relationship.mutualFollowersCount} Mutual Followers`}
                </span>
              )}
            </div>
          )}

          {/* ── Feed & Media Sub-Tabs (Bottom of followers, following, allies) ── */}
          <div className="px-6 sm:px-8 border-b border-gray-100 flex items-center gap-8 bg-white flex-shrink-0">
            <button
              type="button"
              onClick={() => setStreamTab('feed')}
              className={cn(
                'py-3.5 font-jakarta text-sm font-semibold flex items-center gap-2 border-b-2 transition-all -mb-px',
                streamTab === 'feed'
                  ? 'border-[#1A6B3C] text-[#1A6B3C]'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              )}
            >
              <Newspaper size={16} />
              <span>Feed</span>
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs font-semibold transition-colors',
                streamTab === 'feed' ? 'bg-[#1A6B3C]/10 text-[#1A6B3C]' : 'bg-gray-100 text-gray-400'
              )}>
                {posts.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStreamTab('media')}
              className={cn(
                'py-3.5 font-jakarta text-sm font-semibold flex items-center gap-2 border-b-2 transition-all -mb-px',
                streamTab === 'media'
                  ? 'border-[#1A6B3C] text-[#1A6B3C]'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              )}
            >
              <ImageIcon size={16} />
              <span>Media</span>
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs font-semibold transition-colors',
                streamTab === 'media' ? 'bg-[#1A6B3C]/10 text-[#1A6B3C]' : 'bg-gray-100 text-gray-400'
              )}>
                {mediaPosts.length}
              </span>
            </button>
          </div>

          {/* ── Inline Edit Form Panel (when editing) ── */}
          {isEditing && (
            <div className="p-6 sm:p-8 border-b border-gray-100 bg-[#FAF9F6] space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-fraunces text-xl font-bold text-gray-900">Edit Profile Details</h2>
                <span className="font-jakarta text-xs text-gray-400">Update your student information</span>
              </div>

              {/* Avatar Chooser */}
              <div>
                <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-2">
                  Profile Photo
                </label>
                <div className="flex gap-1 bg-gray-200/80 rounded-xl p-1 mb-3 max-w-xs">
                  {(['presets', 'upload'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setAvatarTab(tab)}
                      className={cn(
                        'flex-1 py-1 rounded-lg text-xs font-jakarta font-semibold transition-all',
                        avatarTab === tab ? 'bg-white text-[#1A6B3C] shadow-xs' : 'text-gray-600'
                      )}
                    >
                      {tab === 'presets' ? 'Choose Preset' : 'Upload Photo'}
                    </button>
                  ))}
                </div>

                {avatarTab === 'presets' && (
                  presetAvatars.length === 0 ? (
                    <p className="font-jakarta text-xs text-gray-400 py-2">No preset avatars found — switch to Upload Photo.</p>
                  ) : (
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                      {presetAvatars.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => { setValue('avatar', preset.url, { shouldValidate: true }); setCustomAvatarPreview(null); }}
                          className={cn(
                            'aspect-square rounded-xl overflow-hidden border-2 transition-all',
                            formData.avatar === preset.url ? 'border-[#1A6B3C] scale-105 shadow-xs' : 'border-transparent hover:border-[#1A6B3C]/30'
                          )}
                          title={preset.label ?? undefined}
                        >
                          <img src={preset.url} alt={preset.label ?? 'Preset'} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )
                )}

                {avatarTab === 'upload' && (
                  <div className="space-y-2">
                    {customAvatarPreview || (formData.avatar && (formData.avatar.startsWith('http') || formData.avatar.startsWith('/') || formData.avatar.startsWith('data:'))) ? (
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#1A6B3C] shadow-xs flex-shrink-0">
                          <img src={customAvatarPreview ?? formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-jakarta text-xs font-semibold text-[#1A6B3C] mb-1">Custom photo ready</p>
                          <button
                            type="button"
                            onClick={() => {
                              setCustomAvatarPreview(null);
                              setValue('avatar', '', { shouldValidate: true });
                              if (avatarFileRef.current) avatarFileRef.current.value = '';
                            }}
                            className="font-jakarta text-xs text-red-500 hover:text-red-700 font-semibold"
                          >
                            Remove photo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => !avatarUploading && avatarFileRef.current?.click()}
                        className={cn(
                          'border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer transition-all hover:border-[#1A6B3C]/40 bg-white',
                          avatarUploading && 'pointer-events-none opacity-60',
                        )}
                      >
                        {avatarUploading ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 size={18} className="text-[#1A6B3C] animate-spin" />
                            <p className="font-jakarta text-xs text-gray-500">Uploading photo…</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <Camera size={20} className="text-gray-400" />
                            <p className="font-jakarta text-xs font-semibold text-gray-700">Click to upload photo from your device</p>
                            <p className="font-jakarta text-[11px] text-gray-400">JPG, PNG, or WebP</p>
                          </div>
                        )}
                      </div>
                    )}
                    <input
                      ref={avatarFileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const objectUrl = URL.createObjectURL(file);
                        setCustomAvatarPreview(objectUrl);
                        if (!isApiConfigured) { setValue('avatar', objectUrl, { shouldValidate: true }); return; }
                        setAvatarUploading(true);
                        try {
                          const res = await apiClient.uploadAvatarMedia(file);
                          setValue('avatar', res.url, { shouldValidate: true });
                          setCustomAvatarPreview(res.url);
                        } catch (err: any) {
                          notify.error('Upload failed', err.message);
                          setCustomAvatarPreview(null);
                          setValue('avatar', '', { shouldValidate: true });
                        } finally {
                          setAvatarUploading(false);
                          if (avatarFileRef.current) avatarFileRef.current.value = '';
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Username */}
              <div>
                <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-1">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-jakarta text-sm">@</span>
                  <input
                    {...register('username')}
                    type="text"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-white font-jakarta text-sm outline-none"
                    placeholder="yourusername"
                  />
                </div>
                {errors.username && <p className="mt-1 text-xs font-jakarta text-red-500">{errors.username.message}</p>}
                {usernameStatus === 'checking' && <p className="mt-1 text-xs text-gray-400">Checking availability…</p>}
                {usernameStatus === 'taken' && <p className="mt-1 text-xs text-red-500">Username is already taken</p>}
              </div>

              {/* Bio */}
              <div>
                <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-1">
                  Bio / About Me
                </label>
                <div className="relative">
                  <textarea
                    {...register('bio')}
                    maxLength={250}
                    rows={3}
                    placeholder="Tell others what you study, hobbies, and interests…"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-white font-jakarta text-sm outline-none resize-none"
                  />
                  <span className="absolute bottom-2.5 right-3 font-mono text-xs text-gray-400">
                    {formData.bio?.length || 0}/250
                  </span>
                </div>
              </div>

              {/* Department, Course, Year */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-1">
                    Department
                  </label>
                  <select
                    {...register('department')}
                    onChange={e => { setValue('department', e.target.value); setValue('course', ''); }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-white font-jakarta text-sm outline-none"
                  >
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-1">
                    Course
                  </label>
                  <select
                    {...register('course')}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-white font-jakarta text-sm outline-none"
                  >
                    <option value="" disabled>Select Course</option>
                    {(coursesByDept[formData.department] || []).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-1">
                    Year Level
                  </label>
                  <select
                    {...register('yearLevel')}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-white font-jakarta text-sm outline-none"
                  >
                    {yearLevels.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {/* Match Preferences */}
              <div className="pt-3 border-t border-gray-200/80">
                <p className="font-jakarta font-semibold text-xs text-[#1A6B3C] uppercase tracking-wide mb-3">
                  Match & Discovery Profile <span className="text-gray-400 normal-case font-normal">(optional)</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-1">Age Range</label>
                    <select {...register('ageRange')} className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-white font-jakarta text-sm outline-none">
                      <option value="">Prefer not to say</option>
                      {AGE_RANGE_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-1">Match Preference</label>
                    <select {...register('matchGenderPreference')} className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-white font-jakarta text-sm outline-none">
                      <option value="">Prefer not to say</option>
                      {MATCH_GENDER_PREFERENCE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-1">Zodiac Sign</label>
                    <select {...register('zodiacSign')} className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-white font-jakarta text-sm outline-none">
                      <option value="">Not set</option>
                      {ZODIAC_OPTIONS.map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-1">Personality Type</label>
                    <select {...register('personalityType')} className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-white font-jakarta text-sm outline-none">
                      <option value="">Not set</option>
                      {PERSONALITY_TYPE_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Music Taste</label>
                  <div className="flex flex-wrap gap-1.5">
                    {MUSIC_TASTE_OPTIONS.map(genre => (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => toggleMusicTaste(genre)}
                        className={cn(
                          'px-2.5 py-1 rounded-lg font-jakarta text-xs font-medium border transition-colors',
                          formData.musicTaste?.includes(genre)
                            ? 'bg-[#1A6B3C] text-white border-[#1A6B3C]'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                        )}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Movie Interests</label>
                  <div className="flex flex-wrap gap-1.5">
                    {MOVIE_INTEREST_OPTIONS.map(genre => (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => toggleMovieInterest(genre)}
                        className={cn(
                          'px-2.5 py-1 rounded-lg font-jakarta text-xs font-medium border transition-colors',
                          formData.movieInterests?.includes(genre)
                            ? 'bg-[#1A6B3C] text-white border-[#1A6B3C]'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                        )}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Bottom Save / Cancel */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-xl border border-gray-200 font-jakarta text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit(onSave)}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#1A6B3C] text-white font-jakarta text-sm font-semibold hover:bg-[#155a33] transition-colors disabled:opacity-70"
                >
                  {isSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* ── Feed Stream View ── */}
          {streamTab === 'feed' && (
            <div className="flex-1 min-h-0 bg-white flex flex-col">
              {/* Post Composer Trigger (own profile only) */}
              {isOwnProfile && !isEditing && (
                <div
                  onClick={() => setComposerOpen(true)}
                  className="px-6 sm:px-8 py-4 border-b border-gray-100 bg-white flex items-center gap-3 cursor-pointer hover:bg-gray-50/50 transition-colors flex-shrink-0"
                >
                  <AvatarDisplay
                    src={profile?.avatar}
                    name={profile?.name || profile?.username}
                    className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                    textClassName="text-lg"
                  />
                  <div className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 font-jakarta text-sm text-gray-400">
                    What's on your mind?
                  </div>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#1A6B3C]/8 text-[#1A6B3C] font-jakarta text-xs font-semibold hover:bg-[#1A6B3C]/15 transition-colors"
                  >
                    <ImageIcon size={14} /> <span className="hidden sm:inline">Photo</span>
                  </button>
                </div>
              )}

              {/* Feed Posts */}
              <div className="flex-1 min-h-0">
                {postsLoading ? (
                  <div className="divide-y divide-gray-100">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="p-6 space-y-3 animate-pulse">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3.5 bg-gray-200 rounded-md w-1/3" />
                            <div className="h-2.5 bg-gray-100 rounded-md w-1/4" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-100 rounded-md w-full" />
                          <div className="h-3 bg-gray-100 rounded-md w-3/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : posts.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <div className="w-12 h-12 bg-[#1A6B3C]/8 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <RefreshCw size={22} className="text-[#1A6B3C]/40" />
                    </div>
                    <p className="font-fraunces text-base font-semibold text-gray-800 mb-1">No posts yet</p>
                    <p className="font-jakarta text-sm text-gray-400">
                      {isOwnProfile ? 'Share your thoughts, questions, or updates with classmates.' : 'This student has not shared any posts yet.'}
                    </p>
                  </div>
                ) : (
                  <div>
                    {posts.map(post => (
                      <FeedPostCard
                        key={post.id}
                        post={post}
                        currentUser={currentUser}
                        onToggleLike={toggleLike}
                        onCommentClick={setActivePost}
                        onDelete={handleDelete}
                        showBorder={false}
                        className="border-b border-gray-100 last:border-b-0 rounded-none bg-white p-6 hover:bg-gray-50/40 transition-colors"
                      />
                    ))}

                    <div ref={sentinelRef} className="h-6" />

                    {isLoadingMore && (
                      <div className="flex justify-center py-5">
                        <div className="w-6 h-6 border-2 border-[#1A6B3C]/20 border-t-[#1A6B3C] rounded-full animate-spin" />
                      </div>
                    )}

                    {!hasMore && posts.length > 0 && (
                      <p className="font-jakarta text-xs text-gray-400 text-center py-6">
                        You've reached the end of this stream
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Media Grid View ── */}
          {streamTab === 'media' && (
            <div className="flex-1 min-h-0 bg-white">
              {postsLoading ? (
                <div className="grid grid-cols-3 gap-1 sm:gap-2 p-3 sm:p-4 animate-pulse">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="aspect-square rounded-lg bg-gray-100" />
                  ))}
                </div>
              ) : mediaPosts.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="w-12 h-12 bg-[#1A6B3C]/8 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <ImageIcon size={22} className="text-[#1A6B3C]/40" />
                  </div>
                  <p className="font-fraunces text-base font-semibold text-gray-800 mb-1">No media yet</p>
                  <p className="font-jakarta text-sm text-gray-400">
                    {isOwnProfile
                      ? 'Photos and images attached to your posts will be collected here.'
                      : 'This student has not shared any media photos yet.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1 sm:gap-2 p-3 sm:p-4 bg-white">
                  {mediaPosts.map(post => {
                    const cover = post.media[0];
                    const hasMultiple = post.media.length > 1;
                    return (
                      <div
                        key={post.id}
                        onClick={() => setActivePost(post)}
                        className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden cursor-pointer group border border-gray-100/60"
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

        </div>

        {/* ══════════════════════════════════════════════════════════
            RIGHT COLUMN: Fully Blended Information Sidebar
        ══════════════════════════════════════════════════════════ */}
        <div className={cn(
          'w-full lg:w-[480px] xl:w-[540px] 2xl:w-[600px] bg-white border-t lg:border-t-0 lg:border-l border-gray-100 flex flex-col min-h-0 flex-shrink-0 overflow-y-auto custom-scrollbar',
          mobileTab !== 'about' && 'hidden lg:flex'
        )}>
          {/* Top Panel Bar */}
          <div className="p-4 sm:px-6 border-b border-gray-100 flex items-center justify-between bg-white/95 backdrop-blur-sm sticky top-0 z-10 flex-shrink-0">
            <h2 className="font-fraunces text-lg font-bold text-gray-900">Student Profile</h2>
            <span className="font-jakarta text-xs text-gray-400 font-medium">CHMSU Campus</span>
          </div>

          {rightSideInfoContent}
        </div>

      </div>

      {/* Modals & Overlays */}
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