/**
 * OnboardingIllustrations.tsx (Web)
 * SVG inline illustrations for registration steps, email selection, ID verification, and OTP.
 * Supports easy-to-plug-in custom images (via config or props) with automatic fallback
 * to the crisp, scalable, hardcoded vector SVG if no image is provided or on image load error.
 */
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  ONBOARDING_ILLUSTRATION_ASSETS,
  setOnboardingIllustrations,
  setOnboardingIllustration,
  type OnboardingIllustrationAssets,
} from '@/config/onboardingIllustrations';

export {
  ONBOARDING_ILLUSTRATION_ASSETS,
  setOnboardingIllustrations,
  setOnboardingIllustration,
  type OnboardingIllustrationAssets,
};

// ── Shared blob container ───────────────────────────────────────────

interface BlobProps {
  size?: number;
  color?: string;
  className?: string;
  children: React.ReactNode;
}

export function IllustrationBlob({ size, color = '#E8F5EE', className = '', children }: BlobProps) {
  const hasExplicitSize = typeof size === 'number';
  return (
    <div
      className={cn(
        'flex items-center justify-center overflow-hidden shrink-0 transition-all duration-300 rounded-full',
        !hasExplicitSize && 'w-28 h-28 sm:w-36 sm:h-36 md:w-36 md:h-36 lg:w-44 lg:h-44 xl:w-52 xl:h-52',
        className
      )}
      style={{
        ...(hasExplicitSize ? { width: size, height: size, borderRadius: size / 2 } : {}),
        backgroundColor: color,
      }}
    >
      {children}
    </div>
  );
}

// ── Pluggable Image Wrapper with Automatic Vector Fallback ──────────

interface PluggableIllustrationProps {
  size?: number;
  color?: string;
  className?: string;
  imageSrc?: string | null;
  configKey: keyof OnboardingIllustrationAssets;
  alt: string;
  children: React.ReactNode;
}

export function PluggableIllustration({
  size,
  color = '#E8F5EE',
  className = '',
  imageSrc,
  configKey,
  alt,
  children,
}: PluggableIllustrationProps) {
  const [imgError, setImgError] = useState(false);
  const resolvedSrc = imageSrc !== undefined ? imageSrc : ONBOARDING_ILLUSTRATION_ASSETS[configKey];

  useEffect(() => {
    setImgError(false);
  }, [resolvedSrc]);

  // If a custom image is provided and hasn't failed to load, display it
  if (resolvedSrc && !imgError) {
    return (
      <IllustrationBlob size={size} color={color} className={className}>
        <img
          src={resolvedSrc}
          alt={alt}
          onError={() => setImgError(true)}
          className="w-[85%] h-[85%] object-contain select-none pointer-events-none transition-transform duration-300 hover:scale-105"
          draggable={false}
        />
      </IllustrationBlob>
    );
  }

  // Fallback: render the crisp hardcoded vector SVG
  return (
    <IllustrationBlob size={size} color={color} className={className}>
      {children}
    </IllustrationBlob>
  );
}

export interface IllustrationProps {
  size?: number;
  className?: string;
  imageSrc?: string | null;
}

// ── Email Selection: University & Personal email illustration ────────
export function EmailSelectIllustration({ size, className = '', imageSrc }: IllustrationProps) {
  const svgSize = size ? size * 0.75 : undefined;
  return (
    <PluggableIllustration
      size={size}
      color="#E8F5EE"
      className={className}
      imageSrc={imageSrc}
      configKey="emailSelect"
      alt="Email Selection Illustration"
    >
      <svg
        width={svgSize || '75%'}
        height={svgSize || '75%'}
        viewBox="0 0 150 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[75%] h-[75%] max-w-full max-h-full"
      >
        {/* Background card */}
        <rect x="20" y="32" width="110" height="86" rx="14" fill="#FFFFFF" fillOpacity="0.95" />
        <rect x="20" y="32" width="110" height="86" rx="14" fill="none" stroke="#BBF7D0" strokeWidth="1.5" />

        {/* Envelope base */}
        <rect x="35" y="48" width="80" height="52" rx="8" fill="#1A6B3C" />
        <path d="M35 52 L75 78 L115 52" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {/* University Graduation Cap badge */}
        <circle cx="75" cy="40" r="18" fill="#6EE7B7" />
        <path d="M63 40 L75 34 L87 40 L75 46 Z" fill="#1A6B3C" />
        <path d="M68 43 L68 48 Q75 51 82 48 L82 43" fill="none" stroke="#1A6B3C" strokeWidth="1.5" />
        <line x1="85" y1="41" x2="88" y2="47" stroke="#1A6B3C" strokeWidth="1.2" />

        {/* Verification Check Badge */}
        <circle cx="120" cy="94" r="14" fill="#FBBF24" />
        <path d="M115 94 L118 97 L125 90" stroke="#1A6B3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {/* Sparkles */}
        <circle cx="28" cy="44" r="4" fill="#34D399" />
        <circle cx="126" cy="40" r="3" fill="#6EE7B7" />
      </svg>
    </PluggableIllustration>
  );
}

