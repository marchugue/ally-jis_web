import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Bell, Home, Compass, MessageCircle, User, ChevronDown, LogOut, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationsContext';
import { useChatView } from '@/context/ChatViewContext';
import { apiClient } from '@/api/client';
import { profileService } from '@/lib/services/profileService';
import type { Notification } from '@/types/ally';

import { AvatarDisplay } from '@/components/ally/AvatarDisplay';

interface TopNavProps {
  onNotificationClick?: () => void;
  hideBottomNav?: boolean;
}

export default function TopNav({ onNotificationClick, hideBottomNav = false }: TopNavProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isChatFocused } = useChatView();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState<{ name: string; avatarUrl: string | null; course: string | null } | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const {
    notifications,
    unreadCount,
    loading: loadingNotifs,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotifications();

  const isMessagesPage = location.pathname === '/messages';

  // Existing behavior: hide bottom bar while typing (keyboard open).
  // New behavior: an open thread on mobile hides BOTH bars entirely, so the
  // conversation gets the full screen, like Messenger/Instagram DMs.
  const shouldHideForChatFocus = isMessagesPage && isMobile && isChatFocused;
  const shouldHideBottomNav = hideBottomNav || shouldHideForChatFocus || (isMessagesPage && isMobile && isInputFocused);
  const shouldHideTopNav = shouldHideForChatFocus;

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/discover', label: 'Discover', icon: Compass },
    { path: '/messages', label: 'Messages', icon: MessageCircle },
    { path: '/requests', label: 'Requests', icon: UserPlus },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    profileService
      .getMyProfile()
      .then((data) => {
        setProfile({
          name: data.name,
          avatarUrl: data.avatar,
          course: data.course,
        });
      })
      .catch(() => {
        setProfile(null);
      });
  }, [user?.id]);

  useEffect(() => {
    const updateMobile = () => setIsMobile(window.innerWidth < 768);
    updateMobile();
    window.addEventListener('resize', updateMobile);
    return () => window.removeEventListener('resize', updateMobile);
  }, []);

  useEffect(() => {
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName;
      const isTextInput = tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
      if (isTextInput) {
        setIsInputFocused(true);
      }
    };

    const handleFocusOut = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName;
      const isTextInput = tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
      if (isTextInput) {
        setIsInputFocused(false);
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const handleNotificationClick = async (notifId: string, type: Notification['type'], fromUserId?: string) => {
    if (!user) return;

    await markAsRead(notifId);
    setShowNotifs(false);
    onNotificationClick?.();

    if (type === 'friend_request') {
      navigate('/requests');
    } else if (type === 'accepted') {
      if (fromUserId) {
        const { conversationId } = await apiClient.findConversationWithUser(fromUserId);
        navigate(conversationId ? '/messages' : '/messages', {
          state: conversationId ? { conversationId } : undefined,
        });
      } else {
        navigate('/messages');
      }
    } else if (type === 'match') {
      // TODO: navigate to fromUserId's profile once profile route is set up
      // navigate(`/profile/${fromUserId}`);
      navigate('/discover');
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleClearAll = async () => {
    await clearAll();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch (err) {
      console.warn("Sign out failed", err);
    } finally {
      setShowProfile(false);
    }
  };

  function NotifItem({ notif, onClick }: { notif: Notification; onClick: () => void }) {
    const iconMap: Record<Notification['type'], React.ReactNode> = {
      friend_request: <UserPlus size={15} />,
      accepted: <span className="text-base">🤝</span>,
      match: <span className="text-base">✨</span>,
      message: <MessageCircle size={15} />,
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
          'w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0',
          !notif.isRead && 'bg-[#1A6B3C]/[0.03]'
        )}
      >
        <div className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0',
          colorMap[notif.type]
        )}>
          {iconMap[notif.type]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-jakarta font-semibold text-sm text-gray-900 leading-snug">{notif.title}</p>
          <p className="font-jakarta text-xs text-gray-500 mt-0.5 leading-snug">{notif.description}</p>
          <p className="font-jakarta text-[10px] text-[#3B8C7E] mt-1">{notif.timestamp}</p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {!notif.isRead && (
            <div className="w-2 h-2 bg-[#1A6B3C] rounded-full mt-1.5" />
          )}
          <ArrowRight size={13} className="text-gray-300 mt-1" />
        </div>
      </button>
    );
  }

  return (
    <>
      {/* ── Top bar: hidden on mobile while a conversation thread is open ── */}
      {!shouldHideTopNav && (
        <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-[#1A6B3C]/10 shadow-sm">
          <div className="w-full px-4 sm:px-10 flex md:grid md:grid-cols-[1fr_auto_1fr] items-center justify-between h-16">

            {/* Left panel: logo + (mobile only) bell/profile live here too */}
            <div className="flex items-center justify-start gap-2">
              <Link to="/dashboard" className="flex items-center gap-3 group flex-shrink-0">
                <div className="w-9 h-9 rounded-xl bg-[#1A6B3C] flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                  <span className="text-white font-fraunces font-bold text-lg leading-none">A</span>
                </div>
                <span className="font-fraunces font-semibold text-xl text-[#1A6B3C] hidden sm:block">
                  lly<span className="text-[#E8A838]">-jis</span>
                </span>
              </Link>
            </div>

            {/* Middle panel: desktop nav links — centred against the full nav width */}
            <div className="hidden md:flex items-center justify-center gap-2">
              {navLinks.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2 rounded-xl font-jakarta font-medium text-sm transition-all',
                    location.pathname === path
                      ? 'bg-[#1A6B3C] text-white shadow-sm'
                      : 'text-[#1A6B3C]/70 hover:bg-[#1A6B3C]/8 hover:text-[#1A6B3C]'
                  )}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              ))}
            </div>

            {/* Right panel: actions */}
            <div className="flex items-center justify-start md:justify-end gap-3 order-2 md:order-none">

              {/* Bell */}
              <div className="relative">
                <button
                  onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }}
                  className="relative p-2.5 rounded-xl hover:bg-[#1A6B3C]/8 transition-colors"
                >
                  <Bell size={20} className="text-[#1A6B3C]" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#E8A838] text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifs && (
                  <div className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-16 sm:top-full mt-2 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#1A6B3C]/10 overflow-hidden z-[60] animate-in fade-in zoom-in-95 duration-200">

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-[#1A6B3C]/5">
                      <div className="flex items-center gap-2">
                        <span className="font-jakarta font-semibold text-sm text-[#1A6B3C]">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="bg-[#E8A838] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {notifications.length > 0 && (
                          <button
                            onClick={handleClearAll}
                            className="text-xs text-red-400 hover:text-red-600 hover:underline font-jakarta font-medium transition-colors"
                          >
                            Clear all
                          </button>
                        )}
                        <span className="text-gray-200 text-xs">|</span>
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-[#3B8C7E] hover:underline font-jakarta font-medium"
                        >
                          Mark all read
                        </button>
                      </div>
                    </div>

                    <div className="max-h-[420px] overflow-y-auto">
                      {loadingNotifs ? (
                        /* Skeleton loader */
                        <div className="divide-y divide-gray-50">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-start gap-3 px-4 py-3 animate-pulse">
                              <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0" />
                              <div className="flex-1 space-y-2 pt-1">
                                <div className="h-3 bg-gray-200 rounded-full w-2/3" />
                                <div className="h-2.5 bg-gray-100 rounded-full w-1/2" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="px-4 py-10 text-center">
                          <div className="w-12 h-12 rounded-2xl bg-[#1A6B3C]/8 flex items-center justify-center mx-auto mb-3">
                            <Bell size={22} className="text-[#1A6B3C]/30" />
                          </div>
                          <p className="font-jakarta font-semibold text-sm text-gray-600 mb-1">You're all caught up!</p>
                          <p className="text-xs text-gray-400 font-jakarta">New likes, comments, and requests will show up here.</p>
                        </div>
                      ) : (
                        <>
                          {/* Group: Today */}
                          {(() => {
                            const todayNotifs = notifications.filter(n => {
                              const d = new Date(n.timestamp);
                              const now = new Date();
                              return d.toDateString() === now.toDateString();
                            });
                            const earlierNotifs = notifications.filter(n => {
                              const d = new Date(n.timestamp);
                              const now = new Date();
                              return d.toDateString() !== now.toDateString();
                            });
                            const PREVIEW_LIMIT = 5;
                            const allGrouped = [
                              ...(todayNotifs.length > 0 ? [{ label: 'Today', items: todayNotifs }] : []),
                              ...(earlierNotifs.length > 0 ? [{ label: 'Earlier', items: earlierNotifs }] : []),
                            ];

                            return allGrouped.map(({ label, items }) => {
                              const visibleItems = label === 'Today'
                                ? items
                                : notifications.slice(0, PREVIEW_LIMIT).filter(n => {
                                    const d = new Date(n.timestamp);
                                    const now = new Date();
                                    return d.toDateString() !== now.toDateString();
                                  });

                              if (visibleItems.length === 0) return null;

                              return (
                                <div key={label}>
                                  <div className="px-4 py-1.5 bg-gray-50 border-y border-gray-100 sticky top-0">
                                    <span className="font-jakarta text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
                                  </div>
                                  {visibleItems.map((notif) => (
                                    <NotifItem
                                      key={notif.id}
                                      notif={notif}
                                      onClick={() => handleNotificationClick(notif.id, notif.type, notif.fromUserId)}
                                    />
                                  ))}
                                </div>
                              );
                            });
                          })()}
                        </>
                      )}
                    </div>

                    {/* Footer: See all */}
                    {notifications.length >= 5 && (
                      <div className="border-t border-gray-100 bg-white">
                        <Link
                          to="/notifications"
                          onClick={() => setShowNotifs(false)}
                          className="flex items-center justify-center gap-2 px-4 py-3 hover:bg-[#1A6B3C]/5 transition-colors group"
                        >
                          <span className="font-jakarta text-sm font-semibold text-[#1A6B3C]">See all notifications</span>
                          <ArrowRight size={14} className="text-[#1A6B3C] group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }}
                  className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-[#1A6B3C]/8 transition-colors"
                >
                  <AvatarDisplay
                    src={profile?.avatarUrl}
                    name={profile?.name}
                    className="w-8 h-8 rounded-xl object-cover"
                  />
                  <span className="font-jakarta font-medium text-sm text-[#1A6B3C] hidden sm:block max-w-[120px] truncate">
                    {(profile?.name ?? 'Guest').split(' ')[0]}
                  </span>
                  <ChevronDown size={14} className="text-[#1A6B3C]/60 hidden sm:block" />
                </button>

                {showProfile && (
                  <div className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-16 sm:top-full mt-2 sm:w-52 bg-white rounded-2xl shadow-xl border border-[#1A6B3C]/10 overflow-hidden z-[60] animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-3 border-b border-gray-100 bg-[#1A6B3C]/5">
                      <p className="font-jakarta font-semibold text-sm text-gray-900 truncate">{profile?.name ?? 'Guest'}</p>
                      <p className="font-jakarta text-xs text-gray-500 truncate">{profile?.course ?? (user ? 'Student' : 'Sign in to personalize')}</p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setShowProfile(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <User size={16} className="text-[#1A6B3C]" />
                      <span className="font-jakarta text-sm text-gray-700">View Profile</span>
                    </Link>
                    <div className="border-t border-gray-100">
                      <Link
                        to="/"
                        onClick={(event) => {
                          event.preventDefault();
                          setShowProfile(false);
                          void handleSignOut();
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={16} className="text-red-400" />
                        <span className="font-jakarta text-sm text-red-500">Sign Out</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* ── Bottom mobile nav: full width, evenly spread ── */}
      {!shouldHideBottomNav && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-white/95 backdrop-blur-md border-t border-[#1A6B3C]/10 z-50 px-4 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between py-3">
            {navLinks.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    'flex flex-col items-center gap-1 transition-all relative flex-1',
                    isActive ? 'text-[#1A6B3C]' : 'text-gray-400'
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded-xl transition-all",
                    isActive && "bg-[#1A6B3C]/10 scale-110"
                  )}>
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={cn(
                    "font-jakarta text-[10px] font-bold tracking-wide transition-all",
                    isActive ? "opacity-100" : "opacity-60"
                  )}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}