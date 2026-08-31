import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle2, AlertTriangle, Scale } from 'lucide-react';
import { Footer } from '@/components/Footer';

export default function TermsPage() {
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

        {/* Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-[#1A6B3C]/10">
            <div className="flex items-center gap-3 text-[#1A6B3C] mb-4">
              <div className="p-3 bg-[#1A6B3C]/10 rounded-2xl">
                <FileText size={28} />
              </div>
              <div>
                <h1 className="font-fraunces text-3xl sm:text-4xl font-bold text-[#1A6B3C]">Terms & Conditions</h1>
                <p className="font-jakarta text-xs text-[#1A6B3C]/60 mt-1">Last Updated: August 31, 2026 | Website: ally-jis.xyz</p>
              </div>
            </div>

            <hr className="my-6 border-[#1A6B3C]/10" />

            <div className="space-y-8 font-jakarta text-gray-700 text-sm sm:text-base leading-relaxed">
              <section className="bg-[#F7F4EF] p-5 rounded-2xl border border-[#1A6B3C]/10">
                <h2 className="font-fraunces text-xl font-bold text-[#1A6B3C] mb-2 flex items-center gap-2">
                  <Scale size={20} /> Agreement to Terms
                </h2>
                <p>
                  By creating an account, downloading the Ally-jis mobile application, or accessing services provided on <strong>ally-jis.xyz</strong>, you agree to comply with and be bound by these Terms & Conditions.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="font-fraunces text-xl font-bold text-[#1A6B3C]">1. Eligibility & Student Status</h2>
                <p>
                  Ally-jis is built specifically for students enrolled at Carlos Hilado Memorial State University (CHMSU) Alijis Campus.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li>You must register using a valid CHMSU student email or credential.</li>
                  <li>You agree to provide true, accurate, and current information regarding your department, course, year level, and profile details.</li>
                  <li>Impersonation of faculty, staff, or other students is strictly prohibited.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="font-fraunces text-xl font-bold text-[#1A6B3C]">2. Community Guidelines & Conduct</h2>
                <p>To ensure a safe, supportive campus environment, all users must adhere to the following standards:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
                  <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                    <h3 className="font-bold text-emerald-800 mb-1 flex items-center gap-2">
                      <CheckCircle2 size={16} /> Encouraged Behavior
                    </h3>
                    <p className="text-xs text-emerald-700">Respectful communication, sharing authentic interest tags, academic collaboration, and constructive campus interaction.</p>
                  </div>
                  <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-100">
                    <h3 className="font-bold text-rose-800 mb-1 flex items-center gap-2">
                      <AlertTriangle size={16} /> Prohibited Actions
                    </h3>
                    <p className="text-xs text-rose-700">Harassment, bullying, hate speech, inappropriate media uploads, spamming connection requests, or unauthorized commercial advertising.</p>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="font-fraunces text-xl font-bold text-[#1A6B3C]">3. Application Distribution & Hosting</h2>
                <p>
                  The official Android APK for Ally-jis (e.g. <code>ally-jis-app1.0.apk</code>) is hosted directly on <strong>ally-jis.xyz</strong>.
                </p>
                <p className="text-gray-600">
                  By downloading directly from our official website, you acknowledge that you are obtaining the authentic, un-tampered build verified by the Ally-jis developer team. Do not download `.apk` binaries from third-party mirrors or unverified links.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="font-fraunces text-xl font-bold text-[#1A6B3C]">4. Moderation & Account Suspension</h2>
                <p>
                  Ally-jis administrators reserve the right to review reported accounts, moderate violating content, and issue warnings or permanent account suspensions for violations of these Terms.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="font-fraunces text-xl font-bold text-[#1A6B3C]">5. Contact Information</h2>
                <p className="text-[#555]">
                  Questions regarding these terms should be directed to{' '}
                  <a href="mailto:support@ally-jis.xyz" className="text-[#1A6B3C] font-semibold underline">
                    support@ally-jis.xyz
                  </a>.
                </p>
              </section>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
