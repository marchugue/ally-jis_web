import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Download, 
  Smartphone, 
  Check, 
  Heart, 
  MessageSquare, 
  Users, 
  Shield, 
  Send,
  CheckCircle2,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Footer } from '@/components/Footer';
import { useCookieConsent } from '@/components/CookieConsentCard';

type ViewMode = 'match' | 'chat' | 'feed';

export default function WelcomePage() {
  const { user, session, loading, needsOnboarding, isPendingApproval } = useAuth();
  const { isAllowed: cookiesAllowed } = useCookieConsent();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<ViewMode>('match');
  const [hasConnected, setHasConnected] = useState(false);

  // If cookies are already allowed and user has an active session, automatically redirect to dashboard
  useEffect(() => {
    if (cookiesAllowed && !loading && (user || session)) {
      if (needsOnboarding) {
        navigate('/onboarding', { replace: true });
      } else if (isPendingApproval) {
        navigate('/pending-approval', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [cookiesAllowed, loading, user, session, needsOnboarding, isPendingApproval, navigate]);

  // Welcome page is strictly light-mode only — ensure dark class is removed on mount
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }, []);

  // Interactive "How it works" demo states
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [demoTags, setDemoTags] = useState<string[]>(['Web Development', 'Specialty Coffee', 'UI Design']);
  const [demoRequestAccepted, setDemoRequestAccepted] = useState(false);

  const toggleDemoTag = (tag: string) => {
    if (demoTags.includes(tag)) {
      if (demoTags.length > 1) {
        setDemoTags(demoTags.filter((t) => t !== tag));
      }
    } else {
      setDemoTags([...demoTags, tag]);
    }
  };

  const steps = [
    {
      number: '01',
      title: 'Set up your profile',
      summary: 'Add your college department and select personal passions to calculate your campus affinity score.',
      hint: 'Tap tags to toggle affinity'
    },
    {
      number: '02',
      title: 'Transparent matching',
      summary: 'Discover Alijis students across courses with overlapping interests and verified compatibility percentages.',
      hint: 'Real-time percentage breakdown'
    },
    {
      number: '03',
      title: 'Mutual consent chat',
      summary: 'Direct messaging unlocks only after both peers accept, keeping your campus experience spam-free.',
      hint: 'Tap to test connection flow'
    },
  ];

  // Motion animation presets
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } 
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-[#1A6B3C] selection:bg-[#1A6B3C] selection:text-white flex flex-col justify-between overflow-x-hidden">
      
      {/* ── TOP NAVIGATION (GLASSMORPHISM) ── */}
      <motion.header 
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-[#F7F4EF]/85 dark:bg-[#121212]/90 border-b border-[#1A6B3C]/10 dark:border-white/10 shadow-[0_4px_24px_-4px_rgba(26,107,60,0.06)] transition-all"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 sm:h-[84px] flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <motion.div 
              whileHover={{ scale: 1.08, rotate: -4 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 350, damping: 20 }}
              className="w-11 h-11 rounded-full bg-[#1A6B3C] dark:bg-emerald-600 flex items-center justify-center text-white font-fraunces font-bold text-xl shadow-md transition-transform"
            >
              A
            </motion.div>
            <div className="flex flex-col">
              <span className="font-fraunces font-bold text-2xl tracking-tight text-[#1A6B3C] dark:text-white leading-none">
                Ally<span className="text-[#E8A838]">-jis</span>
              </span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#1A6B3C]/60 dark:text-gray-300 pt-0.5">
                CHMSU Alijis
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-mono uppercase tracking-wider text-[#1A6B3C]/75 dark:text-gray-300">
            <motion.a 
              whileHover={{ y: -1 }}
              href="#how-it-works" 
              className="hover:text-[#1A6B3C] dark:hover:text-white transition-colors"
            >
              Methodology
            </motion.a>
            <motion.a 
              whileHover={{ y: -1 }}
              href="#mobile-app" 
              className="hover:text-[#1A6B3C] dark:hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Smartphone size={14} className="text-[#E8A838]" /> 
              <span>Android Edition</span>
            </motion.a>
            <motion.div whileHover={{ y: -1 }}>
              <Link 
                to="/about" 
                className="hover:text-[#1A6B3C] dark:hover:text-white transition-colors"
              >
                Manifesto
              </Link>
            </motion.div>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Link
                to="/download"
                className="text-xs font-mono uppercase tracking-wider text-[#1A6B3C] dark:text-white bg-white dark:bg-white/10 hover:bg-[#EDE7DB] dark:hover:bg-white/20 px-4 py-2.5 rounded-full transition-all hidden sm:inline-flex items-center gap-2 font-semibold shadow-xs border border-transparent dark:border-white/10"
              >
                <Download size={14} className="text-[#E8A838]" /> 
                <span>APK v1.0</span>
              </Link>
            </motion.div>

            {user ? (
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link
                  to="/dashboard"
                  className="font-mono text-xs uppercase tracking-wider font-bold bg-[#1A6B3C] hover:bg-[#13502D] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white px-6 py-2.5 rounded-full transition-all shadow-md inline-block"
                >
                  Dashboard
                </Link>
              </motion.div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Mobile view: Log In button (since Join on Web is already prominent in Hero) */}
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="sm:hidden">
                  <Link
                    to="/login"
                    className="font-mono text-xs uppercase tracking-wider font-bold bg-[#1A6B3C] hover:bg-[#13502D] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white px-5 py-2 rounded-full transition-all shadow-md inline-block"
                  >
                    Log In
                  </Link>
                </motion.div>

                {/* Desktop view: Sign In text link + Join Circle button */}
                <Link
                  to="/login"
                  className="font-mono text-xs uppercase tracking-wider text-[#1A6B3C] dark:text-gray-200 hover:text-[#13502D] dark:hover:text-white px-4 py-2.5 rounded-full transition-colors hidden sm:inline"
                >
                  Log In
                </Link>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="hidden sm:block">
                  <Link
                    to="/register"
                    className="font-mono text-xs uppercase tracking-wider font-bold bg-[#1A6B3C] hover:bg-[#13502D] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white px-6 py-2.5 rounded-full transition-all shadow-md inline-block"
                  >
                    Join Circle
                  </Link>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </motion.header>

      {/* ── MAIN EDITORIAL CANVAS ── */}
      <main className="flex-1">

        {/* ── HERO SECTION: EDITORIAL TYPOGRAPHY & ASYMMETRIC CONTRAST ── */}
        <section className="pt-14 pb-24 sm:pt-20 sm:pb-36 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto">
            
            {/* Magazine Header Ledger */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#1A6B3C]/15 font-mono text-xs uppercase tracking-[0.25em] text-[#1A6B3C]/70"
            >
              <div className="flex items-center gap-2.5">
                <motion.span 
                  animate={{ scale: [1, 1.35, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-2.5 h-2.5 rounded-full bg-[#E8A838]" 
                />
                <span>CHMSU Alijis Campus Edition</span>
              </div>
              <div className="hidden sm:block">Vol. 01 • Academic Year 2025–2026</div>
              <div className="hidden lg:block text-[#1A6B3C]/90 font-semibold">Campus Peer Discovery</div>
            </motion.div>

            {/* Asymmetric Grid-Breaking Hero */}
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="pt-12 sm:pt-16 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start"
            >
              
              {/* Massive Editorial Headline with Animated Reveal */}
              <div className="lg:col-span-8 space-y-6">
                <motion.h1 
                  variants={fadeInUp}
                  className="font-fraunces text-6xl sm:text-8xl lg:text-[7.5rem] font-bold tracking-tight text-[#1A6B3C] leading-[0.92]"
                >
                  Find your <br />
                  people at <br />
                  <motion.span 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                    className="italic font-normal text-[#E8A838] inline-block"
                  >
                    CHMSU.
                  </motion.span>
                </motion.h1>
              </div>

              {/* Staggered Offset Statement & CTAs */}
              <motion.div 
                variants={fadeInUp}
                className="lg:col-span-4 lg:pt-8 space-y-8"
              >
                <div className="space-y-4">
                  <motion.div 
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.5, duration: 0.7, ease: "easeOut" }}
                    className="w-16 h-0.5 bg-[#1A6B3C]" 
                  />
                  <p className="font-jakarta text-base sm:text-lg text-gray-700 leading-relaxed">
                    Ally-jis connects students of Carlos Hilado Memorial State University – Alijis Campus based on shared interests, course specializations, and student organizations. Step outside your block section.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col gap-3.5 pt-2">
                  {user ? (
                    <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                      <Link
                        to="/dashboard"
                        className="w-full inline-flex items-center justify-center gap-3 bg-[#1A6B3C] hover:bg-[#13502D] text-white px-8 py-4 rounded-full font-mono text-xs uppercase tracking-wider font-bold transition-all shadow-md text-center"
                      >
                        <span>Enter Campus Dashboard</span>
                        <ArrowRight size={16} />
                      </Link>
                    </motion.div>
                  ) : (
                    <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                      <Link
                        to="/register"
                        className="w-full inline-flex items-center justify-center gap-3 bg-[#1A6B3C] hover:bg-[#13502D] text-white px-8 py-4 rounded-full font-mono text-xs uppercase tracking-wider font-bold transition-all shadow-md text-center"
                      >
                        <span>Join on Web</span>
                        <ArrowRight size={16} />
                      </Link>
                    </motion.div>
                  )}

                  <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                    <Link
                      to="/download"
                      className="w-full inline-flex items-center justify-center gap-3 bg-[#EDE7DB] dark:bg-[#111827] dark:border dark:border-white/10 hover:bg-[#e4ddcf] dark:hover:bg-[#1E293B] text-[#1A6B3C] dark:text-emerald-400 px-8 py-4 rounded-full font-mono text-xs uppercase tracking-wider font-semibold transition-all text-center"
                    >
                      <Smartphone size={16} className="text-[#E8A838]" />
                      <span>Download Android APK</span>
                    </Link>
                  </motion.div>
                </div>

                <div className="pt-4 border-t border-[#1A6B3C]/10 dark:border-white/10 flex items-center justify-between text-xs font-mono text-[#1A6B3C]/70 dark:text-gray-400">
                  <span>CIT • BSED • BSIT</span>
                  <span className="flex items-center gap-1.5 font-semibold text-[#1A6B3C] dark:text-emerald-400">
                    <Shield size={12} className="text-[#E8A838]" /> Mutual Consent
                  </span>
                </div>
              </motion.div>

            </motion.div>

          </div>
        </section>

        {/* ── BORDERLESS TONAL BLOCK: MOBILE COMPANION & LIVE UI ── */}
        <section id="mobile-app" className="bg-[#EDE7DB] dark:bg-[#0D131F] text-[#1A6B3C] dark:text-emerald-400 py-24 sm:py-36 px-4 sm:px-8 transition-colors duration-200">
          <div className="max-w-7xl mx-auto">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
              
              {/* Left Column: Editorial Specs Ledger */}
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="lg:col-span-6 space-y-8"
              >
                <div className="space-y-3">
                  <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#1A6B3C]/60 dark:text-emerald-400/70 block">
                    Chapter 01 // Pocket Companion
                  </span>
                  <h2 className="font-fraunces text-4xl sm:text-6xl font-bold leading-tight text-gray-900 dark:text-white">
                    Prefer using your phone between lectures?
                  </h2>
                </div>

                <p className="font-jakarta text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed max-w-xl">
                  Ally-jis is completely accessible in your browser, but we also package an official Android release for students on campus data promos who want push notifications.
                </p>

                {/* Editorial Ledger List with Stagger InView */}
                <div className="space-y-4 pt-2 max-w-lg">
                  {[
                    { label: 'Format', val: 'Signed Android APK (v1.0 Official Release)' },
                    { label: 'Package Weight', val: '~85 MB Data-Optimized' },
                    { label: 'Notification Engine', val: 'Instant Mutual Match Alerts' },
                    { label: 'OS Support', val: 'Android 8.0 Oreo or Newer' },
                  ].map((row, i) => (
                    <motion.div 
                      key={row.label}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 * i, duration: 0.5 }}
                      className="flex items-baseline justify-between py-3 border-b border-[#1A6B3C]/15 dark:border-white/10 font-mono text-xs"
                    >
                      <span className="text-[#1A6B3C]/70 dark:text-gray-400 uppercase tracking-wider">{row.label}</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{row.val}</span>
                    </motion.div>
                  ))}
                </div>

                <div className="pt-4 flex items-center gap-4">
                  <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }}>
                    <Link
                      to="/download"
                      className="inline-flex items-center gap-3 bg-[#1A6B3C] hover:bg-[#13502D] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white px-8 py-4 rounded-full font-mono text-xs uppercase tracking-wider font-bold transition-all shadow-md"
                    >
                      <Download size={16} />
                      <span>Download APK & Read Guide</span>
                    </Link>
                  </motion.div>
                </div>
              </motion.div>

              {/* Right Column: Dynamic Live Preview Device with Floating Spring Animation */}
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="lg:col-span-6 flex flex-col items-center"
              >
                
                {/* Mode Selector (Pill Custom Geometry with Layout Animation) */}
                <div className="mb-6 inline-flex p-1.5 bg-white dark:bg-[#111827] border border-transparent dark:border-white/10 rounded-full text-xs font-mono uppercase tracking-wider shadow-sm">
                  {(['match', 'chat', 'feed'] as ViewMode[]).map((tab) => {
                    const labels = {
                      match: 'Affinity Card',
                      chat: 'Mutual Thread',
                      feed: 'Campus Board',
                    };
                    const isActive = activeView === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveView(tab)}
                        className={`relative px-4 py-2 rounded-full transition-colors z-10 ${
                          isActive ? 'text-white' : 'text-[#1A6B3C]/70 hover:text-[#1A6B3C] dark:text-gray-400 dark:hover:text-white'
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeTabIndicator"
                            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                            className="absolute inset-0 bg-[#1A6B3C] dark:bg-emerald-600 rounded-full -z-10 shadow-sm"
                          />
                        )}
                        {labels[tab]}
                      </button>
                    );
                  })}
                </div>

                {/* Clean Frame with Floating Gentle Physics */}
                <motion.div 
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  whileHover={{ scale: 1.02 }}
                  className="w-[300px] sm:w-[330px] h-[520px] bg-[#1c2e22] rounded-[40px] p-3 shadow-2xl border-4 border-[#1c2e22]"
                >
                  <div className="w-full h-full bg-[#F7F4EF] dark:bg-[#111827] rounded-[32px] overflow-hidden flex flex-col justify-between">
                    
                    {/* Top Status */}
                    <div className="pt-2 px-6 pb-2 flex items-center justify-between text-[#1A6B3C] dark:text-emerald-400 text-[10px] font-mono font-semibold">
                      <span>9:41</span>
                      <div className="w-16 h-3.5 bg-black/80 dark:bg-black/90 rounded-full" />
                      <span>CHMSU</span>
                    </div>

                    {/* View Canvas with Animated Transitions */}
                    <div className="flex-1 p-4 overflow-y-auto">
                      <AnimatePresence mode="wait">
                        {activeView === 'match' && (
                          <motion.div
                            key="match"
                            initial={{ opacity: 0, scale: 0.96, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: -10 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                            className="bg-white dark:bg-[#1E293B] border border-transparent dark:border-white/10 rounded-2xl p-4 space-y-3.5 shadow-sm"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2.5">
                                <motion.div 
                                  whileHover={{ rotate: 10 }}
                                  className="w-11 h-11 rounded-full bg-[#1A6B3C] dark:bg-emerald-600 text-white flex items-center justify-center font-fraunces text-base font-bold shadow-xs"
                                >
                                  LM
                                </motion.div>
                                <div>
                                  <h3 className="font-jakarta font-bold text-xs text-gray-900 dark:text-white">Lyca M.</h3>
                                  <p className="text-[10px] font-mono text-gray-500 dark:text-gray-400">BSIT • 2nd Year</p>
                                </div>
                              </div>
                              <motion.span 
                                animate={{ scale: [1, 1.06, 1] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                className="font-mono text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#E8A838]/20 text-[#B45309] dark:text-[#E8A838]"
                              >
                                96% Match
                              </motion.span>
                            </div>

                            <p className="text-xs font-jakarta text-gray-600 dark:text-gray-300 bg-[#F7F4EF] dark:bg-[#0D131F] p-3 rounded-xl leading-relaxed">
                              "Looking for study group partners or someone to geek out with on tech trends!"
                            </p>

                            <div className="space-y-1">
                              <span className="text-[9px] font-mono uppercase tracking-widest text-gray-400 dark:text-gray-500 block">
                                Shared Affinity
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {['Web Development', 'UI Design', 'Specialty Coffee'].map((tag) => (
                                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-jakarta">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <motion.button 
                              onClick={() => setHasConnected(!hasConnected)}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.94 }}
                              className={`w-full mt-2 text-xs font-mono uppercase tracking-wider py-2.5 rounded-full flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                                hasConnected 
                                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 font-bold' 
                                  : 'bg-[#1A6B3C] hover:bg-[#13502D] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold'
                              }`}
                            >
                              {hasConnected ? (
                                <>
                                  <CheckCircle2 size={13} className="text-emerald-700 dark:text-emerald-400" />
                                  <span>Request Sent to Lyca</span>
                                </>
                              ) : (
                                <>
                                  <Heart size={12} className="text-[#E8A838] fill-[#E8A838]" />
                                  <span>Send Connect Request</span>
                                </>
                              )}
                            </motion.button>
                          </motion.div>
                        )}

                        {activeView === 'chat' && (
                          <motion.div
                            key="chat"
                            initial={{ opacity: 0, scale: 0.96, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: -10 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                            className="space-y-2.5 text-xs font-jakarta"
                          >
                            <div className="text-center text-[10px] font-mono text-gray-400 dark:text-gray-500 py-1">
                              MUTUAL CONSENT UNLOCKED
                            </div>

                            <motion.div 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.05 }}
                              className="bg-white dark:bg-[#1E293B] border border-transparent dark:border-white/10 p-2.5 rounded-2xl rounded-tl-none text-gray-700 dark:text-gray-200 max-w-[85%] shadow-sm"
                            >
                              Hey Trexie! Are you joining the JS workshop this Saturday? 👩‍💻
                            </motion.div>

                            <motion.div 
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.15 }}
                              className="bg-[#1A6B3C] dark:bg-emerald-600 text-white p-2.5 rounded-2xl rounded-br-none ml-auto max-w-[85%] shadow-sm"
                            >
                              Yes! Let's grab seats early — maybe at 8 AM before it fills up!
                            </motion.div>

                            <motion.div 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.25 }}
                              className="bg-white dark:bg-[#1E293B] border border-transparent dark:border-white/10 p-2.5 rounded-2xl rounded-tl-none text-gray-700 dark:text-gray-200 max-w-[85%] shadow-sm"
                            >
                              Deal! I'll save you a spot. See you there! ✨
                            </motion.div>

                            <div className="pt-3 flex items-center gap-2 bg-white dark:bg-[#1E293B] border border-transparent dark:border-white/10 p-2 rounded-full shadow-xs">
                              <span className="flex-1 text-[11px] text-gray-400 pl-2">Reply to Trexie...</span>
                              <div className="w-6 h-6 rounded-full bg-[#1A6B3C] dark:bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                                <Send size={10} />
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {activeView === 'feed' && (
                          <motion.div
                            key="feed"
                            initial={{ opacity: 0, scale: 0.96, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: -10 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                            className="space-y-2.5 text-xs font-jakarta"
                          >
                            <motion.div 
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-white dark:bg-[#1E293B] border border-transparent dark:border-white/10 p-3.5 rounded-2xl space-y-1.5 shadow-sm"
                            >
                              <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 dark:text-gray-400">
                                <span className="font-bold text-gray-800 dark:text-gray-200">Christine • BSED</span>
                                <span>15m ago</span>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300">
                                Anyone free for badminton at the gym court after 4:30 PM today? 🏸
                              </p>
                              <div className="text-[10px] font-mono text-[#1A6B3C] dark:text-emerald-400 font-semibold pt-1">
                                4 students confirmed
                              </div>
                            </motion.div>

                            <motion.div 
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 }}
                              className="bg-white dark:bg-[#1E293B] border border-transparent dark:border-white/10 p-3.5 rounded-2xl space-y-1.5 shadow-sm"
                            >
                              <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 dark:text-gray-400">
                                <span className="font-bold text-gray-800 dark:text-gray-200">GDSC Alijis</span>
                                <span>2h ago</span>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300">
                                Open workshop on UI prototyping this Thursday in IT Lab 2. All courses welcome!
                              </p>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Bottom Indicator */}
                    <div className="px-6 py-3 bg-white dark:bg-[#1E293B] border-t border-transparent dark:border-white/10 flex items-center justify-around text-[10px] font-mono uppercase text-gray-400 dark:text-gray-400">
                      <span className="text-[#1A6B3C] dark:text-emerald-400 font-bold flex items-center gap-1"><Users size={12} /> Matches</span>
                      <span className="flex items-center gap-1"><MessageSquare size={12} /> Chat</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

            </div>

          </div>
        </section>

        {/* ── BORDERLESS EDITORIAL WORKSPACE: HOW IT WORKS ── */}
        <section id="how-it-works" className="py-24 sm:py-36 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto space-y-16">
            
            {/* Editorial Title Block */}
            <motion.div 
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end pb-8 border-b border-[#1A6B3C]/15 dark:border-white/10"
            >
              <div className="lg:col-span-8 space-y-2">
                <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#1A6B3C]/60 dark:text-emerald-400/70 block">
                  Chapter 02 // Methodology
                </span>
                <h2 className="font-fraunces text-4xl sm:text-6xl lg:text-7xl font-bold leading-tight text-gray-900 dark:text-white">
                  How Ally-jis works.
                </h2>
              </div>
              <div className="lg:col-span-4">
                <p className="font-jakarta text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                  Three deliberate steps designed to foster organic friendships while completely respecting student privacy and mutual consent.
                </p>
              </div>
            </motion.div>

            {/* Interactive Step Switcher Tabs (Custom Pill Geometry with Spring Animation) */}
            <div className="flex flex-wrap items-center gap-3">
              {steps.map((step, idx) => {
                const isActive = activeStepIndex === idx;
                return (
                  <motion.button
                    key={step.number}
                    onClick={() => setActiveStepIndex(idx)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    className={`px-6 py-3 rounded-full font-mono text-xs uppercase tracking-wider transition-all flex items-center gap-2.5 ${
                      isActive
                        ? 'bg-[#1A6B3C] dark:bg-emerald-600 text-white shadow-md'
                        : 'bg-[#EDE7DB] dark:bg-[#111827] text-[#1A6B3C] dark:text-gray-300 hover:bg-[#e4ddcf] dark:hover:bg-[#1f293d] border border-transparent dark:border-white/10'
                    }`}
                  >
                    <span className="font-bold">{step.number}.</span>
                    <span>{step.title}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Grid-Breaking Staggered Simulation Studio */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[380px]">
              
              {/* Left Side: Step Narrative */}
              <motion.div 
                key={`narrative-${activeStepIndex}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="lg:col-span-5 space-y-6"
              >
                <div className="font-fraunces text-7xl sm:text-8xl font-bold text-[#E8A838]/80 dark:text-[#E8A838] leading-none">
                  {steps[activeStepIndex].number}
                </div>
                <h3 className="font-fraunces text-3xl sm:text-4xl font-bold leading-tight text-gray-900 dark:text-white">
                  {steps[activeStepIndex].title}
                </h3>
                <p className="font-jakarta text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  {steps[activeStepIndex].summary}
                </p>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 }}
                  className="inline-flex items-center gap-2 font-mono text-xs text-[#1A6B3C] dark:text-emerald-400 bg-[#EDE7DB] dark:bg-[#111827] border border-transparent dark:border-white/10 px-4 py-2 rounded-full shadow-xs"
                >
                  <Sparkles size={13} className="text-[#E8A838]" />
                  <span>{steps[activeStepIndex].hint}</span>
                </motion.div>
              </motion.div>

              {/* Right Side: Interactive Dynamic Playground */}
              <div className="lg:col-span-7 bg-[#EDE7DB] dark:bg-[#0D131F] border border-transparent dark:border-white/10 p-8 sm:p-12 rounded-[32px] flex flex-col justify-between shadow-xs">
                <AnimatePresence mode="wait">
                  
                  {/* STEP 01 SIMULATION */}
                  {activeStepIndex === 0 && (
                    <motion.div
                      key="interactive-step-1"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="space-y-6"
                    >
                      <div className="space-y-1">
                        <span className="font-mono text-xs uppercase tracking-widest text-[#1A6B3C]/70 dark:text-emerald-400/80">
                          Live Profile Calibration
                        </span>
                        <h4 className="font-fraunces text-2xl font-bold text-gray-900 dark:text-white">Pick your campus passions:</h4>
                      </div>

                      <div className="flex flex-wrap gap-2.5">
                        {[
                          'Web Development',
                          'UI Design',
                          'Specialty Coffee',
                          'Campus Badminton',
                          'Photography',
                          'Acoustic Music',
                          'Hackathons',
                          'Campus Journalism'
                        ].map((tag) => {
                          const isSelected = demoTags.includes(tag);
                          return (
                            <motion.button
                              key={tag}
                              onClick={() => toggleDemoTag(tag)}
                              whileHover={{ scale: 1.04, y: -1 }}
                              whileTap={{ scale: 0.94 }}
                              transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                              className={`px-5 py-2.5 rounded-full font-jakarta text-xs sm:text-sm font-medium transition-all ${
                                isSelected
                                  ? 'bg-[#1A6B3C] dark:bg-emerald-600 text-white shadow-md'
                                  : 'bg-white dark:bg-[#111827] text-gray-800 dark:text-gray-200 border border-transparent dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10'
                              }`}
                            >
                              {isSelected && <span className="mr-1.5 font-bold">✓</span>}
                              {tag}
                            </motion.button>
                          );
                        })}
                      </div>

                      <div className="pt-4 flex items-center justify-between border-t border-[#1A6B3C]/15 dark:border-white/10 font-mono text-xs">
                        <motion.span 
                          key={demoTags.length}
                          initial={{ scale: 1.2, color: '#E8A838' }}
                          animate={{ scale: 1, color: '#1A6B3C' }}
                          className="font-semibold text-[#1A6B3C] dark:text-emerald-400"
                        >
                          {demoTags.length} passions anchored
                        </motion.span>
                        <motion.button
                          whileHover={{ x: 3 }}
                          onClick={() => setActiveStepIndex(1)}
                          className="font-bold text-[#1A6B3C] dark:text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <span>Proceed to affinity calculation</span>
                          <ArrowRight size={13} />
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 02 SIMULATION */}
                  {activeStepIndex === 1 && (
                    <motion.div
                      key="interactive-step-2"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="space-y-6"
                    >
                      <div className="space-y-1">
                        <span className="font-mono text-xs uppercase tracking-widest text-[#1A6B3C]/70 dark:text-emerald-400/80">
                          Transparent Algorithmic Matching
                        </span>
                        <h4 className="font-fraunces text-2xl font-bold text-gray-900 dark:text-white">Peer Affinity Breakdown:</h4>
                      </div>

                      <motion.div 
                        initial={{ scale: 0.97, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white dark:bg-[#111827] border border-transparent dark:border-white/10 p-6 rounded-2xl space-y-4 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <motion.div 
                              whileHover={{ rotate: 10 }}
                              className="w-12 h-12 rounded-full bg-[#1A6B3C] dark:bg-emerald-600 text-white flex items-center justify-center font-fraunces font-bold text-lg"
                            >
                              LM
                            </motion.div>
                            <div>
                              <div className="font-jakarta font-bold text-base text-gray-900 dark:text-white">Lyca M.</div>
                              <div className="font-mono text-xs text-gray-500 dark:text-gray-400">BS Information Tech • 2nd Year</div>
                            </div>
                          </div>
                          <motion.span 
                            animate={{ scale: [1, 1.08, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            className="font-mono text-sm font-bold px-3.5 py-1.5 rounded-full bg-[#E8A838]/20 text-[#B45309] dark:text-[#E8A838]"
                          >
                            96% Match
                          </motion.span>
                        </div>

                        <div className="space-y-2 pt-1">
                          <span className="font-mono text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 block">
                            Shared Passions with you:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {['Web Development', 'UI Design', 'Specialty Coffee'].map((item) => (
                              <span key={item} className="px-3 py-1 rounded-full bg-[#F7F4EF] dark:bg-[#090D16] text-[#1A6B3C] dark:text-emerald-400 font-mono text-xs font-semibold">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.div>

                      <div className="pt-2 flex items-center justify-between font-mono text-xs">
                        <button
                          onClick={() => setActiveStepIndex(0)}
                          className="text-gray-500 dark:text-gray-400 hover:text-[#1A6B3C] dark:hover:text-emerald-400"
                        >
                          ← Re-pick tags
                        </button>
                        <motion.button
                          whileHover={{ x: 3 }}
                          onClick={() => setActiveStepIndex(2)}
                          className="font-bold text-[#1A6B3C] dark:text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <span>Test mutual consent flow</span>
                          <ArrowRight size={13} />
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 03 SIMULATION */}
                  {activeStepIndex === 2 && (
                    <motion.div
                      key="interactive-step-3"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="space-y-6"
                    >
                      <div className="space-y-1">
                        <span className="font-mono text-xs uppercase tracking-widest text-[#1A6B3C]/70 dark:text-emerald-400/80">
                          Two-Way Mutual Consent
                        </span>
                        <h4 className="font-fraunces text-2xl font-bold text-gray-900 dark:text-white">Zero Unsolicited Messages:</h4>
                      </div>

                      <motion.div 
                        initial={{ scale: 0.97, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white dark:bg-[#111827] border border-transparent dark:border-white/10 p-6 rounded-2xl space-y-4 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <motion.div 
                            whileHover={{ rotate: -10 }}
                            className="w-12 h-12 rounded-full bg-[#E8A838] text-white flex items-center justify-center font-fraunces font-bold text-lg"
                          >
                            LM
                          </motion.div>
                          <div>
                            <div className="font-jakarta font-bold text-sm text-gray-900 dark:text-white">
                              Lyca M. requested to connect
                            </div>
                            <div className="font-jakarta text-xs text-gray-500 dark:text-gray-400">
                              "Saw we both love UI Design. Let's collaborate this semester!"
                            </div>
                          </div>
                        </div>

                        <motion.button
                          onClick={() => setDemoRequestAccepted(!demoRequestAccepted)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.95 }}
                          className={`w-full py-3.5 rounded-full font-mono text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
                            demoRequestAccepted
                              ? 'bg-emerald-700 dark:bg-emerald-600 text-white shadow-md'
                              : 'bg-[#1A6B3C] hover:bg-[#13502D] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-md'
                          }`}
                        >
                          {demoRequestAccepted ? (
                            <>
                              <CheckCircle2 size={16} />
                              <span>Connection Confirmed! Messaging Unlocked</span>
                            </>
                          ) : (
                            <>
                              <Heart size={15} className="fill-[#E8A838] text-[#E8A838]" />
                              <span>Accept Connection & Unlock Chat</span>
                            </>
                          )}
                        </motion.button>
                      </motion.div>

                      <div className="pt-2 flex items-center justify-between font-mono text-xs">
                        <button
                          onClick={() => setActiveStepIndex(1)}
                          className="text-gray-500 dark:text-gray-400 hover:text-[#1A6B3C] dark:hover:text-emerald-400"
                        >
                          ← Back to matches
                        </button>
                        <button
                          onClick={() => {
                            setActiveStepIndex(0);
                            setDemoRequestAccepted(false);
                          }}
                          className="font-bold text-[#1A6B3C] dark:text-emerald-400 hover:underline"
                        >
                          Reset walkthrough ↻
                        </button>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

            </div>

          </div>
        </section>

        {/* ── BORDERLESS HIGH CONTRAST BLOCK: CAMPUS MANIFESTO ── */}
        <section id="about" className="bg-[#1A6B3C] text-[#F7F4EF] py-24 sm:py-36 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
              
              {/* Left Column: Extreme Display Typography */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="lg:col-span-7 space-y-6"
              >
                <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#E8A838] block">
                  Chapter 03 // Campus Philosophy
                </span>
                <h2 className="font-fraunces text-4xl sm:text-6xl lg:text-7xl font-bold leading-tight">
                  Built exclusively for <br />
                  <span className="text-[#E8A838] italic font-normal">CHMSU Alijis.</span>
                </h2>
                <p className="font-jakarta text-white/80 text-base sm:text-lg leading-relaxed max-w-xl">
                  College is too short to stay confined within your first-year block section. Ally-jis provides a safe, verified sanctuary for cross-program collaboration and lasting campus friendships.
                </p>
              </motion.div>

              {/* Right Column: Grouped by Typography & Negative Space (No card boxes) */}
              <div className="lg:col-span-5 space-y-10">
                
                {[
                  {
                    num: '01 • Strict Campus Exclusivity',
                    title: 'Zero External Solicitors.',
                    desc: 'Every member is an actively enrolled CHMSU student. No random strangers, advertisers, or outside accounts are permitted into the student network.'
                  },
                  {
                    num: '02 • Departmental Synergy',
                    title: 'Break Down Campus Silos.',
                    desc: 'Pair tech developers from CIT with design talents from other courses. Form hackathon teams, study circles, and sports meetups effortlessly.'
                  },
                  {
                    num: '03 • Mutual Respect Standard',
                    title: 'Consent at Every Touchpoint.',
                    desc: 'Conversations only begin when both peers approve. Harassment and impersonation result in immediate student ID suspension.'
                  }
                ].map((item, i) => (
                  <motion.div 
                    key={item.num}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 * i, duration: 0.6 }}
                    className={`space-y-2 ${i !== 2 ? 'border-b border-white/15 pb-8' : ''}`}
                  >
                    <div className="font-mono text-xs uppercase tracking-widest text-[#E8A838]">
                      {item.num}
                    </div>
                    <h3 className="font-fraunces text-2xl font-bold text-white">
                      {item.title}
                    </h3>
                    <p className="font-jakarta text-white/70 text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </motion.div>
                ))}

              </div>

            </div>

            {/* Final Call to Action Strip */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mt-20 pt-12 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-6"
            >
              <div className="space-y-1 text-center sm:text-left">
                <div className="font-fraunces text-2xl font-bold text-white">Ready to join your campus circle?</div>
                <div className="font-jakarta text-sm text-white/70">Sign in with your university account or install the Android application.</div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/download"
                    className="inline-flex items-center gap-2 bg-[#E8A838] hover:bg-[#d4952e] text-[#13502D] px-6 py-3 rounded-full font-mono text-xs uppercase tracking-wider font-bold transition-all shadow-md"
                  >
                    <Download size={14} />
                    <span>Get APK v1.0</span>
                  </Link>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 bg-transparent hover:bg-white/10 text-white border border-white/40 px-6 py-3 rounded-full font-mono text-xs uppercase tracking-wider font-semibold transition-all"
                  >
                    <span>Open Web Portal</span>
                    <ArrowUpRight size={14} />
                  </Link>
                </motion.div>
              </div>
            </motion.div>

          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <Footer />

    </div>
  );
}
