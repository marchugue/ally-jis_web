// src/pages/MessagesPage.tsx
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Search, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useConversations } from '@/hooks/useConversations';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { usePresence } from '@/context/PresenceContext';
import { useIcebreakers } from '@/hooks/useIcebreakers';
import { useChatView } from '@/context/ChatViewContext';
import { ConversationList } from '@/components/chat/ConversationList';
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
import { ConversationHeader } from '@/components/chat/ConversationHeader';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import { ConversationInfoPanel } from '@/components/chat/ConversationInfoPanel';
import { DeleteMode } from '@/components/chat/DeleteConversationModal';
import { MessageDeleteMode } from '@/components/chat/DeleteMessageModal';
import { ForwardMessageModal } from '@/components/chat/ForwardMessageModal';
import { AnonymousAvatar } from '@/components/match/AnonymousAvatar';
import { ChatStreakBadge } from '@/components/match/ChatStreakBadge';
import { MatchRevealPanel } from '@/components/match/MatchRevealPanel';
import { useMatchReveal } from '@/hooks/useMatchReveal';
import { notify } from '@/components/ui/sonner';
import { toast } from 'sonner';

export default function MessagesPage() {
  const { user } = useAuth();
  const { onlineUserIds } = usePresence();
  const location = useLocation();
  const navigate = useNavigate();
  const { setChatFocused } = useChatView();

  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student>(CURRENT_USER);
  const { conversations, isLoading: loadingConvs, refresh: refreshConvs, removeConversation } = useConversations(user?.id ?? null);
  const { messages, sendMessage, retrySend, reactToMessage, deleteMessage: deleteRealtimeMessage, isLoading: loadingMessages, partnerTyping, notifyTyping } = useRealtimeMessages(activeConversation?.id ?? null);
  const isAnonymousConversation = activeConversation?.variant && activeConversation.variant !== 'regular';
  const reveal = useMatchReveal(
    isAnonymousConversation ? activeConversation!.matchInfo?.matchId ?? null : null,
    activeConversation?.matchInfo?.stage ?? 0,
  );

  const handleEndMatch = useCallback(async () => {
    const matchId = activeConversation?.matchInfo?.matchId;
    if (!matchId) return;
    try {
      await apiClient.endMatch(matchId);
      notify.success('Match ended');
      setShowInfoPanel(false);
      void refreshConvs();
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
  const [variantFilter, setVariantFilter] = useState<'all' | 'regular' | 'anonymous'>('all');
  const [unblocking, setUnblocking] = useState(false);
  const [replyTarget, setReplyTarget] = useState<MessageReplyPreview | null>(null);
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);
  const [forwarding, setForwarding] = useState(false);
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
  const handleSendMessage = useCallback(async (content: string | null, image?: File | null) => {
    if (!user || !activeConversationRef.current) return;

    let imageUrl = null;
    if (image) {
      imageUrl = await chatService.uploadChatMedia(image);
    }

    await sendMessage(user.id, content, imageUrl, replyTarget);
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

  const isParticipantOnline = activeConversation
    ? onlineUserIds.has(activeConversation.participantId)
    : false;

  const isBlocked = activeConversation ? activeConversation.blockStatus !== 'none' : false;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden h-full">
      <div className="flex-1 flex min-h-0 h-full w-full">

        {/* ── Sidebar ── */}
        <div className={cn(
          'w-full md:w-[360px] bg-white flex flex-col overflow-hidden min-h-0 flex-shrink-0',
          'border-r border-gray-100',
          activeConversation && 'hidden md:flex',
        )}>
          <div className="p-4 flex items-center justify-between flex-shrink-0">
            <h1 className="font-fraunces text-2xl font-bold text-[#1A6B3C]">Chats</h1>
            <button className="p-2 text-[#1A6B3C] hover:bg-[#1A6B3C]/5 rounded-full transition-all">
              <UserPlus size={20} />
            </button>
          </div>

          <div className="px-4 pb-3 flex-shrink-0">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations"
                className="w-full bg-gray-100 rounded-full pl-9 pr-4 py-2.5 text-sm font-jakarta text-gray-700 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#1A6B3C]/20 transition-all"
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
                    ? 'bg-[#1A6B3C] text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <ConversationList
              conversations={filteredConversations}
              activeId={activeConversation?.id}
              onSelect={setActiveConversation}
              isLoading={loadingConvs}
              onlineUserIds={onlineUserIds}
              currentUserId={user?.id ?? CURRENT_USER.id}
            />
          </div>
        </div>

        {/* ── Chat Area ── */}
        <div className={cn(
          'flex-1 bg-white flex flex-col overflow-hidden min-h-0',
          !activeConversation && 'hidden md:flex',
        )}>
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-white flex-shrink-0">
                <button
                  onClick={() => setActiveConversation(null)}
                  className="md:hidden p-2 -ml-2 text-gray-400 hover:text-[#1A6B3C]"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="relative">
                  {isAnonymousConversation ? (
                    <AnonymousAvatar avatarKey={activeConversation.matchInfo?.partnerAvatar} size={40} className="rounded-xl" />
                  ) : (
                    <AvatarDisplay
                      src={activeConversation.participantAvatar}
                      name={activeConversation.participantName}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                  )}
                  {!isAnonymousConversation && isParticipantOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h3 className="font-jakarta font-bold text-gray-900 truncate">
                      {activeConversation.participantName}
                    </h3>
                    {/* Streak badge — visible for any conversation with a 3+ day PHT streak */}
                    <ChatStreakBadge
                      dayStreak={activeConversation.dayStreak ?? 0}
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
                <button
                  onClick={() => setShowInfoPanel((prev) => !prev)}
                  className={cn(
                    'flex p-2 rounded-full transition-all',
                    showInfoPanel
                      ? 'bg-[#1A6B3C]/10 text-[#1A6B3C]'
                      : 'text-gray-400 hover:bg-gray-100 hover:text-[#1A6B3C]',
                  )}
                  aria-label="Conversation info"
                >
                  <Info size={20} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 min-h-0 relative flex flex-col">
                <ChatWindow
                  messages={messages}
                  currentUserId={user?.id ?? CURRENT_USER.id}
                  participantAvatar={activeConversation.participantAvatar}
                  participantName={activeConversation.participantName}
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

              {/* Input */}
              <div className="flex-shrink-0">
                <MessageInput
                  onSend={handleSendMessage}
                  onTextChange={(text) => notifyTyping(text.length > 0)}
                  disabled={loadingMessages || isBlocked}
                  replyTo={replyTarget}
                  onCancelReply={() => setReplyTarget(null)}
                  currentUserId={user?.id ?? CURRENT_USER.id}
                  participantName={activeConversation.participantName}
                >
                  {icebreakersEnabled && !isBlocked && (
                    <IcebreakerSuggestions
                      suggestions={suggestions}
                      onSelect={select}
                      onDismiss={dismiss}
                    />
                  )}
                </MessageInput>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50/50">
              <ConversationHeader
                currentUser={currentStudent}
                activeConversation={null}
                variant="empty"
              />
            </div>
          )}
        </div>

        {/* ── Info Panel (desktop) ── */}
        {activeConversation && showInfoPanel && !isAnonymousConversation && (
          <ConversationInfoPanel
            conversation={activeConversation}
            isOnline={isParticipantOnline}
            icebreakersEnabled={icebreakersEnabled}
            icebreakersLoading={icebreakersLoading}
            onIcebreakersToggle={handleIcebreakersToggle}
            blockStatus={activeConversation.blockStatus}
            onBlockChange={handleBlockChange}
            onDelete={handleDeleteConversation}
            variant="desktop"
            onClose={() => setShowInfoPanel(false)}
          />
        )}
      </div>

      {/* ── Info Panel (mobile) ── */}
      {activeConversation && showInfoPanel && isMobileView && !isAnonymousConversation && (
        <ConversationInfoPanel
          conversation={activeConversation}
          isOnline={isParticipantOnline}
          icebreakersEnabled={icebreakersEnabled}
          icebreakersLoading={icebreakersLoading}
          onIcebreakersToggle={handleIcebreakersToggle}
          blockStatus={activeConversation.blockStatus}
          onBlockChange={handleBlockChange}
          onDelete={handleDeleteConversation}
          variant="mobile"
          onClose={() => setShowInfoPanel(false)}
        />
      )}

      {/* ── Match reveal panel (anonymous conversations only) ── */}
      {activeConversation?.matchInfo && (
        <MatchRevealPanel
          open={showInfoPanel && Boolean(isAnonymousConversation)}
          onOpenChange={setShowInfoPanel}
          matchId={activeConversation.matchInfo.matchId}
          stage={activeConversation.matchInfo.stage}
          reveal={reveal.reveal}
          identity={{
            partnerAlias: activeConversation.matchInfo.partnerAlias ?? 'your match',
            partnerAvatar: activeConversation.matchInfo.partnerAvatar ?? '',
          }}
          onUseIcebreaker={(text) => void sendMessage(user?.id ?? CURRENT_USER.id, text)}
          onFriendRequestSent={() => notify.success('Friend request sent')}
          onEndMatch={handleEndMatch}
          ended={activeConversation.variant === 'anonymous_ended'}
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
    </div>
  );
}