// ── Step 1: Basic Info — Profile card with user/email/lock ──────────
export function BasicInfoIllustration({ size, className = '', imageSrc }: IllustrationProps) {
  const svgSize = size ? size * 0.75 : undefined;
  return (
    <PluggableIllustration
      size={size}
      color="#E8F5EE"
      className={className}
      imageSrc={imageSrc}
      configKey="basicInfo"
      alt="Basic Info Illustration"
    >
      <svg
        width={svgSize || '75%'}
        height={svgSize || '75%'}
        viewBox="0 0 150 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[75%] h-[75%] max-w-full max-h-full"
      >
        {/* Profile card */}
        <rect x="20" y="30" width="110" height="95" rx="14" fill="#FFFFFF" fillOpacity="0.95" />
        <rect x="20" y="30" width="110" height="95" rx="14" fill="none" stroke="#BBF7D0" strokeWidth="1.5" />

        {/* Avatar circle */}
        <circle cx="75" cy="62" r="18" fill="#6EE7B7" />
        <circle cx="75" cy="57" r="8" fill="#1A6B3C" />
        <path d="M57 78 Q75 70 93 78" fill="#1A6B3C" />

        {/* Name line */}
        <rect x="52" y="87" width="46" height="6" rx="3" fill="#1A6B3C" fillOpacity="0.7" />

        {/* Field rows */}
        <rect x="32" y="101" width="86" height="8" rx="4" fill="#F3F4F6" />
        <circle cx="40" cy="105" r="4" fill="#34D399" />
        <rect x="48" y="103" width="60" height="4" rx="2" fill="#D1D5DB" />

        <rect x="32" y="114" width="86" height="8" rx="4" fill="#F3F4F6" />
        <circle cx="40" cy="118" r="4" fill="#6EE7B7" />
        <rect x="48" y="116" width="50" height="4" rx="2" fill="#D1D5DB" />

        {/* Floating star */}
        <path d="M140 25 L142 30 L148 30 L143 34 L145 40 L140 36 L135 40 L137 34 L132 30 L138 30 Z" fill="#FBBF24" />

        {/* Floating key icon */}
        <circle cx="22" cy="135" r="8" fill="#1A6B3C" fillOpacity="0.85" />
        <rect x="29" y="134" width="12" height="3" rx="1.5" fill="#1A6B3C" />
        <rect x="37" y="134" width="3" height="5" rx="1" fill="#1A6B3C" />

        {/* Floating mail icon */}
        <rect x="118" y="118" width="24" height="16" rx="4" fill="#1A6B3C" fillOpacity="0.9" />
        <path d="M118 122 L130 130 L142 122" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
      </svg>
    </PluggableIllustration>
  );
}

