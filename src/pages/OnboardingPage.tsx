import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, ArrowLeft, Check, User, GraduationCap, Sparkles, FileText, Plus, X, HeartHandshake, Film, Music, Compass, Upload, Camera, Loader2 } from 'lucide-react';
import InterestTag from '@/components/ally/InterestTag';
import { onboardingSchema, OnboardingFormValues } from '@/lib/validations/onboarding';
import { cn } from '@/lib/utils';
import { apiClient, isApiConfigured } from '@/api/client';
import { profileService } from '@/lib/services/profileService';
import { useLookupOptions } from '@/hooks/useLookupOptions';
import { Checkbox } from '@/components/ui/checkbox';
import { notify } from '@/components/ui/sonner';
import type { PresetAvatarRow } from '@/api/types';


const ZODIAC_SIGNS = [
  'Aries ♈', 'Taurus ♉', 'Gemini ♊', 'Cancer ♋',
  'Leo ♌', 'Virgo ♍', 'Libra ♎', 'Scorpio ♏',
  'Sagittarius ♐', 'Capricorn ♑', 'Aquarius ♒', 'Pisces ♓'
];

const MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP'
];

const MUSIC_GENRES = ['OPM', 'Pop', 'Indie', 'K-Pop', 'Rock', 'R&B', 'Hip-Hop', 'Classical', 'Jazz', 'EDM'];

const MOVIE_GENRES = ['Anime', 'Rom-Com', 'Sci-Fi', 'Horror', 'Action', 'Drama', 'Thriller', 'K-Drama', 'Documentaries'];

const TERMS_TEXT = `Welcome to Ally-jis! These are placeholder Terms & Conditions.

By using this platform, you agree to use Ally-jis respectfully and only for its intended purpose of connecting with fellow CHMSU Alijis Campus students.

This is sample text. Replace this with your actual Terms & Conditions before launch.`;

const PRIVACY_TEXT = `This is a placeholder Privacy Policy for Ally-jis.

We collect basic profile information (username, email, course, interests, matchmaking preferences) to help you connect with other students on campus.

This is sample text. Replace this with your actual Privacy Policy before launch.`;

