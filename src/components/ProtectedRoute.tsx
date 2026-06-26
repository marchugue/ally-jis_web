import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1A6B3C]/20 border-t-[#1A6B3C] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
