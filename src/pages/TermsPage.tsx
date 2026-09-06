import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { Footer } from '@/components/Footer';

export default function TermsPage() {
  const prohibitedItems = [
    "Harass, threaten, or bully another user",
    "Impersonate another person",
    "Send inappropriate or offensive content",
    "Spam or repeatedly contact someone who does not wish to communicate",
    "Share another person's private information without permission",
    "Attempt to access another user's account",
    "Distribute malicious links or software",
    "Use the platform for unlawful activities",
  ];

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
                <Link to="/terms" className="text-[#1A6B3C] font-bold underline underline-offset-8 decoration-[#E8A838] decoration-2">Terms</Link>
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

        {/* ── EDITORIAL HERO (EXTREME SCALE CONTRAST) ── */}
        <section className="pt-16 sm:pt-24 pb-16 px-4 sm:px-8 max-w-7xl mx-auto">
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1A6B3C]/20 pb-4"
            >
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#1A6B3C]/70">
                Community Standards & Agreement • 2026 Edition
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
              Terms of <br />
              <span className="italic font-normal text-[#E8A838]">Connection.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="font-fraunces text-2xl sm:text-3xl text-gray-800 leading-snug italic font-normal max-w-3xl pt-4"
            >
              “Welcome to Ally-jis! By creating an account or using our platform, you agree to follow these Terms & Conditions.”
            </motion.p>
          </div>
        </section>

        {/* ── EDITORIAL CHAPTERS (BORDERLESS TYPOGRAPHIC LAYOUT) ── */}
        <div className="space-y-0">

          {/* Chapters 01 & 02: Grid-Breaking Asymmetric Row */}
          <section className="border-t border-[#1A6B3C]/15 py-16 sm:py-24 px-4 sm:px-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
              
              {/* Chapter 01 (5 cols) */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-5 space-y-6"
              >
                <span className="font-fraunces text-7xl sm:text-8xl font-bold text-[#1A6B3C]/20 leading-none block">
                  01
                </span>
                <div className="space-y-4">
                  <h2 className="font-fraunces text-3xl sm:text-4xl font-bold text-[#1A6B3C]">
                    Who Can Use Ally-jis?
                  </h2>
                  <div className="font-jakarta text-gray-800 text-base sm:text-lg leading-relaxed space-y-3">
                    <p>
                      Ally-jis is intended for students of Carlos Hilado Memorial State University – Alijis Campus.
                    </p>
                    <p className="text-gray-600">
                      When creating an account, you agree to provide accurate information and to use only your own identity.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Chapter 02: Be Respectful (7 cols - Editorial Rule List) */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="lg:col-span-7 space-y-6 lg:border-l lg:border-[#1A6B3C]/15 lg:pl-16"
              >
                <span className="font-fraunces text-7xl sm:text-8xl font-bold text-[#E8A838]/40 leading-none block">
                  02
                </span>
                <div className="space-y-4">
                  <h2 className="font-fraunces text-3xl sm:text-4xl font-bold text-[#1A6B3C]">
                    Be Respectful
                  </h2>
                  <p className="font-jakarta text-gray-800 text-base sm:text-lg leading-relaxed">
                    Ally-jis is a community for making connections. Please treat other users with respect.
                  </p>
                  <p className="font-mono text-xs uppercase tracking-wider text-[#B45309] font-bold pt-2">
                    You must not use Ally-jis to:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 pt-2">
                    {prohibitedItems.map((item, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.05 * index, duration: 0.4 }}
                        className="flex items-start gap-3 py-2 border-b border-[#1A6B3C]/10 font-jakarta text-sm text-gray-700"
                      >
                        <span className="font-mono text-xs text-[#E8A838] font-bold pt-0.5">[{index + 1}]</span>
                        <span className="leading-snug">{item}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>

            </div>
          </section>

          {/* Tonal Shift: Chapters 03 & 04 (Warm Sandstone Block #EDE7DB) */}
          <section className="bg-[#EDE7DB] py-20 sm:py-28 px-4 sm:px-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
              
              {/* Chapter 03: Your Account (6 cols) */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-6 space-y-6"
              >
                <span className="font-fraunces text-7xl sm:text-8xl font-bold text-[#1A6B3C]/20 leading-none block">
                  03
                </span>
                <div className="space-y-4">
                  <h2 className="font-fraunces text-3xl sm:text-4xl font-bold text-[#1A6B3C]">
                    Your Account
                  </h2>
                  <div className="font-jakarta text-gray-800 text-base sm:text-lg leading-relaxed space-y-3">
                    <p>
                      You are responsible for keeping your account information and password secure.
                    </p>
                    <p className="font-medium text-[#1A6B3C]">
                      Please do not share your password with anyone.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Chapter 04: Your Profile and Messages (6 cols) */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="lg:col-span-6 space-y-6"
              >
                <span className="font-fraunces text-7xl sm:text-8xl font-bold text-[#1A6B3C]/20 leading-none block">
                  04
                </span>
                <div className="space-y-4">
                  <h2 className="font-fraunces text-3xl sm:text-4xl font-bold text-[#1A6B3C]">
                    Your Profile and Messages
                  </h2>
                  <div className="font-jakarta text-gray-800 text-base sm:text-lg leading-relaxed space-y-3">
                    <p>
                      You are responsible for the information, photos, interests, and messages you post or send through Ally-jis.
                    </p>
                    <p className="text-gray-600">
                      Please make sure that the content you share does not violate another person's privacy, rights, or safety.
                    </p>
                  </div>
                </div>
              </motion.div>

            </div>
          </section>

          {/* Chapters 05 & 06: Asymmetric Match & Safety Flow */}
          <section className="py-20 sm:py-28 px-4 sm:px-8 border-b border-[#1A6B3C]/15">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
              
              {/* Chapter 05: Friend Matching (7 cols) */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-7 space-y-6"
              >
                <span className="font-fraunces text-7xl sm:text-8xl font-bold text-[#E8A838]/40 leading-none block">
                  05
                </span>
                <div className="space-y-4">
                  <h2 className="font-fraunces text-3xl sm:text-4xl font-bold text-[#1A6B3C]">
                    Friend Matching
                  </h2>
                  <div className="font-jakarta text-gray-800 text-base sm:text-lg leading-relaxed space-y-3 max-w-xl">
                    <p>
                      Ally-jis recommends potential friends based on information provided by users, such as shared interests and organizational affiliations.
                    </p>
                    <p className="text-gray-600">
                      A match is only a suggestion and does not guarantee friendship or compatibility.
                    </p>
                    <p className="font-bold text-[#1A6B3C] text-xl font-fraunces italic pt-1">
                      You decide who you want to connect with.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Chapter 06: Stay Safe (5 cols) */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="lg:col-span-5 space-y-6 lg:border-l lg:border-[#1A6B3C]/15 lg:pl-16"
              >
                <span className="font-fraunces text-7xl sm:text-8xl font-bold text-[#1A6B3C]/20 leading-none block">
                  06
                </span>
                <div className="space-y-4">
                  <h2 className="font-fraunces text-3xl sm:text-4xl font-bold text-[#1A6B3C]">
                    Stay Safe
                  </h2>
                  <div className="font-jakarta text-gray-800 text-sm sm:text-base leading-relaxed space-y-3">
                    <p>
                      Be careful when communicating with people you have not personally met.
                    </p>
                    <p>
                      Never share passwords, financial information, or other sensitive personal information with other users.
                    </p>
                    <p className="text-gray-600">
                      If a conversation makes you uncomfortable, stop communicating with the person and seek assistance when necessary.
                    </p>
                  </div>
                </div>
              </motion.div>

            </div>
          </section>

          {/* Chapters 07, 08, 09: Three Column Editorial Spread (No cards!) */}
          <section className="py-20 sm:py-28 px-4 sm:px-8 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16 items-start">
              
              {/* Chapter 07 */}
              <motion.div 
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="space-y-4"
              >
                <span className="font-fraunces text-6xl font-bold text-[#1A6B3C]/20 leading-none block">
                  07
                </span>
                <h3 className="font-fraunces text-2xl sm:text-3xl font-bold text-[#1A6B3C]">
                  Misuse of the Platform
                </h3>
                <p className="font-jakarta text-gray-700 text-sm sm:text-base leading-relaxed">
                  Accounts that violate these Terms & Conditions or misuse Ally-jis may be restricted or removed.
                </p>
              </motion.div>

              {/* Chapter 08 */}
              <motion.div 
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="space-y-4"
              >
                <span className="font-fraunces text-6xl font-bold text-[#1A6B3C]/20 leading-none block">
                  08
                </span>
                <h3 className="font-fraunces text-2xl sm:text-3xl font-bold text-[#1A6B3C]">
                  Availability
                </h3>
                <p className="font-jakarta text-gray-700 text-sm sm:text-base leading-relaxed">
                  Ally-jis may occasionally be unavailable due to maintenance, technical problems, internet connectivity, or other circumstances.
                </p>
              </motion.div>

              {/* Chapter 09 */}
              <motion.div 
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="space-y-4"
              >
                <span className="font-fraunces text-6xl font-bold text-[#1A6B3C]/20 leading-none block">
                  09
                </span>
                <h3 className="font-fraunces text-2xl sm:text-3xl font-bold text-[#1A6B3C]">
                  Changes to These Terms
                </h3>
                <p className="font-jakarta text-gray-700 text-sm sm:text-base leading-relaxed">
                  These Terms & Conditions may be updated as Ally-jis develops. Continued use of the platform after changes are made means that you acknowledge the updated terms.
                </p>
              </motion.div>

            </div>
          </section>

          {/* ── BORDERLESS HIGH CONTRAST BLOCK: AGREEMENT ── */}
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
                  Chapter 10 • Final Confirmation
                </span>
                <h2 className="font-fraunces text-4xl sm:text-6xl lg:text-7xl font-bold leading-tight">
                  Agreement.
                </h2>
                <p className="font-fraunces text-2xl sm:text-3xl text-white/90 leading-snug italic font-normal max-w-2xl">
                  “By creating an Ally-jis account, you confirm that you have read and understood these Terms & Conditions and agree to follow them.”
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
                    to="/login"
                    className="w-full inline-flex items-center justify-center gap-3 bg-[#E8A838] hover:bg-[#d4952e] text-[#13502D] px-8 py-4 rounded-full font-mono text-xs uppercase tracking-wider font-bold transition-all shadow-lg text-center"
                  >
                    I Agree & Wish to Sign In
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  <Link
                    to="/download"
                    className="w-full inline-flex items-center justify-center gap-3 bg-transparent hover:bg-white/10 text-white border-2 border-white/40 px-8 py-4 rounded-full font-mono text-xs uppercase tracking-wider font-semibold transition-all text-center"
                  >
                    Download Mobile APK <ArrowUpRight size={16} />
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
