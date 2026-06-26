import { Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import WelcomePage from "@/pages/WelcomePage";
import LoginPage from "@/pages/LoginPage";
import OnboardingPage from "@/pages/OnboardingPage";
import NewsfeedPage from "@/pages/NewsfeedPage";
import DiscoverPage from "@/pages/DiscoverPage";
import MessagesPage from "@/pages/MessagesPage";
import ProfilePage from "@/pages/ProfilePage";
import RequestsPage from "@/pages/RequestsPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import { PageTransition } from "@/components/PageTransition";
import { Toaster } from "@/components/ui/sonner";
import { MainLayout } from "@/components/MainLayout";

function App() {
  const location = useLocation();

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1A6B3C]/20 border-t-[#1A6B3C] rounded-full animate-spin" />
      </div>
    }>
      <Toaster position="top-center" expand={false} richColors />
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location}>
          <Route path="/" element={
            <PageTransition>
              <WelcomePage />
            </PageTransition>
          } />
          <Route path="/login" element={
            <PageTransition>
              <LoginPage />
            </PageTransition>
          } />
          
          <Route path="/onboarding" element={
            <PageTransition>
              <OnboardingPage />
            </PageTransition>
          } />

          <Route element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={
              <PageTransition>
                <NewsfeedPage />
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
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}

export default App;