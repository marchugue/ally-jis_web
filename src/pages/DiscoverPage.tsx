import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Search,
  SlidersHorizontal,
  MessageCircle,
  UserPlus,
  Check,
  Compass,
  X,
  Sparkles,
  RotateCcw,
  Zap,
  Users,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Flame,
  Award,
  Filter,
  Gamepad2,
} from 'lucide-react';
import InterestTag from '@/components/ally/InterestTag';
import MatchBadge from '@/components/ally/MatchBadge';
import { generateMatches } from '@/data/mockData';
import { MatchCard, Student } from '@/types/ally';
import { cn } from '@/lib/utils';
import { isApiConfigured, MatchmakingPreferences, MatchIdentityView } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { profileService } from '@/lib/services/profileService';
import { interactionService } from '@/lib/services/interactionService';
import { chatService } from '@/lib/services/chatService';
import { useLookupOptions } from '@/hooks/useLookupOptions';
import { usePresence } from '@/context/PresenceContext';
import { useMatchmaking } from '@/hooks/useMatchmaking';
import { MatchmakingOverlay } from '@/components/match/MatchmakingOverlay';
import { AnimatePresence, motion } from 'framer-motion';
import { AnonymousAvatar } from '@/components/match/AnonymousAvatar';
import { getDeterministicAnonymousAvatar } from '@/lib/matchOptions';
import { apiClient } from '@/api/client';

function getAnonymousName(student: Student, avatarKey: string): string {
  if (student.name && student.name.toLowerCase().startsWith('anonymous')) {
    return student.name;
  }
  const key = avatarKey || 'peer';
  const capitalized = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
  return `Anonymous ${capitalized}`;
}