// ── Student ID Upload: ID Card scanner with camera viewfinder ────────
export function IdUploadIllustration({ size, className = '', imageSrc }: IllustrationProps) {
  const svgSize = size ? size * 0.75 : undefined;
  return (
    <PluggableIllustration
      size={size}
      color="#E8F5EE"
      className={className}
      imageSrc={imageSrc}
      configKey="idUpload"
      alt="ID Upload Illustration"
    >
      <svg
        width={svgSize || '75%'}
        height={svgSize || '75%'}
        viewBox="0 0 150 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[75%] h-[75%] max-w-full max-h-full"
      >
        {/* Scanner Viewfinder corners */}
        <path d="M18 35 L18 22 L31 22" stroke="#1A6B3C" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M132 35 L132 22 L119 22" stroke="#1A6B3C" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M18 115 L18 128 L31 128" stroke="#1A6B3C" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M132 115 L132 128 L119 128" stroke="#1A6B3C" strokeWidth="2.5" strokeLinecap="round" fill="none" />

        {/* ID Card */}
        <rect x="28" y="32" width="94" height="86" rx="10" fill="#FFFFFF" />
        <rect x="28" y="32" width="94" height="86" rx="10" fill="none" stroke="#BBF7D0" strokeWidth="1.5" />

        {/* Card Header Stripe */}
        <rect x="28" y="32" width="94" height="18" rx="10" fill="#1A6B3C" />
        <rect x="28" y="44" width="94" height="6" fill="#1A6B3C" />

        {/* Photo Box */}
        <rect x="36" y="58" width="28" height="34" rx="5" fill="#E8F5EE" stroke="#A7F3D0" strokeWidth="1" />
        <circle cx="50" cy="70" r="6" fill="#1A6B3C" />
        <path d="M41 87 Q50 78 59 87" fill="#1A6B3C" />

        {/* Info Lines */}
        <rect x="70" y="60" width="44" height="5" rx="2.5" fill="#1A6B3C" fillOpacity="0.8" />
        <rect x="70" y="70" width="36" height="4" rx="2" fill="#9CA3AF" />
        <rect x="70" y="78" width="40" height="4" rx="2" fill="#9CA3AF" />
        <rect x="70" y="86" width="24" height="4" rx="2" fill="#9CA3AF" />

        {/* Barcode line on bottom of card */}
        <line x1="36" y1="104" x2="114" y2="104" stroke="#D1D5DB" strokeWidth="2" strokeDasharray="3,2" />

        {/* Scan line effect */}
        <line x1="22" y1="75" x2="128" y2="75" stroke="#34D399" strokeWidth="2" strokeDasharray="4,2" opacity="0.8" />

        {/* Security Shield badge */}
        <circle cx="120" cy="40" r="14" fill="#FBBF24" />
        <path d="M116 38 L120 35 L124 38 L124 43 Q120 47 116 43 Z" fill="#1A6B3C" />
      </svg>
    </PluggableIllustration>
  );
}

