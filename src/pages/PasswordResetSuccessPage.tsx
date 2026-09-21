import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function PasswordResetSuccessPage() {
  return (
    <div className="min-h-screen bg-[#F7F4EF] dark:bg-[#090D16] flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-[#EDE7DB] dark:bg-[#111827] rounded-[36px] p-10 text-center shadow-sm dark:border dark:border-white/10"
      >
        <div className="w-16 h-16 rounded-full bg-[#1A6B3C]/10 dark:bg-emerald-500/20 flex items-center justify-center mx-auto text-[#1A6B3C] dark:text-emerald-400 mb-6">
          <CheckCircle2 size={36} />
        </div>
        <h1 className="font-fraunces font-bold text-3xl text-[#1A6B3C] dark:text-white mb-3">Password reset complete</h1>
        <p className="font-jakarta text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-8">
          Your password has been updated and your email is confirmed. You can sign in with your new credentials.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider font-bold text-white bg-[#1A6B3C] dark:bg-emerald-600 px-8 py-4 rounded-full hover:bg-[#13502D] transition-all shadow-md"
        >
          Sign in now <ArrowRight size={16} />
        </Link>
      </motion.div>
    </div>
  );
}
