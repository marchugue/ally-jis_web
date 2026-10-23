import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient, isApiConfigured } from '@/api/client';
import { supabase } from '@/lib/supabase';
import type { PresetAvatarRow, AuthSession } from '@/api/types';

import {
  getWebRegisterCache,
  saveWebRegisterCache,
  clearWebRegisterCache,
  fileToDataUrl,
  dataUrlToFile,
  rotateImageFile,
} from '@/lib/registerCache';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import { profileService } from '@/lib/services/profileService';
import { useLookupOptions } from '@/hooks/useLookupOptions';
import { notify } from '@/components/ui/sonner';
import { useAuth } from '@/context/AuthContext';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { AnonymousAvatar } from '@/components/match/AnonymousAvatar';
import { ANIMAL_KEYS } from '@/lib/matchOptions';
import { COURSES_BY_DEPT, DEPARTMENTS, YEAR_LEVELS, ORGANIZATIONS } from '@/data/mockData';

// ── Interest Emoji Mapping ───────────────────────────────────────────────────
const INTEREST_EMOJIS: Record<string, string> = {
  // Technology
  'Coding': '💻',
  'Web Design': '🎨',
  'AI & ML': '🤖',
  'Cybersecurity': '🛡️',
  'Game Dev': '🎮',
  'Robotics': '🦾',
  'Web Dev': '🌐',
  'Mobile Dev': '📱',

  // Arts & Culture
  'Photography': '📸',
  'Drawing': '✏️',
  'Music': '🎵',
  'Dancing': '💃',
  'Filmmaking': '🎬',
  'Creative Writing': '✍️',
  'Film': '🎥',
  'Writing': '📝',
  'Theater': '🎭',

  // Nature
  'Hiking': '🥾',
  'Environment': '🌿',
  'Gardening': '🌱',
  'Camping': '⛺',
  'Bird Watching': '🦅',

  // Sports & Fitness
  'Basketball': '🏀',
  'Volleyball': '🏐',
  'Swimming': '🏊',
  'Badminton': '🏸',
  'Football': '⚽',
  'Fitness': '🏋️',
  'Running': '🏃',
  'Gym': '💪',

  // Leadership & Academic
  'Community Service': '🤝',
  'Student Gov': '🏛️',
  'Volunteering': '💖',
  'Debate': '🗣️',
  'Public Speaking': '🎤',
  'Research': '🔬',
  'Science': '🧪',
  'Math': '📐',
  'History': '📜',
  'Literature': '📖',

  // Lifestyle
  'Cooking': '🍳',
  'Reading': '📚',
  'Travel': '✈️',
  'Anime': '⛩️',
  'Gaming': '🕹️',
  'Fashion': '👗',
  'K-Pop': '🎧',
};

function getInterestEmoji(label: string): string {
  return INTEREST_EMOJIS[label] || '✨';
}

const TERMS_TEXT = `Welcome to Ally-jis! By creating an account or using our platform, you agree to follow these Terms & Conditions:

1. Campus Exclusive: Ally-jis is built exclusively for students of Carlos Hilado Memorial State University – Alijis Campus. When creating an account, you agree to provide accurate information and to use only your own verified student identity.
2. Respect & Community Standards: Treat fellow students with respect. Harassment, cyber-bullying, hate speech, sexual misconduct, impersonation, or distributing spam/malicious content will result in immediate suspension.
3. Student Verification: Students signing up with personal emails must upload a valid CHMSU Student ID or Certificate of Registration (COR). Forgery or submitting fake IDs is strictly prohibited and subject to university disciplinary review.
4. Privacy & Consent: Direct messaging and matching unlock only upon mutual consent. Respect peer boundaries at all times.
5. Account Responsibility: You are responsible for keeping your credentials confidential.

Official terms: https://ally-jis.com/terms`;

const PRIVACY_TEXT = `Privacy Policy for Ally-jis:

1. Campus Privacy Commitment: We collect only the data required to facilitate authentic campus connections and verify student credentials.
2. Information We Collect: Username, student or personal email, department, course, year level, profile photo/avatar, bio, campus organizations, and selected interest tags.
3. ID Verification Data: Student ID and COR images uploaded by personal-email users are encrypted and accessible only to authorized university campus administrators for enrollment verification. They are never shared publicly or sold.
4. Matching & Chat Privacy: Your profile is visible only to verified CHMSU Alijis students. We never sell your personal data or share it with third-party advertisers.
5. Your Rights: You can edit your profile details, update interests, or request account deletion at any time.

Official privacy policy: https://ally-jis.com/privacy`;

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


export interface EmailAnalysis {
  isChmsu: boolean;
  isExternal: boolean;
  isTypo: boolean;
  typoMessage?: string;
  suggestedEmail?: string;
}