// ── OTP Verification: Phone + Floating digits ────────────────────────
export function OtpIllustration({ size, className = '', imageSrc }: IllustrationProps) {
  const svgSize = size ? size * 0.75 : undefined;
  return (
    <PluggableIllustration
      size={size}
      color="#E8F5EE"
      className={className}
      imageSrc={imageSrc}
      configKey="otp"
      alt="OTP Verification Illustration"
    >
      <svg
        width={svgSize || '75%'}
        height={svgSize || '75%'}
        viewBox="0 0 150 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[75%] h-[75%] max-w-full max-h-full"
      >
        {/* Phone */}
        <rect x="42" y="20" width="66" height="108" rx="14" fill="#FFFFFF" fillOpacity="0.95" />
        <rect x="42" y="20" width="66" height="108" rx="14" fill="none" stroke="#BBF7D0" strokeWidth="2" />
        <rect x="62" y="25" width="26" height="5" rx="2.5" fill="#6EE7B7" />
        <circle cx="75" cy="122" r="4" fill="#BBF7D0" />

        {/* Screen content */}
        <rect x="52" y="40" width="46" height="28" rx="6" fill="#F0FDF4" />
        {/* Envelope icon on screen */}
        <rect x="60" y="46" width="30" height="20" rx="4" fill="#1A6B3C" fillOpacity="0.85" />
        <path d="M60 50 L75 58 L90 50" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />

        {/* OTP digit boxes */}
        <rect x="50" y="78" width="13" height="16" rx="4" fill="#E8F5EE" stroke="#1A6B3C" strokeWidth="1.5" />
        <rect x="66" y="78" width="13" height="16" rx="4" fill="#E8F5EE" stroke="#1A6B3C" strokeWidth="1.5" />
        <rect x="82" y="78" width="13" height="16" rx="4" fill="#E8F5EE" stroke="#1A6B3C" strokeWidth="1.5" />
        <text x="56" y="90" fontSize="10" fontWeight="bold" fill="#1A6B3C" textAnchor="middle" dominantBaseline="middle">4</text>
        <text x="72" y="90" fontSize="10" fontWeight="bold" fill="#1A6B3C" textAnchor="middle" dominantBaseline="middle">8</text>
        <text x="88" y="90" fontSize="10" fontWeight="bold" fill="#1A6B3C" textAnchor="middle" dominantBaseline="middle">3</text>

        {/* Floating digit bubbles */}
        <circle cx="16" cy="50" r="14" fill="#1A6B3C" fillOpacity="0.9" />
        <text x="16" y="54" fontSize="14" fontWeight="bold" fill="#FFFFFF" textAnchor="middle" dominantBaseline="middle">2</text>

        <circle cx="134" cy="42" r="12" fill="#1A6B3C" fillOpacity="0.9" />
        <text x="134" y="46" fontSize="12" fontWeight="bold" fill="#FFFFFF" textAnchor="middle" dominantBaseline="middle">7</text>

        <circle cx="20" cy="105" r="12" fill="#34D399" />
        <text x="20" y="109" fontSize="12" fontWeight="bold" fill="#FFFFFF" textAnchor="middle" dominantBaseline="middle">5</text>

        <circle cx="132" cy="100" r="14" fill="#FBBF24" />
        <text x="132" y="104" fontSize="14" fontWeight="bold" fill="#1A6B3C" textAnchor="middle" dominantBaseline="middle">9</text>

        {/* Sparkle */}
        <path d="M115 18 L116.5 22 L121 22 L117.5 24.5 L119 28.5 L115 26 L111 28.5 L112.5 24.5 L109 22 L113.5 22 Z" fill="#FBBF24" />

        {/* Check mark circle (sent indicator) */}
        <circle cx="130" cy="68" r="12" fill="#1A6B3C" />
        <path d="M124 68 L128 72 L136 64" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </PluggableIllustration>
  );
}

// ── Step 2: Academic — Graduation cap + campus building ──────────────
export function AcademicIllustration({ size, className = '', imageSrc }: IllustrationProps) {
  const svgSize = size ? size * 0.75 : undefined;
  return (
    <PluggableIllustration
      size={size}
      color="#D1FAE5"
      className={className}
      imageSrc={imageSrc}
      configKey="academic"
      alt="Academic Illustration"
    >
      <svg
        width={svgSize || '75%'}
        height={svgSize || '75%'}
        viewBox="0 0 150 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[75%] h-[75%] max-w-full max-h-full"
      >
        {/* Building */}
        <rect x="30" y="65" width="90" height="70" rx="4" fill="#FFFFFF" fillOpacity="0.9" />
        <rect x="30" y="65" width="90" height="70" rx="4" fill="none" stroke="#6EE7B7" strokeWidth="1.5" />

        {/* Windows */}
        <rect x="42" y="78" width="16" height="16" rx="3" fill="#A7F3D0" />
        <rect x="67" y="78" width="16" height="16" rx="3" fill="#A7F3D0" />
        <rect x="92" y="78" width="16" height="16" rx="3" fill="#A7F3D0" />

        <rect x="42" y="100" width="16" height="14" rx="3" fill="#A7F3D0" />
        <rect x="92" y="100" width="16" height="14" rx="3" fill="#A7F3D0" />

        {/* Door */}
        <rect x="64" y="100" width="22" height="35" rx="4" fill="#1A6B3C" fillOpacity="0.8" />
        <circle cx="82" cy="119" r="2" fill="#FFFFFF" />

        {/* Pillars */}
        <rect x="55" y="60" width="6" height="10" rx="2" fill="#1A6B3C" />
        <rect x="89" y="60" width="6" height="10" rx="2" fill="#1A6B3C" />

        {/* Graduation cap */}
        <path d="M75 20 L110 32 L75 44 L40 32 Z" fill="#1A6B3C" />
        <rect x="103" y="32" width="4" height="18" rx="2" fill="#1A6B3C" />
        <circle cx="105" cy="52" r="5" fill="#FBBF24" />
        {/* Cap top */}
        <path d="M57 36 L57 50 Q75 57 93 50 L93 36" fill="#1A6B3C" fillOpacity="0.7" />

        {/* Floating star */}
        <path d="M138 55 L140 60 L145 60 L141 63 L143 68 L138 65 L133 68 L135 63 L131 60 L136 60 Z" fill="#FBBF24" />
        {/* Small dots */}
        <circle cx="20" cy="80" r="5" fill="#6EE7B7" fillOpacity="0.7" />
        <circle cx="25" cy="68" r="3" fill="#A7F3D0" />
      </svg>
    </PluggableIllustration>
  );
}

