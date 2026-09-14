// src/pages/MessagesPage.tsx
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Search, Info, Clock, MessagesSquare, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useConversations } from '@/hooks/useConversations';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { usePresence } from '@/context/PresenceContext';
import { useIcebreakers } from '@/hooks/useIcebreakers';
import { useChatView } from '@/context/ChatViewContext';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatBrowseList } from '@/components/chat/ChatBrowseList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { MessageInput } from '@/components/chat/MessageInput';
import { IcebreakerSuggestions } from '@/components/chat/IcebreakerSuggestions';
import { useIcebreakerToggle } from '@/hooks/useIcebreakerToggle';
import { BlockedBanner } from '@/components/chat/BlockedBanner';
import { Conversation, Student, Message, MessageReplyPreview } from '@/types/ally';
import { cn } from '@/lib/utils';
import { apiClient, isApiConfigured } from '@/api/client';
import { CURRENT_USER } from '@/data/mockData';
import { profileService } from '@/lib/services/profileService';
import { chatService, formatForwardedMessage } from '@/lib/services/chatService';
import { ConversationPaneSkeleton } from '@/components/chat/ConversationPaneSkeleton';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import { ConversationInfoPanel } from '@/components/chat/ConversationInfoPanel';
import { DeleteConversationModal, DeleteMode } from '@/components/chat/DeleteConversationModal';
import { MessageDeleteMode } from '@/components/chat/DeleteMessageModal';
import { ForwardMessageModal } from '@/components/chat/ForwardMessageModal';
import { AnonymousAvatar } from '@/components/match/AnonymousAvatar';
import { ChatStreakBadge } from '@/components/match/ChatStreakBadge';
import { MatchTimerBadge, ActiveAllyBadge } from '@/components/match/MatchTimerBadge';
import { FloatingStatusBadge } from '@/components/match/FloatingStatusBadge';
import { MatchRoadmapModal } from '@/components/match/MatchRoadmapModal';
import { getSocket } from '@/lib/socket';
import { useMatchReveal } from '@/hooks/useMatchReveal';
import { useChatBrowseUsers } from '@/hooks/useChatBrowseUsers';
import { useKeyboardInset } from '@/hooks/useKeyboardInset';
import { buildChatBrowseResults, computeMaxBrowseItems } from '@/lib/chatUserSearch';
import type { ChatBrowseUser } from '@/lib/chatUserSearch';
import { notify } from '@/components/ui/sonner';
import { toast } from 'sonner';

