// src/components/profile/EditProfileModal.tsx
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Camera, Loader2, Check, Sparkles,
  GraduationCap, User,
} from 'lucide-react';
import { Student } from '@/types/ally';
import { cn } from '@/lib/utils';
import { apiClient, isApiConfigured } from '@/api/client';
import type { PresetAvatarRow } from '@/api/client';
import { profileService } from '@/lib/services/profileService';
import { profileSchema, ProfileFormValues } from '@/lib/validations/profile';
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

  // Load preset avatars
  useEffect(() => {
    if (!isApiConfigured) return;
    apiClient.getPresetAvatars()
      .then((res) => setPresetAvatars(res.avatars))
      .catch(() => {});
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
      setUsernameStatus('idle');
      setActiveTab('general');
    }
  }, [open, profile, reset]);

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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl w-full max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-gray-100 shadow-2xl bg-white">
        {/* ── Dialog Header ── */}
        <DialogHeader className="px-6 py-4 border-b border-gray-100 flex-shrink-0 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="font-fraunces text-xl font-bold text-gray-900">
              Edit Profile
            </DialogTitle>
            <DialogDescription className="font-jakarta text-xs text-gray-400 mt-0.5">
              Update your public identity, academic details, and campus interests.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* ── Navigation Tabs ── */}
        <div className="flex border-b border-gray-100 bg-[#FAF9F6] px-6 gap-2 flex-shrink-0">
          {[
            { key: 'general', label: 'Identity & Bio', icon: User },
            { key: 'academics', label: 'Academics & Orgs', icon: GraduationCap },
            { key: 'interests', label: 'Campus Interests', icon: Sparkles },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key as TabKey)}
              className={cn(
                'py-3 px-3 font-jakarta text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all -mb-px',
                activeTab === key
                  ? 'border-[#1A6B3C] text-[#1A6B3C] bg-white rounded-t-lg'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              )}
            >
              <Icon size={14} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* ── Scrollable Form Body ── */}
        <div className="overflow-y-auto custom-scrollbar p-6 space-y-6 flex-1 min-h-0 bg-white">
          {/* TAB 1: General & Identity */}
          {activeTab === 'general' && (
            <div className="space-y-5">
              {/* Profile Photo */}
              <div>
                <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-2">
                  Profile Photo
                </label>
                <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-3 max-w-xs">
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
                          onClick={() => {
                            setValue('avatar', preset.url, { shouldValidate: true });
                            setCustomAvatarPreview(null);
                          }}
                          className={cn(
                            'aspect-square rounded-xl overflow-hidden border-2 transition-all',
                            formData.avatar === preset.url
                              ? 'border-[#1A6B3C] scale-105 shadow-xs'
                              : 'border-transparent hover:border-[#1A6B3C]/30'
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
                          <p className="font-jakarta text-xs font-semibold text-[#1A6B3C] mb-1">Photo selected</p>
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
                          'border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer transition-all hover:border-[#1A6B3C]/40 bg-gray-50/50',
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
                {errors.avatar && <p className="mt-1 text-xs font-jakarta text-red-500">{errors.avatar.message}</p>}
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
                {usernameStatus === 'available' && <p className="mt-1 text-xs text-[#1A6B3C]">Username is available!</p>}
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
                    placeholder="Tell other students about your campus life, studies, and what you're passionate about…"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-white font-jakarta text-sm outline-none resize-none"
                  />
                  <span className="absolute bottom-2.5 right-3 font-mono text-xs text-gray-400">
                    {formData.bio?.length || 0}/250
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Academics & Organizations */}
          {activeTab === 'academics' && (
            <div className="space-y-5">
              {/* Department, Course, Year Level */}
              <div className="space-y-3">
                <div>
                  <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-1">
                    Department
                  </label>
                  <select
                    {...register('department')}
                    onChange={(e) => {
                      setValue('department', e.target.value);
                      setValue('course', '');
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-white font-jakarta text-sm outline-none"
                  >
                    <option value="" disabled>Select Department</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  {errors.department && <p className="mt-1 text-xs font-jakarta text-red-500">{errors.department.message}</p>}
                </div>

                <div>
                  <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-1">
                    Course
                  </label>
                  <select
                    {...register('course')}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-white font-jakarta text-sm outline-none"
                  >
                    <option value="" disabled>Select Course</option>
                    {(coursesByDept[formData.department] || []).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {errors.course && <p className="mt-1 text-xs font-jakarta text-red-500">{errors.course.message}</p>}
                </div>

                <div>
                  <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-1">
                    Year Level
                  </label>
                  <select
                    {...register('yearLevel')}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-white font-jakarta text-sm outline-none"
                  >
                    <option value="" disabled>Select Year Level</option>
                    {yearLevels.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  {errors.yearLevel && <p className="mt-1 text-xs font-jakarta text-red-500">{errors.yearLevel.message}</p>}
                </div>
              </div>

              {/* Student Organizations */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide">
                    Campus Organizations
                  </label>
                  <span className="text-xs font-jakarta text-[#1A6B3C] font-semibold">
                    {formData.organizations?.length || 0} joined
                  </span>
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                  {organizations.map((org) => {
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
                          id={`modal-org-${org}`}
                          checked={selected}
                          className="rounded-md data-[state=checked]:bg-[#1A6B3C] data-[state=checked]:border-[#1A6B3C]"
                        />
                        <span className="font-jakarta text-xs font-medium truncate flex-1">{org}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Campus Interests (Only used interests remain) */}
          {activeTab === 'interests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-jakarta font-bold text-sm text-gray-900">
                    Campus Interests
                  </h4>
                  <p className="font-jakarta text-xs text-gray-400 mt-0.5">
                    Select at least 3 topics to connect with classmates and campus peers.
                  </p>
                </div>
                <span className={cn(
                  'text-xs font-jakarta font-semibold px-2.5 py-1 rounded-full',
                  (formData.interests?.length || 0) >= 3
                    ? 'bg-[#1A6B3C]/10 text-[#1A6B3C]'
                    : 'bg-amber-100 text-amber-700'
                )}>
                  {formData.interests?.length || 0} selected
                </span>
              </div>

              {(formData.interests?.length || 0) < 3 && (
                <p className="text-xs text-amber-600 font-jakarta">
                  Please pick at least 3 interests ({formData.interests?.length || 0}/3 chosen).
                </p>
              )}

              {/* Selected Interests Summary Pills */}
              {(formData.interests?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1.5 p-3 bg-white border border-gray-200/80 rounded-xl">
                  {formData.interests?.map((interest) => (
                    <span
                      key={interest}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1A6B3C]/10 text-[#1A6B3C] font-jakarta text-xs font-medium border border-[#1A6B3C]/20"
                    >
                      {interest}
                      <button
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className="hover:text-red-500 transition-colors text-xs font-bold leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* All Categories Grid */}
              <div className="max-h-72 overflow-y-auto space-y-4 p-4 bg-gray-50/70 border border-gray-200 rounded-xl custom-scrollbar">
                {Object.entries(interestsByCategory).map(([category, items]) => (
                  <div key={category}>
                    <p className="font-jakarta font-bold text-[11px] text-gray-400 uppercase tracking-wider mb-2">
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
                              'px-3 py-1.5 rounded-lg font-jakarta text-xs font-medium border transition-colors',
                              selected
                                ? 'bg-[#1A6B3C] text-white border-[#1A6B3C] shadow-xs'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                            )}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {errors.interests && <p className="mt-1 text-xs font-jakarta text-red-500">{errors.interests.message}</p>}
            </div>
          )}
        </div>

        {/* ── Dialog Sticky Footer ── */}
        <div className="px-6 py-4 border-t border-gray-100 bg-[#FAF9F6] flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl border border-gray-200 font-jakarta text-sm text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit(onSave)}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-[#1A6B3C] text-white font-jakarta text-sm font-semibold hover:bg-[#155a33] transition-colors shadow-xs disabled:opacity-70"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving Changes…</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
