import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  UserPlus,
  MessageCircle,
  Heart,
  Sparkles,
  Trash2,
  Drama,
  ChevronRight,
  Flame,
  Check,
  X,
  Filter,
  ChevronDown,
  Reply,
  Send,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { apiClient } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationsContext';
import { interactionService } from '@/lib/services/interactionService';
import { PageTransition } from '@/components/PageTransition';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import { AnonymousAvatar } from '@/components/match/AnonymousAvatar';
import type { Notification } from '@/types/ally';

type FilterCategory = 'all' | 'unread' | 'requests' | 'matches';
type DateGroupKey = 'today' | 'earlier' | 'last_month' | 'last_year';

function getDateGroup(dateInput?: string | Date | number): DateGroupKey {
  if (!dateInput) return 'earlier';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'earlier';
  const now = new Date();

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const dYear = d.getFullYear();
  const dMonth = d.getMonth();

  if (
    d.getDate() === now.getDate() &&
    dMonth === currentMonth &&
    dYear === currentYear
  ) {
    return 'today';
  }

  // Last Month (previous calendar month)
  const isLastMonth =
    (currentMonth > 0 && dYear === currentYear && dMonth === currentMonth - 1) ||
    (currentMonth === 0 && dYear === currentYear - 1 && dMonth === 11);

  if (isLastMonth) {
    return 'last_month';
  }

  // Last Year (previous calendar year or older)
  if (dYear < currentYear) {
    return 'last_year';
  }

  // Earlier (earlier this month or earlier this year)
  return 'earlier';
}

function formatNotificationTime(dateStr?: string): string {
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
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
  const diffMo = Math.floor(diffDay / 30);
  if (diffMo < 12) return `${diffMo}mo ago`;
  return `${Math.floor(diffMo / 12)}y ago`;
}

function extractSubtext(notif: Notification): string {
  const rawDesc = (notif.description || '').trim();
  if (!rawDesc) return '';
  if (rawDesc.includes('commented: "')) {
    return rawDesc.replace(/^commented:\s*"/i, '').replace(/"$/, '');
  }
  if (rawDesc.includes('replied: "')) {
    return rawDesc.replace(/^replied:\s*"/i, '').replace(/"$/, '');
  }
  if (
    rawDesc === 'liked your post.' ||
    rawDesc === 'liked your comment.' ||
    rawDesc === 'Someone commented on your post.' ||
    rawDesc === 'Someone liked your post.' ||
    rawDesc === 'Someone replied to your comment.' ||
    rawDesc.startsWith('Someone ') ||
    rawDesc === notif.title
  ) {
    return '';
  }
  return rawDesc;
}

function getActionText(notif: Notification): string {
  switch (notif.type) {
    case 'post_comment':
    case 'comment':
      return 'commented on your post';
    case 'post_like':
    case 'like':
      return 'liked your post';
    case 'comment_reply':
      return 'replied to your comment';
    case 'comment_like':
      return 'liked your comment';
    case 'comment_mention':
      return 'mentioned you in a comment';
    case 'friend_request':
    case 'connection_request':
      return 'sent you a match request';
    case 'accepted':
    case 'connection_accepted':
      return 'accepted your connection request';
    case 'match':
      return 'matched with you!';
    case 'anon_match':
      return 'messaged you';
    case 'streak_reminder':
      return '🔥';
    default:
      return notif.title || 'interacted with your post';
  }
}

const ANIMAL_KEYS = [
  'fox', 'wolf', 'whale', 'owl', 'panda', 'otter', 'falcon', 'koala', 'lynx', 'dolphin', 'raven', 'badger'
];

