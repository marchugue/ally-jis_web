import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  Sparkles,
  FileText,
  Plus,
  X,
  AlertCircle,
  Upload,
  RotateCw,
  Maximize2,
  FileCheck,
  Shield,
  Loader2,
  Camera,
  Search,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient, isApiConfigured } from '@/api/client';
import { profileService } from '@/lib/services/profileService';
import { useLookupOptions } from '@/hooks/useLookupOptions';
import { notify } from '@/components/ui/sonner';
import { useAuth } from '@/context/AuthContext';
import {
  EmailSelectIllustration,
  BasicInfoIllustration,
  IdUploadIllustration,
  OtpIllustration,
  AcademicIllustration,
  InterestsIllustration,
  AvatarIllustration,
} from '@/components/OnboardingIllustrations';

// ── Preset Options ──────────────────────────────────────────────────────────

const AVATAR_OPTIONS = [
  '😊', '😎', '🤓', '🤔', '😴', '🥳', '👽', '👻',
  '🤖', '👾', '🦊', '🐱', '🐶', '🐼', '🐸', '🦉',
  '🦄', '🦖', '🐙', '🐡',
];

const TERMS_TEXT = `Welcome to Ally-jis! By creating an account or using our platform, you agree to follow these Terms & Conditions:

1. Campus Exclusive: Ally-jis is built exclusively for students of Carlos Hilado Memorial State University – Alijis Campus. When creating an account, you agree to provide accurate information and to use only your own verified student identity.
2. Respect & Community Standards: Treat fellow students with respect. Harassment, cyber-bullying, hate speech, sexual misconduct, impersonation, or distributing spam/malicious content will result in immediate suspension.
3. Student Verification: Students signing up with personal emails must upload a valid CHMSU Student ID or Certificate of Registration (COR). Forgery or submitting fake IDs is strictly prohibited and subject to university disciplinary review.
4. Privacy & Consent: Direct messaging and matching unlock only upon mutual consent. Respect peer boundaries at all times.
5. Account Responsibility: You are responsible for keeping your credentials confidential.

Official terms: https://ally-jis.xyz/terms`;

const PRIVACY_TEXT = `Privacy Policy for Ally-jis:

1. Campus Privacy Commitment: We collect only the data required to facilitate authentic campus connections and verify student credentials.
2. Information We Collect: Username, student or personal email, department, course, year level, profile photo/avatar, bio, campus organizations, and selected interest tags.
3. ID Verification Data: Student ID and COR images uploaded by personal-email users are encrypted and accessible only to authorized university campus administrators for enrollment verification. They are never shared publicly or sold.
4. Matching & Chat Privacy: Your profile is visible only to verified CHMSU Alijis students. We never sell your personal data or share it with third-party advertisers.
5. Your Rights: You can edit your profile details, update interests, or request account deletion at any time.

Official privacy policy: https://ally-jis.xyz/privacy`;

const STEPS = [
  { num: 1, label: 'Basic Info', icon: GraduationCap, hint: 'Your identity on the platform' },
  { num: 2, label: 'Academic', icon: GraduationCap, hint: 'Your course & year at CHMSU' },
  { num: 3, label: 'Interests', icon: Sparkles, hint: 'Powers your campus matches!' },
  { num: 4, label: 'Avatar & Bio', icon: FileText, hint: 'Pick your emoji avatar & intro' },
];

// Helper: check file types and format size
function isImageFile(file: File | null): boolean {
  if (!file) return false;
  return file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name);
}

