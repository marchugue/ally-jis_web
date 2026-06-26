import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Check, X, Plus, Building2, GraduationCap, Shield, Users, LogOut } from 'lucide-react';
import InterestTag from '@/components/ally/InterestTag';
import { CURRENT_USER } from '@/data/mockData';
import { Student } from '@/types/ally';
import { cn } from '@/lib/utils';
import { isApiConfigured } from '@/api/client';
import { profileService } from '@/lib/services/profileService';
import { useAuth } from '@/context/AuthContext';
import { profileSchema, ProfileFormValues } from '@/lib/validations/profile';
import { useLookupOptions } from '@/hooks/useLookupOptions';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Student | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'interests' | 'orgs'>('interests');
  const [showInterestPicker, setShowInterestPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const { organizations, departments, coursesByDept, interestsByCategory, yearLevels } = useLookupOptions();

  const AVATAR_OPTIONS = ['😊','😎','🤓','🤔','😴','🥳','👽','👻','🤖','👾','🦊','🐱','🐶','🐼','🐸','🦉','🦄','Rex','🐙','🐡'];

  const useBackend = Boolean(isApiConfigured && user);

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

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const confirmed = window.confirm('Are you sure you want to delete your account? This cannot be undone.');
    if (!confirmed) return;

    if (useBackend) {
      try {
        await profileService.deleteProfile();
      } catch (deleteError: any) {
        setError(deleteError.message);
        return;
      }
    }

    await signOut();
    navigate('/');
  };

  const toStudent = (row: any): Student => ({
    id: row.id,
    name: row.username ?? row.full_name ?? 'Student',
    username: row.username ?? null,
    email: row.email,
    course: row.course ?? 'Unknown Course',
    yearLevel: row.year_level ?? 'Unknown Year',
    department: row.department ?? 'Unknown Department',
    bio: row.bio ?? '',
    avatar: row.avatar_url ?? CURRENT_USER.avatar,
    interests: row.interests ?? [],
    organizations: row.organizations ?? [],
    isVerified: row.email?.toLowerCase().endsWith('@chmsu.edu.ph') ?? false,
    joinedAt: row.created_at,
  });

  useEffect(() => {
    let isMounted = true;

    if (!useBackend || !user) {
      const current = CURRENT_USER;
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
      });
      return () => { isMounted = false; };
    }

    profileService
      .getMyProfile()
      .then((mapped) => {
        if (!isMounted) return;
        setProfile(mapped);
        reset({
          username: mapped.username || '',
          bio: mapped.bio,
          department: mapped.department,
          course: mapped.course,
          yearLevel: mapped.yearLevel,
          interests: mapped.interests,
          organizations: mapped.organizations,
          avatar: mapped.avatar,
        });
      })
      .catch((fetchError: any) => {
        if (!isMounted) return;
        if (fetchError.status === 404) {
          setError('Profile not found. Please complete your onboarding.');
        } else {
          setError(`Could not load profile: ${fetchError.message}`);
        }
      });

    return () => { isMounted = false; };
  }, [useBackend, user?.id, reset]);

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
    setError(null);

    const normalizedUsername = data.username.toLowerCase();

    // Check username uniqueness if changed
    if (normalizedUsername !== profile?.username?.toLowerCase()) {
      setUsernameStatus('checking');
      try {
        const available = await profileService.checkUsername(normalizedUsername, user.id);
        if (!available) {
          setError('That username is already taken. Please choose another.');
          setUsernameStatus('taken');
          setIsSaving(false);
          return;
        }
        setUsernameStatus('available');
      } catch (usernameError: any) {
        setError(usernameError.message);
        setUsernameStatus('idle');
        setIsSaving(false);
        return;
      }
    }

    try {
      await profileService.updateProfile(user.id, {
        ...data,
        username: normalizedUsername,
      });
    } catch (updateError: any) {
      setError(updateError.message);
      setIsSaving(false);
      return;
    }

    const updated = {
      ...profile!,
      ...data,
      name: normalizedUsername,
      username: normalizedUsername,
    };
    setProfile(updated);
    setIsEditing(false);
    setIsSaving(false);
  };

  const handleCancel = () => {
    if (profile) {
      reset({
        username: profile.username || '',
        bio: profile.bio,
        department: profile.department,
        course: profile.course,
        yearLevel: profile.yearLevel,
        interests: profile.interests,
        organizations: profile.organizations,
        avatar: profile.avatar,
      });
    }
    setIsEditing(false);
    setShowInterestPicker(false);
    setError(null);
  };

  const toggleInterest = (interest: string) => {
    const current = formData.interests || [];
    const next = current.includes(interest)
      ? current.filter(i => i !== interest)
      : [...current, interest];
    setValue('interests', next, { shouldValidate: true });
  };

  const toggleOrg = (org: string) => {
    const current = formData.organizations || [];
    const next = current.includes(org)
      ? current.filter(o => o !== org)
      : [...current, org];
    setValue('organizations', next, { shouldValidate: true });
  };

  const displayProfile = isEditing ? formData : profile;
  if (!displayProfile) return (
    <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#1A6B3C]/20 border-t-[#1A6B3C] rounded-full animate-spin" />
    </div>
  );

  const profileCompletion = Math.min(
    20 +
    (displayProfile.bio ? 20 : 0) +
    (displayProfile.interests.length >= 3 ? 30 : (displayProfile.interests.length / 3) * 30) +
    (displayProfile.organizations.length > 0 ? 15 : 0) +
    (displayProfile.avatar ? 15 : 0),
    100
  );

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-32 md:pb-12">
        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-jakarta text-red-600">
            {error}
          </div>
        )}
        
        <div className="bg-white rounded-3xl overflow-hidden border border-[#1A6B3C]/8 card-shadow mb-5">
          <div className="h-32 bg-gradient-to-r from-[#1A6B3C] via-[#2d8a56] to-[#3B8C7E] relative">
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />
          </div>

          <div className="px-6 pb-6">
            <div className="flex flex-col items-start justify-between gap-4 -mt-12 mb-5 sm:flex-row sm:items-end">
              <div className="relative group flex-shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
                  <span className="text-5xl sm:text-6xl">{displayProfile.avatar || '👤'}</span>
                </div>
              </div>

              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleCancel}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 font-jakarta text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <X size={14} /> Cancel
                    </button>
                    <button
                      onClick={handleSubmit(onSave)}
                      disabled={isSaving}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#1A6B3C] text-white font-jakarta text-sm font-semibold hover:bg-[#155a33] transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <Check size={14} /> {isSaving ? 'Saving...' : 'Save'}
                    </button>
                  </>
                ) : (
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        className="flex w-full sm:w-auto items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl border-2 border-[#1A6B3C]/20 text-[#1A6B3C] font-jakarta text-sm font-semibold hover:border-[#1A6B3C]/40 hover:bg-[#1A6B3C]/5 transition-all shadow-sm"
                      >
                        <Pencil size={14} /> Account actions
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md rounded-3xl">
                      <DialogHeader>
                        <DialogTitle className="font-fraunces text-xl">Account actions</DialogTitle>
                        <DialogDescription className="font-jakarta text-sm">
                          Edit your profile or manage your account safely.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-3 py-4">
                        <button
                          onClick={() => setIsEditing(true)}
                          className="flex items-center justify-between rounded-xl border border-[#1A6B3C]/20 px-4 py-3 text-left font-jakarta text-sm font-semibold text-[#1A6B3C] hover:bg-[#1A6B3C]/5"
                        >
                          Edit profile
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={handleSignOut}
                          className="flex items-center justify-between rounded-xl border border-red-200 px-4 py-3 text-left font-jakarta text-sm font-semibold text-red-600 hover:bg-red-50"
                        >
                          Log out
                          <LogOut size={14} />
                        </button>
                        <button
                          onClick={handleDeleteAccount}
                          className="flex items-center justify-between rounded-xl bg-red-600 px-4 py-3 text-left font-jakarta text-sm font-semibold text-white hover:bg-red-700"
                        >
                          Delete account
                          <X size={14} />
                        </button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-5">
                <div>
                  <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-2">Select Avatar</label>
                  <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                    {AVATAR_OPTIONS.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setValue('avatar', opt, { shouldValidate: true })}
                        className={cn(
                          "w-12 h-12 rounded-xl flex-shrink-0 bg-gray-100 flex items-center justify-center border-2 transition-all text-2xl",
                          formData.avatar === opt ? "border-[#1A6B3C] shadow-md scale-110" : "border-transparent hover:bg-gray-200"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-1">Username (Unique)</label>
                  <input
                    {...register('username')}
                    type="text"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-gray-50 font-jakarta text-sm outline-none"
                  />
                  {errors.username && <p className="mt-1 text-xs font-jakarta text-red-500">{errors.username.message}</p>}
                </div>
                
                <div>
                  <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-1">Bio</label>
                  <div className="relative">
                    <textarea
                      {...register('bio')}
                      maxLength={250}
                      rows={3}
                      placeholder="Tell others about yourself..."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-gray-50 font-jakarta text-sm outline-none resize-none"
                    />
                    <span className="absolute bottom-2 right-3 font-mono-accent text-xs text-gray-400">
                      {formData.bio?.length || 0}/250
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-1">Department</label>
                    <select
                      {...register('department')}
                      onChange={e => {
                        setValue('department', e.target.value);
                        setValue('course', '');
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-gray-50 font-jakarta text-sm outline-none"
                    >
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-1">Course</label>
                    <select
                      {...register('course')}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-gray-50 font-jakarta text-sm outline-none"
                    >
                      <option value="" disabled>Select Course</option>
                      {(coursesByDept[formData.department] || []).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-1">Year Level</label>
                    <select
                      {...register('yearLevel')}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-gray-50 font-jakarta text-sm outline-none"
                    >
                      {yearLevels.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h1 className="font-fraunces text-2xl font-bold text-gray-900">
                    {profile.username ? `@${profile.username}` : profile.name}
                  </h1>
                  {profile.isVerified && (
                    <div className="flex items-center gap-1 bg-[#1A6B3C]/10 text-[#1A6B3C] px-2.5 py-1 rounded-full">
                      <Shield size={12} />
                      <span className="font-jakarta text-xs font-semibold">CHMSU Verified</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 flex-wrap mb-3">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <GraduationCap size={14} />
                    <span className="font-jakarta text-sm">{profile.course} · {profile.yearLevel}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Building2 size={14} />
                    <span className="font-jakarta text-sm">{(profile.department || '').replace('College of ', '')}</span>
                  </div>
                </div>
                {profile.bio ? (
                  <p className="font-jakarta text-sm text-gray-600 leading-relaxed max-w-xl">{profile.bio}</p>
                ) : (
                  <p className="font-jakarta text-sm text-gray-400 italic">No bio yet. Click "Account actions" to edit!</p>
                )}
              </div>
            )}

            {profileCompletion < 100 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-jakarta text-xs text-gray-500 font-medium">Profile completion</span>
                  <span className="font-mono-accent text-xs font-semibold text-[#1A6B3C]">{profileCompletion}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div
                    className="h-2 bg-gradient-to-r from-[#1A6B3C] to-[#3B8C7E] rounded-full transition-all duration-500"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#1A6B3C]/8 card-shadow">
          <div className="flex border-b border-gray-100">
            {(['interests', 'orgs'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex-1 py-4 font-jakarta font-semibold text-sm transition-colors px-2',
                  activeTab === tab
                    ? 'text-[#1A6B3C] border-b-2 border-[#1A6B3C]'
                    : 'text-gray-400 hover:text-gray-600'
                )}
              >
                {tab === 'interests' ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <span className="hidden sm:inline">Interests & Hobbies</span>
                    <span className="sm:hidden">Interests</span>
                    <span className="text-xs opacity-60">({displayProfile.interests.length})</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    <span className="hidden sm:inline">Organizations</span>
                    <span className="sm:hidden">Orgs</span>
                    <span className="text-xs opacity-60">({displayProfile.organizations.length})</span>
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'interests' && (
              <div>
                {displayProfile.interests.length < 3 && (
                  <div className="mb-4 bg-[#E8A838]/10 border border-[#E8A838]/25 rounded-xl px-4 py-3">
                    <p className="font-jakarta text-sm text-[#1A6B3C] font-medium">
                      ⚠️ Add at least <strong>3 interests</strong> to start getting matches.
                      Currently: {displayProfile.interests.length}/3
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  {displayProfile.interests.map(interest => (
                    <div key={interest} className="relative group">
                      <InterestTag label={interest} />
                      {isEditing && (
                        <button
                          onClick={() => toggleInterest(interest)}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs leading-none"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  {isEditing && !showInterestPicker && (
                    <button
                      onClick={() => setShowInterestPicker(true)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-dashed border-[#1A6B3C]/30 text-[#1A6B3C]/60 font-jakarta text-sm hover:border-[#1A6B3C]/60 transition-colors"
                    >
                      <Plus size={14} /> Add
                    </button>
                  )}
                </div>

                {isEditing && showInterestPicker && (
                  <div className="border border-[#1A6B3C]/15 rounded-2xl p-4 bg-[#F7F4EF]">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-jakarta font-semibold text-sm text-[#1A6B3C]">
                        Select interests ({formData.interests.length} selected)
                      </p>
                      <button
                        onClick={() => setShowInterestPicker(false)}
                        className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                      >
                        ×
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
                      {Object.entries(interestsByCategory).map(([category, items]) => (
                        <div key={category}>
                          <p className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide mb-2">{category}</p>
                          <div className="flex flex-wrap gap-2">
                            {items.map(({ label }) => (
                              <InterestTag
                                key={label}
                                label={label}
                                isSelected={formData.interests.includes(label)}
                                onClick={() => toggleInterest(label)}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {errors.interests && <p className="mt-2 text-xs font-jakarta text-red-500">{errors.interests.message}</p>}
              </div>
            )}

            {activeTab === 'orgs' && (
              <div>
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <p className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide mb-3">Your Organizations ({formData.organizations.length})</p>
                      <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
                        {organizations.map(org => {
                          const selected = formData.organizations.includes(org);
                          return (
                            <div key={org} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all group">
                              <Checkbox
                                id={`profile-org-${org}`}
                                checked={selected}
                                onCheckedChange={() => toggleOrg(org)}
                                className="border-gray-300 rounded-[4px] data-[state=checked]:bg-[#1A6B3C] data-[state=checked]:border-[#1A6B3C]"
                              />
                              <label 
                                htmlFor={`profile-org-${org}`}
                                className="flex-1 font-jakarta text-sm text-gray-700 cursor-pointer"
                              >
                                {org}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {displayProfile.organizations.map(org => (
                      <div
                        key={org}
                        className="flex items-center justify-between bg-[#1A6B3C]/5 px-4 py-3 rounded-xl group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#1A6B3C]/10 flex items-center justify-center text-[#1A6B3C]">
                            <Users size={16} />
                          </div>
                          <span className="font-jakarta text-sm text-[#1A6B3C] font-medium">{org}</span>
                        </div>
                      </div>
                    ))}

                    {displayProfile.organizations.length === 0 && (
                      <p className="font-jakarta text-sm text-gray-400 text-center py-4">No organizations yet.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