export function getAnonymousInfo(notif: Notification) {
  const isExplicitAnonType =
    notif.type === 'anon_match' ||
    notif.type === 'match' ||
    notif.type === 'friend_request' ||
    notif.type === 'connection_request';

  const nameContainsAnon = Boolean(
    notif.fromUserName && /anonymous/i.test(notif.fromUserName)
  );
  const titleContainsAnon = Boolean(
    notif.title && (/anonymous/i.test(notif.title) || /messaged you/i.test(notif.title))
  );
  const descContainsAnon = Boolean(
    notif.description && /anonymous/i.test(notif.description)
  );

  const avatarIsAnimal = Boolean(
    notif.fromUserAvatar &&
    ANIMAL_KEYS.includes(notif.fromUserAvatar.toLowerCase().trim())
  );

  const isAnon =
    isExplicitAnonType ||
    nameContainsAnon ||
    titleContainsAnon ||
    descContainsAnon ||
    avatarIsAnimal ||
    Boolean((notif as any).is_anonymous || (notif as any).isAnonymous);

  if (!isAnon) {
    return { isAnon: false, avatarKey: null, anonName: null };
  }

  // Try to determine animal avatar key
  let avatarKey: string | null = null;
  if (avatarIsAnimal && notif.fromUserAvatar) {
    avatarKey = notif.fromUserAvatar.toLowerCase().trim();
  } else if (notif.fromUserName) {
    const match = notif.fromUserName.match(/anonymous\s+(\w+)/i);
    if (match && ANIMAL_KEYS.includes(match[1].toLowerCase())) {
      avatarKey = match[1].toLowerCase();
    }
  }
  if (!avatarKey && notif.title) {
    const match = notif.title.match(/anonymous\s+(\w+)/i);
    if (match && ANIMAL_KEYS.includes(match[1].toLowerCase())) {
      avatarKey = match[1].toLowerCase();
    }
  }

  // If still no animal key, derive deterministically from fromUserId or id
  if (!avatarKey) {
    const seed = notif.fromUserId || notif.id || 'default';
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    avatarKey = ANIMAL_KEYS[hash % ANIMAL_KEYS.length];
  }

  // Determine anonymous name
  let anonName = 'Anonymous Ally';
  if (nameContainsAnon && notif.fromUserName) {
    anonName = notif.fromUserName;
  } else if (titleContainsAnon && notif.title && notif.title.includes('messaged you')) {
    anonName = notif.title.replace(/\s*messaged you.*$/i, '').trim();
  } else if (titleContainsAnon && notif.title && notif.title.includes('sent an anonymous')) {
    anonName = notif.title.replace(/\s*sent an anonymous.*$/i, '').trim();
  } else if (avatarKey) {
    const capitalized = avatarKey.charAt(0).toUpperCase() + avatarKey.slice(1);
    anonName = `Anonymous ${capitalized}`;
  }

  return {
    isAnon: true,
    avatarKey,
    anonName,
  };
}

export function isReplyableNotification(type?: string): boolean {
  if (!type) return false;
  return (
    type === 'comment' ||
    type === 'post_comment' ||
    type === 'comment_reply' ||
    type === 'comment_mention' ||
    type === 'anon_match' ||
    type === 'message'
  );
}

function getNotificationContent(notif: Notification) {
  const isMatchReq = notif.type === 'friend_request' || notif.type === 'connection_request';
  const anonInfo = getAnonymousInfo(notif);

  const authorName = anonInfo.isAnon
    ? anonInfo.anonName!
    : notif.type === 'streak_reminder'
    ? 'Streak Reminder'
    : notif.fromUserName || 'Someone';

  const actionText = getActionText(notif);

  if (notif.type === 'streak_reminder') {
    return {
      authorName: 'Streak Reminder',
      actionText: 'is active',
      description: notif.description || 'Your streak is not yet activated! Send a message to keep it going.',
    };
  }

  // For match requests, simple information is enough; action buttons replace description
  if (isMatchReq) {
    return { authorName, actionText, description: '' };
  }

  const subtext = extractSubtext(notif);
  let description = subtext;

  if (!description) {
    if (notif.description && notif.description !== notif.title && !notif.description.includes(actionText)) {
      description = notif.description;
    } else {
      switch (notif.type) {
        case 'accepted':
        case 'connection_accepted':
          description = 'You are now connected allies. Tap to chat';
          break;
        case 'match':
          description = 'You matched! Tap to view and start chatting';
          break;
        case 'anon_match':
          description = 'New anonymous match message. Tap to reply';
          break;
        case 'post_like':
        case 'like':
          description = 'Tap to view your post';
          break;
        case 'comment_like':
          description = 'Tap to view your comment';
          break;
        default:
          description = notif.description || '';
          break;
      }
    }
  }

  return { authorName, actionText, description };
}

