import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Pencil, Check, X, Plus, Building2, GraduationCap,
  Shield, Users, LogOut, ImageIcon,
  Heart, MessageCircle, UserPlus,
  RefreshCw, Info, Camera, Loader2,
} from 'lucide-react';
import { CURRENT_USER } from '@/data/mockData';
import { Student } from '@/types/ally';
import type { FeedPost } from '@/types/feed';
import { cn } from '@/lib/utils';
import { apiClient, isApiConfigured } from '@/api/client';
import type { ProfileRelationshipSummary, RelationshipStatus, PresetAvatarRow } from '@/api/client';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
    <div className="min-h-screen bg-[#F7F4EF] pb-20">
      <div className="max-w-4xl mx-auto px-4 pt-4 sm:pt-6 space-y-5">
        {/* Profile Header Card Skeleton */}
        <div className="bg-white rounded-3xl border border-[#1A6B3C]/8 shadow-[0_1px_6px_rgba(0,0,0,0.06)] overflow-hidden animate-pulse">
          {/* Cover gradient */}
          <div className="h-36 sm:h-44 bg-gradient-to-r from-[#0A331C]/60 via-[#1A6B3C]/50 to-[#185E35]/60 relative">
            {/* Avatar circle overhang */}
            <div className="absolute bottom-0 left-6 translate-y-1/2">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gray-200 border-4 border-white shadow-lg" />
            </div>
          </div>

          {/* Name & Action Row */}
          <div className="pt-16 sm:pt-18 pb-5 px-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="space-y-2">
              <div className="h-7 w-44 bg-gray-200 rounded-lg" />
              <div className="h-4 w-28 bg-gray-100 rounded-md" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-28 bg-gray-100 rounded-xl" />
            </div>
          </div>
        </div>

        {/* 2-Column Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
          {/* Main (Left) Column */}
          <div className="space-y-5">
            {/* Composer skeleton (if own profile) */}
            {isOwnProfile && (
              <div className="bg-white rounded-3xl border border-[#1A6B3C]/8 p-4 shadow-[0_1px_6px_rgba(0,0,0,0.06)] animate-pulse flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="h-10 bg-gray-100 rounded-full flex-1" />
              </div>
            )}

            {/* Post Card Skeletons */}
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl border border-[#1A6B3C]/8 p-5 shadow-[0_1px_6px_rgba(0,0,0,0.06)] animate-pulse space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-gray-200 rounded-full w-1/3" />
                      <div className="h-2.5 bg-gray-100 rounded-full w-1/4" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-100 rounded-full w-full" />
                    <div className="h-3 bg-gray-100 rounded-full w-4/5" />
                    <div className="h-3 bg-gray-100 rounded-full w-2/3" />
                  </div>
                  <div className="pt-3 border-t border-gray-100 flex gap-6">
                    <div className="h-3 w-12 bg-gray-100 rounded-full" />
                    <div className="h-3 w-12 bg-gray-100 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column (Intro + Suggestions) */}
          <div className="hidden lg:flex flex-col gap-5">
            {/* Intro Card */}
            <div className="bg-white rounded-3xl border border-[#1A6B3C]/8 p-5 shadow-[0_1px_6px_rgba(0,0,0,0.06)] animate-pulse space-y-4">
              <div className="h-5 w-16 bg-gray-200 rounded-md" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded-full w-full" />
                <div className="h-3 bg-gray-100 rounded-full w-4/5" />
              </div>
              <div className="space-y-2.5 pt-2">
                <div className="h-4 w-44 bg-gray-100 rounded-md" />
                <div className="h-4 w-36 bg-gray-100 rounded-md" />
              </div>
              <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-1.5">
                <div className="h-6 w-16 bg-gray-100 rounded-full" />
                <div className="h-6 w-20 bg-gray-100 rounded-full" />
                <div className="h-6 w-14 bg-gray-100 rounded-full" />
              </div>
            </div>

            {/* People you may know Card */}
            {isOwnProfile && (
              <div className="bg-white rounded-3xl border border-[#1A6B3C]/8 p-5 shadow-[0_1px_6px_rgba(0,0,0,0.06)] animate-pulse space-y-4">
                <div className="h-5 w-36 bg-gray-200 rounded-md" />
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-gray-200 rounded-full w-24" />
                      <div className="h-2.5 bg-gray-100 rounded-full w-16" />
                    </div>
                    <div className="h-7 w-16 bg-gray-100 rounded-xl" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { userId: routeUserId } = useParams<{ userId?: string }>();

  const viewedUserId = routeUserId || user?.id || null;
  const isOwnProfile = !routeUserId || routeUserId === user?.id;

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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { organizations, departments, coursesByDept, interestsByCategory, yearLevels } = useLookupOptions();

  // ── own posts ─────────────────────────────────────────────────────────────
  const [posts, setPosts] = useState<FeedPost[]>([]);
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

    // Viewing someone else's profile — just their data, no form population,
    // no suggested-people widget (that's an own-profile feature).
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
  const handleSignOut = async () => { await signOut(); navigate('/', { replace: true }); };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (!window.confirm('Delete your account? This cannot be undone.')) return;
    if (useBackend) {
      try { await profileService.deleteProfile(); }
      catch (e: any) { notify.error('Delete failed', e.message); return; }
    }
    await signOut();
    navigate('/');
  };

  const onSave = async (data: ProfileFormValues) => {
    if (!useBackend || !user) {
      setProfile({ ...CURRENT_USER, ...data, username: data.username || null, joinedAt: profile?.joinedAt || CURRENT_USER.joinedAt, id: profile?.id || CURRENT_USER.id, email: profile?.email || CURRENT_USER.email, isVerified: profile?.isVerified || CURRENT_USER.isVerified });
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    const norm = data.username.toLowerCase();
    if (norm !== profile?.username?.toLowerCase()) {
      setUsernameStatus('checking');
      try {
        const ok = await profileService.checkUsername(norm, user.id);
        if (!ok) { notify.error('Username taken', 'That username is already taken.'); setUsernameStatus('taken'); setIsSaving(false); return; }
        setUsernameStatus('available');
      } catch (e: any) { notify.error('Username check failed', e.message); setUsernameStatus('idle'); setIsSaving(false); return; }
    }
    try { await profileService.updateProfile(user.id, { ...data, username: norm }); }
    catch (e: any) { notify.error('Save failed', e.message); setIsSaving(false); return; }
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

  // ── shared "profile details" content (Intro + People you may know) ────────
  // Rendered inline on desktop (lg+) in the right column, and inside the
  // mobile-only "Profile details" modal on small screens.
  const profileDetailsContent = (
    <>
      {/* Intro card */}
      <div className="bg-white rounded-3xl border border-[#1A6B3C]/8 shadow-[0_1px_6px_rgba(0,0,0,0.06)] px-5 py-5">
        <h2 className="font-fraunces text-base font-bold text-gray-900 mb-4">Intro</h2>

        {profile?.bio
          ? <p className="font-jakarta text-sm text-gray-600 leading-relaxed mb-4">{profile.bio}</p>
          : (
            <p className="font-jakarta text-sm text-gray-400 italic mb-4">
              {isOwnProfile ? 'No bio yet. Click "Edit profile" to add one.' : 'No bio yet.'}
            </p>
          )
        }

        <div className="space-y-2.5 text-sm font-jakarta">
          <div className="flex items-center gap-2.5 text-gray-600">
            <div className="w-7 h-7 rounded-lg bg-[#1A6B3C]/10 flex items-center justify-center flex-shrink-0">
              <GraduationCap size={13} className="text-[#1A6B3C]" />
            </div>
            <span>{profile?.course} · {profile?.yearLevel}</span>
          </div>
          <div className="flex items-center gap-2.5 text-gray-600">
            <div className="w-7 h-7 rounded-lg bg-[#1A6B3C]/10 flex items-center justify-center flex-shrink-0">
              <Building2 size={13} className="text-[#1A6B3C]" />
            </div>
            <span>{(profile?.department || '').replace('College of ', '')}</span>
          </div>
        </div>

        {/* Interests */}
        {(profile?.interests?.length ?? 0) > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide mb-2.5">Interests</p>
            <div className="flex flex-wrap gap-1.5">
              {(profile?.interests || []).map(interest => (
                <span key={interest} className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-jakarta text-xs font-medium border border-gray-200">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Organizations */}
        {(profile?.organizations?.length ?? 0) > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide mb-2.5">Organizations</p>
            <div className="flex flex-col gap-2">
              {(profile?.organizations || []).map(org => (
                <div key={org} className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-[#1A6B3C]/10 flex items-center justify-center flex-shrink-0">
                    <Users size={11} className="text-[#1A6B3C]" />
                  </div>
                  <span className="font-jakarta text-xs text-gray-700">{org}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit mode: Interests & Orgs picker */}
      {isEditing && (
        <div className="bg-white rounded-3xl border border-[#1A6B3C]/8 shadow-[0_1px_6px_rgba(0,0,0,0.06)] px-5 py-5">
          <div className="flex border-b border-gray-100 mb-4">
            {(['interests', 'orgs'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex-1 py-2.5 font-jakarta font-semibold text-xs uppercase tracking-wide transition-colors',
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
                  <p className="font-jakarta text-xs text-[#1A6B3C]">Add at least <strong>3 interests</strong> to get matches. ({formData.interests?.length ?? 0}/3)</p>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(formData.interests || []).map(interest => (
                  <div key={interest} className="relative group">
                    <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-jakarta text-xs font-medium border border-gray-200">{interest}</span>
                    <button onClick={() => toggleInterest(interest)} className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs leading-none">×</button>
                  </div>
                ))}
                {!showInterestPicker && (
                  <button onClick={() => setShowInterestPicker(true)} className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-[#1A6B3C]/30 text-[#1A6B3C]/60 font-jakarta text-xs hover:border-[#1A6B3C]/60">
                    <Plus size={11} /> Add
                  </button>
                )}
              </div>
              {showInterestPicker && (
                <div className="border border-[#1A6B3C]/15 rounded-2xl p-3 bg-[#F7F4EF]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-jakarta font-semibold text-xs text-[#1A6B3C]">{formData.interests?.length ?? 0} selected</p>
                    <button onClick={() => setShowInterestPicker(false)} className="text-gray-400 hover:text-gray-600 text-base leading-none">×</button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {Object.entries(interestsByCategory).map(([category, items]) => (
                      <div key={category}>
                        <p className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide mb-1.5">{category}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {items.map(({ label }) => (
                            <button key={label} onClick={() => toggleInterest(label)}
                              className={cn(
                                'px-2.5 py-1 rounded-full font-jakarta text-xs font-medium border transition-colors',
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
            <div className="max-h-80 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {organizations.map(org => {
                const selected = formData.organizations?.includes(org);
                return (
                  <div key={org} className={cn(
                    "flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer",
                    selected
                      ? "bg-[#1A6B3C]/10 border-[#1A6B3C]/30 shadow-xs"
                      : "bg-white border-[#1A6B3C]/10 hover:border-[#1A6B3C]/25"
                  )}>
                    <Checkbox
                      id={`org-${org}`}
                      checked={selected}
                      onCheckedChange={() => toggleOrg(org)}
                      className="border-gray-300 rounded-[6px] data-[state=checked]:bg-[#1A6B3C] data-[state=checked]:border-[#1A6B3C]"
                    />
                    <label htmlFor={`org-${org}`} className={cn(
                      "flex-1 font-jakarta text-sm cursor-pointer transition-colors",
                      selected ? "text-[#1A6B3C] font-bold" : "text-gray-700"
                    )}>
                      {org}
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* People you may know */}
      {isOwnProfile && suggested.length > 0 && (
        <div className="bg-white rounded-3xl border border-[#1A6B3C]/8 shadow-[0_1px_6px_rgba(0,0,0,0.06)] px-5 py-5">
          <h2 className="font-fraunces text-base font-bold text-gray-900 mb-4">People you may know</h2>
          <div className="flex flex-col gap-4">
            {suggested.map(person => {
              const status = connections[person.id] || 'none';
              return (
                <div key={person.id} className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/profile/${person.id}`)}
                    className="hover:opacity-85 transition-opacity flex-shrink-0"
                    aria-label={`View ${person.name || person.username}'s profile`}
                  >
                    <AvatarDisplay
                      src={person.avatar}
                      name={person.name || person.username}
                      className="w-10 h-10 rounded-full object-cover shadow-xs"
                      textClassName="text-xl"
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
                      onClick={() => toggleConnect(person.id)}
                      disabled={status === 'accepted'}
                      className={cn(
                        'mt-2 flex items-center gap-1 px-3 py-1.5 rounded-lg font-jakarta text-xs font-semibold transition-all disabled:cursor-default',
                        status === 'none' && 'border border-gray-200 text-gray-600 hover:border-[#1A6B3C]/40 hover:text-[#1A6B3C] hover:bg-[#1A6B3C]/5',
                        status === 'pending' && 'bg-[#E8A838]/10 text-[#E8A838] border border-[#E8A838]/30',
                        status === 'accepted' && 'bg-[#1A6B3C]/10 text-[#1A6B3C] border border-[#1A6B3C]/20',
                      )}
                    >
                      <UserPlus size={11} />
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
    </>
  );

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[#F7F4EF] lg:bg-[#F7F4EF]">
      <div className="max-w-7xl mx-auto lg:px-6 py-0 pb-32 md:pb-12">

        {/* Error banner removed — errors shown as toasts */}

        {/* ══════════════════════════════════════════════════════════
            PROFILE HEADER — FB-style.
            Mobile: full-bleed, square corners, no side border (edge-to-edge).
            Desktop (lg+): rounded card with border, as before.
        ══════════════════════════════════════════════════════════ */}
        <div className="bg-white border-b border-[#1A6B3C]/8 lg:rounded-b-3xl lg:border lg:border-t-0 lg:shadow-[0_1px_6px_rgba(0,0,0,0.06)] mb-2 lg:mb-4 overflow-visible">

          {/* Cover + avatar positioned on top of it */}
          <div className="relative">
            {/* Cover */}
            <div className="h-44 sm:h-52 bg-gradient-to-r from-[#1A6B3C] via-[#2d8a56] to-[#3B8C7E] lg:rounded-t-3xl overflow-hidden">
              <div
                className="absolute inset-0 opacity-20"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
              />
            </div>

            {/* Avatar — absolute, anchored to bottom-left of cover.
                On mobile, tapping it opens the "Profile details" modal. */}
            <button
              type="button"
              onClick={() => setDetailsOpen(true)}
              className="absolute bottom-0 left-6 translate-y-1/2 z-10 lg:pointer-events-none lg:cursor-default"
              aria-label="View profile details"
            >
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white border-4 border-white shadow-lg overflow-hidden flex items-center justify-center active:scale-95 lg:active:scale-100 transition-transform">
                <AvatarDisplay
                  src={displayProfile.avatar}
                  name={displayProfile.username || profile?.name}
                  className="w-full h-full object-cover"
                  textClassName="text-5xl sm:text-6xl"
                />
              </div>
            </button>
          </div>

          {/* Name row — sits below the cover, leaves room for avatar overhang */}
          <div className="pt-16 sm:pt-18 pb-5 px-6 flex items-center justify-between gap-4 flex-wrap">
            <button
              type="button"
              onClick={() => setDetailsOpen(true)}
              className="flex items-center gap-2.5 flex-wrap text-left lg:pointer-events-none lg:cursor-default"
              aria-label="View profile details"
            >
              <h1 className="font-fraunces text-2xl font-bold text-gray-900">
                {profile?.username ? `@${profile.username}` : profile?.name}
              </h1>
              {profile?.isVerified && (
                <span className="inline-flex items-center gap-1 bg-[#1A6B3C]/10 text-[#1A6B3C] px-2.5 py-0.5 rounded-full">
                  <Shield size={11} />
                  <span className="font-jakarta text-xs font-semibold">CHMSU VERIFIED</span>
                </span>
              )}
            </button>

            {/* Profile details (mobile) / Edit / Save / Cancel — own profile only.
                Viewing someone else shows the ally/follow actions instead. */}
            <div className="flex items-center gap-2 flex-shrink-0">
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
                <>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 font-jakarta text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <X size={13} /> Cancel
                  </button>
                  <button
                    onClick={handleSubmit(onSave)}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#1A6B3C] text-white font-jakarta text-sm font-semibold hover:bg-[#155a33] transition-colors shadow-md disabled:opacity-70"
                  >
                    <Check size={13} /> {isSaving ? 'Saving…' : 'Save'}
                  </button>
                </>
              ) : (
                <>
                  {/* Profile details trigger — mobile only */}
                  <button
                    onClick={() => setDetailsOpen(true)}
                    className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl border-2 border-[#1A6B3C]/20 text-[#1A6B3C] hover:border-[#1A6B3C]/40 hover:bg-[#1A6B3C]/5 transition-all flex-shrink-0"
                    aria-label="Profile details"
                  >
                    <Info size={15} />
                  </button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="flex items-center gap-1.5 px-5 py-2 rounded-xl border-2 border-[#1A6B3C]/20 text-[#1A6B3C] font-jakarta text-sm font-semibold hover:border-[#1A6B3C]/40 hover:bg-[#1A6B3C]/5 transition-all">
                        <Pencil size={13} /> <span className="hidden sm:inline">Edit profile</span><span className="sm:hidden">Edit</span>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md rounded-3xl">
                      <DialogHeader>
                        <DialogTitle className="font-fraunces text-xl">Account actions</DialogTitle>
                        <DialogDescription className="font-jakarta text-sm">Manage your profile and account.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-3 py-4">
                        <button onClick={() => setIsEditing(true)} className="flex items-center justify-between rounded-xl border border-[#1A6B3C]/20 px-4 py-3 text-left font-jakarta text-sm font-semibold text-[#1A6B3C] hover:bg-[#1A6B3C]/5">Edit profile <Pencil size={14} /></button>
                        <button onClick={handleSignOut} className="flex items-center justify-between rounded-xl border border-red-200 px-4 py-3 text-left font-jakarta text-sm font-semibold text-red-600 hover:bg-red-50">Log out <LogOut size={14} /></button>
                        <button onClick={handleDeleteAccount} className="flex items-center justify-between rounded-xl bg-red-600 px-4 py-3 text-left font-jakarta text-sm font-semibold text-white hover:bg-red-700">Delete account <X size={14} /></button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          </div>

          {/* Followers / Following / Allies stats — clickable, own profile
              shows its own counts, viewed profile shows theirs + mutuals. */}
          {(isOwnProfile ? true : !!relationship) && (
            <div className="px-6 pb-5 -mt-1 flex items-center gap-5 flex-wrap">
              <button
                onClick={() => viewedUserId && setListModal('followers')}
                className="font-jakarta text-sm hover:underline"
              >
                <span className="font-bold text-gray-900">{relationship?.followersCount ?? 0}</span>{' '}
                <span className="text-gray-500">Followers</span>
              </button>
              <button
                onClick={() => viewedUserId && setListModal('following')}
                className="font-jakarta text-sm hover:underline"
              >
                <span className="font-bold text-gray-900">{relationship?.followingCount ?? 0}</span>{' '}
                <span className="text-gray-500">Following</span>
              </button>
              <button
                onClick={() => viewedUserId && setListModal('allies')}
                className="font-jakarta text-sm hover:underline"
              >
                <span className="font-bold text-gray-900">{relationship?.alliesCount ?? 0}</span>{' '}
                <span className="text-gray-500">Allies</span>
              </button>

              {!isOwnProfile && relationship && (relationship.mutualAlliesCount > 0 || relationship.mutualFollowersCount > 0) && (
                <span className="font-jakarta text-xs text-gray-400">
                  {relationship.mutualAlliesCount > 0 && `${relationship.mutualAlliesCount} Mutual Allies`}
                  {relationship.mutualAlliesCount > 0 && relationship.mutualFollowersCount > 0 && ' · '}
                  {relationship.mutualFollowersCount > 0 && `${relationship.mutualFollowersCount} Mutual Followers`}
                </span>
              )}
            </div>
          )}

          {/* Edit form — shown inline below header when editing */}
          {isEditing && (
            <div className="px-6 pb-6 border-t border-gray-100 pt-5 space-y-4">
              {/* Avatar picker */}
              <div>
                <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-2">Profile Photo</label>
                {/* Tab */}
                <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-3">
                  {(['presets', 'upload'] as const).map((tab) => (
                    <button key={tab} type="button" onClick={() => setAvatarTab(tab)}
                      className={cn(
                        'flex-1 py-1 rounded-lg text-xs font-jakarta font-semibold transition-all',
                        avatarTab === tab ? 'bg-white text-[#1A6B3C] shadow-sm' : 'text-gray-500'
                      )}
                    >
                      {tab === 'presets' ? 'Choose Preset' : 'Upload Photo'}
                    </button>
                  ))}
                </div>

                {avatarTab === 'presets' && (
                  presetAvatars.length === 0 ? (
                    <p className="font-jakarta text-xs text-gray-400 py-3">No preset avatars yet — switch to Upload Photo.</p>
                  ) : (
                    <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                      {presetAvatars.map((preset) => (
                        <button key={preset.id} type="button"
                          onClick={() => { setValue('avatar', preset.url, { shouldValidate: true }); setCustomAvatarPreview(null); }}
                          className={cn(
                            'aspect-square rounded-xl overflow-hidden border-2 transition-all',
                            formData.avatar === preset.url ? 'border-[#1A6B3C] scale-105 shadow-sm' : 'border-transparent hover:border-[#1A6B3C]/30'
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
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#1A6B3C] shadow-sm flex-shrink-0">
                          <img src={customAvatarPreview ?? formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-jakarta text-xs font-semibold text-[#1A6B3C] mb-1">Photo set!</p>
                          <button type="button"
                            onClick={() => { setCustomAvatarPreview(null); setValue('avatar', '', { shouldValidate: true }); if (avatarFileRef.current) avatarFileRef.current.value = ''; }}
                            className="font-jakarta text-xs text-red-500 hover:text-red-700"
                          >Remove</button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => !avatarUploading && avatarFileRef.current?.click()}
                        className={cn(
                          'border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer transition-all hover:border-[#1A6B3C]/40',
                          avatarUploading && 'pointer-events-none opacity-60',
                        )}
                      >
                        {avatarUploading ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 size={18} className="text-[#1A6B3C] animate-spin" />
                            <p className="font-jakarta text-xs text-gray-500">Uploading…</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <Camera size={20} className="text-gray-300" />
                            <p className="font-jakarta text-xs font-semibold text-gray-600">Tap to upload photo</p>
                          </div>
                        )}
                      </div>
                    )}
                    <input ref={avatarFileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
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
                <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-1">Username</label>
                <input {...register('username')} type="text" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-gray-50 font-jakarta text-sm outline-none" />
                {errors.username && <p className="mt-1 text-xs font-jakarta text-red-500">{errors.username.message}</p>}
              </div>

              {/* Bio */}
              <div>
                <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-1">Bio</label>
                <div className="relative">
                  <textarea {...register('bio')} maxLength={250} rows={3} placeholder="Tell others about yourself…" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-gray-50 font-jakarta text-sm outline-none resize-none" />
                  <span className="absolute bottom-2 right-3 font-mono text-xs text-gray-400">{formData.bio?.length || 0}/250</span>
                </div>
              </div>

              {/* Department / Course / Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-1">Department</label>
                  <select {...register('department')} onChange={e => { setValue('department', e.target.value); setValue('course', ''); }} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-gray-50 font-jakarta text-sm outline-none">
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-1">Course</label>
                  <select {...register('course')} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-gray-50 font-jakarta text-sm outline-none">
                    <option value="" disabled>Select Course</option>
                    {(coursesByDept[formData.department] || []).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-1">Year Level</label>
                  <select {...register('yearLevel')} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-gray-50 font-jakarta text-sm outline-none">
                    {yearLevels.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {/* For better matches — all optional, used by /match (Phase 2) */}
              <div className="pt-2 border-t border-gray-100">
                <p className="font-jakarta font-semibold text-xs text-[#1A6B3C] uppercase tracking-wide mb-3">
                  For better matches <span className="text-gray-400 normal-case font-medium">(optional)</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-1">Age Range</label>
                    <select {...register('ageRange')} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-gray-50 font-jakarta text-sm outline-none">
                      <option value="">Prefer not to say</option>
                      {AGE_RANGE_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-1">Match Preference</label>
                    <select {...register('matchGenderPreference')} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-gray-50 font-jakarta text-sm outline-none">
                      <option value="">Prefer not to say</option>
                      {MATCH_GENDER_PREFERENCE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-1">Zodiac Sign</label>
                    <select {...register('zodiacSign')} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-gray-50 font-jakarta text-sm outline-none">
                      <option value="">Not set</option>
                      {ZODIAC_OPTIONS.map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-1">Personality Type</label>
                    <select {...register('personalityType')} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-gray-50 font-jakarta text-sm outline-none">
                      <option value="">Not set</option>
                      {PERSONALITY_TYPE_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-2">Music Taste</label>
                  <div className="flex flex-wrap gap-1.5">
                    {MUSIC_TASTE_OPTIONS.map(genre => (
                      <button key={genre} type="button" onClick={() => toggleMusicTaste(genre)}
                        className={cn(
                          'px-2.5 py-1 rounded-full font-jakarta text-xs font-medium border transition-colors',
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
                  <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-2">Movie Interests</label>
                  <div className="flex flex-wrap gap-1.5">
                    {MOVIE_INTEREST_OPTIONS.map(genre => (
                      <button key={genre} type="button" onClick={() => toggleMovieInterest(genre)}
                        className={cn(
                          'px-2.5 py-1 rounded-full font-jakarta text-xs font-medium border transition-colors',
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
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════
            3-COLUMN GRID
            On mobile (<lg): only the feed column shows. The Intro /
            People-you-may-know content moves into the "Profile details"
            modal triggered from the Info button or the avatar/name above.
            On desktop (lg+): unchanged 3-column layout.
        ══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-5 items-start">

          {/* ── LEFT COLUMN (col-span-2 on desktop, full width on mobile) — feed ── */}
          <div className="lg:col-span-2 flex flex-col gap-2 lg:gap-5">

            {/* Post composer trigger — own profile only */}
            {isOwnProfile && (
              <div
                className="bg-white border-b border-[#1A6B3C]/8 lg:rounded-3xl lg:border lg:shadow-[0_1px_6px_rgba(0,0,0,0.06)] px-4 lg:px-5 py-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setComposerOpen(true)}
              >
                <div className="flex items-center gap-3">
                  <AvatarDisplay
                    src={profile?.avatar}
                    name={profile?.name || profile?.username}
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-black/5"
                    textClassName="text-lg"
                  />
                  <div className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 font-jakarta text-sm text-gray-400">
                    What's on your mind?
                  </div>
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#1A6B3C]/8 text-[#1A6B3C] font-jakarta text-xs font-semibold hover:bg-[#1A6B3C]/15 transition-colors">
                    <ImageIcon size={13} /> <span className="hidden sm:inline">Photo</span>
                  </button>
                </div>
              </div>
            )}


            {/* Posts */}
            {postsLoading ? (
              <div className="space-y-2 lg:space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white border-b border-[#1A6B3C]/6 lg:rounded-3xl lg:border lg:shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-4 animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 rounded-full w-1/3" />
                        <div className="h-2.5 bg-gray-100 rounded-full w-1/4" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-100 rounded-full w-full" />
                      <div className="h-3 bg-gray-100 rounded-full w-4/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white border-b border-[#1A6B3C]/8 lg:rounded-3xl lg:border lg:shadow-[0_1px_6px_rgba(0,0,0,0.06)] px-6 py-14 text-center">
                <div className="w-12 h-12 bg-[#1A6B3C]/8 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <RefreshCw size={22} className="text-[#1A6B3C]/40" />
                </div>
                <p className="font-fraunces text-base font-semibold text-gray-600 mb-1">No posts yet</p>
                <p className="font-jakarta text-sm text-gray-400">Share something with your campus community.</p>
              </div>
            ) : (
              <div className="space-y-2 lg:space-y-4">
                {posts.map(post => (
                  <FeedPostCard
                    key={post.id}
                    post={post}
                    currentUser={currentUser}
                    onToggleLike={toggleLike}
                    onCommentClick={setActivePost}
                    onDelete={handleDelete}
                  />
                ))}

                <div ref={sentinelRef} className="h-4" />

                {isLoadingMore && (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-[#1A6B3C]/20 border-t-[#1A6B3C] rounded-full animate-spin" />
                  </div>
                )}

                {!hasMore && posts.length > 0 && (
                  <p className="font-jakarta text-xs text-gray-400 text-center py-4">You've seen all your posts</p>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN — Intro + People you may know.
                Desktop only (hidden below lg; shown inside the modal on mobile). ── */}
          <div className="hidden lg:flex flex-col gap-5">
            {profileDetailsContent}
          </div>

        </div>
      </div>

      {/* Profile details modal — mobile only entry point */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl max-h-[85vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="font-fraunces text-xl">Profile details</DialogTitle>
            <DialogDescription className="font-jakarta text-sm">
              Your bio, info, and people you may know.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-5 py-2">
            {profileDetailsContent}
          </div>
        </DialogContent>
      </Dialog>

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