import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, ShieldCheck, CheckCircle2, AlertCircle, Smartphone, Lock, FileCode2, ExternalLink, Loader2, RotateCcw } from 'lucide-react';
import { Footer } from '@/components/Footer';

export default function DownloadPage() {
  const apkFileName = 'ally-jis-app-beta-test-1.0.apk';
  const apkPath = `/${apkFileName}`;

  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadedMB, setLoadedMB] = useState(0);
  const [totalMB, setTotalMB] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleDownloadWithProgress = () => {
    setDownloading(true);
    setProgress(0);
    setIsCompleted(false);

    const xhr = new XMLHttpRequest();
    xhr.open('GET', apkPath, true);
    xhr.responseType = 'blob';

    xhr.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setProgress(percent);
        setLoadedMB(Number((event.loaded / (1024 * 1024)).toFixed(1)));
        setTotalMB(Number((event.total / (1024 * 1024)).toFixed(1)));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const blob = xhr.response;
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = apkFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);

        setIsCompleted(true);
        setDownloading(false);
      } else {
        setDownloading(false);
        const link = document.createElement('a');
        link.href = apkPath;
        link.download = apkFileName;
        link.click();
      }
    };

    xhr.onerror = () => {
      setDownloading(false);
      const link = document.createElement('a');
      link.href = apkPath;
      link.download = apkFileName;
      link.click();
    };

    xhr.send();
  };

  return (
    <div className="min-h-[100dvh] bg-[#F7F4EF] flex flex-col justify-between">
      <div>
        {/* Header */}
        <header className="bg-white border-b border-[#1A6B3C]/10 py-4 px-4 sm:px-6 sticky top-0 z-30 shadow-sm">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Link to="/" className="inline-flex items-center gap-2 text-[#1A6B3C] font-jakarta font-medium text-sm hover:underline">
              <ArrowLeft size={16} /> Back to Website
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#1A6B3C] flex items-center justify-center">
                <span className="text-white font-fraunces font-bold text-base">A</span>
              </div>
              <span className="font-fraunces font-semibold text-lg text-[#1A6B3C]">
                lly<span className="text-[#E8A838]">-jis</span>
              </span>
            </div>
          </div>
        </header>

        {/* Hero Download Section */}
        <section className="relative overflow-hidden py-16 px-4 sm:px-6">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 right-10 w-96 h-96 rounded-full bg-[#1A6B3C]/5 blur-3xl" />
            <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-[#E8A838]/10 blur-3xl" />
          </div>

          <div className="max-w-3xl mx-auto text-center relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 bg-[#E8A838]/15 text-[#B45309] px-4 py-1.5 rounded-full text-xs font-jakarta font-bold border border-[#E8A838]/30">
              <ShieldCheck size={16} className="text-[#E8A838]" /> Alpha Test 1.0 — Selected & Developer Testers Only
            </div>

            <h1 className="font-fraunces text-4xl sm:text-6xl font-bold text-[#1A6B3C] leading-tight">
              Download Ally-jis <br />
              <span className="text-[#E8A838]">Android Alpha 1.0</span>
            </h1>

            <p className="font-jakarta text-gray-700 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
              Get the official mobile app for CHMSU Alijis students. Enjoy instant notifications, real-time chat, and fast match browsing directly on your phone.
            </p>

            {/* Interactive Download Progress Action */}
            <div className="pt-4 flex flex-col items-center space-y-3 w-full max-w-md mx-auto">
              {!downloading && !isCompleted && (
                <button
                  onClick={handleDownloadWithProgress}
                  className="group flex items-center justify-center gap-3 bg-[#1A6B3C] hover:bg-[#155a33] text-white font-jakarta font-bold text-lg px-9 py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-[#1A6B3C]/30 transition-all active:scale-[0.98] w-full"
                >
                  <Download size={24} className="group-hover:translate-y-0.5 transition-transform" />
                  Download APK ({apkFileName})
                </button>
              )}

              {/* Progress UI */}
              {downloading && (
                <div className="w-full bg-white p-5 rounded-2xl border border-[#1A6B3C]/20 shadow-lg space-y-3 text-left">
                  <div className="flex items-center justify-between font-jakarta text-sm">
                    <span className="font-semibold text-[#1A6B3C] flex items-center gap-2">
                      <Loader2 size={18} className="animate-spin text-[#E8A838]" /> Downloading APK...
                    </span>
                    <span className="font-bold text-[#1A6B3C] font-mono text-base">{progress}%</span>
                  </div>

                  <div className="w-full bg-gray-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-gray-200">
                    <div
                      className="bg-gradient-to-r from-[#1A6B3C] to-[#E8A838] h-full rounded-full transition-all duration-150 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 font-jakarta">
                    <span>{loadedMB} MB of {totalMB > 0 ? `${totalMB} MB` : '45 MB'}</span>
                    <span className="text-[#B45309] font-medium animate-pulse">Downloading to device...</span>
                  </div>
                </div>
              )}

              {/* Completed State */}
              {isCompleted && (
                <div className="w-full bg-emerald-50 border border-emerald-300 p-4 rounded-2xl flex items-center justify-between text-left shadow-sm">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-jakarta font-bold text-emerald-900 text-sm">Download Finished!</p>
                      <p className="font-jakarta text-xs text-emerald-700">Check your device downloads to install</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDownloadWithProgress}
                    className="flex items-center gap-1 text-xs font-bold text-[#1A6B3C] hover:text-emerald-800 underline shrink-0"
                  >
                    <RotateCcw size={13} /> Re-download
                  </button>
                </div>
              )}

              <div className="flex items-center gap-4 text-xs font-jakarta text-gray-500 pt-1">
                <span className="flex items-center gap-1"><Smartphone size={14} /> Android 8.0+</span>
                <span>•</span>
                <span className="flex items-center gap-1"><FileCode2 size={14} /> Size: ~45 MB</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-700 font-semibold"><CheckCircle2 size={14} /> Verified Safe</span>
              </div>
            </div>
          </div>
        </section>

        {/* Security & Installation Guide */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 pb-16 space-y-10">
          {/* Trust Notice Box */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#1A6B3C]/15 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#E8A838]/15 text-[#1A6B3C] rounded-2xl shrink-0">
                <AlertCircle size={26} />
              </div>
              <div className="space-y-2">
                <h3 className="font-fraunces text-xl font-bold text-[#1A6B3C]">
                  Why Android shows "File might be harmful" prompt
                </h3>
                <p className="font-jakarta text-gray-700 text-sm leading-relaxed">
                  Because Ally-jis is distributed directly through our official website (<code>ally-jis.xyz</code>) instead of Google Play, Android displays a standard warning notice whenever downloading any <code>.apk</code> file in Chrome or standard web browsers.
                </p>
                <p className="font-jakarta text-xs text-gray-500 leading-relaxed">
                  <strong>Rest assured:</strong> Our application binary is signed, verified, completely safe, and built strictly for the CHMSU Alijis student community.
                </p>
              </div>
            </div>
          </div>

          {/* Step-by-step Installation Steps */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="font-fraunces text-3xl font-bold text-[#1A6B3C]">Easy Installation Steps</h2>
              <p className="font-jakarta text-gray-600 text-sm mt-1">3 quick steps to install the app on your Android device</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm relative overflow-hidden space-y-3">
                <div className="w-8 h-8 rounded-full bg-[#1A6B3C] text-white font-bold text-sm flex items-center justify-center">
                  1
                </div>
                <h4 className="font-jakarta font-bold text-gray-900 text-base">Tap Download APK</h4>
                <p className="font-jakarta text-gray-600 text-xs leading-relaxed">
                  Click the green download button above to save <code>{apkFileName}</code> to your device. If prompted with "File might be harmful", tap <strong>Download anyway</strong>.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm relative overflow-hidden space-y-3">
                <div className="w-8 h-8 rounded-full bg-[#1A6B3C] text-white font-bold text-sm flex items-center justify-center">
                  2
                </div>
                <h4 className="font-jakarta font-bold text-gray-900 text-base">Allow Browser Install</h4>
                <p className="font-jakarta text-gray-600 text-xs leading-relaxed">
                  Open your downloaded file or tap the pop-up. If Android asks for permission, tap <strong>Settings</strong> and toggle on <strong>"Allow from this source"</strong> for Chrome/Downloads.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm relative overflow-hidden space-y-3">
                <div className="w-8 h-8 rounded-full bg-[#1A6B3C] text-white font-bold text-sm flex items-center justify-center">
                  3
                </div>
                <h4 className="font-jakarta font-bold text-gray-900 text-base">Complete & Sign In</h4>
                <p className="font-jakarta text-gray-600 text-xs leading-relaxed">
                  Tap <strong>Install</strong> to complete setup. Open Ally-jis, log in with your account or create a new student profile, and enjoy!
                </p>
              </div>
            </div>
          </div>

          {/* Technical Info & Verification */}
          <div className="bg-[#1A6B3C]/5 rounded-3xl p-6 sm:p-8 border border-[#1A6B3C]/10 font-jakarta space-y-4">
            <h3 className="font-fraunces text-lg font-bold text-[#1A6B3C] flex items-center gap-2">
              <Lock size={18} /> Technical App Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-1">
                <span className="text-gray-500 block font-medium">Application ID / Package</span>
                <span className="text-gray-900 font-mono font-semibold">xyz.allyjis.app</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-1">
                <span className="text-gray-500 block font-medium">Official Release Version</span>
                <span className="text-gray-900 font-semibold">v1.0.0 (Build 1)</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-1">
                <span className="text-gray-500 block font-medium">Domain & Server Host</span>
                <span className="text-gray-900 font-mono font-semibold">ally-jis.xyz</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-1">
                <span className="text-gray-500 block font-medium">Target Audience</span>
                <span className="text-gray-900 font-semibold">CHMSU Alijis Students</span>
              </div>
            </div>
          </div>

          {/* Quick links footer */}
          <div className="flex flex-wrap items-center justify-center gap-6 font-jakarta text-xs text-gray-600 pt-4">
            <Link to="/privacy" className="hover:text-[#1A6B3C] underline flex items-center gap-1">
              Privacy Policy <ExternalLink size={12} />
            </Link>
            <Link to="/terms" className="hover:text-[#1A6B3C] underline flex items-center gap-1">
              Terms & Conditions <ExternalLink size={12} />
            </Link>
            <Link to="/support" className="hover:text-[#1A6B3C] underline flex items-center gap-1">
              Support Center <ExternalLink size={12} />
            </Link>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
