import { Link } from 'react-router-dom';
import { ArrowLeft, Info, Heart, Users, Sparkles, Download } from 'lucide-react';
import { Footer } from '@/components/Footer';

export default function AboutPage() {
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
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-[#1A6B3C]/10">
            <div className="flex items-center gap-3 text-[#1A6B3C] mb-4">
              <div className="p-3 bg-[#1A6B3C]/10 rounded-2xl">
                <Info size={28} />
              </div>
              <div>
                <h1 className="font-fraunces text-3xl sm:text-4xl font-bold text-[#1A6B3C]">About Ally-jis</h1>
                <p className="font-jakarta text-xs text-[#1A6B3C]/60 mt-1">Connecting CHMSU Alijis Students</p>
              </div>
            </div>

            <hr className="my-6 border-[#1A6B3C]/10" />

            <div className="space-y-6 font-jakarta text-gray-700 text-sm sm:text-base leading-relaxed">
              <p className="text-lg text-[#1A6B3C] font-medium leading-normal">
                <strong>Ally-jis</strong> is a dedicated social community platform crafted specifically for Carlos Hilado Memorial State University (CHMSU) Alijis Campus students.
              </p>

              <p>
                Our mission is to help students break out of departmental silos, discover shared interests, connect across courses and year levels, and foster a safer, more vibrant campus culture.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
                <div className="p-5 bg-[#F7F4EF] rounded-2xl border border-[#1A6B3C]/10 text-center space-y-2">
                  <div className="w-10 h-10 bg-[#1A6B3C] text-white rounded-xl flex items-center justify-center mx-auto">
                    <Sparkles size={20} />
                  </div>
                  <h3 className="font-fraunces font-bold text-[#1A6B3C]">Interest Matching</h3>
                  <p className="text-xs text-gray-600">Connect based on hobbies, tech stacks, sports, art, and campus clubs.</p>
                </div>

                <div className="p-5 bg-[#F7F4EF] rounded-2xl border border-[#1A6B3C]/10 text-center space-y-2">
                  <div className="w-10 h-10 bg-[#1A6B3C] text-white rounded-xl flex items-center justify-center mx-auto">
                    <Users size={20} />
                  </div>
                  <h3 className="font-fraunces font-bold text-[#1A6B3C]">Campus Exclusive</h3>
                  <p className="text-xs text-gray-600">A verified student community tailored to CHMSU Alijis student life.</p>
                </div>

                <div className="p-5 bg-[#F7F4EF] rounded-2xl border border-[#1A6B3C]/10 text-center space-y-2">
                  <div className="w-10 h-10 bg-[#1A6B3C] text-white rounded-xl flex items-center justify-center mx-auto">
                    <Heart size={20} />
                  </div>
                  <h3 className="font-fraunces font-bold text-[#1A6B3C]">Intentional Social</h3>
                  <p className="text-xs text-gray-600">Safe, request-first messaging and respectful interaction standards.</p>
                </div>
              </div>

              <div className="bg-[#1A6B3C] text-white rounded-2xl p-6 sm:p-8 text-center space-y-4">
                <h3 className="font-fraunces text-2xl font-bold">Get the Ally-jis Mobile Experience</h3>
                <p className="text-white/80 text-sm max-w-md mx-auto">
                  Download our official Android application directly from our web server to receive push notifications, fast real-time chat, and smooth mobile navigation.
                </p>
                <Link
                  to="/download"
                  className="inline-flex items-center gap-2 bg-[#E8A838] text-white px-6 py-3 rounded-2xl font-jakarta font-bold text-sm hover:bg-[#d4952e] transition-colors shadow-lg"
                >
                  <Download size={18} /> Download Android APK (v1.0)
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
