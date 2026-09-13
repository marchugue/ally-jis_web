import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, CheckCircle2, Smartphone, FileCode2, ArrowUpRight, Loader2, RotateCcw, AlertCircle } from 'lucide-react';
import { Footer } from '@/components/Footer';

export default function DownloadPage() {
  const apkFileName = 'ally-jis-app-v1.0.apk';
  const apkPath = 'https://www.ally-jis.xyz/download/ally-jis-app-v1.0.apk';

  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Directly initiates native browser streaming download (saves directly via OS Download Manager)
  const triggerNativeDownload = () => {
    const link = document.createElement('a');
    link.href = apkPath;
    link.setAttribute('download', apkFileName);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownload = () => {
    setDownloading(true);
    setProgress(0);
    setIsCompleted(false);

    // 1. Immediately invoke the browser's native file download stream
    triggerNativeDownload();

    // 2. Smoothly animate handoff progress to 100% without memory bottlenecks or blob freezes
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 25;
      if (currentProgress >= 100) {
        clearInterval(interval);
        setProgress(100);
        setIsCompleted(true);
        setDownloading(false);
      } else {
        setProgress(currentProgress);
      }
    }, 150);
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF] dark:bg-[#090D16] text-[#1A6B3C] dark:text-gray-100 selection:bg-[#1A6B3C] dark:selection:bg-emerald-500 selection:text-white flex flex-col justify-between overflow-x-hidden">
      <div>
        {/* ── TOP NAVIGATION ── */}
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="sticky top-0 z-50 backdrop-blur-xl bg-[#F7F4EF]/85 dark:bg-[#090D16]/85 border-b border-[#1A6B3C]/10 dark:border-white/10 transition-all"
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
                <span className="font-fraunces font-bold text-2xl tracking-tight text-[#1A6B3C] dark:text-white leading-none">
                  Ally<span className="text-[#E8A838]">-jis</span>
                </span>
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#1A6B3C]/60 dark:text-gray-300 pt-0.5">
                  CHMSU Alijis
                </span>
              </div>
            </Link>

            {/* Nav & Back */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-4 font-mono text-xs uppercase tracking-wider text-[#1A6B3C]/75 dark:text-gray-300 mr-4">
                <Link to="/about" className="hover:text-[#1A6B3C] dark:hover:text-white transition-colors">About</Link>
                <Link to="/terms" className="hover:text-[#1A6B3C] dark:hover:text-white transition-colors">Terms</Link>
                <Link to="/privacy" className="hover:text-[#1A6B3C] dark:hover:text-white transition-colors">Privacy</Link>
                <Link to="/download" className="text-[#1A6B3C] dark:text-white font-bold underline underline-offset-8 decoration-[#E8A838] decoration-2">App</Link>
              </div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link 
                  to="/" 
                  className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#1A6B3C] dark:text-white bg-white dark:bg-white/10 hover:bg-[#EDE7DB] dark:hover:bg-white/20 px-4 py-2.5 rounded-full transition-all shadow-xs border border-transparent dark:border-white/10"
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
              className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1A6B3C]/20 dark:border-white/10 pb-4"
            >
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#1A6B3C]/70 dark:text-emerald-400/80">
                Official Android Client • Official Release v1.0
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#E8A838] font-bold">
                Direct Web Distribution • ally-jis.xyz
              </span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-fraunces text-5xl sm:text-7xl lg:text-9xl font-bold text-[#1A6B3C] dark:text-white tracking-tight leading-[0.92]"
            >
              Mobile <br />
              <span className="italic font-normal text-[#E8A838]">Companion.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="font-fraunces text-2xl sm:text-3xl text-gray-800 dark:text-gray-200 leading-snug italic font-normal max-w-3xl pt-2"
            >
              “Get the official mobile app for CHMSU Alijis students. Enjoy instant notifications, real-time chat, and fast match browsing directly on your phone.”
            </motion.p>
          </div>

          {/* Asymmetric 2-Column Action & Verification Spread (No boxed cards!) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 pt-16 items-start">
            
            {/* Left Column: Download Action (7 cols) */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-7 space-y-8"
            >
              <div className="space-y-4">
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#E8A838] font-bold block">
                  Installation Binary
                </span>
                <h3 className="font-fraunces text-3xl sm:text-4xl font-bold text-[#1A6B3C] dark:text-white">
                  Download Android APK
                </h3>
                <p className="font-jakarta text-gray-700 dark:text-gray-300 text-base leading-relaxed max-w-lg">
                  Direct standalone package verified by the Ally-jis developer team for all CHMSU Alijis students and faculty.
                </p>
              </div>

              {/* Download Trigger / Progress Bar */}
              <div className="space-y-4 max-w-lg">
                {!downloading && !isCompleted && (
                  <div className="space-y-3">
                    <motion.a
                      href={apkPath}
                      download={apkFileName}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={handleDownload}
                      className="inline-flex items-center justify-center gap-3 bg-[#1A6B3C] dark:bg-emerald-600 hover:bg-[#13502D] dark:hover:bg-emerald-700 text-white font-mono text-xs uppercase tracking-wider font-bold px-9 py-4 rounded-full shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
                    >
                      <Download size={18} /> Download {apkFileName}
                    </motion.a>
                  </div>
                )}

                {downloading && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-3 p-5 bg-[#EDE7DB] dark:bg-[#0D131F] rounded-2xl border border-[#1A6B3C]/10 dark:border-white/10"
                  >
                    <div className="flex items-center justify-between font-mono text-xs uppercase tracking-wider text-[#1A6B3C] dark:text-emerald-400">
                      <span className="flex items-center gap-2 font-bold">
                        <Loader2 size={16} className="animate-spin text-[#E8A838]" /> Starting Download...
                      </span>
                      <span className="font-bold">{progress}%</span>
                    </div>

                    <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-[#1A6B3C] dark:bg-emerald-500 h-full transition-all duration-150 ease-out rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 font-mono">
                      <span>Direct streaming ~131 MB APK</span>
                      <span className="text-[#B45309] dark:text-amber-400 font-medium">Handing off to browser...</span>
                    </div>
                  </motion.div>
                )}

                {isCompleted && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/50 rounded-2xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 size={24} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
                        <div>
                          <p className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">Download Initiated!</p>
                          <p className="text-xs text-emerald-700 dark:text-emerald-400">Check your notification drawer or Downloads folder</p>
                        </div>
                      </div>
                      <a
                        href={apkPath}
                        download={apkFileName}
                        onClick={handleDownload}
                        className="text-xs font-mono uppercase tracking-wider font-bold text-[#1A6B3C] dark:text-emerald-400 hover:underline flex items-center gap-1 shrink-0 ml-2"
                      >
                        <RotateCcw size={13} /> Re-download
                      </a>
                    </div>

                    <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 font-jakarta flex flex-wrap items-center justify-between gap-2">
                      <span>Didn't start automatically?</span>
                      <a
                        href={apkPath}
                        download={apkFileName}
                        className="font-bold underline hover:text-[#1A6B3C] dark:hover:text-emerald-200"
                      >
                        Click here to download directly
                      </a>
                    </div>
                  </motion.div>
                )}

                {/* Android 100% Notice / Security Context */}
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                  <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <strong className="font-semibold block">Android Download Note (100% Status):</strong>
                    <p className="leading-relaxed text-[11.5px]">
                      When the download reaches 100%, Android and Chrome run a Google Play Protect scan on the ~131 MB APK before committing the file. If Chrome prompts <em>"File might be harmful"</em>, tap <strong>"Download anyway"</strong>. Then tap the finished notification or open <strong>Files &gt; Downloads</strong> to tap and install.
                    </p>
                  </div>
                </div>

                {/* Pill specifications */}
                <div className="flex flex-wrap items-center gap-3 pt-2 font-mono text-xs text-[#1A6B3C]/70 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Smartphone size={14} className="text-[#1A6B3C] dark:text-emerald-400" /> Android 8.0+
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <FileCode2 size={14} className="text-[#E8A838]" /> ~131 MB
                  </span>
                  <span>•</span>
                  <span className="text-emerald-800 dark:text-emerald-400 font-bold">Verified Safe</span>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Security Notice & Technical Ledger (5 cols) */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="lg:col-span-5 space-y-8 lg:border-l lg:border-[#1A6B3C]/15 dark:lg:border-white/10 lg:pl-16"
            >
              <div className="space-y-4">
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#B45309] dark:text-amber-400 font-bold block">
                  Security Context
                </span>
                <h4 className="font-fraunces text-2xl font-bold text-[#1A6B3C] dark:text-white">
                  Why Android shows "File might be harmful"
                </h4>
                <p className="font-jakarta text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  Because Ally-jis is distributed directly through our official campus server (<code className="dark:bg-white/10 dark:text-emerald-300 px-1 py-0.5 rounded">ally-jis.xyz</code>) and Cloudflare R2 CDN instead of Google Play, Android displays a standard warning notice whenever downloading any <code className="dark:bg-white/10 dark:text-emerald-300 px-1 py-0.5 rounded">.apk</code> file in Chrome or web browsers.
                </p>
                <p className="font-jakarta text-xs text-gray-600 dark:text-gray-400 leading-relaxed italic">
                  <strong>Rest assured:</strong> Our application binary is signed, verified, completely safe, and built strictly for the CHMSU Alijis student community.
                </p>
              </div>

              {/* Editorial Spec Ledger */}
              <div className="border-t border-[#1A6B3C]/15 dark:border-white/10 pt-6 space-y-3 font-mono text-xs">
                <div className="flex justify-between py-1 border-b border-[#1A6B3C]/10 dark:border-white/10">
                  <span className="text-gray-500 dark:text-gray-400 uppercase">Package ID</span>
                  <span className="font-bold text-[#1A6B3C] dark:text-emerald-400">xyz.allyjis.app</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1A6B3C]/10 dark:border-white/10">
                  <span className="text-gray-500 dark:text-gray-400 uppercase">Version</span>
                  <span className="font-bold text-gray-900 dark:text-white">v1.0.0 (Official Release)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1A6B3C]/10 dark:border-white/10">
                  <span className="text-gray-500 dark:text-gray-400 uppercase">CDN Delivery</span>
                  <span className="font-bold text-[#1A6B3C] dark:text-emerald-400">Cloudflare R2 (Global)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1A6B3C]/10 dark:border-white/10">
                  <span className="text-gray-500 dark:text-gray-400 uppercase">Audience</span>
                  <span className="font-bold text-gray-900 dark:text-white">CHMSU Alijis Students</span>
                </div>
              </div>
            </motion.div>

          </div>
        </section>

        {/* ── BORDERLESS TONAL SECTION: 3-STEP INSTALLATION GUIDE ── */}
        <section className="bg-[#EDE7DB] dark:bg-[#0D131F] py-20 sm:py-28 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto space-y-16">
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#1A6B3C]/15 dark:border-white/10 pb-8"
            >
              <div className="space-y-2">
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#E8A838] font-bold">
                  Setup Instructions
                </span>
                <h2 className="font-fraunces text-4xl sm:text-6xl font-bold text-[#1A6B3C] dark:text-white tracking-tight">
                  Easy Installation Steps
                </h2>
              </div>
              <p className="font-jakarta text-gray-700 dark:text-gray-300 text-sm sm:text-base max-w-md leading-relaxed">
                Three effortless steps to install and begin connecting on your Android smartphone.
              </p>
            </motion.div>

            {/* Asymmetric Staggered Steps (No boxed cards!) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
              
              {/* Step 01 */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="lg:col-span-4 space-y-6"
              >
                <span className="font-fraunces text-7xl sm:text-8xl font-bold text-[#1A6B3C]/20 dark:text-white/20 leading-none block">
                  01
                </span>
                <div className="space-y-3">
                  <h3 className="font-fraunces text-2xl sm:text-3xl font-bold text-[#1A6B3C] dark:text-white">
                    Tap Download APK
                  </h3>
                  <p className="font-jakarta text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
                    Click the green download button above to save <code className="dark:bg-white/10 dark:text-emerald-300 px-1 py-0.5 rounded">{apkFileName}</code> to your device. If prompted with "File might be harmful", tap <strong>Download anyway</strong>.
                  </p>
                </div>
                <div className="w-12 h-0.5 bg-[#1A6B3C]/30 dark:bg-white/20" />
              </motion.div>

              {/* Step 02 */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="lg:col-span-4 space-y-6 lg:pt-12"
              >
                <span className="font-fraunces text-7xl sm:text-8xl font-bold text-[#E8A838]/40 leading-none block">
                  02
                </span>
                <div className="space-y-3">
                  <h3 className="font-fraunces text-2xl sm:text-3xl font-bold text-[#1A6B3C] dark:text-white">
                    Allow Browser Install
                  </h3>
                  <p className="font-jakarta text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
                    Open your downloaded file or tap the notification. If Android asks for permission, tap <strong>Settings</strong> and toggle on <strong>"Allow from this source"</strong> for Chrome/Downloads.
                  </p>
                </div>
                <div className="w-12 h-0.5 bg-[#E8A838]" />
              </motion.div>

              {/* Step 03 */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="lg:col-span-4 space-y-6 lg:pt-24"
              >
                <span className="font-fraunces text-7xl sm:text-8xl font-bold text-[#1A6B3C]/20 dark:text-white/20 leading-none block">
                  03
                </span>
                <div className="space-y-3">
                  <h3 className="font-fraunces text-2xl sm:text-3xl font-bold text-[#1A6B3C] dark:text-white">
                    Complete & Sign In
                  </h3>
                  <p className="font-jakarta text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
                    Tap <strong>Install</strong> to complete setup. Open Ally-jis, log in with your account or create a new student profile, and enjoy!
                  </p>
                </div>
                <div className="w-12 h-0.5 bg-[#1A6B3C]/30 dark:bg-white/20" />
              </motion.div>

            </div>
          </div>
        </section>

        {/* ── BORDERLESS HIGH CONTRAST BLOCK ── */}
        <section className="bg-[#1A6B3C] dark:bg-[#111827] text-[#F7F4EF] dark:text-white py-20 sm:py-28 px-4 sm:px-8 border-y border-[#1A6B3C] dark:border-white/10">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-8 space-y-6"
            >
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#E8A838]">
                CHMSU Alijis • Peer Network
              </span>
              <h2 className="font-fraunces text-4xl sm:text-6xl lg:text-7xl font-bold leading-tight">
                Installed the app? <br />
                <span className="italic font-normal text-[#E8A838]">Welcome aboard.</span>
              </h2>
              <p className="font-jakarta text-white/80 text-base sm:text-lg max-w-xl leading-relaxed">
                Read our community guidelines, explore the web application, or reach out to our team anytime.
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
                  to="/terms"
                  className="w-full inline-flex items-center justify-center gap-3 bg-[#E8A838] hover:bg-[#d4952e] text-[#13502D] px-8 py-4 rounded-full font-mono text-xs uppercase tracking-wider font-bold transition-all shadow-lg text-center"
                >
                  Read Community Terms
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link
                  to="/about"
                  className="w-full inline-flex items-center justify-center gap-3 bg-transparent hover:bg-white/10 text-white border-2 border-white/40 px-8 py-4 rounded-full font-mono text-xs uppercase tracking-wider font-semibold transition-all text-center"
                >
                  About Ally-jis <ArrowUpRight size={16} />
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
