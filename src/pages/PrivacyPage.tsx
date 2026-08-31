import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, Server, UserCheck } from 'lucide-react';
import { Footer } from '@/components/Footer';

export default function PrivacyPage() {
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
                <Shield size={28} />
              </div>
              <div>
                <h1 className="font-fraunces text-3xl sm:text-4xl font-bold text-[#1A6B3C]">Privacy Policy</h1>
                <p className="font-jakarta text-xs text-[#1A6B3C]/60 mt-1">Effective Date: August 31, 2026 | Domain: ally-jis.xyz</p>
              </div>
            </div>

            <hr className="my-6 border-[#1A6B3C]/10" />

            <div className="space-y-8 font-jakarta text-gray-700 text-sm sm:text-base leading-relaxed">
              <section className="bg-[#F7F4EF] p-5 rounded-2xl border border-[#1A6B3C]/10">
                <h2 className="font-fraunces text-xl font-bold text-[#1A6B3C] mb-2 flex items-center gap-2">
                  <UserCheck size={20} /> Campus Privacy Commitment
                </h2>
                <p>
                  Ally-jis is designed exclusively for students at Carlos Hilado Memorial State University (CHMSU) Alijis Campus. We are committed to protecting your personal information, maintaining your confidentiality, and creating a safe digital environment for student interaction.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="font-fraunces text-xl font-bold text-[#1A6B3C]">1. Information We Collect</h2>
                <p>To operate the Ally-jis platform and facilitate campus connections, we collect:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li><strong>Account Profile Data:</strong> Username, institutional email address (@chmsu.edu.ph), department, course, year level, profile avatar, and bio.</li>
                  <li><strong>Interests & Preferences:</strong> Selected hobbies, student organization memberships, and social preferences used to calculate match scores.</li>
                  <li><strong>User Content:</strong> Posts, comments, likes, media uploads, and messages sent through the direct messaging feature.</li>
                  <li><strong>Technical Logs:</strong> IP address, device model, app version, operating system version, and basic access timestamps for security and bug diagnosis.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="font-fraunces text-xl font-bold text-[#1A6B3C]">2. How We Use Your Data</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <h3 className="font-bold text-[#1A6B3C] mb-1 flex items-center gap-2">
                      <Eye size={16} /> Campus Matching
                    </h3>
                    <p className="text-xs text-gray-600">Displaying your profile and interests to fellow verified CHMSU Alijis students for peer recommendations.</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <h3 className="font-bold text-[#1A6B3C] mb-1 flex items-center gap-2">
                      <Lock size={16} /> Direct Messaging
                    </h3>
                    <p className="text-xs text-gray-[#555]">Unlocking messaging channels once connection requests are mutually accepted between users.</p>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="font-fraunces text-xl font-bold text-[#1A6B3C]">3. Data Sharing & Disclosure</h2>
                <p>
                  We <strong>never sell</strong> your personal data to third parties, advertisers, or external data brokers. Your profile is only accessible to authenticated Ally-jis users within the CHMSU community ecosystem.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="font-fraunces text-xl font-bold text-[#1A6B3C]">4. Security & Hosting</h2>
                <p className="flex items-center gap-2 text-gray-600">
                  <Server size={18} className="text-[#1A6B3C]" />
                  All data is encrypted during transmission (HTTPS/TLS) and stored on secure cloud databases hosted at <code>ally-jis.xyz</code> and production database clusters.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="font-fraunces text-xl font-bold text-[#1A6B3C]">5. Your Rights & Control</h2>
                <p>You have full control over your profile. You can at any time:</p>
                <ul className="list-disc pl-6 space-y-1 text-gray-600">
                  <li>Update or edit your profile, bio, course, and interests in app Settings.</li>
                  <li>Block or unblock specific users.</li>
                  <li>Request complete deletion of your account and posts by contacting support.</li>
                </ul>
              </section>

              <section className="pt-4 border-t border-gray-100">
                <h2 className="font-fraunces text-lg font-bold text-[#1A6B3C] mb-1">Contact Privacy Support</h2>
                <p className="text-sm text-gray-600">
                  For privacy queries or data requests, contact our privacy team at{' '}
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
