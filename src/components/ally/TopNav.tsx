import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Home, Compass, MessageCircle, User, ChevronDown, LogOut, Settings, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationsContext';
import { useChatView } from '@/context/ChatViewContext';
import { useTheme } from '@/context/ThemeContext';
import { apiClient } from '@/api/client';
import { profileService } from '@/lib/services/profileService';

import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import { LogoutConfirmModal } from '@/components/auth/LogoutConfirmModal';

interface TopNavProps {
  onNotificationClick?: () => void;
  hideBottomNav?: boolean;
}

export default function TopNav({ onNotificationClick, hideBottomNav = false }: TopNavProps) {
  const { user, signOut } = useAuth();
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { isChatFocused } = useChatView();
  const [showProfile, setShowProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [profile, setProfile] = useState<{ name: string; avatarUrl: string | null; course: string | null } | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { unreadCount } = useNotifications();

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
    { path: '/notifications', label: 'Notifications', icon: Bell },
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
      {/* ── Top bar: visible on desktop (md+), hidden on mobile where bottom nav + screen headers are used ── */}
      {!shouldHideTopNav && (
        <nav className="hidden md:block sticky top-0 z-50 w-full bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md border-b border-[#1A6B3C]/10 dark:border-white/10 shadow-sm transition-colors duration-200">
          <div className="w-full px-4 sm:px-10 flex md:grid md:grid-cols-[1fr_auto_1fr] items-center justify-between h-16">

            {/* Left panel: logo + (mobile only) bell/profile live here too */}
            <div className="flex items-center justify-start gap-2">
              <Link to="/dashboard" className="flex items-center gap-3 group flex-shrink-0">
                <div className="w-9 h-9 rounded-xl bg-[#1A6B3C] flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                  <span className="text-white font-fraunces font-bold text-lg leading-none">A</span>
                </div>
                <span className="font-fraunces font-semibold text-xl text-[#1A6B3C] dark:text-white hidden sm:block">
                  lly<span className="text-[#E8A838]">-jis</span>
                </span>
              </Link>
            </div>

            {/* Middle panel: desktop nav links — centred against the full nav width (No background fill, active green) */}
            <div className="hidden md:flex items-center justify-center gap-1">
              {navLinks.map(({ path, label, icon: Icon }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 font-jakarta text-sm transition-all relative group',
                      isActive
                        ? 'text-[#1A6B3C] dark:text-emerald-400 font-bold'
                        : 'text-gray-600 dark:text-gray-300 hover:text-[#1A6B3C] dark:hover:text-white font-medium'
                    )}
                  >
                    <Icon
                      size={16}
                      className={cn(
                        'transition-colors',
                        isActive
                          ? 'text-[#1A6B3C] dark:text-emerald-400'
                          : 'text-gray-400 dark:text-gray-400 group-hover:text-[#1A6B3C] dark:group-hover:text-white'
                      )}
                    />
                    <span>{label}</span>
                    {label === 'Notifications' && unreadCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E8A838] text-white leading-none shadow-xs">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#1A6B3C] dark:bg-emerald-400 rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right panel: actions */}
            <div className="flex items-center justify-start md:justify-end gap-2 sm:gap-3 order-2 md:order-none">
              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfile(!showProfile)}
                  className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl bg-transparent dark:bg-transparent hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <AvatarDisplay
                    src={profile?.avatarUrl}
                    name={profile?.name}
                    className="w-8 h-8 rounded-xl object-cover dark:bg-transparent"
                  />
                  <span className="font-jakarta font-medium text-sm text-[#1A6B3C] dark:text-white hidden sm:block max-w-[120px] truncate">
                    {(profile?.name ?? 'Guest').split(' ')[0]}
                  </span>
                  <ChevronDown size={14} className="text-[#1A6B3C]/60 dark:text-gray-400 hidden sm:block" />
                </button>

                {showProfile && (
                  <div className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-16 sm:top-full mt-2 sm:w-56 bg-white dark:bg-[#181818] rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 overflow-hidden z-[60] animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-[#1E1E1E]">
                      <p className="font-jakarta font-semibold text-sm text-gray-900 dark:text-white truncate">{profile?.name ?? 'Guest'}</p>
                      <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 truncate">{profile?.course ?? (user ? 'Student' : 'Sign in to personalize')}</p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setShowProfile(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200 transition-colors"
                    >
                      <User size={16} className="text-gray-500 dark:text-gray-300" />
                      <span className="font-jakarta text-sm">View Profile</span>
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setShowProfile(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200 transition-colors"
                    >
                      <Settings size={16} className="text-gray-500 dark:text-gray-300" />
                      <span className="font-jakarta text-sm">Settings</span>
                    </Link>
                    {/* In-menu quick theme toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        toggleTheme();
                      }}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200 transition-colors text-left cursor-pointer border-t border-gray-100 dark:border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        {resolvedTheme === 'dark' ? (
                          <Sun size={16} className="text-amber-400" />
                        ) : (
                          <Moon size={16} className="text-gray-500 dark:text-gray-300" />
                        )}
                        <span className="font-jakarta text-sm">Appearance</span>
                      </div>
                      <span className="font-jakarta text-[11px] font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 capitalize">
                        {theme === 'system' ? 'System' : resolvedTheme}
                      </span>
                    </button>
                    <div className="border-t border-gray-100 dark:border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfile(false);
                          setShowLogoutConfirm(true);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left cursor-pointer"
                      >
                        <LogOut size={16} className="text-red-400" />
                        <span className="font-jakarta text-sm text-red-500">Sign Out</span>
                      </button>
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
        <div className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md border-t border-[#1A6B3C]/10 dark:border-white/10 z-50 px-4 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between py-3">
            {navLinks.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    'flex flex-col items-center gap-1 transition-all relative flex-1',
                    isActive ? 'text-[#1A6B3C] dark:text-emerald-400 font-bold' : 'text-gray-400 dark:text-gray-400 hover:dark:text-gray-200'
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded-xl transition-all relative",
                    isActive && "scale-110"
                  )}>
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-[#1A6B3C] dark:text-emerald-400" : "text-gray-400 dark:text-gray-400"} />
                    {label === 'Notifications' && unreadCount > 0 && (
                      <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-[#E8A838] text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className={cn(
                    "font-jakarta text-[10px] tracking-wide transition-all",
                    isActive ? "opacity-100 font-extrabold text-[#1A6B3C] dark:text-emerald-400" : "opacity-75 text-gray-500 dark:text-gray-400"
                  )}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleSignOut}
      />
    </>
  );
}