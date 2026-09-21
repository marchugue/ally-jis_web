// src/components/profile/EditProfileModal.tsx
import { useEffect, useRef, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Camera,
  Loader2,
  Check,
  Sparkles,
  GraduationCap,
  User,
  X,
  Search,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RotateCcw,
  Upload,
} from 'lucide-react';
import { Student } from '@/types/ally';
import { cn } from '@/lib/utils';
import { apiClient, isApiConfigured } from '@/api/client';
import type { PresetAvatarRow } from '@/api/client';
import { profileService } from '@/lib/services/profileService';
import { profileSchema, ProfileFormValues } from '@/lib/validations/profile';
import { isImageUrl } from '@/components/ally/AvatarDisplay';
import { useLookupOptions } from '@/hooks/useLookupOptions';
import { Checkbox } from '@/components/ui/checkbox';
import { notify } from '@/components/ui/sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  profile: Student;
  onProfileUpdated: (updated: Student) => void;
  useBackend: boolean;
  userId?: string;
}

type TabKey = 'general' | 'academics' | 'interests';

const ZODIAC_SIGNS = [
  'Aries ♈', 'Taurus ♉', 'Gemini ♊', 'Cancer ♋',
  'Leo ♌', 'Virgo ♍', 'Libra ♎', 'Scorpio ♏',
  'Sagittarius ♐', 'Capricorn ♑', 'Aquarius ♒', 'Pisces ♓',
];

const MBTI_TYPES = [
  'INTJ - Architect', 'INTP - Logician', 'ENTJ - Commander', 'ENTP - Debater',
  'INFJ - Advocate', 'INFP - Mediator', 'ENFJ - Protagonist', 'ENFP - Campaigner',
  'ISTJ - Logistician', 'ISFJ - Defender', 'ESTJ - Executive', 'ESFJ - Consul',
  'ISTP - Virtuoso', 'ISFP - Adventurer', 'ESTP - Entrepreneur', 'ESFP - Entertainer',
];

const AGE_RANGES = ['17-19', '20-22', '23-25', '26+'];

