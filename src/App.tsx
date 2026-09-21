import { Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import WelcomePage from "@/pages/WelcomePage";
import LoginPage from "@/pages/LoginPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import PasswordResetSuccessPage from "@/pages/PasswordResetSuccessPage";
import OnboardingPage from "@/pages/OnboardingPage";
import RegisterPage from "@/pages/RegisterPage";
import NewsfeedPage from "@/pages/NewsfeedPage";
import DiscoverPage from "@/pages/DiscoverPage";
import MessagesPage from "@/pages/MessagesPage";
import ProfilePage from "@/pages/ProfilePage";
import RequestsPage from "@/pages/RequestsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import BlockedUsersPage from "@/pages/BlockedUserPage";
import SettingsPage from "@/pages/SettingsPage";
import { AdminRoute } from "@/components/admin/AdminRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AdminManagementPage from "@/pages/admin/AdminManagementPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminReportsPage from "@/pages/admin/AdminReportsPage";
import AdminActivityLogPage from "@/pages/admin/AdminActivityLogPage";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage";
import AdminAvatarsPage from "@/pages/admin/AdminAvatarsPage";
import ConfirmPage from "@/pages/ConfirmPage";
import OtpVerifyPage from "@/pages/OtpVerifyPage";
import PrivacyPage from "@/pages/PrivacyPage";
import TermsPage from "@/pages/TermsPage";
import SupportPage from "@/pages/SupportPage";
import AboutPage from "@/pages/AboutPage";
import DownloadPage from "@/pages/DownloadPage";
import { PageTransition } from "@/components/PageTransition";
import { Toaster } from "@/components/ui/sonner";
import { CookieConsentCard, useCookieConsent } from "@/components/CookieConsentCard";
import { MainLayout } from "@/components/MainLayout";
import { DashboardRoleGate } from "@/components/DashboardRoleGate";
import PendingApprovalPage from "@/pages/PendingApprovalPage";
import { BACKEND_SWITCHED_EVENT } from "@/api/http";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

function WelcomeRoute() {
  const { user, session, loading, needsOnboarding, isPendingApproval } = useAuth();
  const { isAllowed: cookiesAllowed } = useCookieConsent();

  // If cookies are allowed and session check is in-flight, show clean loading state to avoid flashing WelcomePage
  if (cookiesAllowed && loading) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] dark:bg-[#090D16] flex items-center justify-center transition-colors">
        <div className="w-10 h-10 border-4 border-[#1A6B3C]/20 dark:border-emerald-500/20 border-t-[#1A6B3C] dark:border-t-emerald-400 rounded-full animate-spin" />
      </div>
    );
  }

  // If cookies are allowed and user has an active session, automatically route into dashboard
  if (cookiesAllowed && !loading && (user || session)) {
    if (needsOnboarding) {
      return <Navigate to="/onboarding" replace />;
    }
    if (isPendingApproval) {
      return <Navigate to="/pending-approval" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <PageTransition>
      <WelcomePage />
    </PageTransition>
  );
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleBackendSwitched = (e: Event) => {
      const customEvent = e as CustomEvent<{ url: string; isFallback: boolean; reason?: string }>;
      if (customEvent.detail?.isFallback) {
        toast.info("Local backend not running. Switched to Production backend.", {
          id: "backend-fallback-notice",
          duration: 4000,
          description: "All requests are automatically served by Railway production.",
        });
      }
    };

    window.addEventListener(BACKEND_SWITCHED_EVENT, handleBackendSwitched);
    return () => window.removeEventListener(BACKEND_SWITCHED_EVENT, handleBackendSwitched);
  }, []);

  // If this app is also reachable at an "admin.*" subdomain (e.g.
  // admin.ally-jis.com), landing on its root should go straight to the
  // admin panel rather than the student welcome page — DNS/hosting only
  // routes traffic here, it doesn't know about React Router paths.
  useEffect(() => {
    if (window.location.hostname.startsWith('admin.') && location.pathname === '/') {
      navigate('/admin', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F7F4EF] dark:bg-[#090D16] flex items-center justify-center transition-colors">
        <div className="w-10 h-10 border-4 border-[#1A6B3C]/20 dark:border-emerald-500/20 border-t-[#1A6B3C] dark:border-t-emerald-400 rounded-full animate-spin" />
      </div>
    }>
      <Toaster />
      <CookieConsentCard />
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location}>
          <Route path="/" element={<WelcomeRoute />} />
          <Route path="/welcome" element={<Navigate to="/" replace />} />
          <Route path="/login" element={
            <PageTransition>
              <LoginPage />
            </PageTransition>
          } />

          <Route path="/forgot-password" element={
            <PageTransition>
              <ForgotPasswordPage />
            </PageTransition>
          } />
          <Route path="/reset-password" element={
            <PageTransition>
              <ResetPasswordPage />
            </PageTransition>
          } />
          <Route path="/password-reset-success" element={
            <PageTransition>
              <PasswordResetSuccessPage />
            </PageTransition>
          } />

          <Route path="/register" element={
            <PageTransition>
              <RegisterPage />
            </PageTransition>
          } />
          <Route path="/onboarding" element={
            <PageTransition>
              <OnboardingPage />
            </PageTransition>
          } />
          <Route path="/confirmation-page" element={
            <PageTransition>
              {/* Legacy redirect: old magic-link URLs → new OTP page */}
              <ConfirmPage />
            </PageTransition>
          } />
          <Route path="/verify-email" element={
            <PageTransition>
              <OtpVerifyPage />
            </PageTransition>
          } />
          <Route path="/privacy" element={
            <PageTransition>
              <PrivacyPage />
            </PageTransition>
          } />
          <Route path="/terms" element={
            <PageTransition>
              <TermsPage />
            </PageTransition>
          } />
          <Route path="/support" element={
            <PageTransition>
              <SupportPage />
            </PageTransition>
          } />
          <Route path="/about" element={
            <PageTransition>
              <AboutPage />
            </PageTransition>
          } />
          <Route path="/download" element={
            <PageTransition>
              <DownloadPage />
            </PageTransition>
          } />

          <Route element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={
              <PageTransition>
                <DashboardRoleGate>
                  <NewsfeedPage />
                </DashboardRoleGate>
              </PageTransition>
            } />
            <Route path="/discover" element={
              <PageTransition>
                <DiscoverPage />
              </PageTransition>
            } />
            <Route path="/messages" element={
              <PageTransition>
                <MessagesPage />
              </PageTransition>
            } />
            <Route path="/requests" element={
              <PageTransition>
                <RequestsPage />
              </PageTransition>
            } />
            <Route path="/profile" element={
              <PageTransition>
                <ProfilePage />
              </PageTransition>
            } />
            <Route path="/profile/:userId" element={
              <PageTransition>
                <ProfilePage />
              </PageTransition>
            } />
            <Route path="/notifications" element={
              <PageTransition>
                <NotificationsPage />
              </PageTransition>
            } />
            <Route path="/blocked-users" element={
              <PageTransition>
                <BlockedUsersPage />
              </PageTransition>
            } />
            <Route path="/settings" element={
              <PageTransition>
                <SettingsPage />
              </PageTransition>
            } />
            <Route path="/pending-approval" element={
              <PageTransition>
                <PendingApprovalPage />
              </PageTransition>
            } />


          </Route>

          <Route element={
            <ProtectedRoute>
              <AdminRoute />
            </ProtectedRoute>
          }>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/reports" element={<AdminReportsPage />} />
              <Route path="/admin/admins" element={<AdminManagementPage />} />
              <Route path="/admin/activity" element={<AdminActivityLogPage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
              <Route path="/admin/avatars" element={<AdminAvatarsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}

export default App;