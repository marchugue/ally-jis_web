import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, ArrowLeft, Check, User, GraduationCap, Sparkles, FileText, Plus, X, HeartHandshake, Film, Music, Compass, Upload, Camera, Loader2, Globe, BadgeCheck, Mail, AlertCircle, Search, Building2, Users, Shield } from 'lucide-react';
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

const TERMS_TEXT = `Welcome to Ally-jis! By creating an account or using our platform, you agree to follow these Terms & Conditions.

1. Who Can Use Ally-jis?
Ally-jis is intended for students of Carlos Hilado Memorial State University – Alijis Campus. When creating an account, you agree to provide accurate information and to use only your own identity.

2. Be Respectful
Ally-jis is a community for making connections. Please treat other users with respect. You must not use Ally-jis to:
• Harass, threaten, or bully another user
• Impersonate another person
• Send inappropriate or offensive content
• Spam or repeatedly contact someone who does not wish to communicate
• Share another person's private information without permission
• Attempt to access another user's account
• Distribute malicious links or software
• Use the platform for unlawful activities

3. Your Account
You are responsible for keeping your account information and password secure. Please do not share your password with anyone.

4. Your Profile and Messages
You are responsible for the information, photos, interests, and messages you post or send through Ally-jis. Please make sure that the content you share does not violate another person's privacy, rights, or safety.

5. Friend Matching
Matches on Ally-jis are suggestions based on shared interests, course details, and campus organizations. Ally-jis does not guarantee friendships, compatibility, or specific outcomes.

6. Reporting and Safety
If you encounter harassment, inappropriate behavior, or feel unsafe, please use the report or block features available on the platform.

7. Account Suspension or Termination
We reserve the right to suspend or remove accounts that violate these Terms & Conditions or engage in harmful behavior toward other users.

8. Changes to These Terms
These Terms & Conditions may be updated periodically. Continued use of Ally-jis means you accept any changes made.`;

const PRIVACY_TEXT = `Welcome to Ally-jis. We respect your personal privacy and are committed to safeguarding the data of our campus student community.

1. Campus Privacy Commitment
Ally-jis is built exclusively for students of Carlos Hilado Memorial State University – Alijis Campus. We collect only what is necessary to help you discover friends and interact safely within campus life.

2. Information We Collect
To help you create a profile and connect with matching peers across campus:
• Profile Details: Your name, username, course, year level, profile photo, and bio.
• Interests & Organizations: Hobbies, passions, and active campus student organizations.
• Connections & Chat: Friend requests, matches, and direct messages exchanged with peers.
• Account Security: Email address and encrypted authentication credentials for sign in.

3. How We Use Your Information
We use your information solely to:
• Display your campus profile to other students
• Calculate shared interest percentages and suggest friend matches
• Enable private, real-time messaging between mutual connections
• Protect student safety, investigate reports, and enforce community standards

4. Sharing Your Information
Your profile is visible only to verified CHMSU Alijis students. We never sell your personal data or share it with third-party advertisers.

5. Data Security
Your credentials and messages are stored using secure encryption protocols to protect against unauthorized access.

6. Your Rights and Control
You have full control over your data:
• Update your profile information, photo, and interests at any time
• Block or report any user who makes you feel uncomfortable
• Delete your account and associated data whenever you choose.`;

