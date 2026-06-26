import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, ArrowLeft, Check, User, GraduationCap, Sparkles, FileText, Plus, X } from 'lucide-react';
import InterestTag from '@/components/ally/InterestTag';
import { onboardingSchema, OnboardingFormValues } from '@/lib/validations/onboarding';
import { cn } from '@/lib/utils';
import { apiClient, isApiConfigured } from '@/api/client';
import { profileService } from '@/lib/services/profileService';
import { useLookupOptions } from '@/hooks/useLookupOptions';
import { Checkbox } from '@/components/ui/checkbox';

const AVATAR_OPTIONS = ['😊','😎','🤓','🤔','😴','🥳','👽','👻','🤖','👾','🦊','🐱','🐶','🐼','🐸','🦉','🦄','🦖','🐙','🐡'];

// Placeholder copy — replace with the real Terms & Conditions / Privacy Policy text.
const TERMS_TEXT = `Welcome to Ally-jis! These are placeholder Terms & Conditions.

By using this platform, you agree to use Ally-jis respectfully and only for its intended purpose of connecting with fellow CHMSU Alijis Campus students.

This is sample text. Replace this with your actual Terms & Conditions before launch.`;

const PRIVACY_TEXT = `This is a placeholder Privacy Policy for Ally-jis.

We collect basic profile information (username, email, course, interests) to help you connect with other students on campus.

This is sample text. Replace this with your actual Privacy Policy before launch.`;

const steps = [
  { num: 1, label: 'Basic Info', icon: User, hint: 'Your identity on the platform' },
  { num: 2, label: 'Academic', icon: GraduationCap, hint: 'Your course & year at CHMSU' },
  { num: 3, label: 'Interests', icon: Sparkles, hint: 'Powers your matches!' },
  { num: 4, label: 'Avatar & Bio', icon: FileText, hint: 'Pick your emoji avatar & intro' },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [customInterest, setCustomInterest] = useState('');
  const [showCustomInterestInput, setShowCustomInterestInput] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsError, setTermsError] = useState('');
  const [activeModal, setActiveModal] = useState<'terms' | 'privacy' | null>(null);
  const { organizations, departments, coursesByDept, interestsByCategory, yearLevels } = useLookupOptions();

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
      bio: '',
      avatar: '😊',
    },
    mode: 'onChange',
  });

  const formData = watch();
  const progress = ((step - 1) / 3) * 100;

  // Interests the user typed in manually via the "Others" tag, kept separate
  // from the predefined lookup categories so we know which tags to render
  // as removable "custom" chips in the selected list.
  const knownInterestLabels = Object.values(interestsByCategory)
    .flat()
    .map(item => item.label);
  const customInterests = formData.interests.filter(i => !knownInterestLabels.includes(i));

  const handleNext = async () => {
    let fieldsToValidate: any[] = [];
    if (step === 1) fieldsToValidate = ['basicInfo.username', 'basicInfo.email', 'basicInfo.password'];
    if (step === 2) fieldsToValidate = ['academicDetails.department', 'academicDetails.course', 'academicDetails.yearLevel'];
    if (step === 3) fieldsToValidate = ['interests'];

    const isValid = await trigger(fieldsToValidate);
    if (!isValid) return;

    if (step === 1 && isApiConfigured) {
      setIsCheckingUsername(true);
      try {
        const available = await profileService.checkUsername(formData.basicInfo.username.toLowerCase());
        if (!available) {
          setSubmitError('Username already taken. Please choose another.');
          return;
        }
      } catch (err: any) {
        setSubmitError(err.message);
        return;
      } finally {
        setIsCheckingUsername(false);
      }
    }

    if (step === 4) {
      if (!agreedToTerms) {
        setTermsError('You must agree to the Terms & Conditions to continue.');
        return;
      }
      handleSubmit(onComplete)();
      return;
    }

    setStep(step + 1);
    setSubmitError('');
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setSubmitError('');
    } else {
      navigate('/');
    }
  };

  const onComplete = async (data: OnboardingFormValues) => {
    if (!isApiConfigured) {
      setSubmitError('API is not configured. Add VITE_API_BASE_URL to your .env file.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');

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
      });

      if (!session.accessToken) {
        setSubmitError('Check your email to confirm your account, then sign in.');
        setIsSubmitting(false);
        navigate('/login');
        return;
      }
    } catch (err: any) {
      setSubmitError(err.message);
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
            {submitError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm font-jakarta px-4 py-3 rounded-xl">
                {submitError}
              </div>
            )}

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
              <div className="space-y-5">
                <div className="bg-white rounded-2xl p-5 border border-[#1A6B3C]/6 card-shadow mb-6">
                  <label className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide block mb-2">Select Avatar</label>
                  <div className="overflow-x-auto pb-2 -mx-2 px-2 flex gap-2 snap-x">
                    {AVATAR_OPTIONS.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setValue('avatar', opt, { shouldValidate: true })}
                        className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 snap-center transition-all',
                          formData.avatar === opt
                            ? 'bg-[#1A6B3C]/10 border-2 border-[#1A6B3C] scale-110 shadow-sm'
                            : 'bg-gray-50 border border-gray-200 hover:bg-gray-100 opacity-60 hover:opacity-100'
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
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
              disabled={isSubmitting || isCheckingUsername || (step === 4 && !agreedToTerms)}
              className={cn(
                'flex items-center gap-2 font-jakarta font-semibold text-sm px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-[0.98]',
                step === 4 && !agreedToTerms
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                  : 'bg-[#1A6B3C] text-white hover:bg-[#155a33]'
              )}
            >
              {isSubmitting || isCheckingUsername ? 'Processing...' : step === 4 ? 'Complete Profile' : 'Continue'}
              {step === 4 ? <Check size={16} /> : <ArrowRight size={16} />}
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