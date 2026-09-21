import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  RefreshCcw,
  UserPlus,
  X,
  Sparkles,
  Shield,
  Clock,
  Compass,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiClient, isApiConfigured } from '@/api/client';
import { interactionService } from '@/lib/services/interactionService';
import { notificationService } from '@/lib/services/notificationService';
import { profileMapper } from '@/lib/services/profileService';
import { AnonymousAvatar } from '@/components/match/AnonymousAvatar';
import { usePresence } from '@/context/PresenceContext';
import { PageTransition } from '@/components/PageTransition';
import { cn } from '@/lib/utils';

const ANIMAL_KEYS = [
  'fox', 'wolf', 'whale', 'owl', 'panda', 'otter', 'falcon', 'koala', 'lynx', 'dolphin', 'raven', 'badger'
];

function getAnonAvatarKey(id?: string | null, avatarPreset?: string | null): string {
  if (avatarPreset && ANIMAL_KEYS.includes(avatarPreset.toLowerCase().trim())) {
    return avatarPreset.toLowerCase().trim();
  }
  const seed = id || 'default';
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return ANIMAL_KEYS[hash % ANIMAL_KEYS.length];
}

type RequestItem = {
  id: string;
  fromUserId: string;
  fromName: string;
  avatarKey: string;
  course: string | null;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
};

type RequestFilter = 'all' | 'unread' | 'recent';

const POLL_INTERVAL_MS = 15000;

function formatTimestamp(dateStr?: string): string {
  if (!dateStr) return 'Just now';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return dateStr;
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return `${Math.floor(diffDay / 7)}w ago`;
}

function isRecent(timestampStr?: string): boolean {
  if (!timestampStr) return true;
  const then = new Date(timestampStr).getTime();
  if (isNaN(then)) return true;
  return Date.now() - then < 24 * 60 * 60 * 1000;
}