function NotificationAvatarBadge({ notif }: { notif: Notification }) {
  const anonInfo = getAnonymousInfo(notif);

  let badgeIcon: React.ReactNode = <Bell size={10} className="text-white" />;
  let badgeBg = 'bg-gray-600';

  switch (notif.type) {
    case 'comment':
    case 'post_comment':
    case 'comment_reply':
    case 'comment_mention':
      badgeIcon = <MessageCircle size={10} className="text-white" />;
      badgeBg = 'bg-[#EC4899]';
      break;
    case 'like':
    case 'post_like':
    case 'comment_like':
      badgeIcon = <Heart size={10} className="text-white fill-white" />;
      badgeBg = 'bg-[#EF4444]';
      break;
    case 'accepted':
    case 'connection_accepted':
      badgeIcon = <span className="text-[9px] leading-none">🤝</span>;
      badgeBg = 'bg-[#16A34A]';
      break;
    case 'match':
      badgeIcon = <Sparkles size={10} className="text-white" />;
      badgeBg = 'bg-[#D97706]';
      break;
    case 'anon_match':
      badgeIcon = <Drama size={10} className="text-white" />;
      badgeBg = 'bg-[#3B8C7E]';
      break;
    case 'friend_request':
    case 'connection_request':
      badgeIcon = <UserPlus size={10} className="text-white" />;
      badgeBg = 'bg-[#1A6B3C]';
      break;
    case 'streak_reminder':
      badgeIcon = <Flame size={10} className="text-white" />;
      badgeBg = 'bg-[#EB5600]';
      break;
  }

  if (notif.type === 'streak_reminder') {
    return (
      <div className="relative w-11 h-11 flex-shrink-0">
        <div className="w-11 h-11 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/40 flex items-center justify-center text-xl select-none">
          🔥
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-[#0D131F] shadow-sm bg-[#EB5600]">
          <Flame size={10} className="text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-11 h-11 flex-shrink-0">
      {anonInfo.isAnon ? (
        <AnonymousAvatar
          avatarKey={anonInfo.avatarKey || 'fox'}
          photoUrl={null}
          size={44}
          className="w-11 h-11 rounded-2xl shadow-xs"
        />
      ) : (
        <AvatarDisplay
          src={notif.fromUserAvatar}
          name={notif.fromUserName || 'Ally'}
          className="w-11 h-11 rounded-2xl object-cover"
        />
      )}
      <div
        className={cn(
          'absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-[#111827] shadow-xs',
          badgeBg
        )}
      >
        {badgeIcon}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, clearAll } = useNotifications();

  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({});
  const [handledRequests, setHandledRequests] = useState<Record<string, 'accepted' | 'declined'>>({});
  const [showMobileFilterDropdown, setShowMobileFilterDropdown] = useState(false);
  const [replyingNotifId, setReplyingNotifId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [sentReplies, setSentReplies] = useState<Record<string, string>>({});
  const replyInputRef = useRef<HTMLInputElement>(null);

  const categoryCounts = useMemo(() => {
    return {
      all: notifications.filter((n) => n.type !== 'message').length,
      unread: notifications.filter((n) => n.type !== 'message' && !n.isRead).length,
      requests: notifications.filter(
        (n) =>
          n.type === 'friend_request' ||
          n.type === 'connection_request' ||
          n.type === 'accepted' ||
          n.type === 'connection_accepted'
      ).length,
      matches: notifications.filter((n) => n.type === 'match' || n.type === 'anon_match').length,
    };
  }, [notifications]);

  const handleClick = async (notif: Notification, isReplyAction = false) => {
    await markAsRead(notif.id);

    // 1. If backend already provided webUrl in redirection that doesn't loop back to notifications, navigate directly (no stack logic)
    if (notif.redirection?.webUrl && !notif.redirection.webUrl.startsWith('/notifications')) {
      const url = isReplyAction
        ? `${notif.redirection.webUrl}${notif.redirection.webUrl.includes('?') ? '&' : '?'}reply=true`
        : notif.redirection.webUrl;
      navigate(url);
      return;
    }

    // 2. Query accurate redirection and tree from backend endpoint
    try {
      const res = await apiClient.getNotificationRedirection(notif.id);
      if (res?.webUrl && !res.webUrl.startsWith('/notifications')) {
        const url = isReplyAction
          ? `${res.webUrl}${res.webUrl.includes('?') ? '&' : '?'}reply=true`
          : res.webUrl;
        navigate(url);
        return;
      }
    } catch {
      // Fall through to direct fallback routing
    }

    if (notif.type === 'friend_request' || notif.type === 'connection_request') {
      if (handledRequests[notif.id] === 'accepted') {
        if (notif.fromUserId) {
          const { conversationId } = await apiClient.findConversationWithUser(notif.fromUserId).catch(() => ({ conversationId: null }));
          navigate(conversationId ? `/messages?conversationId=${conversationId}` : '/messages');
        } else {
          navigate('/messages');
        }
      } else {
        navigate('/requests');
      }
    } else if (notif.type === 'accepted' || notif.type === 'connection_accepted') {
      if (notif.targetId) {
        navigate(`/messages?conversationId=${notif.targetId}`);
      } else if (notif.fromUserId) {
        const { conversationId } = await apiClient.findConversationWithUser(notif.fromUserId).catch(() => ({ conversationId: null }));
        navigate(conversationId ? `/messages?conversationId=${conversationId}` : '/messages');
      } else {
        navigate('/messages');
      }
    } else if (notif.type === 'match') {
      const anonInfo = getAnonymousInfo(notif);
      if (anonInfo.isAnon) {
        navigate('/messages');
      } else if (notif.fromUserId) {
        navigate(`/profile/${notif.fromUserId}`);
      } else {
        navigate('/discover');
      }
    } else if (notif.type === 'anon_match' || notif.type === 'message' || notif.type === 'streak_reminder') {
      const convId = notif.targetId || (notif.redirection?.params as any)?.conversationId;
      navigate(convId ? `/messages?conversationId=${convId}` : '/messages');
    } else if (notif.type === 'new_follower') {
      if (notif.fromUserId) navigate(`/profile/${notif.fromUserId}`);
    } else if (
      notif.type === 'comment_reply' ||
      notif.type === 'post_comment' ||
      notif.type === 'comment' ||
      notif.type === 'comment_mention' ||
      notif.type === 'comment_like'
    ) {
      const pId = notif.postId || notif.targetId;
      if (pId) {
        const queryParams = new URLSearchParams();
        const childId = notif.childId || notif.commentId;
        const parentId = notif.parentId;
        if (childId) queryParams.set('commentId', childId);
        if (parentId) queryParams.set('parentId', parentId);
        queryParams.set('type', notif.type);
        if (isReplyAction) queryParams.set('reply', 'true');
        navigate(`/post/${pId}?${queryParams.toString()}`);
      } else {
        navigate('/dashboard');
      }
    } else if (notif.type === 'post_like' || notif.type === 'like') {
      const pId = notif.postId || notif.targetId;
      if (pId) {
        navigate(`/post/${pId}?type=${notif.type}`);
      } else {
        navigate('/dashboard');
      }
    }
  };

  const handleReplyBtnClick = (notif: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    void markAsRead(notif.id);

    if (replyingNotifId === notif.id) {
      setReplyingNotifId(null);
      setReplyDraft('');
    } else {
      setReplyingNotifId(notif.id);
      const anonInfo = getAnonymousInfo(notif);
      if (!anonInfo.isAnon && notif.fromUserName) {
        setReplyDraft(`@${notif.fromUserName.replace(/\s+/g, '_')} `);
      } else {
        setReplyDraft('');
      }
      setTimeout(() => {
        replyInputRef.current?.focus();
      }, 60);
    }
  };

  const handleSendInlineReply = async (notif: Notification) => {
    const trimmed = replyDraft.trim();
    if (!trimmed || isSendingReply) return;

    setIsSendingReply(true);
    try {
      if (
        notif.type === 'comment' ||
        notif.type === 'post_comment' ||
        notif.type === 'comment_reply' ||
        notif.type === 'comment_mention'
      ) {
        const pId = notif.postId || notif.targetId || (notif.redirection?.params as any)?.postId;
        if (!pId) {
          toast.error('Could not locate the post to reply to.');
          return;
        }

        const parentCommentId =
          notif.parentId ||
          notif.childId ||
          notif.commentId ||
          (notif.redirection?.params as any)?.parentId ||
          (notif.redirection?.params as any)?.commentId ||
          null;

        await apiClient.createComment(pId, {
          content: trimmed,
          parentCommentId,
        });

        toast.success('Reply posted successfully!');
        setSentReplies((prev) => ({ ...prev, [notif.id]: trimmed }));
        setReplyingNotifId(null);
        setReplyDraft('');
      } else if (notif.type === 'message' || notif.type === 'anon_match') {
        let convId = notif.targetId || (notif.redirection?.params as any)?.conversationId;
        if (!convId && notif.fromUserId) {
          const res = await apiClient.findConversationWithUser(notif.fromUserId).catch(() => ({ conversationId: null }));
          convId = res?.conversationId;
        }

        if (!convId) {
          toast.error('Could not find conversation. Opening messages...');
          navigate('/messages');
          return;
        }

        await apiClient.sendMessage(convId, { content: trimmed });
        toast.success('Message sent!');
        setSentReplies((prev) => ({ ...prev, [notif.id]: trimmed }));
        setReplyingNotifId(null);
        setReplyDraft('');
      }
    } catch (err: any) {
      console.error('Failed to send inline reply:', err);
      toast.error(err?.message || 'Failed to send reply. Tap notification to view in full.');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleOpenFull = (notif: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    void handleClick(notif, true);
  };

  const handleAcceptRequest = async (notif: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !notif.fromUserId || busyIds[notif.id]) return;

    setBusyIds((prev) => ({ ...prev, [notif.id]: true }));
    try {
      const result = await interactionService.acceptRequest(user.id, notif.fromUserId);
      await markAsRead(notif.id);
      setHandledRequests((prev) => ({ ...prev, [notif.id]: 'accepted' }));

      if (result?.conversationId) {
        setTimeout(() => {
          navigate('/messages', { state: { conversationId: result.conversationId } });
        }, 400);
      }
    } catch (err: any) {
      console.error('Failed to accept match request:', err);
    } finally {
      setBusyIds((prev) => ({ ...prev, [notif.id]: false }));
    }
  };

  const handleDeclineRequest = async (notif: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !notif.fromUserId || busyIds[notif.id]) return;

    setBusyIds((prev) => ({ ...prev, [notif.id]: true }));
    try {
      await interactionService.rejectRequest(user.id, notif.fromUserId);
      await markAsRead(notif.id);
      setHandledRequests((prev) => ({ ...prev, [notif.id]: 'declined' }));
    } catch (err: any) {
      console.error('Failed to decline match request:', err);
    } finally {
      setBusyIds((prev) => ({ ...prev, [notif.id]: false }));
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (n.type === 'message') return false;
      const isUnread = !n.isRead;
      if (activeFilter === 'unread') return isUnread;
      if (activeFilter === 'requests') {
        return (
          n.type === 'friend_request' ||
          n.type === 'connection_request' ||
          n.type === 'accepted' ||
          n.type === 'connection_accepted'
        );
      }
      if (activeFilter === 'matches') {
        return n.type === 'match' || n.type === 'anon_match';
      }
      return true;
    });
  }, [notifications, activeFilter]);

  const notificationSections = useMemo(() => {
    const today: Notification[] = [];
    const earlier: Notification[] = [];
    const lastMonth: Notification[] = [];
    const lastYear: Notification[] = [];

    for (const n of filteredNotifications) {
      const group = getDateGroup(n.timestamp || (n as any).created_at);
      if (group === 'today') today.push(n);
      else if (group === 'last_month') lastMonth.push(n);
      else if (group === 'last_year') lastYear.push(n);
      else earlier.push(n);
    }

    return [
      { key: 'today', label: 'Today', items: today },
      { key: 'earlier', label: 'Earlier', items: earlier },
      { key: 'last_month', label: 'Last Month', items: lastMonth },
      { key: 'last_year', label: 'Last Year', items: lastYear },
    ].filter((sec) => sec.items.length > 0);
  }, [filteredNotifications]);

  const renderRow = (notif: Notification) => {
    const isUnread = !notif.isRead;
    const isMatchReq = notif.type === 'friend_request' || notif.type === 'connection_request';
    const reqStatus = handledRequests[notif.id];
    const isBusy = busyIds[notif.id];
    const { authorName, actionText, description } = getNotificationContent(notif);
    const isReplying = replyingNotifId === notif.id;
    const canReply = isReplyableNotification(notif.type);

    return (
      <div
        key={notif.id}
        role="button"
        tabIndex={0}
        onClick={() => handleClick(notif)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick(notif);
          }
        }}
        className={cn(
          'w-full text-left flex items-start gap-3.5 sm:gap-4 px-4 sm:px-5 py-3.5 transition-all duration-150',
          'bg-transparent hover:bg-gray-50/90 dark:hover:bg-white/[0.04] active:bg-gray-100/70 dark:active:bg-white/[0.06]',
          'border-b border-gray-100/80 dark:border-white/5 last:border-0 group cursor-pointer relative select-none'
        )}
      >

        <NotificationAvatarBadge notif={notif} />

        <div className="flex-1 min-w-0 pr-1">
          <p className="font-jakarta text-[13px] sm:text-[13.5px] leading-snug text-gray-900 dark:text-white truncate">
            <span className="font-bold text-gray-900 dark:text-white">
              {authorName}
            </span>
            <span
              className={cn(
                'ml-1.5',
                isUnread
                  ? 'font-semibold text-gray-800 dark:text-gray-100'
                  : 'font-normal text-gray-600 dark:text-gray-300'
              )}
            >
              {actionText}
            </span>
          </p>

          {/* Inline match request accept/decline action buttons */}
          {isMatchReq ? (
            reqStatus === 'accepted' ? (
              <div className="mt-2 text-xs font-jakarta font-bold text-[#1A6B3C] dark:text-emerald-400 flex items-center gap-1.5">
                <Check size={14} className="stroke-[2.5]" />
                <span>Match Request Accepted</span>
              </div>
            ) : reqStatus === 'declined' ? (
              <div className="mt-2 text-xs font-jakarta font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <X size={14} />
                <span>Match Request Declined</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5 mt-2.5 max-w-xs sm:max-w-sm">
                <button
                  type="button"
                  onClick={(e) => handleAcceptRequest(notif, e)}
                  disabled={isBusy}
                  className="flex items-center justify-center gap-1.5 bg-[#1A6B3C] hover:bg-[#155a33] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-jakarta font-bold text-xs py-1.5 px-3 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Check size={13} className="stroke-[2.5]" />
                  <span>{isBusy ? 'Accepting...' : 'Accept Request'}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDeclineRequest(notif, e)}
                  disabled={isBusy}
                  className="flex items-center justify-center gap-1 bg-gray-100 dark:bg-white/10 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 text-gray-700 dark:text-gray-300 font-jakarta font-semibold text-xs py-1.5 px-3 rounded-xl border border-gray-200/80 dark:border-white/10 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <X size={13} />
                  <span>{isBusy ? 'Declining...' : 'Decline Request'}</span>
                </button>
              </div>
            )
          ) : (
            Boolean(description) && (
              <p className="font-jakarta text-xs sm:text-[13px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                {description}
              </p>
            )
          )}

          {/* Inline Quick Reply Box */}
          {isReplying && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="mt-3 p-3 bg-white/95 dark:bg-[#151d2a] rounded-2xl border border-[#1A6B3C]/25 dark:border-emerald-500/30 shadow-xs space-y-2 select-text"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#1A6B3C] dark:text-emerald-400 flex items-center gap-1.5">
                  <Reply size={12} className="stroke-[2.5]" />
                  <span>Replying to <strong className="font-bold underline decoration-dotted">{authorName}</strong></span>
                </span>
                <button
                  type="button"
                  onClick={(e) => handleOpenFull(notif, e)}
                  className="text-[11px] text-gray-500 hover:text-[#1A6B3C] dark:text-gray-400 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Open full page"
                >
                  <span>Open in {notif.type.includes('comment') ? 'post' : 'messages'}</span>
                  <ExternalLink size={11} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={replyInputRef}
                  type="text"
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void handleSendInlineReply(notif);
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      setReplyingNotifId(null);
                    }
                  }}
                  placeholder={`Write a reply to ${authorName}...`}
                  disabled={isSendingReply}
                  className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5 font-jakarta text-xs text-gray-900 dark:text-white outline-none focus:border-[#1A6B3C] dark:focus:border-emerald-500 transition-all placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => void handleSendInlineReply(notif)}
                  disabled={!replyDraft.trim() || isSendingReply}
                  className="px-3 py-1.5 rounded-xl bg-[#1A6B3C] hover:bg-[#155a33] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-jakarta font-bold text-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer shadow-xs"
                >
                  {isSendingReply ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Send size={12} />
                  )}
                  <span>{isSendingReply ? 'Sending...' : 'Send'}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setReplyingNotifId(null);
                  }}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title="Cancel"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Sent Reply Status Preview */}
          {sentReplies[notif.id] && !isReplying && (
            <div className="mt-2 text-xs font-jakarta text-[#1A6B3C] dark:text-emerald-400 flex items-center gap-1.5 bg-[#1A6B3C]/5 dark:bg-emerald-500/10 px-2.5 py-1 rounded-xl w-fit border border-[#1A6B3C]/10 dark:border-emerald-500/20">
              <Check size={12} className="stroke-[2.5]" />
              <span className="font-semibold">Replied:</span>
              <span className="italic truncate max-w-xs text-gray-600 dark:text-gray-300">
                "{sentReplies[notif.id]}"
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1.5 flex-shrink-0 self-start pt-0.5">
          <span className="font-jakarta font-medium text-[11px] sm:text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
            {formatNotificationTime(notif.timestamp || (notif as any).created_at)}
          </span>
          <div className="flex items-center gap-1.5">
            {canReply && (
              <button
                type="button"
                onClick={(e) => handleReplyBtnClick(notif, e)}
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold font-jakarta transition-all active:scale-95 cursor-pointer shadow-xs',
                  isReplying
                    ? 'bg-[#1A6B3C] text-white dark:bg-emerald-600'
                    : 'bg-[#1A6B3C]/10 hover:bg-[#1A6B3C]/20 text-[#1A6B3C] dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 dark:text-emerald-400 border border-[#1A6B3C]/20 dark:border-emerald-500/30'
                )}
                title={isReplying ? 'Close reply' : 'Reply to notification'}
              >
                <Reply size={11} className="stroke-[2.5]" />
                <span>{isReplying ? 'Close' : 'Reply'}</span>
              </button>
            )}
            {isUnread && (
              <div className="w-2 h-2 rounded-full bg-[#1A6B3C] dark:bg-emerald-400 shadow-xs ring-2 ring-[#1A6B3C]/20" />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <PageTransition>
      <div className="flex-1 overflow-y-auto pb-24 md:pb-8">
        <div className="max-w-3xl mx-auto px-0 sm:px-4 pt-4 sm:pt-6">
          {/* ═══ Header Bar (Title, Count, Read All, Clear All) ═══ */}
          <div className="flex items-center justify-between mb-4 px-4 sm:px-0">
            <div className="flex items-center gap-3">
              <h1 className="font-fraunces font-bold text-2xl sm:text-3xl text-[#1A6B3C] dark:text-white tracking-tight">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="bg-[#1A6B3C] dark:bg-emerald-600 text-white font-jakarta font-extrabold text-[11px] px-2.5 py-0.5 rounded-full shadow-xs">
                  {unreadCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1A6B3C]/10 hover:bg-[#1A6B3C]/15 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 text-[#1A6B3C] dark:text-emerald-400 font-jakarta font-bold text-xs transition-colors cursor-pointer"
                >
                  <CheckCheck size={14} className="stroke-[2.5]" />
                  <span>Read All</span>
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  title="Clear all notifications"
                  className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>

          {/* ═══ Filter Category Controls: Desktop Tabs & Mobile Responsive Dropdown ═══ */}
          <div className="flex items-center justify-between gap-3 mb-4 px-4 sm:px-0">
            {/* Desktop Tabs (hidden on mobile) */}
            <div className="hidden sm:flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'all', label: 'All', count: categoryCounts.all },
                { id: 'unread', label: 'Unread', count: categoryCounts.unread },
                { id: 'requests', label: 'Requests', count: categoryCounts.requests },
                { id: 'matches', label: 'Matches', count: categoryCounts.matches },
              ].map((tab) => {
                const isActive = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilter(tab.id as FilterCategory)}
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

            {/* Mobile Responsive Filter Dropdown (visible on mobile only) */}
            <div className="sm:hidden relative">
              <button
                type="button"
                onClick={() => setShowMobileFilterDropdown((prev) => !prev)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-white/10 shadow-xs text-xs font-jakarta font-bold text-gray-800 dark:text-white cursor-pointer active:scale-95 transition-all"
              >
                <Filter size={13} className="text-[#1A6B3C] dark:text-emerald-400" />
                <span>
                  {activeFilter === 'all'
                    ? 'All'
                    : activeFilter === 'unread'
                    ? 'Unread'
                    : activeFilter === 'requests'
                    ? 'Requests'
                    : 'Matches'}
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#1A6B3C]/10 text-[#1A6B3C] dark:bg-emerald-500/20 dark:text-emerald-400 font-bold">
                  {categoryCounts[activeFilter]}
                </span>
                <ChevronDown
                  size={13}
                  className={cn(
                    'text-gray-400 transition-transform duration-200',
                    showMobileFilterDropdown && 'rotate-180'
                  )}
                />
              </button>

              {showMobileFilterDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMobileFilterDropdown(false)}
                  />
                  <div className="absolute left-0 top-full mt-2 w-48 bg-white dark:bg-[#181818] border border-gray-200/80 dark:border-white/10 rounded-2xl shadow-xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                    {[
                      { id: 'all', label: 'All', count: categoryCounts.all },
                      { id: 'unread', label: 'Unread', count: categoryCounts.unread },
                      { id: 'requests', label: 'Requests', count: categoryCounts.requests },
                      { id: 'matches', label: 'Matches', count: categoryCounts.matches },
                    ].map((item) => {
                      const isSelected = activeFilter === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActiveFilter(item.id as FilterCategory);
                            setShowMobileFilterDropdown(false);
                          }}
                          className={cn(
                            'w-full flex items-center justify-between px-3.5 py-2 text-xs font-jakarta transition-colors text-left cursor-pointer',
                            isSelected
                              ? 'bg-[#1A6B3C]/10 text-[#1A6B3C] dark:bg-emerald-500/15 dark:text-emerald-400 font-bold'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 font-medium'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {isSelected ? (
                              <Check size={13} className="stroke-[2.5]" />
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

            {/* "view all match request" Green Link */}
            <button
              type="button"
              onClick={() => navigate('/requests')}
              className="text-xs font-jakarta font-bold text-[#1A6B3C] dark:text-emerald-400 hover:text-[#155a33] dark:hover:text-emerald-300 hover:underline flex items-center gap-1 flex-shrink-0 cursor-pointer transition-colors py-1"
            >
              <span>view all match request</span>
              <ChevronRight size={13} />
            </button>
          </div>

          {/* ═══ Content List (Full-bleed on mobile, card on desktop) ═══ */}
          <div className="bg-white dark:bg-[#111827] rounded-none sm:rounded-2xl border-y sm:border border-x-0 sm:border-x border-gray-200/80 dark:border-white/10 shadow-none sm:shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
            {loading ? (
              <div className="divide-y divide-gray-100/80 dark:divide-white/5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                    <div className="w-11 h-11 rounded-2xl bg-gray-200 dark:bg-white/10 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-gray-200 dark:bg-white/10 rounded-full w-2/5" />
                      <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-full w-3/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="px-4 py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#1A6B3C]/10 dark:bg-emerald-500/15 flex items-center justify-center mx-auto mb-4 text-[#1A6B3C] dark:text-emerald-400">
                  <Bell size={28} />
                </div>
                <p className="font-fraunces font-semibold text-lg text-gray-800 dark:text-white mb-1">
                  You're all caught up! 🎉
                </p>
                <p className="font-jakarta text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  New likes, comments, and connection requests will appear here.
                </p>
              </div>
            ) : (
              <div>
                {notificationSections.map((section, idx) => (
                  <div key={section.key} className={cn(idx > 0 && "border-t border-gray-100 dark:border-white/10")}>
                    <div className="bg-gray-50/80 dark:bg-white/[0.03] px-4 sm:px-5 py-2 border-b border-gray-100/80 dark:border-white/5 flex items-center justify-between">
                      <span className="font-jakarta font-extrabold text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        {section.label}
                      </span>
                    </div>
                    <div className="divide-y divide-gray-100/80 dark:divide-white/5">
                      {section.items.map((n) => renderRow(n))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Clear All Confirmation Dialog ═══ */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-[#181818] rounded-2xl p-6 shadow-2xl border border-gray-100 dark:border-white/10 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div className="text-center">
              <h3 className="font-fraunces font-bold text-lg text-gray-900 dark:text-white">
                Clear all notifications?
              </h3>
              <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-1">
                This will remove all notifications from your list.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 font-jakarta font-semibold text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowClearConfirm(false);
                  await clearAll();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 font-jakarta font-semibold text-xs text-white transition-colors cursor-pointer shadow-xs"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}