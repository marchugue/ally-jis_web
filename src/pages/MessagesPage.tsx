import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Search, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useConversations } from '@/hooks/useConversations';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { usePresence } from '@/context/PresenceContext';
import { useIcebreakers } from '@/hooks/useIcebreakers';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { MessageInput } from '@/components/chat/MessageInput';
import { IcebreakerSuggestions } from '@/components/chat/IcebreakerSuggestions';
import { Conversation, Student } from '@/types/ally';
import { cn } from '@/lib/utils';
import { isApiConfigured } from '@/api/client';
import { CURRENT_USER } from '@/data/mockData';
import { profileService } from '@/lib/services/profileService';
import { chatService } from '@/lib/services/chatService';
import { ConversationHeader } from '@/components/chat/ConversationHeader';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';

export default function MessagesPage() {
  const { user } = useAuth();
  const { onlineUserIds } = usePresence();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student>(CURRENT_USER);
  const { conversations, isLoading: loadingConvs, refresh: refreshConvs } = useConversations(user?.id ?? null);
  const { messages, sendMessage, isLoading: loadingMessages } = useRealtimeMessages(activeConversation?.id ?? null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const lastReadRef = useRef<{ conversationId: string; messageId: string | null } | null>(null);

  const useBackend = Boolean(isApiConfigured && user);

  useEffect(() => {
    if (user?.id && useBackend) {
      profileService.getProfile(user.id)
        .then(setCurrentStudent)
        .catch(err => console.error("Error fetching student profile:", err));
    }
  }, [user?.id, useBackend]);

  const handleSendIcebreaker = (content: string) => {
    handleSendMessage(content);
  };

  const { suggestions, dismiss, select } = useIcebreakers({
    messages,
    currentUser: currentStudent,
    otherUser: {
      id: activeConversation?.participantId || '',
      interests: activeConversation?.sharedInterests, // Note: activeConversation sharedInterests are actually the other user's interests in useConversations mapping
      // If we want the actual course, we might need to fetch the other student profile too or include it in conversation mapping
    },
    onSendIcebreaker: handleSendIcebreaker
  });

  const requestedConversationId = (location.state as { conversationId?: string } | null)?.conversationId;

  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      } else if (conversations.length > 0 && !activeConversation && !isMobileView) {
        // Only auto-select on desktop
        setActiveConversation(conversations[0]);
      }
    };

    void findAndSetActive();
    return () => { isMounted = false; };
  }, [conversations, activeConversation, requestedConversationId, navigate, location.pathname, loadingConvs, useBackend, user?.id, refreshConvs, isMobileView]);

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
  }, [useBackend, user?.id, activeConversation?.id, messages.length]);

  // Reset the info panel whenever the active conversation changes (mirrors FB:
  // opening a new thread always starts with the panel collapsed on mobile / fresh on desktop)
  useEffect(() => {
    setShowInfoPanel(false);
  }, [activeConversation?.id]);

  const handleSendMessage = async (content: string | null, image?: File | null) => {
    if (!user || !activeConversation) return;

    let imageUrl = null;
    if (image) {
      imageUrl = await chatService.uploadChatMedia(image);
    }

    await sendMessage(user.id, content, imageUrl);
    refreshConvs(true); // ← silent refresh, no loading flash
  };

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((conv) =>
      conv.participantName.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  const isParticipantOnline = activeConversation ? onlineUserIds.has(activeConversation.participantId) : false;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden h-full">
      <div className="flex-1 flex min-h-0 h-full w-full">
        {/* Sidebar */}
        <div className={cn(
          "w-full md:w-[360px] bg-white flex flex-col overflow-hidden min-h-0 flex-shrink-0",
          "border-r border-gray-100",
          activeConversation && "hidden md:flex"
        )}>
          {/* Sidebar header */}
          <div className="p-4 flex items-center justify-between flex-shrink-0">
            <h1 className="font-fraunces text-2xl font-bold text-[#1A6B3C]">Chats</h1>
            <button className="p-2 text-[#1A6B3C] hover:bg-[#1A6B3C]/5 rounded-full transition-all">
              <UserPlus size={20} />
            </button>
          </div>

          {/* Search */}
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

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <ConversationList
              conversations={filteredConversations}
              activeId={activeConversation?.id}
              onSelect={(c) => setActiveConversation(c)}
              isLoading={loadingConvs}
              onlineUserIds={onlineUserIds}
              currentUserId={user?.id ?? CURRENT_USER.id}
            />
          </div>
        </div>

        {/* Chat Area */}
        <div className={cn(
          "flex-1 bg-white flex flex-col overflow-hidden min-h-0",
          isMobileView && activeConversation && "pb-20", // Prevent bottom nav overlap
          !activeConversation && "hidden md:flex"
        )}>
          {activeConversation ? (
            <>
              {/* Chat Header - FIXED */}
              <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-white flex-shrink-0">
                <button
                  onClick={() => setActiveConversation(null)}
                  className="md:hidden p-2 -ml-2 text-gray-400 hover:text-[#1A6B3C]"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="relative">
                  <AvatarDisplay
                    src={activeConversation.participantAvatar}
                    name={activeConversation.participantName}
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                  {isParticipantOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-jakarta font-bold text-gray-900 truncate">
                    {activeConversation.participantName}
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    {isParticipantOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
                <button
                  onClick={() => setShowInfoPanel((prev) => !prev)}
                  className={cn(
                    "hidden md:flex p-2 rounded-full transition-all",
                    showInfoPanel ? "bg-[#1A6B3C]/10 text-[#1A6B3C]" : "text-gray-400 hover:bg-gray-100 hover:text-[#1A6B3C]"
                  )}
                  aria-label="Conversation info"
                >
                  <Info size={20} />
                </button>
              </div>

              {/* Messages - SCROLLABLE */}
              <div className="flex-1 min-h-0 relative flex flex-col">
                <ChatWindow
                  messages={messages}
                  currentUserId={user?.id ?? CURRENT_USER.id}
                  participantAvatar={activeConversation.participantAvatar}
                  participantName={activeConversation.participantName}
                />
              </div>

              {/* Input - FIXED */}
              <div className="flex-shrink-0">
                <MessageInput onSend={handleSendMessage} disabled={loadingMessages}>
                  <IcebreakerSuggestions 
                    suggestions={suggestions} 
                    onSelect={select} 
                    onDismiss={dismiss} 
                  />
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

        {/* Info Panel */}
        {activeConversation && showInfoPanel && (
          <div className="hidden md:flex w-[320px] bg-white border-l border-gray-100 flex-col overflow-y-auto flex-shrink-0">
            <div className="p-6 flex flex-col items-center text-center border-b border-gray-100">
              <AvatarDisplay
                src={activeConversation.participantAvatar}
                name={activeConversation.participantName}
                className="w-20 h-20 rounded-2xl object-cover mb-3"
              />
              <h3 className="font-jakarta font-bold text-gray-900">
                {activeConversation.participantName}
              </h3>
              <span className={cn(
                "mt-1 text-xs font-jakarta font-medium px-2.5 py-0.5 rounded-full",
                isParticipantOnline ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"
              )}>
                {isParticipantOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}