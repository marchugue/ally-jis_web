import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, User, ArrowRight, X } from 'lucide-react';
import type { AdminRole } from '@/api/client';

interface RoleSelectionModalProps {
  role: AdminRole;
  onClose: () => void;
}

const ROLE_META: Record<
  AdminRole,
  { label: string; badge: string }
> = {
  super_admin: {
    label: 'Super Admin',
    badge: 'bg-[#E8A838]/10 text-[#E8A838] border border-[#E8A838]/30',
  },
  admin: {
    label: 'Admin',
    badge: 'bg-[#1A6B3C]/8 text-[#1A6B3C] border border-[#1A6B3C]/20',
  },
  moderator: {
    label: 'Moderator',
    badge: 'bg-[#3B8C7E]/8 text-[#3B8C7E] border border-[#3B8C7E]/20',
  },
};

export function RoleSelectionModal({ role, onClose }: RoleSelectionModalProps) {
  const navigate = useNavigate();
  const meta = ROLE_META[role];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Small delay so page transition finishes first
    const t = setTimeout(() => setVisible(true), 120);
    return () => clearTimeout(t);
  }, []);

  const handleAdmin = () => {
    setVisible(false);
    setTimeout(() => navigate('/admin', { replace: true }), 220);
  };

  const handleUser = () => {
    setVisible(false);
    setTimeout(() => {
      onClose();
      navigate('/dashboard', { replace: true });
    }, 220);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
          style={{ background: 'rgba(26,55,35,0.45)', backdropFilter: 'blur(8px)' }}
        >
          {/* Subtle ambient blobs — same pattern as LoginPage */}
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#1A6B3C]/5 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-[#E8A838]/8 blur-3xl pointer-events-none" />

          <motion.div
            key="card"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#1A6B3C]/8 overflow-hidden"
          >
            {/* Top accent stripe — amber, matching the brand accent */}
            <div className="h-1 w-full bg-gradient-to-r from-[#1A6B3C] via-[#E8A838] to-[#1A6B3C]" />

            {/* Close (x) button */}
            <button
              onClick={handleUser}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl text-[#1A6B3C]/40 hover:text-[#1A6B3C] hover:bg-[#1A6B3C]/6 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="p-8">
              {/* Logo mark — same as LoginPage top bar */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-9 h-9 rounded-xl bg-[#1A6B3C] flex items-center justify-center shadow-md">
                  <span className="text-white font-fraunces font-bold text-lg leading-none">A</span>
                </div>
                <span className="font-fraunces font-semibold text-xl text-[#1A6B3C]">
                  lly<span className="text-[#E8A838]">-jis</span>
                </span>
              </div>

              {/* Heading */}
              <h2 className="font-fraunces text-2xl font-bold text-[#1A6B3C] mb-1">
                How would you like to continue?
              </h2>
              <p className="font-jakarta text-sm text-[#1A6B3C]/60 mb-7">
                You're signed in as a{' '}
                <span className="font-semibold text-[#1A6B3C]">{meta.label}</span>.
                Choose how you'd like to use Ally-jis right now.
              </p>

              {/* Choices */}
              <div className="space-y-3">
                {/* Primary action — go to admin panel */}
                <button
                  onClick={handleAdmin}
                  className="group w-full flex items-center gap-4 bg-[#1A6B3C] text-white font-jakarta font-bold py-3.5 px-5 rounded-xl hover:bg-[#155a33] transition-all shadow-lg active:scale-[0.98]"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck size={18} className="text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold leading-tight">Continue as {meta.label}</p>
                    <p className="text-xs text-white/70 font-normal mt-0.5">
                      Access the admin dashboard and management tools.
                    </p>
                  </div>
                  <ArrowRight
                    size={16}
                    className="flex-shrink-0 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                  />
                </button>

                {/* Secondary action — continue as regular user */}
                <button
                  onClick={handleUser}
                  className="group w-full flex items-center gap-4 border-2 border-[#1A6B3C]/20 text-[#1A6B3C] font-jakarta font-bold py-3.5 px-5 rounded-xl hover:border-[#1A6B3C]/40 hover:bg-[#1A6B3C]/5 transition-all active:scale-[0.98]"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#1A6B3C]/8 flex items-center justify-center flex-shrink-0">
                    <User size={18} className="text-[#1A6B3C]" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold leading-tight">Continue as Regular User</p>
                    <p className="text-xs text-[#1A6B3C]/55 font-normal mt-0.5">
                      Browse your newsfeed and connect with allies.
                    </p>
                  </div>
                  <ArrowRight
                    size={16}
                    className="flex-shrink-0 opacity-40 group-hover:opacity-70 group-hover:translate-x-0.5 transition-all"
                  />
                </button>
              </div>

              {/* Footer note */}
              <p className="font-jakarta text-xs text-center text-[#1A6B3C]/40 mt-5">
                You can always switch later from the navigation menu.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
