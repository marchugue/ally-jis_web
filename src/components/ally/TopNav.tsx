import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Bell, Home, Compass, MessageCircle, User, ChevronDown, LogOut, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { apiClient, isApiConfigured } from '@/api/client';
import { notificationService } from '@/lib/services/notificationService';
import { profileService } from '@/lib/services/profileService';
import type { Notification } from '@/types/ally';

import { AvatarDisplay } from '@/components/ally/AvatarDisplay';

interface TopNavProps {
  onNotificationClick?: () => void;
  hideBottomNav?: boolean;
}

const POLL_INTERVAL_MS = 15000;

export default function TopNav({ onNotificationClick, hideBottomNav = false }: TopNavProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [profile, setProfile] = useState<{ name: string; avatarUrl: string | null; course: string | null } | null>(null);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const useBackend = Boolean(isApiConfigured && user);

  const isMessagesPage = location.pathname === '/messages';
  const shouldHideBottomNav = hideBottomNav || (isMessagesPage && isMobile && isInputFocused);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/discover', label: 'Discover', icon: Compass },
    { path: '/messages', label: 'Messages', icon: MessageCircle },
    { path: '/requests', label: 'Requests', icon: UserPlus },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const fetchNotifications = async () => {
    if (!useBackend || !user) return;
    setLoadingNotifs(true);

    try {
      const mapped = await notificationService.list(20);
      setNotifications(mapped);
    } catch {
      setNotifications([]);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    if (!useBackend || !user) {
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

    void fetchNotifications();

    const interval = setInterval(() => {
      void fetchNotifications();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [useBackend, user?.id]);

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
    if (!user || !useBackend) return;

    await notificationService.markAsRead(notifId);
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n));

    if (type === 'friend_request') {
      navigate('/requests');
    } else if (type === 'accepted') {
      if (fromUserId) {
        const { conversationId } = await apiClient.findConversationWithUser(fromUserId);
        if (conversationId) {
          navigate('/messages', { state: { conversationId } });
        } else {
          navigate('/messages');
        }
      } else {
        navigate('/messages');
      }
    } else if (type === 'message') {
      navigate('/messages');
    }
    setShowNotifs(false);
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    if (!useBackend || !user) return;
    await notificationService.markAllAsRead();
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

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#1A6B3C]/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-[#1A6B3C] flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <span className="text-white font-fraunces font-bold text-lg leading-none">A</span>
            </div>
            <span className="font-fraunces font-semibold text-xl text-[#1A6B3C] hidden sm:block">
              lly<span className="text-[#E8A838]">-jis</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl font-jakarta font-medium text-sm transition-all',
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

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }}
                className="relative p-2.5 rounded-xl hover:bg-[#1A6B3C]/8 transition-colors"
              >
                <Bell size={20} className="text-[#1A6B3C]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#E8A838] text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-16 sm:top-full mt-2 sm:w-80 bg-white rounded-2xl shadow-xl border border-[#1A6B3C]/10 overflow-hidden z-[60] animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-[#1A6B3C]/5">
                    <span className="font-jakarta font-semibold text-sm text-[#1A6B3C]">Notifications</span>
                    <button onClick={markAllRead} className="text-xs text-[#3B8C7E] hover:underline font-jakarta font-medium">
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {loadingNotifs ? (
                      <div className="px-4 py-3 text-xs text-gray-400 font-jakarta text-center">Loading...</div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-10 text-center">
                        <Bell size={32} className="text-[#1A6B3C]/10 mx-auto mb-2" />
                        <p className="text-xs text-gray-400 font-jakarta">No notifications yet.</p>
                      </div>
                    ) : notifications.map((notif) => (
                      <button
                        key={notif.id}
                        type="button"
                        onClick={() => handleNotificationClick(notif.id, notif.type, notif.fromUserId)}
                        className={cn(
                          'w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0',
                          !notif.isRead && 'bg-[#1A6B3C]/4',
                          notif.type === 'friend_request' && 'cursor-pointer'
                        )}
                      >
                        <div className="w-9 h-9 rounded-full bg-[#1A6B3C]/10 text-[#1A6B3C] flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {notif.type === 'friend_request' ? <UserPlus size={16} /> : notif.title.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-jakarta font-semibold text-sm text-gray-900">{notif.title}</p>
                          <p className="font-jakarta text-xs text-gray-500 mt-0.5">{notif.description}</p>
                          <p className="font-jakarta text-[10px] text-[#3B8C7E] mt-1">{notif.timestamp}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {!notif.isRead && (
                            <div className="w-2 h-2 bg-[#1A6B3C] rounded-full flex-shrink-0 mt-1.5" />
                          )}
                          {notif.type === 'friend_request' && (
                            <ArrowRight size={16} className="text-[#1A6B3C]/70" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-[#1A6B3C]/8 transition-colors"
              >
                <AvatarDisplay
                  src={profile?.avatarUrl}
                  name={profile?.name}
                  className="w-8 h-8 rounded-xl object-cover"
                />
                <span className="font-jakarta font-medium text-sm text-[#1A6B3C] hidden sm:block max-w-[100px] truncate">
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

      {!shouldHideBottomNav && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#1A6B3C]/10 z-50 px-2 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-around py-3">
            {navLinks.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    'flex flex-col items-center gap-1 transition-all relative min-w-[64px]',
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