export default function MessagesPage() {
  const { user } = useAuth();
  const { onlineUserIds } = usePresence();
  const location = useLocation();
  const navigate = useNavigate();
  const { setChatFocused } = useChatView();

  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Student>(CURRENT_USER);
  const { conversations, isLoading: loadingConvs, refresh: refreshConvs, removeConversation } = useConversations(user?.id ?? null);
  const { messages, sendMessage, retrySend, reactToMessage, deleteMessage: deleteRealtimeMessage, isLoading: loadingMessages, partnerTyping, notifyTyping } = useRealtimeMessages(activeConversation?.id ?? null);
  const isAnonymousConversation = activeConversation?.variant && activeConversation.variant !== 'regular';
  const reveal = useMatchReveal(
    isAnonymousConversation ? activeConversation!.matchInfo?.matchId ?? null : null,
    activeConversation?.matchInfo?.stage ?? 0,
  );

  // Check if streak was activated today (both participants sent at least 1 message today), exactly like mobile
  const isStreakActiveToday = useMemo(() => {
    if (Boolean(activeConversation?.streakActiveToday || activeConversation?.matchInfo?.streakActiveToday)) {
      return true;
    }
    if (!messages.length || !user?.id) return false;

    // Evaluate in both PHT (UTC+8) and device local date
    const phtToday = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
    const localToday = new Date().toISOString().slice(0, 10);

    const hasBothOnDate = (targetDate: string) => {
      let myMsg = false;
      let partnerMsg = false;
      for (const msg of messages) {
        const timeStr = msg.createdAt || msg.timestamp;
        if (!timeStr) continue;
        const msgPht = new Date(new Date(timeStr).getTime() + 8 * 3600_000)
          .toISOString()
          .slice(0, 10);
        const msgLocal = new Date(timeStr).toISOString().slice(0, 10);

        if (msgPht === targetDate || msgLocal === targetDate) {
          if (msg.senderId === user.id) {
            myMsg = true;
          } else if (msg.senderId) {
            partnerMsg = true;
          }
        }
        if (myMsg && partnerMsg) return true;
      }
      return myMsg && partnerMsg;
    };

    return hasBothOnDate(phtToday) || hasBothOnDate(localToday);
  }, [messages, user?.id, activeConversation?.streakActiveToday, activeConversation?.matchInfo?.streakActiveToday]);

  const handleEndMatch = useCallback(async () => {
    const matchId = activeConversation?.matchInfo?.matchId;
    if (!matchId) return;
    try {
      await apiClient.endMatch(matchId);
      notify.success('Match ended');
      setShowInfoPanel(false);
      setActiveConversation((prev) =>
        prev && prev.matchInfo?.matchId === matchId
          ? {
              ...prev,
              variant: 'anonymous_ended',
              matchInfo: prev.matchInfo ? { ...prev.matchInfo, status: 'ended', ended: true } : prev.matchInfo,
            }
          : prev
      );
      void refreshConvs(true);
    } catch (err: any) {
      notify.error('Could not end match', err?.message);
    }
  }, [activeConversation, refreshConvs]);

  const handleDeleteConversation = useCallback(async (conv: Conversation, mode: DeleteMode = 'delete_permanently') => {
    // Optimistic — removed from the list immediately, the request happens
    // in the background. If it was the open conversation, close it too.
    removeConversation(conv.id);
    if (activeConversation?.id === conv.id) {
      setActiveConversation(null);
    }

    try {
      if (mode === 'delete_permanently') {
        if (conv.variant !== 'regular' && conv.variant !== 'anonymous_ended' && conv.matchInfo?.matchId) {
          apiClient.endMatch(conv.matchInfo.matchId).catch(() => {});
        }
        await apiClient.clearConversation(conv.id);
      } else {
        await apiClient.hideConversation(conv.id);
      }
    } catch (err: any) {
      notify.error('Could not process request', err?.message);
      void refreshConvs();
      return;
    }

    if (mode === 'delete_permanently') {
      // Permanent clear: no undo (cleared_at is already written).
      toast(`Deleted conversation history with ${conv.participantName} for you`);
    } else {
      // Hide: offer Undo via unhide.
      toast(`Hidden conversation with ${conv.participantName}`, {
        action: {
          label: 'Undo',
          onClick: async () => {
            try {
              await apiClient.unhideConversation(conv.id);
              void refreshConvs();
            } catch (err: any) {
              notify.error('Could not undo', err?.message);
            }
          },
        },
      });
    }
  }, [activeConversation, refreshConvs, removeConversation]);

  const handleDeleteMessage = useCallback((msg: Message, mode?: MessageDeleteMode) => {
    deleteRealtimeMessage(msg.id, mode ?? 'delete_for_me');
    if (mode === 'delete_for_everyone') {
      toast.success('Message deleted for everyone');
    } else {
      toast('Message deleted for you');
    }
  }, [deleteRealtimeMessage]);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [browseMode, setBrowseMode] = useState(false);
  const [startingUserId, setStartingUserId] = useState<string | null>(null);
  const [maxBrowseItems, setMaxBrowseItems] = useState(10);
  const [variantFilter, setVariantFilter] = useState<'all' | 'regular' | 'anonymous'>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const [unblocking, setUnblocking] = useState(false);
  const [replyTarget, setReplyTarget] = useState<MessageReplyPreview | null>(null);
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);
  const [forwarding, setForwarding] = useState(false);
  const [convToDelete, setConvToDelete] = useState<Conversation | null>(null);
  const lastReadRef = useRef<{ conversationId: string; messageId: string | null } | null>(null);

  // ─── FIX: track activeConversation in a ref so the conversation-selection
  // effect can read the current value without listing it as a dependency
  // (listing it caused: set → dep changes → re-run → set → … infinite loop).
  const activeConversationRef = useRef<Conversation | null>(null);
  useEffect(() => {
    activeConversationRef.current = activeConversation;
    // DEBUG — remove when streak is confirmed working
    if (activeConversation) {
      console.log(
        `[streak] conversation "${activeConversation.participantName}" (${activeConversation.id.slice(0, 8)}) — dayStreak: ${activeConversation.dayStreak}`,
      );
    }
  }, [activeConversation]);

  const useBackend = Boolean(isApiConfigured && user);

  // Instant real-time confirmation and ended listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onMatchConfirmed = (payload: { matchId: string; conversationId: string }) => {
      void refreshConvs(true);
      if (activeConversation?.id === payload.conversationId) {
        setActiveConversation((prev) =>
          prev
            ? {
                ...prev,
                matchInfo: prev.matchInfo
                  ? { ...prev.matchInfo, status: 'confirmed', confirmedAt: new Date().toISOString() }
                  : prev.matchInfo,
              }
            : null
        );
      }
    };

    const onMatchEnded = (payload?: { matchId?: string }) => {
      void refreshConvs(true);
      setActiveConversation((prev) => {
        if (!prev) return null;
        if (!payload?.matchId || prev.matchInfo?.matchId === payload.matchId) {
          return {
            ...prev,
            variant: 'anonymous_ended',
            matchInfo: prev.matchInfo ? { ...prev.matchInfo, status: 'ended', ended: true } : prev.matchInfo,
          };
        }
        return prev;
      });
    };

    const onStreakUpdated = (payload: {
      conversationId?: string;
      matchId?: string;
      dayStreak?: number;
      streak?: number;
      streakActiveToday?: boolean;
    }) => {
      void refreshConvs(true);
      setActiveConversation((prev) => {
        if (!prev) return prev;
        const isMatch =
          (payload.conversationId && prev.id === payload.conversationId) ||
          (payload.matchId && prev.matchInfo?.matchId === payload.matchId);
        if (!isMatch) return prev;
        const streak = payload.dayStreak ?? payload.streak ?? prev.dayStreak;
        const activeToday = payload.streakActiveToday ?? true;
        return {
          ...prev,
          dayStreak: streak,
          streakActiveToday: activeToday,
          matchInfo: prev.matchInfo
            ? {
                ...prev.matchInfo,
                dayStreak: streak,
                streakActiveToday: activeToday,
              }
            : prev.matchInfo,
        };
      });
    };

    socket.on('matchmaking:match_confirmed', onMatchConfirmed);
    socket.on('matchmaking:match_ended', onMatchEnded);
    socket.on('matchmaking:chat_expired', onMatchEnded);
    socket.on('conversation:streak_updated', onStreakUpdated);
    socket.on('matchmaking:streak_update', onStreakUpdated);
    return () => {
      socket.off('matchmaking:match_confirmed', onMatchConfirmed);
      socket.off('matchmaking:match_ended', onMatchEnded);
      socket.off('matchmaking:chat_expired', onMatchEnded);
      socket.off('conversation:streak_updated', onStreakUpdated);
      socket.off('matchmaking:streak_update', onStreakUpdated);
    };
  }, [activeConversation?.id, refreshConvs]);

  // Keep activeConversation.streakActiveToday in sync with computed isStreakActiveToday
  useEffect(() => {
    if (isStreakActiveToday && activeConversation && !activeConversation.streakActiveToday) {
      setActiveConversation((prev: any) =>
        prev
          ? {
              ...prev,
              streakActiveToday: true,
              matchInfo: prev.matchInfo ? { ...prev.matchInfo, streakActiveToday: true } : prev.matchInfo,
            }
          : prev,
      );
    }
  }, [isStreakActiveToday, activeConversation]);

  // ── Profile load ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (user?.id && useBackend) {
      profileService.getProfile(user.id)
        .then(setCurrentStudent)
        .catch(err => console.error('Error fetching student profile:', err));
    }
  }, [user?.id, useBackend]);
  const {
    enabled: icebreakersEnabled,
    loading: icebreakersLoading,
    toggle: handleIcebreakersToggle,
  } = useIcebreakerToggle(activeConversation?.id);

  // ── Icebreakers ───────────────────────────────────────────────────────────
  const lastSentRef = useRef<{ content: string | null; time: number }>({ content: null, time: 0 });

  const handleSendMessage = useCallback(async (content: string | null, image?: File | null) => {
    if (!user || !activeConversationRef.current) return;
    if (!content && !image) return;

    // Prevent accidental double clicks sending duplicate text
    const now = Date.now();
    if (!image && content && lastSentRef.current.content === content && now - lastSentRef.current.time < 1200) {
      return;
    }
    lastSentRef.current = { content, time: now };

    let imageUrl = null;
    if (image) {
      imageUrl = await chatService.uploadChatMedia(image);
    }

    try {
      await sendMessage(user.id, content, imageUrl, replyTarget);
    } catch (err) {
      console.warn('Message send failed or handled optimistically:', err);
    }
    setReplyTarget(null);
    refreshConvs(true);
  }, [user, sendMessage, refreshConvs, replyTarget]);

  const handleReply = useCallback((message: Message) => {
    if (!user || !activeConversation) return;
    if (message.id.startsWith('temp-') || message.status === 'sending' || message.status === 'failed') return;

    const senderName =
      message.senderId === user.id
        ? (currentStudent.username ?? currentStudent.name)
        : activeConversation.participantName;

    setReplyTarget({
      id: message.id,
      senderId: message.senderId,
      senderName,
      content: message.content,
      imageUrl: message.imageUrl ?? null,
    });
    setForwardMessage(null);
  }, [user, activeConversation, currentStudent.username, currentStudent.name]);

  const handleReact = useCallback((message: Message, emoji: string) => {
    if (!user) return;
    void reactToMessage(message.id, user.id, emoji);
  }, [user, reactToMessage]);

  const handleForward = useCallback((message: Message) => {
    if (message.id.startsWith('temp-') || message.status === 'sending' || message.status === 'failed') return;
    setForwardMessage(message);
    setReplyTarget(null);
  }, []);

  const handleForwardSelect = useCallback(async (targetConversation: Conversation) => {
    if (!user || !forwardMessage || !activeConversation) return;

    setForwarding(true);
    try {
      const senderName =
        forwardMessage.senderId === user.id
          ? (currentStudent.username ?? currentStudent.name)
          : activeConversation.participantName;

      const content = formatForwardedMessage(senderName, forwardMessage);
      await chatService.sendMessage(
        targetConversation.id,
        user.id,
        content,
        forwardMessage.imageUrl ?? null
      );
      setForwardMessage(null);
      void refreshConvs(true);
    } catch (err) {
      console.error('Failed to forward message:', err);
    } finally {
      setForwarding(false);
    }
  }, [user, forwardMessage, activeConversation, currentStudent.username, currentStudent.name, refreshConvs]);

  const handleSendIcebreaker = useCallback((content: string) => {
    void handleSendMessage(content);
  }, [handleSendMessage]);

  const otherUser = useMemo(() => ({
    id: activeConversation?.participantId ?? '',
    interests: activeConversation?.sharedInterests,
  }), [activeConversation?.participantId, activeConversation?.sharedInterests]);

  const { suggestions, dismiss, select } = useIcebreakers({
    messages,
    currentUser: currentStudent,
    otherUser,
    onSendIcebreaker: handleSendIcebreaker,
    // Honour the per-conversation toggle from the info panel.
    enabled: icebreakersEnabled,
  });

  // ── Block/unblock handlers ────────────────────────────────────────────────
  // Blocking no longer clears/navigates away from the conversation — it
  // stays open with a banner + disabled input. We just need the list (and
  // therefore the active conversation's blockStatus) to refresh.
  const handleBlockChange = useCallback(() => {
    void refreshConvs(true);
  }, [refreshConvs]);

  const handleUnblockFromBanner = useCallback(async () => {
    if (!activeConversation) return;
    setUnblocking(true);
    try {
      await apiClient.unblockUser(activeConversation.participantId);
      void refreshConvs(true);
    } catch (err) {
      console.error('Failed to unblock user:', err);
    } finally {
      setUnblocking(false);
    }
  }, [activeConversation, refreshConvs]);

  // ── Routing ───────────────────────────────────────────────────────────────
  const requestedConversationId = (location.state as { conversationId?: string } | null)?.conversationId;

  // ── Responsive ────────────────────────────────────────────────────────────
  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ── Chat-focused state for TopNav ─────────────────────────────────────────
  useEffect(() => {
    setChatFocused(isMobileView && Boolean(activeConversation));
    return () => setChatFocused(false);
  }, [isMobileView, activeConversation, setChatFocused]);

  // ── Conversation selection ────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const findAndSetActive = async () => {
      if (loadingConvs) return;

      if (requestedConversationId) {
        let match = conversations.find((conv) => conv.id === requestedConversationId);

        if (!match && useBackend) {
          await refreshConvs();
          match = conversations.find((conv) => conv.id === requestedConversationId);
        }

        if (match && isMounted) {
          setActiveConversation(match);
          navigate(location.pathname, { replace: true, state: {} });
        } else if (useBackend && !match) {
          try {
            const conv = await chatService.getConversation(requestedConversationId, user?.id ?? '');
            if (isMounted) {
              setActiveConversation(conv);
              navigate(location.pathname, { replace: true, state: {} });
            }
          } catch (e) {
            console.error('Failed to fetch requested conversation:', e);
          }
        }
      } else if (conversations.length > 0 && !activeConversationRef.current && !isMobileView) {
        setActiveConversation(conversations[0]);
      }
    };

    void findAndSetActive();
    return () => { isMounted = false; };
  }, [
    conversations,
    requestedConversationId,
    navigate,
    location.pathname,
    loadingConvs,
    useBackend,
    user?.id,
    refreshConvs,
    isMobileView,
  ]);

  // ── Keep activeConversation in sync with the refreshed list ──────────────
  // Needed now that block/unblock update blockStatus in place rather than
  // clearing the conversation — without this, the panel/banner would keep
  // showing stale blockStatus after refreshConvs() resolves.
  useEffect(() => {
    if (!activeConversation) return;
    const updated = conversations.find((c) => c.id === activeConversation.id);
    if (updated && updated.blockStatus !== activeConversation.blockStatus) {
      setActiveConversation(updated);
    }
  }, [conversations, activeConversation]);

  // ── Mark-read ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!useBackend || !user || !activeConversation?.id) return;

    const lastMessage = messages[messages.length - 1];
    const lastMessageId = lastMessage?.id ?? null;
    const lastMarked = lastReadRef.current;
    const openedNewConversation = lastMarked?.conversationId !== activeConversation.id;
    const newUnreadFromOther =
      Boolean(lastMessage) &&
      lastMessage.senderId !== user.id &&
      lastMarked?.messageId !== lastMessageId;

    if (!openedNewConversation && !newUnreadFromOther) return;

    const markRead = async () => {
      await chatService.markConversationRead(activeConversation.id);
      lastReadRef.current = { conversationId: activeConversation.id, messageId: lastMessageId };
    };

    void markRead();
  }, [useBackend, user, activeConversation?.id, messages.length]);

  // ── Info panel ────────────────────────────────────────────────────────────
  useEffect(() => {
    setShowInfoPanel(false);
    setReplyTarget(null);
    setForwardMessage(null);
  }, [activeConversation?.id]);

  // ── Filtered conversations ────────────────────────────────────────────────
  const filteredConversations = useMemo(() => {
     const q = searchQuery.trim().toLowerCase();
     const result = conversations.filter((conv) => {
       const iBlockedThem = conv.blockStatus === 'blockedByMe' || conv.blockStatus === 'mutual';
       if (iBlockedThem) return false;
       if (variantFilter === 'regular' && conv.variant !== 'regular') return false;
       if (variantFilter === 'anonymous' && conv.variant === 'regular') return false;
       if (!q) return true;
       return conv.participantName.toLowerCase().includes(q);
     });
     return result;
  }, [conversations, searchQuery, variantFilter]);

  const showBrowse = browseMode || searchQuery.trim().length > 0;
  const { allies: browseAllies, profiles: browseProfiles, isLoading: loadingBrowse } = useChatBrowseUsers(
    user?.id ?? null,
    showBrowse && useBackend,
  );

  const existingParticipantIds = useMemo(
    () => new Set(conversations.map((conv) => conv.participantId)),
    [conversations],
  );

  const browseResults = useMemo(
    () =>
      buildChatBrowseResults({
        query: searchQuery,
        allies: browseAllies,
        allProfiles: browseProfiles,
        existingParticipantIds,
        maxItems: maxBrowseItems,
      }),
    [searchQuery, browseAllies, browseProfiles, existingParticipantIds, maxBrowseItems],
  );

  const hasBrowseResults = browseResults.allies.length > 0 || browseResults.others.length > 0;

  useEffect(() => {
    const el = listContainerRef.current;
    if (!el) return;

    const updateMaxItems = () => {
      setMaxBrowseItems(computeMaxBrowseItems(el.clientHeight));
    };

    updateMaxItems();
    const observer = new ResizeObserver(updateMaxItems);
    observer.observe(el);
    return () => observer.disconnect();
  }, [showBrowse]);

  const handleBrowseSelect = useCallback(async (browseUser: ChatBrowseUser) => {
    if (!user || startingUserId) return;

    setStartingUserId(browseUser.id);
    try {
      const conversationId = await chatService.getOrCreateConversation(browseUser.id);
      const conv = await chatService.getConversation(conversationId, user.id);
      setActiveConversation(conv);
      setBrowseMode(false);
      setSearchQuery('');
      void refreshConvs(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      notify.error('Could not start conversation', message);
    } finally {
      setStartingUserId(null);
    }
  }, [user, startingUserId, refreshConvs]);


  const isParticipantOnline = activeConversation
    ? onlineUserIds.has(activeConversation.participantId)
    : false;

  const isBlocked = activeConversation ? activeConversation.blockStatus !== 'none' : false;

  // Lift messages + input above the mobile keyboard; header stays fixed.
  const keyboardInset = useKeyboardInset(isMobileView && Boolean(activeConversation));

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden h-full">
      <div className="flex-1 flex min-h-0 h-full w-full">

        {/* ── Sidebar ── */}
        <div className={cn(
          'w-full md:w-[360px] bg-white dark:bg-[#0D131F] flex flex-col overflow-hidden min-h-0 flex-shrink-0',
          'border-r border-gray-100 dark:border-white/10',
          activeConversation && 'hidden md:flex',
        )}>
          <div className="px-4 pt-4 pb-3 flex-shrink-0">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats or people…"
                className="w-full bg-gray-100 dark:bg-white/5 rounded-full pl-9 pr-4 py-2.5 text-sm font-jakarta text-gray-700 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-[#1A6B3C]/20 dark:focus:ring-emerald-500/20 border border-transparent dark:border-white/10 transition-all"
              />
            </div>
          </div>

          <div className="px-4 pb-3 flex-shrink-0 flex gap-1.5">
            {([
              { key: 'all', label: 'All Chats' },
              { key: 'regular', label: 'Chatmates' },
              { key: 'anonymous', label: 'Anonymous' },
            ] as const).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setVariantFilter(opt.key)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-jakarta font-medium transition-colors',
                  variantFilter === opt.key
                    ? 'bg-[#1A6B3C] dark:bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div
            ref={listContainerRef}
            className={cn(
              'flex-1 min-h-0',
              showBrowse ? 'overflow-y-auto' : 'overflow-hidden flex flex-col',
            )}
          >
            {showBrowse ? (
              <>
                {loadingBrowse ? (
                  <div className="p-6 text-center text-sm text-gray-400 font-jakarta">Loading people…</div>
                ) : hasBrowseResults ? (
                  <>
                    <p className="px-4 py-2 text-[10px] font-jakarta font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 bg-white dark:bg-[#0D131F] sticky top-0 z-10 border-b border-gray-50 dark:border-white/5">
                      {searchQuery.trim() ? 'Start a chat' : 'Allies to message'}
                    </p>
                    <ChatBrowseList
                      allies={browseResults.allies}
                      others={browseResults.others}
                      onSelect={handleBrowseSelect}
                      startingUserId={startingUserId}
                      onlineUserIds={onlineUserIds}
                      showSections={Boolean(searchQuery.trim())}
                      embedded
                    />
                  </>
                ) : searchQuery.trim() ? (
                  <div className="p-6 text-center">
                    <p className="text-gray-500 text-sm">No people found.</p>
                    <p className="text-gray-400 text-xs mt-1">Try a different name or connect on Discover.</p>
                  </div>
                ) : null}

                {filteredConversations.length > 0 && (
                  <>
                    <p className="px-4 py-2 text-[10px] font-jakarta font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 bg-white dark:bg-[#0D131F] sticky top-0 z-10 border-b border-gray-50 dark:border-white/5">
                      {searchQuery.trim() ? 'Matching chats' : 'Your chats'}
                    </p>
                    <ConversationList
                      conversations={filteredConversations}
                      activeId={activeConversation?.id}
                      activeIsStreakActiveToday={isStreakActiveToday}
                      onSelect={setActiveConversation}
                      onDelete={setConvToDelete}
                      isLoading={false}
                      onlineUserIds={onlineUserIds}
                      currentUserId={user?.id ?? CURRENT_USER.id}
                      embedded
                    />
                  </>
                )}

                {!loadingBrowse && !hasBrowseResults && filteredConversations.length === 0 && !searchQuery.trim() && (
                  <div className="p-8 text-center">
                    <p className="text-gray-500 text-sm">All your allies already have chats.</p>
                    <p className="text-gray-400 text-xs mt-1">Search above to message someone new.</p>
                  </div>
                )}
              </>
            ) : (
              <ConversationList
                conversations={filteredConversations}
                activeId={activeConversation?.id}
                activeIsStreakActiveToday={isStreakActiveToday}
                onSelect={setActiveConversation}
                onDelete={setConvToDelete}
                isLoading={loadingConvs}
                onlineUserIds={onlineUserIds}
                currentUserId={user?.id ?? CURRENT_USER.id}
              />
            )}
          </div>
        </div>

        {/* ── Chat Area ── */}
        <div className={cn(
          'flex-1 bg-white dark:bg-[#090D16] flex flex-col overflow-hidden min-h-0',
          (!activeConversation && !requestedConversationId) && 'hidden md:flex',
        )}>
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-3 bg-white dark:bg-[#0D131F] flex-shrink-0">
                <button
                  onClick={() => setActiveConversation(null)}
                  className="md:hidden p-2 -ml-2 text-gray-400 hover:text-[#1A6B3C] dark:hover:text-emerald-400"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="relative">
                  {isAnonymousConversation ? (
                    <AnonymousAvatar avatarKey={activeConversation.matchInfo?.partnerAvatar} size={40} className="rounded-full" />
                  ) : (
                    <AvatarDisplay
                      src={activeConversation.participantAvatar}
                      name={activeConversation.participantName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  {!isAnonymousConversation && isParticipantOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#0D131F] rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                    <h3 className="font-jakarta font-bold text-gray-900 dark:text-white truncate">
                      {activeConversation.participantName}
                    </h3>
                    {isAnonymousConversation && activeConversation.variant !== 'anonymous_ended' && (
                      <ActiveAllyBadge />
                    )}
                    {/* Streak badge — mobile aligned, visible for any dayStreak > 0 */}
                    <ChatStreakBadge
                      dayStreak={activeConversation.dayStreak ?? activeConversation.matchInfo?.dayStreak ?? 0}
                      isStreakActiveToday={isStreakActiveToday}
                      onClick={
                        isAnonymousConversation && activeConversation.variant !== 'anonymous_ended'
                          ? () => setShowRoadmapModal(true)
                          : undefined
                      }
                    />
                  </div>
                  {isAnonymousConversation ? (
                    activeConversation.variant === 'anonymous_ended' ? (
                      <p className="text-[10px] text-gray-400">Match ended</p>
                    ) : (
                      <p className="text-[10px] text-gray-400">Anonymous match</p>
                    )
                  ) : (
                    <p className="text-[10px] text-gray-400">
                      {isParticipantOnline ? 'Online' : 'Offline'}
                    </p>
                  )}
                </div>
                {isAnonymousConversation && (
                  <MatchTimerBadge
                    chatExpiresAt={activeConversation.matchInfo?.chatExpiresAt}
                    confirmedAt={activeConversation.matchInfo?.confirmedAt}
                    status={activeConversation.matchInfo?.status}
                    ended={activeConversation.variant === 'anonymous_ended'}
                    onExpire={() => {
                      void refreshConvs(true);
                      setActiveConversation((prev) =>
                        prev
                          ? {
                              ...prev,
                              variant: 'anonymous_ended',
                              matchInfo: prev.matchInfo
                                ? { ...prev.matchInfo, status: 'ended', ended: true }
                                : prev.matchInfo,
                            }
                          : null
                      );
                    }}
                  />
                )}
                <button
                  onClick={() => setShowInfoPanel((prev) => !prev)}
                  className={cn(
                    'flex p-2 rounded-full transition-all',
                    showInfoPanel
                      ? 'bg-[#1A6B3C]/10 dark:bg-emerald-500/20 text-[#1A6B3C] dark:text-emerald-400'
                      : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-[#1A6B3C] dark:hover:text-emerald-400',
                  )}
                  aria-label="Conversation info"
                >
                  <Info size={20} />
                </button>
              </div>

              {/* Messages + input — shift up with mobile keyboard */}
              <div
                className="flex-1 min-h-0 flex flex-col overflow-hidden"
                style={keyboardInset > 0 ? { paddingBottom: keyboardInset } : undefined}
              >
              <div className="flex-1 min-h-0 relative flex flex-col">
                {isAnonymousConversation && activeConversation.variant !== 'anonymous_ended' && (
                  <FloatingStatusBadge
                    stage={activeConversation.matchInfo?.stage ?? 1}
                    onClick={() => setShowRoadmapModal(true)}
                  />
                )}
                <ChatWindow
                  messages={messages}
                  currentUserId={user?.id ?? CURRENT_USER.id}
                  participantAvatar={activeConversation.participantAvatar}
                  participantName={activeConversation.participantName}
                  participantCourse={activeConversation.participantCourse}
                  participantDepartment={activeConversation.participantDepartment}
                  sharedInterests={
                    isAnonymousConversation
                      ? (reveal.reveal?.sharedInterests ?? activeConversation.sharedInterests ?? [])
                      : (activeConversation.sharedInterests ?? [])
                  }
                  partnerAvatar={activeConversation.matchInfo?.partnerAvatar}
                  isAnonymous={isAnonymousConversation}
                  isLoading={loadingMessages}
                  conversationId={activeConversation.id}
                  onRetry={retrySend}
                  onReact={handleReact}
                  onReply={handleReply}
                  onForward={handleForward}
                  onDelete={handleDeleteMessage}
                />
              </div>

              {/* Blocked banner — sits between messages and input, only
                  when this conversation has a block in either direction */}
              {isBlocked && (
                <BlockedBanner
                  participantName={activeConversation.participantName}
                  blockStatus={activeConversation.blockStatus}
                  onUnblock={handleUnblockFromBanner}
                  unblocking={unblocking}
                />
              )}

              {/* Match ended banner — informs the user that messaging is closed and provides quick delete */}
              {isAnonymousConversation && activeConversation.variant === 'anonymous_ended' && (
                <div className="px-4 py-2.5 bg-red-500/5 dark:bg-red-500/10 border-t border-b border-red-500/20 font-jakarta text-xs text-red-600 dark:text-red-400 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-red-500 flex-shrink-0" />
                    <span>This anonymous match has ended. Messaging is disabled.</span>
                  </div>
                  <button
                    onClick={() => handleDeleteConversation(activeConversation, 'delete_permanently')}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-100/80 hover:bg-red-200 dark:bg-red-950/60 dark:hover:bg-red-900/80 text-red-700 dark:text-red-300 font-semibold text-xs transition-colors ml-auto"
                  >
                    <Trash2 size={13} />
                    Delete Chat
                  </button>
                </div>
              )}

              {/* Input */}
              <div className="flex-shrink-0">
                <MessageInput
                  onSend={handleSendMessage}
                  onTextChange={(text) => notifyTyping(text.length > 0)}
                  disabled={loadingMessages || isBlocked || activeConversation.variant === 'anonymous_ended'}
                  replyTo={replyTarget}
                  onCancelReply={() => setReplyTarget(null)}
                  currentUserId={user?.id ?? CURRENT_USER.id}
                  participantName={activeConversation.participantName}
                >
                  {icebreakersEnabled && !isBlocked && activeConversation.variant !== 'anonymous_ended' && (
                    <IcebreakerSuggestions
                      suggestions={suggestions}
                      onSelect={select}
                      onDismiss={dismiss}
                    />
                  )}
                </MessageInput>
              </div>
              </div>
            </>
          ) : loadingConvs || Boolean(requestedConversationId) || (!isMobileView && conversations.length > 0) ? (
            <ConversationPaneSkeleton />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 dark:bg-[#090D16]">
              <div className="w-16 h-16 rounded-2xl bg-[#1A6B3C]/10 dark:bg-emerald-500/10 flex items-center justify-center mb-4 text-[#1A6B3C] dark:text-emerald-400">
                <MessagesSquare className="w-8 h-8" />
              </div>
              <h3 className="font-jakarta font-bold text-gray-900 dark:text-white text-base">
                No conversation selected
              </h3>
              <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed mt-1">
                Pick a conversation from the list or discover new allies on campus to start chatting.
              </p>
              <button
                onClick={() => navigate('/discover')}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-jakarta font-semibold bg-[#1A6B3C] text-white hover:bg-[#145530] transition-colors shadow-xs cursor-pointer"
              >
                <UserPlus size={14} />
                Discover Allies
              </button>
            </div>
          )}
        </div>

        {/* ── Info Panel (desktop) ── */}
        {activeConversation && showInfoPanel && (
          <ConversationInfoPanel
            conversation={activeConversation}
            isOnline={isParticipantOnline}
            isStreakActiveToday={isStreakActiveToday}
            icebreakersEnabled={icebreakersEnabled}
            icebreakersLoading={icebreakersLoading}
            onIcebreakersToggle={handleIcebreakersToggle}
            blockStatus={activeConversation.blockStatus}
            onBlockChange={handleBlockChange}
            onDelete={handleDeleteConversation}
            onEndMatch={handleEndMatch}
            sharedInterests={
              isAnonymousConversation
                ? (reveal.reveal?.sharedInterests ?? activeConversation.sharedInterests ?? [])
                : (activeConversation.sharedInterests ?? [])
            }
            variant="desktop"
            onClose={() => setShowInfoPanel(false)}
          />
        )}
      </div>

      {/* ── Info Panel (mobile) ── */}
      {activeConversation && showInfoPanel && isMobileView && (
        <ConversationInfoPanel
          conversation={activeConversation}
          isOnline={isParticipantOnline}
          isStreakActiveToday={isStreakActiveToday}
          icebreakersEnabled={icebreakersEnabled}
          icebreakersLoading={icebreakersLoading}
          onIcebreakersToggle={handleIcebreakersToggle}
          blockStatus={activeConversation.blockStatus}
          onBlockChange={handleBlockChange}
          onDelete={handleDeleteConversation}
          onEndMatch={handleEndMatch}
          sharedInterests={
            isAnonymousConversation
              ? (reveal.reveal?.sharedInterests ?? activeConversation.sharedInterests ?? [])
              : (activeConversation.sharedInterests ?? [])
          }
          variant="mobile"
          onClose={() => setShowInfoPanel(false)}
        />
      )}

      {/* ── Roadmap Progression Modal (anonymous conversations) ── */}
      {isAnonymousConversation && (
        <MatchRoadmapModal
          open={showRoadmapModal}
          onOpenChange={setShowRoadmapModal}
          stage={activeConversation.matchInfo?.stage ?? 1}
          dayStreak={activeConversation.dayStreak ?? activeConversation.matchInfo?.dayStreak ?? 0}
          partnerAlias={activeConversation.matchInfo?.partnerAlias ?? activeConversation.participantName}
          matchId={activeConversation.matchInfo?.matchId}
        />
      )}
      {forwardMessage && activeConversation && (
        <ForwardMessageModal
          conversations={conversations}
          currentConversationId={activeConversation.id}
          onClose={() => setForwardMessage(null)}
          onSelect={handleForwardSelect}
          forwarding={forwarding}
        />
      )}
      {convToDelete && (
        <DeleteConversationModal
          participantName={convToDelete.participantName}
          onClose={() => setConvToDelete(null)}
          onConfirmDelete={(mode) => {
            const target = convToDelete;
            setConvToDelete(null);
            handleDeleteConversation(target, mode);
          }}
        />
      )}
    </div>
  );
}