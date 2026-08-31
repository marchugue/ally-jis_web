import { Link } from 'react-router-dom';
import { ArrowLeft, HelpCircle, Download, ShieldCheck, Mail, CheckCircle2 } from 'lucide-react';
import { Footer } from '@/components/Footer';

export default function SupportPage() {
  return (
    <div className="min-h-[100dvh] bg-[#F7F4EF] flex flex-col justify-between">
      <div>
        {/* Header */}
        <header className="bg-white border-b border-[#1A6B3C]/10 py-4 px-4 sm:px-6 sticky top-0 z-30 shadow-sm">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Link to="/" className="inline-flex items-center gap-2 text-[#1A6B3C] font-jakarta font-medium text-sm hover:underline">
              <ArrowLeft size={16} /> Back to Home
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

        {/* Hero Banner */}
        <section className="bg-[#1A6B3C] text-white py-12 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-[#E8A838]/20 text-[#E8A838] px-3.5 py-1 rounded-full text-xs font-jakarta font-semibold">
              <HelpCircle size={14} /> Help Center & Installation Support
            </div>
            <h1 className="font-fraunces text-3xl sm:text-5xl font-bold">How can we help you?</h1>
            <p className="font-jakarta text-white/80 text-sm sm:text-base max-w-xl mx-auto">
              Find answers to direct APK installation, account configuration, security, and student support.
            </p>
          </div>
        </section>

        {/* Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
          {/* Direct Download Help CTA Card */}
          <div className="bg-gradient-to-br from-[#1A6B3C]/10 to-[#E8A838]/10 rounded-3xl p-6 sm:p-8 border border-[#1A6B3C]/20 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <h2 className="font-fraunces text-2xl font-bold text-[#1A6B3C]">Installing Ally-jis Android APK</h2>
              <p className="font-jakarta text-gray-700 text-sm">
                Looking for the direct APK download page and step-by-step installation instructions for your phone?
              </p>
            </div>
            <Link
              to="/download"
              className="inline-flex items-center gap-2 bg-[#1A6B3C] text-white px-6 py-3 rounded-2xl font-jakarta font-bold text-sm hover:bg-[#155a33] transition-colors shadow-md whitespace-nowrap"
            >
              <Download size={18} /> Visit Download Page
            </Link>
          </div>

          {/* FAQ Accordion Section */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-[#1A6B3C]/10 space-y-6">
            <h2 className="font-fraunces text-2xl font-bold text-[#1A6B3C] flex items-center gap-2">
              <ShieldCheck size={24} /> Frequently Asked Questions
            </h2>

            <div className="space-y-4 font-jakarta">
              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <h3 className="font-bold text-gray-900 text-base mb-2">Why does Android show "File might be harmful" when I download the APK?</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Android automatically displays a default warning prompt whenever you download any executable <code>.apk</code> file directly from a web browser instead of Google Play. <strong>This is normal standard Android security behavior.</strong> As long as you download directly from <code>https://ally-jis.xyz/download</code>, our APK file is completely safe, verified, and malware-free.
                </p>
              </div>

              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <h3 className="font-bold text-gray-900 text-base mb-2">How do I allow installation from unknown sources?</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-2">
                  When you tap the downloaded <code>ally-jis-app1.0.apk</code> file, your phone will ask for permission to install:
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-xs text-gray-700">
                  <li>Tap <strong>Settings</strong> on the prompt pop-up.</li>
                  <li>Toggle <strong>Allow from this source</strong> (e.g. Chrome or File Manager).</li>
                  <li>Go back and tap <strong>Install</strong>.</li>
                </ol>
              </div>

              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <h3 className="font-bold text-gray-900 text-base mb-2">Who can register an account on Ally-jis?</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Ally-jis is designed exclusively for CHMSU Alijis Campus students. Registration requires selecting your actual department, course, and year level.
                </p>
              </div>

              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <h3 className="font-bold text-gray-900 text-base mb-2">How do connection requests and chat work?</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  To protect student privacy, messaging is locked until you send a connection request to a fellow student and they accept your request. Once accepted, chat is enabled automatically in real-time.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#1A6B3C]/10 text-center space-y-3 font-jakarta">
            <div className="w-12 h-12 rounded-2xl bg-[#E8A838]/20 text-[#1A6B3C] flex items-center justify-center mx-auto">
              <Mail size={24} />
            </div>
            <h3 className="font-fraunces text-xl font-bold text-[#1A6B3C]">Need further assistance?</h3>
            <p className="text-gray-600 text-sm max-w-md mx-auto">
              Have questions about your account, reporting a technical issue, or feedback? Send an email to our support desk.
            </p>
            <a
              href="mailto:support@ally-jis.xyz"
              className="inline-flex items-center gap-2 text-[#1A6B3C] font-bold text-base hover:underline"
            >
              <CheckCircle2 size={18} className="text-[#E8A838]" /> support@ally-jis.xyz
            </a>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