const steps = [
  { num: 1, label: 'Basic Info', icon: User, hint: 'Your identity on the platform' },
  { num: 2, label: 'Academic', icon: GraduationCap, hint: 'Your course & year at CHMSU' },
  { num: 3, label: 'Interests', icon: Sparkles, hint: 'Powers your matches!' },
  { num: 4, label: 'Match Vibe', icon: HeartHandshake, hint: 'Matchmaking metadata & preferences' },
  { num: 5, label: 'Avatar & Bio', icon: FileText, hint: 'Pick your emoji avatar & intro' },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [customInterest, setCustomInterest] = useState('');
  const [showCustomInterestInput, setShowCustomInterestInput] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsError, setTermsError] = useState('');
  const [activeModal, setActiveModal] = useState<'terms' | 'privacy' | null>(null);
  const [presetAvatars, setPresetAvatars] = useState<PresetAvatarRow[]>([]);
  const [avatarTab, setAvatarTab] = useState<'presets' | 'upload'>('presets');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string | null>(null);
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const { organizations, departments, coursesByDept, interestsByCategory, yearLevels } = useLookupOptions();

  // Load preset avatars from backend (set by admin)
  useEffect(() => {
    if (!isApiConfigured) return;
    apiClient.getPresetAvatars()
      .then((res) => setPresetAvatars(res.avatars))
      .catch(() => {}); // Fail silently — user can still upload their own
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      basicInfo: { username: '', email: '', password: '' },
      academicDetails: { course: '', yearLevel: '', department: '' },
      interests: [],
      organizations: [],
      matchDetails: {
        match_gender_preference: 'any',
        age_range: '18-20',
        zodiac_sign: 'Leo ♌',
        personality_type: 'ENFP',
        music_taste: ['OPM', 'Pop'],
        movie_interests: ['Anime', 'Rom-Com'],
      },
      bio: '',
      avatar: '',
    },
    mode: 'onChange',
  });

  const formData = watch();
  const progress = ((step - 1) / 4) * 100;

  const knownInterestLabels = Object.values(interestsByCategory)
    .flat()
    .map(item => item.label);
  const customInterests = formData.interests.filter(i => !knownInterestLabels.includes(i));

  const handleNext = async () => {
    let fieldsToValidate: any[] = [];
    if (step === 1) fieldsToValidate = ['basicInfo.username', 'basicInfo.email', 'basicInfo.password'];
    if (step === 2) fieldsToValidate = ['academicDetails.department', 'academicDetails.course', 'academicDetails.yearLevel'];
    if (step === 3) fieldsToValidate = ['interests'];
    if (step === 4) fieldsToValidate = ['matchDetails.match_gender_preference', 'matchDetails.age_range'];

    const isValid = await trigger(fieldsToValidate);
    if (!isValid) return;

    if (step === 1 && isApiConfigured) {
      setIsCheckingUsername(true);
      try {
        const available = await profileService.checkUsername(formData.basicInfo.username.toLowerCase());
        if (!available) {
          notify.error('Username taken', 'That username is already taken. Please choose another.');
          return;
        }
      } catch (err: any) {
        notify.error('Username check failed', err.message);
        return;
      } finally {
        setIsCheckingUsername(false);
      }
    }

    if (step === 5) {
      if (!agreedToTerms) {
        setTermsError('You must agree to the Terms & Conditions to continue.');
        return;
      }
      handleSubmit(onComplete)();
      return;
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/');
    }
  };

  const onComplete = async (data: OnboardingFormValues) => {
    if (!isApiConfigured) {
      notify.warning('API not configured', 'API is not configured.');
      return;
    }
    setIsSubmitting(true);

    const normalizedUsername = data.basicInfo.username.toLowerCase();

    try {
      const session = await apiClient.register({
        email: data.basicInfo.email,
        password: data.basicInfo.password,
        username: normalizedUsername,
        bio: data.bio || null,
        department: data.academicDetails.department || null,
        course: data.academicDetails.course || null,
        year_level: data.academicDetails.yearLevel || null,
        interests: data.interests,
        organizations: data.organizations,
        avatar_url: data.avatar || null,
        zodiac_sign: data.matchDetails.zodiac_sign || null,
        personality_type: data.matchDetails.personality_type || null,
        music_taste: data.matchDetails.music_taste || [],
        movie_interests: data.matchDetails.movie_interests || [],
        age_range: data.matchDetails.age_range || null,
        match_gender_preference: data.matchDetails.match_gender_preference || null,
      });

      if (!session.accessToken) {
        setIsSubmitting(false);
        navigate('/confirmation-page?pending=true');
        return;
      }
    } catch (err: any) {
      notify.error('Registration failed', err.message);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    setIsCompleting(true);
    setTimeout(() => {
      navigate('/dashboard');
    }, 1200);
  };

  const toggleInterest = (interest: string) => {
    const currentInterests = formData.interests;
    const nextInterests = currentInterests.includes(interest)
      ? currentInterests.filter(i => i !== interest)
      : [...currentInterests, interest];
    setValue('interests', nextInterests, { shouldValidate: true });
  };

  const addCustomInterest = () => {
    const trimmed = customInterest.trim();
    if (!trimmed) return;
    if (formData.interests.some(i => i.toLowerCase() === trimmed.toLowerCase())) {
      setCustomInterest('');
      return;
    }
    setValue('interests', [...formData.interests, trimmed], { shouldValidate: true });
    setCustomInterest('');
  };

  const removeCustomInterest = (interest: string) => {
    setValue('interests', formData.interests.filter(i => i !== interest), { shouldValidate: true });
  };

  const toggleOrganization = (org: string) => {
    const currentOrgs = formData.organizations;
    const nextOrgs = currentOrgs.includes(org)
      ? currentOrgs.filter(o => o !== org)
      : [...currentOrgs, org];
    setValue('organizations', nextOrgs, { shouldValidate: true });
  };

  const availableCourses = formData.academicDetails.department
    ? (coursesByDept[formData.academicDetails.department] || [])
    : [];

  if (isCompleting) {
    return (
      <div className="min-h-[100dvh] bg-[#F7F4EF] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-[#1A6B3C] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl animate-bounce">
            <Check size={36} className="text-white" />
          </div>
          <h2 className="font-fraunces text-3xl font-bold text-[#1A6B3C] mb-2">Profile Created!</h2>
          <p className="font-jakarta text-[#1A6B3C]/60">Redirecting you to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#F7F4EF] flex flex-col">
      <div className="text-center pt-8 pb-4">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-[#1A6B3C] flex items-center justify-center">
            <span className="text-white font-fraunces font-bold text-base">A</span>
          </div>
          <span className="font-fraunces font-semibold text-xl text-[#1A6B3C]">
            lly<span className="text-[#E8A838]">-jis</span>
          </span>        </div>
        <p className="font-jakarta text-sm text-[#1A6B3C]/50">CHMSU Alijis Campus</p>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          {steps.map(({ num, label, icon: Icon }, i) => (
            <div key={num} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm',
                  step > num ? 'bg-[#1A6B3C]' :
                    step === num ? 'bg-[#1A6B3C] ring-4 ring-[#1A6B3C]/20' :
                      'bg-white border-2 border-gray-200'
                )}>
                  {step > num
                    ? <Check size={16} className="text-white" />
                    : <Icon size={16} className={step >= num ? 'text-white' : 'text-gray-400'} />
                  }
                </div>
                <span className={cn(
                  'font-jakarta text-xs mt-1 font-medium hidden sm:block',
                  step === num ? 'text-[#1A6B3C]' : 'text-gray-400'
                )}>{label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 mx-2 sm:mx-4 transition-all duration-500',
                  step > num ? 'bg-[#1A6B3C]' : 'bg-gray-200'
                )} style={{ width: '40px' }} />
              )}
            </div>
          ))}
        </div>

        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1A6B3C] rounded-full transition-all duration-500"
            style={{ width: `${progress + 25}%` }}
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 pb-16 flex-1">
        <div className="bg-white rounded-3xl shadow-xl border border-[#1A6B3C]/8 overflow-hidden">
          <div className="bg-gradient-to-r from-[#1A6B3C] to-[#2d8a56] px-8 py-6 text-white">
            <div className="flex items-center gap-2 text-white/60 text-sm font-jakarta mb-1">
              <span>Step {step} of 4</span>
              <span>·</span>
              <span>{steps[step - 1]?.hint}</span>
            </div>
            <h2 className="font-fraunces text-2xl font-bold">{steps[step - 1]?.label}</h2>
          </div>

          <div className="px-8 py-6">
            {/* no inline error banner — errors shown as toasts */}

            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="font-jakarta font-semibold text-sm text-gray-700 block mb-1.5">
                    Username <span className="text-red-400">*</span>
                  </label>
                  <input
                    {...register('basicInfo.username')}
                    type="text"
                    placeholder="e.g. mariasantos_99"
                    className={cn(
                      'w-full px-4 py-3 rounded-xl border font-jakarta text-sm outline-none transition-colors',
                      errors.basicInfo?.username ? 'border-red-300 focus:border-red-400 bg-red-50' : 'border-gray-200 focus:border-[#1A6B3C] bg-gray-50 focus:bg-white'
                    )}
                  />
                  {errors.basicInfo?.username && <p className="text-red-500 text-xs mt-1 font-jakarta">{errors.basicInfo.username.message}</p>}
                </div>
                <div>
                  <label className="font-jakarta font-semibold text-sm text-gray-700 block mb-1.5">
                    CHMSU Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    {...register('basicInfo.email')}
                    type="email"
                    placeholder="e.g. maria@chmsu.edu.ph"
                    className={cn(
                      'w-full px-4 py-3 rounded-xl border font-jakarta text-sm outline-none transition-colors',
                      errors.basicInfo?.email ? 'border-red-300 focus:border-red-400 bg-red-50' : 'border-gray-200 focus:border-[#1A6B3C] bg-gray-50 focus:bg-white'
                    )}
                  />
                  {errors.basicInfo?.email && <p className="text-red-500 text-xs mt-1 font-jakarta">{errors.basicInfo.email.message}</p>}
                </div>
                <div>
                  <label className="font-jakarta font-semibold text-sm text-gray-700 block mb-1.5">
                    Password <span className="text-red-400">*</span>
                  </label>
                  <input
                    {...register('basicInfo.password')}
                    type="password"
                    placeholder="At least 6 characters"
                    className={cn(
                      'w-full px-4 py-3 rounded-xl border font-jakarta text-sm outline-none transition-colors',
                      errors.basicInfo?.password ? 'border-red-300 focus:border-red-400 bg-red-50' : 'border-gray-200 focus:border-[#1A6B3C] bg-gray-50 focus:bg-white'
                    )}
                  />
                  {errors.basicInfo?.password && <p className="text-red-500 text-xs mt-1 font-jakarta">{errors.basicInfo.password.message}</p>}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <label className="font-jakarta font-semibold text-sm text-gray-700 block mb-1.5">
                    Department <span className="text-red-400">*</span>
                  </label>
                  <select
                    {...register('academicDetails.department')}
                    onChange={e => {
                      setValue('academicDetails.department', e.target.value);
                      setValue('academicDetails.course', '');
                    }}
                    className={cn(
                      'w-full px-4 py-3 rounded-xl border font-jakarta text-sm outline-none transition-colors bg-gray-50',
                      errors.academicDetails?.department ? 'border-red-300' : 'border-gray-200 focus:border-[#1A6B3C]'
                    )}
                  >
                    <option value="">Select department...</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {errors.academicDetails?.department && <p className="text-red-500 text-xs mt-1 font-jakarta">{errors.academicDetails.department.message}</p>}
                </div>
                <div>
                  <label className="font-jakarta font-semibold text-sm text-gray-700 block mb-1.5">
                    Course / Program <span className="text-red-400">*</span>
                  </label>
                  <select
                    {...register('academicDetails.course')}
                    disabled={!formData.academicDetails.department}
                    className={cn(
                      'w-full px-4 py-3 rounded-xl border font-jakarta text-sm outline-none transition-colors bg-gray-50',
                      errors.academicDetails?.course ? 'border-red-300' : 'border-gray-200 focus:border-[#1A6B3C]',
                      !formData.academicDetails.department && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <option value="">Select course...</option>
                    {availableCourses.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.academicDetails?.course && <p className="text-red-500 text-xs mt-1 font-jakarta">{errors.academicDetails.course.message}</p>}
                </div>
                <div>
                  <label className="font-jakarta font-semibold text-sm text-gray-700 block mb-1.5">
                    Year Level <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {yearLevels.map(y => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => {
                          setValue('academicDetails.yearLevel', y, { shouldValidate: true });
                        }}
                        className={cn(
                          'py-2 rounded-xl border font-jakarta text-xs font-medium transition-all',
                          formData.academicDetails.yearLevel === y
                            ? 'bg-[#1A6B3C] text-white border-[#1A6B3C] shadow-sm'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#1A6B3C]/40'
                        )}
                      >
                        {y.replace(' Year', '')}
                      </button>
                    ))}
                  </div>
                  {errors.academicDetails?.yearLevel && <p className="text-red-500 text-xs mt-1 font-jakarta">{errors.academicDetails.yearLevel.message}</p>}
                </div>

                <div>
                  <label className="font-jakarta font-semibold text-sm text-gray-700 block mb-2">
                    Student Organizations <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {organizations.map(org => {
                      const selected = formData.organizations.includes(org);
                      return (
                        <label
                          key={org}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer group",
                            selected
                              ? "bg-[#1A6B3C]/5 border-[#1A6B3C]/20 shadow-sm"
                              : "bg-gray-50/50 border-gray-100 hover:border-[#1A6B3C]/10 hover:bg-gray-50"
                          )}
                        >
                          <Checkbox
                            id={`org-${org}`}
                            checked={selected}
                            onCheckedChange={() => toggleOrganization(org)}
                            className="border-gray-300 rounded-[4px] data-[state=checked]:bg-[#1A6B3C] data-[state=checked]:border-[#1A6B3C]"
                          />
                          <span className={cn(
                            "flex-1 font-jakarta text-sm transition-colors",
                            selected ? "text-[#1A6B3C] font-semibold" : "text-gray-600"
                          )}>
                            {org}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col h-[50dvh] sm:h-[400px]">
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <div>
                    <p className="font-jakarta text-sm text-gray-500">
                      Your interests power your matches! Select at least 3.
                    </p>
                  </div>
                  <div className={cn(
                    'font-mono-accent text-sm font-semibold px-3 py-1 rounded-full transition-colors',
                    formData.interests.length >= 3
                      ? 'bg-[#1A6B3C]/10 text-[#1A6B3C]'
                      : 'bg-[#E8A838]/15 text-[#E8A838]'
                  )}>
                    {formData.interests.length} selected
                  </div>
                </div>

                {errors.interests && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm font-jakarta px-4 py-2.5 rounded-xl flex-shrink-0">
                    ⚠️ {errors.interests.message}
                  </div>
                )}

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                  {Object.entries(interestsByCategory).map(([category, items]) => (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-gray-100"></div>
                        <p className="font-jakarta font-bold text-[10px] text-gray-400 uppercase tracking-[0.2em]">{category}</p>
                        <div className="h-px flex-1 bg-gray-100"></div>
                      </div>
                      <div className="flex flex-wrap gap-2.5">
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

                  {/* "Others" — lets the user add freeform interests not covered above */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-gray-100"></div>
                      <p className="font-jakarta font-bold text-[10px] text-gray-400 uppercase tracking-[0.2em]">Others</p>
                      <div className="h-px flex-1 bg-gray-100"></div>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {customInterests.map(interest => (
                        <span
                          key={interest}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1A6B3C]/10 text-[#1A6B3C] border border-[#1A6B3C]/20 font-jakarta text-sm font-medium"
                        >
                          {interest}
                          <button
                            type="button"
                            onClick={() => removeCustomInterest(interest)}
                            className="hover:bg-[#1A6B3C]/20 rounded-full p-0.5 transition-colors"
                            aria-label={`Remove ${interest}`}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}

                      {!showCustomInterestInput && (
                        <button
                          type="button"
                          onClick={() => setShowCustomInterestInput(true)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-dashed border-gray-300 text-gray-500 hover:border-[#1A6B3C]/40 hover:text-[#1A6B3C] font-jakarta text-sm font-medium transition-colors"
                        >
                          <Plus size={14} />
                          Add your own
                        </button>
                      )}
                    </div>

                    {showCustomInterestInput && (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          autoFocus
                          value={customInterest}
                          onChange={e => setCustomInterest(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addCustomInterest();
                            }
                            if (e.key === 'Escape') {
                              setShowCustomInterestInput(false);
                              setCustomInterest('');
                            }
                          }}
                          placeholder="Type an interest, e.g. K-pop"
                          maxLength={30}
                          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-gray-50 focus:bg-white font-jakarta text-sm outline-none transition-colors"
                        />
                        <button
                          type="button"
                          onClick={addCustomInterest}
                          className="px-4 py-2.5 rounded-xl bg-[#1A6B3C] text-white font-jakarta text-sm font-semibold hover:bg-[#155a33] transition-colors"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomInterestInput(false);
                            setCustomInterest('');
                          }}
                          className="px-3 py-2.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                          aria-label="Cancel"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-fraunces text-lg text-gray-900 mb-1">Matchmaking & Vibe Details</h3>
                  <p className="font-jakarta text-xs text-gray-500">
                    These optional & preference details help the Ally-jis matchmaking algorithm connect you with compatible student partners!
                  </p>
                </div>

                {/* Match Gender Preference */}
                <div className="space-y-2">
                  <label className="font-jakarta font-semibold text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Compass size={14} className="text-[#1A6B3C]" />
                    Who would you like to match with?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'any', label: 'Everyone / Any' },
                      { id: 'male', label: 'Guys' },
                      { id: 'female', label: 'Girls' },
                      { id: 'non-binary', label: 'Non-binary' },
                    ].map(pref => (
                      <button
                        key={pref.id}
                        type="button"
                        onClick={() => setValue('matchDetails.match_gender_preference', pref.id, { shouldValidate: true })}
                        className={cn(
                          'px-4 py-2.5 rounded-xl border text-xs font-jakarta font-semibold transition-all text-left flex items-center justify-between',
                          formData.matchDetails?.match_gender_preference === pref.id
                            ? 'bg-[#1A6B3C]/10 border-[#1A6B3C] text-[#1A6B3C] shadow-sm'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        )}
                      >
                        {pref.label}
                        {formData.matchDetails?.match_gender_preference === pref.id && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age Range & Zodiac Sign */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-jakarta font-semibold text-xs text-gray-500 uppercase tracking-wide block mb-1.5">
                      Age Range
                    </label>
                    <select
                      {...register('matchDetails.age_range')}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-gray-50 focus:bg-white font-jakarta text-xs font-medium outline-none transition-colors"
                    >
                      <option value="18-20">18 – 20 years old</option>
                      <option value="21-23">21 – 23 years old</option>
                      <option value="24-26">24 – 26 years old</option>
                      <option value="27+">27+ years old</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-jakarta font-semibold text-xs text-gray-500 uppercase tracking-wide block mb-1.5">
                      Zodiac Sign
                    </label>
                    <select
                      {...register('matchDetails.zodiac_sign')}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-gray-50 focus:bg-white font-jakarta text-xs font-medium outline-none transition-colors"
                    >
                      {ZODIAC_SIGNS.map(z => (
                        <option key={z} value={z}>{z}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Personality Type (MBTI) */}
                <div>
                  <label className="font-jakarta font-semibold text-xs text-gray-500 uppercase tracking-wide block mb-2">
                    Personality Type (MBTI)
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                    {MBTI_TYPES.map(mbti => (
                      <button
                        key={mbti}
                        type="button"
                        onClick={() => setValue('matchDetails.personality_type', mbti, { shouldValidate: true })}
                        className={cn(
                          'py-2 px-1 text-center rounded-lg border text-[11px] font-mono-accent font-bold transition-all',
                          formData.matchDetails?.personality_type === mbti
                            ? 'bg-[#1A6B3C] border-[#1A6B3C] text-white shadow-sm'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        )}
                      >
                        {mbti}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Music Taste */}
                <div>
                  <label className="font-jakarta font-semibold text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                    <Music size={14} className="text-[#1A6B3C]" />
                    Music Taste
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {MUSIC_GENRES.map(genre => {
                      const isSelected = formData.matchDetails?.music_taste?.includes(genre);
                      return (
                        <button
                          key={genre}
                          type="button"
                          onClick={() => {
                            const current = formData.matchDetails?.music_taste || [];
                            const next = isSelected ? current.filter(g => g !== genre) : [...current, genre];
                            setValue('matchDetails.music_taste', next, { shouldValidate: true });
                          }}
                          className={cn(
                            'px-3 py-1.5 rounded-full text-xs font-jakarta font-medium transition-all border',
                            isSelected
                              ? 'bg-[#1A6B3C]/10 border-[#1A6B3C] text-[#1A6B3C] font-semibold'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                          )}
                        >
                          {isSelected ? `✓ ${genre}` : `+ ${genre}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Movie & Media Taste */}
                <div>
                  <label className="font-jakarta font-semibold text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                    <Film size={14} className="text-[#1A6B3C]" />
                    Movie & Show Favorites
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {MOVIE_GENRES.map(movie => {
                      const isSelected = formData.matchDetails?.movie_interests?.includes(movie);
                      return (
                        <button
                          key={movie}
                          type="button"
                          onClick={() => {
                            const current = formData.matchDetails?.movie_interests || [];
                            const next = isSelected ? current.filter(m => m !== movie) : [...current, movie];
                            setValue('matchDetails.movie_interests', next, { shouldValidate: true });
                          }}
                          className={cn(
                            'px-3 py-1.5 rounded-full text-xs font-jakarta font-medium transition-all border',
                            isSelected
                              ? 'bg-[#1A6B3C]/10 border-[#1A6B3C] text-[#1A6B3C] font-semibold'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                          )}
                        >
                          {isSelected ? `✓ ${movie}` : `+ ${movie}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl p-5 border border-[#1A6B3C]/6 card-shadow mb-6">
                  <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-3">Profile Photo</label>

                  {/* Tab selector */}
                  <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
                    <button
                      type="button"
                      onClick={() => setAvatarTab('presets')}
                      className={cn(
                        'flex-1 py-1.5 rounded-lg text-xs font-jakarta font-semibold transition-all',
                        avatarTab === 'presets'
                          ? 'bg-white text-[#1A6B3C] shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      )}
                    >
                      Choose Preset
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvatarTab('upload')}
                      className={cn(
                        'flex-1 py-1.5 rounded-lg text-xs font-jakarta font-semibold transition-all',
                        avatarTab === 'upload'
                          ? 'bg-white text-[#1A6B3C] shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      )}
                    >
                      Upload Photo
                    </button>
                  </div>

                  {avatarTab === 'presets' && (
                    presetAvatars.length === 0 ? (
                      <div className="py-6 text-center">
                        <p className="font-jakarta text-sm text-gray-400">No preset avatars available yet. Upload your own photo!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-5 gap-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
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
                                ? 'border-[#1A6B3C] scale-105 shadow-md'
                                : 'border-transparent hover:border-[#1A6B3C]/40'
                            )}
                            title={preset.label ?? undefined}
                          >
                            <img src={preset.url} alt={preset.label ?? 'Preset avatar'} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )
                  )}

                  {avatarTab === 'upload' && (
                    <div className="space-y-3">
                      {/* Preview */}
                      {customAvatarPreview ? (
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#1A6B3C] shadow-md flex-shrink-0">
                            <img src={customAvatarPreview} alt="Your avatar" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1">
                            <p className="font-jakarta text-sm font-semibold text-[#1A6B3C] mb-1">Looking great!</p>
                            <button
                              type="button"
                              onClick={() => {
                                setCustomAvatarPreview(null);
                                setValue('avatar', '', { shouldValidate: true });
                                if (avatarFileRef.current) avatarFileRef.current.value = '';
                              }}
                              className="font-jakarta text-xs text-red-500 hover:text-red-700 transition-colors"
                            >
                              Remove photo
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => !avatarUploading && avatarFileRef.current?.click()}
                          className={cn(
                            'border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center cursor-pointer transition-all',
                            'hover:border-[#1A6B3C]/40 hover:bg-[#1A6B3C]/3',
                            avatarUploading && 'pointer-events-none opacity-60',
                          )}
                        >
                          {avatarUploading ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 size={24} className="text-[#1A6B3C] animate-spin" />
                              <p className="font-jakarta text-xs text-gray-500">Uploading…</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <Camera size={24} className="text-gray-300" />
                              <p className="font-jakarta text-sm font-semibold text-gray-700">Tap to upload a photo</p>
                              <p className="font-jakarta text-xs text-gray-400">JPEG, PNG, WebP · Max 10 MB</p>
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
                          // Local preview immediately
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
                  {errors.avatar && <p className="text-red-500 text-xs mt-1 font-jakarta">{errors.avatar.message}</p>}
                </div>

                <div>
                  <label className="font-jakarta font-semibold text-sm text-gray-700 block mb-1.5">
                    Bio <span className="text-gray-400 font-normal">(optional but recommended!)</span>
                  </label>
                  <div className="relative">
                    <textarea
                      {...register('bio')}
                      placeholder="Tell your future friends a bit about yourself! What are you passionate about? What are you looking for in a friend?"
                      maxLength={250}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-gray-50 focus:bg-white font-jakarta text-sm outline-none transition-colors resize-none"
                    />
                    <span className="absolute bottom-3 right-3 font-mono-accent text-xs text-gray-400">
                      {formData.bio?.length || 0}/250
                    </span>
                  </div>
                  {errors.bio && <p className="text-red-500 text-xs mt-1 font-jakarta">{errors.bio.message}</p>}
                </div>

                <div className="bg-[#F7F4EF] rounded-2xl p-4">
                  <p className="font-jakarta font-semibold text-sm text-[#1A6B3C] mb-2">Your profile preview</p>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1A6B3C]/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      <span className="text-2xl">{formData.avatar || '👤'}</span>
                    </div>
                    <div>
                      <p className="font-jakarta font-semibold text-sm text-gray-900">{formData.basicInfo.username || 'Your Username'}</p>
                      <p className="font-jakarta text-xs text-gray-500">{formData.academicDetails.course || 'Your Course'} · {formData.academicDetails.yearLevel || 'Year Level'}</p>
                      {formData.bio && <p className="font-jakarta text-xs text-gray-600 mt-1 line-clamp-2">{formData.bio}</p>}
                    </div>
                  </div>
                </div>

                {/* Terms & Conditions — required to complete the profile */}
                <div className={cn(
                  'rounded-2xl p-4 border transition-colors',
                  termsError ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
                )}>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms-agreement"
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setActiveModal('terms');
                        } else {
                          setAgreedToTerms(false);
                        }
                      }}
                      className="mt-0.5 border-gray-300 rounded-[4px] data-[state=checked]:bg-[#1A6B3C] data-[state=checked]:border-[#1A6B3C]"
                    />
                    <span className="font-jakarta text-sm text-gray-600">
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={() => setActiveModal('terms')}
                        className="text-[#1A6B3C] font-semibold underline hover:text-[#155a33]"
                      >
                        Terms & Conditions
                      </button>
                      {' '}and{' '}
                      <button
                        type="button"
                        onClick={() => setActiveModal('privacy')}
                        className="text-[#1A6B3C] font-semibold underline hover:text-[#155a33]"
                      >
                        Privacy Policy
                      </button>
                      .
                    </span>
                  </div>
                  {termsError && <p className="text-red-500 text-xs mt-2 font-jakarta">{termsError}</p>}
                </div>
              </div>
            )}
          </div>

          <div className="px-8 pb-8 flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={isSubmitting || isCheckingUsername}
              className="flex items-center gap-2 font-jakarta font-medium text-sm px-5 py-2.5 rounded-xl transition-all text-gray-600 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={isSubmitting || isCheckingUsername || (step === 5 && !agreedToTerms)}
              className={cn(
                'flex items-center gap-2 font-jakarta font-semibold text-sm px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-[0.98]',
                step === 5 && !agreedToTerms
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                  : 'bg-[#1A6B3C] text-white hover:bg-[#155a33]'
              )}
            >
              {isSubmitting || isCheckingUsername ? 'Processing...' : step === 5 ? 'Complete Profile' : 'Continue'}
              {step === 5 ? <Check size={16} /> : <ArrowRight size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Terms & Conditions / Privacy Policy modal */}
      {activeModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-xl max-w-lg w-full max-h-[80dvh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#1A6B3C] to-[#2d8a56] px-6 py-5 text-white flex items-center justify-between flex-shrink-0">
              <h3 className="font-fraunces text-xl font-bold">
                {activeModal === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-white/70 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 overflow-y-auto custom-scrollbar flex-1">
              <p className="font-jakarta text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                {activeModal === 'terms' ? TERMS_TEXT : PRIVACY_TEXT}
              </p>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (activeModal === 'terms') {
                    setAgreedToTerms(true);
                    setTermsError('');
                  }
                  setActiveModal(null);
                }}
                className="w-full bg-[#1A6B3C] text-white font-jakarta font-semibold text-sm py-3 rounded-xl hover:bg-[#155a33] transition-all shadow-md active:scale-[0.98]"
              >
                I Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}