export function EditProfileModal({
  open,
  onClose,
  profile,
  onProfileUpdated,
  useBackend,
  userId,
}: EditProfileModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [showVibeDetails, setShowVibeDetails] = useState(false);

  // Search filter states
  const [orgSearch, setOrgSearch] = useState('');
  const [interestSearch, setInterestSearch] = useState('');

  // Avatar presets and upload
  const [presetAvatars, setPresetAvatars] = useState<PresetAvatarRow[]>([]);
  const [avatarTab, setAvatarTab] = useState<'presets' | 'upload'>('presets');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string | null>(null);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  const { organizations, departments, coursesByDept, interestsByCategory, yearLevels } = useLookupOptions();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
  });

  const formData = watch();
  const currentUsername = watch('username');

  // Load preset avatars
  useEffect(() => {
    if (!isApiConfigured) return;
    apiClient.getPresetAvatars()
      .then((res) => setPresetAvatars(res.avatars))
      .catch(() => { });
  }, []);

  // Initialize form when opening
  useEffect(() => {
    if (open && profile) {
      reset({
        username: profile.username || '',
        bio: profile.bio || '',
        department: profile.department || '',
        course: profile.course || '',
        yearLevel: profile.yearLevel || '',
        interests: profile.interests || [],
        organizations: profile.organizations || [],
        avatar: profile.avatar || '',
        zodiacSign: profile.zodiacSign ?? '',
        personalityType: profile.personalityType ?? '',
        musicTaste: profile.musicTaste ?? [],
        movieInterests: profile.movieInterests ?? [],
        ageRange: profile.ageRange ?? '',
        matchGenderPreference: profile.matchGenderPreference ?? '',
      });
      setCustomAvatarPreview(null);
      if (profile.avatar) {
        const isPreset = presetAvatars.some((p) => p.url === profile.avatar);
        if (!isPreset && isImageUrl(profile.avatar)) {
          setAvatarTab('upload');
        } else {
          setAvatarTab('presets');
        }
      }
      setUsernameStatus('idle');
      setActiveTab('general');
      setOrgSearch('');
      setInterestSearch('');
      setShowVibeDetails(Boolean(profile.zodiacSign || profile.personalityType || profile.ageRange));
    }
  }, [open, profile, reset]);

  // Debounced username check
  useEffect(() => {
    const raw = currentUsername?.toLowerCase()?.trim();
    if (!raw || raw.length < 3) {
      setUsernameStatus('idle');
      return;
    }
    if (raw === profile?.username?.toLowerCase()) {
      setUsernameStatus('idle');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(raw)) {
      setUsernameStatus('idle');
      return;
    }

    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      if (!useBackend || !userId) {
        setUsernameStatus('available');
        return;
      }
      try {
        const ok = await profileService.checkUsername(raw, userId);
        setUsernameStatus(ok ? 'available' : 'taken');
      } catch {
        setUsernameStatus('idle');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [currentUsername, profile?.username, useBackend, userId]);

  const toggleInterest = (interest: string) => {
    const cur = formData.interests || [];
    setValue(
      'interests',
      cur.includes(interest) ? cur.filter((i) => i !== interest) : [...cur, interest],
      { shouldValidate: true }
    );
  };

  const toggleOrg = (org: string) => {
    const cur = formData.organizations || [];
    setValue(
      'organizations',
      cur.includes(org) ? cur.filter((o) => o !== org) : [...cur, org],
      { shouldValidate: true }
    );
  };

  const onSave = async (data: ProfileFormValues) => {
    if (!useBackend || !userId) {
      const updated: Student = {
        ...profile,
        ...data,
        username: data.username || null,
        name: data.username || profile.name,
      };
      onProfileUpdated(updated);
      notify.success('Profile updated');
      onClose();
      return;
    }

    setIsSaving(true);
    const norm = data.username.toLowerCase().trim();

    // Check username if changed
    if (norm !== profile?.username?.toLowerCase()) {
      setUsernameStatus('checking');
      try {
        const ok = await profileService.checkUsername(norm, userId);
        if (!ok) {
          notify.error('Username taken', 'That username is already taken. Please choose another.');
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
      await profileService.updateProfile(userId, { ...data, username: norm });
      const updated: Student = {
        ...profile,
        ...data,
        username: norm,
        name: norm,
      };
      onProfileUpdated(updated);
      notify.success('Profile saved', 'Your profile details have been updated.');
      onClose();
    } catch (e: any) {
      notify.error('Save failed', e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered organizations
  const filteredOrganizations = useMemo(() => {
    if (!orgSearch.trim()) return organizations;
    const q = orgSearch.toLowerCase();
    return organizations.filter((o) => o.toLowerCase().includes(q));
  }, [organizations, orgSearch]);

  // Filtered interests by category
  const filteredInterestsByCategory = useMemo(() => {
    if (!interestSearch.trim()) return interestsByCategory;
    const q = interestSearch.toLowerCase();
    const result: Record<string, { label: string; color: string }[]> = {};

    Object.entries(interestsByCategory).forEach(([cat, items]) => {
      const matching = items.filter((item) => item.label.toLowerCase().includes(q));
      if (matching.length > 0) {
        result[cat] = matching;
      }
    });

    return result;
  }, [interestsByCategory, interestSearch]);

  const interestCount = formData.interests?.length || 0;
  const isInterestsValid = interestCount >= 3;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl w-full max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-3xl border border-gray-200/80 dark:border-white/10 shadow-2xl bg-white dark:bg-[#181818] transition-colors">

        {/* ── Dialog Header ── */}
        <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex-shrink-0">
          <DialogTitle className="font-fraunces text-xl font-bold text-gray-900 dark:text-white">
            Edit Profile
          </DialogTitle>
          <DialogDescription className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Update your public identity, academic details, and campus interests.
          </DialogDescription>
        </DialogHeader>



        {/* ── Navigation Tabs ── */}
        <div className="flex border-b border-gray-100 dark:border-white/10 bg-white dark:bg-[#181818] px-6 gap-1 sm:gap-2 flex-shrink-0">
          {[
            { key: 'general', label: 'Identity & Bio', icon: User },
            {
              key: 'academics',
              label: 'Academics & Orgs',
              icon: GraduationCap,
              badge: formData.organizations?.length ? formData.organizations.length : undefined,
            },
            {
              key: 'interests',
              label: 'Campus Interests',
              icon: Sparkles,
              badge: `${interestCount}`,
              badgeAlert: !isInterestsValid,
            },
          ].map(({ key, label, icon: Icon, badge, badgeAlert }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key as TabKey)}
              className={cn(
                'py-3 px-3 font-jakarta text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all -mb-px cursor-pointer',
                activeTab === key
                  ? 'border-[#1A6B3C] dark:border-emerald-400 text-[#1A6B3C] dark:text-emerald-400 font-bold'
                  : 'border-transparent text-gray-400 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              )}
            >
              <Icon size={14} />
              <span>{label}</span>
              {badge !== undefined && (
                <span className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono',
                  activeTab === key
                    ? 'bg-[#1A6B3C]/10 dark:bg-emerald-500/20 text-[#1A6B3C] dark:text-emerald-400'
                    : badgeAlert
                      ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                      : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                )}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Scrollable Form Body ── */}
        <div className="overflow-y-auto custom-scrollbar p-6 space-y-6 flex-1 min-h-0 bg-white dark:bg-[#181818]">

          {/* ═════════════════════════════════════════════════════════
              TAB 1: GENERAL & IDENTITY
              ═════════════════════════════════════════════════════════ */}
          {activeTab === 'general' && (
            <div className="space-y-5">

              {/* Profile Photo Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-jakarta font-semibold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Profile Avatar
                  </label>
                  <span className="text-[11px] font-jakarta text-gray-400 dark:text-gray-500">
                    Choose an illustrated avatar or upload your own
                  </span>
                </div>

                <div className="flex gap-1 bg-gray-100 dark:bg-white/5 rounded-xl p-1 mb-3 max-w-xs border border-gray-200/60 dark:border-white/5">
                  {(['presets', 'upload'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setAvatarTab(tab)}
                      className={cn(
                        'flex-1 py-1.5 rounded-lg text-xs font-jakarta font-semibold transition-all cursor-pointer',
                        avatarTab === tab
                          ? 'bg-white dark:bg-[#222222] text-[#1A6B3C] dark:text-emerald-400 shadow-xs'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      )}
                    >
                      {tab === 'presets' ? 'Choose Preset' : 'Upload Photo'}
                    </button>
                  ))}
                </div>

                {avatarTab === 'presets' && (
                  presetAvatars.length === 0 ? (
                    <div className="p-6 rounded-2xl border border-gray-200/80 dark:border-white/10 text-center bg-gray-50/50 dark:bg-white/5">
                      <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400">
                        No preset avatars found. You can switch to Upload Photo to use any image.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-5 sm:grid-cols-8 gap-2.5 max-h-48 overflow-y-auto p-1.5 custom-scrollbar bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-gray-200/80 dark:border-white/10">
                      {presetAvatars.map((preset) => {
                        const isSelected = formData.avatar === preset.url;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              setValue('avatar', preset.url, { shouldValidate: true });
                              setCustomAvatarPreview(null);
                            }}
                            className={cn(
                              'relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer group',
                              isSelected
                                ? 'border-[#1A6B3C] dark:border-emerald-500 scale-105 shadow-xs ring-2 ring-[#1A6B3C]/20 dark:ring-emerald-500/20'
                                : 'border-transparent hover:border-[#1A6B3C]/40 dark:hover:border-emerald-500/40 hover:scale-102'
                            )}
                            title={preset.label ?? undefined}
                          >
                            <img
                              src={preset.url}
                              alt={preset.label ?? 'Preset'}
                              className="w-full h-full object-cover"
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-[#1A6B3C]/20 dark:bg-emerald-500/20 flex items-center justify-center">
                                <span className="w-4 h-4 rounded-full bg-[#1A6B3C] dark:bg-emerald-500 text-white text-[10px] flex items-center justify-center shadow-xs">
                                  ✓
                                </span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )
                )}

                {avatarTab === 'upload' && (
                  <div className="space-y-3">
                    {customAvatarPreview || (formData.avatar && isImageUrl(formData.avatar)) ? (
                      <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#1A6B3C] dark:border-emerald-500 shadow-xs flex-shrink-0 bg-white dark:bg-[#202020]">
                          <img src={customAvatarPreview ?? formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-jakarta text-xs font-semibold text-[#1A6B3C] dark:text-emerald-400">
                            Custom photo selected
                          </p>
                          <p className="font-jakarta text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                            Ready to use across your campus profile and posts.
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <button
                              type="button"
                              onClick={() => avatarFileRef.current?.click()}
                              className="font-jakarta text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-[#1A6B3C] dark:hover:text-emerald-400 cursor-pointer"
                            >
                              Change file
                            </button>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <button
                              type="button"
                              onClick={() => {
                                setCustomAvatarPreview(null);
                                setValue('avatar', '', { shouldValidate: true });
                                if (avatarFileRef.current) avatarFileRef.current.value = '';
                              }}
                              className="font-jakarta text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 font-semibold cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          if (!avatarUploading && avatarFileRef.current) {
                            avatarFileRef.current.value = '';
                            avatarFileRef.current.click();
                          }
                        }}
                        className={cn(
                          'border-2 border-dashed border-gray-200 dark:border-white/15 rounded-2xl p-6 text-center cursor-pointer transition-all hover:border-[#1A6B3C]/50 dark:hover:border-emerald-500/50 bg-gray-50/60 dark:bg-white/5',
                          avatarUploading && 'pointer-events-none opacity-60'
                        )}
                      >
                        {avatarUploading ? (
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Loader2 size={24} className="text-[#1A6B3C] dark:text-emerald-400 animate-spin" />
                            <p className="font-jakarta text-xs text-gray-600 dark:text-gray-400">Uploading photo…</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-[#1A6B3C]/10 dark:bg-emerald-500/10 text-[#1A6B3C] dark:text-emerald-400 flex items-center justify-center">
                              <Upload size={18} />
                            </div>
                            <p className="font-jakarta text-xs font-semibold text-gray-800 dark:text-gray-200">
                              Click to choose a photo from your device
                            </p>
                            <p className="font-jakarta text-[11px] text-gray-400 dark:text-gray-500">
                              PNG, JPG, or WebP up to 5MB
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    <input
                      ref={avatarFileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onClick={(e) => {
                        (e.target as HTMLInputElement).value = '';
                      }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const objectUrl = URL.createObjectURL(file);
                        setCustomAvatarPreview(objectUrl);
                        if (!isApiConfigured) {
                          setValue('avatar', objectUrl, { shouldValidate: true });
                          return;
                        }
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
                {errors.avatar && <p className="mt-1.5 text-xs font-jakarta text-red-500">{errors.avatar.message}</p>}
              </div>

              {/* Username Input with Debounced Realtime Feedback */}
              <div>
                <label className="font-jakarta font-semibold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-jakarta text-sm">
                    @
                  </span>
                  <input
                    {...register('username')}
                    type="text"
                    className="w-full pl-8 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 focus:border-[#1A6B3C] dark:focus:border-emerald-400 bg-gray-50 dark:bg-[#1E1E1E] text-gray-900 dark:text-white font-jakarta text-xs sm:text-sm outline-none transition-colors"
                    placeholder="yourusername"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === 'checking' && (
                      <Loader2 size={15} className="animate-spin text-gray-400" />
                    )}
                    {usernameStatus === 'available' && (
                      <Check size={16} className="text-emerald-500" strokeWidth={2.5} />
                    )}
                    {usernameStatus === 'taken' && (
                      <X size={16} className="text-red-500" strokeWidth={2.5} />
                    )}
                  </div>
                </div>

                {errors.username ? (
                  <p className="mt-1 text-xs font-jakarta text-red-500">{errors.username.message}</p>
                ) : usernameStatus === 'taken' ? (
                  <p className="mt-1 text-xs font-jakarta text-red-500">Username is already taken by another student.</p>
                ) : usernameStatus === 'available' ? (
                  <p className="mt-1 text-xs font-jakarta text-[#1A6B3C] dark:text-emerald-400">Username is available!</p>
                ) : (
                  <p className="mt-1 text-[11px] font-jakarta text-gray-400 dark:text-gray-500">
                    Letters, numbers, and underscores (3-20 characters).
                  </p>
                )}
              </div>

              {/* Bio / About Me */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-jakarta font-semibold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Bio / About Me
                  </label>
                  <span className="font-mono text-xs text-gray-400 dark:text-gray-500">
                    {formData.bio?.length || 0} / 250
                  </span>
                </div>
                <textarea
                  {...register('bio')}
                  maxLength={250}
                  rows={3}
                  placeholder="Share a short intro about your studies, passions, or campus goals…"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 focus:border-[#1A6B3C] dark:focus:border-emerald-400 bg-gray-50 dark:bg-[#1E1E1E] text-gray-900 dark:text-white font-jakarta text-xs sm:text-sm outline-none resize-none transition-colors"
                />
              </div>

            </div>
          )}

          {/* ═════════════════════════════════════════════════════════
              TAB 2: ACADEMICS & ORGANIZATIONS
              ═════════════════════════════════════════════════════════ */}
          {activeTab === 'academics' && (
            <div className="space-y-5">

              {/* Academic Details Card */}
              <div className="space-y-3.5">
                <div>
                  <label className="font-jakarta font-semibold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                    Department / College
                  </label>
                  <select
                    {...register('department')}
                    onChange={(e) => {
                      setValue('department', e.target.value);
                      setValue('course', '');
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 font-jakarta text-xs sm:text-sm bg-gray-50 dark:bg-[#1E1E1E] text-gray-900 dark:text-white focus:border-[#1A6B3C] dark:focus:border-emerald-400 outline-none cursor-pointer"
                  >
                    <option value="" disabled>Select Department</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  {errors.department && <p className="mt-1 text-xs font-jakarta text-red-500">{errors.department.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="font-jakarta font-semibold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                      Degree / Program
                    </label>
                    <select
                      {...register('course')}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 font-jakarta text-xs sm:text-sm bg-gray-50 dark:bg-[#1E1E1E] text-gray-900 dark:text-white focus:border-[#1A6B3C] dark:focus:border-emerald-400 outline-none cursor-pointer"
                    >
                      <option value="" disabled>Select Course</option>
                      {(coursesByDept[formData.department] || []).map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    {errors.course && <p className="mt-1 text-xs font-jakarta text-red-500">{errors.course.message}</p>}
                  </div>

                  <div>
                    <label className="font-jakarta font-semibold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                      Year Level
                    </label>
                    <select
                      {...register('yearLevel')}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 font-jakarta text-xs sm:text-sm bg-gray-50 dark:bg-[#1E1E1E] text-gray-900 dark:text-white focus:border-[#1A6B3C] dark:focus:border-emerald-400 outline-none cursor-pointer"
                    >
                      <option value="" disabled>Select Year Level</option>
                      {yearLevels.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    {errors.yearLevel && <p className="mt-1 text-xs font-jakarta text-red-500">{errors.yearLevel.message}</p>}
                  </div>
                </div>
              </div>

              {/* Campus Organizations Card */}
              <div className="pt-3 border-t border-gray-100 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-jakarta font-semibold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide block">
                      Campus Organizations
                    </label>
                    <p className="font-jakarta text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      Select official clubs or student groups you are active in.
                    </p>
                  </div>
                  <span className="text-xs font-jakarta font-semibold text-[#1A6B3C] dark:text-emerald-400 px-2 py-0.5 bg-[#1A6B3C]/10 dark:bg-emerald-500/15 rounded-full">
                    {formData.organizations?.length || 0} joined
                  </span>
                </div>

                {/* Search Org */}
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search organizations..."
                    value={orgSearch}
                    onChange={(e) => setOrgSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 dark:border-white/10 font-jakarta text-xs sm:text-sm bg-gray-50 dark:bg-[#1E1E1E] text-gray-900 dark:text-white outline-none focus:border-[#1A6B3C] dark:focus:border-emerald-400 transition-colors"
                  />
                  {orgSearch && (
                    <button
                      type="button"
                      onClick={() => setOrgSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Organization Selection List */}
                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                  {filteredOrganizations.length === 0 ? (
                    <p className="text-center py-4 text-xs font-jakarta text-gray-400">
                      No organizations matching "{orgSearch}".
                    </p>
                  ) : (
                    filteredOrganizations.map((org) => {
                      const selected = formData.organizations?.includes(org);
                      return (
                        <div
                          key={org}
                          onClick={() => toggleOrg(org)}
                          className={cn(
                            'flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none',
                            selected
                              ? 'bg-[#1A6B3C]/10 dark:bg-emerald-500/15 border-[#1A6B3C]/40 dark:border-emerald-500/40 text-[#1A6B3C] dark:text-emerald-400 font-medium'
                              : 'bg-white dark:bg-[#1E1E1E] border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 text-gray-700 dark:text-gray-300'
                          )}
                        >
                          <Checkbox
                            id={`modal-org-${org}`}
                            checked={selected}
                            className="rounded-md data-[state=checked]:bg-[#1A6B3C] dark:data-[state=checked]:bg-emerald-500 data-[state=checked]:border-[#1A6B3C] dark:data-[state=checked]:border-emerald-500"
                          />
                          <span className="font-jakarta text-xs truncate flex-1">{org}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ═════════════════════════════════════════════════════════
              TAB 3: CAMPUS INTERESTS
              ═════════════════════════════════════════════════════════ */}
          {activeTab === 'interests' && (
            <div className="space-y-4">

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-jakarta font-bold text-sm text-gray-900 dark:text-white">
                    Campus Interests
                  </h4>
                  <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Pick at least 3 topics to discover compatible study buddies and allies.
                  </p>
                </div>
                <span className={cn(
                  'text-xs font-jakarta font-semibold px-2.5 py-1 rounded-full',
                  isInterestsValid
                    ? 'bg-[#1A6B3C]/10 dark:bg-emerald-500/15 text-[#1A6B3C] dark:text-emerald-400'
                    : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                )}>
                  {interestCount} selected
                </span>
              </div>

              {!isInterestsValid && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-jakarta">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>Please choose at least 3 interests ({interestCount}/3 chosen).</span>
                </div>
              )}

              {/* Instant Search Bar for Interests */}
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search topics (e.g. Coding, Photography, Capstone, Anime)..."
                  value={interestSearch}
                  onChange={(e) => setInterestSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 dark:border-white/10 font-jakarta text-xs sm:text-sm bg-gray-50 dark:bg-[#1E1E1E] text-gray-900 dark:text-white outline-none focus:border-[#1A6B3C] dark:focus:border-emerald-400 transition-colors"
                />
                {interestSearch && (
                  <button
                    type="button"
                    onClick={() => setInterestSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Selected Interests Summary Chips */}
              {(formData.interests?.length ?? 0) > 0 && (
                <div className="p-3 bg-gray-50/70 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-jakarta text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      Your Selected Interests ({interestCount})
                    </span>
                    <button
                      type="button"
                      onClick={() => setValue('interests', [], { shouldValidate: true })}
                      className="font-jakarta text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.interests?.map((interest) => (
                      <span
                        key={interest}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1A6B3C]/10 dark:bg-emerald-500/20 text-[#1A6B3C] dark:text-emerald-400 font-jakarta text-xs font-semibold border border-[#1A6B3C]/20 dark:border-emerald-500/30"
                      >
                        <span>{interest}</span>
                        <button
                          type="button"
                          onClick={() => toggleInterest(interest)}
                          className="hover:text-red-500 transition-colors text-xs font-bold leading-none cursor-pointer"
                          title="Remove"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* All Categories Grid */}
              <div className="max-h-72 overflow-y-auto space-y-4 p-4 bg-gray-50/50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-2xl custom-scrollbar">
                {Object.keys(filteredInterestsByCategory).length === 0 ? (
                  <p className="text-center py-6 text-xs font-jakarta text-gray-400">
                    No interests matching "{interestSearch}".
                  </p>
                ) : (
                  Object.entries(filteredInterestsByCategory).map(([category, items]) => (
                    <div key={category}>
                      <p className="font-jakarta font-bold text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                        {category}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {items.map(({ label }) => {
                          const selected = formData.interests?.includes(label);
                          return (
                            <button
                              key={label}
                              type="button"
                              onClick={() => toggleInterest(label)}
                              className={cn(
                                'px-3 py-1.5 rounded-xl font-jakarta text-xs font-medium border transition-all cursor-pointer',
                                selected
                                  ? 'bg-[#1A6B3C] dark:bg-emerald-600 text-white border-[#1A6B3C] dark:border-emerald-500 shadow-xs'
                                  : 'bg-white dark:bg-[#1E1E1E] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5'
                              )}
                            >
                              {selected ? `✓ ${label}` : label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
              {errors.interests && <p className="mt-1 text-xs font-jakarta text-red-500">{errors.interests.message}</p>}
            </div>
          )}

        </div>

        {/* ── Dialog Sticky Footer ── */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/10 bg-[#FAF9F6] dark:bg-[#141414] flex items-center justify-between gap-3 flex-shrink-0">
          <div className="text-xs font-jakarta text-gray-500 dark:text-gray-400 hidden sm:block">
            {!isInterestsValid ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                Pick at least 3 interests to save
              </span>
            ) : usernameStatus === 'taken' ? (
              <span className="text-red-500 font-medium">Username already taken</span>
            ) : (
              <span>All changes will be saved to your profile</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 font-jakarta text-xs sm:text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit(onSave)}
              disabled={isSaving || !isInterestsValid || usernameStatus === 'taken'}
              className={cn(
                'flex items-center gap-1.5 px-5 sm:px-6 py-2 rounded-xl font-jakarta text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer',
                isSaving || !isInterestsValid || usernameStatus === 'taken'
                  ? 'bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none'
                  : 'bg-[#1A6B3C] dark:bg-emerald-600 text-white hover:bg-[#155a33] dark:hover:bg-emerald-500 active:scale-[0.99]'
              )}
            >
              {isSaving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Saving…</span>
                </>
              ) : (
                <>
                  <Check size={15} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
