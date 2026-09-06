import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, Mail } from 'lucide-react';
import { Footer } from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F7F4EF] text-[#1A6B3C] selection:bg-[#1A6B3C] selection:text-white flex flex-col justify-between overflow-x-hidden">
      <div>
        {/* ── TOP NAVIGATION ── */}
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
                <Link to="/about" className="hover:text-[#1A6B3C] transition-colors">About</Link>
                <Link to="/terms" className="hover:text-[#1A6B3C] transition-colors">Terms</Link>
                <Link to="/privacy" className="text-[#1A6B3C] font-bold underline underline-offset-8 decoration-[#E8A838] decoration-2">Privacy</Link>
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

        {/* ── EDITORIAL HERO ── */}
        <section className="pt-16 sm:pt-24 pb-16 px-4 sm:px-8 max-w-7xl mx-auto">
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1A6B3C]/20 pb-4"
            >
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#1A6B3C]/70">
                Data Protection & Privacy Policy • 2026 Edition
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#E8A838] font-bold">
                Carlos Hilado Memorial State University – Alijis Campus
              </span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-fraunces text-5xl sm:text-7xl lg:text-9xl font-bold text-[#1A6B3C] tracking-tight leading-[0.92]"
            >
              Privacy & <br />
              <span className="italic font-normal text-[#E8A838]">Integrity.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="font-fraunces text-2xl sm:text-3xl text-gray-800 leading-snug italic font-normal max-w-3xl pt-4"
            >
              “We respect your personal privacy and are committed to safeguarding the data of our campus student community.”
            </motion.p>
          </div>
        </section>

        {/* ── EDITORIAL CHAPTERS ── */}
        <div className="space-y-0">

          {/* Commitment & What We Collect */}
          <section className="border-t border-[#1A6B3C]/15 py-16 sm:py-24 px-4 sm:px-8">
            <div className="max-w-7xl mx-auto space-y-16">
              
              {/* Campus Commitment */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start"
              >
                <div className="lg:col-span-4">
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#E8A838] font-bold block mb-2">
                    Core Guarantee
                  </span>
                  <h2 className="font-fraunces text-3xl sm:text-4xl font-bold text-[#1A6B3C]">
                    Campus Privacy Commitment
                  </h2>
                </div>
                <div className="lg:col-span-8 font-jakarta text-gray-800 text-base sm:text-lg leading-relaxed space-y-4">
                  <p className="font-semibold text-[#1A6B3C] text-xl">
                    Ally-jis is built exclusively for students of Carlos Hilado Memorial State University – Alijis Campus.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    We believe connecting with peers should never compromise your privacy. We collect only what is necessary to help you discover friends and interact safely within campus life.
                  </p>
                </div>
              </motion.div>

              {/* 01: Information We Collect */}
              <div className="pt-12 border-t border-[#1A6B3C]/15 space-y-10">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="flex items-center gap-4"
                >
                  <span className="font-fraunces text-6xl sm:text-7xl font-bold text-[#1A6B3C]/20 leading-none">
                    01
                  </span>
                  <div>
                    <h3 className="font-fraunces text-3xl sm:text-4xl font-bold text-[#1A6B3C]">
                      Information We Collect
                    </h3>
                    <p className="font-jakarta text-gray-600 text-sm mt-1">
                      To help you create a profile and connect with matching peers across campus:
                    </p>
                  </div>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[
                    { tag: '[A]', title: 'Profile Details', desc: 'Your name, username, course, year level, profile photo, and bio.' },
                    { tag: '[B]', title: 'Interests & Orgs', desc: 'Hobbies, passions, and active campus student organizations.' },
                    { tag: '[C]', title: 'Connections & Chat', desc: 'Friend requests, matches, and direct messages exchanged with peers.' },
                    { tag: '[D]', title: 'Account Security', desc: 'Email address and encrypted authentication credentials for sign in.' },
                  ].map((col, i) => (
                    <motion.div 
                      key={col.tag}
                      initial={{ opacity: 0, y: 25 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 * i, duration: 0.5 }}
                      className="space-y-2 border-t-2 border-[#1A6B3C] pt-4"
                    >
                      <span className="font-mono text-xs text-[#E8A838] font-bold uppercase tracking-wider block">{col.tag}</span>
                      <h4 className="font-fraunces font-bold text-xl text-[#1A6B3C]">{col.title}</h4>
                      <p className="font-jakarta text-xs sm:text-sm text-gray-700 leading-relaxed">
                        {col.desc}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

            </div>
          </section>

          {/* Tonal Shift: 02 & 03 (#EDE7DB) */}
          <section className="bg-[#EDE7DB] py-20 sm:py-28 px-4 sm:px-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
              
              {/* 02: How We Use Your Information (6 cols) */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-6 space-y-6"
              >
                <span className="font-fraunces text-7xl sm:text-8xl font-bold text-[#1A6B3C]/20 leading-none block">
                  02
                </span>
                <div className="space-y-4">
                  <h3 className="font-fraunces text-3xl sm:text-4xl font-bold text-[#1A6B3C]">
                    How We Use Your Information
                  </h3>
                  <p className="font-jakarta text-gray-800 text-sm sm:text-base leading-relaxed">
                    We use your information strictly for student life and peer discovery:
                  </p>
                  <ul className="space-y-3 font-jakarta text-sm sm:text-base text-gray-800 pt-2">
                    <li className="flex items-start gap-3">
                      <span className="font-mono text-xs text-[#E8A838] font-bold pt-1">•</span>
                      <span><strong>Matching:</strong> Suggesting potential friends based on shared interests, courses, and student orgs.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="font-mono text-xs text-[#E8A838] font-bold pt-1">•</span>
                      <span><strong>Real-time Chat:</strong> Delivering direct messages and notifications when students connect.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="font-mono text-xs text-[#E8A838] font-bold pt-1">•</span>
                      <span><strong>Community Safety:</strong> Maintaining a respectful campus environment and moderating abusive behavior.</span>
                    </li>
                  </ul>
                </div>
              </motion.div>

              {/* 03: We Never Sell Your Data (6 cols) */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="lg:col-span-6 space-y-6"
              >
                <span className="font-fraunces text-7xl sm:text-8xl font-bold text-[#E8A838]/40 leading-none block">
                  03
                </span>
                <div className="space-y-4">
                  <h3 className="font-fraunces text-3xl sm:text-4xl font-bold text-[#1A6B3C]">
                    We Never Sell Your Data
                  </h3>
                  <div className="font-jakarta text-gray-800 text-base sm:text-lg leading-relaxed space-y-4">
                    <p className="font-semibold text-xl text-[#1A6B3C]">
                      We never sell your personal information to third parties, advertising networks, or data brokers.
                    </p>
                    <p className="text-gray-700">
                      Your profile and activities are strictly visible to registered students within the Carlos Hilado Memorial State University – Alijis Campus platform.
                    </p>
                  </div>
                </div>
              </motion.div>

            </div>
          </section>

          {/* Chapters 04 & 05: Security and Control */}
          <section className="py-20 sm:py-28 px-4 sm:px-8 border-b border-[#1A6B3C]/15">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
              
              {/* 04: Security & Storage (6 cols) */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-6 space-y-6"
              >
                <span className="font-fraunces text-7xl sm:text-8xl font-bold text-[#1A6B3C]/20 leading-none block">
                  04
                </span>
                <div className="space-y-4">
                  <h3 className="font-fraunces text-3xl sm:text-4xl font-bold text-[#1A6B3C]">
                    Security & Storage
                  </h3>
                  <div className="font-jakarta text-gray-800 text-base sm:text-lg leading-relaxed space-y-3">
                    <p>
                      All network communication is protected with modern HTTPS encryption. Passwords and sensitive session tokens are securely hashed and stored.
                    </p>
                    <p className="text-gray-700">
                      We implement technical and organizational measures to safeguard your information against unauthorized access, loss, or alteration.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* 05: Your Rights and Control (6 cols) */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="lg:col-span-6 space-y-6 lg:border-l lg:border-[#1A6B3C]/15 lg:pl-16"
              >
                <span className="font-fraunces text-7xl sm:text-8xl font-bold text-[#1A6B3C]/20 leading-none block">
                  05
                </span>
                <div className="space-y-4">
                  <h3 className="font-fraunces text-3xl sm:text-4xl font-bold text-[#1A6B3C]">
                    Your Rights and Control
                  </h3>
                  <div className="font-jakarta text-gray-800 text-sm sm:text-base leading-relaxed space-y-3">
                    <p>As an Ally-jis user, you maintain complete ownership and control over your profile:</p>
                    <ul className="space-y-2 text-gray-700">
                      <li>• Edit or update your profile details and hobbies anytime in Settings.</li>
                      <li>• Unmatch or block users who make you uncomfortable.</li>
                      <li>• Request account deletion or data removal by contacting our support team.</li>
                    </ul>
                  </div>
                </div>
              </motion.div>

            </div>
          </section>

          {/* ── BORDERLESS HIGH CONTRAST BLOCK: CONTACT ── */}
          <section className="bg-[#1A6B3C] text-[#F7F4EF] py-20 sm:py-28 px-4 sm:px-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <motion.div 
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="lg:col-span-8 space-y-6"
              >
                <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#E8A838]">
                  Inquiries & Data Desk
                </span>
                <h2 className="font-fraunces text-4xl sm:text-6xl lg:text-7xl font-bold leading-tight">
                  Questions about <br />
                  <span className="italic font-normal text-[#E8A838]">your privacy?</span>
                </h2>
                <p className="font-jakarta text-white/80 text-base sm:text-lg max-w-xl leading-relaxed">
                  If you have questions, feedback, or would like to request account changes, our campus support desk is ready to help.
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-4"
              >
                <motion.a
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  href="mailto:support@ally-jis.xyz"
                  className="w-full inline-flex items-center justify-center gap-3 bg-[#E8A838] hover:bg-[#d4952e] text-[#13502D] px-8 py-4 rounded-full font-mono text-xs uppercase tracking-wider font-bold transition-all shadow-lg text-center"
                >
                  <Mail size={16} /> support@ally-jis.xyz
                </motion.a>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  <Link
                    to="/"
                    className="w-full inline-flex items-center justify-center gap-3 bg-transparent hover:bg-white/10 text-white border-2 border-white/40 px-8 py-4 rounded-full font-mono text-xs uppercase tracking-wider font-semibold transition-all text-center"
                  >
                    Return to Homepage <ArrowUpRight size={16} />
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </section>

        </div>
      </div>

      <Footer />
    </div>
  );
}
