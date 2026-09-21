import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import InterestTag from '@/components/ally/InterestTag';
import MatchBadge from '@/components/ally/MatchBadge';
import { CURRENT_USER, generateMatches } from '@/data/mockData';
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
import { AnimatePresence } from 'framer-motion';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import { AnonymousAvatar } from '@/components/match/AnonymousAvatar';

const MOCK_PARTNERS: MatchIdentityView[] = [
  { myAlias: 'Velvet Fox', myAvatar: 'fox', partnerAlias: 'Midnight Wolf', partnerAvatar: 'wolf' },
  { myAlias: 'Solar Panda', myAvatar: 'panda', partnerAlias: 'Emerald Owl', partnerAvatar: 'owl' },
  { myAlias: 'Cosmic Falcon', myAvatar: 'falcon', partnerAlias: 'Golden Lynx', partnerAvatar: 'lynx' },
  { myAlias: 'Aura Otter', myAvatar: 'otter', partnerAlias: 'Neon Dolphin', partnerAvatar: 'dolphin' },
];

export default function DiscoverPage() {
  const { user } = useAuth();
  const { isOnline } = usePresence();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const { departments, coursesByDept, yearLevels } = useLookupOptions();

  // Mock Matchmaking state (offline / test sandbox)
  const [mockQueueActive, setMockQueueActive] = useState(false);
  const [mockPhase, setMockPhase] = useState<'searching' | 'pending'>('searching');
  const [mockPartnerIndex, setMockPartnerIndex] = useState(0);
  const [mockAccepted, setMockAccepted] = useState(false);
  const [mockDeadline, setMockDeadline] = useState<number | null>(null);

  // Auto-progress mock queue from 'searching' to 'pending' after 4.2 seconds
  useEffect(() => {
    if (mockQueueActive && mockPhase === 'searching') {
      const timer = setTimeout(() => {
        setMockPhase('pending');
        setMockDeadline(Date.now() + 30000);
      }, 4200);
      return () => clearTimeout(timer);
    }
  }, [mockQueueActive, mockPhase]);

  // Discover Directory & Filters state (General filters)
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    department: '',
    course: '',
    yearLevel: '',
    sortBy: 'match',
  });
  const [connections, setConnections] = useState<Record<string, 'none' | 'pending' | 'accepted'>>({});
  const [selectedCard, setSelectedCard] = useState<MatchCard | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [matches, setMatches] = useState<MatchCard[]>([]);

  const useBackend = Boolean(isApiConfigured && user);

  const {
    phase: matchPhase,
    error: matchError,
    pendingMatch,
    activeMatch,
    activeMatches,
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
      if (!useBackend || !user) {
        setMatches(generateMatches(CURRENT_USER, []));
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const [current, others, interactions] = await Promise.all([
          profileService.getProfile(user.id),
          profileService.getAllProfiles(user.id),
          interactionService.listMyInteractions(),
        ]);

        setCurrentUser(current);

        const connectionMap: Record<string, any> = {};
        (interactions ?? []).forEach((r) => {
          connectionMap[r.target_user_id] = r.status;
        });
        setConnections(connectionMap);

        const allMatches = generateMatches(current, others);
        setMatches(allMatches);
      } catch (err: any) {
        if (isMounted) setBanner(err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (!isApiConfigured) {
      setBanner('API is not configured. Showing demo matches.');
      setMatches(generateMatches(CURRENT_USER, []));
      setIsLoading(false);
    } else if (!user) {
      setBanner('Sign in to see real matches.');
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

  const availableCourses = filters.department && coursesByDept?.[filters.department]
    ? coursesByDept[filters.department]
    : Array.from(new Set(Object.values(coursesByDept || {}).flat()));

  const filtered = matches
    .filter((m) => {
      if (connections[m.student.id] === 'accepted') return false;
      const q = search.toLowerCase();
      const nameMatch = m.student.name.toLowerCase().includes(q);
      const courseMatch = m.student.course.toLowerCase().includes(q);
      const interestMatch = m.student.interests.some((i) => i.toLowerCase().includes(q));
      return nameMatch || courseMatch || interestMatch;
    })
    .filter((m) => {
      if (!filters.department) return true;
      return m.student.department === filters.department;
    })
    .filter((m) => {
      if (!filters.course) return true;
      return m.student.course === filters.course;
    })
    .filter((m) => {
      if (!filters.yearLevel) return true;
      return m.student.yearLevel === filters.yearLevel;
    })
    .sort((a, b) => {
      if (filters.sortBy === 'match') return b.matchPercentage - a.matchPercentage;
      if (filters.sortBy === 'popular') {
        const popA = (a.student as any).followersCount ?? (a.student as any).followers_count ?? 0;
        const popB = (b.student as any).followersCount ?? (b.student as any).followers_count ?? 0;
        return popB - popA;
      }
      if (filters.sortBy === 'newest') return b.student.id.localeCompare(a.student.id);
      if (filters.sortBy === 'name') return a.student.name.localeCompare(b.student.name);
      return 0;
    });

  const handleConnect = async (studentId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (connections[studentId] && connections[studentId] !== 'none') return;

    setConnections((prev) => ({ ...prev, [studentId]: 'pending' }));

    if (useBackend && user) {
      try {
        await interactionService.sendRequest(user.id, studentId);
      } catch (err: any) {
        setConnections((prev) => ({ ...prev, [studentId]: 'none' }));
        setBanner(err.message || 'Failed to send request');
      }
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
      setBanner(err.message || 'Could not start conversation');
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

    if (!canMatch) return;

    // Clear any mock state so live backend overlay runs
    setMockQueueActive(false);

    const preferences: MatchmakingPreferences = {
      department: filters.department || undefined,
      course: filters.course || undefined,
      strictCourse: Boolean(filters.course),
      matchType: 'anonymous',
    };

    try {
      await joinQueue(preferences);
    } catch (err: any) {
      toast.error(err?.message || 'Could not join matchmaking queue');
    }
  };

  const activeFiltersCount = (filters.department ? 1 : 0) + (filters.course ? 1 : 0) + (filters.yearLevel ? 1 : 0);
  const hasActiveFilter = activeFiltersCount > 0 || filters.sortBy !== 'match' || Boolean(search);

  const handleResetFilters = () => {
    setFilters({ department: '', course: '', yearLevel: '', sortBy: 'match' });
    setSearch('');
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar relative bg-[#F7F4EF] dark:bg-[#121212] transition-colors duration-200">
      {/* ── Full-screen matchmaking overlay (live backend searching + match found) ── */}
      <AnimatePresence>
        {(mockQueueActive || isInQueue || matchPhase === 'pending') && (
          <MatchmakingOverlay
            phase={
              mockQueueActive
                ? mockPhase
                : matchPhase === 'pending'
                  ? 'pending'
                  : 'searching'
            }
            identity={mockQueueActive ? MOCK_PARTNERS[mockPartnerIndex] : matchIdentity}
            preferences={
              mockQueueActive
                ? {
                  department: filters.department || 'College of Computer Studies',
                  course: filters.course || 'Information Technology',
                  strictCourse: Boolean(filters.course),
                  matchType: 'anonymous',
                }
                : activePreferences ?? {
                  department: filters.department || undefined,
                  course: filters.course || undefined,
                  strictCourse: Boolean(filters.course),
                  matchType: 'anonymous',
                }
            }
            myAccepted={
              mockQueueActive
                ? mockAccepted
                : matchPhase === 'pending' && pendingMatch
                  ? (pendingMatch.user_a_id === user?.id ? pendingMatch.accepted_a : pendingMatch.accepted_b)
                  : false
            }
            acceptDeadline={mockQueueActive ? mockDeadline : acceptDeadline}
            compatibilityScore={mockQueueActive ? 96 : compatibilityScore}
            isMock={mockQueueActive}
            onCancel={() => {
              if (mockQueueActive) {
                setMockQueueActive(false);
              } else {
                void leaveQueue();
              }
            }}
            onAccept={() => {
              if (mockQueueActive) {
                setMockAccepted(true);
                setTimeout(() => {
                  setMockQueueActive(false);
                  navigate('/messages');
                }, 1500);
              } else {
                void acceptMatch();
              }
            }}
            onDecline={() => {
              if (mockQueueActive) {
                setMockAccepted(false);
                setMockPhase('searching');
                setMockPartnerIndex((prev) => (prev + 1) % MOCK_PARTNERS.length);
              } else {
                void declineMatch();
              }
            }}
            onForceMatch={
              mockQueueActive
                ? () => {
                  setMockPhase('pending');
                  setMockDeadline(Date.now() + 30000);
                }
                : undefined
            }
            onRestartSearch={
              mockQueueActive
                ? () => {
                  setMockAccepted(false);
                  setMockPhase('searching');
                }
                : undefined
            }
            onCyclePartner={
              mockQueueActive
                ? () => {
                  setMockPartnerIndex((prev) => (prev + 1) % MOCK_PARTNERS.length);
                }
                : undefined
            }
          />
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-32 md:pb-12 w-full">
        {banner && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-jakarta text-amber-700">
            {banner}
          </div>
        )}


        {!isLoading && (!currentUser?.username || currentUser?.interests.length === 0) && (
          <div className="mb-6 rounded-3xl bg-gradient-to-br from-[#1A6B3C] to-[#2d8a56] dark:from-[#1A1A1A] dark:to-[#161616] p-6 sm:p-8 text-white card-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Compass size={120} /></div>
            <div className="relative z-10 max-w-2xl">
              <h2 className="font-fraunces text-2xl sm:text-3xl font-bold mb-2">Welcome to Ally-jis! 👋</h2>
              <p className="font-jakarta text-sm sm:text-base text-white/90 mb-6">To start discovering compatible friends, set up a username and pick your interests.</p>
              <Link to="/profile" className="inline-flex items-center gap-2 bg-white dark:bg-emerald-950/80 text-[#1A6B3C] dark:text-emerald-300 font-jakarta font-semibold text-sm px-6 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-emerald-900 transition-colors shadow-sm">Complete Profile Setup</Link>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-fraunces text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Discover Students
            </h1>
            <p className="font-jakarta text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Browse compatible CHMSU peers or pair anonymously with someone based on shared interests.
            </p>
          </div>
          <div className="text-xs font-jakarta text-gray-500 dark:text-gray-400 shrink-0">
            Showing <strong className="text-gray-900 dark:text-white">{filtered.length}</strong> compatible student{filtered.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* Search & Filter Bar + Embedded Find Match Anonymously Button */}
        <div className="bg-white dark:bg-[#181818] rounded-2xl p-3 sm:p-4 mb-6 border border-gray-200/80 dark:border-white/10 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
            {/* Search input */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student name, course, or interest..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 focus:border-[#1A6B3C] dark:focus:border-emerald-400 bg-gray-50 dark:bg-[#1E1E1E] focus:bg-white dark:focus:bg-[#1F2937] font-jakarta text-xs sm:text-sm outline-none transition-colors dark:text-white dark:placeholder:text-gray-500"
              />
            </div>

            {/* Action Buttons: Filters + Find Match Anonymously */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl border font-jakarta text-xs sm:text-sm font-medium transition-all cursor-pointer select-none',
                  showFilters || activeFiltersCount > 0
                    ? 'bg-[#1A6B3C]/10 dark:bg-emerald-500/20 text-[#1A6B3C] dark:text-emerald-400 border-[#1A6B3C]/40 dark:border-emerald-500/40 font-semibold'
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

              <button
                type="button"
                onClick={handleFindMatch}
                disabled={!canMatch}
                title={
                  dailyMatchCount >= DAILY_LIMIT
                    ? 'Daily match quota reached (5/5)'
                    : filters.course
                      ? `Find an anonymous match in ${filters.course}`
                      : filters.department
                        ? `Find an anonymous match in ${filters.department}`
                        : 'Pair anonymously with a student based on your interests'
                }
                className={cn(
                  'flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl font-jakarta text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-[0.98] whitespace-nowrap',
                  canMatch
                    ? 'bg-[#1A6B3C] dark:bg-emerald-600 hover:bg-[#155a33] dark:hover:bg-emerald-500 text-white'
                    : 'bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                )}
              >
                <Sparkles size={15} className={cn(canMatch && 'text-emerald-200 animate-pulse')} />
                <span>Find Match Anonymously</span>
                <span className="text-[11px] opacity-80 font-mono font-normal">
                  ({Math.max(0, DAILY_LIMIT - dailyMatchCount)}/{DAILY_LIMIT})
                </span>
              </button>
            </div>
          </div>

          {/* Quick Horizontal Department Filter Pills on Mobile */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 sm:hidden">
            {['All', ...departments].map((dept) => {
              const val = dept === 'All' ? '' : dept;
              const isSel = filters.department === val;
              const short = dept === 'All' ? 'All' : dept.replace('College of ', '');
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
                    'px-3 py-1 rounded-full font-jakarta text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 cursor-pointer',
                    isSel
                      ? 'bg-[#1A6B3C] dark:bg-emerald-600 text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/15'
                  )}
                >
                  {short}
                </button>
              );
            })}
          </div>

          {/* Expanded General Filters Grid */}
          {showFilters && (
            <div className="mt-3 pt-4 border-t border-gray-100 dark:border-white/10 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. Department */}
                <div>
                  <label className="font-jakarta text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                    Department
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
                    <option value="">All Departments</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d.replace('College of ', '')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Course */}
                <div>
                  <label className="font-jakarta text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                    Course
                  </label>
                  <select
                    value={filters.course}
                    onChange={(e) => setFilters((prev) => ({ ...prev, course: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 font-jakarta text-xs sm:text-sm bg-gray-50 dark:bg-[#1E1E1E] text-gray-900 dark:text-white focus:border-[#1A6B3C] dark:focus:border-emerald-400 outline-none cursor-pointer"
                  >
                    <option value="">All Courses</option>
                    {availableCourses.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Year Level */}
                <div>
                  <label className="font-jakarta text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                    Year Level
                  </label>
                  <select
                    value={filters.yearLevel}
                    onChange={(e) => setFilters((prev) => ({ ...prev, yearLevel: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 font-jakarta text-xs sm:text-sm bg-gray-50 dark:bg-[#1E1E1E] text-gray-900 dark:text-white focus:border-[#1A6B3C] dark:focus:border-emerald-400 outline-none cursor-pointer"
                  >
                    <option value="">All Years</option>
                    {yearLevels.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Sort By */}
                <div>
                  <label className="font-jakarta text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 font-jakarta text-xs sm:text-sm bg-gray-50 dark:bg-[#1E1E1E] text-gray-900 dark:text-white focus:border-[#1A6B3C] dark:focus:border-emerald-400 outline-none cursor-pointer"
                  >
                    <option value="match">Highest Match %</option>
                    <option value="popular">🔥 Most Popular</option>
                    <option value="newest">Newest Members</option>
                    <option value="name">Name A-Z</option>
                  </select>
                </div>
              </div>

              {/* Filter controls / reset */}
              {hasActiveFilter && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] font-jakarta text-gray-400">
                    Filters refine both directory results and anonymous matchmaking criteria.
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

        {/* Match Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white dark:bg-[#181818] rounded-2xl h-64 border border-gray-100 dark:border-white/10 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-[#181818] rounded-2xl p-12 sm:p-16 text-center border border-gray-100 dark:border-white/10">
            <Compass size={48} className="text-[#1A6B3C]/25 dark:text-emerald-400/30 mx-auto mb-4" />
            <h3 className="font-fraunces text-2xl font-bold text-gray-700 dark:text-gray-200 mb-2">No students match this criteria</h3>
            <p className="font-jakarta text-xs sm:text-sm text-gray-400 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              Try adjusting your search terms or clearing your department and course filters.
            </p>
            <div className="flex items-center justify-center gap-3">
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
                className="inline-flex items-center gap-2 bg-[#1A6B3C] dark:bg-emerald-600 text-white font-jakarta font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl hover:bg-[#155a33] dark:hover:bg-emerald-500 transition-colors shadow-xs cursor-pointer"
              >
                <Sparkles size={14} />
                <span>Pair Anonymously Instead</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((match, idx) => {
              const status = getConnectionStatus(match.student.id);
              return (
                <div
                  key={match.student.id}
                  className="bg-white dark:bg-[#181818] rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 card-shadow hover:card-shadow-hover transition-all duration-200 cursor-pointer group"
                  style={{ animationDelay: `${idx * 80}ms` }}
                  onClick={() => setSelectedCard(match)}
                >
                  {/* Card Header */}
                  <div className="relative bg-gradient-to-br from-[#1A6B3C]/8 to-[#3B8C7E]/5 dark:from-white/5 dark:to-white/5 p-5 pb-4">
                    <div className="absolute top-3 right-3">
                      <MatchBadge
                        percentage={match.matchPercentage}
                        sharedCount={match.sharedInterests.length}
                        animate
                        size="sm"
                      />
                    </div>
                    <div className="relative inline-block mb-3">
                      <AnonymousAvatar
                        avatarKey={idx % 4 === 0 ? 'fox' : idx % 4 === 1 ? 'panda' : idx % 4 === 2 ? 'owl' : 'wolf'}
                        className="w-16 h-16 rounded-2xl shadow-md"
                      />
                      {isOnline(match.student.id) && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full shadow-sm" title="Online" />
                      )}
                    </div>
                    <h3 className="font-jakarta font-bold text-gray-900 dark:text-white text-base leading-tight">Anonymous Peer</h3>
                    <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-0.5">{match.student.course}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="bg-[#1A6B3C]/10 dark:bg-white/10 text-[#1A6B3C] dark:text-gray-200 font-jakarta text-xs px-2 py-0.5 rounded-full font-medium">
                        {match.student.yearLevel}
                      </span>
                      {match.student.isVerified && (
                        <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-jakarta text-xs px-2 py-0.5 rounded-full font-medium">
                          ✓ CHMSU
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Shared Interests */}
                  <div className="px-4 py-3 border-t border-gray-50 dark:border-white/5">
                    <p className="font-jakarta text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">
                      {match.sharedInterests.length} shared interests
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {match.sharedInterests.slice(0, 3).map((i) => (
                        <InterestTag key={i} label={i} isShared size="sm" />
                      ))}
                      {match.sharedInterests.length > 3 && (
                        <span className="text-xs text-gray-400 font-jakarta px-2 py-0.5">
                          +{match.sharedInterests.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="px-4 pb-4 flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCard(match);
                      }}
                      className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 font-jakarta text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      Profile
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleConnect(match.student.id, e)}
                      disabled={status === 'accepted' || status === 'pending'}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-jakarta text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer',
                        status === 'none' && 'bg-[#1A6B3C] dark:bg-emerald-600 text-white hover:bg-[#155a33] dark:hover:bg-emerald-500 shadow-sm',
                        status === 'pending' && 'bg-[#E8A838]/15 text-[#E8A838] border border-[#E8A838]/30',
                        status === 'accepted' && 'bg-[#1A6B3C]/10 dark:bg-emerald-500/20 text-[#1A6B3C] dark:text-emerald-400'
                      )}
                    >
                      {status === 'none' && <><UserPlus size={13} /> Request Match</>}
                      {status === 'pending' && <>⏳ Match Requested</>}
                      {status === 'accepted' && <><Check size={13} /> Chatting</>}
                    </button>
                    {status === 'accepted' && (
                      <button
                        type="button"
                        onClick={(e) => handleMessage(match.student.id, e)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#3B8C7E]/10 text-[#3B8C7E] hover:bg-[#3B8C7E]/20 transition-colors cursor-pointer"
                      >
                        <MessageCircle size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Student Profile Details Modal ── */}
      {selectedCard && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="bg-white dark:bg-[#181818] border border-transparent dark:border-white/10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-[#1A6B3C] to-[#2d8a56] dark:from-emerald-950 dark:to-[#121212] p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <AnonymousAvatar
                      avatarKey="fox"
                      className="w-16 h-16 rounded-2xl border-2 border-white shadow-lg"
                    />
                    {isOnline(selectedCard.student.id) && (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" title="Online" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-fraunces text-xl font-bold text-white leading-tight">Anonymous Peer</h3>
                    <p className="font-jakarta text-xs text-white/80 mt-0.5">{selectedCard.student.course}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="bg-white/20 text-white font-jakarta text-xs px-2.5 py-0.5 rounded-full font-medium">
                        {selectedCard.student.yearLevel}
                      </span>
                      {selectedCard.student.isVerified && (
                        <span className="bg-white/20 text-white font-jakarta text-xs px-2.5 py-0.5 rounded-full font-medium">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCard(null)}
                  className="text-white/70 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Match Percentage */}
              <div className="flex items-center justify-between p-4 bg-[#1A6B3C]/5 dark:bg-white/5 rounded-2xl">
                <div>
                  <p className="font-jakarta font-semibold text-sm text-[#1A6B3C] dark:text-emerald-400">Match Compatibility</p>
                  <p className="font-jakarta text-xs text-gray-400">Based on shared interests & courses</p>
                </div>
                <div className="text-right">
                  <span className="font-fraunces text-2xl font-bold text-[#1A6B3C] dark:text-emerald-400">{selectedCard.matchPercentage}%</span>
                </div>
              </div>

              {/* Bio */}
              {selectedCard.student.bio && (
                <div>
                  <p className="font-jakarta font-semibold text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">About</p>
                  <p className="font-jakarta text-sm text-gray-700 dark:text-gray-200 leading-relaxed">"{selectedCard.student.bio}"</p>
                </div>
              )}

              {/* Shared Interests */}
              <div>
                <p className="font-jakarta font-semibold text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                  {selectedCard.sharedInterests.length} Shared Interests
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedCard.sharedInterests.map((i) => (
                    <InterestTag key={i} label={i} isShared size="sm" />
                  ))}
                </div>
              </div>

              {/* All Interests */}
              {selectedCard.student.interests.filter((i) => !selectedCard.sharedInterests.includes(i)).length > 0 && (
                <div>
                  <p className="font-jakarta font-semibold text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Other Interests</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCard.student.interests.filter((i) => !selectedCard.sharedInterests.includes(i)).map((i) => (
                      <InterestTag key={i} label={i} size="sm" />
                    ))}
                  </div>
                </div>
              )}

              {/* Orgs */}
              {selectedCard.student.organizations.length > 0 && (
                <div>
                  <p className="font-jakarta font-semibold text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Organizations</p>
                  <div className="space-y-1.5">
                    {selectedCard.student.organizations.map((org) => (
                      <div key={org} className="flex items-center gap-2 bg-[#1A6B3C]/5 dark:bg-white/5 px-3 py-2 rounded-xl">
                        <span className="text-sm">🏛️</span>
                        <span className="font-jakarta text-sm text-[#1A6B3C] dark:text-emerald-400 font-medium">{org}</span>
                        {currentUser?.organizations?.includes(org) && (
                          <span className="ml-auto text-xs text-[#1A6B3C]/60 dark:text-emerald-400/70 font-jakarta">Shared!</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 pt-0 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedCard(null)}
                className="w-full py-3 rounded-2xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 font-jakarta font-semibold text-sm text-gray-700 dark:text-gray-200 transition-all cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
