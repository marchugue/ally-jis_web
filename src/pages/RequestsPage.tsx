import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, RefreshCcw, UserPlus, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiClient, isApiConfigured } from '@/api/client';
import { interactionService } from '@/lib/services/interactionService';
import { chatService } from '@/lib/services/chatService';
import { notificationService } from '@/lib/services/notificationService';
import { profileMapper } from '@/lib/services/profileService';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import { usePresence } from '@/context/PresenceContext';
import { cn } from '@/lib/utils';

type RequestStatus = 'pending' | 'accepted' | 'rejected';

type RequestItem = {
  id: string;
  fromUserId: string;
  fromName: string;
  avatarUrl: string | null;
  course: string | null;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  status: RequestStatus;
  acceptedAt: string | null;
};

const POLL_INTERVAL_MS = 15000;

export default function RequestsPage() {
  const { user } = useAuth();
  const { isOnline } = usePresence();
  const navigate = useNavigate();
  const useBackend = Boolean(isApiConfigured && user);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({});

  const pendingCount = useMemo(
    () => requests.filter((request) => request.status === 'pending').length,
    [requests]
  );

  const loadRequests = async () => {
    if (!useBackend || !user) {
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setBanner(null);

    try {
      const notifData = await notificationService.listFriendRequests();

      const requesterIds = Array.from(
        new Set(notifData.map((row) => row.from_user_id).filter(Boolean))
      ) as string[];

      const profileMap = new Map<string, { name: string; avatarUrl: string | null; course: string | null }>();
      if (requesterIds.length > 0) {
        const profiles = await apiClient.getProfilesByIds(requesterIds);
        profiles.forEach((profile) => {
          const mapped = profileMapper(profile);
          profileMap.set(profile.id, {
            name: mapped.name,
            avatarUrl: mapped.avatar,
            course: mapped.course,
          });
        });
      }

      const statusMap = new Map<string, { status: RequestStatus; acceptedAt: string | null }>();
      if (requesterIds.length > 0) {
        const interactions = await apiClient.listIncomingInteractions(requesterIds);
        interactions.forEach((row) => {
          if (row.user_id) {
            statusMap.set(row.user_id, {
              status: row.status as RequestStatus,
              acceptedAt: row.accepted_at ?? null,
            });
          }
        });
      }

      const expirationMs = 1 * 60 * 60 * 1000;
      const cutoff = Date.now() - expirationMs;

      const nextRequests = notifData
        .filter((row) => Boolean(row.from_user_id))
        .map((row) => {
          const requesterId = row.from_user_id as string;
          const profile = profileMap.get(requesterId);
          const statusInfo = statusMap.get(requesterId);
          const status = statusInfo?.status ?? 'pending';
          const acceptedAt = statusInfo?.acceptedAt ?? (status === 'accepted' ? row.created_at : null);
          return {
            id: row.id,
            fromUserId: requesterId,
            fromName: profile?.name ?? 'Student',
            avatarUrl: profile?.avatarUrl ?? null,
            course: profile?.course ?? null,
            title: row.title,
            description: row.description ?? '',
            timestamp: new Date(row.created_at).toLocaleString(),
            isRead: row.is_read,
            status,
            acceptedAt,
          } as RequestItem;
        })
        .filter((request) => {
          if (request.status !== 'accepted' || !request.acceptedAt) return true;
          return new Date(request.acceptedAt).getTime() >= cutoff;
        });

      setRequests(nextRequests);
    } catch (err: any) {
      setBanner(err?.message ?? 'Failed to load requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();

    if (!useBackend || !user) return;

    const interval = setInterval(() => {
      void loadRequests();
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

    setRequests(prev => prev.map(r =>
      r.id === request.id ? { ...r, status: 'accepted', acceptedAt: new Date().toISOString() } : r
    ));

    try {
      const result = await interactionService.acceptRequest(user.id, request.fromUserId);
      await notificationService.markAsRead(request.id);

      if (result?.conversationId) {
        navigate('/messages', { state: { conversationId: result.conversationId } });
      } else {
        await loadRequests();
      }
    } catch (err: any) {
      setBanner(err?.message ?? 'Failed to accept request.');
      setRequests(prev => prev.map(r =>
        r.id === request.id ? { ...r, status: 'pending', acceptedAt: null } : r
      ));
    } finally {
      setBusy(request.id, false);
    }
  };

  const handleReject = async (request: RequestItem) => {
    if (!user) return;
    setBusy(request.id, true);
    setBanner(null);

    setRequests(prev => prev.map(r =>
      r.id === request.id ? { ...r, status: 'rejected' } : r
    ));

    try {
      await interactionService.rejectRequest(user.id, request.fromUserId);
      await notificationService.markAsRead(request.id);
    } catch (err: any) {
      setBanner(err?.message ?? 'Failed to reject request.');
      setRequests(prev => prev.map(r =>
        r.id === request.id ? { ...r, status: 'pending' } : r
      ));
    } finally {
      setBusy(request.id, false);
    }
  };

  const handleMessage = async (request: RequestItem) => {
    if (!user) return;
    setBusy(request.id, true);
    setBanner(null);

    try {
      const conversationId = await chatService.getOrCreateConversation(request.fromUserId);
      if (conversationId) {
        navigate('/messages', { state: { conversationId } });
      } else {
        navigate('/messages');
      }
    } catch (err: any) {
      setBanner('Could not start conversation: ' + err.message);
    } finally {
      setBusy(request.id, false);
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-32 md:pb-12 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-fraunces text-3xl font-bold text-[#1A6B3C]">Requests</h1>
            <p className="font-jakarta text-[#1A6B3C]/60 mt-1">
              {pendingCount > 0
                ? `You have ${pendingCount} pending connection request${pendingCount === 1 ? '' : 's'}`
                : 'No new requests at the moment.'}
            </p>
          </div>
          <button
            onClick={() => loadRequests()}
            className="p-2.5 rounded-xl border border-[#1A6B3C]/10 bg-white text-[#1A6B3C] shadow-sm hover:bg-[#1A6B3C]/5 transition-all"
            title="Refresh requests"
          >
            <RefreshCcw size={18} className={cn(loading && "animate-spin")} />
          </button>
        </div>

        {banner && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-jakarta text-amber-700 flex items-center justify-between">
            <span>{banner}</span>
            <button onClick={() => setBanner(null)} className="text-amber-500 hover:text-amber-700">
              <X size={16} />
            </button>
          </div>
        )}

        <div className="space-y-4">
          {loading && requests.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#1A6B3C]/6 card-shadow">
              <div className="w-12 h-12 border-4 border-[#1A6B3C]/10 border-t-[#1A6B3C] rounded-full animate-spin mx-auto mb-4" />
              <p className="font-jakarta text-gray-400">Loading your requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-[#1A6B3C]/6 card-shadow">
              <div className="w-20 h-20 bg-[#1A6B3C]/5 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <UserPlus size={40} className="text-[#1A6B3C]/20" />
              </div>
              <h3 className="font-fraunces text-2xl font-bold text-gray-700 mb-2">All caught up!</h3>
              <p className="font-jakarta text-gray-400 max-w-sm mx-auto mb-8">
                You don't have any pending requests. Why not explore the community and find new allies?
              </p>
              <button
                onClick={() => navigate('/discover')}
                className="bg-[#1A6B3C] text-white font-jakarta font-bold px-8 py-3 rounded-2xl hover:bg-[#155a33] transition-all shadow-lg"
              >
                Discover New Allies
              </button>
            </div>
          ) : (
            requests.map((request) => {
              const isBusy = busyIds[request.id];
              const isAccepted = request.status === 'accepted';
              const isRejected = request.status === 'rejected';

              return (
                <div
                  key={request.id}
                  className={cn(
                    "bg-white rounded-3xl p-5 border border-[#1A6B3C]/6 card-shadow transition-all duration-300",
                    isBusy && "opacity-70 grayscale-[0.5]"
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                    <div className="flex-1 flex items-start gap-4">
                      <div className="relative flex-shrink-0">
                        <AvatarDisplay
                          src={request.avatarUrl}
                          name={request.fromName}
                          className="w-16 h-16 rounded-2xl object-cover shadow-md"
                        />
                        {isOnline(request.fromUserId) && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm" title="Online" />
                        )}
                        {request.status === 'pending' && !isOnline(request.fromUserId) && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#E8A838] border-2 border-white rounded-full animate-pulse" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-jakarta font-bold text-gray-900 truncate">
                            {request.fromName}
                          </h3>
                          <span className={cn(
                            "text-[10px] font-jakarta font-bold px-2 py-0.5 rounded-full uppercase tracking-tight",
                            isAccepted ? "bg-emerald-100 text-emerald-700" :
                            isRejected ? "bg-gray-100 text-gray-500" :
                            "bg-amber-100 text-amber-700"
                          )}>
                            {request.status}
                          </span>
                        </div>
                        <p className="font-jakarta text-xs text-gray-500 mb-2">
                          {request.course || 'CHMSU Student'}
                        </p>
                        <p className="font-jakarta text-sm text-gray-600 leading-relaxed line-clamp-2 italic">
                          "{request.description || request.title}"
                        </p>
                        <p className="text-[10px] text-[#3B8C7E] mt-2 font-medium">
                          Sent {request.timestamp}
                        </p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col gap-2 min-w-[140px]">
                      {request.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleAccept(request)}
                            disabled={isBusy}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#1A6B3C] text-white font-jakarta font-bold text-sm px-6 py-2.5 rounded-2xl hover:bg-[#155a33] transition-all shadow-md active:scale-95 disabled:opacity-50"
                          >
                            <Check size={16} /> Accept
                          </button>
                          <button
                            onClick={() => handleReject(request)}
                            disabled={isBusy}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gray-50 text-gray-600 font-jakarta font-bold text-sm px-6 py-2.5 rounded-2xl hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-50"
                          >
                            <X size={16} /> Ignore
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <div className={cn(
                            "flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-jakarta font-bold text-xs border w-full",
                            isAccepted ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-gray-50 text-gray-400 border-gray-100"
                          )}>
                            {isAccepted ? (
                              <><Check size={14} /> Connected</>
                            ) : (
                              <><X size={14} /> Ignored</>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
