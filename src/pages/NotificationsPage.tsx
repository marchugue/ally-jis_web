import { useNavigate } from 'react-router-dom';
import { Bell, ArrowRight, UserPlus, MessageCircle, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/api/client';
import { useNotifications } from '@/context/NotificationsContext';
import { PageTransition } from '@/components/PageTransition';
import type { Notification } from '@/types/ally';

function groupByDate(notifications: Notification[]) {
  const today: Notification[] = [];
  const earlier: Notification[] = [];
  const now = new Date();

  for (const n of notifications) {
    const d = new Date(n.timestamp);
    if (d.toDateString() === now.toDateString()) {
      today.push(n);
    } else {
      earlier.push(n);
    }
  }
  return { today, earlier };
}

function NotifRow({ notif, onClick }: { notif: Notification; onClick: () => void }) {
  const iconMap: Record<Notification['type'], React.ReactNode> = {
    friend_request: <UserPlus size={17} />,
    accepted: <span className="text-lg">🤝</span>,
    match: <span className="text-lg">✨</span>,
    message: <MessageCircle size={17} />,
  };

  const colorMap: Record<Notification['type'], string> = {
    friend_request: 'bg-blue-50 text-blue-500',
    accepted: 'bg-green-50 text-green-600',
    match: 'bg-amber-50 text-amber-500',
    message: 'bg-[#1A6B3C]/10 text-[#1A6B3C]',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0',
        !notif.isRead && 'bg-[#1A6B3C]/[0.03]'
      )}
    >
      <div className={cn(
        'w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0',
        colorMap[notif.type]
      )}>
        {iconMap[notif.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-jakarta font-semibold text-sm text-gray-900 leading-snug">{notif.title}</p>
        <p className="font-jakarta text-sm text-gray-500 mt-0.5 leading-snug">{notif.description}</p>
        <p className="font-jakarta text-xs text-[#3B8C7E] mt-1.5">{notif.timestamp}</p>
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0 pt-0.5">
        {!notif.isRead && (
          <div className="w-2.5 h-2.5 bg-[#1A6B3C] rounded-full" />
        )}
        <ArrowRight size={15} className="text-gray-300 mt-1" />
      </div>
    </button>
  );
}

export default function NotificationsPage() {
  const navigate = useNavigate();

  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  const handleClick = async (notif: Notification) => {
    await markAsRead(notif.id);

    if (notif.type === 'friend_request') {
      navigate('/requests');
    } else if (notif.type === 'accepted') {
      if (notif.fromUserId) {
        const { conversationId } = await apiClient.findConversationWithUser(notif.fromUserId);
        navigate('/messages', { state: conversationId ? { conversationId } : undefined });
      } else {
        navigate('/messages');
      }
    } else if (notif.type === 'match') {
      // TODO: navigate(`/profile/${notif.fromUserId}`) once profile route is ready
      navigate('/discover');
    }
  };

  const { today, earlier } = groupByDate(notifications);

  return (
    <PageTransition>
      <div className="flex-1 overflow-y-auto pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto px-4 pt-6">

          {/* Page header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="font-fraunces font-bold text-2xl text-gray-900">Notifications</h1>
              {unreadCount > 0 && (
                <p className="font-jakarta text-sm text-gray-400 mt-0.5">{unreadCount} unread</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1A6B3C]/8 hover:bg-[#1A6B3C]/15 transition-colors"
              >
                <CheckCheck size={15} className="text-[#1A6B3C]" />
                <span className="font-jakarta text-xs font-semibold text-[#1A6B3C]">Mark all read</span>
              </button>
            )}
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl border border-[#1A6B3C]/8 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
            {loading ? (
              <div className="divide-y divide-gray-50">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-start gap-4 px-5 py-4 animate-pulse">
                    <div className="w-11 h-11 rounded-2xl bg-gray-200 flex-shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3.5 bg-gray-200 rounded-full w-1/2" />
                      <div className="h-3 bg-gray-100 rounded-full w-3/4" />
                      <div className="h-2.5 bg-gray-100 rounded-full w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#1A6B3C]/8 flex items-center justify-center mx-auto mb-4">
                  <Bell size={28} className="text-[#1A6B3C]/30" />
                </div>
                <p className="font-fraunces font-semibold text-lg text-gray-700 mb-1">You're all caught up!</p>
                <p className="font-jakarta text-sm text-gray-400">
                  New likes, comments, and requests will show up here.
                </p>
              </div>
            ) : (
              <>
                {today.length > 0 && (
                  <div>
                    <div className="px-5 py-2 bg-gray-50 border-b border-gray-100">
                      <span className="font-jakarta text-[10px] font-bold text-gray-400 uppercase tracking-widest">Today</span>
                    </div>
                    {today.map(n => <NotifRow key={n.id} notif={n} onClick={() => handleClick(n)} />)}
                  </div>
                )}
                {earlier.length > 0 && (
                  <div>
                    <div className="px-5 py-2 bg-gray-50 border-b border-gray-100">
                      <span className="font-jakarta text-[10px] font-bold text-gray-400 uppercase tracking-widest">Earlier</span>
                    </div>
                    {earlier.map(n => <NotifRow key={n.id} notif={n} onClick={() => handleClick(n)} />)}
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </PageTransition>
  );
}