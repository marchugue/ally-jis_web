import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Mail, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { Footer } from '@/components/Footer';

export default function SupportPage() {
  const faqs = [
    {
      q: 'Why does Android show "File might be harmful" when downloading the APK?',
      a: 'Android automatically displays a default warning prompt whenever you download any executable .apk file directly from a web browser instead of Google Play. This is standard Android security behavior. As long as you download directly from our official server (ally-jis.xyz/download), our APK is completely safe, signed, and malware-free.'
    },
    {
      q: 'How do I allow installation from unknown sources?',
      a: 'When you tap the downloaded file, your phone will ask for permission to install. Tap Settings on the prompt pop-up, toggle on "Allow from this source" for Chrome or Files, then return and tap Install.'
    },
    {
      q: 'Who can register an account on Ally-jis?',
      a: 'Ally-jis is designed exclusively for CHMSU Alijis Campus students. Registration requires selecting your actual department, course, and year level to ensure a safe student environment.'
    },
    {
      q: 'How do connection requests and chat work?',
      a: 'To protect student privacy, direct messaging is locked until you send a connection request to a fellow student and they accept it. Once accepted, real-time chat is unlocked automatically.'
    }
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
                Help Desk & Support Guide • 2026 Edition
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
              Support & <br />
              <span className="italic font-normal text-[#E8A838]">Assistance.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="font-fraunces text-2xl sm:text-3xl text-gray-800 leading-snug italic font-normal max-w-3xl pt-4"
            >
              “Find answers to direct APK installation, profile verification, security, and student support.”
            </motion.p>
          </div>
        </section>

        {/* ── BORDERLESS TONAL BLOCK: FAST APK HELP CTA ── */}
        <section className="bg-[#EDE7DB] py-16 sm:py-24 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#E8A838] font-bold block">
                Direct Android Distribution
              </span>
              <h2 className="font-fraunces text-3xl sm:text-5xl font-bold leading-tight">
                Looking for the Android APK & setup instructions?
              </h2>
              <p className="font-jakarta text-gray-700 text-base sm:text-lg max-w-xl leading-relaxed">
                Download the lightweight client directly with step-by-step walkthroughs on browser permissions and verified safety notes.
              </p>
            </div>

            <div className="lg:col-span-4 flex justify-start lg:justify-end">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link
                  to="/download"
                  className="inline-flex items-center gap-3 bg-[#1A6B3C] hover:bg-[#13502D] text-white px-8 py-4 rounded-full font-mono text-xs uppercase tracking-wider font-bold transition-all shadow-md"
                >
                  <Download size={16} />
                  <span>Visit Download Page</span>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── EDITORIAL FAQ SPREAD ── */}
        <section className="py-20 sm:py-32 px-4 sm:px-8 max-w-7xl mx-auto space-y-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#1A6B3C]/15 pb-8"
          >
            <div>
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#1A6B3C]/60 block mb-2">
                Knowledge Base
              </span>
              <h2 className="font-fraunces text-4xl sm:text-6xl font-bold text-[#1A6B3C]">
                Frequently Asked Questions.
              </h2>
            </div>
          </motion.div>

          {/* Staggered Editorial FAQ Rows */}
          <div className="space-y-12">
            {faqs.map((faq, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 pb-10 border-b border-[#1A6B3C]/15 items-start"
              >
                <div className="lg:col-span-1 font-fraunces text-4xl sm:text-5xl font-bold text-[#1A6B3C]/25 leading-none">
                  0{i + 1}
                </div>
                <div className="lg:col-span-5">
                  <h3 className="font-fraunces text-2xl sm:text-3xl font-bold text-[#1A6B3C] leading-snug">
                    {faq.q}
                  </h3>
                </div>
                <div className="lg:col-span-6">
                  <p className="font-jakarta text-gray-700 text-base leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              </motion.div>
            ))}
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
                Student Support Desk
              </span>
              <h2 className="font-fraunces text-4xl sm:text-6xl lg:text-7xl font-bold leading-tight">
                Need personal <br />
                <span className="italic font-normal text-[#E8A838]">assistance?</span>
              </h2>
              <p className="font-jakarta text-white/80 text-base sm:text-lg max-w-xl leading-relaxed">
                Have questions about your campus account, reporting an issue, or general feedback? Our Alijis developer and moderation team is here to assist.
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
                <Mail size={16} /> Email support@ally-jis.xyz
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

      <Footer />
    </div>
  );
}