export default function DiscoverPage() {
  const { user } = useAuth();
  const { isOnline } = usePresence();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const { departments, coursesByDept, yearLevels } = useLookupOptions();

  // Discover Directory & Filters state
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    department: '',
    course: '',
    yearLevel: '',
    sortBy: 'all',
  });
  const [connections, setConnections] = useState<Record<string, 'none' | 'pending' | 'accepted'>>({});
  const [dismissedStudentIds, setDismissedStudentIds] = useState<Set<string>>(new Set());
  const [selectedCard, setSelectedCard] = useState<MatchCard | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [matches, setMatches] = useState<MatchCard[]>([]);

  // Close discovery profile modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedCard(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const useBackend = Boolean(isApiConfigured && user);

  const {
    phase: matchPhase,
    error: matchError,
    pendingMatch,
    dailyMatchCount,
    identity: matchIdentity,
    compatibilityScore,
    acceptDeadline,
    ended: matchEnded,
    dismissEnded,
    roomReady,
    clearRoomReady,
    isInQueue,
    activePreferences,
    joinQueue,
    leaveQueue,
    accept: acceptMatch,
    decline: declineMatch,
  } = useMatchmaking();

  // Auto-navigate to conversation room ONLY when a match is freshly connected in this session
  useEffect(() => {
    if (roomReady?.conversationId) {
      const conversationId = roomReady.conversationId;
      clearRoomReady();
      toast.success('✨ Match Connected! Chatting with your anonymous ally.');
      navigate('/messages', { state: { conversationId } });
    }
  }, [roomReady, clearRoomReady, navigate]);

  // Notify when a match ends (declined or timed out)
  useEffect(() => {
    if (matchEnded) {
      toast.info(matchEnded.reason);
      dismissEnded();
    }
  }, [matchEnded, dismissEnded]);

  // Toast if match error occurs
  useEffect(() => {
    if (matchError) {
      toast.error(matchError);
    }
  }, [matchError]);

  useEffect(() => {
    let isMounted = true;

    const loadMatches = async () => {
      if (!user) {
        setMatches([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const [current, others, interactions, matchStatus] = await Promise.all([
          profileService.getMyProfile().catch(() => profileService.getProfile(user.id)),
          profileService.getAllProfiles(user.id),
          interactionService.listMyInteractions().catch(() => []),
          apiClient.getMatchmakingStatus().catch(() => null),
        ]);

        if (!isMounted) return;

        setCurrentUser(current);

        const connectionMap: Record<string, any> = {};
        (interactions ?? []).forEach((r) => {
          connectionMap[r.target_user_id] = r.status;
        });
        setConnections(connectionMap);

        // Track partner IDs from active and existing matches to exclude them
        const activePartnerIds = new Set<string>();
        (matchStatus?.activeMatches ?? []).forEach((m: any) => {
          const partnerId = m.user_a_id === user.id ? m.user_b_id : m.user_a_id;
          if (partnerId) activePartnerIds.add(partnerId);
        });

        // Strictly show non-ally and non-match students
        const nonAllyNonMatchStudents = others.filter((student) => {
          if (student.id === user.id) return false;
          if (student.isAlly) return false;
          if (connectionMap[student.id] === 'accepted') return false;
          if (activePartnerIds.has(student.id)) return false;
          return true;
        });

        const allMatches = generateMatches(current, nonAllyNonMatchStudents);
        setMatches(allMatches);
      } catch (err: any) {
        if (isMounted) setBanner(err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (!user) {
      setBanner('Sign in to discover CHMSU students and connect.');
      setMatches([]);
      setIsLoading(false);
    } else {
      setBanner(null);
      void loadMatches();
    }

    return () => {
      isMounted = false;
    };
  }, [useBackend, user?.id]);

  const availableCourses = useMemo(() => {
    if (filters.department && coursesByDept?.[filters.department]) {
      return coursesByDept[filters.department];
    }
    return Array.from(new Set(Object.values(coursesByDept || {}).flat()));
  }, [filters.department, coursesByDept]);

  // Filter and sort students — strictly non-ally, non-match students prioritized by compatibility points
  const filtered = useMemo(() => {
    return matches
      .filter((m) => {
        if (user && m.student.id === user.id) return false;
        if (m.student.isAlly) return false;
        if (connections[m.student.id] === 'accepted') return false;
        if (dismissedStudentIds.has(m.student.id)) return false;

        const q = search.toLowerCase().trim();
        if (q) {
          const nameMatch = (m.student.name || '').toLowerCase().includes(q);
          const courseMatch = (m.student.course || '').toLowerCase().includes(q);
          const deptMatch = (m.student.department || '').toLowerCase().includes(q);
          const interestMatch = (m.student.interests || []).some((i) => i.toLowerCase().includes(q));
          if (!nameMatch && !courseMatch && !deptMatch && !interestMatch) return false;
        }

        if (filters.department && m.student.department !== filters.department) {
          return false;
        }

        if (filters.course && m.student.course !== filters.course) {
          return false;
        }

        if (filters.yearLevel && m.student.yearLevel !== filters.yearLevel) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'popular') {
          const popA = (a.student as any).followersCount ?? (a.student as any).followers_count ?? 0;
          const popB = (b.student as any).followersCount ?? (b.student as any).followers_count ?? 0;
          return popB - popA;
        }
        if (filters.sortBy === 'newest') return b.student.id.localeCompare(a.student.id);
        if (filters.sortBy === 'name') return (a.student.name || '').localeCompare(b.student.name || '');
        // default: prioritize highest compatibility points
        return b.matchPercentage - a.matchPercentage;
      });
  }, [matches, connections, search, filters, user, dismissedStudentIds]);

  const handleConnect = async (studentId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (connections[studentId] && connections[studentId] !== 'none') return;

    setConnections((prev) => ({ ...prev, [studentId]: 'pending' }));

    if (useBackend && user) {
      try {
        await interactionService.sendRequest(user.id, studentId);
        toast.success('Connection request sent!');
      } catch (err: any) {
        setConnections((prev) => ({ ...prev, [studentId]: 'none' }));
        toast.error(err.message || 'Failed to send request');
      }
    } else {
      toast.success('Connection request sent! (Demo mode)');
    }
  };

  const handleMessage = async (studentId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!useBackend || !user) {
      navigate('/messages');
      return;
    }

    try {
      const conversationId = await chatService.getOrCreateConversation(studentId);
      navigate('/messages', { state: { conversationId } });
    } catch (err: any) {
      toast.error(err.message || 'Could not start conversation');
    }
  };

  const getConnectionStatus = (studentId: string) => connections[studentId] || 'none';

  const DAILY_LIMIT = 5;
  const canMatch = dailyMatchCount < DAILY_LIMIT && !isInQueue && matchPhase !== 'pending';

  const handleFindMatch = async () => {
    if (!user) {
      toast.error('Please sign in to find a campus match.');
      navigate('/login', { state: { from: '/discover' } });
      return;
    }

    if (dailyMatchCount >= DAILY_LIMIT) {
      toast.error('Daily match quota reached (5/5). Please try again tomorrow!');
      return;
    }

    if (!canMatch) return;

    const preferences: MatchmakingPreferences = {
      department: filters.department || undefined,
      course: filters.course || undefined,
      strictCourse: Boolean(filters.course),
      matchType: 'anonymous',
    };

    try {
      await joinQueue(preferences);
    } catch (err: any) {
      console.warn('Could not join matchmaking queue:', err);
    }
  };

  const activeFiltersCount =
    (filters.department ? 1 : 0) +
    (filters.course ? 1 : 0) +
    (filters.yearLevel ? 1 : 0) +
    (filters.sortBy !== 'all' ? 1 : 0);
  const hasActiveFilter = activeFiltersCount > 0 || Boolean(search);

  const handleResetFilters = () => {
    setFilters({ department: '', course: '', yearLevel: '', sortBy: 'all' });
    setSearch('');
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar relative bg-[#F7F4EF] dark:bg-[#121212] transition-colors duration-200">
      {/* ── Full-screen matchmaking overlay (live backend searching + match found) ── */}
      <AnimatePresence>
        {(isInQueue || matchPhase === 'pending') && (
          <MatchmakingOverlay
            phase={matchPhase === 'pending' ? 'pending' : 'searching'}
            identity={matchIdentity}
            preferences={
              activePreferences ?? {
                department: filters.department || undefined,
                course: filters.course || undefined,
                strictCourse: Boolean(filters.course),
                matchType: 'anonymous',
              }
            }
            myAccepted={
              matchPhase === 'pending' && pendingMatch
                ? (pendingMatch.user_a_id === user?.id ? pendingMatch.accepted_a : pendingMatch.accepted_b)
                : false
            }
            acceptDeadline={acceptDeadline}
            compatibilityScore={compatibilityScore}
            onCancel={() => {
              void leaveQueue();
            }}
            onAccept={() => {
              void acceptMatch();
            }}
            onDecline={() => {
              void declineMatch();
            }}
          />
        )}
      </AnimatePresence>



      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-32 md:pb-12 w-full">
        {banner && (
          <div className="mb-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm font-jakarta text-amber-800 dark:text-amber-300 flex items-center justify-between">
            <span>{banner}</span>
            <button
              type="button"
              onClick={() => setBanner(null)}
              className="text-amber-600 hover:text-amber-800 dark:text-amber-400 p-1 cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        )}


        {/* ═══ Top Quick Action Cards: Anonymous & Games ═══ */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-8">
          {/* Card 1: Anonymous */}
          <button
            type="button"
            onClick={isInQueue ? () => void leaveQueue() : handleFindMatch}
            disabled={!canMatch && !isInQueue}
            className={cn(
              'group relative flex flex-col items-center justify-center text-center p-7 sm:p-9 rounded-3xl border transition-all duration-300 select-none overflow-hidden cursor-pointer shadow-xs hover:shadow-xl active:scale-[0.98] hover:-translate-y-0.5 backdrop-blur-md',
              isInQueue || matchPhase === 'searching'
                ? 'bg-gradient-to-r from-amber-500/25 via-amber-600/25 to-yellow-500/25 border-amber-400/50 shadow-amber-500/15'
                : 'bg-gradient-to-r from-[#1A6B3C]/25 via-emerald-600/25 to-[#38C185]/25 dark:from-[#1A6B3C]/25 dark:via-emerald-500/25 dark:to-[#38C185]/20 border-emerald-500/30 dark:border-emerald-400/30 hover:border-emerald-500/60 dark:hover:border-[#38C185]/60'
            )}
          >
            {/* Solid Gradient Message Icon on the top */}
            <div className="mb-2.5 sm:mb-3 transition-transform duration-300 group-hover:scale-110">
              {isInQueue || matchPhase === 'searching' ? (
                <Loader2 size={38} className="text-amber-500 animate-spin" />
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-xs"
                >
                  <defs>
                    <linearGradient id="anon-msg-solid-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38C185" />
                      <stop offset="100%" stopColor="#1A6B3C" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
                    fill="url(#anon-msg-solid-grad)"
                  />
                  <circle cx="8" cy="10" r="1.25" fill="white" fillOpacity="0.9" />
                  <circle cx="12" cy="10" r="1.25" fill="white" fillOpacity="0.9" />
                  <circle cx="16" cy="10" r="1.25" fill="white" fillOpacity="0.9" />
                </svg>
              )}
            </div>

            {/* Anonymous Title in the center */}
            <h3 className="font-fraunces text-base sm:text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
              {isInQueue || matchPhase === 'searching' ? 'Searching...' : 'Anonymous'}
            </h3>

            {/* Attempts Left on the bottom */}
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm font-jakarta font-medium text-emerald-800/80 dark:text-emerald-200/90">
              {isInQueue || matchPhase === 'searching'
                ? 'Peer search · Cancel'
                : `${Math.max(0, DAILY_LIMIT - dailyMatchCount)} attempts left`}
            </p>
          </button>

          {/* Card 2: Games */}
          <button
            type="button"
            onClick={() => {
              window.open('http://localhost:5174', '_blank');
              toast.success('Opening ALLY-JIS Game Portal!');
            }}
            className="group relative flex flex-col items-center justify-center text-center p-7 sm:p-9 rounded-3xl border bg-gradient-to-r from-[#E8A838]/25 via-amber-500/25 to-[#F0B247]/25 dark:from-[#E8A838]/25 dark:via-amber-500/25 dark:to-[#F0B247]/20 border-amber-400/30 dark:border-amber-400/30 hover:border-amber-400/60 dark:hover:border-[#F0B247]/60 hover:-translate-y-0.5 transition-all duration-300 select-none overflow-hidden cursor-pointer shadow-xs hover:shadow-xl active:scale-[0.98] backdrop-blur-md"
          >
            {/* Solid Gradient Game Icon on the top */}
            <div className="mb-2.5 sm:mb-3 transition-transform duration-300 group-hover:scale-110">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-xs"
              >
                <defs>
                  <linearGradient id="game-solid-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FBBF24" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#EA580C" />
                  </linearGradient>
                </defs>
                <path
                  d="M7 6H17C19.2 6 21 7.8 21 10V14C21 17.3 18.3 20 15 20C13.8 20 12.7 19.5 12 18.7C11.3 19.5 10.2 20 9 20C5.7 20 3 17.3 3 14V10C3 7.8 4.8 6 7 6Z"
                  fill="url(#game-solid-grad)"
                />
                <path
                  d="M7 11V15M5 13H9"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="15.5" cy="11.5" r="1.1" fill="white" />
                <circle cx="18" cy="13.5" r="1.1" fill="white" />
                <circle cx="15.5" cy="15.5" r="1.1" fill="white" />
                <circle cx="13" cy="13.5" r="1.1" fill="white" />
              </svg>
            </div>

            {/* Games Title in the center */}
            <h3 className="font-fraunces text-base sm:text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
              Games
            </h3>

            {/* Players Online on the bottom */}
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm font-jakarta font-medium text-amber-800/80 dark:text-amber-200/90 flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse shrink-0" />
              <span>4 players online</span>
            </p>
          </button>
        </div>

        {/* Setup Profile Prompt if user has not set interests yet */}
        {!isLoading && (!currentUser?.username || (currentUser?.interests && currentUser.interests.length === 0)) && (
          <div className="mb-6 rounded-3xl bg-white dark:bg-[#181818] p-5 sm:p-6 border border-emerald-500/20 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#1A6B3C]/10 dark:bg-emerald-500/20 text-[#1A6B3C] dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Compass size={22} />
              </div>
              <div>
                <h3 className="font-fraunces text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  Maximize your Match Accuracy 🎯
                </h3>
                <p className="font-jakarta text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Pick your passions, academic courses, and student orgs to find the highest-scoring peers!
                </p>
              </div>
            </div>
            <Link
              to="/profile"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1A6B3C] dark:bg-emerald-600 text-white font-jakarta font-semibold text-xs whitespace-nowrap hover:bg-[#155a33] dark:hover:bg-emerald-500 transition-colors shadow-xs"
            >
              <span>Setup Interests</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        )}



        {/* ═══ Search & Controls Bar ═══ */}
        <div className="bg-white dark:bg-[#181818] rounded-2xl p-3 sm:p-4 mb-4 border border-gray-200/80 dark:border-white/10 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search students by name, course, or interests..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 focus:border-[#1A6B3C] dark:focus:border-emerald-400 bg-gray-50 dark:bg-[#1E1E1E] focus:bg-white dark:focus:bg-[#1F2937] font-jakarta text-xs sm:text-sm outline-none transition-colors dark:text-white dark:placeholder:text-gray-500"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer p-0.5"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Quick Sort Dropdown & Filter Drawer Toggle */}
            <div className="flex items-center gap-2">


              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border font-jakarta text-xs sm:text-sm font-semibold transition-all cursor-pointer select-none',
                  showFilters || activeFiltersCount > 0
                    ? 'bg-[#1A6B3C]/10 dark:bg-emerald-500/20 text-[#1A6B3C] dark:text-emerald-400 border-[#1A6B3C]/40 dark:border-emerald-500/40'
                    : 'bg-gray-50 dark:bg-[#1E1E1E] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-[#1A6B3C]/40'
                )}
              >
                <SlidersHorizontal size={15} />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#1A6B3C] dark:bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center font-mono">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Quick Department Filter Pills Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
            {['All', ...departments].map((dept) => {
              const val = dept === 'All' ? '' : dept;
              const isSel = filters.department === val;
              const short = dept === 'All' ? 'All Colleges' : dept.replace('College of ', '');
              const count = dept === 'All'
                ? matches.length
                : matches.filter((m) => m.student.department === dept).length;

              return (
                <button
                  key={dept}
                  type="button"
                  onClick={() => {
                    setFilters((prev) => ({
                      ...prev,
                      department: val,
                      course: val && coursesByDept?.[val]?.includes(prev.course) ? prev.course : '',
                    }));
                  }}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-jakarta text-xs font-semibold whitespace-nowrap transition-all duration-150 flex-shrink-0 cursor-pointer',
                    isSel
                      ? 'bg-[#1A6B3C] dark:bg-emerald-600 text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200/80 dark:hover:bg-white/15'
                  )}
                >
                  <span>{short}</span>
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                      isSel ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Expanded Drawer for Specific Course & Year Level */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/10 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Department Selector */}
                <div>
                  <label className="font-jakarta text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                    College / Department
                  </label>
                  <select
                    value={filters.department}
                    onChange={(e) => {
                      const newDept = e.target.value;
                      setFilters((prev) => ({
                        ...prev,
                        department: newDept,
                        course: newDept && coursesByDept?.[newDept]?.includes(prev.course) ? prev.course : '',
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 font-jakarta text-xs sm:text-sm bg-gray-50 dark:bg-[#1E1E1E] text-gray-900 dark:text-white focus:border-[#1A6B3C] dark:focus:border-emerald-400 outline-none cursor-pointer"
                  >
                    <option value="">All Colleges</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d.replace('College of ', '')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Course Selector */}
                <div>
                  <label className="font-jakarta text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                    Degree Course
                  </label>
                  <select
                    value={filters.course}
                    onChange={(e) => setFilters((prev) => ({ ...prev, course: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 font-jakarta text-xs sm:text-sm bg-gray-50 dark:bg-[#1E1E1E] text-gray-900 dark:text-white focus:border-[#1A6B3C] dark:focus:border-emerald-400 outline-none cursor-pointer"
                  >
                    <option value="">All Degree Courses</option>
                    {availableCourses.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Year Level Selector */}
                <div>
                  <label className="font-jakarta text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                    Year Level
                  </label>
                  <select
                    value={filters.yearLevel}
                    onChange={(e) => setFilters((prev) => ({ ...prev, yearLevel: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 font-jakarta text-xs sm:text-sm bg-gray-50 dark:bg-[#1E1E1E] text-gray-900 dark:text-white focus:border-[#1A6B3C] dark:focus:border-emerald-400 outline-none cursor-pointer"
                  >
                    <option value="">All Year Levels</option>
                    {yearLevels.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {hasActiveFilter && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-jakarta text-gray-400">
                    Showing students matching your active criteria.
                  </span>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1.5 font-jakarta text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-[#1A6B3C] dark:hover:text-emerald-400 cursor-pointer transition-colors"
                  >
                    <RotateCcw size={12} />
                    <span>Reset filters</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══ Match Cards Grid (All students prioritized by highest points) ═══ */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white dark:bg-[#181818] rounded-2xl h-72 border border-gray-200/80 dark:border-white/10 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-[#181818] rounded-3xl p-12 sm:p-16 text-center border border-gray-200/80 dark:border-white/10 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-[#1A6B3C]/10 dark:bg-emerald-500/15 text-[#1A6B3C] dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <Compass size={32} />
            </div>
            <h3 className="font-fraunces text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No students match your filter
            </h3>
            <p className="font-jakarta text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              We couldn't find anyone matching your current search terms. Try clearing your filters or launch an anonymous match!
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 font-jakarta text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Clear Filters</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleFindMatch}
                disabled={!canMatch}
                className="inline-flex items-center gap-2 bg-[#1A6B3C] dark:bg-emerald-600 text-white font-jakarta font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl hover:bg-[#155a33] dark:hover:bg-emerald-500 transition-colors shadow-xs cursor-pointer"
              >
                <Sparkles size={14} />
                <span>Pair Anonymously Now</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((match) => {
              const status = getConnectionStatus(match.student.id);
              const effectiveAvatarKey =
                match.student.avatarKey ||
                match.student.avatarPresetId ||
                getDeterministicAnonymousAvatar(match.student.id);
              const anonName = getAnonymousName(match.student, effectiveAvatarKey);

              const interests = match.student.interests || [];
              const sortedInterests = [
                ...match.sharedInterests,
                ...interests.filter((i) => !match.sharedInterests.includes(i)),
              ];

              const firstInterest = sortedInterests[0];
              // Responsive single-line interest rules:
              // If the first interest is long (> 9 chars), only show that one and `+{remaining} more`
              // If both fit cleanly without wrapping, show up to 2
              const isFirstLong = Boolean(firstInterest && firstInterest.length > 9);
              const canShowTwo =
                !isFirstLong &&
                sortedInterests.length >= 2 &&
                (firstInterest.length + sortedInterests[1].length <= 16);
              const maxToShow = canShowTwo ? 2 : 1;
              const displayedInterests = sortedInterests.slice(0, maxToShow);
              const remainingCount = sortedInterests.length - maxToShow;

              return (
                <div
                  key={match.student.id}
                  onClick={() => setSelectedCard(match)}
                  className="bg-white dark:bg-[#181818] rounded-2xl p-4 sm:p-5 border border-gray-200/80 dark:border-white/10 hover:border-[#1A6B3C]/50 dark:hover:border-emerald-500/50 hover:shadow-lg transition-all duration-200 flex flex-col justify-between shadow-xs relative group cursor-pointer"
                >
                  {/* Top Row: Anonymous Avatar on Top Left, Compatibility Badge & X Button on Top Right */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      {/* Top Left: Anonymous Avatar */}
                      <div className="relative shrink-0">
                        <AnonymousAvatar
                          avatarKey={effectiveAvatarKey}
                          size={54}
                          className="w-13 h-13 sm:w-14 sm:h-14 rounded-full"
                        />
                        {isOnline(match.student.id) && (
                          <span
                            className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-[#181818] rounded-full shadow-xs"
                            title="Online"
                          />
                        )}
                      </div>

                      {/* Top Right: Compatibility Badge & Dismiss X Button */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <MatchBadge
                          percentage={match.matchPercentage}
                          sharedCount={match.sharedInterests.length}
                          animate={false}
                          size="sm"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDismissedStudentIds((prev) => new Set([...prev, match.student.id]));
                            toast.info(`Dismissed ${anonName}`, { duration: 1500 });
                          }}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                          title="Dismiss student"
                          aria-label="Dismiss student"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Anonymous Name under the Avatar */}
                    <div className="mt-2.5 min-w-0">
                      <h3 className="font-fraunces text-base font-bold text-gray-900 dark:text-white leading-tight truncate">
                        {anonName}
                      </h3>
                      <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {match.student.course || match.student.department?.replace('College of ', '') || 'CHMSU Student'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-jakarta text-[10px] px-2 py-0.5 rounded-md font-medium shrink-0">
                          {match.student.yearLevel || 'Student'}
                        </span>
                        {match.student.department && (
                          <span className="text-[10px] font-jakarta font-medium text-gray-400 dark:text-gray-500 truncate">
                            {match.student.department.replace('College of ', '')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Single-line Responsive Interests List (never wraps to 2 lines) */}
                    <div className="my-3 w-full overflow-hidden">
                      {interests.length === 0 ? (
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 font-jakarta italic">
                          No interests listed
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-nowrap overflow-hidden w-full whitespace-nowrap min-w-0">
                          {displayedInterests.map((interest) => {
                            const isShared = match.sharedInterests.includes(interest);
                            return (
                              <InterestTag
                                key={interest}
                                label={interest}
                                isShared={isShared}
                                size="sm"
                                className="truncate shrink min-w-0 max-w-[125px]"
                              />
                            );
                          })}
                          {remainingCount > 0 && (
                            <span className="text-[10.5px] font-jakarta font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap">
                              +{remainingCount} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Under it: Connect Button Only (No profile button) */}
                  <div className="pt-1 mt-auto">
                    {status === 'accepted' ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#1A6B3C]/10 dark:bg-emerald-500/20 text-[#1A6B3C] dark:text-emerald-400 font-jakarta text-xs sm:text-sm font-bold">
                          <Check size={14} className="stroke-[2.5]" />
                          <span>Connected</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMessage(match.student.id, e);
                          }}
                          className="p-2.5 rounded-xl bg-[#1A6B3C] dark:bg-emerald-600 text-white hover:bg-[#155a33] dark:hover:bg-emerald-500 transition-colors cursor-pointer"
                          title="Open Chat"
                        >
                          <MessageCircle size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConnect(match.student.id, e);
                        }}
                        disabled={status === 'pending'}
                        className={cn(
                          'w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-jakarta text-xs sm:text-sm font-bold transition-all active:scale-[0.98] cursor-pointer shadow-xs',
                          status === 'none' &&
                          'bg-[#1A6B3C] dark:bg-emerald-600 hover:bg-[#155a33] dark:hover:bg-emerald-500 text-white',
                          status === 'pending' &&
                          'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 cursor-default'
                        )}
                      >
                        {status === 'none' ? (
                          <>
                            <UserPlus size={14} className="stroke-[2.5]" />
                            <span>Connect</span>
                          </>
                        ) : (
                          <span>⏳ Request Sent</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Profile Discovery View Modal ── */}
      {selectedCard && (() => {
        const selectedAvatarKey =
          selectedCard.student.avatarKey ||
          selectedCard.student.avatarPresetId ||
          getDeterministicAnonymousAvatar(selectedCard.student.id);
        const selectedAnonName = getAnonymousName(selectedCard.student, selectedAvatarKey);
        const cardStatus = getConnectionStatus(selectedCard.student.id);

        return (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setSelectedCard(null)}
          >
            <div
              className="bg-white dark:bg-[#181818] border border-gray-100 dark:border-white/10 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-[#1A6B3C] via-[#14532D] to-[#0A331C] p-6 text-white relative shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedCard(null)}
                  className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/15 transition-colors cursor-pointer"
                  title="Close profile"
                  aria-label="Close profile"
                >
                  <X size={18} />
                </button>

                <div className="flex items-start gap-4 pr-8">
                  <div className="relative shrink-0">
                    <AnonymousAvatar
                      avatarKey={selectedAvatarKey}
                      size={64}
                      className="w-16 h-16 rounded-2xl shadow-lg border-2 border-white/80"
                    />
                    {isOnline(selectedCard.student.id) && (
                      <span
                        className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-[#181818] rounded-full shadow-xs"
                        title="Online"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-fraunces text-xl sm:text-2xl font-bold text-white leading-tight truncate">
                        {selectedAnonName}
                      </h3>
                    </div>
                    <p className="font-jakarta text-xs sm:text-sm text-emerald-100/90 font-medium truncate mt-0.5">
                      {selectedCard.student.course ||
                        selectedCard.student.department?.replace('College of ', '') ||
                        'CHMSU Student'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="bg-white/20 text-white font-jakarta text-xs px-2.5 py-0.5 rounded-full font-medium">
                        {selectedCard.student.yearLevel || 'Student'}
                      </span>
                      {selectedCard.student.isVerified && (
                        <span className="bg-emerald-400/25 border border-emerald-300/30 text-emerald-100 font-jakarta text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <ShieldCheck size={12} className="text-emerald-300" />
                          <span>Verified CHMSU</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                {/* Match Compatibility Highlight */}
                <div className="flex items-center justify-between p-4 bg-[#1A6B3C]/8 dark:bg-emerald-500/10 rounded-2xl border border-[#1A6B3C]/15 dark:border-emerald-500/20">
                  <div>
                    <div className="flex items-center gap-1.5 text-[#1A6B3C] dark:text-emerald-400 font-jakarta font-bold text-sm">
                      <Sparkles size={14} />
                      <span>Peer Compatibility</span>
                    </div>
                    <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {selectedCard.sharedInterests.length > 0
                        ? `Shared campus passions and college synergy`
                        : 'Calculated from campus discovery preferences'}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <span className="font-fraunces text-2xl sm:text-3xl font-black text-[#1A6B3C] dark:text-emerald-400">
                      {selectedCard.matchPercentage}%
                    </span>
                    <span className="block text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">
                      Match
                    </span>
                  </div>
                </div>

                {/* About / Bio */}
                {selectedCard.student.bio && (
                  <div>
                    <p className="font-jakarta font-bold text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">
                      About
                    </p>
                    <p className="font-jakarta text-sm text-gray-700 dark:text-gray-200 leading-relaxed italic bg-gray-50 dark:bg-white/5 p-3.5 rounded-2xl border border-gray-100 dark:border-white/5">
                      "{selectedCard.student.bio}"
                    </p>
                  </div>
                )}

                {/* Shared Interests */}
                {selectedCard.sharedInterests.length > 0 && (
                  <div>
                    <p className="font-jakarta font-bold text-xs text-[#1A6B3C] dark:text-emerald-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Sparkles size={13} />
                      <span>{selectedCard.sharedInterests.length} Shared Interests</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCard.sharedInterests.map((interest) => (
                        <InterestTag key={interest} label={interest} isShared size="sm" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Passions */}
                {selectedCard.student.interests &&
                  selectedCard.student.interests.filter((i) => !selectedCard.sharedInterests.includes(i)).length > 0 && (
                    <div>
                      <p className="font-jakarta font-bold text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                        Other Passions
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedCard.student.interests
                          .filter((i) => !selectedCard.sharedInterests.includes(i))
                          .map((interest) => (
                            <InterestTag key={interest} label={interest} size="sm" />
                          ))}
                      </div>
                    </div>
                  )}

                {/* Student Organizations */}
                {selectedCard.student.organizations && selectedCard.student.organizations.length > 0 && (
                  <div>
                    <p className="font-jakarta font-bold text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                      Student Organizations
                    </p>
                    <div className="space-y-1.5">
                      {selectedCard.student.organizations.map((org) => {
                        const isSharedOrg = Boolean(currentUser?.organizations?.includes(org));
                        return (
                          <div
                            key={org}
                            className={cn(
                              'flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs sm:text-sm font-jakarta font-medium transition-colors',
                              isSharedOrg
                                ? 'bg-[#1A6B3C]/8 dark:bg-emerald-500/10 border-[#1A6B3C]/20 dark:border-emerald-500/20 text-[#1A6B3C] dark:text-emerald-300'
                                : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5 text-gray-800 dark:text-gray-200'
                            )}
                          >
                            <span className="text-sm">🏛️</span>
                            <span className="truncate">{org}</span>
                            {isSharedOrg && (
                              <span className="ml-auto text-[10px] font-bold bg-[#1A6B3C]/15 dark:bg-emerald-500/25 px-2 py-0.5 rounded-full shrink-0">
                                Shared Org!
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-5 pt-3 flex items-center gap-3 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] shrink-0">
                {cardStatus === 'none' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      handleConnect(selectedCard.student.id, e);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-jakarta font-bold text-sm bg-[#1A6B3C] dark:bg-emerald-600 text-white hover:bg-[#155a33] dark:hover:bg-emerald-500 transition-all shadow-xs cursor-pointer active:scale-[0.98]"
                  >
                    <UserPlus size={16} />
                    <span>Connect With Student</span>
                  </button>
                )}
                {cardStatus === 'pending' && (
                  <button
                    type="button"
                    disabled
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-jakarta font-bold text-sm bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 cursor-default"
                  >
                    <span>⏳ Connection Request Pending</span>
                  </button>
                )}
                {cardStatus === 'accepted' && (
                  <>
                    <div className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-jakarta font-bold text-sm bg-[#1A6B3C]/10 dark:bg-emerald-500/20 text-[#1A6B3C] dark:text-emerald-400">
                      <Check size={16} className="stroke-[2.5]" />
                      <span>Connected Ally</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        handleMessage(selectedCard.student.id, e);
                      }}
                      className="py-3 px-5 rounded-xl font-jakarta font-bold text-sm bg-[#1A6B3C] dark:bg-emerald-600 text-white hover:bg-[#155a33] dark:hover:bg-emerald-500 transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
                    >
                      <MessageCircle size={16} />
                      <span>Chat</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