const steps = [
  { num: 1, label: 'Basic Info', icon: User, hint: 'Your identity on the platform' },
  { num: 2, label: 'Academic', icon: GraduationCap, hint: 'Your course & year at CHMSU' },
  { num: 3, label: 'Interests', icon: Sparkles, hint: 'Powers your matches!' },
  { num: 4, label: 'Avatar & Bio', icon: FileText, hint: 'Pick your emoji avatar & intro' },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { completeLogin, session, needsOnboarding, isPendingApproval } = useAuth();
  const [step, setStep] = useState(1);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [customInterest, setCustomInterest] = useState('');
  const [showCustomInterestInput, setShowCustomInterestInput] = useState(false);
  const [interestSearch, setInterestSearch] = useState('');
  const [activeInterestCategory, setActiveInterestCategory] = useState<string>('all');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsError, setTermsError] = useState('');
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [privacyError, setPrivacyError] = useState('');
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
  // redirect them. Prevents re-onboarding after refresh.
  useEffect(() => {
    if (session && !needsOnboarding) {
      navigate(isPendingApproval ? '/pending-approval' : '/dashboard', { replace: true });
    }
  }, [session, needsOnboarding, isPendingApproval, navigate]);

  // If the user is already authenticated (e.g. verified or signed in) but onboarding is incomplete,
  // skip step 1 and jump straight to Step 2 (Academic Details).
  useEffect(() => {
    if (session?.user && needsOnboarding) {
      setStep(prev => (prev === 1 ? 2 : prev));
      if (!registeredUserId) {
        setRegisteredUserId(session.user.id);
      }
      const existingUsername = (session.user.user_metadata?.username as string) || '';
      const existingEmail = session.user.email || '';
      if (existingUsername) {
        setValue('basicInfo.username', existingUsername);
      }
      if (existingEmail) {
        setValue('basicInfo.email', existingEmail);
      }
      setValue('basicInfo.password', 'AccountVerified1!');
    }
  }, [session, needsOnboarding, registeredUserId]);

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

  const filteredInterestsByCategory = useMemo(() => {
    const query = interestSearch.trim().toLowerCase();
    const result: Record<string, { label: string; color: string }[]> = {};

    for (const [cat, items] of Object.entries(interestsByCategory)) {
      if (activeInterestCategory !== 'all' && activeInterestCategory !== cat) {
        continue;
      }
      const matching = items.filter(item =>
        query ? item.label.toLowerCase().includes(query) : true
      );
      if (matching.length > 0) {
        result[cat] = matching;
      }
    }
    return result;
  }, [interestsByCategory, activeInterestCategory, interestSearch]);

  const interestCategoriesList = useMemo(() => {
    return ['all', ...Object.keys(interestsByCategory), 'custom'];
  }, [interestsByCategory]);

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
      let hasError = false;
      if (!agreedToTerms) {
        setTermsError('You must agree to the Terms & Conditions to continue.');
        hasError = true;
      }
      if (!agreedToPrivacy) {
        setPrivacyError('You must agree to the Privacy Policy to continue.');
        hasError = true;
      }
      if (hasError) return;
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
      // If user came into onboarding already authenticated, going back to Step 1 is disabled
      if (step === 2 && session?.user) {
        notify.info('Verification Complete', 'Your account is verified. Please complete your academic details.');
        return;
      }
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
      const activeUserId = registeredUserId || session?.user?.id || '';
      await profileService.updateProfile(activeUserId, {
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

      // Reload the session so AuthContext gets the fresh onboarding_complete=true metadata
      try {
        const nextSession = await apiClient.getSession();
        if (nextSession?.user) {
          completeLogin(nextSession, true);
        }
        const isPending =
          nextSession?.user?.user_metadata?.pending_student_verification === true &&
          nextSession?.user?.user_metadata?.student_verification_status !== 'approved';

        navigate(isPending ? '/pending-approval' : '/dashboard', { replace: true });
      } catch {
        navigate('/dashboard', { replace: true });
      }
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
      {/* ── LEFT PANEL: REALTIME PROFILE PREVIEW (MATCHES PROFILE UI) ── */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[40%] flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(155deg, #0a331c 0%, #1A6B3C 55%, #185e35 100%)' }}>
        {/* Ambient atmospheric gradients */}
        <div className="ob-blob absolute -top-24 -left-24 w-72 h-72 rounded-full opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #E8A838 0%, transparent 70%)' }} />
        <div className="ob-blob-2 absolute -bottom-16 right-0 w-64 h-64 rounded-full opacity-15 pointer-events-none" style={{ background: 'radial-gradient(circle, #3B8C7E 0%, transparent 70%)' }} />

        {/* Top Header: Brand & Live Indicator */}
        <div className="relative z-10 px-8 pt-8 pb-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shadow-lg backdrop-blur-sm">
              <span className="text-white font-fraunces font-bold text-xl">A</span>
            </div>
            <span className="font-fraunces font-semibold text-2xl text-white">
              lly<span className="text-[#E8A838]">-jis</span>
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/25 border border-white/15 backdrop-blur-md shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#E8A838] animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/90 font-bold">
              Live Profile Preview
            </span>
          </div>
        </div>

        {/* Mini Stepper Track */}
        <div className="relative z-10 px-8 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between bg-black/20 backdrop-blur-md rounded-2xl p-2 border border-white/10">
            {steps.map(({ num, label }) => {
              const isDone = step > num;
              const isCurrent = step === num;
              return (
                <div key={num} className="flex items-center gap-2 flex-1 px-1">
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono font-bold transition-all shrink-0',
                    isDone
                      ? 'bg-[#E8A838] text-[#0a331c] shadow-xs'
                      : isCurrent
                      ? 'bg-white text-[#1A6B3C] shadow-md ring-2 ring-white/30'
                      : 'bg-white/15 text-white/40'
                  )}>
                    {isDone ? <Check size={12} strokeWidth={3} /> : num}
                  </div>
                  <span className={cn(
                    'font-jakarta text-[11px] font-bold truncate hidden xl:inline transition-colors',
                    isCurrent ? 'text-white' : isDone ? 'text-white/70' : 'text-white/30'
                  )}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── REALTIME PROFILE CARD (MATCHES PROFILEPAGE.TSX UI) ── */}
        <div className="relative z-10 flex-1 min-h-0 px-8 pb-6 flex flex-col">
          <div className="bg-white rounded-3xl border border-white/20 shadow-2xl flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* FB-Style Cover Banner */}
            <div className="h-32 sm:h-36 bg-gradient-to-r from-[#1A6B3C] via-[#2d8a56] to-[#3B8C7E] relative overflow-hidden flex-shrink-0">
              <div
                className="absolute inset-0 opacity-20"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
              />
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center gap-1 bg-black/35 backdrop-blur-md text-white px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider font-semibold border border-white/20 shadow-xs">
                  CAMPUS CARD
                </span>
              </div>
            </div>

            {/* Overhanging Avatar & Verified Badge */}
            <div className="relative px-6 -mt-12 flex items-end justify-between flex-shrink-0">
              <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-full bg-white border-4 border-white shadow-xl overflow-hidden flex items-center justify-center relative z-10 bg-gray-50">
                {formData.avatar && (formData.avatar.startsWith('http') || formData.avatar.startsWith('data:')) ? (
                  <img src={formData.avatar} alt="Profile avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl sm:text-5xl">{formData.avatar || '👤'}</span>
                )}
              </div>

              <div className="pb-1">
                <span className="inline-flex items-center gap-1 bg-[#1A6B3C]/10 text-[#1A6B3C] px-2.5 py-1 rounded-full text-[11px] font-bold font-jakarta border border-[#1A6B3C]/15">
                  <Shield size={12} className="text-[#1A6B3C]" />
                  CHMSU VERIFIED
                </span>
              </div>
            </div>

            {/* Profile Information Body (Scrollable canvas) */}
            <div className="px-6 pt-3 pb-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 min-h-0">
              {/* Identity row */}
              <div>
                <h2 className="font-fraunces text-xl font-bold text-gray-900 leading-tight">
                  {formData.basicInfo?.username ? `@${formData.basicInfo.username}` : '@username'}
                </h2>
                <p className="font-jakarta text-xs text-gray-500 mt-0.5">
                  Carlos Hilado Memorial State University · Alijis
                </p>
              </div>

              {/* Academic Details Pill Box */}
              <div className="space-y-2 text-xs font-jakarta bg-[#FAF7F2] p-3 rounded-2xl border border-[#1A6B3C]/10">
                <div className="flex items-center gap-2.5 text-gray-700">
                  <div className="w-6 h-6 rounded-lg bg-[#1A6B3C]/10 flex items-center justify-center flex-shrink-0">
                    <GraduationCap size={13} className="text-[#1A6B3C]" />
                  </div>
                  <span className="font-semibold">
                    {formData.academicDetails?.course
                      ? `${formData.academicDetails.course}${formData.academicDetails?.yearLevel ? ` · ${formData.academicDetails.yearLevel}` : ''}`
                      : 'Course & Year Level'}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-gray-700">
                  <div className="w-6 h-6 rounded-lg bg-[#1A6B3C]/10 flex items-center justify-center flex-shrink-0">
                    <Building2 size={13} className="text-[#1A6B3C]" />
                  </div>
                  <span className="font-medium text-gray-600">
                    {formData.academicDetails?.department
                      ? formData.academicDetails.department.replace('College of ', '')
                      : 'College / Department'}
                  </span>
                </div>
              </div>

              {/* Bio Section */}
              <div>
                <p className="font-jakarta font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1">Intro</p>
                <p className={cn(
                  'font-jakarta text-xs leading-relaxed',
                  formData.bio ? 'text-gray-700' : 'text-gray-400 italic'
                )}>
                  {formData.bio || 'No bio added yet. Share a bit about yourself in Step 4.'}
                </p>
              </div>

              {/* Interests Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-jakarta font-bold text-[10px] text-gray-400 uppercase tracking-wider">
                    Interests {formData.interests && formData.interests.length > 0 ? `(${formData.interests.length})` : ''}
                  </p>
                  {(!formData.interests || formData.interests.length < 3) && (
                    <span className="text-[10px] font-mono text-[#E8A838] font-bold">
                      {formData.interests ? formData.interests.length : 0}/3 min
                    </span>
                  )}
                </div>
                {formData.interests && formData.interests.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {formData.interests.map(interest => (
                      <span
                        key={interest}
                        className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-jakarta text-[11px] font-medium border border-gray-200"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="font-jakarta text-xs text-gray-400 italic">
                    Select your passions in Step 3 to display them here
                  </p>
                )}
              </div>

              {/* Organizations Section */}
              {formData.organizations && formData.organizations.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="font-jakarta font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-2">
                    Organizations ({formData.organizations.length})
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {formData.organizations.map(org => (
                      <div key={org} className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-[#1A6B3C]/10 flex items-center justify-center flex-shrink-0">
                          <Users size={11} className="text-[#1A6B3C]" />
                        </div>
                        <span className="font-jakarta text-xs text-gray-700 font-medium truncate">{org}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
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

        {/* Right panel container — only scrollable when NOT in Step 3 (Step 3 has dedicated child box scrolling) */}
        <div className={cn(
          "flex-1 custom-scrollbar",
          step === 3 ? "overflow-hidden flex flex-col" : "overflow-y-auto"
        )}>
          <div className={cn(
            "px-8 lg:px-14 pt-8 pb-6",
            step === 3 && "flex-1 flex flex-col min-h-0 overflow-hidden"
          )}>
            {/* Step header — editorial magazine layout */}
            <div className={cn(
              "ob-fade-up flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#1A6B3C]/15 flex-shrink-0",
              step === 3 ? "mb-4 pb-4" : "mb-8 pb-6"
            )}>
              <div>
                <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#1A6B3C]/70 block mb-1">
                  Registration // Phase 0{step} of 04
                </span>
                <h1 className="font-fraunces text-4xl sm:text-5xl font-bold text-[#1A6B3C] leading-tight">
                  {steps[step - 1]?.label}
                </h1>
                <p className="font-jakarta text-sm text-gray-600 mt-1">
                  {steps[step - 1]?.hint}
                </p>
              </div>

              {step === 1 && (
                <div className="text-left sm:text-right pt-2">
                  <span className="font-jakarta text-xs text-gray-600">Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="font-mono text-xs uppercase tracking-wider font-bold text-[#1A6B3C] hover:underline cursor-pointer transition-colors"
                  >
                    Sign in →
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
                    className="text-xs font-jakarta text-gray-500 hover:text-gray-700 hover:underline block mx-auto pt-1"
                  >
                    ← Change email address
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                {/* Account type */}
                <div>
                  <label className="font-jakarta text-xs font-bold uppercase tracking-wider text-[#1A6B3C] block mb-3">Account type</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setEmailType('chmsu')}
                      className={cn(
                        'relative flex flex-col justify-between p-5 rounded-2xl border-2 text-left transition-all active:scale-[0.98] min-h-[110px]',
                        emailType === 'chmsu'
                          ? 'border-[#1A6B3C] bg-[#1A6B3C]'
                          : 'border-[#1A6B3C]/15 bg-white hover:border-[#1A6B3C]/40 shadow-xs'
                      )}
                    >
                      <BadgeCheck size={22} className={emailType === 'chmsu' ? 'text-[#E8A838]' : 'text-[#1A6B3C]'} />
                      <div>
                        <p className={cn('font-fraunces font-bold text-base', emailType === 'chmsu' ? 'text-white' : 'text-gray-900')}>CHMSU Student</p>
                        <p className={cn('font-mono text-xs mt-0.5', emailType === 'chmsu' ? 'text-white/80' : 'text-gray-600')}>@chmsu.edu.ph</p>
                      </div>
                      {emailType === 'chmsu' && <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-[#E8A838]" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setEmailType('external')}
                      className={cn(
                        'relative flex flex-col justify-between p-5 rounded-2xl border-2 text-left transition-all active:scale-[0.98] min-h-[110px]',
                        emailType === 'external'
                          ? 'border-[#1A6B3C] bg-[#1A6B3C]'
                          : 'border-[#1A6B3C]/15 bg-white hover:border-[#1A6B3C]/40 shadow-xs'
                      )}
                    >
                      <Globe size={22} className={emailType === 'external' ? 'text-[#E8A838]' : 'text-[#1A6B3C]'} />
                      <div>
                        <p className={cn('font-fraunces font-bold text-base', emailType === 'external' ? 'text-white' : 'text-gray-900')}>Personal Email</p>
                        <p className={cn('font-mono text-xs mt-0.5', emailType === 'external' ? 'text-white/80' : 'text-gray-600')}>Requires student ID review</p>
                      </div>
                      {emailType === 'external' && <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-[#E8A838]" />}
                    </button>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="font-jakarta text-xs font-bold uppercase tracking-wider text-[#1A6B3C] block mb-2">
                    {emailType === 'chmsu' ? 'CHMSU Email Address' : 'Personal Email Address'}
                  </label>
                  <input
                    {...register('basicInfo.email')}
                    type="email"
                    placeholder={emailType === 'chmsu' ? 'maria@chmsu.edu.ph' : 'maria@gmail.com'}
                    className={cn(
                      'w-full px-4 py-3.5 rounded-full border-2 font-jakarta text-sm outline-none transition-all',
                      errors.basicInfo?.email ? 'border-red-300 bg-red-50' : 'border-[#1A6B3C]/15 focus:border-[#1A6B3C] bg-white text-gray-900 shadow-xs'
                    )}
                  />
                  {errors.basicInfo?.email && <p className="text-red-500 text-xs mt-1 font-jakarta">{errors.basicInfo.email.message}</p>}
                </div>

                {/* Student ID — external only */}
                {emailType === 'external' && (
                  <div>
                    <label className="font-jakarta text-xs font-bold uppercase tracking-wider text-[#1A6B3C] block mb-2">
                      Student ID <span className="font-normal normal-case tracking-normal text-gray-500">optional</span>
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
                <div className="grid grid-cols-2 gap-4 pt-1 border-t border-[#1A6B3C]/15">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="font-jakarta text-xs font-bold uppercase tracking-wider text-[#1A6B3C] block mb-2">Username</label>
                    <input
                      {...register('basicInfo.username')}
                      type="text"
                      placeholder="mariasantos_99"
                      className={cn(
                        'w-full px-4 py-3.5 rounded-full border-2 font-jakarta text-sm outline-none transition-all',
                        errors.basicInfo?.username ? 'border-red-300 bg-red-50' : 'border-[#1A6B3C]/15 focus:border-[#1A6B3C] bg-white text-gray-900 shadow-xs'
                      )}
                    />
                    {errors.basicInfo?.username && <p className="text-red-500 text-xs mt-1 font-jakarta">{errors.basicInfo.username.message}</p>}
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="font-jakarta text-xs font-bold uppercase tracking-wider text-[#1A6B3C] block mb-2">Password</label>
                    <input
                      {...register('basicInfo.password')}
                      type="password"
                      placeholder="Min. 6 characters"
                      className={cn(
                        'w-full px-4 py-3.5 rounded-full border-2 font-jakarta text-sm outline-none transition-all',
                        errors.basicInfo?.password ? 'border-red-300 bg-red-50' : 'border-[#1A6B3C]/15 focus:border-[#1A6B3C] bg-white text-gray-900 shadow-xs'
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
                  <label className="font-jakarta text-xs font-bold uppercase tracking-wider text-[#1A6B3C] block mb-2">Department</label>
                  <select
                    {...register('academicDetails.department')}
                    onChange={e => {
                      setValue('academicDetails.department', e.target.value);
                      setValue('academicDetails.course', '');
                    }}
                    className={cn(
                      'w-full px-4 py-3.5 rounded-full border-2 font-jakarta text-sm outline-none transition-all bg-white text-gray-900 shadow-xs',
                      errors.academicDetails?.department ? 'border-red-300' : 'border-[#1A6B3C]/15 focus:border-[#1A6B3C]'
                    )}
                  >
                    <option value="">Select department</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {errors.academicDetails?.department && <p className="text-red-500 text-xs mt-1 font-jakarta">{errors.academicDetails.department.message}</p>}
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="font-jakarta text-xs font-bold uppercase tracking-wider text-[#1A6B3C] block mb-2">Course / Program</label>
                  <select
                    {...register('academicDetails.course')}
                    disabled={!formData.academicDetails.department}
                    className={cn(
                      'w-full px-4 py-3.5 rounded-full border-2 font-jakarta text-sm outline-none transition-all bg-white text-gray-900 shadow-xs',
                      errors.academicDetails?.course ? 'border-red-300' : 'border-[#1A6B3C]/15 focus:border-[#1A6B3C]',
                      !formData.academicDetails.department && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <option value="">Select course</option>
                    {availableCourses.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.academicDetails?.course && <p className="text-red-500 text-xs mt-1 font-jakarta">{errors.academicDetails.course.message}</p>}
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="font-jakarta text-xs font-bold uppercase tracking-wider text-[#1A6B3C] block mb-2">Year Level</label>
                  <div className="grid grid-cols-5 gap-2">
                    {yearLevels.map(y => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => setValue('academicDetails.yearLevel', y, { shouldValidate: true })}
                        className={cn(
                          'py-3 rounded-full border-2 font-jakarta text-xs font-bold transition-all active:scale-[0.97]',
                          formData.academicDetails.yearLevel === y
                            ? 'bg-[#1A6B3C] text-white border-[#1A6B3C] shadow-sm'
                            : 'bg-white text-gray-700 border-[#1A6B3C]/15 hover:border-[#1A6B3C]/40 shadow-xs'
                        )}
                      >
                        {y.replace(' Year', '')}
                      </button>
                    ))}
                  </div>
                  {errors.academicDetails?.yearLevel && <p className="text-red-500 text-xs mt-1 font-jakarta">{errors.academicDetails.yearLevel.message}</p>}
                </div>

                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-jakarta text-xs font-bold uppercase tracking-wider text-[#1A6B3C] block">
                      Student Organizations <span className="font-normal normal-case tracking-normal text-gray-500">optional</span>
                    </label>
                    {formData.organizations.length > 0 && (
                      <span className="font-mono text-[11px] font-bold text-[#1A6B3C] bg-[#1A6B3C]/10 px-2.5 py-0.5 rounded-full">
                        {formData.organizations.length} selected
                      </span>
                    )}
                  </div>
                  <div className="max-h-80 sm:max-h-96 overflow-y-auto space-y-2.5 pr-2 custom-scrollbar">
                    {organizations.map(org => {
                      const selected = formData.organizations.includes(org);
                      return (
                        <label
                          key={org}
                          className={cn(
                            "flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer",
                            selected
                              ? "bg-[#1A6B3C]/10 border-[#1A6B3C]/30 shadow-xs ring-1 ring-[#1A6B3C]/20"
                              : "bg-white border-[#1A6B3C]/10 hover:border-[#1A6B3C]/25 shadow-xs"
                          )}
                        >
                          <Checkbox
                            id={`org-${org}`}
                            checked={selected}
                            onCheckedChange={() => toggleOrganization(org)}
                            className="border-gray-300 rounded-[6px] data-[state=checked]:bg-[#1A6B3C] data-[state=checked]:border-[#1A6B3C]"
                          />
                          <span className={cn(
                            "flex-1 font-jakarta text-sm transition-colors",
                            selected ? "text-[#1A6B3C] font-bold" : "text-gray-700"
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
              <div className="flex-1 flex flex-col min-h-0 space-y-4">
                {/* ── HEADER STRIP ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1A6B3C]/10 pb-3 flex-shrink-0">
                  <div className="space-y-0.5">
                    <p className="font-jakarta font-bold text-xs uppercase tracking-wider text-[#1A6B3C]">
                      Passions & Campus Affinity
                    </p>
                    <p className="font-jakarta text-xs text-gray-500">
                      Select at least 3 passions. Matches are computed based on shared tags.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'inline-flex items-center gap-1.5 font-mono text-xs uppercase font-bold px-3.5 py-1.5 rounded-full transition-all shadow-xs',
                      formData.interests.length >= 3
                        ? 'bg-[#1A6B3C] text-white'
                        : 'bg-[#E8A838]/25 text-[#92400e]'
                    )}>
                      {formData.interests.length >= 3 && <Check size={13} />}
                      <span>{formData.interests.length} / 3 selected</span>
                    </div>
                  </div>
                </div>

                {errors.interests && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-jakarta px-4 py-2.5 rounded-2xl flex items-center gap-2 flex-shrink-0">
                    <AlertCircle size={15} className="text-red-500 shrink-0" />
                    <span>{errors.interests.message}</span>
                  </div>
                )}

                {/* ── ACTIVE SELECTIONS TRAY (IF ANY SELECTED) ── */}
                {formData.interests.length > 0 && (
                  <div className="bg-white/90 border border-[#1A6B3C]/15 rounded-2xl p-3 space-y-2 shadow-xs flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <span className="font-jakarta text-[11px] font-bold uppercase tracking-wider text-[#1A6B3C]">
                        Your Selected ({formData.interests.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setValue('interests', [], { shouldValidate: true })}
                        className="text-[11px] font-jakarta font-semibold text-gray-400 hover:text-red-500 transition-colors"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto custom-scrollbar pr-1">
                      {formData.interests.map(item => (
                        <span
                          key={item}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#1A6B3C] text-white text-xs font-jakarta font-semibold shadow-xs"
                        >
                          <span>{item}</span>
                          <button
                            type="button"
                            onClick={() => toggleInterest(item)}
                            className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                            aria-label={`Remove ${item}`}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── SEARCH & CATEGORY FILTER BAR ── */}
                <div className="space-y-2.5 flex-shrink-0">
                  {/* Search Input */}
                  <div className="relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search passions (e.g. Gaming, Music, Coding, Anime)..."
                      value={interestSearch}
                      onChange={e => setInterestSearch(e.target.value)}
                      className="w-full pl-11 pr-10 py-2.5 rounded-full border-2 border-[#1A6B3C]/15 focus:border-[#1A6B3C] bg-white text-gray-900 placeholder:text-gray-400 font-jakarta text-xs outline-none transition-all shadow-xs"
                    />
                    {interestSearch && (
                      <button
                        type="button"
                        onClick={() => setInterestSearch('')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                        aria-label="Clear search"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Horizontal Category Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                    {interestCategoriesList.map(cat => {
                      const isActive = activeInterestCategory === cat;
                      const label = cat === 'all' ? 'All Passions' : cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setActiveInterestCategory(cat)}
                          className={cn(
                            'whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-jakarta font-bold transition-all shrink-0',
                            isActive
                              ? 'bg-[#1A6B3C] text-white shadow-xs'
                              : 'bg-white text-gray-600 border border-[#1A6B3C]/15 hover:border-[#1A6B3C]/35 hover:text-[#1A6B3C]'
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── EXPANDED MAIN SCROLLBOX CANVAS (ONLY THIS BOX SCROLLS) ── */}
                <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                  {Object.entries(filteredInterestsByCategory).map(([category, items]) => (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="font-jakarta font-bold text-[11px] text-[#1A6B3C] uppercase tracking-[0.2em]">
                          {category}
                        </span>
                        <span className="text-[10px] font-mono text-[#1A6B3C]/50">
                          • {items.length} {items.length === 1 ? 'passion' : 'passions'}
                        </span>
                        <div className="h-px flex-1 bg-[#1A6B3C]/10"></div>
                      </div>
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

                  {/* Custom Interests Section */}
                  {(activeInterestCategory === 'all' || activeInterestCategory === 'custom') && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-2">
                        <span className="font-jakarta font-bold text-[11px] text-[#1A6B3C] uppercase tracking-[0.2em]">
                          Custom Interests
                        </span>
                        <div className="h-px flex-1 bg-[#1A6B3C]/10"></div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {customInterests.map(interest => (
                          <span
                            key={interest}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1A6B3C] text-white border border-[#1A6B3C] font-jakarta text-xs font-bold shadow-xs"
                          >
                            <Check size={12} />
                            <span>{interest}</span>
                            <button
                              type="button"
                              onClick={() => removeCustomInterest(interest)}
                              className="hover:bg-white/20 rounded-full p-0.5 transition-colors ml-0.5"
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
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border-2 border-dashed border-[#1A6B3C]/30 text-[#1A6B3C] hover:border-[#1A6B3C] hover:bg-[#1A6B3C]/5 font-jakarta text-xs font-bold transition-all shadow-2xs"
                          >
                            <Plus size={14} />
                            Add custom interest
                          </button>
                        )}
                      </div>

                      {showCustomInterestInput && (
                        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border-2 border-[#1A6B3C]/20 shadow-xs">
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
                            placeholder="Type an interest, e.g. K-pop, Robotics..."
                            maxLength={30}
                            className="flex-1 px-3 py-1.5 bg-transparent font-jakarta text-xs outline-none text-gray-900"
                          />
                          <button
                            type="button"
                            onClick={addCustomInterest}
                            className="px-4 py-2 rounded-full bg-[#1A6B3C] text-white font-jakarta text-xs font-bold hover:bg-[#13502D] transition-colors shadow-xs"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowCustomInterestInput(false);
                              setCustomInterest('');
                            }}
                            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            aria-label="Cancel"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Empty search results state */}
                  {Object.keys(filteredInterestsByCategory).length === 0 && (
                    <div className="text-center py-10 space-y-2">
                      <p className="font-jakarta font-semibold text-sm text-gray-600">
                        No interests matching "{interestSearch}"
                      </p>
                      <p className="font-jakarta text-xs text-gray-400">
                        You can add it as a custom interest above!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl p-6 border-2 border-[#1A6B3C]/15 shadow-xs mb-6">
                  <label className="font-jakarta font-bold text-xs text-[#1A6B3C] uppercase tracking-wider block mb-3">Profile Photo</label>

                  {/* Tab selector */}
                  <div className="flex gap-1 bg-[#EDE7DB] rounded-full p-1 mb-4">
                    <button
                      type="button"
                      onClick={() => setAvatarTab('presets')}
                      className={cn(
                        'flex-1 py-2 rounded-full text-xs font-mono uppercase tracking-wider font-semibold transition-all',
                        avatarTab === 'presets'
                          ? 'bg-[#1A6B3C] text-white shadow-xs'
                          : 'text-gray-700 hover:text-gray-900'
                      )}
                    >
                      Choose Preset
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvatarTab('upload')}
                      className={cn(
                        'flex-1 py-2 rounded-full text-xs font-mono uppercase tracking-wider font-semibold transition-all',
                        avatarTab === 'upload'
                          ? 'bg-[#1A6B3C] text-white shadow-xs'
                          : 'text-gray-700 hover:text-gray-900'
                      )}
                    >
                      Upload Photo
                    </button>
                  </div>

                  {avatarTab === 'presets' && (
                    presetAvatars.length === 0 ? (
                      <div className="py-6 text-center">
                        <p className="font-jakarta text-sm text-gray-500">No preset avatars available yet. Upload your own photo!</p>
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
                              className="font-jakarta text-xs text-red-600 hover:text-red-700 font-bold transition-colors"
                            >
                              Remove photo
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => !avatarUploading && avatarFileRef.current?.click()}
                          className={cn(
                            'border-2 border-dashed border-[#1A6B3C]/25 rounded-2xl p-6 text-center cursor-pointer transition-all',
                            'hover:border-[#1A6B3C] hover:bg-[#1A6B3C]/5',
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
                              <Camera size={24} className="text-[#1A6B3C]/50" />
                              <p className="font-jakarta text-sm font-bold text-gray-800">Tap to upload a photo</p>
                              <p className="font-mono text-xs text-gray-500">JPEG, PNG, WebP · Max 10 MB</p>
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
                  {errors.avatar && <p className="text-red-500 text-xs mt-1 font-jakarta">{errors.avatar.message}</p>}
                </div>

                <div>
                  <label className="font-jakarta font-bold text-xs uppercase tracking-wider text-[#1A6B3C] block mb-2">
                    Bio <span className="text-gray-500 font-normal lowercase tracking-normal">(optional but recommended)</span>
                  </label>
                  <div className="relative">
                    <textarea
                      {...register('bio')}
                      placeholder="Tell your future friends a bit about yourself! What are you passionate about? What are you looking for in a friend?"
                      maxLength={250}
                      rows={4}
                      className="w-full px-5 py-4 rounded-2xl border-2 border-[#1A6B3C]/15 focus:border-[#1A6B3C] bg-white text-gray-900 placeholder:text-gray-400 font-jakarta text-sm outline-none transition-all resize-none shadow-xs"
                    />
                    <span className="absolute bottom-3 right-3 font-mono text-xs font-semibold text-[#1A6B3C]/70">
                      {formData.bio?.length || 0}/250
                    </span>
                  </div>
                  {errors.bio && <p className="text-red-500 text-xs mt-1 font-jakarta">{errors.bio.message}</p>}
                </div>

                {/* Terms & Conditions & Privacy Policy — required to complete the profile */}
                <div className="rounded-2xl p-6 border-2 border-[#1A6B3C]/15 bg-white shadow-xs space-y-4">
                  <p className="font-jakarta text-xs text-gray-500 italic pb-2 border-b border-gray-100">
                    “Welcome to Ally-jis! By creating an account or using our platform, you agree to follow these Terms & Conditions and Privacy Policy.”
                  </p>

                  {/* Separate Checkbox 1: Terms & Conditions */}
                  <div className={cn(
                    'p-4 rounded-xl border-2 transition-colors',
                    termsError ? 'border-red-300 bg-red-50/60' : 'border-gray-100 hover:border-[#1A6B3C]/20 bg-[#FAF7F2]/40'
                  )}>
                    <div className="flex items-start gap-3.5">
                      <Checkbox
                        id="terms-agreement"
                        checked={agreedToTerms}
                        onCheckedChange={(checked) => {
                          setAgreedToTerms(Boolean(checked));
                          if (checked) setTermsError('');
                        }}
                        className="mt-0.5 border-gray-400 rounded-[6px] data-[state=checked]:bg-[#1A6B3C] data-[state=checked]:border-[#1A6B3C]"
                      />
                      <div className="space-y-1 flex-1">
                        <label htmlFor="terms-agreement" className="font-jakarta text-sm text-gray-800 leading-relaxed block cursor-pointer select-none">
                          By agreeing, I confirm that I am a student of Carlos Hilado Memorial State University – Alijis Campus and accept the{' '}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setActiveModal('terms');
                            }}
                            className="text-[#1A6B3C] font-bold underline hover:text-[#13502D]"
                          >
                            Terms & Conditions
                          </button>
                          .
                        </label>
                        {termsError && <p className="text-red-500 text-xs font-jakarta mt-1">{termsError}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Separate Checkbox 2: Privacy Policy */}
                  <div className={cn(
                    'p-4 rounded-xl border-2 transition-colors',
                    privacyError ? 'border-red-300 bg-red-50/60' : 'border-gray-100 hover:border-[#1A6B3C]/20 bg-[#FAF7F2]/40'
                  )}>
                    <div className="flex items-start gap-3.5">
                      <Checkbox
                        id="privacy-agreement"
                        checked={agreedToPrivacy}
                        onCheckedChange={(checked) => {
                          setAgreedToPrivacy(Boolean(checked));
                          if (checked) setPrivacyError('');
                        }}
                        className="mt-0.5 border-gray-400 rounded-[6px] data-[state=checked]:bg-[#1A6B3C] data-[state=checked]:border-[#1A6B3C]"
                      />
                      <div className="space-y-1 flex-1">
                        <label htmlFor="privacy-agreement" className="font-jakarta text-sm text-gray-800 leading-relaxed block cursor-pointer select-none">
                          By agreeing, I accept the{' '}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setActiveModal('privacy');
                            }}
                            className="text-[#1A6B3C] font-bold underline hover:text-[#13502D]"
                          >
                            Privacy Policy
                          </button>
                          {' '}and consent to the campus student data practices.
                        </label>
                        {privacyError && <p className="text-red-500 text-xs font-jakarta mt-1">{privacyError}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>{/* end form content area */}
        </div>{/* end overflow-y-auto */}

        {/* ── Sticky footer nav ─────────────────────────────── */}
        <div className="flex-shrink-0 px-8 py-4 border-t border-[#1A6B3C]/15 bg-white/90 backdrop-blur-md flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={isSubmitting || isCheckingUsername}
              className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider font-semibold px-6 py-3 rounded-full transition-all text-[#1A6B3C] bg-[#EDE7DB] hover:bg-[#e4ddcf] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              <ArrowLeft size={14} />
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={isSubmitting || isCheckingUsername || isVerifyingOtp || (step === 4 && (!agreedToTerms || !agreedToPrivacy))}
              className={cn(
                'flex items-center gap-2.5 font-mono text-xs uppercase tracking-wider font-bold px-8 py-3.5 rounded-full transition-all shadow-md active:scale-95',
                step === 4 && (!agreedToTerms || !agreedToPrivacy)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                  : 'bg-[#1A6B3C] text-white hover:bg-[#13502D]'
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
                  } else if (activeModal === 'privacy') {
                    setAgreedToPrivacy(true);
                    setPrivacyError('');
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