export default function RequestsPage() {
  const { user } = useAuth();
  const { isOnline } = usePresence();
  const navigate = useNavigate();
  const useBackend = Boolean(isApiConfigured && user);

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({});
  const [activeFilter, setActiveFilter] = useState<RequestFilter>('all');
  const [showMobileFilterDropdown, setShowMobileFilterDropdown] = useState(false);

  const pendingCount = requests.length;

  const loadRequests = async (showSpinner = false) => {
    if (!useBackend || !user) {
      setRequests([]);
      setLoading(false);
      return;
    }

    if (showSpinner) setLoading(true);

    try {
      const notifData = await notificationService.listFriendRequests();

      const requesterIds = Array.from(
        new Set(notifData.map((row) => row.from_user_id).filter(Boolean))
      ) as string[];

      const profileMap = new Map<
        string,
        { name: string; avatarUrl: string | null; course: string | null; avatarKey: string }
      >();

      if (requesterIds.length > 0) {
        const profiles = await apiClient.getProfilesByIds(requesterIds);
        profiles.forEach((profile) => {
          const mapped = profileMapper(profile);
          profileMap.set(profile.id, {
            name: mapped.name,
            avatarUrl: mapped.avatar,
            course: mapped.course,
            avatarKey: (profile as any).avatar_preset_id || (profile as any).avatarKey || 'fox',
          });
        });
      }

      const nextRequests = notifData
        .filter((row) => Boolean(row.from_user_id))
        .map((row) => {
          const requesterId = row.from_user_id as string;
          const profile = profileMap.get(requesterId);
          // Derive an anonymous avatar key — never expose real identity on this page
          const anonAvatarKey = getAnonAvatarKey(requesterId, profile?.avatarKey);
          return {
            id: row.id,
            fromUserId: requesterId,
            fromName: `Anonymous ${anonAvatarKey.charAt(0).toUpperCase() + anonAvatarKey.slice(1)}`,
            avatarKey: anonAvatarKey,
            course: 'CHMSU Student',
            title: row.title || 'New Match Request',
            description:
              row.description || 'An anonymous peer wants to connect with you! Say hello in anonymous chat.',
            timestamp: row.created_at,
            isRead: row.is_read,
          } as RequestItem;
        });

      setRequests(nextRequests);
    } catch (err: any) {
      setBanner({ type: 'error', message: err?.message ?? 'Failed to load requests.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests(true);

    if (!useBackend || !user) return;

    const interval = setInterval(() => {
      void loadRequests(false);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [useBackend, user?.id]);

  const setBusy = (id: string, value: boolean) => {
    setBusyIds((prev) => ({ ...prev, [id]: value }));
  };

  const handleAccept = async (request: RequestItem) => {
    if (!user) return;
    setBusy(request.id, true);
    setBanner(null);

    setRequests((prev) => prev.filter((r) => r.id !== request.id));

    try {
      const result = await interactionService.acceptRequest(user.id, request.fromUserId);
      await notificationService.markAsRead(request.id);

      setBanner({
        type: 'success',
        message: 'Match request accepted! Opening anonymous chat...',
      });

      if (result?.conversationId) {
        setTimeout(() => {
          navigate('/messages', { state: { conversationId: result.conversationId } });
        }, 500);
      }
    } catch (err: any) {
      setBanner({ type: 'error', message: err?.message ?? 'Failed to accept match request.' });
      void loadRequests(false);
    } finally {
      setBusy(request.id, false);
    }
  };

  const handleReject = async (request: RequestItem) => {
    if (!user) return;
    setBusy(request.id, true);
    setBanner(null);

    setRequests((prev) => prev.filter((r) => r.id !== request.id));

    try {
      await interactionService.rejectRequest(user.id, request.fromUserId);
      await notificationService.markAsRead(request.id);
      setBanner({ type: 'success', message: 'Match request declined.' });
    } catch (err: any) {
      setBanner({ type: 'error', message: err?.message ?? 'Failed to decline request.' });
      void loadRequests(false);
    } finally {
      setBusy(request.id, false);
    }
  };

  const counts = useMemo(() => {
    return {
      all: requests.length,
      unread: requests.filter((r) => !r.isRead).length,
      recent: requests.filter((r) => isRecent(r.timestamp)).length,
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (activeFilter === 'unread') return !r.isRead;
      if (activeFilter === 'recent') return isRecent(r.timestamp);
      return true;
    });
  }, [requests, activeFilter]);

  return (
    <PageTransition>
      <div className="flex-1 overflow-y-auto pb-28 md:pb-12 custom-scrollbar">
        <div className="max-w-3xl mx-auto px-0 sm:px-6 pt-4 sm:pt-6">
          {/* ═══ Header with Back Button, Title & Actions ═══ */}
          <div className="flex items-center justify-between gap-4 mb-4 sm:mb-6 px-4 sm:px-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/notifications')}
                className="w-9 h-9 rounded-xl border border-[#1A6B3C]/10 dark:border-white/10 bg-white dark:bg-[#111827] text-gray-700 dark:text-gray-200 hover:bg-[#1A6B3C]/5 dark:hover:bg-white/5 flex items-center justify-center shadow-xs transition-all cursor-pointer"
                title="Back to Notifications"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="font-fraunces font-bold text-2xl sm:text-3xl text-[#1A6B3C] dark:text-white tracking-tight">
                    Match Requests
                  </h1>
                  {pendingCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-jakarta font-extrabold bg-[#1A6B3C] dark:bg-emerald-600 text-white shadow-xs">
                      {pendingCount}
                    </span>
                  )}
                </div>
                <p className="font-jakarta text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Review anonymous invitations from campus peers. Accept to start an anonymous chat.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void loadRequests(true)}
              className="p-2.5 rounded-xl border border-[#1A6B3C]/10 dark:border-white/10 bg-white dark:bg-[#111827] text-[#1A6B3C] dark:text-emerald-400 shadow-xs hover:bg-[#1A6B3C]/5 dark:hover:bg-white/5 transition-all cursor-pointer flex-shrink-0"
              title="Refresh requests"
            >
              <RefreshCcw size={17} className={cn(loading && 'animate-spin')} />
            </button>
          </div>

          {/* ═══ Alert Banner ═══ */}
          {banner && (
            <div className="px-4 sm:px-0 mb-4">
              <div
                className={cn(
                  'rounded-2xl px-4 py-3 text-sm font-jakarta flex items-center justify-between transition-all',
                  banner.type === 'error'
                    ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40'
                )}
              >
                <span>{banner.message}</span>
                <button
                  type="button"
                  onClick={() => setBanner(null)}
                  className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ═══ Filter Controls: Desktop Tabs & Mobile Responsive Dropdown ═══ */}
          <div className="mb-4 sm:mb-6 px-4 sm:px-0">
            {/* Desktop Tabs */}
            <div className="hidden sm:flex items-center gap-2">
              {[
                { id: 'all', label: 'All Requests', count: counts.all },
                { id: 'unread', label: 'Unread', count: counts.unread },
                { id: 'recent', label: 'Recent', count: counts.recent },
              ].map((tab) => {
                const isActive = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilter(tab.id as RequestFilter)}
                    className={cn(
                      'px-4 py-1.5 rounded-2xl font-jakarta text-xs transition-all cursor-pointer select-none flex items-center gap-1.5',
                      isActive
                        ? 'bg-[#1A6B3C] text-white font-extrabold shadow-xs'
                        : 'bg-white dark:bg-[#181818] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 font-semibold border border-gray-200/80 dark:border-white/10'
                    )}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={cn(
                        'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'
                      )}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Mobile Responsive Filter Dropdown */}
            <div className="sm:hidden relative">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowMobileFilterDropdown((prev) => !prev)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-white/10 shadow-xs text-xs font-jakarta font-bold text-gray-800 dark:text-white cursor-pointer active:scale-95 transition-all"
                >
                  <Filter size={14} className="text-[#1A6B3C] dark:text-emerald-400" />
                  <span>
                    {activeFilter === 'all'
                      ? 'All Requests'
                      : activeFilter === 'unread'
                      ? 'Unread'
                      : 'Recent'}
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#1A6B3C]/10 text-[#1A6B3C] dark:bg-emerald-500/20 dark:text-emerald-400 font-bold">
                    {counts[activeFilter]}
                  </span>
                  <ChevronDown
                    size={14}
                    className={cn(
                      'text-gray-400 transition-transform duration-200',
                      showMobileFilterDropdown && 'rotate-180'
                    )}
                  />
                </button>

                <span className="text-[11px] font-jakarta text-gray-500 dark:text-gray-400 font-medium">
                  Showing {filteredRequests.length} of {requests.length}
                </span>
              </div>

              {showMobileFilterDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMobileFilterDropdown(false)}
                  />
                  <div className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-[#181818] border border-gray-200/80 dark:border-white/10 rounded-2xl shadow-xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                    {[
                      { id: 'all', label: 'All Requests', count: counts.all },
                      { id: 'unread', label: 'Unread', count: counts.unread },
                      { id: 'recent', label: 'Recent (Last 24h)', count: counts.recent },
                    ].map((item) => {
                      const isSelected = activeFilter === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActiveFilter(item.id as RequestFilter);
                            setShowMobileFilterDropdown(false);
                          }}
                          className={cn(
                            'w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-jakarta transition-colors text-left cursor-pointer',
                            isSelected
                              ? 'bg-[#1A6B3C]/10 text-[#1A6B3C] dark:bg-emerald-500/15 dark:text-emerald-400 font-bold'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 font-medium'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {isSelected ? (
                              <Check size={14} className="stroke-[2.5]" />
                            ) : (
                              <div className="w-3.5" />
                            )}
                            <span>{item.label}</span>
                          </div>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-bold',
                              isSelected
                                ? 'bg-[#1A6B3C] text-white'
                                : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                            )}
                          >
                            {item.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ═══ Content List ═══ */}
          <div className="space-y-4">
            {loading && requests.length === 0 ? (
              <div className="bg-white dark:bg-[#111827] rounded-none sm:rounded-3xl p-12 text-center border-y sm:border border-x-0 sm:border-x border-[#1A6B3C]/10 dark:border-white/10 shadow-none sm:shadow-xs">
                <div className="w-10 h-10 border-3 border-[#1A6B3C]/20 dark:border-white/10 border-t-[#1A6B3C] dark:border-t-emerald-400 rounded-full animate-spin mx-auto mb-3" />
                <p className="font-jakarta text-sm text-gray-500 dark:text-gray-400">
                  Loading match requests...
                </p>
              </div>
            ) : filteredRequests.length === 0 ? (
              /* ── Empty State ── */
              <div className="bg-white dark:bg-[#111827] rounded-none sm:rounded-3xl p-10 sm:p-14 text-center border-y sm:border border-x-0 sm:border-x border-[#1A6B3C]/10 dark:border-white/10 shadow-none sm:shadow-xs">
                <div className="w-16 h-16 bg-[#1A6B3C]/10 dark:bg-emerald-500/15 rounded-3xl flex items-center justify-center mx-auto mb-4 text-[#1A6B3C] dark:text-emerald-400 shadow-inner">
                  <Sparkles size={30} />
                </div>
                <h3 className="font-fraunces font-bold text-2xl text-gray-900 dark:text-white mb-2">
                  {activeFilter === 'all'
                    ? 'All caught up!'
                    : `No ${activeFilter} requests`}
                </h3>
                <p className="font-jakarta text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6 leading-relaxed">
                  {activeFilter === 'all'
                    ? "You don't have any pending match requests right now. Explore the community on Discover to meet new campus peers."
                    : `You don't have any ${activeFilter} match requests right now.`}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/notifications')}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 font-jakarta font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all cursor-pointer"
                  >
                    Back to Notifications
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/discover')}
                    className="px-6 py-2.5 rounded-xl bg-[#1A6B3C] dark:bg-emerald-600 hover:bg-[#155a33] dark:hover:bg-emerald-500 text-white font-jakarta font-bold text-sm shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Compass size={16} />
                    <span>Discover Peers</span>
                  </button>
                </div>
              </div>
            ) : (
              /* ── Request Cards ── */
              filteredRequests.map((request) => {
                const isBusy = busyIds[request.id];
                const online = isOnline(request.fromUserId);

                return (
                  <div
                    key={request.id}
                    className={cn(
                      'bg-white dark:bg-[#111827] rounded-none sm:rounded-3xl p-5 sm:p-6 border-y sm:border border-x-0 sm:border-x border-[#1A6B3C]/10 dark:border-white/10 shadow-none sm:shadow-xs hover:shadow-md transition-all duration-200',
                      isBusy && 'opacity-60 pointer-events-none'
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
                      {/* Left: Protected Avatar with Online Presence */}
                      <div className="relative flex-shrink-0 self-start">
                        <AnonymousAvatar
                          avatarKey={request.avatarKey || 'fox'}
                          size={54}
                          className="rounded-2xl shadow-sm"
                        />
                        {online && (
                          <span
                            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-[#111827] rounded-full shadow-xs"
                            title="Online now"
                          />
                        )}
                      </div>

                      {/* Middle: Details & Message */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-jakarta font-bold text-base text-gray-900 dark:text-white truncate">
                            Anonymous Peer
                          </h3>
                          <span className="inline-flex items-center gap-1 text-[10px] font-jakarta font-extrabold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 uppercase tracking-tight">
                            <Sparkles size={10} />
                            <span>Match Request</span>
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-jakarta font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 uppercase tracking-tight">
                            <Shield size={10} />
                            <span>Protected Student</span>
                          </span>
                        </div>

                        <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mb-2">
                          {request.course || 'CHMSU Student'}
                        </p>

                        {/* Message Box */}
                        <div className="bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-xl px-3.5 py-2.5 my-2">
                          <p className="font-jakarta text-xs sm:text-sm text-gray-700 dark:text-gray-200 leading-relaxed italic">
                            "{request.description}"
                          </p>
                        </div>

                        {/* Timestamp only — profile is hidden until allied */}
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                            <Clock size={12} />
                            <span>Sent {formatTimestamp(request.timestamp)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions (Two column one row on mobile, column on desktop) */}
                      <div className="grid grid-cols-2 sm:flex sm:flex-col gap-2.5 pt-2 sm:pt-0 sm:min-w-[150px] flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAccept(request)}
                          disabled={isBusy}
                          className="flex items-center justify-center gap-2 bg-[#1A6B3C] dark:bg-emerald-600 hover:bg-[#155a33] dark:hover:bg-emerald-500 text-white font-jakarta font-bold text-sm px-4 sm:px-5 py-2.5 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          <Check size={16} className="stroke-[2.5]" />
                          <span>Accept Request</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(request)}
                          disabled={isBusy}
                          className="flex items-center justify-center gap-1.5 bg-gray-100 dark:bg-white/10 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 text-gray-600 dark:text-gray-300 font-jakarta font-semibold text-sm px-4 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          <X size={15} />
                          <span>Decline Request</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