// ── Step 3: Interests — Floating colored interest tags ───────────────
export function InterestsIllustration({ size, className = '', imageSrc }: IllustrationProps) {
  const svgSize = size ? size * 0.75 : undefined;
  return (
    <PluggableIllustration
      size={size}
      color="#FEF3C7"
      className={className}
      imageSrc={imageSrc}
      configKey="interests"
      alt="Interests Illustration"
    >
      <svg
        width={svgSize || '75%'}
        height={svgSize || '75%'}
        viewBox="0 0 150 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[75%] h-[75%] max-w-full max-h-full"
      >
        {/* Center person */}
        <circle cx="75" cy="85" r="18" fill="#FBBF24" fillOpacity="0.3" />
        <circle cx="75" cy="79" r="11" fill="#D97706" />
        <path d="M57 98 Q75 90 93 98 L93 112 Q75 108 57 112 Z" fill="#D97706" />

        {/* Tag: 🎵 Music */}
        <rect x="8" y="18" width="38" height="18" rx="9" fill="#1A6B3C" />
        <text x="27" y="31" fontSize="11" fill="#FFFFFF" textAnchor="middle">🎵</text>

        {/* Tag: 🏀 Sports */}
        <rect x="104" y="18" width="40" height="18" rx="9" fill="#1A6B3C" />
        <text x="124" y="31" fontSize="11" fill="#FFFFFF" textAnchor="middle">🏀</text>

        {/* Tag: 💻 Tech */}
        <rect x="8" y="58" width="36" height="18" rx="9" fill="#2563EB" />
        <text x="26" y="71" fontSize="11" fill="#FFFFFF" textAnchor="middle">💻</text>

        {/* Tag: 📷 Photo */}
        <rect x="106" y="58" width="38" height="18" rx="9" fill="#DB2777" />
        <text x="125" y="71" fontSize="11" fill="#FFFFFF" textAnchor="middle">📷</text>

        {/* Tag: 📚 Reading */}
        <rect x="18" y="110" width="40" height="18" rx="9" fill="#0891B2" />
        <text x="38" y="123" fontSize="11" fill="#FFFFFF" textAnchor="middle">📚</text>

        {/* Tag: 🎨 Arts */}
        <rect x="94" y="110" width="38" height="18" rx="9" fill="#EA580C" />
        <text x="113" y="123" fontSize="11" fill="#FFFFFF" textAnchor="middle">🎨</text>

        {/* Connecting lines */}
        <line x1="46" y1="27" x2="60" y2="78" stroke="#BBF7D0" strokeWidth="1.5" strokeDasharray="3,2" />
        <line x1="104" y1="27" x2="90" y2="78" stroke="#D1FAE5" strokeWidth="1.5" strokeDasharray="3,2" />
        <line x1="44" y1="67" x2="60" y2="82" stroke="#DBEAFE" strokeWidth="1.5" strokeDasharray="3,2" />
        <line x1="106" y1="67" x2="90" y2="82" stroke="#FCE7F3" strokeWidth="1.5" strokeDasharray="3,2" />
        <line x1="58" y1="110" x2="68" y2="98" stroke="#CFFAFE" strokeWidth="1.5" strokeDasharray="3,2" />
        <line x1="94" y1="110" x2="82" y2="98" stroke="#FFEDD5" strokeWidth="1.5" strokeDasharray="3,2" />
      </svg>
    </PluggableIllustration>
  );
}

