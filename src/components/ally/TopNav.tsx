import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Settings, Sun, Moon, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationsContext';
import { useChatView } from '@/context/ChatViewContext';
import { useTheme } from '@/context/ThemeContext';
import { apiClient } from '@/api/client';
import { profileService } from '@/lib/services/profileService';

import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import { LogoutConfirmModal } from '@/components/auth/LogoutConfirmModal';
import { LordNavIcon } from '@/components/ally/LordNavIcon';

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
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const { unreadCount } = useNotifications();

  const isMessagesPage = location.pathname === '/messages';
  const isSettingsPage = location.pathname === '/settings' || location.pathname.startsWith('/settings/');
  const isBlockedUsersPage = location.pathname === '/blocked-users';
  const isRestrictedUsersPage = location.pathname === '/restricted-users' || location.pathname === '/restricted';
  const isPostDetailPage = location.pathname.startsWith('/post/');
  const isRequestsPage = location.pathname === '/requests';
  const isSubPage = isSettingsPage || isBlockedUsersPage || isRestrictedUsersPage || isPostDetailPage || isRequestsPage;

  // Existing behavior: hide bottom bar while typing (keyboard open).
  // New behavior: an open thread on mobile hides BOTH bars entirely, so the
  // conversation gets the full screen, like Messenger/Instagram DMs.
  // Also hide on subpages like Settings to match native mobile stack screens.
  const shouldHideForChatFocus = isMessagesPage && isMobile && isChatFocused;
  const shouldHideBottomNav =
    hideBottomNav ||
    shouldHideForChatFocus ||
    (isMessagesPage && isMobile && isInputFocused) ||
    (isMobile && isSubPage);
  const shouldHideTopNav = shouldHideForChatFocus;

  const isLinkActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const navLinks = [
    {
      path: '/dashboard',
      label: 'Home',
      outlineSrc: '/icons/lordicon/home-outline.json', // ID 63 outline static
      solidSrc: '/icons/lordicon/home-solid.json',     // ID 63 solid in-reveal / hover-pinch
      activeState: 'in-reveal',
      hoverState: 'hover-pinch',
    },
    {
      path: '/discover',
      label: 'Discover',
      outlineSrc: '/icons/lordicon/compass-outline.json', // ID 86 compass
      solidSrc: '/icons/lordicon/compass-solid.json',
      activeState: 'in-reveal',
      hoverState: 'hover-pinch',
    },
    {
      path: '/messages',
      label: 'Messages',
      outlineSrc: '/icons/lordicon/chat-outline.json', // ID 3114 chat
      solidSrc: '/icons/lordicon/chat-solid.json',
      activeState: 'in-reveal',
      hoverState: 'hover-pinch',
    },
    {
      path: '/notifications',
      label: 'Notifications',
      outlineSrc: '/icons/lordicon/bell-outline.json', // ID 193 bell
      solidSrc: '/icons/lordicon/bell-solid.json',
      activeState: 'in-reveal',
      hoverState: 'hover-pinch',
    },
    {
      path: '/profile',
      label: 'Profile',
      outlineSrc: '/icons/lordicon/user-outline.json', // ID 21 avatar
      solidSrc: '/icons/lordicon/user-solid.json',
      activeState: 'in-reveal',
      hoverState: 'hover-pinch',
    },
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

            {/* Middle panel: desktop nav links — spacious, borderless, no bg pill, active label underneath, 129px responsive icon containers */}
            <div className="hidden md:flex items-center justify-between w-full md:max-w-[480px] lg:max-w-[740px] xl:max-w-[860px] 2xl:max-w-[920px] mx-auto px-2">
              {navLinks.map(({ path, label, outlineSrc, solidSrc, activeState, hoverState }) => {
                const isActive = isLinkActive(path);
                const isHovered = hoveredLink === path;

                return (
                  <Link
                    key={path}
                    to={path}
                    aria-label={label}
                    onClick={() => {
                      if (path === '/messages') {
                        window.dispatchEvent(new CustomEvent('reset-messages-page'));
                      }
                    }}
                    onMouseEnter={() => setHoveredLink(path)}
                    onMouseLeave={() => setHoveredLink(null)}
                    className={cn(
                      'relative flex flex-col items-center justify-start h-12 pt-1 transition-colors duration-150 outline-none select-none group',
                      'w-[84px] md:w-[88px] lg:w-[115px] xl:w-[129px] shrink-0',
                      isActive
                        ? 'text-[#1A6B3C] dark:text-emerald-400'
                        : 'text-gray-400 dark:text-gray-500 hover:text-[#1A6B3C] dark:hover:text-emerald-400'
                    )}
                  >
                    <div className="relative flex items-center justify-center w-7 h-7">
                      <LordNavIcon
                        outlineSrc={outlineSrc}
                        solidSrc={solidSrc}
                        isActive={isActive}
                        isHovered={isHovered}
                        activeState={activeState}
                        hoverState={hoverState}
                        size={26}
                        stroke="regular"
                      />

                      {label === 'Notifications' && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-2 min-w-[17px] h-[17px] px-1 rounded-full text-[10px] font-extrabold bg-[#E8A838] text-white flex items-center justify-center leading-none shadow-sm ring-2 ring-white dark:ring-[#121212] animate-in zoom-in-75">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>

                    {isActive && (
                      <span className="font-jakarta text-[11px] font-semibold text-[#1A6B3C] dark:text-emerald-400 tracking-tight leading-none mt-1 animate-in fade-in duration-150 select-none whitespace-nowrap">
                        {label}
                      </span>
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

      {/* ── Bottom mobile nav: mirrors mobile app TAB_THEME closely ── */}
      {!shouldHideBottomNav && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-white dark:bg-[#111827] border-t border-[#E8E6E1] dark:border-white/10 z-50 px-2 pb-safe shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between h-[58px]">
            {navLinks.map(({ path, label, outlineSrc, solidSrc, activeState, hoverState }) => {
              const isActive = isLinkActive(path);
              const isHovered = hoveredLink === path;

              return (
                <Link
                  key={path}
                  to={path}
                  aria-label={label}
                  onClick={() => {
                    if (path === '/messages') {
                      window.dispatchEvent(new CustomEvent('reset-messages-page'));
                    }
                  }}
                  onTouchStart={() => setHoveredLink(path)}
                  onTouchEnd={() => setHoveredLink(null)}
                  className="flex flex-col items-center justify-center relative flex-1 h-full py-1 group"
                >
                  {/* Top indicator bar matching TAB_THEME.indicatorColor & indicatorHeight from ally-app */}
                  {isActive && (
                    <div className="absolute top-0 w-10 h-[3px] rounded-full bg-[#1A6B3C] dark:bg-emerald-400" />
                  )}

                  <div
                    className={cn(
                      'relative flex items-center justify-center transition-all',
                      isActive
                        ? 'text-[#1A6B3C] dark:text-emerald-400 -translate-y-0.5'
                        : 'text-gray-400 dark:text-gray-500 opacity-60 group-hover:opacity-100'
                    )}
                  >
                    <LordNavIcon
                      outlineSrc={outlineSrc}
                      solidSrc={solidSrc}
                      isActive={isActive}
                      isHovered={isHovered}
                      activeState={activeState}
                      hoverState={hoverState}
                      size={24}
                      stroke="regular"
                    />
                    {label === 'Notifications' && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#E8A838] text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none ring-2 ring-white dark:ring-[#111827]">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>

                  <span
                    className={cn(
                      'text-[9.5px] font-jakarta font-bold mt-0.5 tracking-tight leading-none',
                      isActive ? 'text-[#1A6B3C] dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'
                    )}
                  >
                    {label === 'Notifications' ? 'Alerts' : label}
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