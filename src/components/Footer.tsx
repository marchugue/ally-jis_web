import { Link } from 'react-router-dom';
import { Download, Shield, FileText, HelpCircle, Info, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#13502D] text-white/80 py-12 px-4 sm:px-6 border-t border-white/10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand Info */}
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#E8A838] flex items-center justify-center shadow-md">
              <span className="text-[#1A6B3C] font-fraunces font-bold text-xl">A</span>
            </div>
            <span className="font-fraunces font-semibold text-2xl text-white">
              lly<span className="text-[#E8A838]">-jis</span>
            </span>
          </div>
          <p className="font-jakarta text-xs text-white/70 leading-relaxed">
            The exclusive campus community platform for CHMSU Alijis students. Connect based on shared interests, activities, and campus life.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-jakarta font-bold text-white text-sm mb-4 uppercase tracking-wider">Mobile App</h4>
          <ul className="space-y-2.5 font-jakarta text-xs text-white/80">
            <li>
              <Link to="/download" className="flex items-center gap-2 hover:text-[#E8A838] transition-colors">
                <Download size={14} className="text-[#E8A838]" />
                Download Android APK (v1.0)
              </Link>
            </li>
            <li>
              <Link to="/about" className="flex items-center gap-2 hover:text-[#E8A838] transition-colors">
                <Info size={14} className="text-[#E8A838]" />
                About Ally-jis
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal & Policy */}
        <div>
          <h4 className="font-jakarta font-bold text-white text-sm mb-4 uppercase tracking-wider">Legal & Safety</h4>
          <ul className="space-y-2.5 font-jakarta text-xs text-white/80">
            <li>
              <Link to="/privacy" className="flex items-center gap-2 hover:text-[#E8A838] transition-colors">
                <Shield size={14} className="text-[#E8A838]" />
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="flex items-center gap-2 hover:text-[#E8A838] transition-colors">
                <FileText size={14} className="text-[#E8A838]" />
                Terms & Conditions
              </Link>
            </li>
          </ul>
        </div>

        {/* Help & Support */}
        <div>
          <h4 className="font-jakarta font-bold text-white text-sm mb-4 uppercase tracking-wider">Support</h4>
          <ul className="space-y-2.5 font-jakarta text-xs text-white/80">
            <li>
              <Link to="/support" className="flex items-center gap-2 hover:text-[#E8A838] transition-colors">
                <HelpCircle size={14} className="text-[#E8A838]" />
                Help & Installation Guide
              </Link>
            </li>
            <li>
              <a href="mailto:support@ally-jis.xyz" className="hover:text-[#E8A838] transition-colors">
                Contact: support@ally-jis.xyz
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-white/60 font-jakarta gap-4">
        <p>© {new Date().getFullYear()} Ally-jis (ally-jis.xyz) • <span className="text-[#E8A838] font-semibold">Alpha Test 1.0 (Selected & Developer Testers Only)</span></p>
        <p className="flex items-center gap-1">
          Made with <Heart size={12} className="text-[#E8A838] fill-[#E8A838]" /> for CHMSU Students
        </p>
      </div>
    </footer>
  );
}
