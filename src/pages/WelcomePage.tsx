import { Link } from 'react-router-dom';
import { ArrowRight, Users, Heart, MessageCircle, Star } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function WelcomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-[100dvh] bg-[#F7F4EF]">
      {/* Hero Section */}
      <div className="relative">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-[#1A6B3C]/6 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-[#E8A838]/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#3B8C7E]/4 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-20">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-[#1A6B3C] flex items-center justify-center shadow-lg">
                <span className="text-white font-fraunces font-bold text-xl">A</span>
              </div>
              <span className="font-fraunces font-semibold text-2xl text-[#1A6B3C]">
                lly<span className="text-[#E8A838]">-jis</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <Link
                  to="/dashboard"
                  className="font-jakarta font-semibold text-sm bg-[#1A6B3C] text-white px-5 py-2.5 rounded-xl hover:bg-[#155a33] transition-colors shadow-md"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="font-jakarta font-medium text-sm text-[#1A6B3C] hover:underline"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/onboarding"
                    className="font-jakarta font-semibold text-sm bg-[#1A6B3C] text-white px-5 py-2.5 rounded-xl hover:bg-[#155a33] transition-colors shadow-md"
                  >
                    Join now
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Hero Content */}
          <div className="text-center max-w-3xl mx-auto">
            {/* Step indicator pill */}
            <div className="inline-flex items-center gap-2 bg-[#1A6B3C]/8 text-[#1A6B3C] px-4 py-2 rounded-full mb-6">
              <span className="w-5 h-5 bg-[#1A6B3C] rounded-full text-white text-xs font-bold flex items-center justify-center">1</span>
              <span className="font-jakarta text-sm font-medium">Step 1 of 4 — Start your journey</span>
            </div>

            <h1 className="font-fraunces text-5xl sm:text-6xl md:text-7xl font-bold text-[#1A6B3C] leading-tight mb-6">
              Find your people<br />
              <span className="text-[#E8A838] italic">at CHMSU</span>
            </h1>

            <p className="font-jakarta text-lg sm:text-xl text-[#1A6B3C]/70 leading-relaxed mb-10 max-w-2xl mx-auto">
              Ally-jis connects CHMSU Alijis students based on shared interests, hobbies, and 
              organizations. Break out of your department bubble and discover your campus community.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center max-w-sm sm:max-w-none mx-auto">
              {user ? (
                <Link
                  to="/dashboard"
                  className="group flex items-center justify-center gap-3 bg-[#1A6B3C] text-white px-8 py-4 rounded-2xl font-jakarta font-bold text-lg hover:bg-[#155a33] transition-all shadow-xl hover:shadow-2xl hover:shadow-[#1A6B3C]/20 active:scale-[0.98] w-full sm:w-auto"
                >
                  Go to Dashboard
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/onboarding"
                    className="group flex items-center justify-center gap-3 bg-[#1A6B3C] text-white px-8 py-4 rounded-2xl font-jakarta font-bold text-lg hover:bg-[#155a33] transition-all shadow-xl hover:shadow-2xl hover:shadow-[#1A6B3C]/20 active:scale-[0.98] w-full sm:w-auto"
                  >
                    Join now
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/login"
                    className="flex items-center justify-center gap-2 font-jakarta font-medium text-[#1A6B3C] border-2 border-[#1A6B3C]/20 px-8 py-4 rounded-2xl hover:border-[#1A6B3C]/40 hover:bg-[#1A6B3C]/5 transition-all w-full sm:w-auto"
                  >
                    Sign in to your account
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Preview Cards */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                emoji: '🎯',
                title: 'Smart Matching',
                desc: 'Find peers with 3+ shared interests. The more you share, the higher your match score.',
                color: 'bg-[#1A6B3C]/5',
                border: 'border-[#1A6B3C]/15',
              },
              {
                emoji: '💬',
                title: 'Intentional Connections',
                desc: 'Send a connect request first. When accepted, your conversation unlocks automatically.',
                color: 'bg-[#E8A838]/8',
                border: 'border-[#E8A838]/20',
              },
              {
                emoji: '🌿',
                title: 'Campus-Exclusive',
                desc: 'Only for CHMSU Alijis students. A safe, verified space for your campus community.',
                color: 'bg-[#3B8C7E]/5',
                border: 'border-[#3B8C7E]/15',
              },
            ].map((feature, i) => (
              <div key={i} className={`${feature.color} ${feature.border} border rounded-2xl p-6 card-shadow`}>
                <div className="text-3xl mb-3">{feature.emoji}</div>
                <h3 className="font-jakarta font-bold text-[#1A6B3C] text-lg mb-2">{feature.title}</h3>
                <p className="font-jakarta text-[#1A6B3C]/65 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-fraunces text-4xl font-bold text-[#1A6B3C] mb-3">How Ally-jis works</h2>
            <p className="font-jakarta text-[#1A6B3C]/60 text-lg">Four simple steps to find your campus friends</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { step: 1, icon: <Users size={24} />, title: 'Create Profile', desc: 'Fill in your basic info, course, and year level.' },
              { step: 2, icon: <Star size={24} />, title: 'Add Interests', desc: 'Pick at least 3 interests and hobbies that define you.' },
              { step: 3, icon: <Heart size={24} />, title: 'Get Matched', desc: 'Discover students with compatible interests and orgs.' },
              { step: 4, icon: <MessageCircle size={24} />, title: 'Connect & Chat', desc: 'Send a request, and start your campus friendship.' },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#1A6B3C] text-white flex items-center justify-center mx-auto mb-4 shadow-lg">
                  {icon}
                </div>
                <div className="inline-block bg-[#E8A838]/15 text-[#E8A838] font-mono-accent font-bold text-xs px-2 py-0.5 rounded-full mb-2">
                  Step {step}
                </div>
                <h3 className="font-jakarta font-bold text-gray-900 text-base mb-1">{title}</h3>
                <p className="font-jakarta text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Footer */}
      <div className="bg-[#1A6B3C] py-16 px-4 text-center">
        <h2 className="font-fraunces text-3xl sm:text-4xl font-bold text-white mb-4">
          Ready to find your people?
        </h2>
        <p className="font-jakarta text-white/70 text-lg mb-8">Join hundreds of CHMSU students already using Ally-jis</p>
        <div className="max-w-sm mx-auto px-4 sm:px-0 sm:max-w-none">
          {user ? (
            <Link
              to="/dashboard"
              className="flex items-center justify-center gap-2 bg-[#E8A838] text-white font-jakarta font-bold px-8 py-4 rounded-2xl hover:bg-[#d4952e] transition-colors shadow-xl text-lg w-full sm:w-auto sm:inline-flex"
            >
              Go to Dashboard <ArrowRight size={20} />
            </Link>
          ) : (
            <Link
              to="/onboarding"
              className="flex items-center justify-center gap-2 bg-[#E8A838] text-white font-jakarta font-bold px-8 py-4 rounded-2xl hover:bg-[#d4952e] transition-colors shadow-xl text-lg w-full sm:w-auto sm:inline-flex"
            >
              Join now <ArrowRight size={20} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
