import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, Download, Sparkles } from 'lucide-react';
import { Footer } from '@/components/Footer';

export default function AboutPage() {
  const fadeInUp = {
    hidden: { opacity: 0, y: 25 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-[#1A6B3C] selection:bg-[#1A6B3C] selection:text-white flex flex-col justify-between overflow-x-hidden">
      <div>
        {/* ── TOP NAVIGATION (GLASSMORPHISM) ── */}
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="sticky top-0 z-50 backdrop-blur-xl bg-[#F7F4EF]/85 border-b border-[#1A6B3C]/10 transition-all"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 sm:h-[84px] flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <motion.div 
                whileHover={{ scale: 1.08, rotate: -4 }}
                whileTap={{ scale: 0.94 }}
                className="w-11 h-11 rounded-full bg-[#1A6B3C] flex items-center justify-center text-white font-fraunces font-bold text-xl shadow-sm transition-transform"
              >
                A
              </motion.div>
              <div className="flex flex-col">
                <span className="font-fraunces font-bold text-2xl tracking-tight text-[#1A6B3C] leading-none">
                  Ally<span className="text-[#E8A838]">-jis</span>
                </span>
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#1A6B3C]/60 pt-0.5">
                  CHMSU Alijis
                </span>
              </div>
            </Link>

            {/* Nav & Back */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-4 font-mono text-xs uppercase tracking-wider text-[#1A6B3C]/75 mr-4">
                <Link to="/about" className="text-[#1A6B3C] font-bold underline underline-offset-8 decoration-[#E8A838] decoration-2">About</Link>
                <Link to="/terms" className="hover:text-[#1A6B3C] transition-colors">Terms</Link>
                <Link to="/privacy" className="hover:text-[#1A6B3C] transition-colors">Privacy</Link>
                <Link to="/download" className="hover:text-[#1A6B3C] transition-colors">App</Link>
              </div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link 
                  to="/" 
                  className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#1A6B3C] bg-white px-4 py-2.5 rounded-full hover:bg-[#1A6B3C] hover:text-white transition-all shadow-xs"
                >
                  <ArrowLeft size={14} /> Back
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.header>

        {/* ── EDITORIAL HERO (MAGAZINE STYLE) ── */}
        <section className="pt-16 sm:pt-24 pb-16 px-4 sm:px-8 max-w-7xl mx-auto">
          {/* Issue Kicker & Scale Contrast Title */}
          <div className="flex flex-col space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1A6B3C]/20 pb-4"
            >
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#1A6B3C]/70">
                Alijis Campus • Student Life Edition • 2026
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#E8A838] font-bold">
                Exclusively Carlos Hilado Memorial State University
              </span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-fraunces text-5xl sm:text-7xl lg:text-9xl font-bold text-[#1A6B3C] tracking-tight leading-[0.92]"
            >
              Beyond the <br />
              <span className="italic font-normal text-[#E8A838]">Classroom.</span>
            </motion.h1>
          </div>

          {/* Asymmetric Grid-Breaking Narrative Block */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 pt-12 sm:pt-16 items-start">
            
            {/* Left Accent Quote */}
            <motion.div 
              initial={{ opacity: 0, x: -25 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-5 space-y-6"
            >
              <div className="w-16 h-1 bg-[#1A6B3C]" />
              <p className="font-fraunces text-2xl sm:text-3xl text-[#1A6B3C] leading-snug italic font-normal">
                “Connecting with peers should be simple, accessible, and rooted in shared student life.”
              </p>
              <div className="pt-2 flex items-center gap-3 font-mono text-xs uppercase tracking-wider text-[#1A6B3C]/60">
                <span>CHMSU Alijis Platform</span>
                <span>•</span>
                <span>Established 2026</span>
              </div>
            </motion.div>

            {/* Right: Exact About Copy with Editorial Breathing Space */}
            <motion.div 
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="lg:col-span-7 space-y-6 font-jakarta text-gray-800 text-base sm:text-lg leading-relaxed"
            >
              <p className="font-semibold text-xl sm:text-2xl text-[#1A6B3C] leading-snug">
                Ally-jis is a friend-finding platform designed exclusively for students of Carlos Hilado Memorial State University – Alijis Campus.
              </p>
              <p className="text-gray-700 leading-relaxed text-base sm:text-lg">
                We believe connecting with peers should be simple and accessible. By matching students based on shared interests, course details, personal preferences, and campus organizations, Ally-jis helps you expand your network and build meaningful friendships beyond your immediate classroom setting.
              </p>

              <div className="pt-6 flex flex-wrap items-center gap-4">
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  <Link
                    to="/download"
                    className="inline-flex items-center gap-2 bg-[#1A6B3C] hover:bg-[#13502D] text-white px-7 py-3.5 rounded-full font-mono text-xs uppercase tracking-wider font-semibold transition-all shadow-md"
                  >
                    <Download size={16} /> Download Android APK <ArrowUpRight size={14} />
                  </Link>
                </motion.div>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-[#1A6B3C] hover:text-[#E8A838] font-mono text-xs uppercase tracking-wider font-bold transition-colors underline underline-offset-4"
                >
                  Open Web Portal
                </Link>
              </div>
            </motion.div>

          </div>
        </section>

        {/* ── BORDERLESS TONAL BLOCK: KEY FEATURES ── */}
        <section className="bg-[#EDE7DB] text-[#1A6B3C] py-20 sm:py-32 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto space-y-16">
            
            {/* Section Header */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6 }}
              className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-[#1A6B3C]/15 pb-8"
            >
              <div>
                <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#1A6B3C]/60 block mb-2">
                  Feature Architecture
                </span>
                <h2 className="font-fraunces text-4xl sm:text-6xl font-bold tracking-tight">
                  Key Features.
                </h2>
              </div>
              <p className="font-mono text-xs uppercase tracking-wider text-[#1A6B3C]/70 max-w-xs">
                Essential capabilities engineered for student networking at Alijis.
              </p>
            </motion.div>

            {/* Grid-Breaking Staggered Editorial Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16 items-start">
              
              {/* Feature 01 */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="space-y-6"
              >
                <div className="font-fraunces text-6xl sm:text-7xl font-bold text-[#E8A838] leading-none">
                  01
                </div>
                <div className="space-y-3">
                  <h3 className="font-fraunces text-2xl sm:text-3xl font-bold text-[#1A6B3C] leading-tight">
                    Create your Profile
                  </h3>
                  <p className="font-jakarta text-gray-700 text-sm sm:text-base leading-relaxed">
                    Highlight your personality, hobbies, course, year level, and active student organizations.
                  </p>
                </div>
                <div className="w-12 h-0.5 bg-[#1A6B3C]/30" />
              </motion.div>

              {/* Feature 02 (Offset Vertical Position for Grid-Breaking Feel) */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-6 md:pt-10"
              >
                <div className="font-fraunces text-6xl sm:text-7xl font-bold text-[#1A6B3C]/30 leading-none">
                  02
                </div>
                <div className="space-y-3">
                  <h3 className="font-fraunces text-2xl sm:text-3xl font-bold text-[#1A6B3C] leading-tight">
                    Find potential Friends
                  </h3>
                  <p className="font-jakarta text-gray-700 text-sm sm:text-base leading-relaxed">
                    Effortlessly discover fellow students who share your passions and background.
                  </p>
                </div>
                <div className="w-12 h-0.5 bg-[#1A6B3C]/30" />
              </motion.div>

              {/* Feature 03 (Further Offset) */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="space-y-6 md:pt-20"
              >
                <div className="font-fraunces text-6xl sm:text-7xl font-bold text-[#E8A838] leading-none">
                  03
                </div>
                <div className="space-y-3">
                  <h3 className="font-fraunces text-2xl sm:text-3xl font-bold text-[#1A6B3C] leading-tight">
                    Connect and Chat
                  </h3>
                  <p className="font-jakarta text-gray-700 text-sm sm:text-base leading-relaxed">
                    Send friend requests and start conversations through real-time chat.
                  </p>
                </div>
                <div className="w-12 h-0.5 bg-[#1A6B3C]/30" />
              </motion.div>

            </div>
          </div>
        </section>

        {/* ── BORDERLESS HIGH CONTRAST BLOCK: CALL TO ACTION ── */}
        <section className="bg-[#1A6B3C] text-[#F7F4EF] py-20 sm:py-28 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-8 space-y-6"
            >
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#E8A838]">
                Carlos Hilado Memorial State University • Alijis Campus
              </span>
              <h2 className="font-fraunces text-4xl sm:text-6xl lg:text-7xl font-bold leading-tight">
                Ready to find your <br />
                <span className="italic font-normal text-[#E8A838]">circle on campus?</span>
              </h2>
              <p className="font-jakarta text-white/80 text-base sm:text-lg max-w-xl leading-relaxed">
                Connect with peers across departments, exchange ideas, and build lasting friendships starting today.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-4"
            >
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link
                  to="/download"
                  className="w-full inline-flex items-center justify-center gap-3 bg-[#E8A838] hover:bg-[#d4952e] text-[#13502D] px-8 py-4 rounded-full font-mono text-xs uppercase tracking-wider font-bold transition-all shadow-lg text-center"
                >
                  <Download size={18} /> Download Android APK
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center gap-3 bg-transparent hover:bg-white/10 text-white border-2 border-white/40 px-8 py-4 rounded-full font-mono text-xs uppercase tracking-wider font-semibold transition-all text-center"
                >
                  Open Student Portal <ArrowUpRight size={16} />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
