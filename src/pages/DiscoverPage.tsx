import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, MessageCircle, UserPlus, Check, Compass, X } from 'lucide-react';
import InterestTag from '@/components/ally/InterestTag';
import MatchBadge from '@/components/ally/MatchBadge';
import { CURRENT_USER, generateMatches } from '@/data/mockData';
import { MatchCard, Student } from '@/types/ally';
import { cn } from '@/lib/utils';
import { isApiConfigured } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { profileService } from '@/lib/services/profileService';
import { interactionService } from '@/lib/services/interactionService';
import { chatService } from '@/lib/services/chatService';
import { useLookupOptions } from '@/hooks/useLookupOptions';
import { usePresence } from '@/context/PresenceContext';

import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import { useNavigate } from 'react-router-dom';

const COURSES = ['Computer Studies', 'Engineering', 'Industrial Technology'];
export default function DiscoverPage() {
  const { user } = useAuth();
  const { isOnline } = usePresence();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const { departments, yearLevels } = useLookupOptions();
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ department: '', yearLevel: '', sortBy: 'match' });
  const [connections, setConnections] = useState<Record<string, 'none' | 'pending' | 'accepted'>>({});
  const [selectedCard, setSelectedCard] = useState<MatchCard | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [matches, setMatches] = useState<MatchCard[]>([]);

  const useBackend = Boolean(isApiConfigured && user);

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
        (interactions ?? []).forEach(r => {
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

  const filtered = matches
    .filter(m => {
      // Don't show users we are already connected to
      if (connections[m.student.id] === 'accepted') return false;
      
      if (search && !m.student.name.toLowerCase().includes(search.toLowerCase()) &&
          !m.student.course.toLowerCase().includes(search.toLowerCase())) return false;
      if (filters.department && m.student.department !== filters.department) return false;
      if (filters.yearLevel && m.student.yearLevel !== filters.yearLevel) return false;
      return true;
    })
    .sort((a, b) => {
      if (filters.sortBy === 'match') return b.matchPercentage - a.matchPercentage;
      if (filters.sortBy === 'newest') return new Date(b.student.joinedAt).getTime() - new Date(a.student.joinedAt).getTime();
      return a.student.name.localeCompare(b.student.name);
    });

  const handleConnect = async (studentId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!useBackend || !user) {
      setConnections(prev => ({
        ...prev,
        [studentId]: prev[studentId] === 'none' || !prev[studentId] ? 'pending' : prev[studentId],
      }));
      return;
    }

    if (connections[studentId] === 'accepted' || connections[studentId] === 'pending') return;
    
    try {
      setConnections(prev => ({ ...prev, [studentId]: 'pending' }));
      await interactionService.sendRequest(user.id, studentId);
    } catch (err: any) {
      setBanner(err.message);
      setConnections(prev => ({ ...prev, [studentId]: 'none' }));
    }
  };

  const handleReject = async (studentId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!useBackend || !user) {
      setMatches(prev => prev.filter(m => m.student.id !== studentId));
      return;
    }

    try {
      await interactionService.rejectRequest(user.id, studentId);
      setMatches(prev => prev.filter(m => m.student.id !== studentId));
    } catch (err: any) {
      setBanner(err.message);
    }
  };

  const handleMessage = async (targetUserId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const conversationId = await chatService.getOrCreateConversation(targetUserId);
      if (conversationId) {
        navigate('/messages', { state: { conversationId } });
      } else {
        // Fallback: just go to messages page if for some reason conversation is not found
        navigate('/messages');
      }
    } catch (err: any) {
      setBanner('Could not start conversation: ' + err.message);
    }
  };

  const getConnectionStatus = (id: string) => connections[id] || 'none';

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-32 md:pb-12 w-full">
        {banner && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-jakarta text-amber-700">
            {banner}
          </div>
        )}

        {!isLoading && (!currentUser?.username || currentUser?.interests.length === 0) && (
          <div className="mb-6 rounded-3xl bg-gradient-to-br from-[#1A6B3C] to-[#2d8a56] p-6 sm:p-8 text-white card-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Compass size={120} />
            </div>
            <div className="relative z-10 max-w-2xl">
              <h2 className="font-fraunces text-2xl sm:text-3xl font-bold mb-2">Welcome to Ally-jis! 👋</h2>
              <p className="font-jakarta text-sm sm:text-base text-white/90 mb-6">
                To start discovering compatible friends, you need to set up a unique username and pick your shared interests.
              </p>
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 bg-white text-[#1A6B3C] font-jakarta font-semibold text-sm px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
              >
                Complete Profile Setup
              </Link>
            </div>
          </div>
        )}
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="font-fraunces text-3xl font-bold text-[#1A6B3C]">Discover</h1>
          <p className="font-jakarta text-[#1A6B3C]/60 mt-1">
            Find CHMSU students with shared interests. Showing {filtered.length} compatible matches.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl p-4 mb-6 border border-[#1A6B3C]/8 shadow-sm">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or course..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-gray-50 focus:bg-white font-jakarta text-sm outline-none transition-colors"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl border font-jakarta text-sm font-medium transition-all',
                showFilters
                  ? 'bg-[#1A6B3C] text-white border-[#1A6B3C]'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#1A6B3C]/40'
              )}
            >
              <SlidersHorizontal size={16} />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-jakarta text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Department</label>
                <select
                  value={filters.department}
                  onChange={e => setFilters(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-jakarta text-sm bg-gray-50 focus:border-[#1A6B3C] outline-none"
                >
                  <option value="">All Departments</option>
                  {departments.map(d => <option key={d} value={d}>{d.replace('College of ', '')}</option>)}
                </select>
              </div>
              <div>
                <label className="font-jakarta text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Year Level</label>
                <select
                  value={filters.yearLevel}
                  onChange={e => setFilters(prev => ({ ...prev, yearLevel: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-jakarta text-sm bg-gray-50 focus:border-[#1A6B3C] outline-none"
                >
                  <option value="">All Years</option>
                  {yearLevels.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="font-jakarta text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={e => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-jakarta text-sm bg-gray-50 focus:border-[#1A6B3C] outline-none"
                >
                  <option value="match">Highest Match %</option>
                  <option value="newest">Newest Members</option>
                  <option value="name">Name A-Z</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Match Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="bg-white rounded-2xl h-64 border border-[#1A6B3C]/8 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-[#1A6B3C]/6">
            <Compass size={48} className="text-[#1A6B3C]/25 mx-auto mb-4" />
            <h3 className="font-fraunces text-2xl font-bold text-gray-600 mb-2">No matches yet!</h3>
            <p className="font-jakarta text-gray-400 mb-6 max-w-sm mx-auto">
              Add more interests to your profile to find compatible friends across CHMSU.
            </p>
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 bg-[#1A6B3C] text-white font-jakarta font-semibold text-sm px-6 py-3 rounded-xl hover:bg-[#155a33] transition-colors"
            >
              Add Interests to Profile
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((match, idx) => {
              const status = getConnectionStatus(match.student.id);
              return (
                <div
                  key={match.student.id}
                  className="bg-white rounded-2xl overflow-hidden border border-[#1A6B3C]/8 card-shadow hover:card-shadow-hover transition-all duration-200 cursor-pointer group"
                  style={{ animationDelay: `${idx * 80}ms` }}
                  onClick={() => setSelectedCard(match)}
                >
                  {/* Card Header */}
                  <div className="relative bg-gradient-to-br from-[#1A6B3C]/8 to-[#3B8C7E]/5 p-5 pb-4">
                    <div className="absolute top-3 right-3">
                      <MatchBadge
                        percentage={match.matchPercentage}
                        sharedCount={match.sharedInterests.length}
                        animate
                        size="sm"
                      />
                    </div>
                    <div className="relative inline-block mb-3">
                      <AvatarDisplay
                        src={match.student.avatar}
                        name={match.student.name}
                        className="w-16 h-16 rounded-2xl object-cover shadow-md"
                      />
                      {isOnline(match.student.id) && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm" title="Online" />
                      )}
                    </div>
                    <h3 className="font-jakarta font-bold text-gray-900 text-base leading-tight">{match.student.name}</h3>
                    <p className="font-jakarta text-xs text-gray-500 mt-0.5">{match.student.course}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="bg-[#1A6B3C]/10 text-[#1A6B3C] font-jakarta text-xs px-2 py-0.5 rounded-full font-medium">
                        {match.student.yearLevel}
                      </span>
                      {match.student.isVerified && (
                        <span className="bg-blue-50 text-blue-600 font-jakarta text-xs px-2 py-0.5 rounded-full font-medium">
                          ✓ CHMSU
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Shared Interests */}
                  <div className="px-4 py-3 border-t border-gray-50">
                    <p className="font-jakarta text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">
                      {match.sharedInterests.length} shared interests
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {match.sharedInterests.slice(0, 3).map(i => (
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
                    {status === 'none' && (
                      <button
                        onClick={(e) => handleReject(match.student.id, e)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-jakarta text-xs font-semibold transition-all active:scale-[0.98] bg-gray-100 text-gray-600 hover:bg-gray-200"
                      >
                        <X size={13} /> Pass
                      </button>
                    )}
                    <button
                      onClick={(e) => handleConnect(match.student.id, e)}
                      disabled={status === 'accepted' || status === 'pending'}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-jakarta text-xs font-semibold transition-all active:scale-[0.98]',
                        status === 'none' && 'bg-[#1A6B3C] text-white hover:bg-[#155a33] shadow-sm',
                        status === 'pending' && 'bg-[#E8A838]/15 text-[#E8A838] border border-[#E8A838]/30',
                        status === 'accepted' && 'bg-[#1A6B3C]/10 text-[#1A6B3C]',
                      )}
                    >
                      {status === 'none' && <><UserPlus size={13} /> Connect</>}
                      {status === 'pending' && <>⏳ Request Sent</>}
                      {status === 'accepted' && <><Check size={13} /> Connected</>}
                    </button>
                    {status === 'accepted' && (
                      <button
                        onClick={(e) => handleMessage(match.student.id, e)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#3B8C7E]/10 text-[#3B8C7E] hover:bg-[#3B8C7E]/20 transition-colors"
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

      {/* Student Detail Modal */}
      {selectedCard && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-[#1A6B3C] to-[#2d8a56] p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <AvatarDisplay
                      src={selectedCard.student.avatar}
                      name={selectedCard.student.name}
                      className="w-20 h-20 rounded-2xl object-cover shadow-xl border-2 border-white/30"
                    />
                    {isOnline(selectedCard.student.id) && (
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-[#1A6B3C] rounded-full" title="Online" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-white/20 text-white font-jakarta text-xs px-2 py-0.5 rounded-full">✓ CHMSU Verified</span>
                    </div>
                    <h2 className="font-fraunces text-2xl font-bold text-white">{selectedCard.student.name}</h2>
                    <p className="font-jakarta text-white/75 text-sm">{selectedCard.student.course}</p>
                    <p className="font-jakarta text-white/60 text-xs">{selectedCard.student.yearLevel} · {selectedCard.student.department.replace('College of ', '')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCard(null)}
                  className="text-white/60 hover:text-white text-xl leading-none"
                >
                  ×
                </button>
              </div>

              <div className="mt-4">
                <MatchBadge
                  percentage={selectedCard.matchPercentage}
                  sharedCount={selectedCard.sharedInterests.length}
                  animate
                  size="md"
                />
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto">
              {/* Bio */}
              {selectedCard.student.bio && (
                <div>
                  <p className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide mb-2">About</p>
                  <p className="font-jakarta text-sm text-gray-700 leading-relaxed">"{selectedCard.student.bio}"</p>
                </div>
              )}

              {/* Shared Interests */}
              <div>
                <p className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide mb-2">
                  {selectedCard.sharedInterests.length} Shared Interests
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedCard.sharedInterests.map(i => (
                    <InterestTag key={i} label={i} isShared />
                  ))}
                </div>
              </div>

              {/* All Interests */}
              {selectedCard.student.interests.filter(i => !selectedCard.sharedInterests.includes(i)).length > 0 && (
                <div>
                  <p className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide mb-2">Other Interests</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCard.student.interests.filter(i => !selectedCard.sharedInterests.includes(i)).map(i => (
                      <InterestTag key={i} label={i} size="sm" />
                    ))}
                  </div>
                </div>
              )}

              {/* Orgs */}
              {selectedCard.student.organizations.length > 0 && (
                <div>
                  <p className="font-jakarta font-semibold text-xs text-gray-400 uppercase tracking-wide mb-2">Organizations</p>
                  <div className="space-y-1.5">
                    {selectedCard.student.organizations.map(org => (
                      <div key={org} className="flex items-center gap-2 bg-[#1A6B3C]/5 px-3 py-2 rounded-xl">
                        <span className="text-sm">🏛️</span>
                        <span className="font-jakarta text-sm text-[#1A6B3C] font-medium">{org}</span>
                        {currentUser?.organizations?.includes(org) && (
                          <span className="ml-auto text-xs text-[#1A6B3C]/60 font-jakarta">Shared!</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={(e) => {
                  handleConnect(selectedCard.student.id, e);
                  setSelectedCard(null);
                }}
                disabled={getConnectionStatus(selectedCard.student.id) === 'accepted' || getConnectionStatus(selectedCard.student.id) === 'pending'}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-jakarta font-bold text-sm transition-all',
                  getConnectionStatus(selectedCard.student.id) === 'none' && 'bg-[#1A6B3C] text-white hover:bg-[#155a33] shadow-lg',
                  getConnectionStatus(selectedCard.student.id) === 'pending' && 'bg-[#E8A838]/15 text-[#E8A838] border border-[#E8A838]/30',
                  getConnectionStatus(selectedCard.student.id) === 'accepted' && 'bg-[#1A6B3C]/10 text-[#1A6B3C]',
                )}
              >
                {getConnectionStatus(selectedCard.student.id) === 'none' && <><UserPlus size={16} /> Send Connect Request</>}
                {getConnectionStatus(selectedCard.student.id) === 'pending' && <>⏳ Request Sent</>}
                {getConnectionStatus(selectedCard.student.id) === 'accepted' && <><Check size={16} /> Connected!</>}
              </button>
              
              {getConnectionStatus(selectedCard.student.id) === 'accepted' && (
                <button
                  onClick={(e) => handleMessage(selectedCard.student.id, e)}
                  className="px-4 py-3 rounded-2xl bg-[#3B8C7E] text-white hover:bg-[#327a6d] transition-all shadow-lg flex items-center justify-center"
                >
                  <MessageCircle size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