export const analyzeEmail = (rawEmail: string): EmailAnalysis => {
  const clean = rawEmail.trim().toLowerCase();
  if (!clean || !clean.includes('@')) {
    return { isChmsu: false, isExternal: false, isTypo: false };
  }

  const atIndex = clean.lastIndexOf('@');
  const localPart = clean.substring(0, atIndex);
  const domain = clean.substring(atIndex + 1);

  if (!domain) {
    return { isChmsu: false, isExternal: false, isTypo: false };
  }

  // Exact CHMSU institutional domain
  if (domain === 'chmsu.edu.ph') {
    return { isChmsu: true, isExternal: false, isTypo: false };
  }

  // Any domain that ends in .edu.ph but is not chmsu.edu.ph
  if (domain.endsWith('.edu.ph')) {
    return {
      isChmsu: false,
      isExternal: false,
      isTypo: true,
      typoMessage: 'Did you mean @chmsu.edu.ph? Only CHMSU student accounts are supported for institutional registration.',
      suggestedEmail: `${localPart}@chmsu.edu.ph`,
    };
  }

  // Common CHMSU typos
  const chmsuTypos = [
    'chmsu.ph',
    'chmsu.edu',
    'chmsu.com',
    'chmsu.org',
    'chmsc.edu.ph',
    'chmsc.ph',
    'chmsc.edu',
    'cmsu.edu.ph',
    'cmsu.ph',
    'chmu.edu.ph',
    'chms.edu.ph',
    'chmsuedu.ph',
    'chmsu-edu.ph',
    'gmail.chmsu.edu.ph',
  ];

  if (chmsuTypos.includes(domain)) {
    return {
      isChmsu: false,
      isExternal: false,
      isTypo: true,
      typoMessage: 'Did you mean @chmsu.edu.ph?',
      suggestedEmail: `${localPart}@chmsu.edu.ph`,
    };
  }

  // Valid personal/external domain (e.g. gmail.com, yahoo.com, outlook.com)
  if (domain.includes('.')) {
    return { isChmsu: false, isExternal: true, isTypo: false };
  }

  return { isChmsu: false, isExternal: false, isTypo: false };
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, session, needsOnboarding, isPendingApproval, completeLogin, signOut } = useAuth();
  const { organizations, departments, coursesByDept, interestsByCategory, yearLevels } = useLookupOptions();


  // ── Navigation State (Always starts directly in form, email selection removed) ──
  const initialEmailType = (searchParams.get('emailType') as 'chmsu' | 'external') || 'chmsu';
  const startStepParam = Number(searchParams.get('startStep') || searchParams.get('step'));
  const hasInitialStep = startStepParam >= 2 && startStepParam <= 4;
  const startIdSubStepParam = searchParams.get('idSubStep') as 'front' | 'back' | 'review' | null;
  const isUploadIdRequested = searchParams.get('uploadId') === 'true' || searchParams.get('reupload') === '1' || Boolean(startIdSubStepParam);

  const [phase, setPhase] = useState<'form'>('form');
  const [emailType, setEmailType] = useState<'chmsu' | 'external'>(initialEmailType);
  const [step, setStep] = useState<number>(isUploadIdRequested ? 1 : (hasInitialStep ? startStepParam : 1));

  // External student ID sub-steps: 'front' | 'back' | 'review' | 'none'
  const [idSubStep, setIdSubStep] = useState<'none' | 'front' | 'back' | 'review'>(
    isUploadIdRequested ? (startIdSubStepParam || 'front') : 'none'
  );
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const pendingUserIdRef = useRef<string | null>(null);
  const isOtpVerifiedRef = useRef<boolean>(false);
  const formEmailRef = useRef<string>('');


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
    avatar: 'fox',
    bio: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Step 2 Academic Sub-Step ('username' | 'department' | 'course' | 'year' | 'organizations')
  const [academicSubStep, setAcademicSubStep] = useState<'username' | 'department' | 'course' | 'year' | 'organizations'>('username');
  const academicSubStepRef = useRef(academicSubStep);
  useEffect(() => {
    academicSubStepRef.current = academicSubStep;
  }, [academicSubStep]);

  // Step 2 Custom Year Level
  const [customYearInput, setCustomYearInput] = useState('');
  const [isCustomYear, setIsCustomYear] = useState(false);

  // Step 2 Campus Org Auto Suggestion
  const [orgSearchQuery, setOrgSearchQuery] = useState('');
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const orgDropdownRef = useRef<HTMLDivElement>(null);
  const orgInputRef = useRef<HTMLInputElement>(null);

  // Close org dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        orgDropdownRef.current &&
        !orgDropdownRef.current.contains(e.target as Node) &&
        orgInputRef.current &&
        !orgInputRef.current.contains(e.target as Node)
      ) {
        setIsOrgDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Step 3 custom interest state
  const [customInterest, setCustomInterest] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [interestSearch, setInterestSearch] = useState('');

  // Step 4 Avatar & Bio & Legal
  const [avatarTab, setAvatarTab] = useState<'presets' | 'emoji' | 'custom'>('presets');
  const [presetAvatars, setPresetAvatars] = useState<PresetAvatarRow[]>([]);
  const [isLoadingPresets, setIsLoadingPresets] = useState(false);
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string | null>(null);
  const [customAvatarFile, setCustomAvatarFile] = useState<File | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [activeModal, setActiveModal] = useState<'terms' | 'privacy' | null>(null);

  // Refs
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const interestListRef = useRef<HTMLDivElement>(null);

  // Load admin-curated preset avatars
  useEffect(() => {
    if (!isApiConfigured) return;
    setIsLoadingPresets(true);
    apiClient
      .getPresetAvatars()
      .then((res) => {
        if (res?.avatars) {
          setPresetAvatars(res.avatars);
        }
      })
      .catch((err) => {
        console.warn('Failed to load preset avatars:', err);
      })
      .finally(() => {
        setIsLoadingPresets(false);
      });
  }, []);

  // Onboarding & register are strictly light-mode only — ensure dark class is removed on mount
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }, []);

  // Forward any OAuth callback queries/hashes mistakenly landing on /register directly to /confirm
  useEffect(() => {
    const code = searchParams.get('code');
    const hash = window.location.hash.replace(/^#/, '');
    const hashParams = new URLSearchParams(hash);
    const hashAccessToken = hashParams.get('access_token');

    if (code || hashAccessToken) {
      navigate(`/confirm${window.location.search}${window.location.hash}`, { replace: true });
    }
  }, [searchParams, navigate]);

  // ── Route & Auth Guards ───────────────────────────────────────────────────
  // If user is already authenticated & onboarding is complete, redirect (unless uploading ID)
  useEffect(() => {
    if (session && !needsOnboarding && !hasInitialStep && !isUploadIdRequested) {
      navigate(isPendingApproval ? '/pending-approval' : '/dashboard', { replace: true });
    }
  }, [session, needsOnboarding, isPendingApproval, hasInitialStep, isUploadIdRequested, navigate]);

  // If user is already logged in but onboarding is incomplete, skip Step 1 (unless uploading ID)
  useEffect(() => {
    const activeUser = user || session?.user;
    if (activeUser && (needsOnboarding || hasInitialStep)) {
      const cached = getWebRegisterCache();
      const hasUploadedId = Boolean(
        activeUser.user_metadata?.student_id_url ||
        (activeUser as any)?.student_id_url ||
        cached?.frontPreviewDataUrl
      );

      if (!isUploadIdRequested || hasUploadedId) {
        setPhase('form');
        setStep((prev) => (prev === 1 ? 2 : prev));
        setIdSubStep('none');
        setAcademicSubStep((prev) => prev || 'username');
      }
      if (!registeredUserId) {
        setRegisteredUserId(activeUser.id);
      }
      const uName = (activeUser.user_metadata?.username as string) || '';
      const uEmail = activeUser.email || '';
      const emailAnalysis = analyzeEmail(uEmail);
      setEmailType(emailAnalysis.isChmsu ? 'chmsu' : 'external');
      setForm((prev) => ({
        ...prev,
        username: prev.username || uName,
        email: prev.email || uEmail,
        password: prev.password || 'AccountVerified1!',
      }));

      // If user has cached ID previews but not yet on server, auto-upload in background
      if (cached?.frontPreviewDataUrl && !activeUser.user_metadata?.student_id_url) {
        const front = dataUrlToFile(cached.frontPreviewDataUrl, 'student-id-front.jpg');
        if (front) {
          const rotation = cached.frontRotation || 0;
          rotateImageFile(front, rotation).then((rot) => {
            apiClient.uploadStudentId(activeUser.id, rot, 'front').catch((err) =>
              console.warn('[RegisterPage] Auto-upload front ID warning:', err)
            );
          });
        }
        if (cached.backPreviewDataUrl) {
          const back = dataUrlToFile(cached.backPreviewDataUrl, 'student-id-back.jpg');
          if (back) {
            const rotation = cached.backRotation || 0;
            rotateImageFile(back, rotation).then((rot) => {
              apiClient.uploadStudentId(activeUser.id, rot, 'back').catch((err) =>
                console.warn('[RegisterPage] Auto-upload back ID warning:', err)
              );
            });
          }
        }
      }
    }
  }, [user, session, needsOnboarding, hasInitialStep, isUploadIdRequested, registeredUserId]);

  // If user is already logged in and needs to upload student ID (e.g. from OAuth or pending-approval)
  useEffect(() => {
    const activeUser = user || session?.user;
    if (activeUser && isUploadIdRequested && !hasInitialStep) {
      const cached = getWebRegisterCache();
      const hasUploadedId = Boolean(
        activeUser.user_metadata?.student_id_url ||
        (activeUser as any)?.student_id_url ||
        cached?.frontPreviewDataUrl
      );
      if (hasUploadedId && needsOnboarding) {
        // ID is already present in cache or database — bypass uploadId and proceed straight to Step 2!
        setPhase('form');
        setStep(2);
        setIdSubStep('none');
        setAcademicSubStep('username');
        navigate('/register?step=2', { replace: true });
        return;
      }
      setPhase('form');
      setStep((prev) => (prev >= 2 ? prev : 1));
      setIdSubStep((prev) => (prev === 'none' ? 'front' : prev));
      if (!registeredUserId) {
        setRegisteredUserId(activeUser.id);
      }
      const uName = (activeUser.user_metadata?.username as string) || '';
      const uEmail = activeUser.email || '';
      const emailAnalysis = analyzeEmail(uEmail);
      setEmailType(emailAnalysis.isChmsu ? 'chmsu' : 'external');
      setForm((prev) => ({
        ...prev,
        username: prev.username || uName,
        email: prev.email || uEmail,
        password: prev.password || 'AccountVerified1!',
      }));
    }
  }, [user, session, isUploadIdRequested, hasInitialStep, registeredUserId, needsOnboarding, navigate]);

  // Handle escape key to dismiss modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (enlargedImage) closeEnlargedImage();
        if (activeModal) closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enlargedImage, activeModal]);

  // Reset interest tag cloud scroll position when filtering by category or search
  useEffect(() => {
    if (interestListRef.current) {
      interestListRef.current.scrollTop = 0;
    }
  }, [activeCategory, interestSearch]);

  // Scroll window to top when step changes so the user is positioned at the top of each onboarding step
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, idSubStep, showOtpView]);

  // Keep tracking refs in sync with state
  useEffect(() => {
    pendingUserIdRef.current = registeredUserId;
  }, [registeredUserId]);

  useEffect(() => {
    formEmailRef.current = form.email.trim().toLowerCase();
  }, [form.email]);

  // ── Verification & Form Cache Restoration ──────────────────────────────────
  // Restores registration progress, pending verification states, and ID previews
  // so refreshing or leaving the page does NOT cancel or lose progress.
  useEffect(() => {
    const cached = getWebRegisterCache();
    if (!cached) return;

    if (cached.showOtpView && cached.registeredUserId && !hasInitialStep) {
      // Validate with server if verification is still pending
      apiClient.getOtpStatus(cached.registeredUserId)
        .then((status) => {
          if (status.verified) {
            // Already verified: proceed to Step 2
            setPhase('form');
            setStep(cached.step > 1 ? cached.step : 2);
            setShowOtpView(false);
            if (cached.form) setForm((prev) => ({ ...prev, ...cached.form }));
          } else if (status.exists) {
            // Pending verification is active: restore OTP view seamlessly
            setPhase('form');
            setEmailType(cached.emailType || 'chmsu');
            setStep(cached.step || 1);
            setIdSubStep(cached.idSubStep || 'none');
            setRegisteredUserId(cached.registeredUserId);
            setShowOtpView(true);
            if (cached.otpDigits && Array.isArray(cached.otpDigits)) {
              setOtpDigits(cached.otpDigits);
            }
            if (cached.form) setForm((prev) => ({ ...prev, ...cached.form }));
            if (cached.frontPreviewDataUrl) {
              setFrontPreview(cached.frontPreviewDataUrl);
              const restoredFront = dataUrlToFile(cached.frontPreviewDataUrl, 'student-id-front.jpg');
              if (restoredFront) setFrontFile(restoredFront);
            }
            if (cached.backPreviewDataUrl) {
              setBackPreview(cached.backPreviewDataUrl);
              const restoredBack = dataUrlToFile(cached.backPreviewDataUrl, 'student-id-back.jpg');
              if (restoredBack) setBackFile(restoredBack);
            }
            if (cached.frontRotation) setFrontRotation(cached.frontRotation);
            if (cached.backRotation) setBackRotation(cached.backRotation);
          } else {
            // Expired on server, but preserve form data so user doesn't lose their input
            setPhase('form');
            setEmailType(cached.emailType || 'chmsu');
            setStep(1);
            setShowOtpView(false);
            if (cached.form) setForm((prev) => ({ ...prev, ...cached.form }));
          }
        })
        .catch(() => {
          // Network issue: restore cached state anyway
          setPhase('form');
          setEmailType(cached.emailType || 'chmsu');
          setStep(cached.step || 1);
          setIdSubStep(cached.idSubStep || 'none');
          setRegisteredUserId(cached.registeredUserId);
          setShowOtpView(true);
          if (cached.otpDigits) setOtpDigits(cached.otpDigits);
          if (cached.form) setForm((prev) => ({ ...prev, ...cached.form }));
        });
    } else {
      // Restore non-OTP progress (Step 1-4 form values, files, etc.)
      setPhase('form');
      if (cached.emailType && !searchParams.has('emailType')) setEmailType(cached.emailType);
      if (hasInitialStep) {
        setStep(startStepParam);
      } else if (!isUploadIdRequested && cached.step && cached.step >= 1) {
        setStep(cached.step);
      }
      if (!isUploadIdRequested && cached.idSubStep) setIdSubStep(cached.idSubStep);
      if (cached.academicSubStep) setAcademicSubStep(cached.academicSubStep);
      if (cached.form) {
        setForm((prev) => ({
          ...prev,
          username: prev.username || cached.form?.username || '',
          email: prev.email || cached.form?.email || '',
          password: prev.password || cached.form?.password || '',
          confirmPassword: prev.confirmPassword || cached.form?.confirmPassword || '',
          department: prev.department || cached.form?.department || '',
          course: prev.course || cached.form?.course || '',
          yearLevel: prev.yearLevel || cached.form?.yearLevel || '',
          organizations: prev.organizations.length > 0 ? prev.organizations : (cached.form?.organizations || []),
          interests: prev.interests.length > 0 ? prev.interests : (cached.form?.interests || []),
          avatar: prev.avatar && prev.avatar !== '😊' ? prev.avatar : (cached.form?.avatar || '😊'),
          bio: prev.bio || cached.form?.bio || '',
        }));
      }
      if (cached.frontPreviewDataUrl) {
        setFrontPreview(cached.frontPreviewDataUrl);
        const restoredFront = dataUrlToFile(cached.frontPreviewDataUrl, 'student-id-front.jpg');
        if (restoredFront) setFrontFile(restoredFront);
      }
      if (cached.backPreviewDataUrl) {
        setBackPreview(cached.backPreviewDataUrl);
        const restoredBack = dataUrlToFile(cached.backPreviewDataUrl, 'student-id-back.jpg');
        if (restoredBack) setBackFile(restoredBack);
      }
      if (cached.frontRotation) setFrontRotation(cached.frontRotation);
      if (cached.backRotation) setBackRotation(cached.backRotation);
      if (cached.avatarTab) setAvatarTab(cached.avatarTab);
      if (cached.agreedToTerms !== undefined) setAgreedToTerms(cached.agreedToTerms);
      if (cached.agreedToPrivacy !== undefined) setAgreedToPrivacy(cached.agreedToPrivacy);
    }
  }, []);

  // Persist form and verification progress to cache
  useEffect(() => {
    if (isDone) return;
    saveWebRegisterCache({
      phase,
      emailType,
      step,
      idSubStep,
      academicSubStep,
      registeredUserId,
      showOtpView,
      otpDigits,
      form,
      frontRotation,
      backRotation,
      avatarTab,
      agreedToTerms,
      agreedToPrivacy,
    });
  }, [
    phase,
    emailType,
    step,
    idSubStep,
    academicSubStep,
    registeredUserId,
    showOtpView,
    otpDigits,
    form,
    frontRotation,
    backRotation,
    avatarTab,
    agreedToTerms,
    agreedToPrivacy,
    isDone,
  ]);

  // Handle clean file previews with cache persistence
  const handleFrontFileChange = async (file: File) => {
    setFrontFile(file);
    setFrontRotation(0);
    const url = URL.createObjectURL(file);
    setFrontPreview(url);
    setErrors((prev) => ({ ...prev, frontId: '' }));
    try {
      const dataUrl = await fileToDataUrl(file);
      saveWebRegisterCache({ frontPreviewDataUrl: dataUrl, frontRotation: 0 });
    } catch { }
  };

  const handleBackFileChange = async (file: File) => {
    setBackFile(file);
    setBackRotation(0);
    const url = URL.createObjectURL(file);
    setBackPreview(url);
    try {
      const dataUrl = await fileToDataUrl(file);
      saveWebRegisterCache({ backPreviewDataUrl: dataUrl, backRotation: 0 });
    } catch { }
  };

  // ── Validation Helpers ────────────────────────────────────────────────────
  const validateUsername = async (customVal?: string): Promise<boolean> => {
    const raw = customVal !== undefined ? customVal : form.username;
    const clean = raw.trim().toLowerCase().replace(/\s+/g, '');
    if (!clean) {
      setErrors((prev) => ({ ...prev, username: 'Username is required.' }));
      return false;
    }
    if (clean.length < 3) {
      setErrors((prev) => ({ ...prev, username: 'Username must be at least 3 characters.' }));
      return false;
    }
    if (clean.length > 20) {
      setErrors((prev) => ({ ...prev, username: 'Username cannot exceed 20 characters.' }));
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
      setErrors((prev) => ({ ...prev, username: 'Only letters, numbers, and underscores are allowed.' }));
      return false;
    }

    if (isApiConfigured) {
      try {
        const activeUser = user || session?.user;
        const activeId = registeredUserId || activeUser?.id;
        const available = await profileService.checkUsername(clean, activeId);
        if (!available) {
          setErrors((prev) => ({ ...prev, username: 'That username is already taken. Please choose another.' }));
          return false;
        }
      } catch {
        // Non-blocking fallback
      }
    }

    setErrors((prev) => ({ ...prev, username: '' }));
    return true;
  };

  const validateStep1 = async (): Promise<boolean> => {
    const errs: Record<string, string> = {};

    // Email validation
    const cleanEmail = form.email.trim().toLowerCase();
    const emailAnalysis = analyzeEmail(cleanEmail);

    if (!cleanEmail) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errs.email = 'Please enter a valid email address.';
    } else if (emailAnalysis.isTypo) {
      errs.email = emailAnalysis.typoMessage || 'Did you mean @chmsu.edu.ph?';
    }

    // Password validation
    const pwRules = [
      { test: (p: string) => p.length >= 8, msg: 'at least 8 characters' },
      { test: (p: string) => /[A-Z]/.test(p), msg: 'an uppercase letter' },
      { test: (p: string) => /[a-z]/.test(p), msg: 'a lowercase letter' },
      { test: (p: string) => /[0-9]/.test(p), msg: 'a number' },
      { test: (p: string) => /[^A-Za-z0-9]/.test(p), msg: 'a special character' },
    ];
    if (!form.password) {
      errs.password = 'Password is required.';
    } else {
      const failed = pwRules.filter(r => !r.test(form.password));
      if (failed.length > 0) {
        errs.password = `Password must include ${failed.map(r => r.msg).join(', ')}.`;
      }
    }

    // Confirm password
    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return false;
    }

    // Check email availability with backend — decline immediately on step 1 if email is existing
    if (isApiConfigured) {
      try {
        const emailCheck = await apiClient.checkEmail(cleanEmail);
        if (emailCheck && !emailCheck.available) {
          const errMsg = emailCheck.message || 'An account with this email already exists. Please log in or use a different email.';
          setErrors({ email: errMsg });
          notify.error('Email already registered', errMsg);
          return false;
        }
      } catch (err: any) {
        if (err?.status === 409 || err?.message?.toLowerCase().includes('already')) {
          const errMsg = 'An account with this email already exists. Please log in or use a different email.';
          setErrors({ email: errMsg });
          notify.error('Email already registered', errMsg);
          return false;
        }
      }
    }

    setErrors({});
    return true;
  };

  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.username) errs.username = 'Please choose your campus username.';
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

  // ── Google OAuth Sign-Up / Login ─────────────────────────────────────────
  const handleGoogleSignUp = async () => {
    try {
      setGoogleLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/confirm`,
        },
      });
      if (error) {
        console.error('Google OAuth error:', error);
        notify.error('Google Sign-In failed', error.message || 'Could not initiate Google Sign-In.');
        setGoogleLoading(false);
      }
    } catch (err: any) {
      console.error('Google OAuth error:', err);
      notify.error('Google Sign-In failed', err?.message || 'Could not initiate Google Sign-In.');
      setGoogleLoading(false);
    }
  };

  // ── Step 1 Submission & ID Flow ───────────────────────────────────────────
  const handleNextFromStep1 = async () => {

    const isValid = await validateStep1();
    if (!isValid) return;

    const emailAnalysis = analyzeEmail(form.email);
    const activeEmailType: 'chmsu' | 'external' = emailAnalysis.isChmsu ? 'chmsu' : 'external';
    setEmailType(activeEmailType);

    if (activeEmailType === 'external') {
      // Navigate into Student ID upload sub-flow
      pushHistory();
      setIdSubStep('front');
      return;
    }

    const candidateUsername = form.username.trim()
      ? form.username.trim().toLowerCase()
      : (form.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').slice(0, 15) || 'student');
    if (!form.username) {
      setForm((prev) => ({ ...prev, username: candidateUsername }));
    }

    // CHMSU Email: create account immediately & prompt inline OTP
    setIsSubmitting(true);
    try {
      const result = await apiClient.register({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        username: candidateUsername.length < 3 ? `${candidateUsername}_chmsu` : candidateUsername,
        email_type: 'chmsu',
        interests: [],
        organizations: [],
      });
      setRegisteredUserId(result.userId);
      pendingUserIdRef.current = result.userId;
      isOtpVerifiedRef.current = false;
      formEmailRef.current = form.email.trim().toLowerCase();
      pushHistory();
      setShowOtpView(true);
      notify.success('Verification code sent!', `Check your inbox at ${form.email}`);
    } catch (err: any) {
      const msg = err?.message || 'Could not create account.';
      if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('already registered')) {
        setErrors((prev) => ({ ...prev, email: 'An account with this email already exists. Please log in or use a different email.' }));
      }
      notify.error('Registration failed', msg);
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
      const activeUser = user || session?.user;

      // Case A: User is ALREADY authenticated (e.g. registered via Google OAuth or re-uploading ID)
      if (activeUser) {
        const userId = activeUser.id;

        // 1. Upload front ID with rotation applied
        const rotatedFront = await rotateImageFile(frontFile, frontRotation);
        await apiClient.uploadStudentId(userId, rotatedFront, 'front');

        // 2. Upload back ID if provided
        if (backFile) {
          try {
            const rotatedBack = await rotateImageFile(backFile, backRotation);
            await apiClient.uploadStudentId(userId, rotatedBack, 'back');
          } catch (err) {
            console.warn('Back ID upload warning:', err);
          }
        }

        // 3. Refresh user session in auth context so student_id_url is immediately recognized
        let updatedSession: AuthSession | null = null;
        try {
          updatedSession = await apiClient.getSession();
          if (updatedSession) {
            completeLogin(updatedSession, true);
          }
        } catch (err) {
          console.warn('Failed to refresh session after ID upload:', err);
        }

        const stillNeedsOnboard = Boolean(
          (!updatedSession?.user?.user_metadata?.onboarding_complete &&
           !activeUser.user_metadata?.onboarding_complete) ||
          needsOnboarding
        );

        // 4. If user still needs onboarding (academic info), transition directly to step 2 without OTP
        if (stillNeedsOnboard) {
          notify.success('ID uploaded successfully!', 'Now please complete your academic profile.');
          setIdSubStep('none');
          setAcademicSubStep('username');
          setStep(2);
          saveWebRegisterCache({
            phase: 'form',
            emailType: 'external',
            step: 2,
            idSubStep: 'none',
            academicSubStep: 'username',
            registeredUserId: userId,
            form: {
              ...form,
              email: form.email || activeUser.email || '',
              username: form.username || (activeUser.user_metadata?.username as string) || '',
            },
          });
          navigate('/register?step=2', { replace: true });
          return;
        }

        // Otherwise (profile already completed or user is pending admin approval)
        notify.success('Student ID submitted!', 'Your ID has been submitted for administrative verification.');
        navigate('/pending-approval', { replace: true });
        return;
      }

      // Case B: Brand new user registering with email/password
      const candidateUsername = form.username.trim()
        ? form.username.trim().toLowerCase()
        : (form.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').slice(0, 15) || 'student');
      if (!form.username) {
        setForm((prev) => ({ ...prev, username: candidateUsername }));
      }

      // 1. Create account
      const result = await apiClient.register({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        username: candidateUsername.length < 3 ? `${candidateUsername}_student` : candidateUsername,
        email_type: 'external',
        interests: [],
        organizations: [],
      });

      const userId = result.userId;
      setRegisteredUserId(userId);
      pendingUserIdRef.current = userId;
      isOtpVerifiedRef.current = false;
      formEmailRef.current = form.email.trim().toLowerCase();

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
      pushHistory();
      setShowOtpView(true);
      notify.success('Account created & code sent!', `We sent a 6-digit code to ${form.email}`);
    } catch (err: any) {
      const msg = err?.message || 'Could not complete registration.';
      if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('already registered')) {
        setErrors((prev) => ({ ...prev, email: 'An account with this email already exists. Please log in or use a different email.' }));
        setIdSubStep('none');
        setStep(1);
      }
      notify.error('Registration failed', msg);
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
      isOtpVerifiedRef.current = true;
      pendingUserIdRef.current = null;
      completeLogin(authSession, true);
      setShowOtpView(false);
      saveWebRegisterCache({ showOtpView: false, step: 2, idSubStep: 'none', academicSubStep: 'username' });
      notify.success('Email confirmed!', "Your email is verified. Let's finish your academic profile.");
      pushHistory();
      setIdSubStep('none');
      setAcademicSubStep('username');
      setStep(2);
      navigate('/register?step=2', { replace: true });
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

  const handleCancelRegistration = async (explicitCancel?: boolean | React.MouseEvent) => {
    const isExplicit = explicitCancel === true;
    const prevUserId = registeredUserId || pendingUserIdRef.current;
    const prevEmail = form.email || formEmailRef.current;
    pendingUserIdRef.current = null;
    isOtpVerifiedRef.current = false;
    setShowOtpView(false);
    setOtpDigits(['', '', '', '', '', '']);
    setOtpError('');
    saveWebRegisterCache({ showOtpView: false, otpDigits: ['', '', '', '', '', ''] });

    if (isExplicit && prevUserId && isApiConfigured) {
      clearWebRegisterCache();
      try {
        await apiClient.cancelRegistration({ userId: prevUserId, email: prevEmail });
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
      clearWebRegisterCache();
    } catch (err: any) {
      notify.error('Profile save error', err?.message || 'Could not save profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── History & Phone Navigation Synchronization ─────────────────────────────
  const phaseRef = useRef(phase);
  const stepRef = useRef(step);
  const idSubStepRef = useRef(idSubStep);
  const showOtpViewRef = useRef(showOtpView);
  const activeModalRef = useRef(activeModal);
  const enlargedImageRef = useRef(enlargedImage);
  const authUser = user || session?.user;
  const authUserRef = useRef(authUser);
  const sessionRef = useRef(session);
  const historyDepthRef = useRef<number>(0);
  const isNavigatingBackRef = useRef<boolean>(false);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { stepRef.current = step; }, [step]);
  useEffect(() => { idSubStepRef.current = idSubStep; }, [idSubStep]);
  useEffect(() => { showOtpViewRef.current = showOtpView; }, [showOtpView]);
  useEffect(() => { activeModalRef.current = activeModal; }, [activeModal]);
  useEffect(() => { enlargedImageRef.current = enlargedImage; }, [enlargedImage]);
  useEffect(() => { sessionRef.current = session; }, [session]);
  useEffect(() => { authUserRef.current = authUser; }, [authUser]);

  const pushHistory = () => {
    if (isNavigatingBackRef.current) return;
    try {
      historyDepthRef.current += 1;
      window.history.pushState({ allyRegister: true, depth: historyDepthRef.current }, '');
    } catch { }
  };

  const executeBackStep = () => {
    if (enlargedImageRef.current) {
      setEnlargedImage(null);
      return true;
    }
    if (activeModalRef.current) {
      setActiveModal(null);
      return true;
    }
    if (idSubStepRef.current === 'review') {
      setIdSubStep('back');
      return true;
    }
    if (idSubStepRef.current === 'back') {
      setIdSubStep('front');
      return true;
    }
    if (idSubStepRef.current === 'front') {
      if (isUploadIdRequested && authUserRef.current) {
        navigate(isPendingApproval ? '/pending-approval' : '/dashboard');
        return true;
      }
      setIdSubStep('none');
      return true;
    }
    if (stepRef.current === 1 && showOtpViewRef.current) {
      setShowOtpView(false);
      saveWebRegisterCache({ showOtpView: false });
      return true;
    }
    if (stepRef.current === 4) {
      setStep(3);
      return true;
    }
    if (stepRef.current === 3) {
      setStep(2);
      setAcademicSubStep('organizations');
      return true;
    }
    if (stepRef.current === 2) {
      if (academicSubStepRef.current === 'organizations') {
        setAcademicSubStep('year');
        return true;
      }
      if (academicSubStepRef.current === 'year') {
        setAcademicSubStep('course');
        return true;
      }
      if (academicSubStepRef.current === 'course') {
        setAcademicSubStep('department');
        return true;
      }
      if (academicSubStepRef.current === 'department') {
        setAcademicSubStep('username');
        return true;
      }
      if (academicSubStepRef.current === 'username') {
        if (authUserRef.current) {
          navigate(isPendingApproval ? '/pending-approval' : '/dashboard');
          return true;
        }
        setStep(1);
        return true;
      }
    }
    if (stepRef.current === 1) {
      if (authUserRef.current) {
        navigate(isPendingApproval ? '/pending-approval' : '/dashboard');
        return true;
      }
      navigate('/login');
      return true;
    }
    return false;
  };

  // Intercept phone back navigation (hardware back button / edge swipe / browser back)
  useEffect(() => {
    try {
      if (!window.history.state?.allyRegisterRoot) {
        window.history.replaceState({ allyRegisterRoot: true }, '');
      }
    } catch { }

    const handlePopState = () => {
      if (historyDepthRef.current > 0) {
        historyDepthRef.current -= 1;
      }
      isNavigatingBackRef.current = true;
      executeBackStep();
      requestAnimationFrame(() => {
        isNavigatingBackRef.current = false;
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  const handleBack = () => {
    // If logged in and at the very beginning of onboarding, take user directly back to dashboard
    if (authUserRef.current) {
      if (
        (stepRef.current === 2 && academicSubStepRef.current === 'username') ||
        (stepRef.current === 1 && !showOtpViewRef.current && (idSubStepRef.current === 'none' || (isUploadIdRequested && idSubStepRef.current === 'front')))
      ) {
        navigate(isPendingApproval ? '/pending-approval' : '/dashboard');
        return;
      }
    }

    if (historyDepthRef.current > 0) {
      window.history.back();
    } else {
      const handled = executeBackStep();
      if (!handled) {
        if (authUserRef.current) {
          navigate(isPendingApproval ? '/pending-approval' : '/dashboard');
        } else {
          navigate('/login');
        }
      }
    }
  };


  const openModal = (m: 'terms' | 'privacy') => {
    pushHistory();
    setActiveModal(m);
  };

  const closeModal = () => {
    if (activeModalRef.current) {
      if (historyDepthRef.current > 0) {
        window.history.back();
      } else {
        setActiveModal(null);
      }
    }
  };

  const openEnlargedImage = (img: { src: string; title: string; rotation: number }) => {
    pushHistory();
    setEnlargedImage(img);
  };

  const closeEnlargedImage = () => {
    if (enlargedImageRef.current) {
      if (historyDepthRef.current > 0) {
        window.history.back();
      } else {
        setEnlargedImage(null);
      }
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

  // Available courses dynamically computed from selected department (with fallback)
  const currentCourses = useMemo(() => {
    if (!form.department) return [];
    const fromHook = coursesByDept[form.department];
    if (fromHook && fromHook.length > 0) return fromHook;
    return COURSES_BY_DEPT[form.department] || [];
  }, [coursesByDept, form.department]);

  // Combined organizations from backend lookup and local mock
  const allOrgOptions = useMemo(() => {
    const list = organizations && organizations.length > 0 ? organizations : ORGANIZATIONS;
    return Array.from(new Set(list));
  }, [organizations]);

  // Suggested organizations for campus org input
  const suggestedOrgs = useMemo(() => {
    const q = orgSearchQuery.trim().toLowerCase();
    return allOrgOptions.filter((org) => {
      const notSelected = !form.organizations.includes(org);
      const matches = !q || org.toLowerCase().includes(q);
      return notSelected && matches;
    });
  }, [allOrgOptions, form.organizations, orgSearchQuery]);

  // Available categories dynamically derived from lookup data
  const availableCategories = useMemo(() => {
    const cats = Object.keys(interestsByCategory);
    return ['all', ...(cats.length > 0 ? cats : ['Technology', 'Arts', 'Nature', 'Sports', 'Leadership', 'Lifestyle'])];
  }, [interestsByCategory]);

  const knownLabels = useMemo(() => {
    const set = new Set<string>();
    Object.values(interestsByCategory).forEach((list) => {
      list.forEach((i) => set.add(i.label.toLowerCase()));
    });
    return set;
  }, [interestsByCategory]);

  const customInterests = useMemo(() => {
    return form.interests.filter((item) => !knownLabels.has(item.toLowerCase()));
  }, [form.interests, knownLabels]);

  // Filtered interests based on category & search query (including custom interests)
  const allInterestItems = useMemo(() => {
    const standard = Object.entries(interestsByCategory).flatMap(([cat, list]) =>
      list.map((item) => ({ ...item, category: cat }))
    );
    const custom = customInterests.map((item) => ({
      label: item,
      color: 'emerald',
      category: 'Custom',
    }));
    return [...standard, ...custom];
  }, [interestsByCategory, customInterests]);

  const filteredInterests = useMemo(() => {
    return allInterestItems.filter((item) => {
      const matchesCat =
        activeCategory === 'all' || item.category.toLowerCase() === activeCategory.toLowerCase();
      const matchesSearch =
        !interestSearch.trim() || item.label.toLowerCase().includes(interestSearch.trim().toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [allInterestItems, activeCategory, interestSearch]);

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

  // ── MAIN REGISTRATION / MULTI-STEP VIEW ───────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#090D16] text-[#1A6B3C] dark:text-gray-100 flex flex-col justify-between overflow-x-hidden">
      {/* ── TOP ACTION & PROGRESSION BAR (Aligned with Back link, slightly wider, progression tracks forward & back) ── */}
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-16 pt-6 sm:pt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer group"
          aria-label="Go back"
        >
          <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
          <span>Back</span>
        </button>

        {/* Progression Bar on top, aligned with back link */}
        {idSubStep === 'none' && !showOtpView && (
          <div className="flex items-center gap-2 sm:gap-2.5">
            {[1, 2, 3, 4].map((num) => (
              <div
                key={num}
                className={cn(
                  'h-1.5 sm:h-2 rounded-full transition-all duration-300',
                  num === step
                    ? 'w-10 sm:w-16 bg-[#1A6B3C] dark:bg-emerald-500 shadow-xs'
                    : num < step
                      ? 'w-8 sm:w-12 bg-[#1A6B3C] dark:bg-emerald-500'
                      : 'w-8 sm:w-12 bg-gray-200 dark:bg-white/10'
                )}
                title={`Step ${num} of 4`}
              />
            ))}
          </div>
        )}

        {authUser ? (
          <button
            type="button"
            onClick={async () => {
              await signOut();
              clearWebRegisterCache();
              navigate('/login', { replace: true });
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 bg-white/80 hover:bg-red-50 dark:bg-white/5 dark:hover:bg-red-950/30 transition-all border-2 border-gray-300 dark:border-white/10 cursor-pointer shadow-2xs"
            title="Log out of current account"
          >
            <LogOut size={13} />
            <span>Log out</span>
          </button>
        ) : idSubStep === 'back' ? (
          <button
            type="button"
            onClick={() => {
              pushHistory();
              setIdSubStep('review');
            }}
            className="text-xs font-mono uppercase font-bold text-[#1A6B3C] dark:text-emerald-400 hover:underline cursor-pointer"
          >
            Skip
          </button>
        ) : (
          <div className="w-16 hidden sm:block" />
        )}
      </div>

      {/* ── BODY CONTAINER (Fully blending to background, no card wrapper, no illustration column) ── */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col justify-center">
        {/* Dynamic Context Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="font-fraunces text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
            {showOtpView
              ? 'Verify your email'
              : idSubStep === 'front'
                ? 'Upload Front ID or COR'
                : idSubStep === 'back'
                  ? 'Upload Back of ID'
                  : idSubStep === 'review'
                    ? 'Review Student ID'
                    : step === 1
                      ? 'Create your Account'
                      : step === 2
                        ? academicSubStep === 'username'
                          ? 'Choose your Username'
                          : academicSubStep === 'department'
                            ? 'Select your Department'
                            : academicSubStep === 'course'
                              ? 'Select your Course'
                              : academicSubStep === 'year'
                                ? 'Select your Year Level'
                                : 'Campus Organizations'
                        : step === 3
                          ? 'Select your Interests'
                          : 'Your Profile'}
          </h1>
          <p className="font-jakarta text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
            {showOtpView
              ? `We sent a 6-digit verification code to ${form.email}`
              : idSubStep === 'front'
                ? 'Please upload the front side of your CHMSU student ID or COR.'
                : idSubStep === 'back'
                  ? 'Upload the back side of your student ID, or skip if none.'
                  : idSubStep === 'review'
                    ? 'Ensure all student details and photo are legible before confirming.'
                    : step === 1
                      ? 'Sign up with your CHMSU institutional or personal email'
                      : step === 2
                        ? academicSubStep === 'username'
                          ? 'Pick a unique handle for your student profile'
                          : academicSubStep === 'department'
                            ? 'Which college do you belong to at CHMSU Alijis?'
                            : academicSubStep === 'course'
                              ? `Degree programs in ${form.department || 'your department'}`
                              : academicSubStep === 'year'
                                ? 'What year level are you currently enrolled in?'
                                : 'Add your student organizations or clubs (optional)'
                        : step === 3
                          ? 'Choose at least 3 interests to power your campus connections'
                          : 'Review how fellow CHMSU students will see you'}
          </p>
        </div>
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
                    'w-10 h-12 sm:w-12 sm:h-14 md:w-11 md:h-13 lg:w-13 lg:h-15 text-center font-fraunces text-lg sm:text-2xl font-bold rounded-xl sm:rounded-2xl border-2 transition-all outline-none',
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
                      openEnlargedImage({
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
                          openEnlargedImage({
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
                onClick={handleBack}
                className="w-1/3 py-4 rounded-full border border-gray-300 dark:border-white/10 text-xs font-mono uppercase font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!frontFile}
                onClick={() => {
                  pushHistory();
                  setIdSubStep('back');
                }}
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
                onClick={() => {
                  pushHistory();
                  setIdSubStep('review');
                }}
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
                      openEnlargedImage({
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
                          openEnlargedImage({
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
                onClick={handleBack}
                className="w-1/3 py-4 rounded-full border border-gray-300 dark:border-white/10 text-xs font-mono uppercase font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  pushHistory();
                  setIdSubStep('review');
                }}
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
                        openEnlargedImage({ src: frontPreview, title: 'Front ID Preview', rotation: frontRotation });
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
                            openEnlargedImage({ src: frontPreview, title: 'Front ID Preview', rotation: frontRotation });
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
                        openEnlargedImage({ src: backPreview, title: 'Back ID Preview', rotation: backRotation });
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
                            openEnlargedImage({ src: backPreview, title: 'Back ID Preview', rotation: backRotation });
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
                onClick={handleBack}
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
                    <span>
                      {session || user
                        ? needsOnboarding
                          ? 'Confirm & Continue Setup'
                          : 'Submit ID for Verification'
                        : 'Confirm & Send Code'}
                    </span>
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
            {/* Email Address with Smart CHMSU vs Personal Detection & Typo Logic */}
            {(() => {
              const emailAnalysis = analyzeEmail(form.email);

              return (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block font-jakarta text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Email Address
                    </label>

                    {/* Smart Detection Badges */}
                    {emailAnalysis.isChmsu && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-[#1A6B3C] dark:text-emerald-400 border border-emerald-500/20 animate-in fade-in">
                        <GraduationCap size={13} />
                        CHMSU Institutional Email
                      </span>
                    )}
                    {emailAnalysis.isExternal && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 animate-in fade-in">
                        <FileCheck size={13} />
                        Personal Email
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm({ ...form, email: val });
                        setErrors((prev) => ({ ...prev, email: '' }));
                        const analysis = analyzeEmail(val);
                        if (analysis.isChmsu) {
                          setEmailType('chmsu');
                        } else if (analysis.isExternal) {
                          setEmailType('external');
                        }
                      }}
                      onBlur={async () => {
                        const cleanEmail = form.email.trim().toLowerCase();
                        if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return;
                        const analysis = analyzeEmail(cleanEmail);
                        if (analysis.isTypo) {
                          setErrors((prev) => ({
                            ...prev,
                            email: analysis.typoMessage || 'Did you mean @chmsu.edu.ph?',
                          }));
                          return;
                        }
                        try {
                          const res = await apiClient.checkEmail(cleanEmail);
                          if (res && !res.available) {
                            setErrors((prev) => ({
                              ...prev,
                              email: res.message || 'An account with this email already exists. Please log in or use a different email.',
                            }));
                          }
                        } catch (err: any) {
                          if (err?.status === 409 || err?.message?.toLowerCase().includes('already')) {
                            setErrors((prev) => ({
                              ...prev,
                              email: 'An account with this email already exists. Please log in or use a different email.',
                            }));
                          }
                        }
                      }}
                      placeholder="yourname@chmsu.edu.ph or name@gmail.com"
                      className={cn(
                        'w-full px-5 py-3.5 rounded-full border-2 font-jakarta text-sm outline-none transition-all',
                        errors.email || emailAnalysis.isTypo
                          ? 'border-red-400 bg-red-50/50 text-red-900 dark:bg-red-950/20 dark:border-red-500'
                          : emailAnalysis.isChmsu
                            ? 'border-[#1A6B3C] dark:border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 text-gray-900 dark:text-white'
                            : 'border-gray-300 dark:border-white/20 focus:border-[#1A6B3C] dark:focus:border-emerald-500 bg-white/80 dark:bg-white/5 text-gray-900 dark:text-white'
                      )}
                    />
                  </div>

                  {/* Typo reminder / error box if ends in .edu.ph (not chmsu.edu.ph) or has typo */}
                  {emailAnalysis.isTypo && (
                    <div className="mt-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-1">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-xs font-jakarta text-amber-900 dark:text-amber-200">
                          <p className="font-semibold">{emailAnalysis.typoMessage || 'Did you mean @chmsu.edu.ph?'}</p>
                          <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                            CHMSU student accounts use <span className="font-mono font-bold">@chmsu.edu.ph</span>.
                          </p>
                        </div>
                      </div>
                      {emailAnalysis.suggestedEmail && (
                        <button
                          type="button"
                          onClick={() => {
                            const fixed = emailAnalysis.suggestedEmail!;
                            setForm((prev) => ({ ...prev, email: fixed }));
                            setEmailType('chmsu');
                            setErrors((prev) => ({ ...prev, email: '' }));
                          }}
                          className="shrink-0 text-xs font-mono font-bold text-[#1A6B3C] dark:text-emerald-300 bg-white dark:bg-white/10 hover:bg-emerald-50 dark:hover:bg-white/20 px-2.5 py-1.5 rounded-lg border border-emerald-500/20 transition-all cursor-pointer shadow-2xs"
                        >
                          Fix to @chmsu.edu.ph
                        </button>
                      )}
                    </div>
                  )}

                  {/* Standard field error */}
                  {errors.email && !emailAnalysis.isTypo && (
                    <p className="text-red-500 text-xs mt-1.5 font-jakarta flex items-center gap-1.5">
                      <AlertCircle size={13} className="shrink-0" />
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Password */}
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
                    'w-full px-5 pr-12 py-3.5 rounded-full border-2 font-jakarta text-sm outline-none transition-all',
                    errors.password
                      ? 'border-red-400 bg-red-50/50 text-red-900 dark:bg-red-950/20 dark:border-red-500'
                      : 'border-gray-300 dark:border-white/20 focus:border-[#1A6B3C] dark:focus:border-emerald-500 bg-white/80 dark:bg-white/5 text-gray-900 dark:text-white'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1 font-jakarta">{errors.password}</p>}
              <PasswordStrengthIndicator password={form.password} />
            </div>

            {/* Confirm Password */}
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
                    'w-full px-5 pr-12 py-3.5 rounded-full border-2 font-jakarta text-sm outline-none transition-all',
                    errors.confirmPassword
                      ? 'border-red-400 bg-red-50/50 text-red-900 dark:bg-red-950/20 dark:border-red-500'
                      : 'border-gray-300 dark:border-white/20 focus:border-[#1A6B3C] dark:focus:border-emerald-500 bg-white/80 dark:bg-white/5 text-gray-900 dark:text-white'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 cursor-pointer"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1 font-jakarta">{errors.confirmPassword}</p>
              )}
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

            {/* Horizontal Line with "or" */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300/70 dark:border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#FAF8F5] dark:bg-[#090D16] px-4 font-mono font-bold text-gray-500 dark:text-gray-400">
                  or
                </span>
              </div>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              disabled={googleLoading || isSubmitting}
              onClick={handleGoogleSignUp}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-white/10 hover:bg-gray-50 dark:hover:bg-white/15 text-gray-800 dark:text-white font-jakarta text-sm font-semibold py-3.5 px-5 rounded-full border-2 border-gray-300 dark:border-white/20 transition-all shadow-xs cursor-pointer disabled:opacity-60 active:scale-[0.99]"
            >
              {googleLoading ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-[#1A6B3C] dark:border-t-emerald-400 rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google</span>
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
              STEP 2: USERNAME & ACADEMIC DETAILS (5 Separate Sub-Pages)
             ========================================================================= */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Sub-page 1: Username */}
            {academicSubStep === 'username' && (
              <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
                <div>
                  <label className="block font-jakarta text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                    Campus Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">@</span>
                    <input
                      type="text"
                      value={form.username}
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '');
                        setForm((prev) => ({ ...prev, username: val }));
                        setErrors((prev) => ({ ...prev, username: '' }));
                      }}
                      onBlur={() => {
                        if (form.username.trim()) {
                          validateUsername(form.username);
                        }
                      }}
                      placeholder="maria_santos"
                      className={cn(
                        'w-full pl-9 pr-5 py-3.5 rounded-full border-2 font-jakarta text-sm outline-none transition-all',
                        errors.username
                          ? 'border-red-400 bg-red-50/50 text-red-900 dark:bg-red-950/20 dark:border-red-500'
                          : 'border-gray-300 dark:border-white/20 focus:border-[#1A6B3C] dark:focus:border-emerald-500 bg-white/80 dark:bg-white/5 text-gray-900 dark:text-white'
                      )}
                    />
                  </div>
                  {errors.username ? (
                    <p className="text-red-500 text-xs mt-1.5 font-jakarta flex items-center gap-1.5">
                      <AlertCircle size={13} className="shrink-0" />
                      <span>{errors.username}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] font-jakarta text-gray-500 dark:text-gray-400 mt-1.5">
                      3-20 characters. Letters, numbers, and underscores only.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    const ok = await validateUsername();
                    if (!ok) return;
                    pushHistory();
                    setAcademicSubStep('department');
                  }}
                  className="w-full mt-2 bg-[#1A6B3C] dark:bg-emerald-600 text-white font-mono text-xs uppercase tracking-wider font-bold py-4 rounded-full hover:bg-[#14532D] dark:hover:bg-emerald-500 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue to Program</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* Sub-page 2: Department */}
            {academicSubStep === 'department' && (
              <div className="flex flex-col gap-3 w-full max-w-md mx-auto">
                {DEPARTMENTS.map((dept) => {
                  const isSelected = form.department === dept;
                  return (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, department: dept, course: '' }));
                        setErrors((prev) => ({ ...prev, department: '', course: '' }));
                      }}
                      className={cn(
                        'w-full py-4 px-5 rounded-full border-2 text-sm font-jakarta font-semibold transition-all text-center cursor-pointer',
                        isSelected
                          ? 'border-2 border-[#1A6B3C] bg-[#1A6B3C]/10 text-[#1A6B3C] dark:border-emerald-400 dark:bg-emerald-500/15 dark:text-emerald-300 font-bold shadow-xs'
                          : 'border-gray-300 dark:border-white/20 bg-white/70 dark:bg-white/5 text-gray-800 dark:text-gray-200 hover:border-gray-400 dark:hover:border-white/30'
                      )}
                    >
                      {dept}
                    </button>
                  );
                })}

                {errors.department && (
                  <p className="text-red-500 text-xs font-jakarta text-center">{errors.department}</p>
                )}

                <button
                  type="button"
                  disabled={!form.department}
                  onClick={() => {
                    if (!form.department) {
                      setErrors((prev) => ({ ...prev, department: 'Please select your department' }));
                      return;
                    }
                    pushHistory();
                    setAcademicSubStep('course');
                  }}
                  className="w-full mt-4 bg-[#1A6B3C] dark:bg-emerald-600 text-white font-mono text-xs uppercase tracking-wider font-bold py-4 rounded-full hover:bg-[#14532D] dark:hover:bg-emerald-500 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <span>Continue to Course</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* Sub-page 2: Academic Course */}
            {academicSubStep === 'course' && (
              <div className="flex flex-col gap-3 w-full max-w-md mx-auto">
                {currentCourses.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 text-center text-xs text-gray-500">
                    No degree programs listed. Please go back and select your department.
                  </div>
                ) : (
                  currentCourses.map((crs) => {
                    const isSelected = form.course === crs;
                    return (
                      <button
                        key={crs}
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({ ...prev, course: crs }));
                          setErrors((prev) => ({ ...prev, course: '' }));
                        }}
                        className={cn(
                          'w-full py-4 px-5 rounded-full border-2 text-sm font-jakarta font-semibold transition-all text-center cursor-pointer',
                          isSelected
                            ? 'border-2 border-[#1A6B3C] bg-[#1A6B3C]/10 text-[#1A6B3C] dark:border-emerald-400 dark:bg-emerald-500/15 dark:text-emerald-300 font-bold shadow-xs'
                            : 'border-gray-300 dark:border-white/20 bg-white/70 dark:bg-white/5 text-gray-800 dark:text-gray-200 hover:border-gray-400 dark:hover:border-white/30'
                        )}
                      >
                        {crs}
                      </button>
                    );
                  })
                )}

                {errors.course && (
                  <p className="text-red-500 text-xs font-jakarta text-center">{errors.course}</p>
                )}

                <button
                  type="button"
                  disabled={!form.course}
                  onClick={() => {
                    if (!form.course) {
                      setErrors((prev) => ({ ...prev, course: 'Please select your academic course' }));
                      return;
                    }
                    pushHistory();
                    setAcademicSubStep('year');
                  }}
                  className="w-full mt-4 bg-[#1A6B3C] dark:bg-emerald-600 text-white font-mono text-xs uppercase tracking-wider font-bold py-4 rounded-full hover:bg-[#14532D] dark:hover:bg-emerald-500 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <span>Continue to Year Level</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* Sub-page 3: Year Level */}
            {academicSubStep === 'year' && (
              <div className="flex flex-col gap-3 w-full max-w-md mx-auto">
                {['1st Year', '2nd Year', '3rd Year', '4th Year'].map((yr) => {
                  const isSelected = !isCustomYear && form.yearLevel === yr;
                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => {
                        setIsCustomYear(false);
                        setForm((prev) => ({ ...prev, yearLevel: yr }));
                        setErrors((prev) => ({ ...prev, yearLevel: '' }));
                      }}
                      className={cn(
                        'w-full py-4 px-5 rounded-full border-2 text-sm font-jakarta font-semibold transition-all text-center cursor-pointer',
                        isSelected
                          ? 'border-2 border-[#1A6B3C] bg-[#1A6B3C]/10 text-[#1A6B3C] dark:border-emerald-400 dark:bg-emerald-500/15 dark:text-emerald-300 font-bold shadow-xs'
                          : 'border-gray-300 dark:border-white/20 bg-white/70 dark:bg-white/5 text-gray-800 dark:text-gray-200 hover:border-gray-400 dark:hover:border-white/30'
                      )}
                    >
                      {yr}
                    </button>
                  );
                })}

                {/* Others Option */}
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomYear(true);
                    setForm((prev) => ({ ...prev, yearLevel: customYearInput || '' }));
                  }}
                  className={cn(
                    'w-full py-4 px-5 rounded-full border-2 text-sm font-jakarta font-semibold transition-all text-center cursor-pointer',
                    isCustomYear
                      ? 'border-2 border-[#1A6B3C] bg-[#1A6B3C]/10 text-[#1A6B3C] dark:border-emerald-400 dark:bg-emerald-500/15 dark:text-emerald-300 font-bold shadow-xs'
                      : 'border-gray-300 dark:border-white/20 bg-white/70 dark:bg-white/5 text-gray-800 dark:text-gray-200 hover:border-gray-400 dark:hover:border-white/30'
                  )}
                >
                  Others
                </button>

                {isCustomYear && (
                  <div className="mt-1">
                    <input
                      type="text"
                      value={customYearInput}
                      onChange={(e) => {
                        setCustomYearInput(e.target.value);
                        setForm((prev) => ({ ...prev, yearLevel: e.target.value }));
                        setErrors((prev) => ({ ...prev, yearLevel: '' }));
                      }}
                      placeholder="Enter year level (e.g. Irregular, 5th Year, Transferee)"
                      className="w-full px-5 py-3.5 rounded-full border-2 border-gray-300 dark:border-white/20 bg-white/80 dark:bg-white/5 font-jakarta text-sm outline-none focus:border-[#1A6B3C] dark:focus:border-emerald-400 text-gray-900 dark:text-white"
                      autoFocus
                    />
                  </div>
                )}

                {errors.yearLevel && (
                  <p className="text-red-500 text-xs font-jakarta text-center">{errors.yearLevel}</p>
                )}

                <button
                  type="button"
                  disabled={!form.yearLevel}
                  onClick={() => {
                    if (!form.yearLevel) {
                      setErrors((prev) => ({ ...prev, yearLevel: 'Please select or enter your year level' }));
                      return;
                    }
                    pushHistory();
                    setAcademicSubStep('organizations');
                  }}
                  className="w-full mt-4 bg-[#1A6B3C] dark:bg-emerald-600 text-white font-mono text-xs uppercase tracking-wider font-bold py-4 rounded-full hover:bg-[#14532D] dark:hover:bg-emerald-500 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <span>Continue to Campus Organizations</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* Sub-page 4: Campus Organizations */}
            {academicSubStep === 'organizations' && (
              <div className="w-full max-w-md mx-auto space-y-4">
                <div className="relative">
                  <div
                    onClick={() => orgInputRef.current?.focus()}
                    className="w-full min-h-[56px] px-5 py-2.5 rounded-full border-2 border-gray-300 dark:border-white/20 bg-white/80 dark:bg-white/5 flex flex-wrap items-center gap-2 focus-within:border-[#1A6B3C] dark:focus-within:border-emerald-400 transition-all cursor-text"
                  >
                    {/* Selected Org Pills - simple rounded pill with x on right side, no color */}
                    {form.organizations.map((org) => (
                      <span
                        key={org}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-300 dark:border-white/20 text-xs font-jakarta text-gray-800 dark:text-gray-200 bg-transparent"
                      >
                        <span>{org}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setForm((prev) => ({
                              ...prev,
                              organizations: prev.organizations.filter((o) => o !== org),
                            }));
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                          title={`Remove ${org}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}

                    {/* Text input */}
                    <input
                      ref={orgInputRef}
                      type="text"
                      value={orgSearchQuery}
                      onChange={(e) => {
                        setOrgSearchQuery(e.target.value);
                        setIsOrgDropdownOpen(true);
                      }}
                      onFocus={() => setIsOrgDropdownOpen(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const trimmed = orgSearchQuery.trim();
                          if (!trimmed) return;
                          if (suggestedOrgs.length > 0) {
                            const pick = suggestedOrgs[0];
                            if (!form.organizations.includes(pick)) {
                              setForm((prev) => ({ ...prev, organizations: [...prev.organizations, pick] }));
                            }
                          } else if (!form.organizations.includes(trimmed)) {
                            setForm((prev) => ({ ...prev, organizations: [...prev.organizations, trimmed] }));
                          }
                          setOrgSearchQuery('');
                          setIsOrgDropdownOpen(false);
                        } else if (e.key === 'Backspace' && !orgSearchQuery && form.organizations.length > 0) {
                          setForm((prev) => ({
                            ...prev,
                            organizations: prev.organizations.slice(0, -1),
                          }));
                        }
                      }}
                      placeholder={form.organizations.length === 0 ? 'Type to search or add organizations...' : 'Add more...'}
                      className="flex-1 min-w-[150px] bg-transparent font-jakarta text-sm outline-none text-gray-900 dark:text-white placeholder:text-gray-400 py-1"
                    />
                  </div>

                  {/* Suggestions Dropdown */}
                  {isOrgDropdownOpen && orgSearchQuery.trim().length > 0 && (
                    <div
                      ref={orgDropdownRef}
                      className="absolute left-0 right-0 top-full mt-2 z-30 max-h-56 overflow-y-auto rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/10 shadow-xl p-1.5 custom-scrollbar"
                    >
                      {suggestedOrgs.map((org) => (
                        <button
                          key={org}
                          type="button"
                          onClick={() => {
                            if (!form.organizations.includes(org)) {
                              setForm((prev) => ({ ...prev, organizations: [...prev.organizations, org] }));
                            }
                            setOrgSearchQuery('');
                            setIsOrgDropdownOpen(false);
                            orgInputRef.current?.focus();
                          }}
                          className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-jakarta text-gray-700 dark:text-gray-200 hover:bg-[#1A6B3C]/10 hover:text-[#1A6B3C] dark:hover:text-emerald-400 transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <span>{org}</span>
                          <Plus size={14} className="opacity-60" />
                        </button>
                      ))}

                      {/* Add to organizations option */}
                      {!allOrgOptions.some((o) => o.toLowerCase() === orgSearchQuery.trim().toLowerCase()) && (
                        <button
                          type="button"
                          onClick={() => {
                            const trimmed = orgSearchQuery.trim();
                            if (trimmed && !form.organizations.includes(trimmed)) {
                              setForm((prev) => ({ ...prev, organizations: [...prev.organizations, trimmed] }));
                            }
                            setOrgSearchQuery('');
                            setIsOrgDropdownOpen(false);
                            orgInputRef.current?.focus();
                          }}
                          className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-jakarta text-[#1A6B3C] dark:text-emerald-400 hover:bg-[#1A6B3C]/10 transition-colors flex items-center gap-2 cursor-pointer border-t border-gray-100 dark:border-white/5 font-semibold"
                        >
                          <Plus size={14} />
                          <span>Add "{orgSearchQuery.trim()}" to organizations</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (validateStep2()) {
                      pushHistory();
                      setStep(3);
                    }
                  }}
                  className="w-full mt-4 bg-[#1A6B3C] dark:bg-emerald-600 text-white font-mono text-xs uppercase tracking-wider font-bold py-4 rounded-full hover:bg-[#14532D] dark:hover:bg-emerald-500 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue to Interests</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
              STEP 3: PASSIONS & INTERESTS
             ========================================================================= */}
        {step === 3 && (
          <div className="space-y-4 max-w-md mx-auto w-full">
            {/* Category Filter Pills on Top */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider font-bold shrink-0 transition-all cursor-pointer',
                    activeCategory === cat
                      ? 'bg-[#1A6B3C] text-white shadow-xs'
                      : 'bg-white/70 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:bg-white'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Scrollable container of interest tags with emoji */}
            <div
              ref={interestListRef}
              className="p-1 max-h-72 overflow-y-auto overscroll-contain touch-pan-y custom-scrollbar flex flex-wrap content-start gap-2"
            >
              {filteredInterests.length === 0 ? (
                <div className="w-full py-8 text-center text-xs font-jakarta text-gray-400">
                  No interests found.
                </div>
              ) : (
                filteredInterests.map(({ label }) => {
                  const isSelected = form.interests.includes(label);
                  const emoji = getInterestEmoji(label);
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleInterest(label)}
                      className={cn(
                        'px-3.5 py-2 rounded-full text-xs font-jakarta font-medium border transition-all flex items-center gap-1.5 cursor-pointer',
                        isSelected
                          ? 'border-2 border-[#1A6B3C] bg-[#1A6B3C]/10 text-[#1A6B3C] dark:border-emerald-400 dark:bg-emerald-500/15 dark:text-emerald-300 font-semibold shadow-xs'
                          : 'border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                      )}
                    >
                      <span className="text-sm">{emoji}</span>
                      <span>{label}</span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Others custom input at bottom */}
            <div className="flex items-center gap-2 pt-3 border-t border-gray-200/60 dark:border-white/10">
              <input
                type="text"
                value={customInterest}
                onChange={(e) => setCustomInterest(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomInterest()}
                placeholder="Others (e.g. Robotics, Filmmaking)..."
                className="flex-1 px-5 py-2.5 rounded-full border-2 border-gray-300 dark:border-white/20 bg-white/80 dark:bg-white/5 font-jakarta text-xs outline-none focus:border-[#1A6B3C] dark:focus:border-emerald-400 text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddCustomInterest}
                className="px-5 py-2.5 rounded-full bg-[#1A6B3C] text-white font-mono text-xs uppercase font-bold hover:bg-[#14532D] transition-colors cursor-pointer"
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

            {/* Continue Button */}
            <button
              type="button"
              disabled={form.interests.length < 3}
              onClick={() => {
                if (validateStep3()) {
                  pushHistory();
                  setStep(4);
                }
              }}
              className="w-full mt-2 bg-[#1A6B3C] dark:bg-emerald-600 text-white font-mono text-xs uppercase tracking-wider font-bold py-4 rounded-full hover:bg-[#14532D] dark:hover:bg-emerald-500 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <span>Continue to Profile & Bio</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* =========================================================================
              STEP 4: AVATAR, PROFILE & COMPLETE REGISTRATION
             ========================================================================= */}
        {step === 4 && (
          <div className="space-y-6 max-w-md mx-auto w-full">
            {/* Top: Avatar Circle */}
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-2">
                {customAvatarPreview ? (
                  <img
                    src={customAvatarPreview}
                    alt="Custom photo"
                    className="w-28 h-28 rounded-full object-cover border-4 border-[#1A6B3C] shadow-md"
                  />
                ) : (
                  <AnonymousAvatar avatarKey={form.avatar || 'fox'} size={112} className="shadow-md" />
                )}
              </div>

              {/* Bottom of avatar: Name */}
              <h3 className="font-fraunces text-2xl font-bold text-gray-900 dark:text-white">
                {form.username ? `@${form.username}` : '@username'}
              </h3>

              {/* Bottom of name: Course and Year */}
              <p className="font-jakarta text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                {form.course || 'Degree Program'}{form.yearLevel ? ` · ${form.yearLevel}` : ''}
              </p>
            </div>

            {/* Below that: Avatars Selection on default using anonymous avatars */}
            <div>
              <label className="block font-jakarta text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 text-center mb-3">
                Choose anonymous avatar
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 justify-items-center max-w-xs sm:max-w-sm mx-auto">
                {ANIMAL_KEYS.map((animal) => {
                  const isSelected = !customAvatarPreview && form.avatar === animal;
                  return (
                    <button
                      key={animal}
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, avatar: animal }));
                        setCustomAvatarPreview(null);
                        setCustomAvatarFile(null);
                      }}
                      className={cn(
                        'p-0.5 rounded-full transition-transform cursor-pointer',
                        isSelected
                          ? 'ring-3 ring-[#1A6B3C] dark:ring-emerald-400 ring-offset-2 scale-110'
                          : 'hover:scale-105 opacity-80 hover:opacity-100'
                      )}
                      title={animal}
                    >
                      <AnonymousAvatar avatarKey={animal} size={46} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Below that: Simple label upload photo on the bottom */}
            <div className="flex flex-col items-center">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setCustomAvatarFile(file);
                    const url = URL.createObjectURL(file);
                    setCustomAvatarPreview(url);
                    setForm((prev) => ({ ...prev, avatar: url }));
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (avatarInputRef.current) {
                    avatarInputRef.current.value = '';
                    avatarInputRef.current.click();
                  }
                }}
                className="text-xs font-jakarta font-semibold text-[#1A6B3C] dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1.5 py-1"
              >
                <Camera size={14} />
                <span>Upload photo</span>
              </button>
              {customAvatarPreview && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomAvatarPreview(null);
                    setCustomAvatarFile(null);
                    setForm((prev) => ({ ...prev, avatar: 'fox' }));
                    if (avatarInputRef.current) avatarInputRef.current.value = '';
                  }}
                  className="text-[11px] text-red-500 hover:underline mt-0.5 cursor-pointer"
                >
                  Remove custom photo
                </button>
              )}
            </div>

            {/* Bio Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-jakarta text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Bio <span className="font-normal text-gray-400 lowercase">(optional)</span>
                </label>
                <span className="text-[11px] font-mono text-gray-400">{form.bio.length}/250</span>
              </div>
              <textarea
                rows={2}
                maxLength={250}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Share a short intro about yourself, hobbies, or campus goals..."
                className="w-full px-5 py-3.5 rounded-3xl border-2 border-gray-300 dark:border-white/20 bg-white/80 dark:bg-white/5 font-jakarta text-xs outline-none focus:border-[#1A6B3C] resize-none text-gray-900 dark:text-white"
              />
            </div>

            {/* Below that: One paragraph terms and policy & One check */}
            <div className="pt-3 border-t border-gray-200/60 dark:border-white/10 space-y-2.5">
              <p className="text-xs font-jakarta text-gray-500 dark:text-gray-400 leading-relaxed text-center sm:text-left">
                By completing registration, you agree to our{' '}
                <button
                  type="button"
                  onClick={() => openModal('terms')}
                  className="font-bold text-[#1A6B3C] dark:text-emerald-400 underline cursor-pointer"
                >
                  Terms & Conditions
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={() => openModal('privacy')}
                  className="font-bold text-[#1A6B3C] dark:text-emerald-400 underline cursor-pointer"
                >
                  Campus Privacy Policy
                </button>
                . Ally-jis is strictly exclusive to CHMSU students and requires authentic student identities and respectful peer conduct across all campus features.
              </p>

              <label className="flex items-center gap-2.5 text-xs font-jakarta cursor-pointer text-gray-700 dark:text-gray-300 pt-1">
                <input
                  type="checkbox"
                  checked={agreedToTerms && agreedToPrivacy}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setAgreedToTerms(checked);
                    setAgreedToPrivacy(checked);
                    setErrors((prev) => ({ ...prev, terms: '', privacy: '' }));
                  }}
                  className="w-4 h-4 rounded text-[#1A6B3C] focus:ring-[#1A6B3C] accent-[#1A6B3C] cursor-pointer"
                />
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  I agree to the Terms & Conditions and Privacy Policy
                </span>
              </label>
              {(errors.terms || errors.privacy) && (
                <p className="text-red-500 text-xs font-jakarta">{errors.terms || errors.privacy}</p>
              )}
            </div>

            {/* Complete Registration Button */}
            <button
              type="button"
              disabled={isSubmitting || !(agreedToTerms && agreedToPrivacy)}
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
      </main>

      {/* ── IMAGE ENLARGE / ZOOM MODAL ── */}
      <AnimatePresence>
        {enlargedImage && (
          <div
            onClick={closeEnlargedImage}
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
                    onClick={closeEnlargedImage}
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
                  onClick={closeEnlargedImage}
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
          <div
            onClick={closeModal}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-lg w-full bg-white dark:bg-[#111827] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-white/10 shadow-2xl flex flex-col max-h-[80vh] cursor-default"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/10">
                <h3 className="font-fraunces text-xl font-bold text-gray-900 dark:text-white">
                  {activeModal === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
                </h3>
                <button
                  type="button"
                  onClick={closeModal}
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
                  onClick={closeModal}
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