// ── Step 4: Avatar & Bio — Emoji floating palette ────────────────────
export function AvatarIllustration({ size, className = '', imageSrc }: IllustrationProps) {
  const svgSize = size ? size * 0.75 : undefined;
  return (
    <PluggableIllustration
      size={size}
      color="#FCE7F3"
      className={className}
      imageSrc={imageSrc}
      configKey="avatar"
      alt="Avatar and Bio Illustration"
    >
      <svg
        width={svgSize || '75%'}
        height={svgSize || '75%'}
        viewBox="0 0 150 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[75%] h-[75%] max-w-full max-h-full"
      >
        {/* Large center phone */}
        <rect x="48" y="25" width="54" height="96" rx="12" fill="#FFFFFF" fillOpacity="0.95" />
        <rect x="48" y="25" width="54" height="96" rx="12" fill="none" stroke="#FBCFE8" strokeWidth="1.5" />
        {/* Phone camera notch */}
        <rect x="68" y="29" width="14" height="4" rx="2" fill="#F9A8D4" />
        {/* Avatar on phone */}
        <circle cx="75" cy="65" r="22" fill="#FDF2F8" />
        <circle cx="75" cy="65" r="22" fill="none" stroke="#F9A8D4" strokeWidth="1.5" />
        <text x="75" y="73" fontSize="24" textAnchor="middle">😊</text>
        {/* Bio lines */}
        <rect x="58" y="94" width="34" height="5" rx="2.5" fill="#F9A8D4" />
        <rect x="62" y="103" width="26" height="4" rx="2" fill="#FBCFE8" />

        {/* Floating emoji circles */}
        <circle cx="22" cy="40" r="16" fill="#FFF7ED" />
        <text x="22" y="47" fontSize="16" textAnchor="middle">😎</text>

        <circle cx="128" cy="35" r="14" fill="#ECFDF5" />
        <text x="128" y="41" fontSize="14" textAnchor="middle">🤓</text>

        <circle cx="20" cy="100" r="14" fill="#EEF2FF" />
        <text x="20" y="106" fontSize="14" textAnchor="middle">🦊</text>

        <circle cx="130" cy="95" r="16" fill="#FEF3C7" />
        <text x="130" y="102" fontSize="16" textAnchor="middle">🤖</text>

        <circle cx="25" cy="135" r="12" fill="#F0FDF4" />
        <text x="25" y="141" fontSize="13" textAnchor="middle">🐱</text>

        <circle cx="125" cy="132" r="12" fill="#FFF0F6" />
        <text x="125" y="138" fontSize="13" textAnchor="middle">🦄</text>

        {/* Sparkle */}
        <path d="M112 18 L113.5 22 L118 22 L114.5 24.5 L116 28.5 L112 26 L108 28.5 L109.5 24.5 L106 22 L110.5 22 Z" fill="#FBBF24" />
      </svg>
    </PluggableIllustration>
  );
}

// ── Unified Onboarding Step Illustration Component ──────────────────

export type OnboardingIllustrationType =
  | 'email-select'
  | 'emailSelect'
  | 'basic-info'
  | 'basicInfo'
  | 'academic'
  | 'interests'
  | 'avatar'
  | 'id-upload'
  | 'idUpload'
  | 'otp'
  | 1
  | 2
  | 3
  | 4;

export function OnboardingStepIllustration({
  step,
  size = 200,
  className = '',
  imageSrc,
}: {
  step: OnboardingIllustrationType;
  size?: number;
  className?: string;
  imageSrc?: string | null;
}) {
  switch (step) {
    case 'email-select':
    case 'emailSelect':
      return <EmailSelectIllustration size={size} className={className} imageSrc={imageSrc} />;
    case 'basic-info':
    case 'basicInfo':
    case 1:
      return <BasicInfoIllustration size={size} className={className} imageSrc={imageSrc} />;
    case 'academic':
    case 2:
      return <AcademicIllustration size={size} className={className} imageSrc={imageSrc} />;
    case 'interests':
    case 3:
      return <InterestsIllustration size={size} className={className} imageSrc={imageSrc} />;
    case 'avatar':
    case 4:
      return <AvatarIllustration size={size} className={className} imageSrc={imageSrc} />;
    case 'id-upload':
    case 'idUpload':
      return <IdUploadIllustration size={size} className={className} imageSrc={imageSrc} />;
    case 'otp':
      return <OtpIllustration size={size} className={className} imageSrc={imageSrc} />;
    default:
      return <BasicInfoIllustration size={size} className={className} imageSrc={imageSrc} />;
  }
}