function isPdfFile(file: File | null): boolean {
  if (!file) return false;
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Helper: rotate image file on client before upload
async function rotateImageFile(file: File, degrees: number): Promise<File | Blob> {
  const normDeg = ((degrees % 360) + 360) % 360;
  if (normDeg === 0 || !file.type.startsWith('image/')) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      const isQuarterTurn = normDeg === 90 || normDeg === 270;
      canvas.width = isQuarterTurn ? img.height : img.width;
      canvas.height = isQuarterTurn ? img.width : img.height;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((normDeg * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const rotated = new File([blob], file.name, { type: file.type || 'image/jpeg' });
            resolve(rotated);
          } else {
            resolve(file);
          }
        },
        file.type || 'image/jpeg',
        0.92
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
    img.src = objectUrl;
  });
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session, needsOnboarding, isPendingApproval, completeLogin } = useAuth();
  const { organizations, departments, coursesByDept, interestsByCategory, yearLevels } = useLookupOptions();

  // ── Navigation / Phase State ──────────────────────────────────────────────
  // If user arrived with an email type in URL (or resumed from incomplete profile)
  const initialEmailType = (searchParams.get('emailType') as 'chmsu' | 'external') || 'chmsu';
  const startStepParam = Number(searchParams.get('startStep') || searchParams.get('step'));
  const hasInitialStep = startStepParam >= 2 && startStepParam <= 4;

  const [phase, setPhase] = useState<'select-email' | 'form'>(
    hasInitialStep ? 'form' : searchParams.has('emailType') ? 'form' : 'select-email'
  );
  const [emailType, setEmailType] = useState<'chmsu' | 'external'>(initialEmailType);
  const [step, setStep] = useState<number>(hasInitialStep ? startStepParam : 1);

  // External student ID sub-steps: 'front' | 'back' | 'review' | 'none'
  const [idSubStep, setIdSubStep] = useState<'none' | 'front' | 'back' | 'review'>('none');
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [frontRotation, setFrontRotation] = useState<number>(0);

  const [backFile, setBackFile] = useState<File | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [backRotation, setBackRotation] = useState<number>(0);

  const [enlargedImage, setEnlargedImage] = useState<{ src: string; title: string; rotation: number } | null>(null);

  // OTP State
  const [showOtpView, setShowOtpView] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);

  // Form Data
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    course: '',
    yearLevel: '',
    organizations: [] as string[],
    interests: [] as string[],
    avatar: '😊',
    bio: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Step 3 custom interest state
  const [customInterest, setCustomInterest] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [interestSearch, setInterestSearch] = useState('');

  // Step 4 Avatar & Bio & Legal
  const [avatarTab, setAvatarTab] = useState<'presets' | 'custom'>('presets');
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string | null>(null);
  const [customAvatarFile, setCustomAvatarFile] = useState<File | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [activeModal, setActiveModal] = useState<'terms' | 'privacy' | null>(null);

  // Refs
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // ── Route & Auth Guards ───────────────────────────────────────────────────
  // If user is already authenticated & onboarding is complete, redirect
  useEffect(() => {
    if (session && !needsOnboarding) {
      navigate(isPendingApproval ? '/pending-approval' : '/dashboard', { replace: true });
    }
  }, [session, needsOnboarding, isPendingApproval, navigate]);

  // If user is already logged in but onboarding is incomplete, skip Step 1
  useEffect(() => {
    if (session?.user && needsOnboarding) {
      setPhase('form');
      setStep((prev) => (prev === 1 ? 2 : prev));
      if (!registeredUserId) {
        setRegisteredUserId(session.user.id);
      }
      const uName = (session.user.user_metadata?.username as string) || '';
      const uEmail = session.user.email || '';
      setForm((prev) => ({
        ...prev,
        username: prev.username || uName,
        email: prev.email || uEmail,
        password: prev.password || 'AccountVerified1!',
      }));
    }
  }, [session, needsOnboarding, registeredUserId]);

  // Handle escape key to dismiss modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (enlargedImage) setEnlargedImage(null);
        if (activeModal) setActiveModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enlargedImage, activeModal]);

  // Handle clean file previews
  const handleFrontFileChange = (file: File) => {
    setFrontFile(file);
    setFrontRotation(0);
    const url = URL.createObjectURL(file);
    setFrontPreview(url);
    setErrors((prev) => ({ ...prev, frontId: '' }));
  };

  const handleBackFileChange = (file: File) => {
    setBackFile(file);
    setBackRotation(0);
    const url = URL.createObjectURL(file);
    setBackPreview(url);
  };

  // ── Validation Helpers ────────────────────────────────────────────────────
  const validateStep1 = async (): Promise<boolean> => {
    const errs: Record<string, string> = {};

    // Username validation
    const cleanUsername = form.username.trim();
    if (!cleanUsername) {
      errs.username = 'Username is required.';
    } else if (cleanUsername.length < 3) {
      errs.username = 'Username must be at least 3 characters.';
    } else if (cleanUsername.length > 20) {
      errs.username = 'Username cannot exceed 20 characters.';
    } else if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      errs.username = 'Only letters, numbers, and underscores are allowed.';
    }

    // Email validation
    const cleanEmail = form.email.trim().toLowerCase();
    if (!cleanEmail) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errs.email = 'Please enter a valid email address.';
    } else if (emailType === 'chmsu' && !cleanEmail.endsWith('@chmsu.edu.ph')) {
      errs.email = 'Must be an institutional @chmsu.edu.ph student email.';
    }

    // Password validation
    if (!form.password) {
      errs.password = 'Password is required.';
    } else if (form.password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }

    // Confirm password
    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return false;
    }

    // Check username availability with backend
    if (isApiConfigured) {
      try {
        const available = await profileService.checkUsername(cleanUsername.toLowerCase());
        if (!available) {
          setErrors({ username: 'That username is already taken. Please choose another.' });
          return false;
        }
      } catch {
        // Non-blocking fallback
      }
    }

    setErrors({});
    return true;
  };

  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.department) errs.department = 'Please select your department / college.';
    if (!form.course) errs.course = 'Please select your academic course.';
    if (!form.yearLevel) errs.yearLevel = 'Please select your year level.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = (): boolean => {
    if (form.interests.length < 3) {
      setErrors({ interests: 'Please choose at least 3 interests to power your student matches.' });
      return false;
    }
    setErrors({});
    return true;
  };

  const validateStep4 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!agreedToTerms) errs.terms = 'You must agree to the Terms & Conditions.';
    if (!agreedToPrivacy) errs.privacy = 'You must agree to the Privacy Policy.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Step 1 Submission & ID Flow ───────────────────────────────────────────
  const handleNextFromStep1 = async () => {
    const isValid = await validateStep1();
    if (!isValid) return;

    if (emailType === 'external') {
      // Navigate into Student ID upload sub-flow
      setIdSubStep('front');
      return;
    }

    // CHMSU Email: create account immediately & prompt inline OTP
    setIsSubmitting(true);
    try {
      const result = await apiClient.register({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        username: form.username.trim().toLowerCase(),
        email_type: 'chmsu',
        interests: [],
        organizations: [],
      });
      setRegisteredUserId(result.userId);
      setShowOtpView(true);
      notify.success('Verification code sent!', `Check your inbox at ${form.email}`);
    } catch (err: any) {
      notify.error('Registration failed', err?.message || 'Could not create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // External Student ID: Confirm and Create Account
  const handleConfirmIdAndCreateAccount = async () => {
    if (!frontFile) {
      notify.error('Front ID required', 'Please upload the front side of your student ID or COR.');
      setIdSubStep('front');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create account
      const result = await apiClient.register({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        username: form.username.trim().toLowerCase(),
        email_type: 'external',
        interests: [],
        organizations: [],
      });

      const userId = result.userId;
      setRegisteredUserId(userId);

      // 2. Upload front ID with rotation applied
      try {
        const rotatedFront = await rotateImageFile(frontFile, frontRotation);
        await apiClient.uploadStudentId(userId, rotatedFront, 'front');
      } catch (err) {
        console.warn('Front ID upload warning:', err);
      }

      // 3. Upload back ID if provided
      if (backFile) {
        try {
          const rotatedBack = await rotateImageFile(backFile, backRotation);
          await apiClient.uploadStudentId(userId, rotatedBack, 'back');
        } catch (err) {
          console.warn('Back ID upload warning:', err);
        }
      }

      // 4. Move to OTP view
      setIdSubStep('none');
      setShowOtpView(true);
      notify.success('Account created & code sent!', `We sent a 6-digit code to ${form.email}`);
    } catch (err: any) {
      notify.error('Registration failed', err?.message || 'Could not complete registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── OTP Handlers ──────────────────────────────────────────────────────────
  const handleVerifyOtp = async (code: string) => {
    if (!registeredUserId) return;
    setIsVerifyingOtp(true);
    setOtpError('');
    try {
      const authSession = await apiClient.verifyOtp(registeredUserId, code);
      completeLogin(authSession, true);
      setShowOtpView(false);
      notify.success('Email confirmed!', "Your email is verified. Let's finish your academic profile.");
      setStep(2);
    } catch (err: any) {
      setOtpError(err?.message || 'Incorrect verification code. Please check and try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (!registeredUserId || isResendingOtp || resendCooldown > 0) return;
    setIsResendingOtp(true);
    setOtpError('');
    try {
      await apiClient.resendOtp(registeredUserId);
      notify.success('New code sent!', `A fresh 6-digit code was sent to ${form.email}`);
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setOtpError(err?.message || 'Could not resend code. Please try again in a moment.');
    } finally {
      setIsResendingOtp(false);
    }
  };

  const handleCancelRegistration = async () => {
    const prevUserId = registeredUserId;
    setShowOtpView(false);
    setOtpDigits(['', '', '', '', '', '']);
    setOtpError('');
    setRegisteredUserId(null);

    if (prevUserId && isApiConfigured) {
      try {
        await apiClient.cancelRegistration(prevUserId);
      } catch (err: any) {
        console.warn('cancelRegistration warning:', err?.message);
      }
    }
  };

  // ── Final Profile Submission (Step 4) ─────────────────────────────────────
  const handleCompleteRegistration = async () => {
    if (!validateStep4()) return;

    setIsSubmitting(true);
    try {
      const activeUserId = registeredUserId || session?.user?.id || '';

      // Upload custom avatar if chosen
      let finalAvatarUrl = form.avatar;
      if (avatarTab === 'custom' && customAvatarFile) {
        try {
          const res = await apiClient.uploadAvatarMedia(customAvatarFile);
          if (res?.url) {
            finalAvatarUrl = res.url;
          }
        } catch (err) {
          console.warn('Avatar upload error:', err);
        }
      }

      await profileService.updateProfile(activeUserId, {
        username: form.username.trim().toLowerCase(),
        bio: form.bio.trim(),
        avatar: finalAvatarUrl,
        department: form.department,
        course: form.course,
        yearLevel: form.yearLevel,
        interests: form.interests,
        organizations: form.organizations,
        zodiacSign: '',
        personalityType: '',
        musicTaste: [],
        movieInterests: [],
        ageRange: '18-20',
        matchGenderPreference: 'any',
      });

      // Refresh session
      try {
        const nextSession = await apiClient.getSession();
        if (nextSession?.user) {
          completeLogin(nextSession, true);
        }
      } catch {
        // Fallback
      }

      setIsDone(true);
    } catch (err: any) {
      notify.error('Profile save error', err?.message || 'Could not save profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Back Navigation ───────────────────────────────────────────────────────
  const handleBack = () => {
    if (phase === 'select-email') {
      navigate('/');
      return;
    }

    if (idSubStep === 'front') {
      setIdSubStep('none');
      return;
    }
    if (idSubStep === 'back') {
      setIdSubStep('front');
      return;
    }
    if (idSubStep === 'review') {
      setIdSubStep('back');
      return;
    }

    if (step === 1 && showOtpView) {
      handleCancelRegistration();
      return;
    }

    if (step === 1) {
      setPhase('select-email');
      return;
    }

    if (step === 2 && session?.user) {
      notify.info('Account Verified', 'Your account is verified. Please complete your academic details.');
      return;
    }

    if (step > 1) {
      setStep(step - 1);
    }
  };

  // ── Custom Interest Helpers ───────────────────────────────────────────────
  const toggleInterest = (item: string) => {
    setForm((prev) => {
      const exists = prev.interests.includes(item);
      const next = exists ? prev.interests.filter((i) => i !== item) : [...prev.interests, item];
      return { ...prev, interests: next };
    });
    setErrors((prev) => ({ ...prev, interests: '' }));
  };

  const handleAddCustomInterest = () => {
    const trimmed = customInterest.trim();
    if (!trimmed) return;
    if (!form.interests.some((i) => i.toLowerCase() === trimmed.toLowerCase())) {
      setForm((prev) => ({ ...prev, interests: [...prev.interests, trimmed] }));
    }
    setCustomInterest('');
    setErrors((prev) => ({ ...prev, interests: '' }));
  };

  const toggleOrg = (org: string) => {
    setForm((prev) => {
      const exists = prev.organizations.includes(org);
      const next = exists ? prev.organizations.filter((o) => o !== org) : [...prev.organizations, org];
      return { ...prev, organizations: next };
    });
  };

  // Available courses dynamically computed from selected department
  const currentCourses = form.department ? coursesByDept[form.department] || [] : [];

  // Filtered interests based on category & search query
  const allInterestItems = Object.entries(interestsByCategory).flatMap(([cat, list]) =>
    list.map((item) => ({ ...item, category: cat }))
  );
  const filteredInterests = allInterestItems.filter((item) => {
    const matchesCat = activeCategory === 'all' || item.category.toLowerCase() === activeCategory.toLowerCase();
    const matchesSearch = !interestSearch || item.label.toLowerCase().includes(interestSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // ── Celebratory Completion View ───────────────────────────────────────────
  if (isDone) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] dark:bg-[#090D16] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-md w-full bg-white dark:bg-[#111827] rounded-3xl p-8 sm:p-10 border border-[#1A6B3C]/15 dark:border-white/10 shadow-2xl text-center"
        >
          <div className="w-20 h-20 rounded-full bg-[#1A6B3C]/10 dark:bg-emerald-950/60 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-[#1A6B3C] dark:text-emerald-400" strokeWidth={3} />
          </div>
          <h2 className="font-fraunces text-3xl font-bold text-[#1A6B3C] dark:text-white leading-tight">
            Welcome to Ally-jis! 🎉
          </h2>
          <p className="font-jakarta text-sm text-gray-600 dark:text-gray-300 mt-3 leading-relaxed">
            {emailType === 'external'
              ? 'Your profile is ready! Since you used a personal email, your student ID is being reviewed by university administrators.'
              : 'Your campus account and profile are all set up. Start discovering peers and connecting right away!'}
          </p>

          <button
            type="button"
            onClick={() => navigate(emailType === 'external' ? '/pending-approval' : '/dashboard', { replace: true })}
            className="w-full mt-8 bg-[#1A6B3C] dark:bg-emerald-600 text-white font-mono text-xs uppercase tracking-wider font-bold py-4 rounded-full hover:bg-[#14532D] dark:hover:bg-emerald-500 transition-all shadow-md flex items-center justify-center gap-2"
          >
            <span>{emailType === 'external' ? 'View Verification Status' : 'Go to Dashboard'}</span>
            <ArrowRight size={16} />
          </button>
        </motion.div>
      </div>
    );
  }

  // ── PHASE 0: SELECT EMAIL VIEW ────────────────────────────────────────────
  if (phase === 'select-email') {
    return (
      <div className="min-h-screen bg-[#F7F4EF] dark:bg-[#090D16] text-[#1A6B3C] dark:text-gray-100 selection:bg-[#1A6B3C] selection:text-white flex flex-col justify-between overflow-x-hidden">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#F7F4EF]/85 dark:bg-[#090D16]/85 border-b border-[#1A6B3C]/10 dark:border-white/10 transition-all">
          <div className="max-w-4xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ scale: 1.08, rotate: -4 }}
                whileTap={{ scale: 0.94 }}
                className="w-10 h-10 rounded-full bg-[#1A6B3C] dark:bg-emerald-600 flex items-center justify-center text-white font-fraunces font-bold text-lg shadow-sm"
              >
                A
              </motion.div>
              <div className="flex flex-col">
                <span className="font-fraunces font-bold text-xl tracking-tight text-[#1A6B3C] dark:text-white leading-none">
                  Ally<span className="text-[#E8A838]">-jis</span>
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#1A6B3C]/60 dark:text-gray-400 pt-0.5">
                  CHMSU Alijis
                </span>
              </div>
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#1A6B3C] dark:text-white bg-white dark:bg-white/10 hover:bg-[#EDE7DB] dark:hover:bg-white/20 px-4 py-2.5 rounded-full transition-all shadow-xs border border-[#1A6B3C]/10 dark:border-white/10"
            >
              <ArrowLeft size={14} /> Back to Sign in
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-12 flex flex-col items-center justify-center text-center">
          {/* Top Illustration */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <EmailSelectIllustration size={160} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-fraunces text-2xl sm:text-3xl font-bold text-[#1A6B3C] dark:text-white"
          >
            How would you like to sign up?
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="font-jakarta text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2 max-w-md"
          >
            Choose an email type to verify your CHMSU Alijis student identity and get started.
          </motion.p>

          {/* Cards Container */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full space-y-4 mt-8 text-left"
          >
            {/* Option 1: CHMSU Email */}
            <button
              type="button"
              onClick={() => setEmailType('chmsu')}
              className={cn(
                'w-full p-5 sm:p-6 rounded-2xl border-2 transition-all text-left flex flex-col gap-3 relative cursor-pointer',
                emailType === 'chmsu'
                  ? 'border-[#1A6B3C] dark:border-emerald-500 bg-white dark:bg-[#111827] shadow-lg ring-2 ring-[#1A6B3C]/10 dark:ring-emerald-500/20'
                  : 'border-[#1A6B3C]/15 dark:border-white/10 bg-white/70 dark:bg-[#111827]/70 hover:border-[#1A6B3C]/40 dark:hover:border-white/30'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
                      emailType === 'chmsu'
                        ? 'bg-[#1A6B3C] text-white'
                        : 'bg-[#1A6B3C]/10 dark:bg-white/10 text-[#1A6B3C] dark:text-gray-200'
                    )}
                  >
                    <GraduationCap size={20} />
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#E8A838]/20 text-[#B45309] dark:text-amber-300">
                    Instant Access
                  </span>
                </div>
                {emailType === 'chmsu' && (
                  <CheckCircle2 className="text-[#1A6B3C] dark:text-emerald-400 w-5 h-5" />
                )}
              </div>

              <div>
                <h3 className="font-fraunces text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  CHMSU Student Email
                </h3>
                <p className="font-mono text-xs text-[#1A6B3C] dark:text-emerald-400 font-semibold mt-0.5">
                  @chmsu.edu.ph
                </p>
                <p className="font-jakarta text-xs text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                  Instant 6-digit verification code sent directly to your institutional student inbox. No ID upload required.
                </p>
              </div>
            </button>

            {/* Option 2: Personal Email */}
            <button
              type="button"
              onClick={() => setEmailType('external')}
              className={cn(
                'w-full p-5 sm:p-6 rounded-2xl border-2 transition-all text-left flex flex-col gap-3 relative cursor-pointer',
                emailType === 'external'
                  ? 'border-[#1A6B3C] dark:border-emerald-500 bg-white dark:bg-[#111827] shadow-lg ring-2 ring-[#1A6B3C]/10 dark:ring-emerald-500/20'
                  : 'border-[#1A6B3C]/15 dark:border-white/10 bg-white/70 dark:bg-[#111827]/70 hover:border-[#1A6B3C]/40 dark:hover:border-white/30'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
                      emailType === 'external'
                        ? 'bg-[#1A6B3C] text-white'
                        : 'bg-[#1A6B3C]/10 dark:bg-white/10 text-[#1A6B3C] dark:text-gray-200'
                    )}
                  >
                    <FileCheck size={20} />
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#1A6B3C]/15 dark:bg-emerald-950 text-[#1A6B3C] dark:text-emerald-300">
                    Student ID Required
                  </span>
                </div>
                {emailType === 'external' && (
                  <CheckCircle2 className="text-[#1A6B3C] dark:text-emerald-400 w-5 h-5" />
                )}
              </div>

              <div>
                <h3 className="font-fraunces text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  Personal Email
                </h3>
                <p className="font-mono text-xs text-[#1A6B3C] dark:text-emerald-400 font-semibold mt-0.5">
                  Gmail, Yahoo, Outlook, etc.
                </p>
                <p className="font-jakarta text-xs text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                  For students awaiting institutional account activation. Requires a photo upload of your Student ID or COR.
                </p>
              </div>
            </button>
          </motion.div>

          {/* Continue Button */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="w-full mt-8"
          >
            <button
              type="button"
              onClick={() => {
                setPhase('form');
                setStep(1);
              }}
              className="w-full bg-[#1A6B3C] dark:bg-emerald-600 text-white font-mono text-xs uppercase tracking-wider font-bold py-4 rounded-full hover:bg-[#14532D] dark:hover:bg-emerald-500 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight size={16} />
            </button>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="py-6 border-t border-[#1A6B3C]/10 dark:border-white/10 text-center text-xs font-jakarta text-gray-500">
          Carlos Hilado Memorial State University · Alijis Campus · Ally-jis
        </footer>
      </div>
    );
  }

  // ── MAIN REGISTRATION / MULTI-STEP VIEW ───────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#090D16] text-[#1A6B3C] dark:text-gray-100 flex flex-col justify-between overflow-x-hidden">
      {/* ── TOP BAR ── */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#FAF8F5]/90 dark:bg-[#090D16]/90 border-b border-[#1A6B3C]/10 dark:border-white/10 transition-all">
        <div className="max-w-2xl mx-auto px-4 sm:px-8 h-16 sm:h-20 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="w-9 h-9 rounded-xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 flex items-center justify-center text-[#1A6B3C] dark:text-emerald-400 hover:bg-gray-50 dark:hover:bg-white/20 transition-all shadow-xs cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>

          <span className="font-mono text-xs uppercase tracking-widest font-bold text-gray-400 dark:text-gray-500">
            {idSubStep !== 'none'
              ? 'Student Verification'
              : `STEP ${step} OF ${STEPS.length}`}
          </span>

          {idSubStep === 'back' ? (
            <button
              type="button"
              onClick={() => setIdSubStep('review')}
              className="text-xs font-mono uppercase font-bold text-[#1A6B3C] dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Skip
            </button>
          ) : (
            <div className="w-9" />
          )}
        </div>
      </header>

      {/* ── BODY CONTAINER ── */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-10 flex flex-col items-center">
        {/* ── STEP ILLUSTRATION & TITLE HEADER ── */}
        <div className="flex flex-col items-center text-center w-full mb-8">
          <motion.div
            key={`ill-${step}-${idSubStep}-${showOtpView}`}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 350, damping: 24 }}
            className="mb-4"
          >
            {showOtpView ? (
              <OtpIllustration size={165} />
            ) : idSubStep !== 'none' ? (
              <IdUploadIllustration size={165} />
            ) : step === 1 ? (
              <BasicInfoIllustration size={165} />
            ) : step === 2 ? (
              <AcademicIllustration size={165} />
            ) : step === 3 ? (
              <InterestsIllustration size={165} />
            ) : (
              <AvatarIllustration size={165} />
            )}
          </motion.div>

          <h1 className="font-fraunces text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
            {showOtpView
              ? 'Verify your email'
              : idSubStep === 'front'
              ? 'Upload Front ID or COR'
              : idSubStep === 'back'
              ? 'Upload Back of ID'
              : idSubStep === 'review'
              ? 'Review Student ID'
              : STEPS[step - 1]?.label}
          </h1>

          <p className="font-jakarta text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-md">
            {showOtpView
              ? `We sent a 6-digit verification code to ${form.email}`
              : idSubStep === 'front'
              ? 'Please upload the front side of your CHMSU student ID or official Certificate of Registration.'
              : idSubStep === 'back'
              ? 'Now upload the back side of your student ID, or skip if your card has no back.'
              : idSubStep === 'review'
              ? 'Ensure all student details and photo are sharp and legible before submitting.'
              : STEPS[step - 1]?.hint}
          </p>

          {/* Progress dots (when in 4 main steps and not in ID sub-flow or OTP) */}
          {idSubStep === 'none' && !showOtpView && (
            <div className="flex items-center gap-2 mt-4">
              {STEPS.map(({ num }) => (
                <div
                  key={num}
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    num === step
                      ? 'w-7 bg-[#1A6B3C] dark:bg-emerald-500'
                      : num < step
                      ? 'w-2 bg-[#1A6B3C]/60 dark:bg-emerald-500/60'
                      : 'w-2 bg-gray-200 dark:bg-white/15'
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── CARD FORM CONTAINER ── */}
        <div className="w-full bg-white dark:bg-[#111827] rounded-3xl p-6 sm:p-8 border border-[#1A6B3C]/10 dark:border-white/10 shadow-xl">
          {/* =========================================================================
              OTP VIEW (Step 1 or External ID Upload Completion)
             ========================================================================= */}
          {showOtpView && (
            <div className="flex flex-col items-center py-2 space-y-6">
              {/* 6 Digit Input Boxes */}
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-digit-${idx}`}
                    type="text"
                    inputMode="numeric"
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
                      if (val && idx === 5 && updated.every(Boolean)) {
                        handleVerifyOtp(updated.join(''));
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
                        const prev = document.getElementById(`otp-digit-${idx - 1}`);
                        prev?.focus();
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const paste = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
                      if (!paste) return;
                      const nextDigits = [...otpDigits];
                      paste.split('').forEach((char, i) => {
                        nextDigits[i] = char;
                      });
                      setOtpDigits(nextDigits);
                      if (paste.length === 6) {
                        handleVerifyOtp(paste);
                      }
                    }}
                    className={cn(
                      'w-11 h-13 sm:w-13 sm:h-15 text-center font-fraunces text-xl sm:text-2xl font-bold rounded-2xl border-2 transition-all outline-none',
                      digit
                        ? 'border-[#1A6B3C] dark:border-emerald-500 bg-[#F0FDF4] dark:bg-emerald-950/40 text-[#1A6B3C] dark:text-emerald-300'
                        : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:border-[#1A6B3C] dark:focus:border-emerald-500'
                    )}
                  />
                ))}
              </div>

              {otpError && (
                <div className="w-full max-w-sm p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 flex items-center gap-2.5 text-xs text-red-600 dark:text-red-400 font-jakarta">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              <button
                type="button"
                disabled={isVerifyingOtp || otpDigits.join('').length < 6}
                onClick={() => handleVerifyOtp(otpDigits.join(''))}
                className="w-full max-w-sm bg-[#1A6B3C] dark:bg-emerald-600 text-white font-mono text-xs uppercase tracking-wider font-bold py-4 rounded-full hover:bg-[#14532D] dark:hover:bg-emerald-500 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isVerifyingOtp ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Confirm & Continue</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="text-center text-xs font-jakarta text-gray-500 space-y-2">
                <p>
                  Didn't get the code?{' '}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isResendingOtp || resendCooldown > 0}
                    className="font-bold text-[#1A6B3C] dark:text-emerald-400 hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : isResendingOtp ? 'Sending...' : 'Resend Code'}
                  </button>
                </p>
                <button
                  type="button"
                  onClick={handleCancelRegistration}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline cursor-pointer"
                >
                  ← Change email address or restart
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              STUDENT ID SUB-FLOW: FRONT SIDE (External Email)
             ========================================================================= */}
          {!showOtpView && idSubStep === 'front' && (
            <div className="space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-[#1A6B3C]/10 text-[#1A6B3C] dark:text-emerald-400">
                <span>Step 1 of 2 • Front Side</span>
              </div>

              {/* Upload Dropzone */}
              <input
                ref={frontInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onClick={(e) => {
                  (e.target as HTMLInputElement).value = '';
                }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFrontFileChange(file);
                }}
              />

              {frontFile && frontPreview ? (
                <div className="space-y-3">
                  {isImageFile(frontFile) ? (
                    <div
                      onClick={() =>
                        setEnlargedImage({
                          src: frontPreview,
                          title: 'Front ID Preview',
                          rotation: frontRotation,
                        })
                      }
                      className="relative rounded-2xl overflow-hidden border-2 border-[#1A6B3C] bg-black/5 flex items-center justify-center min-h-[220px] cursor-pointer group shadow-xs"
                      title="Click to zoom / inspect photo"
                    >
                      <img
                        src={frontPreview}
                        alt="Front ID Preview"
                        style={{ transform: `rotate(${frontRotation}deg)` }}
                        className="max-h-64 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                      />
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-semibold backdrop-blur-[1px] pointer-events-none">
                        <Maximize2 size={16} />
                        <span>Click anywhere to inspect & zoom</span>
                      </div>
                      <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFrontRotation((r) => (r + 90) % 360);
                          }}
                          className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer shadow-md"
                          title="Rotate 90 degrees"
                        >
                          <RotateCw size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEnlargedImage({
                              src: frontPreview,
                              title: 'Front ID Preview',
                              rotation: frontRotation,
                            });
                          }}
                          className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer shadow-md"
                          title="Zoom / Inspect"
                        >
                          <Maximize2 size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* PDF Document Preview Card */
                    <div
                      onClick={() => {
                        if (frontPreview) window.open(frontPreview, '_blank');
                      }}
                      className="relative group rounded-2xl p-5 sm:p-6 border-2 border-[#1A6B3C]/50 dark:border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer hover:border-[#1A6B3C] dark:hover:border-emerald-400 transition-all shadow-xs"
                      title="Click to open / view PDF in new tab"
                    >
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 shadow-xs">
                          <FileText size={28} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                              PDF Document
                            </span>
                            <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
                              {formatFileSize(frontFile.size)}
                            </span>
                          </div>
                          <p className="font-jakarta text-sm font-bold text-gray-900 dark:text-white mt-1 truncate max-w-xs">
                            {frontFile.name}
                          </p>
                          <p className="font-jakarta text-xs text-emerald-700 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                            <ExternalLink size={12} /> Click to preview / open PDF
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            if (frontInputRef.current) {
                              frontInputRef.current.value = '';
                              frontInputRef.current.click();
                            }
                          }}
                          className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-[#1f2937] border border-gray-200 dark:border-white/10 hover:bg-gray-50 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer shadow-2xs"
                        >
                          Replace
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs font-jakarta text-gray-500">
                    <div className="flex items-center gap-1.5 truncate max-w-[240px]">
                      <CheckCircle2 size={14} className="text-[#1A6B3C] dark:text-emerald-400 shrink-0" />
                      <span className="truncate text-gray-700 dark:text-gray-300 font-medium">{frontFile.name}</span>
                      <span className="text-[11px] text-gray-400 shrink-0">({formatFileSize(frontFile.size)})</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (frontInputRef.current) {
                            frontInputRef.current.value = '';
                            frontInputRef.current.click();
                          }
                        }}
                        className="text-[#1A6B3C] dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                      >
                        Change photo
                      </button>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFrontFile(null);
                          setFrontPreview(null);
                          setFrontRotation(0);
                          if (frontInputRef.current) frontInputRef.current.value = '';
                        }}
                        className="text-red-500 hover:text-red-600 dark:hover:text-red-400 font-semibold cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (frontInputRef.current) {
                      frontInputRef.current.value = '';
                      frontInputRef.current.click();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (frontInputRef.current) {
                        frontInputRef.current.value = '';
                        frontInputRef.current.click();
                      }
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFrontFileChange(file);
                  }}
                  className="border-2 border-dashed border-[#1A6B3C]/30 dark:border-white/20 hover:border-[#1A6B3C] dark:hover:border-emerald-400 rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-3 cursor-pointer bg-gray-50/50 dark:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A6B3C]/40"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#1A6B3C]/10 dark:bg-white/10 flex items-center justify-center text-[#1A6B3C] dark:text-emerald-400">
                    <Upload size={24} />
                  </div>
                  <div>
                    <p className="font-fraunces text-base font-bold text-gray-900 dark:text-white">
                      Upload Front ID or COR
                    </p>
                    <p className="font-jakarta text-xs text-gray-500 mt-1">
                      Drag and drop image or click anywhere in this box to browse
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-gray-400">JPG, PNG, WEBP or PDF · Up to 10MB</span>
                </div>
              )}

              {/* Guidelines */}
              <div className="p-4 rounded-2xl bg-[#F7F4EF] dark:bg-white/5 border border-[#1A6B3C]/10 dark:border-white/10 text-xs font-jakarta text-gray-600 dark:text-gray-300 space-y-1.5">
                <p className="font-bold text-gray-900 dark:text-white">Verification Guidelines:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-500 dark:text-gray-400">
                  <li>Place ID flat on an even, well-lit surface</li>
                  <li>Avoid camera flash glare, shadows, and blurry edges</li>
                  <li>Ensure your full name, student number, and photo are clear</li>
                  <li>Certificate of Registration (COR) accepted if ID is not yet issued</li>
                </ul>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIdSubStep('none')}
                  className="w-1/3 py-4 rounded-full border border-gray-300 dark:border-white/10 text-xs font-mono uppercase font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!frontFile}
                  onClick={() => setIdSubStep('back')}
                  className="flex-1 bg-[#1A6B3C] dark:bg-emerald-600 text-white font-mono text-xs uppercase tracking-wider font-bold py-4 rounded-full hover:bg-[#14532D] dark:hover:bg-emerald-500 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <span>Next: Back Side</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              STUDENT ID SUB-FLOW: BACK SIDE (Optional)
             ========================================================================= */}
          {!showOtpView && idSubStep === 'back' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-[#1A6B3C]/10 text-[#1A6B3C] dark:text-emerald-400">
                  Step 2 of 2 • Back Side (Optional)
                </span>
                <button
                  type="button"
                  onClick={() => setIdSubStep('review')}
                  className="text-xs font-mono font-bold text-[#1A6B3C] dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Skip this step →
                </button>
              </div>

              <input
                ref={backInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onClick={(e) => {
                  (e.target as HTMLInputElement).value = '';
                }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleBackFileChange(file);
                }}
              />

              {backFile && backPreview ? (
                <div className="space-y-3">
                  {isImageFile(backFile) ? (
                    <div
                      onClick={() =>
                        setEnlargedImage({
                          src: backPreview,
                          title: 'Back ID Preview',
                          rotation: backRotation,
                        })
                      }
                      className="relative rounded-2xl overflow-hidden border-2 border-[#1A6B3C] bg-black/5 flex items-center justify-center min-h-[220px] cursor-pointer group shadow-xs"
                      title="Click to zoom / inspect photo"
                    >
                      <img
                        src={backPreview}
                        alt="Back ID Preview"
                        style={{ transform: `rotate(${backRotation}deg)` }}
                        className="max-h-64 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                      />
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-semibold backdrop-blur-[1px] pointer-events-none">
                        <Maximize2 size={16} />
                        <span>Click anywhere to inspect & zoom</span>
                      </div>
                      <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBackRotation((r) => (r + 90) % 360);
                          }}
                          className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer shadow-md"
                          title="Rotate 90 degrees"
                        >
                          <RotateCw size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEnlargedImage({
                              src: backPreview,
                              title: 'Back ID Preview',
                              rotation: backRotation,
                            });
                          }}
                          className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer shadow-md"
                          title="Zoom / Inspect"
                        >
                          <Maximize2 size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* PDF Document Preview Card */
                    <div
                      onClick={() => {
                        if (backPreview) window.open(backPreview, '_blank');
                      }}
                      className="relative group rounded-2xl p-5 sm:p-6 border-2 border-[#1A6B3C]/50 dark:border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer hover:border-[#1A6B3C] dark:hover:border-emerald-400 transition-all shadow-xs"
                      title="Click to open / view PDF in new tab"
                    >
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 shadow-xs">
                          <FileText size={28} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                              PDF Document
                            </span>
                            <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
                              {formatFileSize(backFile.size)}
                            </span>
                          </div>
                          <p className="font-jakarta text-sm font-bold text-gray-900 dark:text-white mt-1 truncate max-w-xs">
                            {backFile.name}
                          </p>
                          <p className="font-jakarta text-xs text-emerald-700 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                            <ExternalLink size={12} /> Click to preview / open PDF
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            if (backInputRef.current) {
                              backInputRef.current.value = '';
                              backInputRef.current.click();
                            }
                          }}
                          className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-[#1f2937] border border-gray-200 dark:border-white/10 hover:bg-gray-50 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer shadow-2xs"
                        >
                          Replace
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs font-jakarta text-gray-500">
                    <div className="flex items-center gap-1.5 truncate max-w-[240px]">
                      <CheckCircle2 size={14} className="text-[#1A6B3C] dark:text-emerald-400 shrink-0" />
                      <span className="truncate text-gray-700 dark:text-gray-300 font-medium">{backFile.name}</span>
                      <span className="text-[11px] text-gray-400 shrink-0">({formatFileSize(backFile.size)})</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (backInputRef.current) {
                            backInputRef.current.value = '';
                            backInputRef.current.click();
                          }
                        }}
                        className="text-[#1A6B3C] dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                      >
                        Change photo
                      </button>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <button
                        type="button"
                        onClick={() => {
                          setBackFile(null);
                          setBackPreview(null);
                          setBackRotation(0);
                          if (backInputRef.current) backInputRef.current.value = '';
                        }}
                        className="text-red-500 hover:text-red-600 dark:hover:text-red-400 font-semibold cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (backInputRef.current) {
                      backInputRef.current.value = '';
                      backInputRef.current.click();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (backInputRef.current) {
                        backInputRef.current.value = '';
                        backInputRef.current.click();
                      }
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleBackFileChange(file);
                  }}
                  className="border-2 border-dashed border-[#1A6B3C]/30 dark:border-white/20 hover:border-[#1A6B3C] dark:hover:border-emerald-400 rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-3 cursor-pointer bg-gray-50/50 dark:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A6B3C]/40"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#1A6B3C]/10 dark:bg-white/10 flex items-center justify-center text-[#1A6B3C] dark:text-emerald-400">
                    <Upload size={24} />
                  </div>
                  <div>
                    <p className="font-fraunces text-base font-bold text-gray-900 dark:text-white">
                      Upload Back of ID (Optional)
                    </p>
                    <p className="font-jakarta text-xs text-gray-500 mt-1">
                      If your student card has emergency contacts or barcode on the back
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-gray-400">JPG, PNG, WEBP or PDF · Up to 10MB</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIdSubStep('front')}
                  className="w-1/3 py-4 rounded-full border border-gray-300 dark:border-white/10 text-xs font-mono uppercase font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setIdSubStep('review')}
                  className="flex-1 bg-[#1A6B3C] dark:bg-emerald-600 text-white font-mono text-xs uppercase tracking-wider font-bold py-4 rounded-full hover:bg-[#14532D] dark:hover:bg-emerald-500 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{backFile ? 'Next: Review ID' : 'Skip & Review'}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              STUDENT ID SUB-FLOW: REVIEW & CONFIRM
             ========================================================================= */}
          {!showOtpView && idSubStep === 'review' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="font-fraunces text-xl font-bold text-gray-900 dark:text-white">
                  Confirm ID Photos
                </h3>
                <p className="font-jakarta text-xs text-gray-500 mt-1">
                  Please review your uploaded photos before proceeding to email verification.
                </p>
              </div>

              {/* Cards Side-by-Side or Stacked */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Front Card Review */}
                <div className="rounded-2xl border border-gray-200 dark:border-white/10 p-3 bg-gray-50 dark:bg-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-jakarta font-bold text-gray-700 dark:text-gray-300">
                    <span>Front Side</span>
                    <button
                      type="button"
                      onClick={() => setIdSubStep('front')}
                      className="text-[#1A6B3C] dark:text-emerald-400 hover:underline text-[11px] cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                  {frontFile && frontPreview && (
                    <div
                      onClick={() => {
                        if (isPdfFile(frontFile)) {
                          window.open(frontPreview, '_blank');
                        } else {
                          setEnlargedImage({ src: frontPreview, title: 'Front ID Preview', rotation: frontRotation });
                        }
                      }}
                      className="relative group rounded-xl overflow-hidden bg-black/10 flex items-center justify-center h-36 cursor-pointer border border-transparent hover:border-[#1A6B3C] dark:hover:border-emerald-500 transition-all shadow-2xs"
                      title="Click to inspect preview"
                    >
                      {isPdfFile(frontFile) ? (
                        <div className="flex flex-col items-center justify-center gap-1.5 p-3 text-center">
                          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center">
                            <FileText size={22} />
                          </div>
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate max-w-[140px]">
                            {frontFile.name}
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                            <ExternalLink size={10} /> View PDF
                          </span>
                        </div>
                      ) : (
                        <>
                          <img
                            src={frontPreview}
                            alt="Front ID"
                            style={{ transform: `rotate(${frontRotation}deg)` }}
                            className="h-full w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-[1px]">
                            <Maximize2 size={14} />
                            <span>Click to Inspect</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEnlargedImage({ src: frontPreview, title: 'Front ID Preview', rotation: frontRotation });
                            }}
                            className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white shadow-xs cursor-pointer"
                            title="Zoom / Inspect"
                          >
                            <Maximize2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Back Card Review (if any) */}
                <div className="rounded-2xl border border-gray-200 dark:border-white/10 p-3 bg-gray-50 dark:bg-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-jakarta font-bold text-gray-700 dark:text-gray-300">
                    <span>Back Side</span>
                    <button
                      type="button"
                      onClick={() => setIdSubStep('back')}
                      className="text-[#1A6B3C] dark:text-emerald-400 hover:underline text-[11px] cursor-pointer"
                    >
                      {backFile ? 'Change' : '+ Add Back'}
                    </button>
                  </div>
                  {backFile && backPreview ? (
                    <div
                      onClick={() => {
                        if (isPdfFile(backFile)) {
                          window.open(backPreview, '_blank');
                        } else {
                          setEnlargedImage({ src: backPreview, title: 'Back ID Preview', rotation: backRotation });
                        }
                      }}
                      className="relative group rounded-xl overflow-hidden bg-black/10 flex items-center justify-center h-36 cursor-pointer border border-transparent hover:border-[#1A6B3C] dark:hover:border-emerald-500 transition-all shadow-2xs"
                      title="Click to inspect preview"
                    >
                      {isPdfFile(backFile) ? (
                        <div className="flex flex-col items-center justify-center gap-1.5 p-3 text-center">
                          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center">
                            <FileText size={22} />
                          </div>
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate max-w-[140px]">
                            {backFile.name}
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                            <ExternalLink size={10} /> View PDF
                          </span>
                        </div>
                      ) : (
                        <>
                          <img
                            src={backPreview}
                            alt="Back ID"
                            style={{ transform: `rotate(${backRotation}deg)` }}
                            className="h-full w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-[1px]">
                            <Maximize2 size={14} />
                            <span>Click to Inspect</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEnlargedImage({ src: backPreview, title: 'Back ID Preview', rotation: backRotation });
                            }}
                            className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white shadow-xs cursor-pointer"
                            title="Zoom / Inspect"
                          >
                            <Maximize2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div
                      onClick={() => setIdSubStep('back')}
                      className="h-36 rounded-xl border border-dashed border-gray-300 dark:border-white/10 hover:border-[#1A6B3C] dark:hover:border-emerald-500 flex flex-col items-center justify-center text-center p-3 cursor-pointer transition-colors"
                    >
                      <p className="font-jakarta text-xs text-gray-400">Back side skipped</p>
                      <span className="mt-1 text-[11px] font-mono text-[#1A6B3C] dark:text-emerald-400 font-bold hover:underline">
                        + Upload photo
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Encryption notice */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-[#E8F5EE] dark:bg-emerald-950/30 border border-[#1A6B3C]/15 dark:border-emerald-500/20 text-xs font-jakarta text-[#1A6B3C] dark:text-emerald-300">
                <Shield className="w-4 h-4 mt-0.5 shrink-0" />
                <p>
                  Bank-grade encrypted storage. Only verified CHMSU campus administrators can view your ID for enrollment verification.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIdSubStep('back')}
                  className="w-1/3 py-4 rounded-full border border-gray-300 dark:border-white/10 text-xs font-mono uppercase font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmIdAndCreateAccount}
                  className="flex-1 bg-[#1A6B3C] dark:bg-emerald-600 text-white font-mono text-xs uppercase tracking-wider font-bold py-4 rounded-full hover:bg-[#14532D] dark:hover:bg-emerald-500 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Confirm & Send Code</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 1: BASIC INFO FORM
             ========================================================================= */}
          {!showOtpView && idSubStep === 'none' && step === 1 && (
            <div className="space-y-5">
              {/* Account Type Banner */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-white/5 border border-[#1A6B3C]/10 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1A6B3C]/10 dark:bg-emerald-950/50 flex items-center justify-center text-[#1A6B3C] dark:text-emerald-400">
                    {emailType === 'chmsu' ? <GraduationCap size={16} /> : <FileCheck size={16} />}
                  </div>
                  <div>
                    <p className="font-fraunces text-xs font-bold text-gray-900 dark:text-white">
                      {emailType === 'chmsu' ? 'CHMSU Student Account' : 'Personal Email Account'}
                    </p>
                    <p className="font-mono text-[10px] text-gray-500">
                      {emailType === 'chmsu' ? 'Instant @chmsu.edu.ph verification' : 'Student ID verification required'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPhase('select-email')}
                  className="text-xs font-mono uppercase font-bold text-[#1A6B3C] dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Change
                </button>
              </div>

              {/* Username Input */}
              <div>
                <label className="block font-jakarta text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">@</span>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => {
                      setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s+/g, '') });
                      setErrors((prev) => ({ ...prev, username: '' }));
                    }}
                    placeholder="maria_santos"
                    className={cn(
                      'w-full pl-9 pr-4 py-3.5 rounded-2xl border font-jakarta text-sm outline-none transition-all',
                      errors.username
                        ? 'border-red-300 bg-red-50/50 text-red-900 dark:bg-red-950/20'
                        : 'border-gray-200 dark:border-white/10 focus:border-[#1A6B3C] dark:focus:border-emerald-500 bg-gray-50/50 dark:bg-white/5 text-gray-900 dark:text-white'
                    )}
                  />
                </div>
                {errors.username && <p className="text-red-500 text-xs mt-1 font-jakarta">{errors.username}</p>}
              </div>

              {/* Email Address */}
              <div>
                <label className="block font-jakarta text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                  {emailType === 'chmsu' ? 'CHMSU Student Email' : 'Personal Email Address'}
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    setErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  placeholder={emailType === 'chmsu' ? 'name@chmsu.edu.ph' : 'name@gmail.com'}
                  className={cn(
                    'w-full px-4 py-3.5 rounded-2xl border font-jakarta text-sm outline-none transition-all',
                    errors.email
                      ? 'border-red-300 bg-red-50/50 text-red-900 dark:bg-red-950/20'
                      : 'border-gray-200 dark:border-white/10 focus:border-[#1A6B3C] dark:focus:border-emerald-500 bg-gray-50/50 dark:bg-white/5 text-gray-900 dark:text-white'
                  )}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1 font-jakarta">{errors.email}</p>}
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-jakarta text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => {
                        setForm({ ...form, password: e.target.value });
                        setErrors((prev) => ({ ...prev, password: '' }));
                      }}
                      placeholder="••••••••"
                      className={cn(
                        'w-full px-4 pr-11 py-3.5 rounded-2xl border font-jakarta text-sm outline-none transition-all',
                        errors.password
                          ? 'border-red-300 bg-red-50/50 text-red-900 dark:bg-red-950/20'
                          : 'border-gray-200 dark:border-white/10 focus:border-[#1A6B3C] dark:focus:border-emerald-500 bg-gray-50/50 dark:bg-white/5 text-gray-900 dark:text-white'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1 font-jakarta">{errors.password}</p>}
                </div>

                <div>
                  <label className="block font-jakarta text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={(e) => {
                        setForm({ ...form, confirmPassword: e.target.value });
                        setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                      }}
                      placeholder="••••••••"
                      className={cn(
                        'w-full px-4 pr-11 py-3.5 rounded-2xl border font-jakarta text-sm outline-none transition-all',
                        errors.confirmPassword
                          ? 'border-red-300 bg-red-50/50 text-red-900 dark:bg-red-950/20'
                          : 'border-gray-200 dark:border-white/10 focus:border-[#1A6B3C] dark:focus:border-emerald-500 bg-gray-50/50 dark:bg-white/5 text-gray-900 dark:text-white'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1 font-jakarta">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleNextFromStep1}
                className="w-full mt-4 bg-[#1A6B3C] dark:bg-emerald-600 text-white font-mono text-xs uppercase tracking-wider font-bold py-4 rounded-full hover:bg-[#14532D] dark:hover:bg-emerald-500 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{emailType === 'external' ? 'Continue to Student ID' : 'Create & Verify Email'}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="text-center pt-2 text-xs font-jakarta text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-[#1A6B3C] dark:text-emerald-400 hover:underline">
                  Sign in →
                </Link>
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 2: ACADEMIC DETAILS
             ========================================================================= */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Department Selection */}
              <div>
                <label className="block font-jakarta text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                  College / Department
                </label>
                <select
                  value={form.department}
                  onChange={(e) => {
                    const dept = e.target.value;
                    setForm({ ...form, department: dept, course: '' });
                    setErrors((prev) => ({ ...prev, department: '', course: '' }));
                  }}
                  className={cn(
                    'w-full px-4 py-3.5 rounded-2xl border font-jakarta text-sm outline-none transition-all cursor-pointer appearance-none bg-no-repeat bg-[right_1rem_center]',
                    errors.department
                      ? 'border-red-300 bg-red-50/50'
                      : 'border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 text-gray-900 dark:text-white focus:border-[#1A6B3C]'
                  )}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                {errors.department && <p className="text-red-500 text-xs mt-1 font-jakarta">{errors.department}</p>}
              </div>

              {/* Course Selection (filtered) */}
              <div>
                <label className="block font-jakarta text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                  Academic Course
                </label>
                <select
                  disabled={!form.department}
                  value={form.course}
                  onChange={(e) => {
                    setForm({ ...form, course: e.target.value });
                    setErrors((prev) => ({ ...prev, course: '' }));
                  }}
                  className={cn(
                    'w-full px-4 py-3.5 rounded-2xl border font-jakarta text-sm outline-none transition-all cursor-pointer appearance-none',
                    errors.course
                      ? 'border-red-300 bg-red-50/50'
                      : 'border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 text-gray-900 dark:text-white focus:border-[#1A6B3C]',
                    !form.department && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <option value="">
                    {form.department ? 'Select Course' : 'Select a department first'}
                  </option>
                  {currentCourses.map((crs) => (
                    <option key={crs} value={crs}>
                      {crs}
                    </option>
                  ))}
                </select>
                {errors.course && <p className="text-red-500 text-xs mt-1 font-jakarta">{errors.course}</p>}
              </div>

              {/* Year Level */}
              <div>
                <label className="block font-jakarta text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                  Year Level
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {yearLevels.map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => {
                        setForm({ ...form, yearLevel: yr });
                        setErrors((prev) => ({ ...prev, yearLevel: '' }));
                      }}
                      className={cn(
                        'py-3 px-3 rounded-xl border text-xs font-jakarta font-bold transition-all text-center cursor-pointer',
                        form.yearLevel === yr
                          ? 'border-[#1A6B3C] bg-[#1A6B3C] text-white shadow-xs'
                          : 'border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                      )}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
                {errors.yearLevel && <p className="text-red-500 text-xs mt-1 font-jakarta">{errors.yearLevel}</p>}
              </div>

              {/* Campus Organizations */}
              <div className="pt-2 border-t border-gray-100 dark:border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <label className="block font-jakarta text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Campus Organizations <span className="font-normal text-gray-400 lowercase">(optional)</span>
                  </label>
                  {form.organizations.length > 0 && (
                    <span className="text-[11px] font-mono text-[#1A6B3C] dark:text-emerald-400 font-bold">
                      {form.organizations.length} joined
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                  {organizations.map((org) => {
                    const isSelected = form.organizations.includes(org);
                    return (
                      <button
                        key={org}
                        type="button"
                        onClick={() => toggleOrg(org)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-jakarta font-medium border transition-all flex items-center gap-1.5 cursor-pointer',
                          isSelected
                            ? 'border-[#1A6B3C] bg-[#1A6B3C]/10 text-[#1A6B3C] dark:text-emerald-300 font-bold'
                            : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                        )}
                      >
                        {isSelected ? <Check size={13} strokeWidth={2.5} /> : <Plus size={13} />}
                        <span>{org}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Next Button */}
              <button
                type="button"
                onClick={() => {
                  if (validateStep2()) setStep(3);
                }}
                className="w-full mt-4 bg-[#1A6B3C] dark:bg-emerald-600 text-white font-mono text-xs uppercase tracking-wider font-bold py-4 rounded-full hover:bg-[#14532D] dark:hover:bg-emerald-500 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue to Interests</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* =========================================================================
              STEP 3: PASSIONS & INTERESTS
             ========================================================================= */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {['all', 'Technology', 'Arts & Culture', 'Sports & Fitness', 'Academic', 'Lifestyle'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider font-bold shrink-0 transition-all cursor-pointer',
                      activeCategory === cat
                        ? 'bg-[#1A6B3C] text-white'
                        : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={interestSearch}
                  onChange={(e) => setInterestSearch(e.target.value)}
                  placeholder="Search interests..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 font-jakarta text-xs outline-none focus:border-[#1A6B3C]"
                />
              </div>

              {/* Interest Tag Cloud */}
              <div className="p-1 max-h-56 overflow-y-auto custom-scrollbar flex flex-wrap gap-2">
                {filteredInterests.map(({ label, color }) => {
                  const isSelected = form.interests.includes(label);
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleInterest(label)}
                      style={{
                        borderColor: isSelected ? '#1A6B3C' : undefined,
                        backgroundColor: isSelected ? '#1A6B3C' : undefined,
                      }}
                      className={cn(
                        'px-3.5 py-2 rounded-full text-xs font-jakarta font-medium border transition-all flex items-center gap-1.5 cursor-pointer',
                        isSelected
                          ? 'text-white shadow-xs'
                          : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-200 hover:border-gray-300'
                      )}
                    >
                      {isSelected && <Check size={13} strokeWidth={2.5} />}
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Interest Input */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
                <input
                  type="text"
                  value={customInterest}
                  onChange={(e) => setCustomInterest(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustomInterest()}
                  placeholder="Add custom passion or hobby..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 font-jakarta text-xs outline-none focus:border-[#1A6B3C]"
                />
                <button
                  type="button"
                  onClick={handleAddCustomInterest}
                  className="px-4 py-2.5 rounded-xl bg-[#1A6B3C] text-white font-mono text-xs uppercase font-bold hover:bg-[#14532D] transition-colors cursor-pointer"
                >
                  Add
                </button>
              </div>

              {/* Selected Count & Error */}
              <div className="flex items-center justify-between text-xs font-jakarta pt-1">
                <span className="text-gray-500">
                  Selected:{' '}
                  <strong className={form.interests.length >= 3 ? 'text-[#1A6B3C] dark:text-emerald-400' : 'text-amber-600'}>
                    {form.interests.length}
                  </strong>{' '}
                  (minimum 3 required)
                </span>
                {errors.interests && <span className="text-red-500 font-medium">{errors.interests}</span>}
              </div>

              {/* Next Button */}
              <button
                type="button"
                disabled={form.interests.length < 3}
                onClick={() => {
                  if (validateStep3()) setStep(4);
                }}
                className="w-full mt-2 bg-[#1A6B3C] dark:bg-emerald-600 text-white font-mono text-xs uppercase tracking-wider font-bold py-4 rounded-full hover:bg-[#14532D] dark:hover:bg-emerald-500 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <span>Continue to Avatar & Bio</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* =========================================================================
              STEP 4: AVATAR & BIO
             ========================================================================= */}
          {step === 4 && (
            <div className="space-y-6">
              {/* Avatar Selector Tabs */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block font-jakarta text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Choose Profile Avatar
                  </label>
                  <div className="flex rounded-lg bg-gray-100 dark:bg-white/10 p-0.5 text-[11px] font-mono font-bold">
                    <button
                      type="button"
                      onClick={() => setAvatarTab('presets')}
                      className={cn(
                        'px-2.5 py-1 rounded-md transition-colors cursor-pointer',
                        avatarTab === 'presets' ? 'bg-white dark:bg-[#111827] text-[#1A6B3C] dark:text-emerald-400 shadow-xs' : 'text-gray-500'
                      )}
                    >
                      Emoji
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvatarTab('custom')}
                      className={cn(
                        'px-2.5 py-1 rounded-md transition-colors cursor-pointer',
                        avatarTab === 'custom' ? 'bg-white dark:bg-[#111827] text-[#1A6B3C] dark:text-emerald-400 shadow-xs' : 'text-gray-500'
                      )}
                    >
                      Photo Upload
                    </button>
                  </div>
                </div>

                {avatarTab === 'presets' ? (
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 p-2 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                    {AVATAR_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setForm({ ...form, avatar: emoji })}
                        className={cn(
                          'w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all cursor-pointer',
                          form.avatar === emoji
                            ? 'bg-[#1A6B3C] text-white shadow-md scale-110'
                            : 'hover:bg-white dark:hover:bg-white/10'
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onClick={(e) => {
                        (e.target as HTMLInputElement).value = '';
                      }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setCustomAvatarFile(file);
                          const url = URL.createObjectURL(file);
                          setCustomAvatarPreview(url);
                          setForm({ ...form, avatar: url });
                        }
                      }}
                    />

                    {customAvatarPreview ? (
                      <div className="flex items-center gap-4 p-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                        <div
                          onClick={() =>
                            setEnlargedImage({
                              src: customAvatarPreview,
                              title: 'Profile Photo Preview',
                              rotation: 0,
                            })
                          }
                          className="relative group cursor-pointer shrink-0"
                          title="Click to inspect photo"
                        >
                          <img
                            src={customAvatarPreview}
                            alt="Custom Avatar"
                            className="w-16 h-16 rounded-full object-cover border-2 border-[#1A6B3C] group-hover:scale-105 transition-transform shadow-xs"
                          />
                          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <Maximize2 size={15} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 text-xs font-jakarta">
                          <p className="font-bold text-gray-800 dark:text-white truncate">
                            Custom photo selected
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                            {customAvatarFile?.name || 'Uploaded photo'}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (avatarInputRef.current) {
                                  avatarInputRef.current.value = '';
                                  avatarInputRef.current.click();
                                }
                              }}
                              className="text-[#1A6B3C] dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                            >
                              Change photo
                            </button>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <button
                              type="button"
                              onClick={() => {
                                setCustomAvatarPreview(null);
                                setCustomAvatarFile(null);
                                setForm((prev) => ({ ...prev, avatar: '😊' }));
                                if (avatarInputRef.current) avatarInputRef.current.value = '';
                              }}
                              className="text-red-500 hover:underline font-semibold cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          if (avatarInputRef.current) {
                            avatarInputRef.current.value = '';
                            avatarInputRef.current.click();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            if (avatarInputRef.current) {
                              avatarInputRef.current.value = '';
                              avatarInputRef.current.click();
                            }
                          }
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files?.[0];
                          if (file && file.type.startsWith('image/')) {
                            setCustomAvatarFile(file);
                            const url = URL.createObjectURL(file);
                            setCustomAvatarPreview(url);
                            setForm({ ...form, avatar: url });
                          }
                        }}
                        className="w-full py-6 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-[#1A6B3C] dark:hover:border-emerald-400 flex flex-col items-center justify-center gap-2 cursor-pointer bg-gray-50 dark:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A6B3C]/40"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#1A6B3C]/10 dark:bg-emerald-500/10 text-[#1A6B3C] dark:text-emerald-400 flex items-center justify-center">
                          <Camera size={20} />
                        </div>
                        <span className="font-jakarta text-xs font-semibold text-gray-700 dark:text-gray-300">
                          Upload profile photo
                        </span>
                        <span className="text-[11px] font-mono text-gray-400">Click or drop image here · JPG, PNG up to 5MB</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bio Textarea */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block font-jakarta text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Intro / Bio <span className="font-normal text-gray-400 lowercase">(optional)</span>
                  </label>
                  <span className="text-[11px] font-mono text-gray-400">{form.bio.length}/250</span>
                </div>
                <textarea
                  rows={3}
                  maxLength={250}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Tell campus allies a bit about yourself, your favorite projects, or what you enjoy doing..."
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 font-jakarta text-sm outline-none focus:border-[#1A6B3C] resize-none"
                />
              </div>

              {/* Agreements */}
              <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-white/10">
                <label className="flex items-start gap-2.5 text-xs font-jakarta cursor-pointer text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => {
                      setAgreedToTerms(e.target.checked);
                      setErrors((prev) => ({ ...prev, terms: '' }));
                    }}
                    className="mt-0.5 rounded text-[#1A6B3C] focus:ring-[#1A6B3C]"
                  />
                  <span>
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveModal('terms');
                      }}
                      className="font-bold text-[#1A6B3C] dark:text-emerald-400 underline cursor-pointer"
                    >
                      Terms & Conditions
                    </button>
                  </span>
                </label>
                {errors.terms && <p className="text-red-500 text-xs font-jakarta">{errors.terms}</p>}

                <label className="flex items-start gap-2.5 text-xs font-jakarta cursor-pointer text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={agreedToPrivacy}
                    onChange={(e) => {
                      setAgreedToPrivacy(e.target.checked);
                      setErrors((prev) => ({ ...prev, privacy: '' }));
                    }}
                    className="mt-0.5 rounded text-[#1A6B3C] focus:ring-[#1A6B3C]"
                  />
                  <span>
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveModal('privacy');
                      }}
                      className="font-bold text-[#1A6B3C] dark:text-emerald-400 underline cursor-pointer"
                    >
                      Campus Privacy Policy
                    </button>
                  </span>
                </label>
                {errors.privacy && <p className="text-red-500 text-xs font-jakarta">{errors.privacy}</p>}
              </div>

              {/* Finish Button */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCompleteRegistration}
                className="w-full mt-4 bg-[#1A6B3C] dark:bg-emerald-600 text-white font-mono text-xs uppercase tracking-wider font-bold py-4 rounded-full hover:bg-[#14532D] dark:hover:bg-emerald-500 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Complete Registration</span>
                    <Check size={16} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ── IMAGE ENLARGE / ZOOM MODAL ── */}
      <AnimatePresence>
        {enlargedImage && (
          <div
            onClick={() => setEnlargedImage(null)}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl max-h-[90vh] w-full bg-[#111827] rounded-3xl p-5 sm:p-6 flex flex-col items-center cursor-default border border-white/10 shadow-2xl"
            >
              {/* Modal Header */}
              <div className="w-full flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-white font-fraunces text-lg font-bold">{enlargedImage.title}</h4>
                  <span className="text-xs font-mono text-gray-400">
                    ({enlargedImage.rotation}° rotation)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const nextRot = (enlargedImage.rotation + 90) % 360;
                      if (enlargedImage.title.toLowerCase().includes('front')) {
                        setFrontRotation(nextRot);
                      } else if (enlargedImage.title.toLowerCase().includes('back')) {
                        setBackRotation(nextRot);
                      }
                      setEnlargedImage((prev) => (prev ? { ...prev, rotation: nextRot } : null));
                    }}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                    title="Rotate 90 degrees"
                  >
                    <RotateCw size={15} />
                    <span>Rotate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnlargedImage(null)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
                    title="Close preview (Esc)"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Modal Image Body */}
              <div className="flex-1 overflow-auto flex items-center justify-center min-h-[300px] w-full bg-black/40 rounded-2xl p-4">
                <img
                  src={enlargedImage.src}
                  alt={enlargedImage.title}
                  style={{ transform: `rotate(${enlargedImage.rotation}deg)` }}
                  className="max-h-[68vh] w-auto max-w-full object-contain rounded-xl shadow-lg transition-transform duration-200"
                />
              </div>

              <div className="w-full flex items-center justify-between text-xs font-jakarta text-gray-400 mt-3 pt-2 border-t border-white/5">
                <span>Tip: Click outside or press Esc to close</span>
                <button
                  type="button"
                  onClick={() => setEnlargedImage(null)}
                  className="text-white hover:text-emerald-400 font-semibold cursor-pointer"
                >
                  Close preview ✕
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── LEGAL POLICY MODALS ── */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-lg w-full bg-white dark:bg-[#111827] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-white/10 shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/10">
                <h3 className="font-fraunces text-xl font-bold text-gray-900 dark:text-white">
                  {activeModal === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 text-xs font-jakarta text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line custom-scrollbar">
                {activeModal === 'terms' ? TERMS_TEXT : PRIVACY_TEXT}
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="w-full py-3 bg-[#1A6B3C] dark:bg-emerald-600 text-white font-mono text-xs uppercase tracking-wider font-bold rounded-full hover:bg-[#14532D] cursor-pointer"
                >
                  Close & Continue
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── FOOTER ── */}
      <footer className="py-6 border-t border-[#1A6B3C]/10 dark:border-white/10 text-center text-xs font-jakarta text-gray-500">
        Carlos Hilado Memorial State University · Alijis Campus · Ally-jis
      </footer>
    </div>
  );
}
