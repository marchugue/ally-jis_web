import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, ArrowLeft, Check, User, GraduationCap, Sparkles, FileText, Plus, X, HeartHandshake, Film, Music, Compass, Upload, Camera, Loader2, GraduationCap as GradIcon, Globe, BadgeCheck, Mail, AlertCircle } from 'lucide-react';
import InterestTag from '@/components/ally/InterestTag';
import { onboardingSchema, OnboardingFormValues } from '@/lib/validations/onboarding';
import { cn } from '@/lib/utils';
import { apiClient, isApiConfigured } from '@/api/client';
import { profileService } from '@/lib/services/profileService';
import { useLookupOptions } from '@/hooks/useLookupOptions';
import { Checkbox } from '@/components/ui/checkbox';
import { notify } from '@/components/ui/sonner';
import { useAuth } from '@/context/AuthContext';
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
  { num: 4, label: 'Avatar & Bio', icon: FileText, hint: 'Pick your emoji avatar & intro' },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { completeLogin, session, needsOnboarding } = useAuth();
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

  // ── Email type & OTP state (Step 1 Inline Verification) ────────────────
  type EmailType = 'chmsu' | 'external';
  const [emailType, setEmailType] = useState<EmailType>('chmsu');
  const [studentIdFile, setStudentIdFile] = useState<File | null>(null);
  const [studentIdPreview, setStudentIdPreview] = useState<string | null>(null);
  const studentIdRef = useRef<HTMLInputElement>(null);

  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);
  const [showOtpView, setShowOtpView] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Guard: if the user is already logged in and onboarding is complete,
  // redirect them to the dashboard. Prevents re-onboarding after refresh.
  useEffect(() => {
    if (session && !needsOnboarding) {
      navigate('/dashboard', { replace: true });
    }
  }, [session, needsOnboarding, navigate]);

  // Load preset avatars from backend (set by admin)
  useEffect(() => {
    if (!isApiConfigured) return;
    apiClient.getPresetAvatars()
      .then((res) => setPresetAvatars(res.avatars))
      .catch(() => {});
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

    const isValid = await trigger(fieldsToValidate);
    if (!isValid) return;

    if (step === 1) {
      if (showOtpView) {
        const code = otpDigits.join('');
        if (code.length < 6) {
          setOtpError('Please enter the full 6-digit verification code.');
          return;
        }
        await handleVerifyOtpInStep1(code);
        return;
      }

      if (emailType === 'external' && !studentIdFile) {
        notify.error('Student ID required', 'Please upload a photo of your Student ID or COR.');
        return;
      }

      if (isApiConfigured) {
        setIsCheckingUsername(true);
        try {
          const available = await profileService.checkUsername(formData.basicInfo.username.toLowerCase());
          if (!available) {
            notify.error('Username taken', 'That username is already taken. Please choose another.');
            return;
          }

          const result = await apiClient.register({
            email: formData.basicInfo.email,
            password: formData.basicInfo.password,
            username: formData.basicInfo.username.toLowerCase(),
            email_type: emailType,
            interests: [],
            organizations: [],
          });

          setRegisteredUserId(result.userId);

          if (emailType === 'external' && studentIdFile && result.userId) {
            try {
              await apiClient.uploadStudentId(result.userId, studentIdFile);
            } catch (err: any) {
              console.warn('Student ID upload warning:', err);
            }
          }

          setShowOtpView(true);
          notify.success('OTP sent!', `We sent a 6-digit code to ${formData.basicInfo.email}`);
        } catch (err: any) {
          notify.error('Registration failed', err?.message || 'Could not register.');
        } finally {
          setIsCheckingUsername(false);
        }
      } else {
        setStep(2);
      }
      return;
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
  };

  const handleVerifyOtpInStep1 = async (code: string) => {
    if (!registeredUserId) return;
    setIsVerifyingOtp(true);
    setOtpError('');
    try {
      const session = await apiClient.verifyOtp(registeredUserId, code);
      completeLogin(session, true);
      setShowOtpView(false);
      notify.success('Email confirmed!', 'Your email has been verified. Let\'s complete your profile.');
      setStep(2);
    } catch (err: any) {
      setOtpError(err?.message || 'Incorrect verification code. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtpInStep1 = async () => {
    if (!registeredUserId || isResendingOtp || resendCooldown > 0) return;
    setIsResendingOtp(true);
    setOtpError('');
    try {
      await apiClient.resendOtp(registeredUserId);
      notify.success('New OTP sent!', 'A fresh 6-digit code has been sent to your email.');
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setOtpError(err?.message || 'Could not resend code.');
    } finally {
      setIsResendingOtp(false);
    }
  };

  const handleBack = () => {
    if (step === 1 && showOtpView) {
      // OTP view rollback — handleCancelRegistration resets state and fires DELETE
      handleCancelRegistration();
      return;
    }
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/');
    }
  };

  /**
   * Rolls back a pending (unverified) registration when the user clicks
   * "← Change email address" on the OTP screen.
   * Fires DELETE /auth/register/cancel to clean up the zombie account, then
   * resets all Step 1 OTP state so the user can retry.
   * Resilient: always resets local state even if the server call errors.
   */
  const handleCancelRegistration = async () => {
    const prevUserId = registeredUserId;
    // Reset OTP view state immediately so the user sees the form again
    setShowOtpView(false);
    setOtpDigits(['', '', '', '', '', '']);
    setOtpError('');
    setRegisteredUserId(null);

    if (prevUserId && isApiConfigured) {
      try {
        await apiClient.cancelRegistration(prevUserId);
      } catch (err: any) {
        // Non-blocking: the user is already back on the form.
        // The pending account will be cleaned up by the backend or they can
        // retry with a different email.
        console.warn('[OnboardingPage] cancelRegistration error (non-blocking):', err?.message);
      }
    }
  };

  const onComplete = async (data: OnboardingFormValues) => {
    if (!isApiConfigured) {
      notify.success('Profile saved!', 'Welcome to Ally-jis.');
      navigate('/');
      return;
    }
    setIsSubmitting(true);

    try {
      await profileService.updateProfile(registeredUserId || '', {
        username: data.basicInfo.username.toLowerCase(),
        bio: data.bio || '',
        avatar: data.avatar || customAvatarPreview || '',
        course: data.academicDetails.course,
        department: data.academicDetails.department,
        yearLevel: data.academicDetails.yearLevel,
        interests: data.interests,
        organizations: data.organizations,
        zodiacSign: '',
        personalityType: '',
        musicTaste: [],
        movieInterests: [],
        ageRange: '18-20',
        matchGenderPreference: 'any',
      });

      notify.success('Profile complete!', 'Welcome to Ally-jis.');
      setIsCompleting(true);
      // Reload the session so AuthContext gets the fresh onboarding_complete=true metadata,
      // which will let ProtectedRoute pass and redirect to /dashboard.
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      notify.error('Save failed', err?.message || 'Could not update profile.');
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="min-h-[100dvh] bg-[#0f4a29] flex items-center justify-center">
        <div className="text-center ob-fade-up">
          <div className="w-20 h-20 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Check size={36} className="text-[#E8A838]" />
          </div>
          <h2 className="font-fraunces text-3xl font-bold text-white mb-2">Profile Created!</h2>
          <p className="font-jakarta text-white/50">Redirecting to your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col lg:flex-row overflow-hidden">
      {/* ── LEFT PANEL ─────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[42%] flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(155deg, #0f4a29 0%, #1A6B3C 55%, #1e7a44 100%)' }}>
        {/* Animated blobs */}
        <div className="ob-blob absolute -top-24 -left-24 w-72 h-72 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #E8A838 0%, transparent 70%)' }} />
        <div className="ob-blob-2 absolute -bottom-16 right-0 w-64 h-64 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #3B8C7E 0%, transparent 70%)' }} />
        <div className="ob-blob-3 absolute top-1/2 left-1/3 w-48 h-48 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)' }} />

        {/* Logo */}
        <div className="relative z-10 px-10 pt-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shadow-lg backdrop-blur-sm">
            <span className="text-white font-fraunces font-bold text-xl">A</span>
          </div>
          <span className="font-fraunces font-semibold text-2xl text-white">
            lly<span className="text-[#E8A838]">-jis</span>
          </span>
        </div>

        {/* Vertical step track */}
        <div className="relative z-10 flex flex-col flex-1 px-10 pt-12 pb-10 justify-between">
          <div className="space-y-6">
            {steps.map(({ num, label, hint, icon: Icon }) => (
              <div key={num} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300',
                    step > num  ? 'bg-[#E8A838] shadow-lg shadow-[#E8A838]/30' :
                    step === num ? 'bg-white/15 border-2 border-white/50 ring-4 ring-white/10' :
                                  'bg-white/8 border border-white/15'
                  )}>
                    {step > num
                      ? <Check size={16} className="text-white" />
                      : <Icon size={16} className={step >= num ? 'text-white' : 'text-white/30'} />}
                  </div>
                  {num < 4 && <div className={cn('w-px flex-1 min-h-[28px] mt-1 transition-all duration-500', step > num ? 'bg-[#E8A838]/40' : 'bg-white/10')} />}
                </div>
                <div className="pt-1">
                  <p className={cn('font-jakarta font-bold text-sm transition-colors', step === num ? 'text-white' : step > num ? 'text-white/60' : 'text-white/25')}>{label}</p>
                  <p className={cn('font-jakarta text-xs mt-0.5 transition-colors', step === num ? 'text-white/60' : 'text-white/20')}>{hint}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Step context art */}
          <div className="ob-fade-up mt-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <p className="font-fraunces text-2xl font-bold text-white mb-1">{steps[step - 1]?.label}</p>
              <p className="font-jakarta text-sm text-white/50 mb-4">{steps[step - 1]?.hint}</p>
              {/* Mini progress bar */}
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#E8A838] rounded-full transition-all duration-500" style={{ width: `${step * 25}%` }} />
              </div>
              <p className="font-jakarta text-xs text-white/30 mt-2">Step {step} of 4</p>
            </div>
          </div>

          <p className="font-jakarta text-xs text-white/20 mt-6">CHMSU Alijis Campus · Ally-jis</p>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#F7F4EF]">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#1A6B3C]/8 bg-white/50 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#1A6B3C] flex items-center justify-center">
              <span className="text-white font-fraunces font-bold text-base">A</span>
            </div>
            <span className="font-fraunces font-semibold text-lg text-[#1A6B3C]">lly<span className="text-[#E8A838]">-jis</span></span>
          </div>
          <div className="flex items-center gap-3">
            {steps.map(({ num }) => (
              <div key={num} className={cn('w-6 h-1.5 rounded-full transition-all duration-300',
                step > num ? 'bg-[#1A6B3C]' : step === num ? 'bg-[#1A6B3C]' : 'bg-gray-200'
              )} />
            ))}
          </div>
        </div>

        {/* Right panel scrollable content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="px-8 lg:px-14 pt-10 pb-6">
            {/* Step header — full width, left-aligned */}
            <div className="ob-fade-up mb-8 flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-jakarta font-bold uppercase tracking-widest text-[#1A6B3C]/60 mb-2">
                  <span className="w-3 h-px bg-[#1A6B3C]/40 inline-block" />
                  {step} / 4
                </span>
                <h1 className="font-fraunces text-4xl font-bold text-gray-900 leading-tight">{steps[step - 1]?.label}</h1>
              </div>

              {step === 1 && (
                <div className="text-right pt-2">
                  <span className="font-jakarta text-xs text-gray-500">Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="font-jakarta text-xs font-bold text-[#1A6B3C] hover:underline cursor-pointer transition-colors"
                  >
                    Sign in
                  </button>
                </div>
              )}
            </div>

            {step === 1 && (
              showOtpView ? (
                <div className="space-y-6 text-center py-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#1A6B3C]/10 text-[#1A6B3C] flex items-center justify-center mx-auto">
                    <Mail size={28} />
                  </div>
                  <div>
                    <h3 className="font-fraunces text-xl font-bold text-gray-900">Verify your email</h3>
                    <p className="font-jakarta text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                      We sent a 6-digit verification code to <span className="font-semibold text-gray-800">{formData.basicInfo.email}</span>. Enter it below to confirm your account.
                    </p>
                  </div>

                  {/* 6-digit OTP boxes */}
                  <div className="flex items-center justify-center gap-2 sm:gap-3 py-2">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-digit-${idx}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          const updated = [...otpDigits];
                          updated[idx] = val.slice(-1);
                          setOtpDigits(updated);
                          if (val && idx < 5) {
                            const next = document.getElementById(`otp-digit-${idx + 1}`);
                            next?.focus();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
                            const prev = document.getElementById(`otp-digit-${idx - 1}`);
                            prev?.focus();
                          }
                        }}
                        className={cn(
                          "w-11 h-13 sm:w-12 sm:h-14 text-center font-fraunces text-xl font-bold rounded-xl border transition-all outline-none",
                          digit ? "border-[#1A6B3C] bg-[#F0FDF4] text-[#1A6B3C]" : "border-gray-200 bg-gray-50 text-gray-900 focus:border-[#1A6B3C] focus:bg-white",
                          otpError && "border-red-400 bg-red-50 text-red-600"
                        )}
                      />
                    ))}
                  </div>

                  {otpError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2 text-xs text-red-600 font-jakarta max-w-sm mx-auto">
                      <AlertCircle size={16} className="flex-shrink-0" />
                      <span>{otpError}</span>
                    </div>
                  )}

                  <div className="pt-2 text-xs font-jakarta text-gray-500">
                    Didn't get a code?{' '}
                    <button
                      type="button"
                      onClick={handleResendOtpInStep1}
                      disabled={isResendingOtp || resendCooldown > 0}
                      className="font-bold text-[#1A6B3C] hover:underline disabled:opacity-50"
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : isResendingOtp ? 'Resending...' : 'Resend code'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleCancelRegistration}
                    className="text-xs font-jakarta text-gray-400 hover:text-gray-600 hover:underline block mx-auto pt-1"
                  >
                    ← Change email address
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                {/* Account type */}
                <div>
                  <label className="font-jakarta text-xs font-bold uppercase tracking-wider text-gray-400 block mb-3">Account type</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setEmailType('chmsu')}
                      className={cn(
                        'relative flex flex-col justify-between p-5 rounded-2xl border-2 text-left transition-all active:scale-[0.98] min-h-[110px]',
                        emailType === 'chmsu'
                          ? 'border-[#1A6B3C] bg-[#1A6B3C]'
                          : 'border-gray-200 bg-white hover:border-[#1A6B3C]/40 shadow-sm'
                      )}
                    >
                      <BadgeCheck size={22} className={emailType === 'chmsu' ? 'text-[#E8A838]' : 'text-gray-300'} />
                      <div>
                        <p className={cn('font-fraunces font-bold text-base', emailType === 'chmsu' ? 'text-white' : 'text-gray-800')}>CHMSU</p>
                        <p className={cn('font-jakarta text-xs mt-0.5', emailType === 'chmsu' ? 'text-white/60' : 'text-gray-400')}>@chmsu.edu.ph</p>
                      </div>
                      {emailType === 'chmsu' && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#E8A838]" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setEmailType('external')}
                      className={cn(
                        'relative flex flex-col justify-between p-5 rounded-2xl border-2 text-left transition-all active:scale-[0.98] min-h-[110px]',
                        emailType === 'external'
                          ? 'border-[#E8A838] bg-[#78350f]'
                          : 'border-gray-200 bg-white hover:border-[#E8A838]/40 shadow-sm'
                      )}
                    >
                      <Globe size={22} className={emailType === 'external' ? 'text-[#E8A838]' : 'text-gray-300'} />
                      <div>
                        <p className={cn('font-fraunces font-bold text-base', emailType === 'external' ? 'text-white' : 'text-gray-800')}>Personal</p>
                        <p className={cn('font-jakarta text-xs mt-0.5', emailType === 'external' ? 'text-white/60' : 'text-gray-400')}>Needs ID review</p>
                      </div>
                      {emailType === 'external' && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#E8A838]" />}
                    </button>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="font-jakarta text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">
                    {emailType === 'chmsu' ? 'CHMSU Email' : 'Email Address'}
                  </label>
                  <input
                    {...register('basicInfo.email')}
                    type="email"
                    placeholder={emailType === 'chmsu' ? 'maria@chmsu.edu.ph' : 'maria@gmail.com'}
                    className={cn(
                      'w-full px-4 py-3.5 rounded-2xl border font-jakarta text-sm outline-none transition-all',
                      errors.basicInfo?.email ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-[#1A6B3C] bg-white shadow-sm focus:shadow-md'
                    )}
                  />
                  {errors.basicInfo?.email && <p className="text-red-500 text-xs mt-1 font-jakarta">{errors.basicInfo.email.message}</p>}
                </div>

                {/* Student ID — external only */}
                {emailType === 'external' && (
                  <div>
                    <label className="font-jakarta text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">
                      Student ID <span className="font-normal normal-case tracking-normal text-gray-300">optional</span>
                    </label>
                    <input
                      ref={studentIdRef}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setStudentIdFile(file);
                        if (file.type.startsWith('image/')) {
                          const reader = new FileReader();
                          reader.onload = (ev) => setStudentIdPreview(ev.target?.result as string);
                          reader.readAsDataURL(file);
                        } else {
                          setStudentIdPreview(null);
                        }
                      }}
                    />
                    {studentIdPreview ? (
                      <div className="relative rounded-2xl overflow-hidden border-2 border-[#E8A838]">
                        <img src={studentIdPreview} alt="Student ID" className="w-full h-40 object-cover" />
                        <button
                          type="button"
                          onClick={() => { setStudentIdFile(null); setStudentIdPreview(null); }}
                          className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => studentIdRef.current?.click()}
                        className="w-full flex flex-col items-center gap-2 py-6 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 hover:bg-amber-100 transition-colors text-amber-700"
                      >
                        <Upload className="w-5 h-5" />
                        <span className="text-sm font-jakarta font-medium">
                          {studentIdFile ? studentIdFile.name : 'Upload Student ID'}
                        </span>
                        <span className="text-xs text-amber-600">JPG, PNG or PDF · Max 5MB</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Username + Password row (positioned below email and student ID) */}
                <div className="grid grid-cols-2 gap-4 pt-1 border-t border-gray-100">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="font-jakarta text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Username</label>
                    <input
                      {...register('basicInfo.username')}
                      type="text"
                      placeholder="mariasantos_99"
                      className={cn(
                        'w-full px-4 py-3.5 rounded-2xl border font-jakarta text-sm outline-none transition-all',
                        errors.basicInfo?.username ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-[#1A6B3C] bg-white shadow-sm focus:shadow-md'
                      )}
                    />
                    {errors.basicInfo?.username && <p className="text-red-500 text-xs mt-1 font-jakarta">{errors.basicInfo.username.message}</p>}
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="font-jakarta text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Password</label>
                    <input
                      {...register('basicInfo.password')}
                      type="password"
                      placeholder="Min. 6 characters"
                      className={cn(
                        'w-full px-4 py-3.5 rounded-2xl border font-jakarta text-sm outline-none transition-all',
                        errors.basicInfo?.password ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-[#1A6B3C] bg-white shadow-sm focus:shadow-md'
                      )}
                    />
                    {errors.basicInfo?.password && <p className="text-red-500 text-xs mt-1 font-jakarta">{errors.basicInfo.password.message}</p>}
                  </div>
                </div>
              </div>
              )
            )}

            {step === 2 && (
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="font-jakarta text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Department</label>
                  <select
                    {...register('academicDetails.department')}
                    onChange={e => {
                      setValue('academicDetails.department', e.target.value);
                      setValue('academicDetails.course', '');
                    }}
                    className={cn(
                      'w-full px-4 py-3.5 rounded-2xl border font-jakarta text-sm outline-none transition-all bg-white shadow-sm',
                      errors.academicDetails?.department ? 'border-red-300' : 'border-gray-200 focus:border-[#1A6B3C]'
                    )}
                  >
                    <option value="">Select department</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {errors.academicDetails?.department && <p className="text-red-500 text-xs mt-1 font-jakarta">{errors.academicDetails.department.message}</p>}
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="font-jakarta text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Course / Program</label>
                  <select
                    {...register('academicDetails.course')}
                    disabled={!formData.academicDetails.department}
                    className={cn(
                      'w-full px-4 py-3.5 rounded-2xl border font-jakarta text-sm outline-none transition-all bg-white shadow-sm',
                      errors.academicDetails?.course ? 'border-red-300' : 'border-gray-200 focus:border-[#1A6B3C]',
                      !formData.academicDetails.department && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <option value="">Select course</option>
                    {availableCourses.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.academicDetails?.course && <p className="text-red-500 text-xs mt-1 font-jakarta">{errors.academicDetails.course.message}</p>}
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="font-jakarta text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Year Level</label>
                  <div className="grid grid-cols-5 gap-2">
                    {yearLevels.map(y => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => setValue('academicDetails.yearLevel', y, { shouldValidate: true })}
                        className={cn(
                          'py-3 rounded-2xl border font-jakarta text-xs font-bold transition-all active:scale-[0.97]',
                          formData.academicDetails.yearLevel === y
                            ? 'bg-[#1A6B3C] text-white border-[#1A6B3C] shadow-md'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-[#1A6B3C]/40 shadow-sm'
                        )}
                      >
                        {y.replace(' Year', '')}
                      </button>
                    ))}
                  </div>
                  {errors.academicDetails?.yearLevel && <p className="text-red-500 text-xs mt-1 font-jakarta">{errors.academicDetails.yearLevel.message}</p>}
                </div>

                <div className="col-span-2">
                  <label className="font-jakarta text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Student Organizations <span className="font-normal normal-case tracking-normal text-gray-300">optional</span></label>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {organizations.map(org => {
                      const selected = formData.organizations.includes(org);
                      return (
                        <label
                          key={org}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer",
                            selected
                              ? "bg-[#1A6B3C]/5 border-[#1A6B3C]/20"
                              : "bg-white border-gray-100 hover:border-[#1A6B3C]/15 shadow-sm"
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
                  <p className="font-jakarta text-sm text-gray-400">Pick at least 3</p>
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
          </div>{/* end form content area */}
        </div>{/* end overflow-y-auto */}

        {/* ── Sticky footer nav ─────────────────────────────── */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-[#1A6B3C]/8 bg-white/80 backdrop-blur-sm flex items-center justify-between">
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
              disabled={isSubmitting || isCheckingUsername || isVerifyingOtp || (step === 4 && !agreedToTerms)}
              className={cn(
                'flex items-center gap-2 font-jakarta font-semibold text-sm px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-[0.98]',
                step === 4 && !agreedToTerms
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                  : 'bg-[#1A6B3C] text-white hover:bg-[#155a33]'
              )}
            >
              {isSubmitting || isCheckingUsername || isVerifyingOtp
                ? 'Processing...'
                : (step === 1 && showOtpView)
                ? 'Verify Code'
                : step === 4
                ? 'Complete Profile'
                : 'Continue'}
              {step === 4 ? <Check size={16} /> : <ArrowRight size={16} />}
            </button>
          </div>{/* end footer nav */}
        </div>{/* end right panel */}

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