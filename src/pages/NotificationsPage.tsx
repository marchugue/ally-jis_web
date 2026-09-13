import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/api/client';
import { useNotifications } from '@/context/NotificationsContext';
import { PageTransition } from '@/components/PageTransition';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import type { Notification } from '@/types/ally';

type FilterCategory = 'all' | 'unread' | 'requests' | 'matches';

function formatTimestamp(dateStr?: string): string {
  if (!dateStr) return 'Just now';
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return dateStr;
  const now = Date.now();
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

function isTodayDate(dateStr?: string): boolean {
  if (!dateStr) return true;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return true;
  const now = new Date();
  return d.toDateString() === now.toDateString();
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
      return 'sent you a connection request';
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

function NotificationAvatarBadge({ notif }: { notif: Notification }) {
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
    case 'friend_request':
    case 'connection_request':
      badgeIcon = <UserPlus size={10} className="text-white" />;
      badgeBg = 'bg-[#2563EB]';
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

  const isAnon = notif.type === 'anon_match';

  return (
    <div className="relative w-11 h-11 flex-shrink-0">
      {isAnon ? (
        <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/40 flex items-center justify-center text-xl select-none">
          🎭
        </div>
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
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, clearAll } = useNotifications();

  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClick = async (notif: Notification) => {
    await markAsRead(notif.id);

    if (notif.redirection?.webUrl) {
      navigate(notif.redirection.webUrl);
      return;
    }

    if (notif.type === 'friend_request' || notif.type === 'connection_request') {
      navigate('/requests');
    } else if (notif.type === 'accepted' || notif.type === 'connection_accepted') {
      if (notif.fromUserId) {
        const { conversationId } = await apiClient.findConversationWithUser(notif.fromUserId);
        navigate('/messages', { state: conversationId ? { conversationId } : undefined });
      } else {
        navigate('/messages');
      }
    } else if (notif.type === 'match') {
      if (notif.fromUserId) {
        navigate(`/profile/${notif.fromUserId}`);
      } else {
        navigate('/discover');
      }
    } else if (notif.type === 'anon_match' || notif.type === 'message' || notif.type === 'streak_reminder') {
      navigate('/messages');
    } else if (notif.type === 'new_follower') {
      if (notif.fromUserId) navigate(`/profile/${notif.fromUserId}`);
    } else if (notif.type === 'comment_reply') {
      // Deep-link to the specific comment and auto-enter reply mode
      navigate('/dashboard', {
        state: {
          targetPostId: notif.postId,
          openComments: true,
          replyToCommentId: notif.commentId ?? null,
        },
      });
    } else if (
      notif.type === 'post_comment' ||
      notif.type === 'comment' ||
      notif.type === 'comment_mention'
    ) {
      navigate('/dashboard', {
        state: { targetPostId: notif.postId, openComments: true },
      });
    } else if (notif.type === 'post_like' || notif.type === 'like' || notif.type === 'comment_like') {
      navigate('/dashboard', {
        state: { targetPostId: notif.postId, openComments: false },
      });
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

  const { todayList, earlierList } = useMemo(() => {
    const today: Notification[] = [];
    const earlier: Notification[] = [];
    for (const item of filteredNotifications) {
      if (isTodayDate(item.timestamp)) {
        today.push(item);
      } else {
        earlier.push(item);
      }
    }
    return { todayList: today, earlierList: earlier };
  }, [filteredNotifications]);

  const renderRow = (notif: Notification) => {
    const isUnread = !notif.isRead;
    const isAnon = notif.type === 'anon_match';
    const anonName = isAnon
      ? notif.fromUserName ||
        (notif.title && notif.title.includes('messaged you')
          ? notif.title.replace(/\s*messaged you.*$/i, '').trim()
          : null) ||
        (notif.title && notif.title.includes('sent an anonymous')
          ? notif.title.replace(/\s*sent an anonymous.*$/i, '').trim()
          : null) ||
        'Anonymous Ally'
      : null;

    const authorName = isAnon
      ? anonName!
      : notif.type === 'streak_reminder'
      ? 'Streak Reminder'
      : notif.fromUserName || 'Someone';
    const actionText = getActionText(notif);
    const subtext = notif.type === 'streak_reminder'
      ? (notif.description || 'Your streak is not yet activated! Send a message to activate.')
      : extractSubtext(notif);

    return (
      <button
        key={notif.id}
        type="button"
        onClick={() => handleClick(notif)}
        className={cn(
          'w-full text-left flex items-center gap-3.5 px-4 sm:px-5 py-3.5 hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-white/5 last:border-0',
          isUnread && 'bg-[#1A6B3C]/[0.03] dark:bg-emerald-950/20'
        )}
      >
        <NotificationAvatarBadge notif={notif} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-jakarta text-xs sm:text-[13.5px] leading-snug text-gray-900 dark:text-white truncate">
              <span className="font-bold text-gray-900 dark:text-white">
                {authorName}
              </span>
              <span
                className={cn(
                  'ml-1',
                  isUnread
                    ? 'font-semibold text-gray-900 dark:text-gray-100'
                    : 'font-normal text-gray-600 dark:text-gray-300'
                )}
              >
                {actionText}
              </span>
            </p>
            <span className="font-jakarta text-[11px] font-medium text-gray-400 dark:text-gray-500 flex-shrink-0">
              {formatTimestamp(notif.timestamp)}
            </span>
          </div>

          {Boolean(subtext) && (
            <p className="font-jakarta text-xs sm:text-[13px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
              {subtext}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {(notif.type === 'message' || notif.type === 'anon_match') && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#1A6B3C]/10 text-[#1A6B3C] dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-[#1A6B3C]/20 transition-colors">
              Reply
            </span>
          )}
          {isUnread && (
            <div className="w-2 h-2 rounded-full bg-[#1A6B3C] dark:bg-emerald-400 shadow-xs" />
          )}
          <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
        </div>
      </button>
    );
  };

  return (
    <PageTransition>
      <div className="flex-1 overflow-y-auto pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto px-4 pt-6">
          {/* ═══ Header Bar (Title, Count, Read All, Clear All) ═══ */}
          <div className="flex items-center justify-between mb-4">
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

          {/* ═══ Filter Category Tabs (All, Unread, Requests, Matches) ═══ */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'All' },
              { id: 'unread', label: 'Unread' },
              { id: 'requests', label: 'Requests' },
              { id: 'matches', label: 'Matches' },
            ].map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id as FilterCategory)}
                  className={cn(
                    'px-4 py-1.5 rounded-2xl font-jakarta text-xs transition-all cursor-pointer select-none flex-shrink-0',
                    isActive
                      ? 'bg-[#1A6B3C] text-white font-extrabold shadow-xs'
                      : 'bg-white dark:bg-[#181818] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 font-semibold border border-gray-200/80 dark:border-white/10'
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ═══ Quick Requests Card (Connection Requests) ═══ */}
          <div className="mb-4">
            <button
              type="button"
              onClick={() => navigate('/requests')}
              className="w-full bg-white dark:bg-[#111827] rounded-2xl p-4 flex items-center justify-between border border-[#1A6B3C]/15 dark:border-white/10 shadow-xs hover:border-[#1A6B3C]/40 hover:shadow-sm transition-all cursor-pointer text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#1A6B3C]/10 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0 text-[#1A6B3C] dark:text-emerald-400">
                  <UserPlus size={20} />
                </div>
                <div>
                  <p className="font-jakarta font-bold text-sm text-gray-900 dark:text-white">
                    Connection Requests
                  </p>
                  <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Review pending campus allies & invites
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-400 dark:text-gray-500" />
            </button>
          </div>

          {/* ═══ Content List ═══ */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
            {loading ? (
              <div className="divide-y divide-gray-100 dark:divide-white/5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-start gap-4 px-5 py-4 animate-pulse">
                    <div className="w-11 h-11 rounded-2xl bg-gray-200 dark:bg-white/10 flex-shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3.5 bg-gray-200 dark:bg-white/10 rounded-full w-1/2" />
                      <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-full w-3/4" />
                      <div className="h-2.5 bg-gray-100 dark:bg-white/5 rounded-full w-1/4" />
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
                {/* Today Section */}
                {todayList.length > 0 && (
                  <div>
                    <div className="px-5 py-2 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                      <span className="font-jakarta text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        Today
                      </span>
                    </div>
                    <div>{todayList.map((n) => renderRow(n))}</div>
                  </div>
                )}

                {/* Earlier Section */}
                {earlierList.length > 0 && (
                  <div>
                    <div className="px-5 py-2 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                      <span className="font-jakarta text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        Earlier
                      </span>
                    </div>
                    <div>{earlierList.map((n) => renderRow(n))}</div>
                  </div>
                )}
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